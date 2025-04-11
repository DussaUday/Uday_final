import { useState, useEffect } from "react";
import useGetConversations from "../../hooks/useGetConversations";

const useSearchConversation = (search) => {
    const [suggestions, setSuggestions] = useState([]);
    const { conversations, loading, error } = useGetConversations();

    useEffect(() => {
        if (search && Array.isArray(conversations)) { // Ensure conversations is an array
            const filteredSuggestions = conversations.filter((conversation) =>
                conversation.fullName.toLowerCase().includes(search.toLowerCase())
            );
            console.log("Filtered Suggestions:", filteredSuggestions); // Debugging
            setSuggestions(filteredSuggestions);
        } else {
            setSuggestions([]);
        }
    }, [search, conversations]);

    return { suggestions, loading, error };
};

export default useSearchConversation;