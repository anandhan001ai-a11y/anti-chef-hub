import { useState } from 'react';
import { Plus, ClipboardList } from 'lucide-react';
import { CleaningTask, TaskSectionKey } from '../../lib/supabase';
import TaskItem from './TaskItem';
import AddTaskInput from './AddTaskInput';

type TaskSectionProps = {
  title: string;
  sectionKey: TaskSectionKey;
  tasks: CleaningTask[];
  onAddTask: (section: TaskSectionKey, text: string) => Promise<void>;
  onUpdateTask: (id: string, text: string) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onToggleComplete: (id: string, completed: boolean) => Promise<void>;
};

export default function TaskSection({
  title,
  sectionKey,
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleComplete,
}: TaskSectionProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (text: string) => {
    await onAddTask(sectionKey, text);
    setIsAdding(false);
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Enhanced Header */}
      <div className="relative bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] px-6 py-4 overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1 right-4 w-8 h-8 border-2 border-white rounded-lg rotate-12" />
          <div className="absolute bottom-1 right-12 w-4 h-4 border border-white rounded-full" />
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-white font-bold text-lg tracking-wide">{title}</h2>
          </div>
          {totalCount > 0 && (
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-white text-sm font-medium">
                {completedCount}/{totalCount}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="p-4">
        <div className="space-y-1 mb-4 max-h-[400px] overflow-y-auto scrollbar-hide">
          {tasks.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-orange-50 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                <ClipboardList className="w-8 h-8 text-orange-300" />
              </div>
              <p className="text-gray-400 text-sm">No tasks yet.</p>
              <p className="text-gray-300 text-xs mt-1">Add your first task below.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggleComplete}
                onUpdate={onUpdateTask}
                onDelete={onDeleteTask}
              />
            ))
          )}
        </div>

        {/* Add Task Button/Input */}
        {isAdding ? (
          <AddTaskInput
            onAdd={handleAdd}
            onCancel={() => setIsAdding(false)}
            placeholder="Enter task description..."
          />
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-[#ff7a00] border-2 border-[#ff7a00] border-dashed rounded-xl hover:bg-orange-50 hover:border-solid transition-all duration-200 font-medium text-sm group/btn"
          >
            <Plus className="w-4 h-4 group-hover/btn:rotate-90 transition-transform duration-200" />
            Add task
          </button>
        )}
      </div>
    </div>
  );
}
