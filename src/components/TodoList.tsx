import { useState, useEffect } from 'react';
import { Task, fetchTasks, createTask, updateTask, toggleTaskStatus, deleteTask } from '../lib/taskService';
import { Check, Plus, Loader2, AlertCircle, Trash2, Database } from 'lucide-react';

type TodoListProps = {
  onTaskClick: (task: Task) => void;
  searchQuery: string;
};

export default function TodoList({ onTaskClick, searchQuery }: TodoListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTableMissing, setIsTableMissing] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Load tasks
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    setIsTableMissing(false);

    const { data, error } = await fetchTasks('todo');

    if (error) {
      // Check if it's a "table not found" error
      if (error.message.includes('public.tasks') ||
        error.message.includes('relation') ||
        error.message.includes('schema cache')) {
        setIsTableMissing(true);
        setError('Database table not set up yet');
      } else {
        setError(error.message);
      }
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  // Filter tasks by search
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesSearch;
  });

  // Sort: pending first, then by sort_index
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1;
    }
    return a.sort_index - b.sort_index;
  });

  const handleToggleComplete = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const newCompleted = task.status !== 'completed';

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, status: newCompleted ? 'completed' : 'pending' } : t
    ));

    const { error } = await toggleTaskStatus(task.id, newCompleted);
    if (error) {
      // Revert on error
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: task.status } : t
      ));
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const { data, error } = await createTask({
      title: newTaskTitle.trim(),
      board_type: 'todo',
      sort_index: tasks.length,
    });

    if (!error && data) {
      setTasks(prev => [...prev, data]);
      setNewTaskTitle('');
    }
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== taskId));

    const { error } = await deleteTask(taskId);
    if (error) {
      // Reload on error
      loadTasks();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-24 shadow-soft p-6 h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ff7a00] animate-spin" />
      </div>
    );
  }

  // Table missing error state
  if (isTableMissing) {
    return (
      <div className="bg-white rounded-24 shadow-soft p-8 h-full flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Database className="w-10 h-10 text-[#ff7a00]" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Database Setup Required
          </h3>

          <p className="text-gray-600 mb-6">
            The tasks table doesn't exist yet. Please run the SQL migration in your Supabase dashboard.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-medium text-gray-700 mb-2">📋 Quick Setup:</p>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>Open Supabase SQL Editor</li>
              <li>Run the migration file:<br />
                <code className="text-xs bg-gray-200 px-2 py-1 rounded mt-1 inline-block">
                  supabase/migrations/20251206_unified_tasks.sql
                </code>
              </li>
              <li>Click Retry below</li>
            </ol>
          </div>

          <button
            onClick={loadTasks}
            className="px-6 py-3 bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Other errors
  if (error && !isTableMissing) {
    return (
      <div className="bg-white rounded-24 shadow-soft p-6 h-full">
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-600 font-medium">Error</p>
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        </div>
        <button
          onClick={loadTasks}
          className="mt-4 px-4 py-2 bg-[#ff7a00] text-white rounded-xl hover:bg-[#ff8f2d] transition-colors mx-auto block"
        >
          Retry
        </button>
      </div>
    );
  }

  // Main To-Do List UI
  const pendingTasks = sortedTasks.filter(t => t.status === 'pending');
  const completedTasks = sortedTasks.filter(t => t.status === 'completed');

  return (
    <div className="bg-white rounded-24 shadow-soft p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>
        <p className="text-sm text-gray-500 mt-1">
          {pendingTasks.length} pending {pendingTasks.length === 1 ? 'task' : 'tasks'}
        </p>
      </div>

      {/* Quick Add Task */}
      <form onSubmit={handleAddTask} className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add a task..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={!newTaskTitle.trim()}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${newTaskTitle.trim()
                ? 'bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] text-white hover:shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            Add
          </button>
        </div>
      </form>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <div>
            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all"
                >
                  <button
                    onClick={(e) => handleToggleComplete(task, e)}
                    className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 hover:border-[#ff7a00] transition-all flex items-center justify-center"
                  >
                    {task.status === 'completed' && (
                      <Check className="w-4 h-4 text-[#ff7a00]" />
                    )}
                  </button>

                  <div
                    onClick={() => onTaskClick(task)}
                    className="flex-1 cursor-pointer"
                  >
                    <p className="text-gray-900 font-medium">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
                    )}
                    {task.due_date && (
                      <p className={`text-xs mt-1 ${new Date(task.due_date) < new Date()
                          ? 'text-red-500 font-medium'
                          : 'text-gray-400'
                        }`}>
                        Due {new Date(task.due_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleDeleteTask(task.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
              Completed ({completedTasks.length})
            </h3>
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all opacity-60"
                >
                  <button
                    onClick={(e) => handleToggleComplete(task, e)}
                    className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff7a00] border-2 border-[#ff7a00] transition-all flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </button>

                  <div
                    onClick={() => onTaskClick(task)}
                    className="flex-1 cursor-pointer"
                  >
                    <p className="text-gray-500 line-through">{task.title}</p>
                  </div>

                  <button
                    onClick={(e) => handleDeleteTask(task.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {sortedTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4">
              <Check className="w-10 h-10 text-[#ff7a00]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-500 text-sm">Add your first task above to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
