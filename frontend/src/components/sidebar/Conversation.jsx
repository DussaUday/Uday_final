import { useState } from "react";
import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";
import PropTypes from "prop-types";

const Conversation = ({ conversation, lastIdx, unreadCount, onClick }) => {
    const { selectedConversation, setSelectedConversation, resetUnreadMessages } = useConversation();
    const [isProfilePicModalOpen, setIsProfilePicModalOpen] = useState(false);
    const { onlineUsers } = useSocketContext();
    const isOnline = onlineUsers.includes(conversation._id);
    const isSelected = selectedConversation?._id === conversation._id;

    const handleProfilePicClick = (e) => {
        e.stopPropagation();
        setIsProfilePicModalOpen(true);
    };

    const closeProfilePicModal = () => {
        setIsProfilePicModalOpen(false);
    };

    const handleConversationClick = () => {
        setSelectedConversation(conversation);
        resetUnreadMessages(conversation._id);
        onClick?.();
    };

    return (
        <>
            <div
                className={`flex items-center p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                    isSelected 
                        ? "bg-indigo-100 dark:bg-gray-700 shadow-sm" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={handleConversationClick}
            >
                <div 
                    className={`relative mr-3 ${isOnline ? "online-indicator" : ""}`}
                    onClick={handleProfilePicClick}
                >
                    <div className="relative">
                        <img 
                            src={conversation.profilePic} 
                            alt='user avatar' 
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-400 transition-colors" 
                        />
                        {isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                        <h3 className="text-gray-900 dark:text-white font-medium truncate">
                            {conversation.fullName}
                        </h3>
                        <div className="flex items-center space-x-2">
                            {conversation.isPinned && (
                                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M5.5 17.5L3 15l8-8-8-8 2.5-2.5L15 7l8-8-2.5 2.5-8 8 8 8-2.5 2.5-8-8z" />
                                </svg>
                            )}
                            {unreadCount > 0 && (
                                <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                    </div>
                    <p className={`text-sm truncate ${
                        unreadCount > 0 
                            ? "text-indigo-600 dark:text-indigo-400 font-medium" 
                            : "text-gray-500 dark:text-gray-400"
                    }`}>
                        {conversation.lastMessage || "No messages yet"}
                    </p>
                </div>
            </div>

            {!lastIdx && <div className="border-b border-gray-200 dark:border-gray-700 mx-3"></div>}

            {isProfilePicModalOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
                    onClick={closeProfilePicModal}
                >
                    <div 
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full relative max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={closeProfilePicModal}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="flex flex-col items-center">
                            <img 
                                src={conversation.profilePic} 
                                alt='user avatar' 
                                className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-indigo-400 shadow-md"
                            />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                {conversation.fullName}
                            </h2>
                            <div className="flex items-center mb-4">
                                <span className={`w-3 h-3 rounded-full mr-2 ${
                                    isOnline ? "bg-green-500" : "bg-gray-400"
                                }`}></span>
                                <span className="text-gray-600 dark:text-gray-300">
                                    {isOnline ? "Online" : "Offline"}
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">About</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {conversation.bio || "No bio available"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

Conversation.propTypes = {
    conversation: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        profilePic: PropTypes.string.isRequired,
        fullName: PropTypes.string.isRequired,
        lastMessage: PropTypes.string,
        isPinned: PropTypes.bool,
        bio: PropTypes.string,
    }).isRequired,
    lastIdx: PropTypes.bool,
    unreadCount: PropTypes.number,
    onClick: PropTypes.func,
};

export default Conversation;
