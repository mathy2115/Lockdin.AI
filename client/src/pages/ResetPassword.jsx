import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const token = new URLSearchParams(window.location.search).get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await axios.post('http://localhost:5000/api/auth/reset-password', { token, newPassword: password }, {
        headers: { 'Content-Type': 'application/json' }
      });
      setIsSuccess(true);
      setMessage(res.data.message || 'Password reset! Sign in');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link might have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF8E7] px-4 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-full max-w-md bg-[#FFFDF4] rounded-2xl shadow-2xl shadow-indigo-500/5 border border-[#E8D5A3] p-8">
        <div className="text-center mb-8">
          <h1 className="font-['Sora'] text-3xl font-bold text-indigo-600 tracking-wide mb-2">Set New Password</h1>
          <p className="text-gray-500">Enter a new secure password.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {isSuccess ? (
          <div className="text-center space-y-6">
            <div className="flex justify-center text-green-500 mb-4">
              <CheckCircle2 size={48} />
            </div>
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
              {message}
            </div>
            <Link 
              to="/login"
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
            >
              Sign In Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-[#E8D5A3] rounded-xl bg-[#FFF8E7] text-[#1A1A2E] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-[#E8D5A3] rounded-xl bg-[#FFF8E7] text-[#1A1A2E] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#FFFDF4] focus:ring-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}

        {!isSuccess && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Remembered your password?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
              Log in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
