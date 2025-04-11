import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";

import User from "../models/user.model.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: ["http://localhost:3000"],
		methods: ["GET", "POST"],
	},
});

export const getReceiverSocketId = (receiverId) => {
	return userSocketMap[receiverId];
};

const userSocketMap = {}; // {userId: socketId}
io.on("connection", (socket) => {
    console.log("a user connected", socket.id);
    
    const userId = socket.handshake.query.userId;
    if (userId !== "undefined") {
        userSocketMap[userId] = socket.id;
    }

    // Emit online users to all clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("newMessage", async ({ senderId, receiverId, message, conversationId }) => {
        try {
            const newMessage = new Message({ senderId, receiverId, message, conversationId });
            await newMessage.save();

            const senderSocketId = userSocketMap[senderId];
            const receiverSocketId = userSocketMap[receiverId];

            if (senderSocketId) {
                io.to(senderSocketId).emit("newMessage", newMessage);
            }
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage", newMessage);
            }

            io.emit("updateConversation", {
                conversationId,
                lastMessageTimestamp: new Date(),
                unreadCount: 1,
            });
        } catch (error) {
            console.error("Error saving or emitting new message:", error);
        }
    });

    // Handle like message event
    socket.on("likeMessage", async ({ messageId }) => {
        try {
            const message = await Message.findById(messageId);
            if (message) {
                message.isLiked = true;
                await message.save();
                const senderSocketId = userSocketMap[message.senderId];
                const receiverSocketId = userSocketMap[message.receiverId];
                if (senderSocketId) io.to(senderSocketId).emit("messageLiked", { messageId });
                if (receiverSocketId) io.to(receiverSocketId).emit("messageLiked", { messageId });
            }
        } catch (error) {
            console.error("Error liking message:", error);
        }
    });

    // Handle delete message event
    socket.on("deleteMessage", async ({ messageId }) => {
        try {
            const message = await Message.findById(messageId);
            if (message) {
                message.message = "This message is deleted.";
                message.deleted = true;
                await message.save();
                const senderSocketId = userSocketMap[message.senderId];
                const receiverSocketId = userSocketMap[message.receiverId];
                if (senderSocketId) io.to(senderSocketId).emit("messageDeleted", { messageId });
                if (receiverSocketId) io.to(receiverSocketId).emit("messageDeleted", { messageId });
            }
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    });
    // Handle like post event
    socket.on("likePost", async ({ postId, userId }) => {
        try {
            const post = await Post.findById(postId);
            if (post) {
                const isLiked = post.likes.includes(userId);
                if (isLiked) {
                    post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
                } else {
                    post.likes.push(userId);
                }
                await post.save();

                // Emit to all connected users
                io.emit("postLiked", { postId, likes: post.likes });
            }
        } catch (error) {
            console.error("Error liking post:", error);
        }
    });

// Handle post commented event
    socket.on("commentPost", async ({ postId, userId, comment }) => {
        try {
            const post = await Post.findById(postId);
            if (post) {
                post.comments.push({ userId, comment });
                await post.save();

            // Emit to all connected users
                io.emit("postCommented", { postId, comments: post.comments });
            }
        } catch (error) {
            console.error("Error commenting on post:", error);
        }
    });

// Handle post deleted event
    socket.on("deletePost", async ({ postId }) => {
        try {
            await Post.findByIdAndDelete(postId);

        // Emit to all connected users
            io.emit("postDeleted", { postId });
        } catch (error) {
            console.error("Error deleting post:", error);
        }
    });
    socket.on("sendFollowRequest", async ({ senderId, receiverId }) => {
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newFollowRequest", { senderId });
        }
    });
    
    socket.on("acceptFollowRequest", ({ senderId, receiverId }) => {
        const senderSocketId = userSocketMap[senderId];
        if (senderSocketId) {
            io.to(senderSocketId).emit("followRequestAccepted", { receiverId });
        }
    });
    
    socket.on("rejectFollowRequest", ({ senderId, receiverId }) => {
        const senderSocketId = userSocketMap[senderId];
        if (senderSocketId) {
            io.to(senderSocketId).emit("followRequestRejected", { receiverId });
        }
    });
    socket.on("checkFollowStatus", async ({ userId, currentUserId }) => {
        try {
            const currentUser = await User.findById(currentUserId);
            if (!currentUser) {
                return socket.emit("followStatusError", { error: "Current user not found" });
            }

            const isFollowing = currentUser.following.includes(userId);
            const hasSentRequest = currentUser.followRequests.includes(userId);

            socket.emit("followStatusChecked", { isFollowing, hasSentRequest });
        } catch (error) {
            console.error("Error checking follow status:", error);
            socket.emit("followStatusError", { error: "Internal Server Error" });
        }
        socket.on("unfollowUser", ({ senderId, receiverId }) => {
            const receiverSocketId = userSocketMap[receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("unfollowUser", { senderId });
            }
        });
        // socket.js
        socket.on("sendGameRequest", (data) => {
            const { receiverId } = data;
            const senderId = userId; // Assuming you set userId when the user connects
    
            // Emit event to the receiver
            const receiverSocketId = userSocketMap[receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newGameRequest", {
                    senderId,
                    receiverId,
                });
            }
        });
    
        socket.on("acceptGameRequest", (data) => {
            const { requestId, senderId } = data;
            // Emit event to the sender
            const senderSocketId = userSocketMap[senderId];
            if (senderSocketId) {
                io.to(senderSocketId).emit("gameRequestAccepted", {
                    requestId,
                });
            }
        });
    
        socket.on("rejectGameRequest", (data) => {
            const { requestId, senderId } = data;
            // Emit event to the sender
            const senderSocketId = userSocketMap[senderId];
            if (senderSocketId) {
                io.to(senderSocketId).emit("gameRequestRejected", {
                    requestId,
                });
            }
        });
    
        socket.on("markCell", (data) => {
            const { requestId, cellIndex } = data;
            // Emit event to both players
            io.to(requestId).emit("gameStateUpdated", {
                cellIndex,
            });
        });
    
    });
    socket.on("newStory", async (storyData) => {
        try {
            // Broadcast to all connected clients except sender
            socket.broadcast.emit("newStory", storyData);
        } catch (error) {
            console.error("Error broadcasting new story:", error);
        }
    });
    
    // Handle story deletion
    socket.on("deleteStory", async ({ storyId }) => {
        try {
            // Broadcast to all connected clients
            io.emit("storyDeleted", { storyId });
        } catch (error) {
            console.error("Error broadcasting story deletion:", error);
        }
    });
    // Handle user disconnect
    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { app, io, server, userSocketMap, };