import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, Check, X, Copy } from 'lucide-react';
import { Task } from '../../lib/taskService';

type DraggableTaskItemProps = {
    task: Task;
    onToggle: (id: string, completed: boolean) => void;
    onUpdate: (id: string, title: string) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
};

export default function DraggableTaskItem({
    task,
    onToggle,
    onUpdate,
    onDelete,
    onDuplicate,
}: DraggableTaskItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.title);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (editText.trim() && editText !== task.title) {
            await onUpdate(task.id, editText.trim());
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditText(task.title);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') handleCancel();
    };

    const isCompleted = task.status === 'completed';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center gap-2 p-3 rounded-xl transition-all duration-200 ${isDragging
                    ? 'bg-orange-50 shadow-lg border-2 border-[#ff7a00] shadow-[0_0_15px_rgba(255,122,0,0.3)] z-50'
                    : isCompleted
                        ? 'bg-gray-50 hover:bg-gray-100 opacity-70'
                        : 'hover:bg-gradient-to-r hover:from-orange-50 hover:to-transparent'
                }`}
        >
            {/* Drag Handle */}
            <button
                {...attributes}
                {...listeners}
                className="p-1 text-gray-400 hover:text-[#ff7a00] cursor-grab active:cursor-grabbing transition-colors opacity-0 group-hover:opacity-100"
                title="Drag to reorder"
            >
                <GripVertical className="w-4 h-4" />
            </button>

            {/* Checkbox with glow effect */}
            <div className="flex-shrink-0">
                <label className="relative flex items-center justify-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={(e) => onToggle(task.id, e.target.checked)}
                        className="peer sr-only"
                    />
                    <div
                        className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center
              ${isCompleted
                                ? 'bg-gradient-to-br from-[#ff7a00] to-[#ff8f2d] border-[#ff7a00] shadow-[0_0_8px_rgba(255,122,0,0.5)]'
                                : 'border-gray-300 hover:border-[#ff7a00] hover:shadow-[0_0_12px_rgba(255,122,0,0.3)]'
                            }`}
                    >
                        {isCompleted && <Check className="w-3 h-3 text-white" />}
                    </div>
                </label>
            </div>

            {/* Text / Edit Input */}
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
                    <button onClick={handleSave} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Check className="w-4 h-4" />
                    </button>
                    <button onClick={handleCancel} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <>
                    <span
                        className={`flex-1 text-sm transition-all duration-200 ${isCompleted ? 'line-through text-gray-400' : 'text-gray-700 font-medium'
                            }`}
                    >
                        {task.title}
                    </span>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button
                            onClick={() => onDuplicate(task.id)}
                            className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Duplicate task"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
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
