import { useState } from 'react';
import { X, Calendar, Plus } from 'lucide-react';
import { createTask, BoardType } from '../lib/taskService';

type AddTaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  preselectedDate?: Date | null;
};

export default function AddTaskModal({ isOpen, onClose, preselectedDate }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(
    preselectedDate ? preselectedDate.toISOString().split('T')[0] : ''
  );
  const [boardType, setBoardType] = useState<BoardType>('todo');
  const [sectionKey, setSectionKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await createTask({
      title: title.trim(),
      description: description.trim() || undefined,
      board_type: boardType,
      section_key: sectionKey || undefined,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Reset and close
    setTitle('');
    setDescription('');
    setDueDate('');
    setBoardType('todo');
    setSectionKey('');
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">Add New Task</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 resize-none"
            />
          </div>

          {/* Board Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add to
            </label>
            <select
              value={boardType}
              onChange={(e) => {
                setBoardType(e.target.value as BoardType);
                setSectionKey('');
              }}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff7a00]"
            >
              <option value="todo">To-Do List</option>
              <option value="taskboard">Task Board</option>
              <option value="cleaning">Cleaning Board</option>
            </select>
          </div>

          {/* Section (for cleaning board) */}
          {boardType === 'cleaning' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section
              </label>
              <select
                value={sectionKey}
                onChange={(e) => setSectionKey(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff7a00]"
              >
                <option value="shift">Shift Tasks</option>
                <option value="endOfDay">End of Day Tasks</option>
                <option value="weekly">Weekly Tasks</option>
                <option value="monthly">Monthly Tasks</option>
              </select>
            </div>
          )}

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff7a00]"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] text-white hover:shadow-lg'
                }`}
            >
              {loading ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
