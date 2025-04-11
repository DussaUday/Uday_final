import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { getUsersForSidebar } from "../controllers/user.controller.js";
import { getUserProfile } from "../controllers/auth.controller.js";
import { deleteAccount } from "../controllers/auth.controller.js"; 
//import { blockUser } from "../controllers/message.controller.js";
import { followUser , sendFollowRequest,acceptFollowRequest,rejectFollowRequest, checkFollowStatus, unfollowUser} from "../controllers/user.controller.js";
const router = express.Router();

router.get("/", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getUserProfile);
router.delete("/account/delete", protectRoute, deleteAccount); // Correct route!
//router.post("/block/:id",protectRoute, blockUser);
router.post("/follow/:userId", protectRoute, sendFollowRequest);
router.post("/accept-follow/:userId", protectRoute, acceptFollowRequest);
router.post("/reject-follow/:userId", protectRoute, rejectFollowRequest);
router.get("/:userId/follow-status", protectRoute, checkFollowStatus);
router.post("/unfollow/:userId", protectRoute, unfollowUser);

export default router;
