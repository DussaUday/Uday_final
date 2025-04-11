import React, { useState, useEffect, useRef } from "react";
import { useSocketContext } from "../../context/SocketContext";
import { toast } from "react-hot-toast";
import { BsTrash, BsHeart, BsChat, BsHeartFill, BsThreeDotsVertical } from "react-icons/bs";
import { FiUserPlus, FiUserCheck } from "react-icons/fi";

const SendFollowRequest = ({ userId, userName, profilePic }) => {
    const { socket } = useSocketContext();
    const [loading, setLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [hasSentRequest, setHasSentRequest] = useState(false);
    const [userPosts, setUserPosts] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null);       
    const [comment, setComment] = useState("");
    const [showPostOptions, setShowPostOptions] = useState(false);
    const modalRef = useRef(null);
    const optionsRef = useRef(null);

    useEffect(() => {
        const checkFollowStatus = async () => {
            try {
                const response = await fetch(`/api/users/${userId}/follow-status`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });

                const data = await response.json();
                if (response.ok) {
                    setIsFollowing(data.isFollowing);
                    setHasSentRequest(data.hasSentRequest);
                } else {
                    toast.error(data.error);
                }
            } catch (error) {
                toast.error("Error checking follow status");
            }
        };

        checkFollowStatus();
    }, [userId]);

    useEffect(() => {
        const fetchUserPosts = async () => {
            if (isFollowing) {
                try {
                    const response = await fetch(`/api/users/${userId}/posts`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    });

                    if (!response.ok) {
                        throw new Error("Failed to fetch posts");
                    }

                    const data = await response.json();
                    setUserPosts(data.posts || []);
                } catch (error) {
                    console.error("Error fetching user posts:", error);
                    toast.error("Error fetching user posts");
                    setUserPosts([]);
                }
            }
        };

        fetchUserPosts();
    }, [isFollowing, userId]);

    const handleSendFollowRequest = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/users/follow/${userId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                socket.emit("sendFollowRequest", { 
                    senderId: localStorage.getItem("userId"), 
                    receiverId: userId 
                });
                setHasSentRequest(true);
                setIsFollowing(true);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error sending follow request");
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (postId) => {
        try {
            const response = await fetch(`/api/posts/like/${postId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const data = await response.json();
            if (response.ok) {
                setUserPosts((prevPosts) =>
                    prevPosts.map((post) =>
                        post._id === postId
                            ? { ...post, likes: data.likes }
                            : post
                    )
                );
                
                // Update selected post if it's the one being liked
                if (selectedPost && selectedPost._id === postId) {
                    setSelectedPost({ ...selectedPost, likes: data.likes });
                }
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error liking post");
        }
    };

    const handleComment = async (postId) => {
        if (!comment) return;
        try {
            const response = await fetch(`/api/posts/comment/${postId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ comment }),
            });

            const data = await response.json();
            if (response.ok) {
                setUserPosts((prevPosts) =>
                    prevPosts.map((post) =>
                        post._id === postId
                            ? { ...post, comments: data.comments }
                            : post
                    )
                );
                
                // Update selected post if it's the one being commented on
                if (selectedPost && selectedPost._id === postId) {
                    setSelectedPost({ ...selectedPost, comments: data.comments });
                }
                setComment("");
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error commenting on post");
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            const response = await fetch(`/api/posts/delete/${postId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const data = await response.json();
            if (response.ok) {
                setUserPosts((prevPosts) =>
                    prevPosts.filter((post) => post._id !== postId)
                );
                setSelectedPost(null);
                toast.success(data.message);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error deleting post");
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setSelectedPost(null);
            }
            if (optionsRef.current && !optionsRef.current.contains(event.target)) {
                setShowPostOptions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 w-full">
            {/* Profile Header */}
            <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                    <img
                        src={profilePic}
                        alt={userName}
                        className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    {isFollowing && (
                        <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-1 text-white">
                            <FiUserCheck className="text-lg" />
                        </div>
                    )}
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">{userName}</h2>
                <p className="text-gray-500 mb-4 text-sm md:text-base">@{userId}</p>
                
                {/* Follow Button */}
                {isFollowing ? (
                    <button 
                        className="flex items-center justify-center px-4 md:px-6 py-1 md:py-2 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors duration-200 text-sm md:text-base"
                        disabled
                    >
                        <FiUserCheck className="mr-2" />
                        Following
                    </button>
                ) : (
                    <button
                        onClick={handleSendFollowRequest}
                        disabled={loading || hasSentRequest}
                        className={`flex items-center justify-center px-4 md:px-6 py-1 md:py-2 rounded-full font-medium transition-colors duration-200 text-sm md:text-base ${
                            loading || hasSentRequest
                                ? "bg-blue-300 text-white cursor-not-allowed"
                                : "bg-blue-500 hover:bg-blue-600 text-white"
                        }`}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : hasSentRequest ? (
                            "Request Sent"
                        ) : (
                            <>
                                <FiUserPlus className="mr-2" />
                                Follow
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Display User Posts if Following */}
            {isFollowing && (
                <div>
                    <div className="flex justify-between items-center mb-4 md:mb-6">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-800">Posts</h3>
                        <div className="text-gray-500 text-sm md:text-base">
                            {userPosts.length} {userPosts.length === 1 ? "post" : "posts"}
                        </div>
                    </div>

                    {userPosts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {userPosts.map((post) => (
                                <div
                                    key={post._id}
                                    className="relative group cursor-pointer aspect-square"
                                    onClick={() => setSelectedPost(post)}
                                >
                                    {post.media?.endsWith(".mp4") || post.media?.endsWith(".mov") ? (
                                        <video
                                            src={post.media}
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                    ) : (
                                        <img
                                            src={post.media}
                                            alt="Post"
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                                        <div className="flex space-x-3 md:space-x-4 text-white">
                                            <div className="flex items-center text-sm md:text-base">
                                                <BsHeartFill className="mr-1" />
                                                <span>{post.likes?.length || 0}</span>
                                            </div>
                                            <div className="flex items-center text-sm md:text-base">
                                                <BsChat className="mr-1" />
                                                <span>{post.comments?.length || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 md:py-12">
                            <div className="text-gray-300 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 md:h-16 w-12 md:w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h4 className="text-base md:text-lg font-medium text-gray-700">No Posts Yet</h4>
                            <p className="text-gray-500 mt-1 text-sm md:text-base">When {userName} shares photos or videos, they'll appear here</p>
                        </div>
                    )}

                    {/* Post Modal */}
                    {selectedPost && (
                        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-2 md:p-4 z-50">
                            <div ref={modalRef} className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                                {/* Modal Header */}
                                <div className="flex items-center justify-between p-3 md:p-4 border-b">
                                    <div className="flex items-center">
                                        <img
                                            src={selectedPost.userId.profilePic}
                                            alt={selectedPost.userId.username}
                                            className="w-8 md:w-10 h-8 md:h-10 rounded-full mr-2 md:mr-3"
                                        />
                                        <span className="font-semibold text-sm md:text-base">{selectedPost.userId.username}</span>
                                    </div>
                                    <div className="relative">
                                        <button 
                                            className="text-gray-500 hover:text-gray-700 p-1"
                                            onClick={() => setShowPostOptions(!showPostOptions)}
                                        >
                                            <BsThreeDotsVertical />
                                        </button>
                                        {showPostOptions && (
                                            <div 
                                                ref={optionsRef}
                                                className="absolute right-0 mt-2 w-40 md:w-48 bg-white rounded-md shadow-lg py-1 z-10"
                                            >
                                                <button
                                                    className="flex items-center px-3 md:px-4 py-2 text-red-500 hover:bg-gray-100 w-full text-left text-sm md:text-base"
                                                    onClick={() => {
                                                        handleDeletePost(selectedPost._id);
                                                        setShowPostOptions(false);
                                                    }}
                                                >
                                                    <BsTrash className="mr-2" />
                                                    Delete Post
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Modal Content */}
                                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                                    {/* Media Section */}
                                    <div className="md:w-2/3 bg-black flex items-center justify-center">
                                        {selectedPost.media?.endsWith(".mp4") || selectedPost.media?.endsWith(".mov") ? (
                                            <video
                                                src={selectedPost.media}
                                                controls
                                                className="max-h-[60vh] md:max-h-[70vh] w-full object-contain"
                                            />
                                        ) : (
                                            <img
                                                src={selectedPost.media}
                                                alt="Post"
                                                className="max-h-[60vh] md:max-h-[70vh] w-full object-contain"
                                            />
                                        )}
                                    </div>
                                    
                                    {/* Details Section */}
                                    <div className="md:w-1/3 flex flex-col border-t md:border-t-0 md:border-l">
                                        {/* Caption */}
                                        <div className="p-3 md:p-4 border-b">
                                            <div className="flex items-center mb-2 md:mb-3">
                                                <img
                                                    src={selectedPost.userId.profilePic}
                                                    alt={selectedPost.userId.username}
                                                    className="w-6 md:w-8 h-6 md:h-8 rounded-full mr-2"
                                                />
                                                <span className="font-semibold text-sm md:text-base">{selectedPost.userId.username}</span>
                                            </div>
                                            <p className="text-gray-800 text-sm md:text-base">{selectedPost.caption}</p>
                                        </div>
                                        
                                        {/* Comments */}
                                        <div className="flex-1 overflow-y-auto p-3 md:p-4">
                                            <h4 className="font-semibold text-gray-700 mb-3 md:mb-4 text-sm md:text-base">Comments ({selectedPost.comments?.length || 0})</h4>
                                            {selectedPost.comments?.length > 0 ? (
                                                <div className="space-y-3 md:space-y-4">
                                                    {selectedPost.comments.map((comment, index) => (
                                                        <div key={index} className="flex">
                                                            <img
                                                                src={comment.userId.profilePic}
                                                                alt={comment.userId.username}
                                                                className="w-6 md:w-8 h-6 md:h-8 rounded-full mr-2 md:mr-3"
                                                            />
                                                            <div>
                                                                <p className="font-semibold text-xs md:text-sm">{comment.userId.username}</p>
                                                                <p className="text-gray-700 text-xs md:text-sm">{comment.comment}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-center py-6 md:py-8 text-sm md:text-base">No comments yet</p>
                                            )}
                                        </div>
                                        
                                        {/* Actions */}
                                        <div className="p-3 md:p-4 border-t">
                                            <div className="flex items-center space-x-3 md:space-x-4 mb-3 md:mb-4">
                                                <button
                                                    className={`text-lg md:text-xl ${selectedPost.likes?.includes(localStorage.getItem("userId")) ? "text-red-500" : "text-gray-700"}`}
                                                    onClick={() => handleLike(selectedPost._id)}
                                                >
                                                    {selectedPost.likes?.includes(localStorage.getItem("userId")) ? (
                                                        <BsHeartFill />
                                                    ) : (
                                                        <BsHeart />
                                                    )}
                                                </button>
                                                <button className="text-lg md:text-xl text-gray-700">
                                                    <BsChat />
                                                </button>
                                            </div>
                                            <p className="font-semibold text-xs md:text-sm mb-1 md:mb-2">
                                                {selectedPost.likes?.length || 0} {selectedPost.likes?.length === 1 ? "like" : "likes"}
                                            </p>
                                            
                                            {/* Add Comment */}
                                            <div className="flex mt-3 md:mt-4">
                                                <input
                                                    type="text"
                                                    className="flex-1 p-1 md:p-2 border border-gray-300 rounded-l-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                                                    placeholder="Add a comment..."
                                                    value={comment}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    onKeyPress={(e) => e.key === "Enter" && handleComment(selectedPost._id)}
                                                />
                                                <button
                                                    className={`px-3 md:px-4 py-1 md:py-2 rounded-r-lg text-sm md:text-base ${comment ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                                                    onClick={() => handleComment(selectedPost._id)}
                                                    disabled={!comment}
                                                >
                                                    Post
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SendFollowRequest;