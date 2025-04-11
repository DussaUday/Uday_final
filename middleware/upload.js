import multer from "multer";
import fs from "fs";
import path from "path";

export const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Temporary storage for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Unique filename
  },
});

const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory as buffers
  limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});
const uploadDir = path.join(process.cwd(), "uploads");
export const cleanupUploads = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Error deleting file:", err);
    } else {
      console.log("File deleted:", filePath);
    }
  });
};
export default upload;
