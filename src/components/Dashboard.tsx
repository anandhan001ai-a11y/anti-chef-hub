import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { Task } from '../lib/taskService';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import TasksPage from './TasksPage';
import Calendar from './Calendar';
import AddTaskModal from './AddTaskModal';
import TaskDetailDrawer from './TaskDetailDrawer';
import CleaningTaskBoard from './cleaning/CleaningTaskBoard';
import TodoList from './TodoList';
import KanbanBoard from './KanbanBoard';
import ChefChecklistStats from './cleaning/ChefChecklistStats';
import ConversionsPage from './conversions/ConversionsPage';
import RecipeScaler from './scaling/RecipeScaler';
import CostingDashboard from './costing/CostingDashboard';
import InventoryPage from './inventory/InventoryPage';
import MenuEngineering from './menu/MenuEngineering';
import HaccpReference from './haccp/HaccpReference';
import NeonTaskBoard from './tasks/NeonTaskBoard';
import Whiteboard from './whiteboard/Whiteboard';
import SettingsPage from './settings/SettingsPage';
import CollaborationPanel from './CollaborationPanel';
import AnalyticsDashboard from './AnalyticsDashboard';
import KitchenChatHub from './chat/KitchenChatHub';

type DashboardProps = {
  chefName: string;
};

export default function Dashboard({ chefName }: DashboardProps) {
  const [activeSection, setActiveSection] = useState('analytics-dashboard');
  const [activeFilter, setActiveFilter] = useState('Full Year');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [theme, setTheme] = useState('light');

  // --- Theme Listener ---
  useEffect(() => {
    const loadTheme = () => {
      const saved = localStorage.getItem('app_theme');
      if (saved) setTheme(saved);
      // Also apply to document body for scrollbars etc
      if (saved === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    };
    loadTheme();
    window.addEventListener('theme-change', loadTheme);
    return () => window.removeEventListener('theme-change', loadTheme);
  }, []);

  const handleAddTask = (date?: Date) => {
    setSelectedDate(date || null);
    setIsAddTaskModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDrawerOpen(true);
  };

  const handleDateClick = (date: Date) => {
    handleAddTask(date);
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-3">
              <TasksPage onTaskClick={handleTaskClick} searchQuery={searchQuery} />
            </div>
          </div>
        );

      case 'analytics-dashboard':
        return <AnalyticsDashboard />;

      case 'tasks':
        return <NeonTaskBoard />;

      case 'whiteboard':
        return <Whiteboard />;

      case 'cleaning':
        return <CleaningTaskBoard />;

      case 'conversions':
        return <ConversionsPage />;

      case 'scaling':
        return <RecipeScaler />;

      case 'costing':
        return <CostingDashboard />;

      case 'inventory':
        return <InventoryPage />;

      case 'haccp':
        return <HaccpReference />;

      case 'menu':
        return <MenuEngineering />;

      case 'settings':
        return <SettingsPage />;

      case 'chat-hub':
        return <KitchenChatHub />;

      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-1">
              <TodoList onTaskClick={handleTaskClick} searchQuery={searchQuery} />
            </div>
            <div className="lg:col-span-2">
              <KanbanBoard onTaskClick={handleTaskClick} searchQuery={searchQuery} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'dark bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        chefName={chefName}
      />

      <div className="ml-20 lg:ml-64 transition-all duration-300">
        <TopNav
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAddTask={() => handleAddTask()}
          activeSection={activeSection}
        />

        <main className={activeSection === 'cleaning' ? '' : 'p-6'}>
          {activeSection !== 'cleaning' && (
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-2">
                <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {getTimeBasedGreeting()}, <span className="bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] bg-clip-text text-transparent">Chef {chefName}</span>
                </h1>
              </div>
              <p className="text-slate-600 mt-1">
                Manage and track all kitchen workflows in one interface.
              </p>
            </div>
          )}

          {activeFilter === 'Full Year' && activeSection === 'dashboard' ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TodoList onTaskClick={handleTaskClick} searchQuery={searchQuery} />
                  <KanbanBoard onTaskClick={handleTaskClick} searchQuery={searchQuery} />
                </div>
              </div>
              <div className="space-y-6">
                <Calendar onDateClick={handleDateClick} />
                <ChefChecklistStats />
              </div>
            </div>
          ) : (
            <div className="h-[calc(100vh-250px)]">
              {renderMainContent()}
            </div>
          )}
        </main>
      </div>

      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => {
          setIsAddTaskModalOpen(false);
          setSelectedDate(null);
        }}
        preselectedDate={selectedDate}
      />

      <TaskDetailDrawer
        task={selectedTask}
        isOpen={isTaskDrawerOpen}
        onClose={() => {
          setIsTaskDrawerOpen(false);
          setSelectedTask(null);
        }}
      />

      <CollaborationPanel />

      {/* Floating Team Chat Button - Bottom Right */}
      {activeSection !== 'chat-hub' && (
        <button
          onClick={() => setActiveSection('chat-hub')}
          className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full shadow-2xl hover:from-orange-600 hover:to-orange-700 transition-all hover:scale-110 z-50 group"
          title="Open Team Chat"
        >
          <MessageSquare size={24} className="group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}
    </div>
  );
}
