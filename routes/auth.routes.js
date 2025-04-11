import express from "express";
import { login, logout, signup , forgotPassword, editProfile} from "../controllers/auth.controller.js";
import { deleteAccount, getUserProfile } from "../controllers/auth.controller.js";
import upload from "../middleware/multerConfig.js"; // Ensure this path is correct
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/signup", upload.single("profilePic"), signup);

router.post("/login", login);

router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.delete("/delete-account", deleteAccount);
router.put("/edit-profile/:userId", protectRoute, upload.single("profilePic"), editProfile);

export default router;
