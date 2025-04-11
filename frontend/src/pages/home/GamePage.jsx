import React, { useState, useEffect } from "react";
import { useSocketContext } from "../../context/SocketContext";
import { toast } from "react-hot-toast";
import { IoSearchSharp } from "react-icons/io5";
import { FaBomb, FaTrophy, FaClock, FaUserAlt, FaTimes, FaCheck, FaGamepad, FaInfoCircle } from "react-icons/fa";
import useSearchConversation from "./useSearchConversation";

const GamePage = ({ onGameRequestUpdate }) => {
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [gameRequests, setGameRequests] = useState([]);
    const [gameState, setGameState] = useState(null);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(30);
    const [currentTurn, setCurrentTurn] = useState(null);
    const [isPlayer1, setIsPlayer1] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [opponentLeftMessage, setOpponentLeftMessage] = useState(null);
    const { socket } = useSocketContext();
    const { suggestions, loading: searchLoading, error } = useSearchConversation(search);

    useEffect(() => {
        const fetchPendingGameRequests = async () => {
            try {
                const response = await fetch(`/api/games/pending-requests`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });

                const data = await response.json();
                if (response.ok) {
                    setGameRequests(data);
                } else {
                    toast.error(data.error);
                }
            } catch (error) {
                toast.error("Error fetching pending game requests");
            }
        };

        fetchPendingGameRequests();
    }, []);

    useEffect(() => {
        localStorage.setItem("gameRequests", JSON.stringify(gameRequests));
        if (onGameRequestUpdate) {
            onGameRequestUpdate(gameRequests.length);
        }
    }, [gameRequests, onGameRequestUpdate]);

    const handleSendGameRequest = async (userId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/games/send-request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ receiverId: userId }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                socket.emit("sendGameRequest", { receiverId: userId });
                setIsPlayer1(true);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error sending game request");
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptGameRequest = async (requestId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/games/accept-request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ requestId }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                socket.emit("acceptGameRequest", { requestId });
                setGameRequests((prev) => prev.filter((req) => req._id !== requestId));
                localStorage.setItem("gameRequests", JSON.stringify(gameRequests.filter((req) => req._id !== requestId)));

                setGameState({
                    _id: requestId,
                    player1Grid: data.player1Grid,
                    player2Grid: data.player2Grid,
                    markedCells: [],
                    currentPlayer: "player1",
                    winner: null,
                    timerExpiresAt: data.timerExpiresAt,
                });
                setIsPlayer1(false);
                setCurrentTurn("player1");
                startTimer(data.timerExpiresAt);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error accepting game request");
        } finally {
            setLoading(false);
        }
    };

    const handleRejectGameRequest = async (requestId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/games/reject-request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ requestId }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                socket.emit("rejectGameRequest", { requestId });
                setGameRequests((prev) => prev.filter((req) => req._id !== requestId));
                localStorage.setItem("gameRequests", JSON.stringify(gameRequests.filter((req) => req._id !== requestId)));
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error rejecting game request");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkCell = async (number) => {
        if (!gameState) {
            console.error("No active game state");
            return;
        }

        if ((isPlayer1 && currentTurn !== "player1") || (!isPlayer1 && currentTurn !== "player2")) {
            toast.error("Not your turn!");
            return;
        }

        if (timer <= 0) {
            toast.error("Time's up! Turn has switched.");
            return;
        }

        if (gameState.markedCells.includes(number)) {
            toast.error("Cell already marked");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/games/mark-cell`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ gameId: gameState._id, number }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                socket.emit("markCell", { gameId: gameState._id, number });
                setGameState((prevState) => ({
                    ...prevState,
                    markedCells: [...prevState.markedCells, number],
                    currentPlayer: data.currentPlayer,
                    winner: data.winner,
                    timerExpiresAt: data.timerExpiresAt,
                }));
                setCurrentTurn(data.currentPlayer);
                startTimer(data.timerExpiresAt);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error marking cell");
        } finally {
            setLoading(false);
        }
    };

    const handleStopGame = async () => {
        if (!gameState) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/games/stop-game`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ gameId: gameState._id }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                socket.emit("stopGame", { gameId: gameState._id });
                setOpponentLeftMessage("You have exited the game");
                setGameState(null);
                setCurrentTurn(null);
                setTimer(30);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error stopping game");
        } finally {
            setLoading(false);
        }
    };

    const calculateTimeRemaining = (expiresAt) => {
        if (!expiresAt) return 0;
        const now = new Date();
        const expires = new Date(expiresAt);
        return Math.max(0, Math.floor((expires - now) / 1000));
    };

    const startTimer = (expiresAt) => {
        if (!expiresAt) return;

        if (window.timerInterval) {
            clearInterval(window.timerInterval);
        }

        const updateTimer = () => {
            const remaining = calculateTimeRemaining(expiresAt);
            setTimer(remaining);

            if (remaining <= 0) {
                clearInterval(window.timerInterval);
                handleTimeout();
            }
        };

        updateTimer();
        window.timerInterval = setInterval(updateTimer, 1000);
    };

    const handleTimeout = async () => {
        if (!gameState) return;

        try {
            const response = await fetch('/api/games/handle-timeout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ gameId: gameState._id }),
            });

            const data = await response.json();
            if (response.ok) {
                // Socket event will update the state
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error handling timeout");
        }
    };

    useEffect(() => {
        return () => {
            if (window.timerInterval) {
                clearInterval(window.timerInterval);
            }
        };
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on("newGameRequest", (data) => {
                setGameRequests((prev) => [...prev, data]);
                localStorage.setItem("gameRequests", JSON.stringify([...gameRequests, data]));
                toast.success("New game request received");
            });

            socket.on("gameRequestAccepted", (data) => {
                setGameState({
                    _id: data._id,
                    player1Grid: data.player1Grid,
                    player2Grid: data.player2Grid,
                    markedCells: [],
                    currentPlayer: "player1",
                    winner: null,
                    timerExpiresAt: data.timerExpiresAt,
                });
                setIsPlayer1(true);
                setCurrentTurn("player1");
                startTimer(data.timerExpiresAt);
            });

            socket.on("gameRequestRejected", () => {
                toast.error("Game request rejected");
            });

            socket.on("cellMarked", (data) => {
                setGameState((prevState) => ({
                    ...prevState,
                    markedCells: data.markedCells,
                    currentPlayer: data.currentPlayer,
                    winner: data.winner,
                    timerExpiresAt: data.timerExpiresAt,
                }));
                setCurrentTurn(data.currentPlayer);
                startTimer(data.timerExpiresAt);

                if (data.winner) {
                    const winnerMessage = data.winner === "draw" 
                        ? "Game over! It's a draw!" 
                        : `Game over! Winner: ${data.winner === (isPlayer1 ? "player1" : "player2") ? "You" : "Opponent"}`;
                    toast.success(winnerMessage);
                    setTimeout(() => {
                        setGameState(null);
                        setCurrentTurn(null);
                    }, 5000);
                }
            });

            socket.on("turnSwitched", (data) => {
                setCurrentTurn(data.currentPlayer);
                setGameState((prev) => ({ ...prev, currentPlayer: data.currentPlayer, timerExpiresAt: data.timerExpiresAt }));
                startTimer(data.timerExpiresAt);
                toast.info("Turn switched due to timeout");
            });

            socket.on("opponentLeft", (data) => {
                setOpponentLeftMessage(data.message);
                setGameState(null);
                setCurrentTurn(null);
                setTimer(30);
                toast.error(data.message);
            });
        }

        return () => {
            if (socket) {
                socket.off("newGameRequest");
                socket.off("gameRequestAccepted");
                socket.off("gameRequestRejected");
                socket.off("cellMarked");
                socket.off("turnSwitched");
                socket.off("opponentLeft");
            }
        };
    }, [socket, isPlayer1]);

    const isLineCompleted = (grid, markedCells, line) => {
        return line.every(index => markedCells.includes(grid[index]));
    };

    const getCompletedLines = (grid, markedCells) => {
        const winningCombinations = [
            [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14],
            [15, 16, 17, 18, 19], [20, 21, 22, 23, 24], // Rows
            [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22],
            [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], // Columns
            [0, 6, 12, 18, 24], [4, 8, 12, 16, 20] // Diagonals
        ];

        return winningCombinations.filter(line => isLineCompleted(grid, markedCells, line));
    };

    const getCellClass = (num, grid, markedCells, completedLines) => {
        if (markedCells.includes(num)) {
            const index = grid.indexOf(num);
            const isCompleted = completedLines.some(line => line.includes(index));
            return isCompleted 
                ? "bg-gradient-to-br from-red-600 to-red-800 text-white shadow-lg" 
                : "bg-gradient-to-br from-yellow-400 to-yellow-600 text-gray-900 shadow-md";
        }
        return "bg-gradient-to-br from-green-500 to-green-700 text-white hover:from-green-600 hover:to-green-800 shadow-md";
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-gray-100 to-gray-200">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 shadow-lg">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold flex items-center">
                        <FaGamepad className="mr-2" /> Bingo Battle
                    </h1>
                    <button
                        onClick={() => setShowRules(!showRules)}
                        className="flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
                    >
                        <FaInfoCircle className="mr-2" />
                        {showRules ? "Hide Rules" : "Game Rules"}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col md:flex-row flex-1 p-4 gap-6 container mx-auto">
                {/* Left Panel - User Search and Game Requests */}
                <div className="w-full md:w-1/3 bg-white rounded-xl shadow-lg p-4 h-fit">
                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Search players..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <IoSearchSharp className="absolute left-3 top-3 text-gray-400" />
                    </div>

                    {/* Search Results */}
                    {suggestions.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Search Results</h3>
                            <div className="space-y-2">
                                {suggestions.map((conversation) => (
                                    <div
                                        key={conversation?._id}
                                        className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-all"
                                        onClick={() => setSelectedUser(conversation)}
                                    >
                                        <img
                                            src={conversation?.profilePic || "/default-avatar.png"}
                                            alt={conversation?.fullName || "User"}
                                            className="w-10 h-10 rounded-full object-cover border-2 border-indigo-100"
                                        />
                                        <div className="ml-3">
                                            <p className="font-medium text-gray-900">{conversation?.fullName || "Unknown User"}</p>
                                            <p className="text-sm text-gray-500">@{conversation?.username || "unknown"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Selected User */}
                    {selectedUser && (
                        <div className="mb-6 bg-indigo-50 rounded-lg p-4">
                            <div className="flex items-center mb-3">
                                <img
                                    src={selectedUser?.profilePic || "/default-avatar.png"}
                                    alt={selectedUser?.fullName || "User"}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200"
                                />
                                <div className="ml-3">
                                    <p className="font-semibold text-gray-900">{selectedUser?.fullName || "Unknown User"}</p>
                                    <p className="text-sm text-indigo-600">@{selectedUser?.username || "unknown"}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleSendGameRequest(selectedUser._id)}
                                className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center"
                                disabled={loading}
                            >
                                {loading ? (
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <FaGamepad className="mr-2" />
                                )}
                                {loading ? "Sending..." : "Challenge to Bingo"}
                            </button>
                        </div>
                    )}

                    {/* Game Requests */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Pending Requests</h3>
                        {gameRequests.length > 0 ? (
                            <div className="space-y-3">
                                {gameRequests.map((request) => (
                                    <div key={request?._id} className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-center mb-2">
                                            <img
                                                src={request?.sender?.profilePic || "/default-avatar.png"}
                                                alt={request?.sender?.fullName || "User"}
                                                className="w-10 h-10 rounded-full object-cover border-2 border-indigo-100"
                                            />
                                            <div className="ml-3">
                                                <p className="font-medium text-gray-900">{request?.sender?.fullName || "Unknown User"}</p>
                                                <p className="text-xs text-gray-500">Challenged you to Bingo</p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleAcceptGameRequest(request._id)}
                                                className="flex-1 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all flex items-center justify-center"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <FaCheck className="mr-1" />
                                                )}
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleRejectGameRequest(request._id)}
                                                className="flex-1 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all flex items-center justify-center"
                                                disabled={loading}
                                            >
                                                <FaTimes className="mr-1" />
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No pending game requests</p>
                        )}
                    </div>
                </div>

                {/* Right Panel - Game Board */}
                <div className="flex-1 bg-white rounded-xl shadow-lg p-6">
                    {opponentLeftMessage ? (
                        <div className="text-center py-10">
                            <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
                                <FaBomb className="text-red-500 text-4xl" />
                            </div>
                            <h2 className="text-2xl font-bold text-red-600 mb-2">Game Ended</h2>
                            <p className="text-gray-600">{opponentLeftMessage}</p>
                            <button
                                onClick={() => setOpponentLeftMessage(null)}
                                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                            >
                                Back to Game
                            </button>
                        </div>
                    ) : gameState ? (
                        <div>
                            {/* Game Header */}
                            <div className="flex flex-col items-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">Bingo Battle</h1>
                                
                                {gameState.winner ? (
                                    <div className="text-center mb-6">
                                        <div className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 px-6 py-3 rounded-full shadow-lg mb-4">
                                            <FaTrophy className="mr-2 text-2xl" />
                                            <span className="text-xl font-bold">
                                                {gameState.winner === "draw" ? (
                                                    "It's a Draw!"
                                                ) : (
                                                    gameState.winner === (isPlayer1 ? "player1" : "player2") ? (
                                                        "You Win!"
                                                    ) : (
                                                        "You Lost!"
                                                    )
                                                )}
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleStopGame}
                                            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all"
                                        >
                                            Back to Lobby
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center mb-4">
                                        <div className={`inline-flex items-center px-4 py-2 rounded-full mb-2 ${
                                            (isPlayer1 && currentTurn === "player1") || (!isPlayer1 && currentTurn === "player2") 
                                                ? "bg-green-100 text-green-800" 
                                                : "bg-red-100 text-red-800"
                                        }`}>
                                            <FaUserAlt className="mr-2" />
                                            <span className="font-semibold">
                                                {(isPlayer1 && currentTurn === "player1") || (!isPlayer1 && currentTurn === "player2") 
                                                    ? "Your Turn" 
                                                    : "Opponent's Turn"}
                                            </span>
                                        </div>
                                        <div className="flex items-center bg-gray-100 px-4 py-2 rounded-full">
                                            <FaClock className="mr-2 text-indigo-600" />
                                            <span className="font-bold text-gray-700">{timer} seconds left</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Game Board */}
                            <div className="flex justify-center">
                                <div className="w-full max-w-md">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">Your Bingo Card</h3>
                                        <div className="grid grid-cols-5 gap-2">
                                            {(isPlayer1 ? gameState.player1Grid : gameState.player2Grid).map((num, index) => {
                                                const completedLines = getCompletedLines(
                                                    isPlayer1 ? gameState.player1Grid : gameState.player2Grid,
                                                    gameState.markedCells
                                                );
                                                return (
                                                    <div
                                                        key={index}
                                                        className={`aspect-square flex items-center justify-center font-bold text-lg rounded-lg cursor-pointer transition-all transform hover:scale-105 ${
                                                            getCellClass(
                                                                num,
                                                                isPlayer1 ? gameState.player1Grid : gameState.player2Grid,
                                                                gameState.markedCells,
                                                                completedLines
                                                            )
                                                        }`}
                                                        onClick={() => !gameState.winner && handleMarkCell(num)}
                                                    >
                                                        {num}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!gameState.winner && (
                                <div className="flex justify-center mt-6">
                                    <button
                                        onClick={handleStopGame}
                                        className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all flex items-center"
                                        disabled={loading}
                                    >
                                        <FaTimes className="mr-2" />
                                        {loading ? "Ending Game..." : "End Game"}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="inline-block p-4 bg-indigo-100 rounded-full mb-4">
                                <FaGamepad className="text-indigo-600 text-4xl" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Active Game</h2>
                            <p className="text-gray-600 mb-6">Search for a player and send them a challenge!</p>
                            <button
                                onClick={() => setShowRules(true)}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                            >
                                View Game Rules
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Game Rules Modal */}
            {showRules && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div 
                        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-800">Bingo Battle Rules</h2>
                            <button 
                                onClick={() => setShowRules(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes className="text-xl" />
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="bg-indigo-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-indigo-800 text-lg mb-2">Game Request</h3>
                                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                    <li>Send or accept a request to start a game</li>
                                    <li>You can only challenge players in your friends/followers list</li>
                                    <li>Pending requests will appear in the left panel</li>
                                </ul>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-blue-800 text-lg mb-2">Game Setup</h3>
                                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                    <li>Each player gets a unique 5x5 Bingo grid (25 numbers)</li>
                                    <li>Numbers range from 1 to 25 with no duplicates</li>
                                    <li>Player who accepts the request goes first</li>
                                </ul>
                            </div>

                            <div className="bg-green-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-green-800 text-lg mb-2">How to Play</h3>
                                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                    <li>On your turn, click any unmarked number on your grid</li>
                                    <li>You have <span className="font-bold">30 seconds</span> per turn</li>
                                    <li>If time runs out, your turn is skipped automatically</li>
                                    <li>Marked numbers turn gold and cannot be changed</li>
                                </ul>
                            </div>

                            <div className="bg-yellow-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-yellow-800 text-lg mb-2">Winning the Game</h3>
                                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                    <li>Complete <span className="font-bold">5 full lines</span> to win</li>
                                    <li>Lines can be horizontal, vertical, or diagonal</li>
                                    <li>Completed lines turn red automatically</li>
                                    <li>First to 5 lines wins, or the game ends in a draw if grids are filled</li>
                                </ul>
                            </div>

                            <div className="text-center pt-4">
                                <button
                                    onClick={() => setShowRules(false)}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                                >
                                    Got It!
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GamePage;  





