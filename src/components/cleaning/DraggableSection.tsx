import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    GripVertical,
    Plus,
    ClipboardList,
    ChevronDown,
    ChevronRight,
    Edit3,
    Check,
    X,
} from 'lucide-react';
import { Task } from '../../lib/taskService';
import DraggableTaskItem from './DraggableTaskItem';

type SectionConfig = {
    id: string;
    title: string;
    collapsed: boolean;
};

type DraggableSectionProps = {
    section: SectionConfig;
    tasks: Task[];
    onAddTask: (sectionKey: string, title: string) => Promise<void>;
    onUpdateTask: (id: string, title: string) => Promise<void>;
    onDeleteTask: (id: string) => Promise<void>;
    onToggleComplete: (id: string, completed: boolean) => Promise<void>;
    onDuplicateTask: (id: string) => Promise<void>;
    onRename: (sectionId: string, newTitle: string) => void;
    onToggleCollapse: (sectionId: string) => void;
    isDragging?: boolean;
};

export default function DraggableSection({
    section,
    tasks,
    onAddTask,
    onUpdateTask,
    onDeleteTask,
    onToggleComplete,
    onDuplicateTask,
    onRename,
    onToggleCollapse,
    isDragging,
}: DraggableSectionProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(section.title);
    const renameInputRef = useRef<HTMLInputElement>(null);
    const addInputRef = useRef<HTMLInputElement>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    useEffect(() => {
        if (isRenaming && renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
        }
    }, [isRenaming]);

    useEffect(() => {
        if (isAdding && addInputRef.current) {
            addInputRef.current.focus();
        }
    }, [isAdding]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskTitle.trim()) {
            await onAddTask(section.id, newTaskTitle.trim());
            setNewTaskTitle('');
            setIsAdding(false);
        }
    };

    const handleRenameSave = () => {
        if (renameValue.trim() && renameValue !== section.title) {
            onRename(section.id, renameValue.trim());
        }
        setIsRenaming(false);
    };

    const handleRenameCancel = () => {
        setRenameValue(section.title);
        setIsRenaming(false);
    };

    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleRenameSave();
        if (e.key === 'Escape') handleRenameCancel();
    };

    const completedCount = tasks.filter((t) => t.status === 'completed').length;
    const totalCount = tasks.length;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white rounded-2xl shadow-lg overflow-hidden border transition-all duration-300 ${isDragging || isSortableDragging
                    ? 'border-[#ff7a00] shadow-[0_0_20px_rgba(255,122,0,0.4)] scale-[1.02] z-50'
                    : 'border-gray-100 hover:shadow-xl'
                }`}
        >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] px-4 py-3 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-1 right-4 w-8 h-8 border-2 border-white rounded-lg rotate-12" />
                </div>

                <div className="relative flex items-center gap-2">
                    {/* Drag Handle */}
                    <button
                        {...attributes}
                        {...listeners}
                        className="p-1.5 hover:bg-white/20 rounded-lg cursor-grab active:cursor-grabbing transition-colors"
                        title="Drag to reorder"
                    >
                        <GripVertical className="w-5 h-5 text-white/80" />
                    </button>

                    {/* Collapse Toggle */}
                    <button
                        onClick={() => onToggleCollapse(section.id)}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                        title={section.collapsed ? 'Expand' : 'Collapse'}
                    >
                        {section.collapsed ? (
                            <ChevronRight className="w-5 h-5 text-white" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-white" />
                        )}
                    </button>

                    {/* Section Icon */}
                    <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-lg">
                        <ClipboardList className="w-4 h-4 text-white" />
                    </div>

                    {/* Title / Rename Input */}
                    {isRenaming ? (
                        <div className="flex-1 flex items-center gap-2">
                            <input
                                ref={renameInputRef}
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={handleRenameKeyDown}
                                className="flex-1 px-2 py-1 bg-white/90 text-gray-800 rounded-lg text-sm font-medium focus:outline-none"
                            />
                            <button onClick={handleRenameSave} className="p-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                                <Check className="w-4 h-4 text-white" />
                            </button>
                            <button onClick={handleRenameCancel} className="p-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2 className="flex-1 text-white font-bold text-lg tracking-wide">{section.title}</h2>
                            <button
                                onClick={() => setIsRenaming(true)}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                title="Rename section"
                            >
                                <Edit3 className="w-4 h-4 text-white/80" />
                            </button>
                        </>
                    )}

                    {/* Progress Counter */}
                    {totalCount > 0 && !isRenaming && (
                        <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                            <span className="text-white text-sm font-medium">{completedCount}/{totalCount}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Task List (Collapsible) */}
            {!section.collapsed && (
                <div className="p-4">
                    <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
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
                                    <DraggableTaskItem
                                        key={task.id}
                                        task={task}
                                        onToggle={onToggleComplete}
                                        onUpdate={onUpdateTask}
                                        onDelete={onDeleteTask}
                                        onDuplicate={onDuplicateTask}
                                    />
                                ))
                            )}
                        </div>
                    </SortableContext>

                    {/* Add Task */}
                    {isAdding ? (
                        <form onSubmit={handleAdd} className="flex gap-2">
                            <input
                                ref={addInputRef}
                                type="text"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="Enter task..."
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff7a00] text-sm"
                            />
                            <button type="submit" className="px-3 py-2 bg-[#ff7a00] text-white rounded-xl text-sm hover:bg-[#ff8f2d]">
                                Add
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-[#ff7a00] border-2 border-[#ff7a00] border-dashed rounded-xl hover:bg-orange-50 hover:border-solid transition-all duration-200 font-medium text-sm group"
                        >
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                            Add task
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
