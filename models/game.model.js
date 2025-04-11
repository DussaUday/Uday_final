import mongoose from "mongoose";

const gameSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "completed", "stopped"],
        default: "pending",
    },
    player1Grid: { type: [Number], default: [] },
    player2Grid: { type: [Number], default: [] },
    markedCells: { type: [Number], default: [] },
    currentPlayer: { type: String, enum: ["player1", "player2"], default: "player1" },
    winner: { type: String, enum: ["player1", "player2", "draw"], default: null },
}, { timestamps: true });

const Game = mongoose.model("Game", gameSchema);

export default Game;