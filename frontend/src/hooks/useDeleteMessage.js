import useConversation from "../zustand/useConversation";

const useDeleteMessage = () => {
	const { messages, setMessages } = useConversation();

	const deleteMessage = async (messageId) => {
		try {
			await fetch(`/api/messages/delete/${messageId}`, { method: "DELETE" });
			setMessages(
				messages.map((msg) =>
					msg._id === messageId ? { ...msg, message: "This message is deleted.", deleted: true } : msg
				)
			);
		} catch (error) {
			console.error("Error deleting message", error);
		}
	};

	return { deleteMessage };
};

export default useDeleteMessage;