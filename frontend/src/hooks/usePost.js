        import { useState } from "react";
        import { useAuthContext } from "../context/AuthContext";
        import { useSocketContext } from "../context/SocketContext";
        import usePostSocketListeners from "./usePostSocketListeners";

        const usePost = () => {
            const [loading, setLoading] = useState(false);
            const [posts, setPosts] = useState([]);
            
            const { authUser } = useAuthContext();
            const { socket } = useSocketContext() || {};
            const [currentUserPosts, setCurrentUserPosts] = useState([]);

            // Initialize socket listeners
            usePostSocketListeners(setPosts, setCurrentUserPosts);

            const createPost = async (formData) => {
                setLoading(true);
                try {
                    const res = await fetch("/api/posts/create", {
                        method: "POST",
                        body: formData,
                        headers: {
                            Authorization: `Bearer ${authUser.token}`,
                        },
                    });
                    const data = await res.json();
                    if (data.error) throw new Error(data.error);
                    
                    // Update state with the new post
                    setPosts([data, ...posts]);
                    setCurrentUserPosts([data, ...currentUserPosts]);
                    
                    return true; // Indicate success
                } catch (error) {
                    console.error("Error creating post:", error);
                    return false; // Indicate failure
                } finally {
                    setLoading(false);
                }
            };

            const getPosts = async () => {
                setLoading(true);
                try {
                    const res = await fetch("/api/posts/getPosts", {
                        headers: {
                            Authorization: `Bearer ${authUser.token}`,
                        },
                    });
            
                    if (!res.ok) {
                        throw new Error(`Failed to fetch posts: ${res.statusText}`);
                    }
            
                    const data = await res.json();
                    if (data.error) throw new Error(data.error);
                    setPosts(data);
                } catch (error) {
                    console.error("Error fetching posts:", error);
                    // Display a user-friendly error message
                    alert("Failed to fetch posts. Please try again later.");
                } finally {
                    setLoading(false);
                }
            };

            const likePost = async (postId) => {
                try {
                    const res = await fetch(`/api/posts/like/${postId}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${authUser.token}`,
                        },
                    });
                    const data = await res.json();
                    if (data.error) throw new Error(data.error);
                    setPosts((prevPosts) =>
                        prevPosts.map((post) =>
                            post._id === postId ? { ...post, likes: data.likes } : post
                        )
                    );
                } catch (error) {
                    console.error("Error liking post:", error);
                }
            };

            const commentPost = async (postId, comment) => {
                try {
                    const res = await fetch(`/api/posts/comment/${postId}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${authUser.token}`,
                        },
                        body: JSON.stringify({ comment }),
                    });
                    const data = await res.json();
                    if (data.error) throw new Error(data.error);
                    
                    setPosts(prevPosts =>
                        prevPosts.map(post =>
                            post._id === postId 
                                ? { 
                                    ...post, 
                                    comments: data.comments.map(c => ({
                                        ...c,
                                        userId: c.userId || { username: "Unknown", profilePic: "/default-profile.png" }
                                    }))
                                } 
                                : post
                        )
                    );
                } catch (error) {
                    console.error("Error commenting on post:", error);
                }
            };

            const deletePost = async (postId) => {
                try {
                    const res = await fetch(`/api/posts/delete/${postId}`, {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${authUser.token}`,
                        },
                    });
                    const data = await res.json();
                    if (data.error) throw new Error(data.error);
                    setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
                } catch (error) {
                    console.error("Error deleting post:", error);
                }
            };

            const getCurrentUserPosts = async () => {
                setLoading(true);
                try {
                    const res = await fetch("/api/posts/current-user", {
                        headers: {
                            Authorization: `Bearer ${authUser.token}`,
                        },
                    });
                    const data = await res.json();
                    if (data.error) throw new Error(data.error);
                    if (!data.posts || data.posts.length === 0) {
                        console.log("No posts found for the current user");
                        setCurrentUserPosts([]);
                        return;
                    }
                    setCurrentUserPosts(data.posts);
                } catch (error) {
                    console.error("Error fetching current user posts:", error);
                } finally {
                    setLoading(false);
                }
            };
            const createStory = async (formData) => {
                setLoading(true);
                try {
                    const res = await fetch("/api/posts/stories", {
                        method: "POST",
                        body: formData,
                        headers: {
                            Authorization: `Bearer ${authUser.token}`,
                        },
                    });
                    const data = await res.json();
                    if (data.error) throw new Error(data.error);
                    return true;
                } catch (error) {
                    console.error("Error creating story:", error);
                    return false;
                } finally {
                    setLoading(false);
                }
            };
            
            const getStories = async () => {
                setLoading(true);
                try {
                    const res = await fetch("/api/posts/stories", {
                        headers: {
                            Authorization: `Bearer ${authUser.token}`,
                        },
                    });
                    const data = await res.json();
                    if (data.error) throw new Error(data.error);
                    return data;
                } catch (error) {
                    console.error("Error fetching stories:", error);
                    return [];
                } finally {
                    setLoading(false);
                }
            };
            
            const viewStory = async (storyId) => {
                try {
                    await fetch(`/api/posts/stories/${storyId}/view`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${authUser.token}`,
                        },
                    });
                } catch (error) {
                    console.error("Error viewing story:", error);
                }
            };
            const deleteStory = async (storyId) => {
                try {
                    const res = await fetch(`/api/posts/stories/${storyId}`, {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${authUser.token}`,
                        },
                    });
                    const data = await res.json();
                    if (data.error) throw new Error(data.error);
                    return true;
                } catch (error) {
                    console.error("Error deleting story:", error);
                    return false;
                }
            };

            return { loading, posts, currentUserPosts, createPost, getPosts, getCurrentUserPosts, likePost, commentPost, deletePost,createStory,getStories,viewStory, deleteStory };
        };

        export default usePost;