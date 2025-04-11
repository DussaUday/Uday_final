import { createContext, useState, useEffect, useContext } from "react";
import {toast} from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "./AuthContext";
import useConversation from "../zustand/useConversation";
import io from "socket.io-client";
import PropTypes from "prop-types";

//import usePost from "../hooks/usePost";


const SocketContext = createContext();

export const useSocketContext = () => {
    return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const { authUser } = useAuthContext();
	const { updateMessage, setMessages, messages, incrementUnreadMessages,unreadMessages } = useConversation();
	//const { setPosts } = usePost();
	const [gameRequests, setGameRequests] = useState([]);
	const navigate = useNavigate();
	const {setFollowersDetails}=useState([]);
	useEffect(() => {
		if (authUser) {
			const socket = io("http://localhost:5000", {
				query: {
					userId: authUser._id,
				},
			});

			setSocket(socket);
			socket.on("connect", () => {
                console.log("Socket connected:", socket.id); // Debugging
            });

			
			socket.on("getOnlineUsers", (users) => {
				setOnlineUsers(users);
			});

			socket.on("newMessage", (newMessage) => {
				newMessage.shouldShake = true;
				setMessages([...messages, newMessage]);
	
				// Ensure conversationId is passed correctly
				if (newMessage.conversationId) {
					incrementUnreadMessages(newMessage.conversationId);
				} else {
					console.error("conversationId is missing in newMessage:", newMessage);
				}
			});

			socket.on("messageLiked", ({ messageId }) => {
				updateMessage(messageId, { isLiked: true });
			});

			socket.on("messageDeleted", ({ messageId }) => {
				updateMessage(messageId, { message: "This message is deleted.", deleted: true });
			});
			
			socket.on("getOnlineUsers", (users) => {
                setOnlineUsers(users);
            });
			socket.on("newFollowRequest", ({ senderId }) => {
				toast.success(`New follow request from ${senderId}`);
			});
	
			socket.on("followRequestAccepted", ({ receiverId }) => {
				toast.success(`Your follow request to ${receiverId} was accepted!`);
			});
	
			socket.on("followRequestRejected", ({ receiverId }) => {
				toast.error(`Your follow request to ${receiverId} was rejected.`);
			});
			// In your socket context or component
			socket.on("userUnfollowed", ({ unfollowerId, unfollowedUserId }) => {
    			if (unfollowedUserId === authUser._id) {
        			// Update the followers list if the current user was unfollowed
        			setFollowersDetails(prevFollowersDetails => 
            	prevFollowersDetails.filter(user => user._id !== unfollowerId)
        	);
			socket.on("newGameRequest", (data) => {
                setGameRequests((prev) => [...prev, data]);
            });

            socket.on("gameRequestAccepted", (data) => {
                // Handle game request accepted
                console.log("Game request accepted:", data);
            });

            socket.on("gameRequestRejected", (data) => {
                // Handle game request rejected
                console.log("Game request rejected:", data);
            });

            socket.on("cellMarked", (data) => {
                // Handle cell marked
                console.log("Cell marked:", data);
            });

    }
});
            
			return () => socket.close();
		} else {
			if (socket) {
				socket.close();
				setSocket(null);
			}
		}
	}, [authUser, updateMessage, setMessages, messages, incrementUnreadMessages, unreadMessages]);

	return <SocketContext.Provider value={{ socket, onlineUsers,gameRequests }}>{children}</SocketContext.Provider>;
};

SocketContextProvider.propTypes = {
	children: PropTypes.node.isRequired,
};
