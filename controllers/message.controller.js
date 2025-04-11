import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { v2 as cloudinary } from "cloudinary";
import { uploadToCloudinary } from "../config/cloudinaryConfig.js"; // Import the Cloudinary utility
import upload from "../middleware/upload.js";
import { storage } from "../middleware/upload.js";

export const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }

        // Handle file upload to Cloudinary (same approach as signup)
        let fileUrl = "";
        if (req.file) {
            try {
                // Convert buffer to base64 (same as signup)
                const b64 = Buffer.from(req.file.buffer).toString("base64");
                const dataURI = `data:${req.file.mimetype};base64,${b64}`;
                
                // Upload to Cloudinary with same configuration
                const uploadResponse = await cloudinary.uploader.upload(dataURI, {
                    folder: "message_attachments",
                    resource_type: "auto", // Auto-detect file type
                    transformation: [
                        { width: 1000, height: 1000, crop: "limit" },
                        { quality: "auto" }
                    ]
                });
                
                fileUrl = uploadResponse.secure_url;
            } catch (uploadError) {
                console.error("Cloudinary upload failed:", uploadError);
                return res.status(500).json({ error: "File upload failed" });
            }
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            message,
            file: fileUrl,
            conversationId: conversation._id,
        });

        if (newMessage) {
            conversation.messages.push(newMessage._id);
            conversation.lastMessageTimestamp = new Date();
            if (senderId !== receiverId) {
                conversation.unreadCount += 1;
            }
        }

        await Promise.all([conversation.save(), newMessage.save()]);

        // Socket.io emissions remain the same...
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", {
                ...newMessage.toObject(),
                conversationId: conversation._id,
            });
        }

        io.emit("updateConversation", {
            conversationId: conversation._id,
            lastMessageTimestamp: conversation.lastMessageTimestamp,
            unreadCount: conversation.unreadCount,
        });

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error in sendMessage controller:", error);
        res.status(500).json({ 
            error: "Internal server error",
            details: error.message 
        });
    }
};

export const getMessages = async (req, res) => {
	try {
		const { id: userToChatId } = req.params;
		const senderId = req.user._id;

		const conversation = await Conversation.findOne({
			participants: { $all: [senderId, userToChatId] },
		}).populate("messages"); // NOT REFERENCE BUT ACTUAL MESSAGES

		if (!conversation) return res.status(200).json([]);

		const messages = conversation.messages;

		res.status(200).json(messages);
	} catch (error) {
		console.log("Error in getMessages controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
// In message.controller.js
export const likeMessage = async (req, res) => {
	try {
		const { messageId } = req.params;
		console.log("Liking message with ID:", messageId); // Debug log

		const message = await Message.findById(messageId);
		if (!message) {
			console.log("Message not found"); // Debug log
			return res.status(404).json({ error: "Message not found" });
		}

		message.isLiked = true;
		await message.save();

		console.log("Message liked successfully:", message); // Debug log

		const receiverSocketId = getReceiverSocketId(message.receiverId);
		const senderSocketId = getReceiverSocketId(message.senderId);
		if (receiverSocketId) {
			io.to(receiverSocketId).emit("messageLiked", { messageId });
		}
		if (senderSocketId) {
			io.to(senderSocketId).emit("messageLiked", { messageId });
		}

		res.status(200).json({ message: "Message liked successfully" });
	} catch (error) {
		console.error("Error in likeMessage controller:", error); // Debug log
		res.status(500).json({ error: "Internal server error" });
	}
};
export const deleteMessage = async (req, res) => {
	try {
		const { messageId } = req.params;
		console.log("Deleting message with ID:", messageId); // Debug log

		const message = await Message.findById(messageId);
		if (!message) {
			console.log("Message not found"); // Debug log
			return res.status(404).json({ error: "Message not found" });
		}

		message.message = "This message is deleted.";
		message.deleted = true;
		await message.save();

		console.log("Message deleted successfully:", message); // Debug log

		const receiverSocketId = getReceiverSocketId(message.receiverId);
		if (receiverSocketId) {
			io.to(receiverSocketId).emit("messageDeleted", { messageId });
		}

		res.status(200).json({ message: "Message deleted successfully" });
	} catch (error) {
		console.error("Error in deleteMessage controller:", error); // Debug log
		res.status(500).json({ error: "Internal server error" });
	}
};
// In your message controller
export const getLastMessage = async (req, res) => {
    try {
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        }).populate({
            path: "messages",
            options: { sort: { createdAt: -1 }, limit: 1 },
        });

        if (!conversation || conversation.messages.length === 0) {
            return res.status(200).json({});
        }

        const lastMessage = conversation.messages[0];
        res.status(200).json(lastMessage);
    } catch (error) {
        console.log("Error in getLastMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;

        // Fetch the current user's details including followers and following
        const currentUser = await User.findById(loggedInUserId).select("followers following");

        if (!currentUser) {
            return res.status(404).json({ error: "Current user not found" });
        }

        // Find users who are either followers or being followed by the current user
        const usersForSidebar = await User.find({
            _id: { $ne: loggedInUserId }, // Exclude the current user
            $or: [
                { _id: { $in: currentUser.followers } }, // Users who are followers
                { followers: { $in: [loggedInUserId] } }, // Users who are being followed by the current user
            ],
        }).select("-password"); // Exclude password field

        res.status(200).json(usersForSidebar);
    } catch (error) {
        console.error("Error in getUsersForSidebar: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};