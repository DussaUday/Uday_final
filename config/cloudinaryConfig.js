import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


export const uploadToCloudinary = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "auto", // Automatically detect the file type (image, video, pdf, etc.)
    });
    return result.secure_url; // Return the URL of the uploaded file
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};


export default cloudinary;