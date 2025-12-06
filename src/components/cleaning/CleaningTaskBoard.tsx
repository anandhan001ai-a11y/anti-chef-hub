import { useState } from 'react';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { useCleaningTasks } from '../../contexts/CleaningTaskContext';
import TaskSection from './TaskSection';
import SuppliesSection from './SuppliesSection';

export default function CleaningTaskBoard() {
  const {
    tasks,
    supplies,
    loading,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    addSupply,
    updateSupply,
    deleteSupply,
    resetToDefaults,
  } = useCleaningTasks();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetToDefaults();
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Error resetting to defaults:', error);
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading cleaning checklist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-orange-500 py-8 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center">
            Front-of-house cleaning checklist
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <TaskSection
              title="Shift tasks:"
              sectionKey="shift"
              tasks={tasks.shift}
              onAddTask={addTask}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onToggleComplete={toggleTaskComplete}
            />

            <TaskSection
              title="Weekly tasks:"
              sectionKey="weekly"
              tasks={tasks.weekly}
              onAddTask={addTask}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onToggleComplete={toggleTaskComplete}
            />

            <TaskSection
              title="Monthly tasks:"
              sectionKey="monthly"
              tasks={tasks.monthly}
              onAddTask={addTask}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onToggleComplete={toggleTaskComplete}
            />
          </div>

          <div className="space-y-6">
            <TaskSection
              title="End of day tasks:"
              sectionKey="endOfDay"
              tasks={tasks.endOfDay}
              onAddTask={addTask}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onToggleComplete={toggleTaskComplete}
            />

            <SuppliesSection
              supplies={supplies}
              onAddSupply={addSupply}
              onUpdateSupply={updateSupply}
              onDeleteSupply={deleteSupply}
            />
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to defaults
          </button>
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Reset to defaults?</h3>
                <p className="text-gray-600">
                  This will delete all your current tasks and supplies, and restore the original
                  default checklist. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
              >
                {isResetting ? 'Resetting...' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
