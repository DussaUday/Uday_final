import { useEffect } from "react";
import useConversation from "../../zustand/useConversation";
import MessageInput from "./MessageInput";
import Messages from "./Messages";
import { TiMessages } from "react-icons/ti";
import { useAuthContext } from "../../context/AuthContext";
import { useSocketContext } from "../../context/SocketContext";
import { IoArrowBack } from "react-icons/io5";
import PropTypes from 'prop-types';

const MessageContainer = ({ selectedConversation, onBack }) => {
    const { setSelectedConversation, resetUnreadMessages } = useConversation();
    const { onlineUsers } = useSocketContext();
    const isOnline = onlineUsers.includes(selectedConversation?._id);

    useEffect(() => {
        if (selectedConversation) {
            setSelectedConversation(selectedConversation);
        }
        return () => {
            setSelectedConversation(null);
        };
    }, [selectedConversation, setSelectedConversation]);

    if (!selectedConversation) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 pb-20">
                <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm max-w-md mx-4">
                    <div className="mx-auto h-16 w-16 text-indigo-500 dark:text-indigo-400">
                        <TiMessages className="w-full h-full" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No conversation selected</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Select a conversation from the sidebar to start chatting
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 pb-20">
            {/* Header */}
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center border-b border-gray-200 dark:border-gray-700 shadow-sm">
                <button 
                    onClick={onBack}
                    className="mr-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                    <IoArrowBack className="w-5 h-5" />
                </button>
                <div className="relative">
                    <img 
                        src={selectedConversation.profilePic} 
                        alt='user avatar' 
                        className="w-10 h-10 rounded-full object-cover shadow-md mr-3 border-2 border-white dark:border-gray-700" 
                    />
                    {isOnline && (
                        <span className="absolute bottom-0 right-3 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                    )}
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedConversation.fullName}</span>
                    <span className={`text-xs ${isOnline ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>
                <div className="ml-auto flex space-x-2">
                    <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                    </button>
                    <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                <Messages selectedConversation={selectedConversation} />
            </div>
            
            {/* Message Input */}
            <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 shadow-sm">
                <MessageInput />
            </div>
        </div>
    );
};

MessageContainer.propTypes = {
    selectedConversation: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        profilePic: PropTypes.string.isRequired,
        fullName: PropTypes.string.isRequired,
    }),
    onBack: PropTypes.func.isRequired,
};

export default MessageContainer;