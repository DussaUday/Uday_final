import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios"; // Assuming you use axios for API calls

const ProfilePage = () => {
	const { userId } = useParams();
	const [user, setUser] = useState(null);

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const response = await axios.get(`/api/users/${userId}`); // Adjust the API endpoint as needed
				setUser(response.data);
			} catch (error) {
				console.error("Error fetching user data:", error);
			}
		};

		fetchUser();
	}, [userId]);

	if (!user) {
		return <div>Loading...</div>;
	}

	return (
		<div className='flex justify-center items-center h-screen bg-gray-900'>
			<div className='bg-black p-8 rounded-lg'>
				<img src={user.profilePic} alt='user avatar' className='w-64 h-64 rounded-full' />
				<p className='text-white text-center mt-4 text-xl font-bold'>{user.fullName}</p>

			</div>
		</div>
	);
};

export default ProfilePage;
