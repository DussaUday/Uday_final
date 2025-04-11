import { useParams, useNavigate } from "react-router-dom";
import useProfile from "../../hooks/useProfile";
import { useAuthContext } from "../../context/AuthContext"; // Adjusted import path
import useDeleteAccount from "../../hooks/useDeleteAccount"; // Assuming you have a custom hook for deleting an account

const Profile = () => {
    const { userId } = useParams();
    const { profile, loading: profileLoading } = useProfile(userId);
    const navigate = useNavigate();
    const { deleteAccount, loading: deleteLoading } = useDeleteAccount();
    const { authUser } = useAuthContext();

    if (profileLoading) return <p className="text-center mt-4">Loading...</p>;
    if (!profile) return <p className="text-center mt-4">User not found</p>;

    const handleDeleteAccount = async () => {
        const confirmDelete = window.confirm("Are you sure you want to delete your account?");
        if (confirmDelete) {
            await deleteAccount();
        }
    };

    return (
        <div className="profile max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
            <div className="text-center">
                <img
                    src={profile.profilePic}
                    alt={`${profile.username}'s profile`}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h2 className="text-2xl font-semibold text-gray-800">{profile.fullName}</h2>
                <p className="text-gray-600">@{profile.username}</p>
            </div>
            <button
                onClick={() => navigate(-1)}
                className="mb-4 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-150"
            >
                ← Back
            </button>
            <div>
                <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="btn btn-danger"
                >
                    {deleteLoading ? "Deleting..." : "Delete Account"}
                </button>
            </div>
        </div>
    );
};

export default Profile;
