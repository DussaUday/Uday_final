import { useEffect } from "react";
import { useSocketContext } from "../context/SocketContext";

const usePostSocketListeners = (setPosts, setCurrentUserPosts) => {
    const { socket } = useSocketContext();

    useEffect(() => {
        if (socket) {
            // Listen for post liked event
            socket.on("postLiked", ({ postId, likes }) => {
              console.log("Post liked:", postId, likes); // Debugging
              setPosts((prevPosts) =>
                  prevPosts.map((post) =>
                      post._id === postId ? { ...post, likes } : post
                  )
              );
              setCurrentUserPosts((prevPosts) =>
                  prevPosts.map((post) =>
                      post._id === postId ? { ...post, likes } : post
                  )
              );
          });

            // Listen for post commented event
            socket.on("postCommented", ({ postId, comments }) => {
                console.log("Post commented:", postId, comments); // Debugging
                setPosts((prevPosts) =>
                    prevPosts.map((post) =>
                        post._id === postId ? { ...post, comments } : post
                    )
                );
                setCurrentUserPosts((prevPosts) =>
                    prevPosts.map((post) =>
                        post._id === postId ? { ...post, comments } : post
                    )
                );
            });

            // Listen for post deleted event
            socket.on("postDeleted", ({ postId }) => {
                console.log("Post deleted:", postId); // Debugging
                setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
                setCurrentUserPosts((prevPosts) =>
                    prevPosts.filter((post) => post._id !== postId)
                );
            });

            // Cleanup listeners on unmount
            return () => {
                socket.off("postLiked");
                socket.off("postCommented");
                socket.off("postDeleted");
            };
        }
    }, [socket, setPosts, setCurrentUserPosts]);
};

export default usePostSocketListeners;