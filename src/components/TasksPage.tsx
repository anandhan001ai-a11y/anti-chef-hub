import { useState } from 'react';
import { Task } from '../lib/taskService';
import { List, LayoutGrid } from 'lucide-react';
import TodoList from './TodoList';
import KanbanBoard from './KanbanBoard';

type TasksPageProps = {
    onTaskClick: (task: Task) => void;
    searchQuery: string;
};

export default function TasksPage({ onTaskClick, searchQuery }: TasksPageProps) {
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

    return (
        <div className="flex flex-col h-full">
            {/* View Toggle */}
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>

                <div className="flex bg-gray-100 rounded-xl p-1">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'list'
                                ? 'bg-white shadow-sm text-[#ff7a00]'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <List className="w-4 h-4" />
                        <span className="text-sm font-medium">List</span>
                    </button>
                    <button
                        onClick={() => setViewMode('board')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'board'
                                ? 'bg-white shadow-sm text-[#ff7a00]'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        <span className="text-sm font-medium">Board</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {viewMode === 'list' ? (
                    <TodoList onTaskClick={onTaskClick} searchQuery={searchQuery} />
                ) : (
                    <KanbanBoard onTaskClick={onTaskClick} searchQuery={searchQuery} />
                )}
            </div>
        </div>
    );
}
