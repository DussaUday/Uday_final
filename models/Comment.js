// models/Comment.js
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the user who commented
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true }, // Reference to the post
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Comment", commentSchema);
