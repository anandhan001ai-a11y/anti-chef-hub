import { useState } from 'react';
import { CheckSquare, Calculator, Scale, DollarSign, Package, ClipboardCheck, ChefHat, Settings, Sparkles, PenTool, LogOut, Cloud, ChevronDown, ChevronUp, Utensils, MessageSquare, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

type SidebarProps = {
  activeSection: string;
  setActiveSection: (section: string) => void;
  chefName?: string;
};

const menuItems = [
  { id: 'analytics-dashboard', icon: Cloud, label: 'Kitchen Crew' },
  { id: 'chat-hub', icon: MessageSquare, label: 'Team Chat' },
  { id: 'email-writer', icon: Mail, label: 'Write Email' },
  { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { id: 'cleaning', icon: Sparkles, label: 'Chef Check List' },
  { id: 'inventory', icon: Package, label: 'Inventory' },
  { id: 'haccp', icon: ClipboardCheck, label: 'HACCP Logs' },
  { id: 'menu', icon: ChefHat, label: 'Menu Engineering' },
  { id: 'whiteboard', icon: PenTool, label: 'Whiteboard' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

const kitchenToolsItems = [
  { id: 'conversions', icon: Calculator, label: 'Conversions' },
  { id: 'scaling', icon: Scale, label: 'Recipe Scaling' },
  { id: 'costing', icon: DollarSign, label: 'Costing Tool' },
];

export default function Sidebar({ activeSection, setActiveSection, chefName }: SidebarProps) {
  const [kitchenToolsOpen, setKitchenToolsOpen] = useState(false);

  const isKitchenToolActive = kitchenToolsItems.some(item => item.id === activeSection);

  return (
    <aside className="w-20 lg:w-64 bg-white h-screen fixed left-0 top-0 border-r border-slate-200 transition-all duration-300 overflow-y-auto">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#ff7a00] to-[#ff8f2d] rounded-xl flex items-center justify-center shadow-md shadow-orange-500/30">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div className="hidden lg:block">
            <h1 className="font-bold text-lg">ChefAnand Hub</h1>
            {chefName ? (
              <p className="text-xs text-[#ff7a00] font-medium">{chefName}</p>
            ) : (
              <p className="text-xs text-slate-500">Kitchen Management</p>
            )}
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2 pb-32">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] text-white shadow-lg shadow-orange-500/30'
                : 'hover:bg-slate-50 text-slate-600'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-[#ff7a00]'}`} />
              <span className="hidden lg:block font-medium text-sm">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 rounded-full bg-white hidden lg:block animate-pulse" />
              )}
            </button>
          );
        })}

        {/* Kitchen Tools Dropdown */}
        <div>
          <button
            onClick={() => setKitchenToolsOpen(!kitchenToolsOpen)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isKitchenToolActive
              ? 'bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] text-white shadow-lg shadow-orange-500/30'
              : 'hover:bg-slate-50 text-slate-600'
              }`}
          >
            <Utensils className={`w-5 h-5 ${isKitchenToolActive ? 'text-white' : 'text-slate-500 group-hover:text-[#ff7a00]'}`} />
            <span className="hidden lg:block font-medium text-sm">Kitchen Tools</span>
            {kitchenToolsOpen ? (
              <ChevronUp className="ml-auto w-4 h-4 hidden lg:block" />
            ) : (
              <ChevronDown className="ml-auto w-4 h-4 hidden lg:block" />
            )}
          </button>

          {/* Sub-items */}
          {kitchenToolsOpen && (
            <div className="mt-2 ml-4 space-y-1">
              {kitchenToolsItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group ${isActive
                      ? 'bg-[#ff8f2d] text-white'
                      : 'hover:bg-slate-100 text-slate-600'
                      }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-[#ff8f2d]'}`} />
                    <span className="hidden lg:block font-medium text-xs">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
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
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-3 border border-orange-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-slate-700">System Online</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
