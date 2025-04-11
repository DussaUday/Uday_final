import { useState, useEffect } from "react";
import useGetConversations from "../pages/home/useGetConversations";

const useSearchConversation = (search) => {
    const [suggestions, setSuggestions] = useState([]);
    const { conversations = [], loading, error } = useGetConversations();

    useEffect(() => {
        if (search && Array.isArray(conversations)) {
            const filteredSuggestions = conversations.filter((conversation) => 
                conversation?.fullName?.toLowerCase()?.includes(search?.toLowerCase() || "")
            );
            setSuggestions(filteredSuggestions);
        } else {
            setSuggestions([]);
        }
    }, [search, conversations]);

    return { suggestions, loading, error };
};

export default useSearchConversation;