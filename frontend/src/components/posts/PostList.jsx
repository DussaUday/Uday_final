import React, { useEffect, useState, useRef } from "react";
import usePost from "../../hooks/usePost";
import { BsHeart, BsChat, BsHeartFill, BsX, BsSend, BsPlus, BsImage, BsChevronLeft, BsChevronRight, BsTrash, BsMoon, BsSun } from "react-icons/bs";
import { useAuthContext } from "../../context/AuthContext";
import { useSocketContext } from "../../context/SocketContext";
import StoryUpload from "./StoryUpload";

const PostList = () => {
    const { posts, getPosts, likePost, commentPost, getStories, viewStory, deleteStory } = usePost();
    const { authUser } = useAuthContext();
    const { socket } = useSocketContext();
    const [comment, setComment] = useState("");
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [stories, setStories] = useState([]);
    const [showStoryUpload, setShowStoryUpload] = useState(false);
    const [selectedStoryUser, setSelectedStoryUser] = useState(null);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const progressInterval = useRef(null);
    const storyDuration = 5000; // 5 seconds per story

    useEffect(() => {
        getPosts();
        fetchStories();
        
        if (socket) {
            socket.on("newStory", () => {
                fetchStories();
            });
        }

        return () => {
            if (socket) {
                socket.off("newStory");
            }
        };
    }, [socket]);

    const fetchStories = async () => {
        const data = await getStories();
        setStories(data);
    };

    const handleViewStory = (userStories) => {
        setSelectedStoryUser(userStories);
        setCurrentStoryIndex(0);
        setProgress(0);
    };

    const startProgress = () => {
        setProgress(0);
        clearInterval(progressInterval.current);
        
        progressInterval.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval.current);
                    goToNextStory();
                    return 0;
                }
                return prev + (100 / (storyDuration / 100));
            });
        }, 100);
    };

    const goToNextStory = () => {
        if (!selectedStoryUser) return;

        // If there are more stories from the same user
        if (currentStoryIndex < selectedStoryUser.stories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1);
            viewStory(selectedStoryUser.stories[currentStoryIndex]._id);
        } else {
            // Find the index of the current user in the stories array
            const currentUserIndex = stories.findIndex(
                s => s.user._id === selectedStoryUser.user._id
            );
            
            // If there's a next user with stories
            if (currentUserIndex < stories.length - 1) {
                const nextUserStories = stories[currentUserIndex + 1];
                handleViewStory(nextUserStories);
            } else {
                // No more stories, close the viewer
                handleCloseStoryViewer();
            }
        }
    };

    const goToPrevStory = () => {
        if (!selectedStoryUser) return;

        // If there are previous stories from the same user
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(currentStoryIndex - 1);
        } else {
            // Find the index of the current user in the stories array
            const currentUserIndex = stories.findIndex(
                s => s.user._id === selectedStoryUser.user._id
            );
            
            // If there's a previous user with stories
            if (currentUserIndex > 0) {
                const prevUserStories = stories[currentUserIndex - 1];
                handleViewStory(prevUserStories);
                setCurrentStoryIndex(prevUserStories.stories.length - 1);
            }
        }
    };

    const handlePause = () => {
        setIsPaused(true);
        clearInterval(progressInterval.current);
    };

    const handleResume = () => {
        setIsPaused(false);
        startProgress();
    };

    const handleCloseStoryViewer = () => {
        setSelectedStoryUser(null);
        setCurrentStoryIndex(0);
        setProgress(0);
        clearInterval(progressInterval.current);
    };

    const handleDeleteStory = async (storyId) => {
        await deleteStory(storyId);
        fetchStories();
        
        if (selectedStoryUser.user._id === authUser._id) {
            const remainingStories = selectedStoryUser.stories.filter(s => s._id !== storyId);
            if (remainingStories.length === 0) {
                handleCloseStoryViewer();
            } else {
                const newIndex = Math.min(currentStoryIndex, remainingStories.length - 1);
                setCurrentStoryIndex(newIndex);
                setSelectedStoryUser({
                    ...selectedStoryUser,
                    stories: remainingStories
                });
            }
        }
    };

    const handleLike = async (postId) => {
        await likePost(postId);
    };

    const handleComment = async (postId) => {
        if (!comment) return;
        await commentPost(postId, comment);
        setComment("");
    };

    const toggleCommentPopup = (postId) => {
        setSelectedPostId(selectedPostId === postId ? null : postId);
    };

    const handleStoryUploadClose = () => {
        setShowStoryUpload(false);
        fetchStories();
    };

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    useEffect(() => {
        if (selectedStoryUser) {
            startProgress();
        }
        return () => clearInterval(progressInterval.current);
    }, [currentStoryIndex, selectedStoryUser]);

    const currentStory = selectedStoryUser?.stories?.[currentStoryIndex];
    const isCurrentUserStory = selectedStoryUser?.user?._id === authUser._id;
    const currentUserHasStories = stories.some(s => s.user._id === authUser._id && s.stories.length > 0);

    return (
        <div className={`pb-20 max-w-md mx-auto min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            {/* Dark Mode Toggle */}
            <div className="fixed top-4 right-4 z-50">
                <button 
                    onClick={toggleDarkMode}
                    className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'}`}
                >
                    {darkMode ? <BsSun className="w-5 h-5" /> : <BsMoon className="w-5 h-5" />}
                </button>
            </div>

            {/* Stories Section */}
            <div className={`p-4 mb-4 overflow-x-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex space-x-4">
                    {/* Your Story */}
                    <div 
                        className="flex flex-col items-center space-y-1 cursor-pointer"
                        onClick={() => {
                            const userStories = stories.find(s => s.user._id === authUser._id);
                            if (userStories) {
                                handleViewStory(userStories);
                            } else {
                                setShowStoryUpload(true);
                            }
                        }}
                    >
                        <div className="relative">
                            <img
                                src={authUser.profilePic || "/default-profile.png"}
                                alt="Your story"
                                className={`w-16 h-16 rounded-full object-cover border-2 p-0.5 ${
                                    currentUserHasStories ? "border-blue-500" : darkMode ? "border-gray-600" : "border-gray-300"
                                }`}
                                onError={(e) => {
                                    e.target.src = "/default-profile.png";
                                }}
                            />
                            {!currentUserHasStories && (
                                <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-white border-2 border-white">
                                    <BsPlus className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                        <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Your Story</span>
                    </div>
                    
                    {/* Other Users' Stories */}
                    {stories
                        .filter(userStories => userStories.user._id !== authUser._id)
                        .map((userStories) => (
                            <div 
                                key={userStories.user._id} 
                                className="flex flex-col items-center space-y-1 cursor-pointer"
                                onClick={() => handleViewStory(userStories)}
                            >
                                <div className={`relative ${
                                    userStories.stories.some(s => 
                                        !s.viewers?.includes(authUser._id))
                                        ? "border-2 border-blue-500 p-0.5"
                                        : darkMode ? "border-2 border-gray-600 p-0.5" : "border-2 border-gray-300 p-0.5"
                                } rounded-full`}>
                                    <img
                                        src={userStories.user.profilePic || "/default-profile.png"}
                                        alt={userStories.user.username}
                                        className="w-16 h-16 rounded-full object-cover"
                                        onError={(e) => {
                                            e.target.src = "/default-profile.png";
                                        }}
                                    />
                                </div>
                                <span className={`text-xs truncate w-16 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {userStories.user.username}
                                </span>
                            </div>
                        ))}
                </div>
            </div>
            
            {/* Posts Section */}
            <div className="space-y-6 px-2">
                {posts.map((post) => (
                    post.userId && (
                        <div key={post._id} className={`rounded-xl shadow-md overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border`}>
                            {/* Post Header */}
                            <div className={`flex items-center p-3 ${darkMode ? 'border-gray-700' : 'border-gray-100'} border-b`}>
                                <img
                                    src={post.userId.profilePic || "/default-profile.png"}
                                    alt={post.userId.username || "Unknown User"}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-indigo-100"
                                    onError={(e) => {
                                        e.target.src = "/default-profile.png";
                                    }}
                                />
                                <span className={`font-semibold ml-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                    {post.userId.username || "Unknown User"}
                                </span>
                            </div>
                            
                            {/* Media Content */}
                            {post.media && (
                                post.media.mediaType === 'video' ? (
                                    <video controls className="w-full aspect-square object-cover bg-black">
                                        <source src={post.media.url} type={`video/${post.media.url.split('.').pop()}`} />
                                        Your browser does not support the video tag.
                                    </video>
                                ) : (
                                    <img 
                                        src={post.media.url} 
                                        alt="Post" 
                                        className="w-full aspect-square object-cover" 
                                    />
                                )
                            )}
                            
                            {/* Post Actions */}
                            <div className="p-3">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex space-x-4">
                                        <button
                                            onClick={() => handleLike(post._id)}
                                            className="focus:outline-none"
                                        >
                                            {post.likes.includes(authUser._id) ? (
                                                <BsHeartFill className="w-6 h-6 text-red-500 fill-current" />
                                            ) : (
                                                <BsHeart className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'} fill-current hover:text-red-500`} />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => toggleCommentPopup(post._id)}
                                            className="focus:outline-none"
                                        >
                                            <BsChat className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'} fill-current hover:text-indigo-500`} />
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Likes count */}
                                {post.likes.length > 0 && (
                                    <p className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                                        {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
                                    </p>
                                )}
                                
                                {/* Caption */}
                                <p className={`mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                                    <span className={`font-semibold mr-2 ${darkMode ? 'text-white' : ''}`}>{post.userId.username}</span>
                                    {post.caption}
                                </p>
                                
                                {/* Comments preview */}
                                {post.comments.length > 0 && (
                                    <button 
                                        onClick={() => toggleCommentPopup(post._id)}
                                        className={`text-sm mb-2 ${darkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-indigo-500'}`}
                                    >
                                        View all {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
                                    </button>
                                )}
                            </div>
                            
                            {/* Comment Popup */}
                            {selectedPostId === post._id && (
                                <div className={`fixed inset-0 ${darkMode ? 'bg-gray-900' : 'bg-black'} bg-opacity-90 flex items-center justify-center p-4 z-50`}>
                                    <div className={`rounded-xl w-full max-w-md max-h-[90vh] flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                        {/* Header */}
                                        <div className={`flex justify-between items-center p-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                                            <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>Comments</h3>
                                            <button 
                                                onClick={() => setSelectedPostId(null)}
                                                className={darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'}
                                            >
                                                <BsX className="w-6 h-6" />
                                            </button>
                                        </div>
                                        
                                        {/* Comments List */}
                                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                            {post.comments.length > 0 ? (
                                                post.comments.map((comment, index) => (
                                                    <div key={index} className="flex items-start">
                                                        <img
                                                            src={comment.userId?.profilePic || "/default-profile.png"}
                                                            alt={comment.userId?.username || "User"}
                                                            className="w-8 h-8 rounded-full object-cover mr-3"
                                                            onError={(e) => {
                                                                e.target.src = "/default-profile.png";
                                                            }}
                                                        />
                                                        <div className="flex-1">
                                                            <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                                                {comment.userId?.username || "User"}
                                                            </p>
                                                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                {comment.comment}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No comments yet</p>
                                            )}
                                        </div>
                                        
                                        {/* Comment Input */}
                                        <div className={`p-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-t`}>
                                            <div className="flex items-center">
                                                <input
                                                    type="text"
                                                    className={`flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                                                    placeholder="Add a comment..."
                                                    value={comment}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleComment(post._id)}
                                                />
                                                <button
                                                    className={`p-2 rounded-r-lg transition-colors ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-500 hover:bg-indigo-600'} text-white`}
                                                    onClick={() => handleComment(post._id)}
                                                >
                                                    <BsSend className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                ))}
            </div>
            
            {/* Story Viewer */}
            {selectedStoryUser && currentStory && (
                <div className={`fixed inset-0 ${darkMode ? 'bg-gray-900' : 'bg-black'} bg-opacity-90 z-50 flex items-center justify-center p-4`}>
                    <div className={`w-full max-w-md rounded-xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        {/* Header */}
                        <div className={`relative p-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <img 
                                        src={selectedStoryUser.user.profilePic || "/default-profile.png"} 
                                        alt={selectedStoryUser.user.username} 
                                        className="w-8 h-8 rounded-full border-2 border-indigo-100"
                                        onError={(e) => {
                                            e.target.src = "/default-profile.png";
                                        }}
                                    />
                                    <span className={`font-semibold ml-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                        {selectedStoryUser.user.username}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {isCurrentUserStory && (
                                        <button 
                                            className={`p-1 rounded-full ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                                            onClick={() => handleDeleteStory(currentStory._id)}
                                        >
                                            <BsTrash className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button 
                                        className={`p-1 rounded-full ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                                        onClick={handleCloseStoryViewer}
                                    >
                                        <BsX className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Progress bars */}
                            <div className="flex w-full gap-1 mt-2">
                                {selectedStoryUser.stories.map((_, index) => (
                                    <div key={index} className={`h-1 rounded-full flex-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}>
                                        <div 
                                            className={`h-full rounded-full transition-all duration-100 ease-linear ${
                                                index < currentStoryIndex 
                                                    ? "bg-blue-500" 
                                                    : index === currentStoryIndex 
                                                        ? "bg-blue-500" 
                                                        : darkMode ? "bg-gray-600" : "bg-gray-300"
                                            }`}
                                            style={{
                                                width: index === currentStoryIndex ? `${progress}%` : index < currentStoryIndex ? "100%" : "0%"
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Story Content */}
                        <div 
                            className="relative w-full aspect-square bg-black flex items-center justify-center"
                            onMouseDown={handlePause}
                            onMouseUp={handleResume}
                            onTouchStart={handlePause}
                            onTouchEnd={handleResume}
                        >
                            {currentStory.media.mediaType === "image" ? (
                                <img 
                                    src={currentStory.media.url} 
                                    alt="Story" 
                                    className="w-full h-full object-contain" 
                                />
                            ) : (
                                <video 
                                    src={currentStory.media.url} 
                                    className="w-full h-full object-contain" 
                                    autoPlay
                                    muted
                                    loop={false}
                                    onEnded={goToNextStory}
                                />
                            )}
                            
                            {/* Navigation arrows */}
                            <div className="absolute inset-0 flex">
                                <div 
                                    className="w-1/2 h-full flex items-center justify-start pl-2 cursor-pointer"
                                    onClick={goToPrevStory}
                                >
                                    <button className="bg-black bg-opacity-40 text-white rounded-full p-1 hover:bg-opacity-60 transition-all">
                                        <BsChevronLeft className="w-5 h-5" />
                                    </button>
                                </div>
                                <div 
                                    className="w-1/2 h-full flex items-center justify-end pr-2 cursor-pointer"
                                    onClick={goToNextStory}
                                >
                                    <button className="bg-black bg-opacity-40 text-white rounded-full p-1 hover:bg-opacity-60 transition-all">
                                        <BsChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer with reply input */}
                        <div className={`p-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t`}>
                            <div className="flex items-center">
                                <input
                                    type="text"
                                    placeholder="Send message"
                                    className={`flex-1 p-2 border rounded-l-lg focus:outline-none text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' : 'border-gray-300 focus:ring-blue-500'}`}
                                />
                                <button className={`p-2 rounded-r-lg text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}>
                                    <BsSend className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Story Upload Modal */}
            {showStoryUpload && (
                <StoryUpload 
                    onClose={handleStoryUploadClose} 
                    onStoryCreated={() => {
                        fetchStories();
                        handleStoryUploadClose();
                    }} 
                    darkMode={darkMode}
                />
            )}
        </div>
    );
};

export default PostList;