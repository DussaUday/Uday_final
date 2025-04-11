import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

const useProfile = (userId) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [followersDetails, setFollowersDetails] = useState([]);
    const [followingDetails, setFollowingDetails] = useState([]);
    const [followRequestsDetails, setFollowRequestsDetails] = useState([]);

    const fetchUserDetails = async (userIds, setUserDetails) => {
        try {
            const details = await Promise.all(
                userIds.map(async (id) => {
                    const response = await fetch(`/api/users/${id}`);
                    const data = await response.json();
                    return data;
                })
            );
            setUserDetails(details);
        } catch (error) {
            console.error("Failed to fetch user details:", error);
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`/api/users/${userId}`);
                const data = await res.json();
                if (data.error) throw new Error(data.error);

                setProfile(data);

                // Fetch details for followers, following, and follow requests
                await fetchUserDetails(data.followers, setFollowersDetails);
                await fetchUserDetails(data.following, setFollowingDetails);
                await fetchUserDetails(data.followRequests || [], setFollowRequestsDetails);
            } catch (error) {
                console.error("Failed to fetch profile:", error);
                toast.error("Failed to fetch profile data");
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchProfile();
    }, [userId]);

    return {
        profile,
        loading,
        followersDetails,
        followingDetails,
        followRequestsDetails,
    };
};

export default useProfile;