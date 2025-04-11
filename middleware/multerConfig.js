import multer from "multer";
import fs from "fs";
import path from "path";


const storage = multer.memoryStorage(); // Store the file in memory

//const uploadDir = path.join(process.cwd(), "uploads");

// In your upload middleware
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image and video files are allowed"), false);
        }
    }
});

export default upload;
