import { useState } from "react";
import { BsSend, BsPaperclip, BsEmojiSmile } from "react-icons/bs";
import { IoSend } from "react-icons/io5";
import useSendMessage from "../../hooks/useSendMessage";

const MessageInput = () => {
    const [message, setMessage] = useState("");
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const { loading, sendMessage } = useSendMessage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message && !file) return;

        const formData = new FormData();
        formData.append("message", message);
        if (file) {
            formData.append("file", file);
        }

        await sendMessage(formData);
        setMessage("");
        setFile(null);
        setFilePreview(null);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (selectedFile.type.startsWith("image/")) {
                setFilePreview(URL.createObjectURL(selectedFile));
            } else if (selectedFile.type === "application/pdf") {
                setFilePreview("https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/PDF_file_icon.svg/1200px-PDF_file_icon.svg.png");
            } else if (selectedFile.type.startsWith("video/")) {
                setFilePreview(URL.createObjectURL(selectedFile));
            }
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setFilePreview(null);
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            {filePreview && (
                <div className="mb-3 relative bg-gray-600 p-2 rounded-lg">
                    {file.type.startsWith("image/") ? (
                        <img 
                            src={filePreview} 
                            alt="Preview" 
                            className="max-h-40 max-w-full rounded-md object-contain" 
                        />
                    ) : file.type.startsWith("video/") ? (
                        <video 
                            src={filePreview} 
                            className="max-h-40 max-w-full rounded-md" 
                            controls
                        />
                    ) : (
                        <div className="flex items-center p-2">
                            <img 
                                src={filePreview} 
                                alt="File preview" 
                                className="w-10 h-10 mr-2" 
                            />
                            <span className="text-white truncate">{file.name}</span>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-red-600 transition"
                    >
                        &times;
                    </button>
                </div>
            )}
            
            <div className="flex items-center bg-gray-600 rounded-full px-4 py-2 shadow-sm">
                <label className="cursor-pointer text-gray-300 hover:text-white mr-2">
                    <BsPaperclip className="text-xl" />
                    <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*, video/*, application/pdf"
                    />
                </label>
                
                <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 py-2 px-2"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                
                <button 
                    type="submit" 
                    disabled={loading || (!message && !file)}
                    className={`ml-2 p-2 rounded-full ${(!message && !file) ? 'text-gray-500' : 'text-blue-400 hover:text-blue-300'} transition`}
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <IoSend className="text-xl" />
                    )}
                </button>
            </div>
        </form>
    );
};

export default MessageInput;