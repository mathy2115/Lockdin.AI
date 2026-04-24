import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', { email, password });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        navigate('/onboarding');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Email already exists or something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-fa-bg-page px-4 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-full max-w-md bg-fa-bg-shell rounded-2xl shadow-2xl shadow-fa-brand/5 border border-fa-border p-8">
        <div className="text-center mb-8">
          <h1 className="font-['Sora'] text-3xl font-bold text-fa-brand tracking-wide mb-2">Lockdin.AI</h1>
          <p className="text-fa-text-secondary">Create your account to get started.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-fa-state-stressed/10 border border-fa-state-stressed/20 text-fa-state-stressed rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-fa-text-secondary mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-fa-text-muted" />
              </div>
              <input
                type="email"
                required
                className="block w-full pl-10 pr-3 py-3 border border-fa-border rounded-xl bg-fa-bg-page text-fa-text-primary placeholder-fa-text-muted focus:outline-none focus:ring-2 focus:ring-fa-brand focus:border-transparent transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-fa-text-secondary mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-fa-text-muted" />
              </div>
              <input
                type="password"
                required
                className="block w-full pl-10 pr-3 py-3 border border-fa-border rounded-xl bg-fa-bg-page text-fa-text-primary placeholder-fa-text-muted focus:outline-none focus:ring-2 focus:ring-fa-brand focus:border-transparent transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-fa-brand hover:bg-fa-brand/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-fa-bg-shell focus:ring-fa-brand transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-6"
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
              <>
                <span>Sign up</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-fa-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-fa-brand hover:text-fa-brand/80 transition-colors">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
