import { useState } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { Task } from '../lib/supabase';
import { Check, Filter } from 'lucide-react';

type TodoListProps = {
  onTaskClick: (task: Task) => void;
  searchQuery: string;
};

export default function TodoList({ onTaskClick, searchQuery }: TodoListProps) {
  const { tasks, updateTask } = useTasks();
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [kitchenFilter, setKitchenFilter] = useState<string>('all');

  const todoTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesKitchen = kitchenFilter === 'all' || task.kitchen_section === kitchenFilter;

    return matchesSearch && matchesPriority && matchesKitchen;
  });

  const sortedTasks = [...todoTasks].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority];
    const bPriority = priorityOrder[b.priority];

    if (aPriority !== bPriority) return aPriority - bPriority;

    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }

    return 0;
  });

  const handleToggleComplete = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    await updateTask(task.id, { status: newStatus });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-neon-orange';
      case 'medium': return 'border-l-4 border-neon-blue';
      case 'low': return 'border-l-4 border-neon-green';
      default: return '';
    }
  };

  return (
    <div className="bg-white rounded-24 shadow-soft p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">To-Do List</h2>
          <p className="text-sm text-gray-500 mt-1">{sortedTasks.length} tasks</p>
        </div>
        <Filter className="w-5 h-5 text-gray-400" />
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-1.5 rounded-full text-xs border border-gray-200 focus:outline-none focus:border-neon-blue"
        >
          <option value="all">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={kitchenFilter}
          onChange={(e) => setKitchenFilter(e.target.value)}
          className="px-3 py-1.5 rounded-full text-xs border border-gray-200 focus:outline-none focus:border-neon-blue"
        >
          <option value="all">All Sections</option>
          <option value="hot">Hot Kitchen</option>
          <option value="cold">Cold Kitchen</option>
          <option value="pastry">Pastry</option>
          <option value="butchery">Butchery</option>
          <option value="general">General</option>
        </select>
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-300px)] scrollbar-hide">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No tasks found</p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              className={`bg-white border border-gray-200 rounded-22 p-4 cursor-pointer hover:shadow-soft transition-all duration-200 ${getPriorityColor(task.priority)} ${
                task.status === 'completed' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={(e) => handleToggleComplete(task, e)}
                  className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    task.status === 'completed'
                      ? 'bg-neon-blue border-neon-blue'
                      : 'border-gray-300 hover:border-neon-blue'
                  }`}
                >
                  {task.status === 'completed' && <Check className="w-3 h-3 text-white" />}
                </button>

                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium text-sm ${task.status === 'completed' ? 'line-through' : ''}`}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      task.priority === 'high' ? 'bg-neon-orange/10 text-neon-orange' :
                      task.priority === 'medium' ? 'bg-neon-blue/10 text-neon-blue' :
                      'bg-neon-green/10 text-neon-green'
                    }`}>
                      {task.priority}
                    </span>

                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                      {task.kitchen_section}
                    </span>

                    {task.due_date && (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        new Date(task.due_date) < new Date() && task.status !== 'completed'
                          ? 'bg-red-100 text-red-600 animate-pulse-soft'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {new Date(task.due_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
