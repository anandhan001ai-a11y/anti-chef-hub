import { useState } from 'react';
import { Task } from '../lib/supabase';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import TodoList from './TodoList';
import KanbanBoard from './KanbanBoard';
import Calendar from './Calendar';
import AddTaskModal from './AddTaskModal';
import TaskDetailDrawer from './TaskDetailDrawer';

type DashboardProps = {
  chefName: string;
};

export default function Dashboard({ chefName }: DashboardProps) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeFilter, setActiveFilter] = useState('Full Year');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
            <div className="lg:col-span-1">
              <TodoList onTaskClick={handleTaskClick} searchQuery={searchQuery} />
            </div>
            <div className="lg:col-span-2">
              <KanbanBoard onTaskClick={handleTaskClick} searchQuery={searchQuery} />
            </div>
          </div>
        );

      case 'todo':
        return (
          <div className="max-w-4xl mx-auto">
            <TodoList onTaskClick={handleTaskClick} searchQuery={searchQuery} />
          </div>
        );

      case 'board':
        return <KanbanBoard onTaskClick={handleTaskClick} searchQuery={searchQuery} />;

      case 'conversions':
      case 'scaling':
      case 'costing':
      case 'inventory':
      case 'haccp':
      case 'menu':
      case 'upload':
      case 'settings':
        return (
          <div className="bg-white rounded-24 shadow-soft p-12 text-center">
            <h2 className="text-2xl font-bold mb-4 capitalize">{activeSection}</h2>
            <p className="text-gray-500">This feature is coming soon...</p>
          </div>
        );

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
    <div className="min-h-screen bg-gray-50">
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
        />

        <main className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold">
                {getTimeBasedGreeting()}, <span className="bg-gradient-to-r from-neon-blue to-neon-violet bg-clip-text text-transparent">Chef {chefName}</span>
              </h1>
            </div>
            <p className="text-gray-500 mt-1">
              Manage and track all kitchen workflows in one interface.
            </p>
          </div>

          {activeFilter === 'Full Year' && activeSection === 'dashboard' ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TodoList onTaskClick={handleTaskClick} searchQuery={searchQuery} />
                  <KanbanBoard onTaskClick={handleTaskClick} searchQuery={searchQuery} />
                </div>
              </div>
              <div>
                <Calendar onDateClick={handleDateClick} />
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
    </div>
  );
}
