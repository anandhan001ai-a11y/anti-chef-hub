import { useState } from 'react';
import { Plus } from 'lucide-react';
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

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-orange-500 px-6 py-4">
        <h2 className="text-white font-bold text-lg">{title}</h2>
      </div>

      <div className="p-4">
        <div className="space-y-1 mb-4">
          {tasks.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No tasks yet. Add your first task below.</p>
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

        {isAdding ? (
          <AddTaskInput
            onAdd={handleAdd}
            onCancel={() => setIsAdding(false)}
            placeholder="Enter task description..."
          />
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-orange-500 border-2 border-orange-500 border-dashed rounded-lg hover:bg-orange-50 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add task
          </button>
        )}
      </div>
    </div>
  );
}
