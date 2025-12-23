import { useState, useEffect } from 'react';
import { Task, fetchTasks, updateTask, createTask, deleteTask } from '../lib/taskService';
import { Plus, Loader2, AlertCircle, Database, Trash2 } from 'lucide-react';

type KanbanBoardProps = {
  onTaskClick: (task: Task) => void;
};

type Column = 'pending' | 'completed';

export default function KanbanBoard({ onTaskClick }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTableMissing, setIsTableMissing] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [addingToColumn, setAddingToColumn] = useState<Column | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    setIsTableMissing(false);

    const { data, error } = await fetchTasks('taskboard');

    if (error) {
      if (error.message.includes('public.tasks') ||
        error.message.includes('relation') ||
        error.message.includes('schema cache')) {
        setIsTableMissing(true);
      }
      setError(error.message);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const columns: { id: Column; title: string; color: string; bgColor: string }[] = [
    { id: 'pending', title: 'To Do', color: 'border-[#ff7a00]', bgColor: 'bg-orange-50' },
    { id: 'completed', title: 'Done', color: 'border-green-500', bgColor: 'bg-green-50' },
  ];

  const getTasksByStatus = (status: Column) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: Column) => {
    if (draggedTask && draggedTask.status !== status) {
      // Optimistic update
      setTasks(prev => prev.map(t =>
        t.id === draggedTask.id ? { ...t, status } : t
      ));

      const { error } = await updateTask(draggedTask.id, { status });
      if (error) {
        // Revert on error
        setTasks(prev => prev.map(t =>
          t.id === draggedTask.id ? { ...t, status: draggedTask.status } : t
        ));
      }
    }
    setDraggedTask(null);
  };

  const handleAddTask = async (e: React.FormEvent, column: Column) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const { data, error } = await createTask({
      title: newTaskTitle.trim(),
      board_type: 'taskboard',
      status: column,
      sort_index: tasks.length,
    });

    if (!error && data) {
      setTasks(prev => [...prev, data]);
      setNewTaskTitle('');
      setAddingToColumn(null);
    }
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    setTasks(prev => prev.filter(t => t.id !== taskId));

    const { error } = await deleteTask(taskId);
    if (error) {
      loadTasks();
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-24 shadow-soft p-6 h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ff7a00] animate-spin" />
      </div>
    );
  }

  if (isTableMissing) {
    return (
      <div className="bg-white rounded-24 shadow-soft p-8 h-full flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Database className="w-10 h-10 text-[#ff7a00]" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Database Setup Required</h3>
          <p className="text-gray-600 mb-6">The tasks table doesn't exist. Please run the SQL migration.</p>
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
        <button onClick={loadTasks} className="mt-4 px-4 py-2 bg-[#ff7a00] text-white rounded-xl hover:bg-[#ff8f2d] transition-colors mx-auto block">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-24 shadow-soft p-6 h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Task Board</h2>
        <p className="text-sm text-gray-500 mt-1">Drag tasks between columns to update status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100%-100px)]">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);

          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
              className={`${column.bgColor} rounded-2xl p-4 border-t-4 ${column.color} flex flex-col`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-900">{column.title}</h3>
                <span className="px-3 py-1 bg-white rounded-full text-sm font-semibold text-gray-700 shadow-sm">
                  {columnTasks.length}
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto mb-4">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    No tasks yet
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      className="group bg-white rounded-xl p-4 cursor-move hover:shadow-lg transition-all duration-200 border border-gray-100"
                    >
                      <div className="flex items-start justify-between">
                        <div
                          onClick={() => onTaskClick(task)}
                          className="flex-1 cursor-pointer"
                        >
                          <h4 className={`font-medium text-sm mb-1 ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'
                            }`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                              {task.description}
                            </p>
                          )}
                          {task.due_date && (
                            <p className={`text-xs mt-2 ${new Date(task.due_date) < new Date() && task.status !== 'completed'
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
                          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Task */}
              {addingToColumn === column.id ? (
                <form onSubmit={(e) => handleAddTask(e, column.id)} className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task title..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff7a00]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#ff7a00] text-white rounded-xl hover:bg-[#ff8f2d] text-sm font-medium"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingToColumn(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setAddingToColumn(column.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-[#ff7a00] border-2 border-dashed border-[#ff7a00] rounded-xl hover:bg-orange-50 transition-all font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
