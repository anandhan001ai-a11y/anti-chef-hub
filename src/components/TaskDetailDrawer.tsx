import { useState, useEffect } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { Task, supabase, TaskComment } from '../lib/supabase';
import { X, Calendar, Tag, Trash2, MessageSquare, Send } from 'lucide-react';

type TaskDetailDrawerProps = {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function TaskDetailDrawer({ task, isOpen, onClose }: TaskDetailDrawerProps) {
  const { updateTask, deleteTask } = useTasks();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (task) {
      setEditedTask(task);
      fetchComments(task.id);
    }
  }, [task]);

  const fetchComments = async (taskId: string) => {
    const { data } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (data) setComments(data);
  };

  const handleSave = async () => {
    if (editedTask && task) {
      await updateTask(task.id, editedTask);
      setIsEditing(false);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (task && window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task.id);
      onClose();
    }
  };

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) return;

    await supabase.from('task_comments').insert([
      { task_id: task.id, comment_text: newComment }
    ]);

    setNewComment('');
    fetchComments(task.id);
  };

  if (!isOpen || !task || !editedTask) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-neon-orange';
      case 'medium': return 'text-neon-blue';
      case 'low': return 'text-neon-green';
      default: return 'text-gray-500';
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-screen w-full md:w-[500px] bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Task Details</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            {isEditing ? (
              <input
                type="text"
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                className="w-full text-2xl font-bold border-b-2 border-gray-200 focus:border-neon-blue focus:outline-none pb-2"
              />
            ) : (
              <h3 className="text-2xl font-bold">{task.title}</h3>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              task.priority === 'high' ? 'bg-neon-orange/10 text-neon-orange' :
              task.priority === 'medium' ? 'bg-neon-blue/10 text-neon-blue' :
              'bg-neon-green/10 text-neon-green'
            }`}>
              {task.priority} priority
            </span>

            <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
              {task.status.replace('-', ' ')}
            </span>

            <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
              {task.kitchen_section}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            {isEditing ? (
              <textarea
                value={editedTask.description}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-22 border border-gray-200 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/20 resize-none"
              />
            ) : (
              <p className="text-gray-600">{task.description || 'No description provided'}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Due Date
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={editedTask.due_date ? editedTask.due_date.split('T')[0] : ''}
                  onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-22 border border-gray-200 focus:outline-none focus:border-neon-blue text-sm"
                />
              ) : (
                <p className="text-gray-600">
                  {task.due_date
                    ? new Date(task.due_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'Not set'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Task Type
              </label>
              {isEditing ? (
                <select
                  value={editedTask.task_type}
                  onChange={(e) => setEditedTask({ ...editedTask, task_type: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-22 border border-gray-200 focus:outline-none focus:border-neon-blue text-sm"
                >
                  <option value="other">Other</option>
                  <option value="costing">Costing</option>
                  <option value="menu">Menu</option>
                  <option value="audit">Audit</option>
                  <option value="inventory">Inventory</option>
                  <option value="prep">Prep</option>
                </select>
              ) : (
                <p className="text-gray-600 capitalize">{task.task_type}</p>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Comments ({comments.length})
            </h4>

            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-22 p-4">
                  <p className="text-sm text-gray-700">{comment.comment_text}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(comment.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-neon-blue text-sm"
              />
              <button
                onClick={handleAddComment}
                className="p-2 bg-neon-blue text-white rounded-full hover:shadow-neon-blue transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-6 py-3 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-neon-blue to-neon-violet text-white font-medium hover:shadow-neon-blue transition-all"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-neon-blue to-neon-violet text-white font-medium hover:shadow-neon-blue transition-all"
              >
                Edit Task
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
