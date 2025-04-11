import React, { useEffect, useState, useRef } from "react";
import usePost from "../../hooks/usePost";
import { BsTrash, BsHeart, BsChat } from "react-icons/bs";

const UserPosts = () => {
    const { currentUserPosts, getCurrentUserPosts, deletePost, likePost, commentPost } = usePost();
    const [selectedPost, setSelectedPost] = useState(null);
    const [comment, setComment] = useState("");
    const modalRef = useRef(null);

    useEffect(() => {
        getCurrentUserPosts();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setSelectedPost(null);
            }
        };

        if (selectedPost) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [selectedPost]);

    const handleLike = async (postId) => {
        await likePost(postId);
    };

    const handleComment = async (postId) => {
        if (!comment) return;
        await commentPost(postId, comment);
        setComment("");
    };

    const togglePostModal = (post) => {
        setSelectedPost(post);
    };

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Your Posts</h2>
            <div className="grid grid-cols-3 gap-2">
                {Array.isArray(currentUserPosts) && currentUserPosts.map((post) => (
                    <div
                        key={post._id}
                        className="cursor-pointer aspect-square overflow-hidden rounded-lg"
                        onClick={() => togglePostModal(post)}
                    >
                        {post.media.mediaType === 'video' ? (
                            <video
                                src={post.media.url}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src={post.media.url}
                                alt="Post"
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                ))}
            </div>

            {selectedPost && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div ref={modalRef} className="bg-white p-4 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center mb-2">
                            <img
                                src={selectedPost.userId.profilePic}
                                alt={selectedPost.userId.username}
                                className="w-10 h-10 rounded-full mr-2"
                            />
                            <span className="font-bold">{selectedPost.userId.username}</span>
                        </div>
                        {selectedPost.media.mediaType === 'video' ? (
                            <video
                                src={selectedPost.media.url}
                                controls
                                className="w-full rounded-lg mb-2"
                            />
                        ) : (
                            <img
                                src={selectedPost.media.url}
                                alt="Post"
                                className="w-full rounded-lg mb-2"
                            />
                        )}
                        <p className="mb-2">{selectedPost.caption}</p>
                        <div className="flex items-center mb-2">
                            <button
                                className={`flex items-center mr-4 ${selectedPost.likes.includes(localStorage.getItem("userId")) ? "text-red-500" : ""}`}
                                onClick={() => handleLike(selectedPost._id)}
                            >
                                <BsHeart className="mr-1" />
                                {selectedPost.likes.length}
                            </button>
                            <button
                                className="flex items-center"
                                onClick={() => setSelectedPost({ ...selectedPost, showComments: !selectedPost.showComments })}
                            >
                                <BsChat className="mr-1" />
                                {selectedPost.comments.length}
                            </button>
                        </div>
                        {selectedPost.showComments && (
                            <div className="mt-4">
                                <h3 className="font-bold mb-4">Comments:</h3>
                                <div className="max-h-40 overflow-y-auto">
                                    {selectedPost.comments.map((comment, index) => (
                                        <div key={index} className="mt-2">
                                            <span className="font-bold">{comment.userId.username}: </span>
                                            <span>{comment.comment}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        placeholder="Add a comment..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />
                                    <button
                                        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md w-full"
                                        onClick={() => handleComment(selectedPost._id)}
                                    >
                                        Comment
                                    </button>
                                </div>
                            </div>
                        )}
                        <button
                            className="mt-2 text-red-500 flex items-center justify-center w-full"
                            onClick={() => deletePost(selectedPost._id)}
                        >
                            <BsTrash className="mr-1" />
                            Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserPosts;