import { Link } from 'react-router-dom';
import { useAuthContext } from "../../context/AuthContext";

const Profile = () => {
	const { authUser } = useAuthContext();

	return (
		<div className="sidebar p-4 bg-gray-800 text-white">
			{/* Other sidebar items */}
			{authUser && (
				<Link
					to={`/profile/${authUser._id}`}
					className="sidebar-item block px-4 py-2 mt-2 text-sm font-semibold text-gray-800 bg-white rounded-lg shadow hover:bg-gray-100 hover:text-gray-900 transition duration-150 ease-in-out"
				>
					My Profile
				</Link>
			)}
		</div>
	);
};

export default Profile;
