import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../zustand/useConversation";

const useGetConversations = () => {
    const [loading, setLoading] = useState(false);
    const [conversations, setConversations] = useState([]);
    const { 
        pinnedConversations = [], 
        mutedConversations = [], 
        archivedConversations = [] 
    } = useConversation();

    useEffect(() => {
        const getConversations = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/messages");
                const data = await res.json();
                if (data.error) {
                    throw new Error(data.error);
                }

                // Sort conversations by last message timestamp
                const sortedConversations = data.sort((a, b) => 
                    new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp)
                );

                // Apply pinned, muted, and archived logic with null checks
                const processedConversations = sortedConversations.map((conversation) => ({
                    ...conversation,
                    isPinned: pinnedConversations?.includes(conversation._id) || false,
                    isMuted: mutedConversations?.includes(conversation._id) || false,
                    isArchived: archivedConversations?.includes(conversation._id) || false,
                }));

                setConversations(processedConversations);
            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        getConversations();
    }, [pinnedConversations, mutedConversations, archivedConversations]);

    return { loading, conversations, setConversations };
};

export default useGetConversations;