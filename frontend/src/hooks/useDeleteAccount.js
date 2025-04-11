import { useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export const useDeleteAccount = () => {
    const [loading, setLoading] = useState(false);
    const { setAuthUser } = useAuthContext();
    const navigate = useNavigate();

    const deleteAccount = async () => {
        setLoading(true);
        try {
            const url = "/api/users/account/delete";
            console.log("Deleting account from URL:", url);

            const res = await fetch(url, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // Ensure this is included
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to delete account");
            }

            localStorage.removeItem("chat-user");
            setAuthUser(null);
            toast.success("Account deleted successfully");
            navigate("/signup");

        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return { loading, deleteAccount };
};

export default useDeleteAccount;