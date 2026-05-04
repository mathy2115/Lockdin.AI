import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Loader2, Send } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    
    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email }, {
        headers: { 'Content-Type': 'application/json' }
      });
      setMessage(res.data.message || 'If that email exists, a reset link has been sent.');
    } catch (err) {
      setMessage('If that email exists, a reset link has been sent.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF8E7] px-4 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-full max-w-md bg-[#FFFDF4] rounded-2xl shadow-2xl shadow-indigo-500/5 border border-[#E8D5A3] p-8">
        <div className="text-center mb-8">
          <h1 className="font-['Sora'] text-3xl font-bold text-indigo-600 tracking-wide mb-2">Reset Password</h1>
          <p className="text-gray-500">Enter your email to receive a reset link.</p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                className="block w-full pl-10 pr-3 py-3 border border-[#E8D5A3] rounded-xl bg-[#FFF8E7] text-[#1A1A2E] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#FFFDF4] focus:ring-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-6"
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
              <>
                <span>Send Reset Link</span>
                <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
