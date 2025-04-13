import { useState } from "react";
import { Link } from "react-router-dom";
import useLogin from "../../hooks/useLogin";

const Login = () => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { loading, login } = useLogin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  if (showLoginForm) {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-gray-100 p-4 z-50">
        <div className="min-h-full flex items-center justify-center">
          <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl">
            <button 
              onClick={() => setShowLoginForm(false)}
              className="text-blue-600 hover:underline flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Home
            </button>
            
            <h1 className='text-4xl font-bold text-center'>
              <span className='text-gray-800'>Welcome to </span>
              <span className='text-blue-600'>Sociality</span>
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
      </div>
    );
  }

  return (
    <div className="bg-white text-gray-800 font-['Poppins'] h-screen overflow-y-auto">
      {/* Navbar */}
      <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center shadow-md sticky top-0 z-10">
        <div className="text-2xl font-semibold">Sociality</div>
        <button
          className="bg-white text-blue-600 px-5 py-2 rounded-lg font-medium hover:bg-blue-100 transition"
          onClick={() => setShowLoginForm(true)}
        >
          Login
        </button>
      </nav>

      {/* Header */}
      <header className="bg-gradient-to-r from-cyan-400 to-blue-600 text-white text-center py-16 px-4">
        <h1 className="text-4xl sm:text-5xl font-bold mb-3">Welcome to Sociality</h1>
        <p className="text-lg sm:text-xl">Connect. Share. Chat. Play. All in One Place.</p>
      </header>

      {/* Features */}
      <section className="py-16 bg-gray-100 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Repeatable Feature Cards */}
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition transform hover:-translate-y-1 text-center">
            <h3 className="text-blue-600 text-xl font-semibold mb-2">🌟 Create Profile</h3>
            <p>Create an awesome profile and connect with others.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition transform hover:-translate-y-1 text-center">
            <h3 className="text-blue-600 text-xl font-semibold mb-2">🔍 Follow & Search</h3>
            <p>Find friends easily and send follow requests in one tap.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition transform hover:-translate-y-1 text-center">
            <h3 className="text-blue-600 text-xl font-semibold mb-2">💬 Chat & Stories</h3>
            <p>Real-time chat and share moments with stories.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition transform hover:-translate-y-1 text-center">
            <h3 className="text-blue-600 text-xl font-semibold mb-2">📸 Upload Posts</h3>
            <p>Share your memories through photos and videos.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition transform hover:-translate-y-1 text-center">
            <h3 className="text-blue-600 text-xl font-semibold mb-2">🎮 Play Bingo</h3>
            <p>Challenge your friends with the in-app Bingo game!</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition transform hover:-translate-y-1 text-center">
            <h3 className="text-blue-600 text-xl font-semibold mb-2">❤️ Like & Comment</h3>
            <p>Express your thoughts and show love under posts.</p>
          </div>
        </div>
      </section>

      {/* Sneak Peek Section with Toggle Button */}
      <section className="py-16 bg-blue-50 text-center px-4">
        <h2 className="text-3xl font-bold text-blue-600 mb-6">📸 Sneak Peek</h2>
        <button
          onClick={() => document.getElementById('screenshotsGrid').classList.toggle('hidden')}
          className="mb-10 bg-blue-600 text-white text-lg px-6 py-3 rounded-full shadow hover:bg-blue-700 transition"
        >
          View Sneak Peek
        </button>

        <div id="screenshotsGrid" className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 hidden">
          {/* Screenshot Images */}
          <img src="https://res.cloudinary.com/drc8bufjn/image/upload/v1744468388/message_attachments/pbszzzxtv7huibdwlza1.png" alt="Bingo Game" className="rounded-xl shadow-md border border-blue-200" />
          <img src="https://res.cloudinary.com/drc8bufjn/image/upload/v1744468402/message_attachments/tvvqynxvpafksi4xfmuv.png" alt="Profile" className="rounded-xl shadow-md border border-blue-200" />
          <img src="https://res.cloudinary.com/drc8bufjn/image/upload/v1744468412/message_attachments/qfh22u7xd9ehrg6ajc0s.png" alt="Followers" className="rounded-xl shadow-md border border-blue-200" />
          <img src="https://res.cloudinary.com/drc8bufjn/image/upload/v1744468423/message_attachments/qqk6vmksdhjeampj49fw.png" alt="Upload Post" className="rounded-xl shadow-md border border-blue-200" />
          <img src="https://res.cloudinary.com/drc8bufjn/image/upload/v1744468436/message_attachments/igpyir4v5roxmtvbacyq.png" alt="Chatbox" className="rounded-xl shadow-md border border-blue-200" />
          <img src="https://res.cloudinary.com/drc8bufjn/image/upload/v1744468450/message_attachments/u7hydhgj6lqopwcyvw0w.png" alt="Message Accounts" className="rounded-xl shadow-md border border-blue-200" />
          <img src="https://res.cloudinary.com/drc8bufjn/image/upload/v1744468463/message_attachments/k9oarccurhonw2k200jx.png" alt="Menu Bar" className="rounded-xl shadow-md border border-blue-200" />
          <img src="https://res.cloudinary.com/drc8bufjn/image/upload/v1744469412/message_attachments/wtxqddihg42jx4dryihy.png" alt="Stories" className="rounded-xl shadow-md border border-blue-200" />
        </div>
      </section>

      {/* Login CTA */}
      <section className="py-16 bg-white text-center">
        <button
          className="bg-blue-600 text-white text-lg px-8 py-4 rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-105"
          onClick={() => setShowLoginForm(true)}
        >
          Login
        </button>
      </section>
    </div>
  );
};

export default Login;
