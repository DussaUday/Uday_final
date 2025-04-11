import express from "express";
import { 
    createPost, 
    getPosts, 
    likePost, 
    commentPost, 
    deletePost, 
    getCurrentUserPosts,
    createStory,
    getStories,
    viewStory,
    deleteStory,
    getUserPosts
} from "../controllers/post.controller.js";
import protectRoute from "../middleware/protectRoute.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Post routes
router.post("/create", protectRoute, upload.single("media"), createPost);
router.get("/getPosts", protectRoute, getPosts);
router.post("/like/:postId", protectRoute, likePost);
router.post("/comment/:postId", protectRoute, commentPost);
router.delete("/delete/:postId", protectRoute, deletePost);
router.get("/current-user", protectRoute, getCurrentUserPosts);
router.get("/:userId/posts", protectRoute, getUserPosts);
// Story routes
router.post("/stories", protectRoute, upload.single("media"), createStory);
router.get("/stories", protectRoute, getStories);
router.post("/stories/:storyId/view", protectRoute, viewStory);
router.delete("/stories/:storyId", protectRoute, deleteStory);

export default router;