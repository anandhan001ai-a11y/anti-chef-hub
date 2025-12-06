import { useState } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { Task } from '../lib/supabase';
import { MoreVertical, Clock } from 'lucide-react';

type KanbanBoardProps = {
  onTaskClick: (task: Task) => void;
  searchQuery: string;
};

type Column = 'todo' | 'in-progress' | 'completed';

export default function KanbanBoard({ onTaskClick, searchQuery }: KanbanBoardProps) {
  const { tasks, updateTask } = useTasks();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: { id: Column; title: string; color: string }[] = [
    { id: 'todo', title: 'To Do', color: 'border-neon-blue' },
    { id: 'in-progress', title: 'In Progress', color: 'border-neon-orange' },
    { id: 'completed', title: 'Completed', color: 'border-neon-green' },
  ];

  const getTasksByStatus = (status: Column) => {
    return filteredTasks.filter((task) => task.status === status);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: Column) => {
    if (draggedTask && draggedTask.status !== status) {
      await updateTask(draggedTask.id, { status });
    }
    setDraggedTask(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-neon-orange';
      case 'medium': return 'bg-neon-blue';
      case 'low': return 'bg-neon-green';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-24 shadow-soft p-6 h-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Task Board</h2>
        <p className="text-sm text-gray-500 mt-1">Drag and drop to update status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100%-80px)]">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);

          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
              className={`bg-card-bg rounded-22 p-4 border-t-4 ${column.color}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">{column.title}</h3>
                <span className="px-2 py-1 bg-white rounded-full text-xs font-medium">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-350px)] scrollbar-hide">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No tasks
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      onClick={() => onTaskClick(task)}
                      className="bg-white rounded-22 p-4 cursor-move hover:shadow-soft transition-all duration-200 border border-gray-100"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm flex-1 pr-2">{task.title}</h4>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {task.description && (
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                          <span className="text-xs text-gray-500 capitalize">
                            {task.kitchen_section}
                          </span>
                        </div>

                        {task.due_date && (
                          <div className={`flex items-center gap-1 text-xs ${
                            new Date(task.due_date) < new Date() && task.status !== 'completed'
                              ? 'text-red-500 font-medium'
                              : 'text-gray-500'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {new Date(task.due_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-1">
                        {task.task_type && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
                            {task.task_type}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
