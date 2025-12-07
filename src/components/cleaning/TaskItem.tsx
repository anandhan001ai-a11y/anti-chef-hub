import { useState, useRef, useEffect } from 'react';
import { Edit2, Trash2, Check, X } from 'lucide-react';
import { CleaningTask } from '../../lib/supabase';

type TaskItemProps = {
  task: CleaningTask;
  onToggle: (id: string, completed: boolean) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
};

export default function TaskItem({ task, onToggle, onUpdate, onDelete }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editText.trim() && editText !== task.text) {
      await onUpdate(task.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(task.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${task.completed
        ? 'bg-gray-50 hover:bg-gray-100'
        : 'hover:bg-gradient-to-r hover:from-orange-50 hover:to-transparent'
      }`}>
      <div className="flex-shrink-0">
        <label className="relative flex items-center justify-center cursor-pointer">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={(e) => onToggle(task.id, e.target.checked)}
            className="peer sr-only"
          />
          <div className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${task.completed
              ? 'bg-gradient-to-br from-[#ff7a00] to-[#ff8f2d] border-[#ff7a00]'
              : 'border-gray-300 hover:border-[#ff7a00]'
            }`}>
            {task.completed && <Check className="w-3 h-3 text-white" />}
          </div>
        </label>
      </div>

      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-1.5 border-2 border-[#ff7a00] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/30 text-sm"
          />
          <button
            onClick={handleSave}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Save"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <span
            className={`flex-1 text-sm transition-all duration-200 ${task.completed
                ? 'line-through text-gray-400'
                : 'text-gray-700 font-medium'
              }`}
          >
            {task.text}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-500 hover:text-[#ff7a00] hover:bg-orange-50 rounded-lg transition-colors"
              title="Edit task"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
