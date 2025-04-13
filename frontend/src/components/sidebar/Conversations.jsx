import useGetConversations from "../../hooks/useGetConversations";
import Conversation from "./Conversation";
import useConversation from "../../zustand/useConversation";
import PropTypes from "prop-types";

const Conversations = ({ onSelectConversation }) => {
    const { loading, conversations } = useGetConversations();
    const { unreadMessages } = useConversation();

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Chats</h2>
            </div>
            
            {/* Adjusted container with proper padding at the bottom for the menu bar */}
            <div className="flex-1 overflow-y-auto p-2 pb-20 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                {conversations
                    .filter((conversation) => !conversation.isArchived)
                    .sort((a, b) => {
                        if (a.isPinned && !b.isPinned) return -1;
                        if (!a.isPinned && b.isPinned) return 1;
                        return new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp);
                    })
                    .map((conversation, idx) => {
                        const unreadCount = unreadMessages[conversation._id] || 0;
                        return (
                            <Conversation
                                key={conversation._id}
                                conversation={conversation}
                                lastIdx={idx === conversations.length - 1}
                                unreadCount={unreadCount}
                                onClick={() => onSelectConversation(conversation)}
                            />
                        );
                    })}

                {loading ? (
                    <div className="flex justify-center p-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                ) : null}
                
                {conversations.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm w-full max-w-md">
                            <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                            </svg>
                            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No conversations yet</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start a new chat to begin messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

Conversations.propTypes = {
    onSelectConversation: PropTypes.func.isRequired,
};

export default Conversations;
