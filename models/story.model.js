import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    media: {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        mediaType: { type: String, enum: ["image", "video"], required: true }
    },
    viewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    expiresAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });

// Create TTL index for automatic expiration
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Story = mongoose.model("Story", storySchema);

export default Story;