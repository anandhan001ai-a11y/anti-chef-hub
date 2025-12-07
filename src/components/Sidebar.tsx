import { CheckSquare, Calculator, Scale, DollarSign, Package, ClipboardCheck, ChefHat, Key, Settings, Sparkles, PieChart, PenTool, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

type SidebarProps = {
  activeSection: string;
  setActiveSection: (section: string) => void;
  chefName?: string;
};

const menuItems = [
  { id: 'analytics', icon: PieChart, label: 'Analytics' },
  { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { id: 'cleaning', icon: Sparkles, label: 'Chef Check List' },
  { id: 'conversions', icon: Calculator, label: 'Conversions' },
  { id: 'scaling', icon: Scale, label: 'Recipe Scaling' },
  { id: 'costing', icon: DollarSign, label: 'Costing Tool' },
  { id: 'inventory', icon: Package, label: 'Inventory' },
  { id: 'haccp', icon: ClipboardCheck, label: 'HACCP Logs' },
  { id: 'menu', icon: ChefHat, label: 'Menu Engineering' },
  { id: 'whiteboard', icon: PenTool, label: 'Whiteboard' },
  { id: 'upload', icon: Key, label: 'Google Credentials' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ activeSection, setActiveSection, chefName }: SidebarProps) {
  return (
    <aside className="w-20 lg:w-64 bg-card-bg h-screen fixed left-0 top-0 border-r border-gray-200 transition-all duration-300">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-neon-blue to-neon-violet rounded-xl flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div className="hidden lg:block">
            <h1 className="font-bold text-lg">ChefAnand Hub</h1>
            {chefName ? (
              <p className="text-xs text-neon-blue font-medium">{chefName}</p>
            ) : (
              <p className="text-xs text-gray-500">Kitchen Management</p>
            )}
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-22 transition-all duration-200 group ${isActive
                ? 'bg-neon-blue text-white shadow-neon-blue'
                : 'hover:bg-white hover:shadow-soft text-gray-600'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-neon-blue'}`} />
              <span className="hidden lg:block font-medium text-sm">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 rounded-full bg-white hidden lg:block animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout Section */}
      <div className="absolute bottom-6 left-4 right-4">
        <button
          onClick={async () => {
            // Clear all stored credentials and settings
            localStorage.removeItem('chef_profile');
            localStorage.removeItem('app_theme');
            localStorage.removeItem('GOOGLE_API_KEY');
            localStorage.removeItem('GOOGLE_CLIENT_ID');
            localStorage.removeItem('GOOGLE_GEMINI_KEY');
            localStorage.removeItem('whiteboard_items');

            // Sign out from Supabase
            await supabase.auth.signOut();

            // Reload the page to reset state
            window.location.reload();
          }}
          className="w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden lg:block text-sm">Logout</span>
        </button>

        {/* Status Indicator */}
        <div className="mt-3 hidden lg:block">
          <div className="bg-gradient-to-r from-neon-blue/10 to-neon-violet/10 rounded-xl p-3 border border-neon-blue/20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-gray-700">System Online</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
