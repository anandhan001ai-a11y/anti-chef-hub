import { useState, useEffect } from 'react';
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
import GoogleCredentialsPage from './credentials/GoogleCredentialsPage';
import MenuEngineering from './menu/MenuEngineering';
import HaccpReference from './haccp/HaccpReference';
import TaskAnalyticsDashboard from './analytics/TaskAnalyticsDashboard';
import NeonTaskBoard from './tasks/NeonTaskBoard';
import Whiteboard from './whiteboard/Whiteboard';
import SettingsPage from './settings/SettingsPage';
import CollaborationPanel from './CollaborationPanel';

type DashboardProps = {
  chefName: string;
};

export default function Dashboard({ chefName }: DashboardProps) {
  const [activeSection, setActiveSection] = useState('analytics');
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

      case 'analytics':
        return <TaskAnalyticsDashboard />;

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

      case 'upload':
        return <GoogleCredentialsPage />;

      case 'haccp':
        return <HaccpReference />;

      case 'menu':
        return <MenuEngineering />;

      case 'settings':
        return <SettingsPage />;

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
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
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
                <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {getTimeBasedGreeting()}, <span className="bg-gradient-to-r from-neon-blue to-neon-violet bg-clip-text text-transparent">Chef {chefName}</span>
                </h1>
              </div>
              <p className="text-gray-500 mt-1">
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
    </div>
  );
}
