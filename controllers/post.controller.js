import Post from "../models/post.model.js";
import { uploadToCloudinary } from "../config/cloudinaryConfig.js"; // Import the Cloudinary utility
import upload from "../middleware/upload.js";
import { storage } from "../middleware/upload.js";
import User from "../models/user.model.js";
import cloudinary from "../config/cloudinaryConfig.js"; // Ensure .js is included
import { getReceiverSocketId, io } from "../socket/socket.js";
import Story from "../models/story.model.js"; // Import the Story model
export const createPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Upload media to Cloudinary
        const b64 = Buffer.from(file.buffer).toString("base64");
        let dataURI = "data:" + file.mimetype + ";base64," + b64;
        
        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
            folder: "post_media",
            resource_type: "auto" // Automatically detect if it's image or video
        });

        const newPost = new Post({
            userId: req.user._id,
            media: {
                url: uploadResponse.secure_url,
                public_id: uploadResponse.public_id,
                mediaType: uploadResponse.resource_type // Note: fixed typo from resource_type
            },
            caption,
        });

        await newPost.save();

        res.status(201).json(newPost);
    } catch (error) {
        console.log("Error in createPost controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getPosts = async (req, res) => {
    try {
        const currentUserId = req.user._id; // Get the current user's ID from the request

        // Fetch the current user's document to get their followers and following lists
        const currentUser = await User.findById(currentUserId).select("following followers");

        if (!currentUser) {
            return res.status(404).json({ error: "Current user not found" });
        }

        // Combine the following and followers lists into a single array of user IDs
        const relevantUserIds = [...currentUser.following, ...currentUser.followers,currentUserId];

        // Fetch posts only from users in the relevantUserIds array
        const posts = await Post.find({ userId: { $in: relevantUserIds } })
            .sort({ createdAt: -1 })
            .populate("userId", "username profilePic");

        res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getPosts controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const likePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        if (post.likes.includes(userId)) {
            post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
        } else {
            post.likes.push(userId);
        }

        await post.save();

        // Emit the event to all connected users
        io.emit("postLiked", { postId, likes: post.likes });

        res.status(200).json({ likes: post.likes });
    } catch (error) {
        console.log("Error in likePost controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const commentPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { comment } = req.body;
        const userId = req.user._id;

        // Add comment and populate immediately in one operation
        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { $push: { comments: { userId, comment } } },
            { 
                new: true,
                populate: {
                    path: 'comments.userId',
                    select: 'username profilePic'
                }
            }
        );

        if (!updatedPost) {
            return res.status(404).json({ error: "Post not found" });
        }

        // Transform the comments to ensure proper structure
        const transformedComments = updatedPost.comments.map(comment => ({
            ...comment.toObject(),
            userId: comment.userId ? {
                _id: comment.userId._id,
                username: comment.userId.username,
                profilePic: comment.userId.profilePic
            } : null
        }));

        const receiverSocketId = getReceiverSocketId(updatedPost.userId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("postCommented", { 
                postId, 
                comments: transformedComments 
            });
        }

        res.status(200).json({ comments: transformedComments });
    } catch (error) {
        console.log("Error in commentPost controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        if (post.userId.toString() !== userId.toString()) {
            return res.status(403).json({ error: "You are not authorized to delete this post" });
        }

        await Post.findByIdAndDelete(postId);

        const receiverSocketId = getReceiverSocketId(post.userId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("postDeleted", { postId });
        }

        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.log("Error in deletePost controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getCurrentUserPosts = async (req, res) => {
    try {
        const userId = req.user._id; // Assuming `req.user` is set by your authentication middleware
        const posts = await Post.find({ userId }).populate("userId", "username profilePic");

        console.log("Fetched Posts:", posts); // Debugging: Log the fetched posts

        if (!posts || posts.length === 0) {
            return res.status(404).json({ error: "No posts found for the current user" });
        }

        res.status(200).json({ posts });
    } catch (error) {
        console.error("Error fetching current user posts:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getUserPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Find posts by the specified user ID
        const posts = await Post.find({ userId })
            .populate("userId", "username profilePic")
            .sort({ createdAt: -1 });

        if (!posts) {
            return res.status(404).json({ error: "No posts found for this user" });
        }

        res.status(200).json({ posts });
    } catch (error) {
        console.error("Error fetching user posts:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};







// Add these new controller functions to post.controller.js

export const createStory = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Upload media to Cloudinary
        const b64 = Buffer.from(file.buffer).toString("base64");
        let dataURI = "data:" + file.mimetype + ";base64," + b64;
        
        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
            folder: "stories",
            resource_type: "auto"
        });

        const newStory = new Story({
            userId: req.user._id,
            media: {
                url: uploadResponse.secure_url,
                public_id: uploadResponse.public_id,
                mediaType: uploadResponse.resource_type
            },
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
        });

        await newStory.save();

        // Emit event to notify followers
        const user = await User.findById(req.user._id);
        if (io) {
            io.emit("newStory", { 
                userId: req.user._id,
                username: user.username,
                profilePic: user.profilePic 
            });
        }

        res.status(201).json(newStory);
    } catch (error) {
        console.log("Error in createStory controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getStories = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const currentUser = await User.findById(currentUserId).select("following");
        
        if (!currentUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Get stories from users you follow plus your own stories
        const relevantUserIds = [...currentUser.following, currentUserId];
        
        const stories = await Story.find({ 
            userId: { $in: relevantUserIds },
            expiresAt: { $gt: new Date() } // Only non-expired stories
        })
        .populate("userId", "username profilePic")
        .sort({ createdAt: -1 });

        // Group stories by user
        const storiesByUser = {};
        stories.forEach(story => {
            if (!storiesByUser[story.userId._id]) {
                storiesByUser[story.userId._id] = {
                    user: story.userId,
                    stories: []
                };
            }
            storiesByUser[story.userId._id].stories.push(story);
        });

        res.status(200).json(Object.values(storiesByUser));
    } catch (error) {
        console.log("Error in getStories controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const viewStory = async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.user._id;

        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({ error: "Story not found" });
        }

        // Check if user has already viewed this story
        if (!story.viewers.includes(userId)) {
            story.viewers.push(userId);
            await story.save();
        }

        res.status(200).json(story);
    } catch (error) {
        console.log("Error in viewStory controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteStory = async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.user._id;

        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({ error: "Story not found" });
        }

        // Check if the user owns the story
        if (story.userId.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Unauthorized to delete this story" });
        }

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(story.media.public_id);

        // Delete from database
        await Story.findByIdAndDelete(storyId);

        res.status(200).json({ message: "Story deleted successfully" });
    } catch (error) {
        console.log("Error in deleteStory controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};