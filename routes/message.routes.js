import express from "express";
import { getMessages, sendMessage, likeMessage, deleteMessage , getLastMessage, getUsersForSidebar} from "../controllers/message.controller.js";
import protectRoute from "../middleware/protectRoute.js";
import multer from "multer";
import fs from "fs";
import path from "path";


const router = express.Router();
export const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Temporary storage for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Unique filename
  },
});
  const upload = multer({ storage: multer.memoryStorage() });
  
router.get("/:id", protectRoute, getMessages);
router.get("/", protectRoute, getUsersForSidebar);
router.post("/send/:id", protectRoute, upload.single("file"), sendMessage); // Add Multer middle
router.post("/like/:messageId", protectRoute, likeMessage);
router.delete("/delete/:messageId", protectRoute, deleteMessage);
router.get("/last/:id", getLastMessage);
export default router;