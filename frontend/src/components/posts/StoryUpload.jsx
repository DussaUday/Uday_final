import React, { useState, useRef } from "react";
import { BsImage, BsX } from "react-icons/bs";
import usePost from "../../hooks/usePost";
import { useAuthContext } from "../../context/AuthContext";
import { useSocketContext } from "../../context/SocketContext";

const StoryUpload = ({ onClose, onStoryCreated }) => {
    const [media, setMedia] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const fileInputRef = useRef(null);
    const { createStory, loading } = usePost();
    const { authUser } = useAuthContext();
    const { socket } = useSocketContext();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMedia(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (event) => {
                setMediaPreview(event.target.result);
            };
            
            if (file.type.startsWith("image")) {
                reader.readAsDataURL(file);
            } else if (file.type.startsWith("video")) {
                reader.readAsDataURL(file);
            }
        }
    };

    const handleRemoveMedia = () => {
        setMedia(null);
        setMediaPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!media) return;
        
        try {
            const formData = new FormData();
            formData.append("media", media);
            
            const success = await createStory(formData);
            if (success) {
                // Emit socket event
                if (socket) {
                    socket.emit("newStory", {
                        userId: authUser._id,
                        username: authUser.username,
                        profilePic: authUser.profilePic
                    });
                }
                
                onStoryCreated();
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-bold text-lg text-gray-800">Create Story</h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <BsX className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Content */}
                <div className="flex-1 p-4 flex flex-col items-center justify-center">
                    {!mediaPreview ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 w-full">
                            <BsImage className="text-4xl text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-700 mb-2">Upload photo or video</h3>
                            <label className="cursor-pointer">
                                <span className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
                                    Select from device
                                </span>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept="image/*, video/*"
                                    ref={fileInputRef}
                                />
                            </label>
                            <p className="text-gray-400 text-sm mt-3">JPEG, PNG, MP4 supported</p>
                        </div>
                    ) : (
                        <div className="relative w-full h-full max-h-[70vh]">
                            {media.type.startsWith("image") ? (
                                <img 
                                    src={mediaPreview} 
                                    alt="Story preview" 
                                    className="w-full h-full object-contain rounded-lg" 
                                />
                            ) : (
                                <video 
                                    src={mediaPreview} 
                                    className="w-full h-full object-contain rounded-lg" 
                                    controls
                                />
                            )}
                            <button
                                type="button"
                                className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-100 transition-all"
                                onClick={handleRemoveMedia}
                            >
                                <BsX className="text-xl" />
                            </button>
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="p-4 border-t">
                    <button
                        type="button"
                        className={`w-full py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center ${
                            !media ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        onClick={handleSubmit}
                        disabled={loading || !media}
                    >
                        {loading ? "Sharing..." : "Share to Your Story"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StoryUpload;