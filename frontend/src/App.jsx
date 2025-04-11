import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import SignUp from "./pages/signup/SignUp";
import { Toaster } from "react-hot-toast";
import { useAuthContext } from "./context/AuthContext";
import Profile from "./pages/profile/ProfilePage";
//import PostList from "./components/posts/PostList";
import CreatePost from "./components/posts/CreatePost";
import usePostSocketListeners from "./hooks/usePostSocketListeners";
import ForgotPassword from "./pages/login/ForgotPassword.jsx";
function App() {
	const { authUser } = useAuthContext();
	usePostSocketListeners();
	return (
		<div className='p-4 h-screen w-screen flex items-center justify-center'>
			<Routes>
				<Route path='/' element={authUser ? <Home /> : <Navigate to={"/login"} />} />
				<Route path='/login' element={authUser ? <Navigate to='/' /> : <Login />} />
				<Route path='/signup' element={authUser ? <Navigate to='/' /> : <SignUp />} />
				<Route path="/profile/:userId" element={<Profile />} />
				<Route path='/forgot-password' element={<ForgotPassword />} />
        		<Route path='/create-post' element={<CreatePost />} /> 
			</Routes>
			<Toaster />
		</div>	
	);
}

export default App;

