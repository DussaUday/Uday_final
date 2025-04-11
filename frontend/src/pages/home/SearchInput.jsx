import { useState } from "react";
import { IoSearchSharp } from "react-icons/io5";
import useConversation from "../../zustand/useConversation";
import toast from "react-hot-toast";
import useSearchConversation from "../../hooks/useSearchConversation";
import SendFollowRequest from "./SendFollowRequest";

const SearchPage = () => {
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const { setSelectedConversation } = useConversation();
    const { suggestions, loading, error } = useSearchConversation(search);

    const handleSuggestionClick = (conversation) => {
        setSelectedUser(conversation);
        setSearch("");
    };

    if (error) {
        toast.error("Failed to fetch conversations");
    }

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] bg-gray-50">
            {/* Search Section */}
            <div className="w-full md:w-1/3 p-4 md:p-6 bg-white border-r border-gray-200">
                <div className="mb-6">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">Discover People</h1>
                    <p className="text-sm md:text-base text-gray-500">Find and connect with people</p>
                </div>
                
                <form className="relative mb-6">
                    <div className="flex items-center">
                        <input
                            type="text"
                            placeholder="Search by name or username..."
                            className="w-full p-2 md:p-3 pl-10 md:pl-12 pr-4 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <IoSearchSharp className="absolute left-3 md:left-4 text-gray-400 text-lg md:text-xl" />
                    </div>
                </form>

                {/* Suggestions Dropdown */}
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : suggestions.length > 0 ? (
                    <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto">
                        {suggestions.map((conversation) => (
                            <div
                                key={conversation._id}
                                className="flex items-center p-2 md:p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors duration-200"
                                onClick={() => handleSuggestionClick(conversation)}
                            >
                                <img
                                    src={conversation.profilePic}
                                    alt={conversation.fullName}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                />
                                <div className="ml-3">
                                    <p className="font-semibold text-gray-800 text-sm md:text-base">{conversation.fullName}</p>
                                    <p className="text-xs md:text-sm text-gray-500">@{conversation.username}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 md:py-12">
                        <div className="text-gray-400 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 md:h-12 w-10 md:w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 text-sm md:text-base">Search for people to connect with</p>
                        <p className="text-xs md:text-sm text-gray-400 mt-1">Try searching by name or username</p>
                    </div>
                )}
            </div>

            {/* Request Page */}
            <div className="flex-1 p-4 md:p-8 bg-gray-50 flex justify-center items-center">
                {selectedUser ? (
                    <div className="w-full max-w-md">
                        <SendFollowRequest 
                            userId={selectedUser._id} 
                            userName={selectedUser.fullName} 
                            profilePic={selectedUser.profilePic} 
                        />
                    </div>
                ) : (
                    <div className="text-center max-w-md">
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <div className="text-gray-400 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 md:h-16 w-12 md:w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">Select a User</h3>
                            <p className="text-gray-500 text-sm md:text-base">Choose someone from the search results to view their profile</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchPage;