import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { RotateCcw, AlertCircle, ChefHat, Sparkles, Loader2 } from 'lucide-react';
import { Task, fetchTasks, createTask, updateTask, deleteTask, toggleTaskStatus } from '../../lib/taskService';
import DraggableSection from './DraggableSection';

type SectionConfig = {
  id: string;
  title: string;
  collapsed: boolean;
};

const defaultSections: SectionConfig[] = [
  { id: 'shift', title: 'Shift Tasks', collapsed: false },
  { id: 'endOfDay', title: 'End of Day Tasks', collapsed: false },
  { id: 'weekly', title: 'Weekly Tasks', collapsed: false },
  { id: 'monthly', title: 'Monthly Tasks', collapsed: false },
];

export default function CleaningTaskBoard() {
  const [tasks, setTasks] = useState<Record<string, Task[]>>({
    shift: [],
    endOfDay: [],
    weekly: [],
    monthly: [],
  });
  const [sections, setSections] = useState<SectionConfig[]>(() => {
    const saved = localStorage.getItem('cleaningSections');
    return saved ? JSON.parse(saved) : defaultSections;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Save sections to localStorage
  useEffect(() => {
    localStorage.setItem('cleaningSections', JSON.stringify(sections));
  }, [sections]);

  // Load tasks from Supabase
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await fetchTasks('cleaning');

    if (error) {
      // Check if it's a "table not found" error
      if (error.message.includes('public.tasks') ||
        error.message.includes('relation') ||
        error.message.includes('schema cache')) {
        setError('Database table not set up. Please ensure the tasks table exists.');
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    // Group tasks by section_key
    const grouped: Record<string, Task[]> = {
      shift: [],
      endOfDay: [],
      weekly: [],
      monthly: [],
    };

    (data || []).forEach((task) => {
      const sectionKey = task.section_key || 'shift';
      if (grouped[sectionKey]) {
        grouped[sectionKey].push(task);
      }
    });

    setTasks(grouped);
    setLoading(false);
  };

  const handleAddTask = async (sectionKey: string, title: string) => {
    const sortIndex = tasks[sectionKey]?.length || 0;

    const { data, error } = await createTask({
      title,
      board_type: 'cleaning',
      section_key: sectionKey,
      sort_index: sortIndex,
    });

    if (!error && data) {
      setTasks(prev => ({
        ...prev,
        [sectionKey]: [...(prev[sectionKey] || []), data],
      }));
    }
  };

  const handleUpdateTask = async (id: string, title: string) => {
    // Optimistic update
    setTasks(prev => {
      const newTasks = { ...prev };
      Object.keys(newTasks).forEach(key => {
        newTasks[key] = newTasks[key].map(t =>
          t.id === id ? { ...t, title } : t
        );
      });
      return newTasks;
    });

    await updateTask(id, { title });
  };

  const handleDeleteTask = async (id: string) => {
    // Optimistic update
    setTasks(prev => {
      const newTasks = { ...prev };
      Object.keys(newTasks).forEach(key => {
        newTasks[key] = newTasks[key].filter(t => t.id !== id);
      });
      return newTasks;
    });

    await deleteTask(id);
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    // Optimistic update
    setTasks(prev => {
      const newTasks = { ...prev };
      Object.keys(newTasks).forEach(key => {
        newTasks[key] = newTasks[key].map(t =>
          t.id === id ? { ...t, status: completed ? 'completed' : 'pending' } : t
        );
      });
      return newTasks;
    });

    await toggleTaskStatus(id, completed);
  };

  const handleDuplicateTask = async (id: string) => {
    let taskToDuplicate: Task | undefined;
    let sectionKey: string | undefined;

    Object.keys(tasks).forEach(key => {
      const found = tasks[key].find(t => t.id === id);
      if (found) {
        taskToDuplicate = found;
        sectionKey = key;
      }
    });

    if (taskToDuplicate && sectionKey) {
      await handleAddTask(sectionKey, `${taskToDuplicate.title} (copy)`);
    }
  };

  const handleRenameSection = (sectionId: string, newTitle: string) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, title: newTitle } : s
    ));
  };

  const handleToggleCollapse = (sectionId: string) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s
    ));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Find the active task
    Object.values(tasks).forEach(sectionTasks => {
      const found = sectionTasks.find(t => t.id === active.id);
      if (found) setActiveTask(found);
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveTask(null);

    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    if (activeIdStr === overIdStr) return;

    // Handle section reordering
    if (sections.some(s => s.id === activeIdStr)) {
      const oldIndex = sections.findIndex(s => s.id === activeIdStr);
      const newIndex = sections.findIndex(s => s.id === overIdStr);
      if (oldIndex !== -1 && newIndex !== -1) {
        setSections(arrayMove(sections, oldIndex, newIndex));
      }
    }
  };

  const handleReset = () => {
    setSections(defaultSections);
    localStorage.removeItem('cleaningSections');
    setShowResetConfirm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#ff7a00] animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={loadTasks} className="mt-4 text-[#ff7a00] hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-[#ff7a00] via-[#ff8f2d] to-[#ff7a00] py-10 px-6 shadow-xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-4 left-10 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-4 right-20 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center justify-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg animate-pulse" />
              <div className="relative bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                <ChefHat className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg tracking-tight">
                Chef Check List
              </h1>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Sparkles className="w-4 h-4 text-white/80" />
                <p className="text-white/90 text-sm font-medium">Drag sections & tasks to customize</p>
                <Sparkles className="w-4 h-4 text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Board */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sections.map(s => s.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sections.map((section) => (
                <DraggableSection
                  key={section.id}
                  section={section}
                  tasks={tasks[section.id] || []}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onToggleComplete={handleToggleComplete}
                  onDuplicateTask={handleDuplicateTask}
                  onRename={handleRenameSection}
                  onToggleCollapse={handleToggleCollapse}
                  isDragging={activeId === section.id}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeId && activeTask && (
              <div className="bg-white p-3 rounded-xl shadow-2xl border-2 border-[#ff7a00] opacity-90">
                <span className="text-sm text-gray-700">{activeTask.title}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {/* Reset Button */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="group flex items-center gap-2 px-6 py-3 bg-white text-gray-600 border-2 border-gray-200 rounded-xl hover:border-[#ff7a00] hover:text-[#ff7a00] transition-all duration-300 font-medium shadow-sm hover:shadow-md"
          >
            <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            Reset Layout
          </button>
        </div>
      </div>

      {/* Reset Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-[#ff7a00]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Reset Layout?</h3>
                <p className="text-gray-600 text-sm">This will reset section names and order to defaults.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] text-white rounded-xl hover:shadow-lg transition-all font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
