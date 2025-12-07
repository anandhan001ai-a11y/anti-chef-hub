import { useState } from 'react';
import { ChefHat, ArrowRight, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        if (!name.trim()) {
          setError('Please enter your name');
          setLoading(false);
          return;
        }

        const { error } = await signUp(email.trim(), password, name.trim());

        if (error) {
          // Handle specific Supabase errors
          const msg = error.message.toLowerCase();
          if (msg.includes('user already registered') || msg.includes('already been registered')) {
            setError('This email is already registered. Please sign in instead.');
          } else if (msg.includes('invalid email')) {
            setError('Please enter a valid email address.');
          } else if (msg.includes('weak password') || msg.includes('password')) {
            setError('Password is too weak. Use at least 6 characters.');
          } else if (msg.includes('signup is not allowed') || msg.includes('signups not allowed')) {
            setError('Sign-ups are currently disabled. Please contact the administrator.');
          } else {
            setError(error.message);
          }
        } else {
          // Success! 
          setSuccess('Account created! Check your email to confirm, then sign in.');
          setIsSignUp(false);
          setPassword('');
        }
      } else {
        // Sign In
        const { error } = await signIn(email.trim(), password);

        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
            setError('Invalid email or password. Please check and try again.');
          } else if (msg.includes('email not confirmed')) {
            setError('Please confirm your email address first. Check your inbox.');
          } else if (msg.includes('too many requests')) {
            setError('Too many attempts. Please wait a moment and try again.');
          } else {
            setError(error.message);
          }
        }
        // If no error, AuthContext will handle the redirect
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-[#ff7a00]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#ff7a00]/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative bg-white rounded-3xl shadow-xl p-8 md:p-12 w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#ff7a00] to-[#ff8f2d] rounded-3xl mb-6 shadow-lg shadow-orange-500/30">
            <ChefHat className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] bg-clip-text text-transparent">
            ChefAnand Hub
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            {isSignUp ? 'Create your account' : 'Kitchen Management Dashboard'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {getTimeBasedGreeting()}, Chef
            </label>
          </div>

          {isSignUp && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/20 transition-all text-base font-medium placeholder:text-gray-400"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/20 transition-all text-base font-medium placeholder:text-gray-400"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/20 transition-all text-base font-medium placeholder:text-gray-400"
              required
              minLength={6}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-full font-semibold text-lg transition-all duration-300 ${loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] text-white hover:shadow-lg hover:shadow-orange-500/30 hover:scale-[1.02]'
              }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isSignUp ? 'Create Account' : 'Sign In'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setSuccess('');
            }}
            className="text-sm text-gray-500 hover:text-[#ff7a00] transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Supabase Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
