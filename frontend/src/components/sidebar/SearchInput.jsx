import { useState, useEffect } from "react";
import { IoSearchSharp } from "react-icons/io5";
import useConversation from "../../zustand/useConversation";
import useGetConversations from "../../hooks/useGetConversations";
import toast from "react-hot-toast";

const SearchInput = () => {
    const [search, setSearch] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const { setSelectedConversation } = useConversation();
    const { conversations } = useGetConversations();

    useEffect(() => {
        if (search) {
            const filteredSuggestions = conversations.filter((conversation) =>
                conversation.fullName.toLowerCase().includes(search.toLowerCase())
            );
            setSuggestions(filteredSuggestions);
        } else {
            setSuggestions([]);
        }
    }, [search, conversations]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!search) return;
        if (search.length < 3) {
            return toast.error("Search term must be at least 3 characters long");
        }

        const conversation = conversations.find((c) =>
            c.fullName.toLowerCase().includes(search.toLowerCase())
        );

        if (conversation) {
            setSelectedConversation(conversation);
            setSearch("");
        } else {
            toast.error("No such user found!");
        }
    };

    const handleSuggestionClick = (conversation) => {
        setSelectedConversation(conversation);
        setSearch("");
        setSuggestions([]);
    };

    return (
        <div className="relative px-2">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Search users..."
                    className="input input-bordered rounded-full w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-indigo-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-blue-800"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button 
                    type="submit" 
                    className="btn btn-circle bg-indigo-500 dark:bg-blue-500 hover:bg-indigo-600 dark:hover:bg-blue-600 text-white"
                >
                    <IoSearchSharp className="w-5 h-5" />
                </button>
            </form>

            {suggestions.length > 0 && (
                <div className="absolute top-14 left-2 right-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {suggestions.map((conversation) => (
                        <div
                            key={conversation._id}
                            className="p-3 hover:bg-indigo-50 dark:hover:bg-gray-600 cursor-pointer text-gray-900 dark:text-white"
                            onClick={() => handleSuggestionClick(conversation)}
                        >
                            <div className="flex items-center">
                                <img 
                                    src={conversation.profilePic} 
                                    alt={conversation.fullName}
                                    className="w-8 h-8 rounded-full mr-3"
                                />
                                <span>{conversation.fullName}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchInput;