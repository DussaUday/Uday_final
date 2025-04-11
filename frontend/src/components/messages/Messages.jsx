import { useEffect, useRef } from "react";
import PropTypes from 'prop-types';
import useGetMessages from "../../hooks/useGetMessages";
import MessageSkeleton from "../skeletons/MessageSkeleton";
import Message from "./Message";
import useListenMessages from "../../hooks/useListenMessages";

const Messages = ({ selectedConversation }) => {
    const { messages, loading } = useGetMessages();
    useListenMessages();
    const messagesEndRef = useRef();

    useEffect(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    }, [messages]);

    const filteredMessages = messages.filter(
        (message) =>
            message.senderId === selectedConversation?._id || 
            message.receiverId === selectedConversation?._id
    );

    return (
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
            {loading ? (
                <div className="space-y-6">
                    {[...Array(3)].map((_, idx) => (
                        <MessageSkeleton key={idx} />
                    ))}
                </div>
            ) : !selectedConversation ? (
                <div className="flex-1 flex items-center justify-center h-full">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm max-w-md mx-4 text-center">
                        <div className="mx-auto h-12 w-12 text-indigo-500 dark:text-indigo-400 mb-4">
                            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No conversation selected
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Select a conversation to view messages
                        </p>
                    </div>
                </div>
            ) : filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm max-w-md mx-4 text-center">
                        <div className="mx-auto h-12 w-12 text-indigo-500 dark:text-indigo-400 mb-4">
                            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No messages yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Send your first message to start the conversation
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredMessages.map((message) => (
                        <div 
                            key={message._id || message.createdAt} 
                            className="animate-fade-in"
                        >
                            <Message message={message} />
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>
    );
};

Messages.propTypes = {
    selectedConversation: PropTypes.object,
};

export default Messages;