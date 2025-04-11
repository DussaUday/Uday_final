import User from "../models/user.model.js";

export const getUsersForSidebar = async (req, res) => {
	try {
		const loggedInUserId = req.user._id;

		const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

		res.status(200).json(filteredUsers);
	} catch (error) {
		console.error("Error in getUsersForSidebar: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
// controllers/user.controller.js
export const blockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        if (userId === currentUserId.toString()) {
            return res.status(400).json({ error: "Cannot block yourself" });
        }

        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            return res.status(404).json({ error: "Current user not found" });
        }

        const userToBlock = await User.findById(userId);
        if (!userToBlock) {
            return res.status(404).json({ error: "User to block not found" });
        }

        const isBlocked = currentUser.blockedUsers.includes(userId);
        if (isBlocked) {
            currentUser.blockedUsers = currentUser.blockedUsers.filter(id => id.toString() !== userId);
            await currentUser.save();
            io.emit("userUnblocked", { unblockedUserId: userId });
            return res.status(200).json({ message: "User unblocked successfully", blocked: false });
        } else {
            currentUser.blockedUsers.push(userId);
            await currentUser.save();
            io.emit("userBlocked", { blockedUserId: userId });
            return res.status(200).json({ message: "User blocked successfully", blocked: true });
        }
    } catch (error) {
        console.error("Error blocking/unblocking user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
export const isUserBlocked = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            return res.status(404).json({ error: "Current user not found" });
        }

        const isBlocked = currentUser.blockedUsers.includes(userId);
        res.status(200).json({ blocked: isBlocked });
    } catch (error) {
        console.error("Error checking if user is blocked:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
// controllers/user.controller.js
export const followUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        if (userId === currentUserId.toString()) {
            return res.status(400).json({ error: "Cannot follow yourself" });
        }

        const userToFollow = await User.findById(userId);
        const currentUser = await User.findById(currentUserId);

        if (!userToFollow || !currentUser) {
            return res.status(404).json({ error: "User not found" });
        }

        if (currentUser.following.includes(userId)) {
            currentUser.following = currentUser.following.filter(id => id.toString() !== userId);
            userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== currentUserId);
            await currentUser.save();
            await userToFollow.save();
            return res.status(200).json({ message: "Unfollowed successfully", following: false });
        } else {
            currentUser.following.push(userId);
            userToFollow.followers.push(currentUserId);
            await currentUser.save();
            await userToFollow.save();
            return res.status(200).json({ message: "Followed successfully", following: true });
        }
    } catch (error) {
        console.error("Error following/unfollowing user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
export const sendFollowRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        if (userId === currentUserId.toString()) {
            return res.status(400).json({ error: "Cannot send follow request to yourself" });
        }

        const userToFollow = await User.findById(userId);
        const currentUser = await User.findById(currentUserId);

        if (!userToFollow || !currentUser) {
            return res.status(404).json({ error: "User not found" });
        }

        if (userToFollow.followRequests.includes(currentUserId)) {
            return res.status(400).json({ error: "Follow request already sent" });
        }

        userToFollow.followRequests.push(currentUserId);
        await userToFollow.save();

        res.status(200).json({ message: "Follow request sent successfully" });
    } catch (error) {
        console.error("Error sending follow request:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const acceptFollowRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const currentUser = await User.findById(currentUserId);
        const userToFollow = await User.findById(userId);

        if (!currentUser || !userToFollow) {
            return res.status(404).json({ error: "User not found" });
        }

        if (!currentUser.followRequests.includes(userId)) {
            return res.status(400).json({ error: "No follow request from this user" });
        }

        currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== userId);
        currentUser.followers.push(userId);
        userToFollow.following.push(currentUserId);

        await currentUser.save();
        await userToFollow.save();

        res.status(200).json({ message: "Follow request accepted successfully" });
    } catch (error) {
        console.error("Error accepting follow request:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const rejectFollowRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const currentUser = await User.findById(currentUserId);

        if (!currentUser) {
            return res.status(404).json({ error: "User not found" });
        }

        if (!currentUser.followRequests.includes(userId)) {
            return res.status(400).json({ error: "No follow request from this user" });
        }

        currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== userId);
        await currentUser.save();

        res.status(200).json({ message: "Follow request rejected successfully" });
    } catch (error) {
        console.error("Error rejecting follow request:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
// controllers/user.controller.js
export const checkFollowStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            return res.status(404).json({ error: "Current user not found" });
        }

        const isFollowing = currentUser.following.includes(userId);
        const hasSentRequest = currentUser.followRequests.includes(userId);

        res.status(200).json({ isFollowing, hasSentRequest });
    } catch (error) {
        console.error("Error checking follow status:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
// controllers/user.controller.js
export const unfollowUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        if (userId === currentUserId.toString()) {
            return res.status(400).json({ error: "Cannot unfollow yourself" });
        }

        const userToUnfollow = await User.findById(userId);
        const currentUser = await User.findById(currentUserId);

        if (!userToUnfollow || !currentUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if the current user is following the user to unfollow
        if (!currentUser.following.includes(userId)) {
            return res.status(400).json({ error: "You are not following this user" });
        }

        // Remove the user from the current user's following list
        currentUser.following = currentUser.following.filter(id => id.toString() !== userId);
        await currentUser.save();

        // Remove the current user from the other user's followers list
        userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== currentUserId);
        await userToUnfollow.save();

        // Emit a socket event to notify the server and other clients
        io.emit("userUnfollowed", { unfollowerId: currentUserId, unfollowedUserId: userId });

        res.status(200).json({ message: "Unfollowed successfully", following: false });
    } catch (error) {
        console.error("Error unfollowing user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
