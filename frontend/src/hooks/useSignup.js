import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";

const useSignup = () => {
	const [loading, setLoading] = useState(false);
	const { setAuthUser } = useAuthContext();
  
	const signup = async ({ fullName, username, password, confirmPassword, gender, profilePic,dob }) => {
	  const success = handleInputErrors({ fullName, username, password, confirmPassword, gender,dob });
	  if (!success) return;
  
	  setLoading(true);
	  try {
		const formData = new FormData();
		formData.append("fullName", fullName);
		formData.append("username", username);
		formData.append("password", password);
		formData.append("confirmPassword", confirmPassword);
		formData.append("gender", gender);
		formData.append("dob", dob);
		if (profilePic) {
		  formData.append("profilePic", profilePic);
		}
  
		const res = await fetch("/api/auth/signup", {
		  method: "POST",
		  body: formData,
		});
  
		const data = await res.json();
		if (data.error) {
		  throw new Error(data.error);
		}
		localStorage.setItem("chat-user", JSON.stringify(data));
		setAuthUser(data);
	  } catch (error) {
		toast.error(error.message);
	  } finally {
		setLoading(false);
	  }
	};
  
	return { loading, signup };
  };
  export default useSignup;
  
  function handleInputErrors({ fullName, username, password, confirmPassword, gender, dob }) {
	if (!fullName || !username || !password || !confirmPassword || !gender || !dob) {
	  toast.error("Please fill in all fields");
	  return false;
	}
  
	if (password !== confirmPassword) {
	  toast.error("Passwords do not match");
	  return false;
	}
  
	if (password.length < 6) {
	  toast.error("Password must be at least 6 characters");
	  return false;
	}
	const userDob = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - userDob.getFullYear();
  if (age < 13) {
    toast.error("You must be at least 13 years old to sign up");
    return false;
  }
	return true;
  }
  