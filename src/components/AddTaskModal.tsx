import { useState } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { X } from 'lucide-react';

type AddTaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  preselectedDate?: Date | null;
};

export default function AddTaskModal({ isOpen, onClose, preselectedDate }: AddTaskModalProps) {
  const { addTask } = useTasks();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: preselectedDate ? preselectedDate.toISOString().split('T')[0] : '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    status: 'todo' as 'todo' | 'in-progress' | 'completed',
    category: '',
    kitchen_section: 'general' as 'hot' | 'cold' | 'pastry' | 'butchery' | 'general',
    task_type: 'other' as 'costing' | 'menu' | 'audit' | 'inventory' | 'prep' | 'other',
    position: 0,
    calendar_date: preselectedDate ? preselectedDate.toISOString().split('T')[0] : null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addTask(formData);
      onClose();
      setFormData({
        title: '',
        description: '',
        due_date: '',
        priority: 'medium',
        status: 'todo',
        category: '',
        kitchen_section: 'general',
        task_type: 'other',
        position: 0,
        calendar_date: null,
      });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-24 shadow-soft max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-24">
          <h2 className="text-xl font-bold">Add New Task</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-22 border border-gray-200 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/20"
              placeholder="Enter task title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-22 border border-gray-200 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/20 resize-none"
              placeholder="Add task description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-4 py-3 rounded-22 border border-gray-200 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/20"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-3 rounded-22 border border-gray-200 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/20"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kitchen Section
              </label>
              <select
                value={formData.kitchen_section}
                onChange={(e) => setFormData({ ...formData, kitchen_section: e.target.value as any })}
                className="w-full px-4 py-3 rounded-22 border border-gray-200 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/20"
              >
                <option value="general">General</option>
                <option value="hot">Hot Kitchen</option>
                <option value="cold">Cold Kitchen</option>
                <option value="pastry">Pastry</option>
                <option value="butchery">Butchery</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Type
              </label>
              <select
                value={formData.task_type}
                onChange={(e) => setFormData({ ...formData, task_type: e.target.value as any })}
                className="w-full px-4 py-3 rounded-22 border border-gray-200 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/20"
              >
                <option value="other">Other</option>
                <option value="costing">Costing</option>
                <option value="menu">Menu Planning</option>
                <option value="audit">Audit</option>
                <option value="inventory">Inventory</option>
                <option value="prep">Prep</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-3 rounded-22 border border-gray-200 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 rounded-22 border border-gray-200 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/20"
                placeholder="e.g., Weekly Prep"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-neon-blue to-neon-violet text-white font-medium hover:shadow-neon-blue transition-all"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
