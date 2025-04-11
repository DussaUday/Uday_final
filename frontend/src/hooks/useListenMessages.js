import { useEffect } from "react";
import { useSocketContext } from "../context/SocketContext";
import useConversation from "../zustand/useConversation";
import notificationSound from "../assets/sounds/notification.mp3";
import like from "../assets/sounds/like.mp3";
import useGetConversations from "./useGetConversations";
const useListenMessages = () => {
    const { socket } = useSocketContext();
    const {
        messages,
        setMessages,
        updateMessage,
        selectedConversation,
        incrementUnreadMessages,
        unreadMessages,
        addMessage,
        updateConversation,
        resetUnreadMessages,
    } = useConversation();
    const { conversations, setConversations } = useGetConversations();

    useEffect(() => {
        socket?.on("newMessage", (newMessage) => {
            console.log("New message received:", newMessage);
            addMessage(newMessage);

            if (newMessage.senderId === selectedConversation?._id || newMessage.receiverId === selectedConversation?._id) {
                const sound = new Audio(notificationSound);
                sound.play();
                setMessages([...messages, newMessage]);
                resetUnreadMessages(newMessage.conversationId);
            }

            // Increment unread messages for the conversation
            if (newMessage.conversationId) {
                incrementUnreadMessages(newMessage.conversationId);
            } else {
                console.error("conversationId is undefined in newMessage:", newMessage);
            }
        });

        socket?.on("messageLiked", ({ messageId }) => {
            const sound = new Audio(like);
            sound.play();
            updateMessage(messageId, { isLiked: true });
        });

        socket?.on("messageDeleted", ({ messageId }) => {
            const sound = new Audio(like);
            sound.play();
            updateMessage(messageId, { message: "This message is deleted.", deleted: true });
        });

        socket?.on("updateConversation", ({ conversationId, lastMessageTimestamp, unreadCount }) => {
            setConversations((prevConversations) =>
                prevConversations.map((conversation) =>
                    conversation._id === conversationId
                        ? { ...conversation, lastMessageTimestamp, unreadCount }
                        : conversation
                ).sort((a, b) => new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp))
            );
        });

        return () => {
            socket?.off("newMessage");
            socket?.off("messageLiked");
            socket?.off("messageDeleted");
            socket?.off("updateConversation");
        };
    }, [
        socket,
        setMessages,
        messages,
        updateMessage,
        selectedConversation,
        incrementUnreadMessages,
        unreadMessages,
        addMessage,
        updateConversation,
        setConversations,
        resetUnreadMessages,
    ]);
};

export default useListenMessages;