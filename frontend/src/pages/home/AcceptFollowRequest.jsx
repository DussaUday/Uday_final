import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useSocketContext } from "../context/SocketContext";
import { toast } from "react-hot-toast";

const AcceptFollowRequest = () => {
    const { userId } = useParams();
    const { socket } = useSocketContext();
    const [loading, setLoading] = useState(false);

    const handleAcceptFollowRequest = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/users/accept-follow/${userId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                socket.emit("acceptFollowRequest", { senderId: userId, receiverId: localStorage.getItem("userId") });
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error accepting follow request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button onClick={handleAcceptFollowRequest} disabled={loading}>
                {loading ? "Accepting..." : "Accept Follow Request"}
            </button>
        </div>
    );
};

export default AcceptFollowRequest;