import React, { useState, useEffect } from "react";
import LogoutButton from "./LogoutButton";
import Sidebar from "../../components/sidebar/Sidebar";
import MessageContainer from "../../components/messages/MessageContainer";
import { FaCommentDots, FaHome, FaUser, FaPlus, FaSearch, FaGamepad } from "react-icons/fa";
import { useAuthContext } from "../../context/AuthContext";
import ProfilePage from "../profile/ProfilePage";
import CreatePost from "../../components/posts/CreatePost.jsx";
import PostList from "../../components/posts/PostList.jsx";
import SearchPage from "./SearchInput.jsx";
import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";
import GamePage from "./GamePage.jsx";

const Home = () => {
    const [activeView, setActiveView] = useState('home');
    const [showMessages, setShowMessages] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const { authUser } = useAuthContext();
    const [newFollowRequestsCount, setNewFollowRequestsCount] = useState(0);
    const [newGameRequestsCount, setNewGameRequestsCount] = useState(0);
    const { socket } = useSocketContext();
    const { unreadMessages, resetUnreadMessages } = useConversation();

    const totalUnreadCount = Object.values(unreadMessages).reduce((acc, count) => acc + count, 0);

    useEffect(() => {
        const storedGameRequests = JSON.parse(localStorage.getItem("gameRequests")) || [];
        setNewGameRequestsCount(storedGameRequests.length);
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on("newGameRequest", () => {
                setNewGameRequestsCount((prev) => prev + 1);
            });

            socket.on("newFollowRequest", () => {
                setNewFollowRequestsCount((prev) => prev + 1);
            });
        }

        return () => {
            if (socket) {
                socket.off("newGameRequest");
                socket.off("newFollowRequest");
            }
        };
    }, [socket]);

    const handleNewFollowRequest = (change = 1) => {
        setNewFollowRequestsCount((prev) => prev + change);
    };

    const handleGameRequestUpdate = (newCount) => {
        setNewGameRequestsCount(newCount);
    };

    const handleViewChange = (view) => {
        setActiveView(view);
        if (view === 'profile') {
            setNewFollowRequestsCount(0);
        }
        if (view === 'messages') {
            setShowMessages(true);
            setSelectedConversation(null);
            Object.keys(unreadMessages).forEach(conversationId => {
                resetUnreadMessages(conversationId);
            });
        } else {
            setShowMessages(false);
            setSelectedConversation(null);
        }
    };

    const handleBackToSidebar = () => {
        setSelectedConversation(null);
    };

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-20">
                {activeView === 'home' && (
                    <div className="animate-fade-in">
                        <PostList />
                    </div>
                )}
                {activeView === 'search' && (
                    <div className="animate-fade-in">
                        <SearchPage />
                    </div>
                )}
                {activeView === 'profile' && (
                    <div className="animate-fade-in">
                        <ProfilePage
                            userId={authUser?._id}
                            onNewFollowRequest={handleNewFollowRequest}
                        />
                    </div>
                )}
                {activeView === 'newpost' && (
                    <div className="animate-fade-in">
                        <CreatePost />
                    </div>
                )}
                {activeView === 'messages' && (
                    <div className="fixed inset-0 bg-white z-40 animate-fade-in">
                        {!selectedConversation ? (
                            <div className="w-full h-full">
                                <Sidebar onSelectConversation={handleSelectConversation} />
                            </div>
                        ) : (
                            <div className="w-full h-full">
                                <MessageContainer 
                                    selectedConversation={selectedConversation} 
                                    onBack={handleBackToSidebar} 
                                />
                            </div>
                        )}
                    </div>
                )}
                {activeView === 'game' && (
                    <div className="animate-fade-in">
                        <GamePage onGameRequestUpdate={handleGameRequestUpdate} />
                    </div>
                )}
                <div className="transform hover:scale-110 transition duration-300">
                    <LogoutButton />
                </div>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50">
                <div className="flex justify-around items-center p-2">
                    {/* Home Button */}
                    <button
                        onClick={() => handleViewChange('home')}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${activeView === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-500'}`}
                    >
                        <FaHome className="w-6 h-6 transition-transform duration-300 hover:scale-110" />
                        <span className="text-xs mt-1">Home</span>
                    </button>

                    {/* Search Button */}
                    <button
                        onClick={() => handleViewChange('search')}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${activeView === 'search' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-500'}`}
                    >
                        <FaSearch className="w-6 h-6 transition-transform duration-300 hover:scale-110" />
                        <span className="text-xs mt-1">Search</span>
                    </button>

                    {/* Messages Button */}
                    <button
                        onClick={() => handleViewChange('messages')}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 relative ${activeView === 'messages' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-500'}`}
                    >
                        <div className="relative">
                            <FaCommentDots className="w-6 h-6 transition-transform duration-300 hover:scale-110" />
                            {totalUnreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                                    {totalUnreadCount}
                                </span>
                            )}
                        </div>
                        <span className="text-xs mt-1">Messages</span>
                    </button>

                    {/* New Post Button */}
                    <button
                        onClick={() => handleViewChange('newpost')}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${activeView === 'newpost' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-500'}`}
                    >
                        <div className="relative group">
                            <FaPlus className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
                        </div>
                        <span className="text-xs mt-1">New Post</span>
                    </button>

                    {/* Profile Button */}
                    <button
                        onClick={() => handleViewChange('profile')}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 relative ${activeView === 'profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-500'}`}
                    >
                        <div className="relative">
                            <FaUser className="w-6 h-6 transition-transform duration-300 hover:scale-110" />
                            {newFollowRequestsCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                                    {newFollowRequestsCount}
                                </span>
                            )}
                        </div>
                        <span className="text-xs mt-1">Profile</span>
                    </button>

                    {/* Game Button */}
                    <button
                        onClick={() => handleViewChange('game')}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 relative ${activeView === 'game' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-500'}`}
                    >
                        <div className="relative">
                            <FaGamepad className="w-6 h-6 transition-transform duration-300 hover:scale-110" />
                            {newGameRequestsCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                                    {newGameRequestsCount}
                                </span>
                            )}
                        </div>
                        <span className="text-xs mt-1">Games</span>
                    </button>
                </div>
            </nav>
        </div>
    );
};

export default Home;
