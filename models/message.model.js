import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        message: {
            type: String,
            default: "",
        },
        file: {
            type: String, // URL of the uploaded file
            default: "",
        },
        isLiked: {
            type: Boolean,
            default: false,
        },
        deleted: {
            type: Boolean,
            default: false,
        },
        read: {
            type: Boolean,
            default: false,
        },
        
    },
    { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;