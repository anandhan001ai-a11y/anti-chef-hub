import { useState, useEffect } from 'react';
import { X, Trash2, Calendar, Save, Loader2 } from 'lucide-react';
import { Task, updateTask, deleteTask } from '../lib/taskService';

type TaskDetailDrawerProps = {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function TaskDetailDrawer({ task, isOpen, onClose }: TaskDetailDrawerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'pending' | 'completed'>('pending');
  const [loading, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
      setStatus(task.status);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSave = async () => {
    setSaving(true);
    await updateTask(task.id, {
      title,
      description: description || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      status,
    });
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setDeleting(true);
      await deleteTask(task.id);
      setDeleting(false);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold">Edit Task</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto h-[calc(100%-180px)]">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20"
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
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'pending' | 'completed')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff7a00]"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

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

          {/* Board Info */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Board:</span>
              <span className="px-2 py-1 bg-[#ff7a00]/10 text-[#ff7a00] rounded-lg capitalize">
                {task.board_type}
              </span>
              {task.section_key && (
                <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-lg">
                  {task.section_key}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100 bg-white">
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-3 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors font-medium"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${loading
                  ? 'bg-gray-300 text-gray-500'
                  : 'bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] text-white hover:shadow-lg'
                }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
