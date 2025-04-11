import bcrypt from "bcryptjs";
import http from "http";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import generateTokenAndSetCookie from "../utils/generateToken.js";
import jwt from "jsonwebtoken";
import cloudinary from "../config/cloudinaryConfig.js"; // Ensure .js is included
import multer from "multer";

export const signup = async (req, res) => {
    try {
      const { fullName, username, password, confirmPassword, gender , dob} = req.body;
  
      if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords don't match" });
      }
  
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
  
      // Hash Password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      // Upload Profile Pic to Cloudinary if provided
      let uploadedProfilePic = "";
      if (req.file) {
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
          folder: "profile_pictures",
          transformation: [{ width: 500, height: 500, crop: "fill" }],
        });
        uploadedProfilePic = uploadResponse.secure_url;
      }
  
      // Fallback default avatar
      const defaultProfilePic =
        gender === "male"
          ? `https://avatar.iran.liara.run/public/boy?username=${username}`
          : `https://avatar.iran.liara.run/public/girl?username=${username}`;
  
      const newUser = new User({
        fullName,
        username,
        password: hashedPassword,
        gender,
        profilePic: uploadedProfilePic || defaultProfilePic, // Use uploaded pic or default
        dob,
      });
  
      // Generate JWT Token
      generateTokenAndSetCookie(newUser._id, res);
      await newUser.save();
  
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        dob: newUser.dob,
        profilePic: newUser.profilePic,
      });
    } catch (error) {
      console.error("Error in signup controller:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };



export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "30d", // 30 days
        });

        // Send the token in a cookie:
        res.cookie("jwt", token, {
            httpOnly: true,
            sameSite: 'strict', // Or 'lax' in development if needed
            secure: process.env.NODE_ENV === 'production', // Only true in production with HTTPS
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        res.status(200).json({ user: {
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            profilePic: user.profilePic,
            gender: user.gender,
        } }); // Send user data (without the token)

    } catch (error) {
        console.error("Error in login controller:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const logout = (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 0 });
		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};



//profile


export const getUserProfile = async (req, res) => {
	try {
		const { id } = req.params;
		const user = await User.findById(id).select("-password");
		if (!user) return res.status(404).json({ error: "User not found" });
		res.json(user);
	} catch (error) {
		console.error("Error fetching user profile:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const forgotPassword = async (req, res) => {
  try {
    const { username, dob, newPassword } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (new Date(user.dob).toISOString() !== new Date(dob).toISOString()) {
      return res.status(400).json({ error: "Incorrect Date of Birth" });
    }

    // Hash the new password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error in forgotPassword: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


//deletion 


export const deleteAccount = async (req, res) => {
  try {
      if (!req.user || !req.user._id) {
          return res.status(401).json({ message: "User not authenticated" });
      }

      const userId = req.user._id;
      console.log("deleteAccount: userId:", userId); // Log the userId

      const userToDelete = await User.findById(userId);
      if (!userToDelete) {
          console.log("deleteAccount: User not found");
          return res.status(404).json({ message: "User not found" });
      }
      console.log("deleteAccount: User found:", userToDelete);

      try {
          const deleteResults = await Promise.all([
              Post.deleteMany({ user: userId }), // Delete all posts by the user
              Comment.deleteMany({ user: userId }), // Delete all comments by the user
              // ... delete other related data (e.g., likes, followers, etc.)
          ]);
          console.log("deleteAccount: Related data deletion results:", deleteResults);
      } catch (deleteError) {
          console.error("deleteAccount: Error deleting related data:", deleteError);
          // Decide how to handle this:
          // 1. Return an error (and don't delete the user):
          // return res.status(500).json({ message: "Error deleting related data" });
          // 2. Log the error and continue with user deletion (less ideal):
          console.warn("deleteAccount: Continuing with user deletion despite related data error.");
      }

      const deletedUser = await User.findByIdAndDelete(userId);
      if (!deletedUser) {
          console.log("deleteAccount: Failed to delete user");
          return res.status(500).json({ message: "Failed to delete user" });
      }

      console.log("deleteAccount: User deleted:", deletedUser);

      // Clear the JWT cookie
      res.cookie("jwt", "", { 
          maxAge: 0, 
          httpOnly: true, 
          sameSite: 'lax', // Or 'strict' in production with HTTPS
          secure: process.env.NODE_ENV === 'production' 
      });
      res.status(200).json({ message: "Account deleted successfully" });

  } catch (error) {
      console.error("deleteAccount: Error in deleteAccount controller:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
};
export const editProfile = async (req, res) => {
  try {
      const { username, password, confirmPassword } = req.body;
      const userId = req.params.userId;

      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ error: "User not found" });
      }

      if (password !== confirmPassword) {
          return res.status(400).json({ error: "Passwords don't match" });
      }

      if (username) {
          const existingUser = await User.findOne({ username });
          if (existingUser && existingUser._id.toString() !== userId) {
              return res.status(400).json({ error: "Username already exists" });
          }
          user.username = username;
      }

      if (password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(password, salt);
      }

      if (req.file) {
          const b64 = Buffer.from(req.file.buffer).toString("base64");
          let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
          const uploadResponse = await cloudinary.uploader.upload(dataURI, {
              folder: "profile_pictures",
              transformation: [{ width: 500, height: 500, crop: "fill" }],
          });
          user.profilePic = uploadResponse.secure_url;
      }

      await user.save();
      res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
      console.error("Error in editProfile controller:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
  }
};