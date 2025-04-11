import Game from "../models/game.model.js";
import User from "../models/user.model.js";

const generateBingoGrid = () => {
    const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
    numbers.sort(() => Math.random() - 0.5);
    return numbers;
};

export const sendGameRequest = async (req, res, io, userSocketMap) => {
    try {
        const { receiverId } = req.body;
        const senderId = req.user._id;

        if (receiverId === senderId.toString()) {
            return res.status(400).json({ error: "Cannot send game request to yourself" });
        }

        const sender = await User.findById(senderId).select('fullName username profilePic');
        const receiver = await User.findById(receiverId).select('fullName username profilePic');

        if (!sender || !receiver) {
            return res.status(404).json({ error: "User not found" });
        }

        const existingRequest = await Game.findOne({ sender: senderId, receiver: receiverId, status: "pending" });
        if (existingRequest) {
            return res.status(400).json({ error: "Game request already sent" });
        }

        const player1Grid = generateBingoGrid();
        let player2Grid = generateBingoGrid();

        while (JSON.stringify(player1Grid) === JSON.stringify(player2Grid)) {
            player2Grid = generateBingoGrid();
        }

        const gameRequest = new Game({
            sender: senderId,
            receiver: receiverId,
            status: "pending",
            player1Grid,
            player2Grid,
            markedCells: [],
            currentPlayer: "player1",
            winner: null,
            timerExpiresAt: null,
        });

        await gameRequest.save();

        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newGameRequest", {
                _id: gameRequest._id,
                sender: {
                    _id: sender._id,
                    fullName: sender.fullName,
                    username: sender.username,
                    profilePic: sender.profilePic,
                },
                receiver: {
                    _id: receiver._id,
                    fullName: receiver.fullName,
                    username: receiver.username,
                    profilePic: receiver.profilePic,
                },
                status: "pending",
                player1Grid,
                player2Grid,
            });
        }

        res.status(200).json({ message: "Game request sent successfully", player1Grid, player2Grid });
    } catch (error) {
        console.error("Error sending game request:", error.message, error.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const acceptGameRequest = async (req, res, io, userSocketMap) => {
    try {
        const { requestId } = req.body;
        const gameRequest = await Game.findById(requestId);

        if (!gameRequest) {
            return res.status(404).json({ error: "Game request not found" });
        }

        const timerExpiresAt = new Date();
        timerExpiresAt.setSeconds(timerExpiresAt.getSeconds() + 30);

        gameRequest.status = "accepted";
        gameRequest.timerExpiresAt = timerExpiresAt;
        await gameRequest.save();

        const senderSocketId = userSocketMap[gameRequest.sender];
        const receiverSocketId = userSocketMap[gameRequest.receiver];

        if (senderSocketId) {
            io.to(senderSocketId).emit("gameRequestAccepted", {
                _id: gameRequest._id,
                sender: gameRequest.sender,
                receiver: gameRequest.receiver,
                status: "accepted",
                player1Grid: gameRequest.player1Grid,
                player2Grid: gameRequest.player2Grid,
                currentPlayer: "player1",
                timerExpiresAt,
            });
        }

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("gameRequestAccepted", {
                _id: gameRequest._id,
                sender: gameRequest.sender,
                receiver: gameRequest.receiver,
                status: "accepted",
                player1Grid: gameRequest.player1Grid,
                player2Grid: gameRequest.player2Grid,
                currentPlayer: "player1",
                timerExpiresAt,
            });
        }

        res.status(200).json({ 
            message: "Game request accepted successfully", 
            player1Grid: gameRequest.player1Grid,
            player2Grid: gameRequest.player2Grid,
            timerExpiresAt,
        });
    } catch (error) {
        console.error("Error accepting game request:", error.message, error.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const rejectGameRequest = async (req, res, io, userSocketMap) => {
    try {
        const { requestId } = req.body;
        const gameRequest = await Game.findById(requestId);

        if (!gameRequest) {
            return res.status(404).json({ error: "Game request not found" });
        }

        gameRequest.status = "rejected";
        await gameRequest.save();

        const senderSocketId = userSocketMap[gameRequest.sender];
        if (senderSocketId) {
            io.to(senderSocketId).emit("gameRequestRejected", {
                _id: gameRequest._id,
                sender: gameRequest.sender,
                receiver: gameRequest.receiver,
                status: "rejected",
            });
        }

        res.status(200).json({ message: "Game request rejected successfully" });
    } catch (error) {
        console.error("Error rejecting game request:", error.message, error.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const markCell = async (req, res, io, userSocketMap) => {
    try {
        const { gameId, number } = req.body;
        const userId = req.user._id;

        if (!gameId || number === undefined) {
            return res.status(400).json({ error: "Missing gameId or number" });
        }

        const game = await Game.findById(gameId);

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (game.status !== "accepted") {
            return res.status(400).json({ error: "Game is not active" });
        }

        if (game.currentPlayer === "player1" && game.sender.toString() !== userId.toString()) {
            return res.status(400).json({ error: "Not your turn" });
        }

        if (game.currentPlayer === "player2" && game.receiver.toString() !== userId.toString()) {
            return res.status(400).json({ error: "Not your turn" });
        }

        if (!Array.isArray(game.markedCells)) {
            game.markedCells = [];
        }

        if (game.markedCells.includes(number)) {
            return res.status(400).json({ error: "Number already marked" });
        }

        game.markedCells.push(number);

        const winningCombinations = [
            [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14],
            [15, 16, 17, 18, 19], [20, 21, 22, 23, 24], // Rows
            [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22],
            [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], // Columns
            [0, 6, 12, 18, 24], [4, 8, 12, 16, 20] // Diagonals
        ];

        const isWinner = (markedCells, grid) => {
            let linesCompleted = 0;
            winningCombinations.forEach(combination => {
                if (combination.every(index => markedCells.includes(grid[index]))) {
                    linesCompleted++;
                }
            });
            return linesCompleted >= 5;
        };

        const player1Wins = isWinner(game.markedCells, game.player1Grid);
        const player2Wins = isWinner(game.markedCells, game.player2Grid);

        if (player1Wins && player2Wins) {
            game.winner = "draw";
        } else if (player1Wins) {
            game.winner = "player1";
        } else if (player2Wins) {
            game.winner = "player2";
        }

        if (game.winner) {
            game.status = "completed";
            game.timerExpiresAt = null;
        } else {
            game.currentPlayer = game.currentPlayer === "player1" ? "player2" : "player1";
            const timerExpiresAt = new Date();
            timerExpiresAt.setSeconds(timerExpiresAt.getSeconds() + 30);
            game.timerExpiresAt = timerExpiresAt;
        }

        await game.save();

        const senderSocketId = userSocketMap[game.sender];
        const receiverSocketId = userSocketMap[game.receiver];

        if (senderSocketId) {
            io.to(senderSocketId).emit("cellMarked", { 
                number, 
                currentPlayer: game.currentPlayer, 
                winner: game.winner,
                markedCells: game.markedCells,
                timerExpiresAt: game.timerExpiresAt
            });
        }
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("cellMarked", { 
                number, 
                currentPlayer: game.currentPlayer, 
                winner: game.winner,
                markedCells: game.markedCells,
                timerExpiresAt: game.timerExpiresAt
            });
        }

        res.status(200).json({ 
            message: "Cell marked successfully", 
            currentPlayer: game.currentPlayer, 
            winner: game.winner,
            timerExpiresAt: game.timerExpiresAt
        });
    } catch (error) {
        console.error("Error marking cell:", error.message, error.stack);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

export const stopGame = async (req, res, io, userSocketMap) => {
    try {
        const { gameId } = req.body;
        const userId = req.user._id;

        if (!gameId) {
            return res.status(400).json({ error: "Game ID is required" });
        }

        const game = await Game.findById(gameId);

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (game.sender.toString() !== userId.toString() && game.receiver.toString() !== userId.toString()) {
            return res.status(403).json({ error: "You are not part of this game" });
        }

        game.status = "stopped";
        game.timerExpiresAt = null;
        await game.save();

        const senderSocketId = userSocketMap[game.sender];
        const receiverSocketId = userSocketMap[game.receiver];

        const message = "Your opponent has exited the game";

        if (senderSocketId) {
            io.to(senderSocketId).emit("opponentLeft", { 
                message,
                gameId: game._id,
                status: "stopped"
            });
        }
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("opponentLeft", { 
                message,
                gameId: game._id,
                status: "stopped"
            });
        }

        res.status(200).json({ message: "Game stopped successfully" });
    } catch (error) {
        console.error("Error stopping game:", error.message, error.stack);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

export const handleTimeout = async (req, res, io, userSocketMap) => {
    try {
        const { gameId } = req.body;
        const game = await Game.findById(gameId);

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (game.status !== "accepted" || game.winner) {
            return res.status(400).json({ error: "Game is not active" });
        }

        game.currentPlayer = game.currentPlayer === "player1" ? "player2" : "player1";
        const timerExpiresAt = new Date();
        timerExpiresAt.setSeconds(timerExpiresAt.getSeconds() + 30);
        game.timerExpiresAt = timerExpiresAt;
        await game.save();

        const senderSocketId = userSocketMap[game.sender];
        const receiverSocketId = userSocketMap[game.receiver];

        if (senderSocketId) {
            io.to(senderSocketId).emit("turnSwitched", {
                currentPlayer: game.currentPlayer,
                timerExpiresAt: game.timerExpiresAt
            });
        }
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("turnSwitched", {
                currentPlayer: game.currentPlayer,
                timerExpiresAt: game.timerExpiresAt
            });
        }

        res.status(200).json({ 
            message: "Timeout handled successfully",
            currentPlayer: game.currentPlayer,
            timerExpiresAt: game.timerExpiresAt
        });
    } catch (error) {
        console.error("Error handling timeout:", error.message, error.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const checkGameRequestStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const existingRequest = await Game.findOne({
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId }
            ],
            status: "pending"
        });

        const hasSentRequest = !!existingRequest && existingRequest.sender.toString() === currentUserId.toString();
        const hasReceivedRequest = !!existingRequest && existingRequest.receiver.toString() === currentUserId.toString();

        res.status(200).json({ hasSentRequest, hasReceivedRequest });
    } catch (error) {
        console.error("Error checking game request status:", error.message, error.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getPendingGameRequests = async (req, res) => {
    try {
        const userId = req.user._id;

        const pendingRequests = await Game.find({
            $or: [
                { sender: userId, status: "pending" },
                { receiver: userId, status: "pending" }
            ]
        }).populate('sender receiver', 'fullName username profilePic');

        res.status(200).json(pendingRequests);
    } catch (error) {
        console.error("Error fetching pending game requests:", error.message, error.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
};