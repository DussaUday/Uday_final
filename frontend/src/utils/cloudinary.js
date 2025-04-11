export const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "your_upload_preset"); // Replace with your actual Cloudinary upload preset

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/drc8bufjn/image/upload`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error("Failed to upload image");
        }

        const data = await response.json();
        return data.secure_url; // Returns the uploaded image URL
    } catch (error) {
        console.error("Error uploading image:", error);
        return null;
    }
};
