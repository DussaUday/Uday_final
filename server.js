import path from "path";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";
import postRoutes from "./routes/post.routes.js";
import gameRoutes from "./routes/game.routes.js"; // Import game routes

import connectToMongoDB from "./db/connectToMongoDB.js";
import { app, server } from "./socket/socket.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// PORT should be assigned after calling dotenv.config() because we need to access the env variables. Didn't realize while recording the video. Sorry for the confusion.
const PORT = process.env.PORT || 5000;

app.use(express.json()); // to parse the incoming requests with JSON payloads (from req.body)
app.use(cookieParser());
app.use(
    cors({
        origin: "https://uday-final.onrender.com/", // Allow requests from this origin
        credentials: true, // Allow cookies and credentials
    })
);


app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/games", gameRoutes);


app.use(express.static(path.join(__dirname, "/frontend/dist")));

app.get("*", (req, res) => {res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

server.listen(PORT, () => {
    connectToMongoDB();
    console.log(`Server Running on port ${PORT}`);
});


