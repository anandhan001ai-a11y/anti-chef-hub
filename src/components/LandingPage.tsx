import { useState } from 'react';
import {
    ChefHat, ArrowRight, Mail, Lock, User, AlertCircle, CheckCircle,
    Upload, Calendar, Users, BarChart3, FileText, Settings,
    Sparkles, Shield, Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
    const { signIn, signUp } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

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
                    const msg = error.message.toLowerCase();
                    if (msg.includes('user already registered')) {
                        setError('This email is already registered. Please sign in instead.');
                    } else if (msg.includes('invalid email')) {
                        setError('Please enter a valid email address.');
                    } else {
                        setError(error.message);
                    }
                } else {
                    setSuccess('Account created! Check your email to confirm, then sign in.');
                    setIsSignUp(false);
                    setPassword('');
                }
            } else {
                const { error } = await signIn(email.trim(), password);

                if (error) {
                    const msg = error.message.toLowerCase();
                    if (msg.includes('invalid login credentials')) {
                        setError('Invalid email or password. Please check and try again.');
                    } else {
                        setError(error.message);
                    }
                }
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const features = [
        { icon: Upload, title: 'Drag & Drop Upload', desc: 'Upload rosters, menus & files instantly', color: 'blue' },
        { icon: Calendar, title: 'Duty Scheduling', desc: 'Smart calendar with shift management', color: 'green' },
        { icon: Users, title: 'Staff Management', desc: 'Track attendance, certs & performance', color: 'purple' },
        { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Real-time insights & reporting', color: 'orange' },
        { icon: FileText, title: 'Menu Engineering', desc: 'Cost analysis & recipe scaling', color: 'pink' },
        { icon: Settings, title: 'Cloud Integration', desc: 'Google Drive & Dropbox sync', color: 'indigo' },
    ];

    const stats = [
        { value: '15+', label: 'Modules', icon: Sparkles },
        { value: '99.9%', label: 'Uptime', icon: Shield },
        { value: '2x', label: 'Faster', icon: Zap },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex">
            {/* LEFT SIDE - Features & Value Prop */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-96 h-96 bg-[#ff7a00] rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }} />
                </div>

                <div className="relative z-10">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-16">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#ff7a00] to-[#ff8f2d] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                            <ChefHat className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold">ChefAnand Hub</span>
                    </div>

                    {/* Hero */}
                    <div className="max-w-xl">
                        <h1 className="text-5xl xl:text-6xl font-bold mb-6 leading-tight">
                            Kitchen Management{' '}
                            <span className="bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] bg-clip-text text-transparent">
                                Made Simple
                            </span>
                        </h1>
                        <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                            All-in-one SaaS platform for chefs. Manage staff, schedules, inventory, and analytics with powerful drag-and-drop tools.
                        </p>

                        {/* Stats */}
                        <div className="flex gap-8 mb-12">
                            {stats.map((stat, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                        <stat.icon className="w-5 h-5 text-[#ff7a00]" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{stat.value}</div>
                                        <div className="text-sm text-slate-400">{stat.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {features.map((feature, i) => (
                                <div
                                    key={i}
                                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all group cursor-pointer"
                                >
                                    <feature.icon className="w-6 h-6 text-[#ff7a00] mb-2 group-hover:scale-110 transition-transform" />
                                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                                    <p className="text-sm text-slate-400">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 flex items-center gap-6 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span>All Systems Operational</span>
                    </div>
                    <span>•</span>
                    <span>Powered by Supabase</span>
                </div>
            </div>

            {/* RIGHT SIDE - Login/Signup */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#ff7a00] to-[#ff8f2d] rounded-2xl flex items-center justify-center">
                            <ChefHat className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-slate-900">ChefAnand Hub</span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                        {/* Header */}
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">
                                {isSignUp ? 'Create Account' : 'Welcome Back'}
                            </h2>
                            <p className="text-slate-600">
                                {isSignUp
                                    ? 'Start managing your kitchen today'
                                    : 'Sign in to access your dashboard'
                                }
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isSignUp && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Enter your name"
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min. 6 characters"
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 transition-all"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            {/* Error/Success Messages */}
                            {error && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {success && (
                                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>{success}</span>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-lg transition-all ${loading
                                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
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

                        {/* Toggle Sign In/Up */}
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setError('');
                                    setSuccess('');
                                }}
                                className="text-sm text-slate-600 hover:text-[#ff7a00] transition-colors font-medium"
                            >
                                {isSignUp
                                    ? 'Already have an account? Sign in'
                                    : "Don't have an account? Sign up"
                                }
                            </button>
                        </div>
                    </div>

                    {/* Mobile Features */}
                    <div className="lg:hidden mt-8 grid grid-cols-2 gap-3">
                        {features.slice(0, 4).map((feature, i) => (
                            <div key={i} className="bg-white rounded-xl p-4 border border-slate-200">
                                <feature.icon className="w-5 h-5 text-[#ff7a00] mb-2" />
                                <h4 className="font-semibold text-sm text-slate-900">{feature.title}</h4>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
