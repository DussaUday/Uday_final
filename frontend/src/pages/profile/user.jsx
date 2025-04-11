// src/api/user.js
import axios from "axios";

export const updateProfile = async (userId, data) => {
    try {
        const response = await axios.put(`/api/users/${userId}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
};