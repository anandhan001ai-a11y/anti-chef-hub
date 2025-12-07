import { Plus, Command, Bot, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { googleService } from '../lib/google';
import { createTask } from '../lib/taskService';
import { aiService } from '../lib/aiService';

type TopNavProps = {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddTask: () => void;
  activeSection?: string;
};

const filters = ['Today', 'This Week', 'This Month', 'Full Year'];

export default function TopNav({
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery,
  onAddTask,
  activeSection
}: TopNavProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsProcessing(true);
      const cmd = searchQuery.toLowerCase();

      try {
        // --- AI COMMAND: SYNC TASKS ---
        if (cmd.includes('sync') && (cmd.includes('task') || cmd.includes('google'))) {
          const tasks = await googleService.fetchTasks();
          let count = 0;
          for (const t of tasks) {
            // Only import if title exists
            if (t.title) {
              await createTask({
                title: t.title,
                description: t.notes || 'Imported from Google Tasks',
                board_type: 'todo',
                status: t.status === 'completed' ? 'completed' : 'pending'
              });
              count++;
            }
          }
          alert(`✨ Success! Synced ${count} tasks from Google.`);
          setSearchQuery('');
        }

        // --- AI COMMAND: CONNECT INVENTORY (Mock for specific Sheet ID) ---
        else if (cmd.includes('inventory') && cmd.includes('sheet')) {
          // In a real app, AI would extract the ID. Here we mock or ask user.
          const sheetId = prompt("Please enter the Google Sheet ID:");
          if (sheetId) {
            const data = await googleService.fetchInventory(sheetId, 'Sheet1!A1:B10');
            console.log('Inventory Data:', data);
            alert(`Fetched ${data?.length || 0} rows from Sheet. (View console)`);
          }
        }

        // --- GENERAL AI QUERY ---
        else {
          const response = await aiService.sendMessage(searchQuery);
          alert(response); // In future, use a nice toast or modal
          setSearchQuery('');
        }

      } catch (err) {
        console.error(err);
        alert('Error executing AI command. Please check your Google Credentials in the Settings page and ensure you have granted pop-up permissions.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40 shadow-soft">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full lg:w-auto pb-2 lg:pb-0 h-10">
          {activeSection !== 'whiteboard' && filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 lg:px-6 py-2 rounded-full text-xs lg:text-sm font-bold transition-all duration-200 whitespace-nowrap ${activeFilter === filter
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-200'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* AI Command Center */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative group flex-1 lg:w-96">
            {/* Glow Effect */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 rounded-full opacity-30 group-hover:opacity-60 transition duration-500 blur ${isProcessing ? 'animate-pulse opacity-100' : ''}`}></div>

            <div className="relative flex items-center bg-white rounded-full border border-gray-100 shadow-sm">
              <div className="pl-4 pr-2">
                {isProcessing ? <Loader2 className="w-5 h-5 text-purple-500 animate-spin" /> : <Bot className="w-5 h-5 text-purple-500" />}
              </div>
              <input
                type="text"
                placeholder="Ask AI: 'Sync Google Tasks' or 'Check Inventory'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full py-3 bg-transparent border-none outline-none text-gray-700 text-sm placeholder-gray-400 font-medium"
              />
              <div className="pr-2 hidden md:block">
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded text-[10px] font-bold text-gray-400 border border-gray-100">
                  <Command size={10} /> K
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onAddTask}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full font-bold hover:bg-black hover:scale-105 transition-all duration-200 whitespace-nowrap shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden md:inline">Add</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
