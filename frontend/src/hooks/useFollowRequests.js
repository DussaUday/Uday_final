// hooks/useFollowRequests.js
import { useState } from "react";
import { useSocketContext } from "../context/SocketContext";
import { toast } from "react-hot-toast";

const useFollowRequests = (userId) => {
    const { socket } = useSocketContext();
    const [followRequests, setFollowRequests] = useState([]);
    const [loading, setLoading] = useState(false);

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
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error rejecting follow request");
        } finally {
            setLoading(false);
        }
    };

    return {
        followRequests,
        loading,
        handleAcceptFollowRequest,
        handleRejectFollowRequest,
        setFollowRequests,
    };
};

export default useFollowRequests;