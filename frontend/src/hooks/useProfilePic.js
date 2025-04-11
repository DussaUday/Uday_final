import { useState } from "react";
import { uploadToCloudinary } from "../utils/cloudinary";
const useProfilePic = () => {
    const [profilePic, setProfilePic] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [uploadedUrl, setUploadedUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const handleProfilePicChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePic(file);

            // Use FileReader to generate a preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);

            // Upload the file to Cloudinary
            setIsUploading(true);
            const url = await uploadToCloudinary(file);
            if (url) {
                print(url);
                setUploadedUrl(url);
            }
            setIsUploading(false);
        }
    };

    return { profilePic, handleProfilePicChange, previewUrl, uploadedUrl, isUploading };
};

export default useProfilePic;