import { useState } from "react";
import { Link } from "react-router-dom";
import useLogin from "../../hooks/useLogin";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { loading, login } = useLogin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  return (
    <div className=''>
      <div className='w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl'>
        <h1 className='text-4xl font-bold text-center'>
          <span className='text-gray-800'>Welcome to </span>
          <span className='text-blue-600'>Socialty</span>
        </h1>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Username
            </label>
            <input
              type='text'
              placeholder='Enter username'
              className='w-full px-4 py-2 mt-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Password
            </label>
            <input
              type='password'
              placeholder='Enter Password'
              className='w-full px-4 py-2 mt-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className='flex justify-between'>
            <Link
              to='/signup'
              className='text-sm text-blue-600 hover:underline'
            >
              {"Don't"} have an account?
            </Link>
            <Link
              to='/forgot-password'
              className='text-sm text-blue-600 hover:underline'
            >
              Forgot Password?
            </Link>
          </div>

          <div>
            <button
              className='w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50'
              disabled={loading}
            >
              {loading ? (
                <span className='loading loading-spinner'></span>
              ) : (
                "Login"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default Login;