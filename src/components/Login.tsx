import { useState } from 'react';
import { ChefHat, ArrowRight } from 'lucide-react';

type LoginProps = {
  onLogin: (chefName: string) => void;
};

export default function Login({ onLogin }: LoginProps) {
  const [chefName, setChefName] = useState('');
  const [greeting, setGreeting] = useState('');

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chefName.trim()) {
      onLogin(chefName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-neon-blue/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-violet/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-orange/5 rounded-full blur-3xl" />
      </div>

      <div className="relative bg-white rounded-24 shadow-soft p-8 md:p-12 w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-neon-blue to-neon-violet rounded-24 mb-6 shadow-neon-blue">
            <ChefHat className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-neon-blue to-neon-violet bg-clip-text text-transparent">
            ChefAnand Hub
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Kitchen Management Dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              {getTimeBasedGreeting()}, Chef
            </label>
            <input
              type="text"
              value={chefName}
              onChange={(e) => setChefName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full px-6 py-4 rounded-22 border-2 border-gray-200 focus:outline-none focus:border-neon-blue focus:ring-4 focus:ring-neon-blue/20 transition-all text-lg font-medium placeholder:text-gray-400"
              autoFocus
            />
          </div>

          {chefName.trim() && (
            <div className="bg-gradient-to-r from-neon-blue/10 to-neon-violet/10 rounded-22 p-4 border border-neon-blue/20 animate-pulse-soft">
              <p className="text-sm text-gray-600 text-center">
                Welcome, <span className="font-bold text-neon-blue">Chef {chefName}</span>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!chefName.trim()}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-full font-semibold text-lg transition-all duration-300 ${
              chefName.trim()
                ? 'bg-gradient-to-r from-neon-blue to-neon-violet text-white hover:shadow-neon-blue hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue to Dashboard
            <ArrowRight className={`w-5 h-5 transition-transform ${chefName.trim() ? 'group-hover:translate-x-1' : ''}`} />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <span>All Systems Active</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Powered by ChefAnand Hub v1.0
          </p>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
        <p className="text-xs text-gray-400">
          Professional Kitchen Management System
        </p>
      </div>
    </div>
  );
}
