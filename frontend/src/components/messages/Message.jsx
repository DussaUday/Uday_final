import { useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { extractTime } from "../../utils/extractTime";
import useConversation from "../../zustand/useConversation";
import useLikeMessage from "../../hooks/useLikeMessage";
import useDeleteMessage from "../../hooks/useDeleteMessage";
import { Menu, MenuItem, IconButton, Modal, Box } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PropTypes from "prop-types";
import { useEffect } from "react";

const Message = ({ message }) => {
    const { authUser } = useAuthContext();
    const { selectedConversation, resetUnreadMessages } = useConversation();
    const { likeMessage } = useLikeMessage();
    const { deleteMessage } = useDeleteMessage();
    const [anchorEl, setAnchorEl] = useState(null);
    const [isMediaOpen, setIsMediaOpen] = useState(false);

    const fromMe = message.senderId === authUser._id;
    const formattedTime = extractTime(message.createdAt);
    const profilePic = fromMe ? authUser.profilePic : selectedConversation?.profilePic;
    const bubbleBgColor = fromMe ? "bg-indigo-600" : "bg-gray-700";
    const bubbleTextColor = fromMe ? "text-white" : "text-gray-100";

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLike = () => {
        likeMessage(message._id);
        handleMenuClose();
    };

    const handleDelete = () => {
        deleteMessage(message._id);
        handleMenuClose();
    };

    const handleOpenMedia = () => {
        setIsMediaOpen(true);
    };

    const handleCloseMedia = () => {
        setIsMediaOpen(false);
    };

    useEffect(() => {
        if (!fromMe) {
            resetUnreadMessages(selectedConversation._id);
        }
    }, [fromMe, resetUnreadMessages, selectedConversation]);

    const fileType = message.file?.split(".").pop()?.toLowerCase();

    return (
        <div className={`flex ${fromMe ? "justify-end" : "justify-start"} mb-4 px-4`}>
            {!fromMe && (
                <div className="flex-shrink-0 mr-3">
                    <img 
                        src={profilePic} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-full object-cover shadow-md border-2 border-white dark:border-gray-700"
                    />
                </div>
            )}
            
            <div className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-xl p-4 ${bubbleBgColor} ${bubbleTextColor} shadow-md transition-all duration-200 hover:shadow-lg`}>
                {message.deleted ? (
                    <span className="text-red-300 italic">This message was deleted</span>
                ) : (
                    <>
                        {message.message && <p className="break-words">{message.message}</p>}
                        {message.file && (
                            <div className="mt-2">
                                {fileType === "pdf" ? (
                                    <div 
                                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                                        onClick={handleOpenMedia}
                                    >
                                        <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                        </svg>
                                        <span className="text-blue-300 underline">
                                            View PDF
                                        </span>
                                    </div>
                                ) : fileType?.match(/mp4|mov|avi|mkv/) ? (
                                    <div 
                                        className="relative cursor-pointer group"
                                        onClick={handleOpenMedia}
                                    >
                                        <video 
                                            src={message.file} 
                                            className="max-w-[240px] h-auto rounded-lg shadow-md group-hover:opacity-90 transition" 
                                            controls
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                            <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                                                Click to enlarge
                                            </span>
                                        </div>
                                    </div>
                                ) : fileType?.match(/jpg|jpeg|png|gif/) ? (
                                    <div 
                                        className="relative cursor-pointer group"
                                        onClick={handleOpenMedia}
                                    >
                                        <img 
                                            src={message.file} 
                                            alt="Uploaded" 
                                            className="max-w-[240px] h-auto rounded-lg shadow-md group-hover:opacity-90 transition" 
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                            <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                                                Click to enlarge
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div 
                                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                                        onClick={handleOpenMedia}
                                    >
                                        <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                        </svg>
                                        <span className="text-blue-300 underline">
                                            View File
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
                
                <div className={`flex items-center mt-2 text-xs ${fromMe ? 'justify-end' : 'justify-start'} space-x-2`}>
                    <span className="opacity-80">{formattedTime}</span>
                    {message.isLiked && (
                        <FavoriteIcon className='text-red-400' fontSize='small' />
                    )}
                    {fromMe ? (
                        <>
                            <IconButton 
                                onClick={handleMenuOpen} 
                                size='small'
                                className="!text-gray-300 hover:!bg-gray-500/30 !ml-1"
                            >
                                <MoreVertIcon fontSize='small' />
                            </IconButton>
                            <Menu 
                                anchorEl={anchorEl} 
                                open={Boolean(anchorEl)} 
                                onClose={handleMenuClose}
                                PaperProps={{
                                    style: {
                                        backgroundColor: '#374151',
                                        color: 'white',
                                        borderRadius: '0.75rem',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                    },
                                }}
                            >
                                <MenuItem onClick={handleLike} className="hover:bg-gray-600/50">
                                    <FavoriteIcon className="mr-2 text-red-400" /> Like
                                </MenuItem>
                                <MenuItem onClick={handleDelete} className="hover:bg-gray-600/50">
                                    <svg className="w-5 h-5 mr-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                    Delete
                                </MenuItem>
                            </Menu>
                        </>
                    ) : (
                        !message.isLiked && (
                            <IconButton 
                                onClick={handleLike} 
                                size='small'
                                className="!text-gray-300 hover:!bg-gray-500/30 !ml-1"
                            >
                                <FavoriteIcon fontSize='small' />
                            </IconButton>
                        )
                    )}
                </div>
            </div>
            
            {fromMe && (
                <div className="flex-shrink-0 ml-3">
                    <img 
                        src={profilePic} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-full object-cover shadow-md border-2 border-white dark:border-gray-700"
                    />
                </div>
            )}

            {/* Media Modal */}
            <Modal open={isMediaOpen} onClose={handleCloseMedia}>
                <Box 
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        bgcolor: "background.paper",
                        boxShadow: 24,
                        p: 2,
                        outline: "none",
                        maxWidth: '90vw',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        borderRadius: '1rem',
                        backgroundColor: '#1f2937',
                    }}
                >
                    <button 
                        onClick={handleCloseMedia}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-1 rounded-full hover:bg-gray-700 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                    {fileType === "pdf" ? (
                        <iframe 
                            src={message.file} 
                            title="PDF Preview" 
                            className="w-full h-[80vh] border-0 rounded-lg"
                        />
                    ) : fileType?.match(/mp4|mov|avi|mkv/) ? (
                        <video 
                            src={message.file} 
                            controls 
                            className="max-w-full max-h-[80vh] rounded-lg"
                            autoPlay
                        />
                    ) : fileType?.match(/jpg|jpeg|png|gif/) ? (
                        <img 
                            src={message.file} 
                            alt="Uploaded" 
                            className="max-w-full max-h-[80vh] object-contain rounded-lg"
                        />
                    ) : (
                        <iframe 
                            src={message.file} 
                            title="File Preview" 
                            className="w-full h-[80vh] border-0 rounded-lg"
                        />
                    )}
                    <div className="mt-3 text-sm text-gray-300">
                        {message.file?.split('/').pop()}
                    </div>
                </Box>
            </Modal>
        </div>
    );
};

Message.propTypes = {
    message: PropTypes.shape({
        senderId: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
        _id: PropTypes.string.isRequired,
        deleted: PropTypes.bool.isRequired,
        message: PropTypes.string.isRequired,
        file: PropTypes.string,
        isLiked: PropTypes.bool.isRequired,
    }).isRequired,
};

export default Message;