import { useState, useEffect } from "react";
import useProfile from "../../hooks/useProfile";
import useDeleteAccount from "../../hooks/useDeleteAccount";
import { useSocketContext } from "../../context/SocketContext";
import { toast } from "react-hot-toast";
import { 
  FiEdit, 
  FiUser, 
  FiUsers, 
  FiX, 
  FiTrash2, 
  FiCheck, 
  FiXCircle, 
  FiUserPlus, 
  FiUserCheck,
  FiUserX
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const ProfilePage = ({ userId, onNewFollowRequest }) => {
    const { profile, loading: profileLoading, refetch } = useProfile(userId);
    const { deleteAccount, loading: deleteLoading } = useDeleteAccount();
    const { socket } = useSocketContext();

    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationText, setConfirmationText] = useState("");
    const [followRequests, setFollowRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [followersDetails, setFollowersDetails] = useState([]);
    const [followingDetails, setFollowingDetails] = useState([]);
    const [followRequestsDetails, setFollowRequestsDetails] = useState([]);
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editProfileData, setEditProfileData] = useState({
        username: "",
        password: "",
        confirmPassword: "",
        profilePic: null,
    });
    const [previewUrl, setPreviewUrl] = useState("");

    useEffect(() => {
        if (profile) {
            setFollowRequests(profile.followRequests || []);
            fetchUserDetails(profile.followers, setFollowersDetails);
            fetchUserDetails(profile.following, setFollowingDetails);
            fetchUserDetails(profile.followRequests, setFollowRequestsDetails);
        }
    }, [profile]);

    useEffect(() => {
        if (socket) {
            socket.on("newFollowRequest", (data) => {
                if (data.receiverId === userId) {
                    if (onNewFollowRequest) {
                        onNewFollowRequest();
                    }
                }
            });
        }

        return () => {
            if (socket) {
                socket.off("newFollowRequest");
            }
        };
    }, [socket, userId, onNewFollowRequest]);

    const fetchUserDetails = async (userIds, setUserDetails) => {
        try {
            const uniqueUserIds = [...new Set(userIds)];
            const details = await Promise.all(
                uniqueUserIds.map(async (id) => {
                    const response = await fetch(`/api/users/${id}`);
                    if (!response.ok) {
                        return null;
                    }
                    const data = await response.json();
                    return data;
                })
            );
            setUserDetails(details.filter(user => user !== null));
        } catch (error) {
            console.error("Failed to fetch user details:", error);
        }
    };

    const handleAcceptFollowRequest = async (requestUserId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/users/accept-follow/${requestUserId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                socket.emit("acceptFollowRequest", { senderId: requestUserId, receiverId: userId });
                setFollowRequests(followRequests.filter(id => id !== requestUserId));
                setFollowRequestsDetails(followRequestsDetails.filter(user => user._id !== requestUserId));
                if (onNewFollowRequest) {
                    onNewFollowRequest(-1);
                }
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error accepting follow request");
        } finally {
            setLoading(false);
        }
    };

    const handleRejectFollowRequest = async (requestUserId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/users/reject-follow/${requestUserId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                socket.emit("rejectFollowRequest", { senderId: requestUserId, receiverId: userId });
                setFollowRequests(followRequests.filter(id => id !== requestUserId));
                setFollowRequestsDetails(followRequestsDetails.filter(user => user._id !== requestUserId));
                if (onNewFollowRequest) {
                    onNewFollowRequest(-1);
                }
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error rejecting follow request");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmDelete = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
        if (confirmDelete) {
            await deleteAccount();
        }
    };

    const handleUnfollow = async (userIdToUnfollow) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/users/unfollow/${userIdToUnfollow}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                setFollowingDetails(prevFollowingDetails =>
                    prevFollowingDetails.filter(user => user._id !== userIdToUnfollow)
                );
                socket.emit("unfollowUser", { senderId: userId, receiverId: userIdToUnfollow });
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error unfollowing user");
        } finally {
            setLoading(false);
        }
    };

    const handleFollowBack = async (userIdToFollow) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/users/follow/${userIdToFollow}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                socket.emit("sendFollowRequest", { senderId: localStorage.getItem("userId"), receiverId: userIdToFollow });
                setSuggestions(prev => prev.filter(id => id !== userIdToFollow));
                setFollowingDetails(prev => [...prev, { _id: userIdToFollow }]);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error following user");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveSuggestion = (userIdToRemove) => {
        setSuggestions(prev => prev.filter(id => id !== userIdToRemove));
    };

    const handleEditProfile = () => {
        setShowEditProfile(true);
        setEditProfileData({
            username: profile.username,
            password: "",
            confirmPassword: "",
            profilePic: null,
        });
        setPreviewUrl(profile.profilePic);
    };

    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditProfileData(prev => ({ ...prev, profilePic: file }));
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleEditProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append("username", editProfileData.username);
        formData.append("password", editProfileData.password);
        formData.append("confirmPassword", editProfileData.confirmPassword);
        if (editProfileData.profilePic) {
            formData.append("profilePic", editProfileData.profilePic);
        }

        try {
            const response = await fetch(`/api/auth/edit-profile/${userId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                refetch();
                setShowEditProfile(false);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error updating profile");
        } finally {
            setLoading(false);
        }
    };

    // Animation variants
    const modalVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
    };

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            {/* Main Profile Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto border border-gray-700"
            >
                {/* Profile Header with Gradient Background */}
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 p-6 md:p-8 text-center">
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                    
                    {/* Edit Profile Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleEditProfile}
                        className="absolute top-4 right-4 bg-white/90 hover:bg-white text-indigo-600 p-2 rounded-full shadow-md transition-all duration-200 z-10"
                        aria-label="Edit profile"
                    >
                        <FiEdit className="w-5 h-5" />
                    </motion.button>
                    
                    {/* Profile Picture */}
                    <div className="relative inline-block z-10">
                        <motion.div 
                            whileHover={{ scale: 1.03 }}
                            className="relative group"
                        >
                            <img
                                src={profile?.profilePic || "/default-avatar.png"}
                                alt={`${profile?.username}'s profile`}
                                className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/80 shadow-lg mx-auto object-cover transition-all duration-300 group-hover:border-indigo-200"
                            />
                            <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                                <FiEdit className="text-white w-6 h-6" />
                            </div>
                        </motion.div>
                    </div>
                    
                    {/* User Info */}
                    <div className="relative z-10 mt-4">
                        <motion.h1 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-2xl md:text-3xl font-bold text-white"
                        >
                            {profile?.fullName}
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="text-blue-100 mt-1"
                        >
                            @{profile?.username}
                        </motion.p>
                    </div>
                    
                    {/* Stats Bar */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex justify-center mt-6 space-x-8 relative z-10"
                    >
                        <motion.button 
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowFollowers(true)}
                            className="flex flex-col items-center text-white hover:text-blue-200 transition-all"
                        >
                            <span className="text-xl font-bold">{followersDetails.length}</span>
                            <span className="text-sm">Followers</span>
                        </motion.button>
                        <motion.button 
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowFollowing(true)}
                            className="flex flex-col items-center text-white hover:text-blue-200 transition-all"
                        >
                            <span className="text-xl font-bold">{followingDetails.length}</span>
                            <span className="text-sm">Following</span>
                        </motion.button>
                    </motion.div>
                </div>

                {/* Follow Requests Section */}
                {followRequestsDetails.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="p-6 border-b border-gray-700"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white flex items-center">
                                <FiUserPlus className="text-indigo-300 mr-2" />
                                Follow Requests ({followRequestsDetails.length})
                            </h2>
                        </div>
                        
                        <div className="space-y-3">
                            {followRequestsDetails.map((requestUser, index) => (
                                <motion.div 
                                    key={requestUser._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                    className="flex items-center justify-between p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors"
                                >
                                    <div className="flex items-center">
                                        <img
                                            src={requestUser.profilePic || "/default-avatar.png"}
                                            alt={requestUser.fullName}
                                            className="w-10 h-10 rounded-full mr-3 object-cover border border-gray-600"
                                        />
                                        <div>
                                            <p className="font-medium text-white">{requestUser.fullName}</p>
                                            <p className="text-sm text-gray-400">@{requestUser.username}</p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        {suggestions.includes(requestUser._id) ? (
                                            <>
                                                <motion.button
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={() => handleFollowBack(requestUser._id)}
                                                    className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center shadow-sm"
                                                    disabled={loading}
                                                >
                                                    <FiUserCheck className="mr-1" />
                                                    Follow
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleRemoveSuggestion(requestUser._id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-600"
                                                >
                                                    <FiX className="w-4 h-4" />
                                                </motion.button>
                                            </>
                                        ) : (
                                            <>
                                                <motion.button
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={() => handleAcceptFollowRequest(requestUser._id)}
                                                    className="px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm flex items-center shadow-sm"
                                                    disabled={loading}
                                                >
                                                    {loading ? (
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    ) : (
                                                        <FiCheck className="mr-1" />
                                                    )}
                                                    Accept
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={() => handleRejectFollowRequest(requestUser._id)}
                                                    className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center shadow-sm"
                                                    disabled={loading}
                                                >
                                                    <FiXCircle className="mr-1" />
                                                    Reject
                                                </motion.button>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Account Actions */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6"
                >
                    <h2 className="text-lg font-semibold text-white mb-4">Account Settings</h2>
                    
                    {!showConfirmation ? (
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setShowConfirmation(true)}
                            className="flex items-center justify-center w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                        >
                            <FiTrash2 className="mr-2" />
                            Delete Account
                        </motion.button>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4 overflow-hidden"
                        >
                            <p className="text-sm text-gray-400">Type "DELETE" to confirm account deletion. This action cannot be undone.</p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="text"
                                    placeholder="Type 'DELETE'"
                                    value={confirmationText}
                                    onChange={(e) => setConfirmationText(e.target.value)}
                                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white transition-all"
                                />
                                {confirmationText === "DELETE" && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleDeleteAccount}
                                        disabled={deleteLoading}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center shadow-sm"
                                    >
                                        {deleteLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Deleting...
                                            </>
                                        ) : 'Confirm Delete'}
                                    </motion.button>
                                )}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowConfirmation(false)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors shadow-sm"
                                >
                                    Cancel
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {showEditProfile && (
                    <>
                        <motion.div
                            variants={backdropVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            onClick={() => setShowEditProfile(false)}
                        />
                        
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none"
                        >
                            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto pointer-events-auto">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
                                        <motion.button 
                                            whileHover={{ rotate: 90 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setShowEditProfile(false)}
                                            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700"
                                        >
                                            <FiX className="w-6 h-6" />
                                        </motion.button>
                                    </div>
                                    
                                    <form onSubmit={handleEditProfileSubmit} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Profile Picture</label>
                                            <div className="flex flex-col items-center">
                                                <div className="relative mb-4 group">
                                                    <img 
                                                        src={previewUrl || "/default-avatar.png"} 
                                                        alt="Profile preview" 
                                                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-700 shadow-md transition-all duration-300 group-hover:border-indigo-400"
                                                    />
                                                    <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                                                        <FiEdit className="text-white w-6 h-6" />
                                                    </div>
                                                </div>
                                                <motion.label 
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    className="cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                                                >
                                                    Change Photo
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleProfilePicChange}
                                                        className="hidden"
                                                    />
                                                </motion.label>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                                            <input
                                                type="text"
                                                value={editProfileData.username}
                                                onChange={(e) => setEditProfileData(prev => ({ ...prev, username: e.target.value }))}
                                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white transition-all"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                                            <input
                                                type="password"
                                                value={editProfileData.password}
                                                onChange={(e) => setEditProfileData(prev => ({ ...prev, password: e.target.value }))}
                                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white transition-all"
                                                placeholder="Leave blank to keep current"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                                            <input
                                                type="password"
                                                value={editProfileData.confirmPassword}
                                                onChange={(e) => setEditProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white transition-all"
                                                placeholder="Leave blank to keep current"
                                            />
                                        </div>
                                        
                                        <div className="flex justify-end space-x-3 pt-4">
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => setShowEditProfile(false)}
                                                className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors shadow-sm"
                                            >
                                                Cancel
                                            </motion.button>
                                            <motion.button
                                                type="submit"
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                disabled={loading}
                                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center min-w-[120px] shadow-sm"
                                            >
                                                {loading ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Saving...
                                                    </>
                                                ) : 'Save Changes'}
                                            </motion.button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Followers Modal */}
            <AnimatePresence>
                {showFollowers && (
                    <>
                        <motion.div
                            variants={backdropVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            onClick={() => setShowFollowers(false)}
                        />
                        
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none"
                        >
                            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col pointer-events-auto">
                                <div className="p-6 border-b border-gray-700">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-2xl font-bold text-white">Followers</h2>
                                        <motion.button 
                                            whileHover={{ rotate: 90 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setShowFollowers(false)}
                                            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700"
                                        >
                                            <FiX className="w-6 h-6" />
                                        </motion.button>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-4">
                                    {followersDetails.length > 0 ? (
                                        <div className="space-y-3">
                                            {followersDetails.map((follower, index) => (
                                                <motion.div 
                                                    key={follower._id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="flex items-center justify-between p-3 hover:bg-gray-700 rounded-xl transition-colors"
                                                >
                                                    <div className="flex items-center">
                                                        <img
                                                            src={follower.profilePic || "/default-avatar.png"}
                                                            alt={follower.fullName}
                                                            className="w-10 h-10 rounded-full mr-3 object-cover border border-gray-600"
                                                        />
                                                        <div>
                                                            <p className="font-medium text-white">{follower.fullName}</p>
                                                            <p className="text-sm text-gray-400">@{follower.username}</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex flex-col items-center justify-center h-full text-center py-8"
                                        >
                                            <FiUsers className="w-12 h-12 text-gray-500 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-300">No followers yet</h3>
                                            <p className="text-gray-500 mt-1">When someone follows you, they'll appear here</p>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Following Modal */}
            <AnimatePresence>
                {showFollowing && (
                    <>
                        <motion.div
                            variants={backdropVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            onClick={() => setShowFollowing(false)}
                        />
                        
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none"
                        >
                            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col pointer-events-auto">
                                <div className="p-6 border-b border-gray-700">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-2xl font-bold text-white">Following</h2>
                                        <motion.button 
                                            whileHover={{ rotate: 90 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setShowFollowing(false)}
                                            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700"
                                        >
                                            <FiX className="w-6 h-6" />
                                        </motion.button>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-4">
                                    {followingDetails.length > 0 ? (
                                        <div className="space-y-3">
                                            {followingDetails.map((following, index) => (
                                                <motion.div 
                                                    key={following._id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="flex items-center justify-between p-3 hover:bg-gray-700 rounded-xl transition-colors"
                                                >
                                                    <div className="flex items-center">
                                                        <img
                                                            src={following.profilePic || "/default-avatar.png"}
                                                            alt={following.fullName}
                                                            className="w-10 h-10 rounded-full mr-3 object-cover border border-gray-600"
                                                        />
                                                        <div>
                                                            <p className="font-medium text-white">{following.fullName}</p>
                                                            <p className="text-sm text-gray-400">@{following.username}</p>
                                                        </div>
                                                    </div>
                                                    <motion.button
                                                        whileHover={{ scale: 1.03 }}
                                                        whileTap={{ scale: 0.97 }}
                                                        onClick={() => handleUnfollow(following._id)}
                                                        className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center shadow-sm"
                                                        disabled={loading}
                                                    >
                                                        {loading ? (
                                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                        ) : (
                                                            <FiUserX className="mr-1" />
                                                        )}
                                                        Unfollow
                                                    </motion.button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex flex-col items-center justify-center h-full text-center py-8"
                                        >
                                            <FiUser className="w-12 h-12 text-gray-500 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-300">Not following anyone yet</h3>
                                            <p className="text-gray-500 mt-1">When you follow someone, they'll appear here</p>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfilePage;