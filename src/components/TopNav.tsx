import { Search, Plus } from 'lucide-react';

type TopNavProps = {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddTask: () => void;
};

const filters = ['Today', 'This Week', 'This Month', 'Full Year', 'Reports'];

export default function TopNav({
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery,
  onAddTask
}: TopNavProps) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeFilter === filter
                  ? 'bg-gradient-to-r from-neon-blue to-neon-violet text-white shadow-neon-blue'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-64 rounded-full border border-gray-200 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/20 transition-all"
            />
          </div>

          <button
            onClick={onAddTask}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-neon-blue to-neon-violet text-white rounded-full font-medium hover:shadow-neon-blue transition-all duration-200 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden md:inline">Add Task</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
