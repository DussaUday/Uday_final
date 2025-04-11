// frontend/src/hooks/useLogin.js
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";
import Cookies from 'js-cookie';

const useLogin = () => {
    const [loading, setLoading] = useState(false);
    const { setAuthUser } = useAuthContext();

    const login = async (username, password) => {
        const success = handleInputErrors(username, password);
        if (!success) return;

        setLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                const errorData = await res.json(); // Get error details from the server
                throw new Error(errorData.message || "Login failed"); // Use server message or default
            }

            const data = await res.json();

            // Set the JWT in a cookie:
            Cookies.set('jwt', data.token, { 
                expires: 30, 
                sameSite: 'lax', // Or 'none' if needed for local development
                secure: false // Set to 'true' in production with HTTPS
            });

            localStorage.setItem("chat-user", JSON.stringify(data.user));
            setAuthUser(data.user);
            toast.success("Logged in successfully!");

        } catch (error) {
            toast.error(error.message); // Display the error message
        } finally {
            setLoading(false);
        }
    };

    return { loading, login };
};

export default useLogin;

function handleInputErrors(username, password) {
    if (!username || !password) {
        toast.error("Please fill in all fields");
        return false;
    }
    return true;
}