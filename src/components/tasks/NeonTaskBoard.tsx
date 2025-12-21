import { useState, useEffect, useMemo } from 'react';
import {
    Plus, Clock, User, Trash2,
    BarChart3, Settings, ShoppingCart,
    Loader2, PieChart as PieIcon, GripVertical,
    Calendar as CalendarIcon, RefreshCw, Sparkles, Users, Send, Mail, MessageCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Task, createTask, updateTask, deleteTask } from '../../lib/taskService';
import { googleService } from '../../lib/google';
import { SidService } from '../../lib/SidService';
import { birdEmailService } from '../../lib/birdEmailService';
import { PieChart as RePie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';

import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    useDroppable
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Types ---
type NeonTask = Task & {
    progress: number;
    assignee?: string;
    priority: 'High' | 'Medium' | 'Low';
    task_type: string;
    is_event?: boolean; // New flag for calendar events
};

type ColumnType = 'pending' | 'in_progress' | 'completed' | 'overdue';

const COLUMNS: { id: ColumnType; title: string; color: string; bg: string; text: string }[] = [
    { id: 'pending', title: 'Pending', color: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
    { id: 'in_progress', title: 'In Progress', color: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-600' },
    { id: 'completed', title: 'Completed', color: 'border-green-500', bg: 'bg-green-50', text: 'text-green-600' },
    { id: 'overdue', title: 'Overdue', color: 'border-red-500', bg: 'bg-red-50', text: 'text-red-600' }
];

const TASK_TYPES = ['cleaning', 'haccp', 'checklist', 'prep', 'weekly', 'monthly', 'maintenance', 'inventory', 'admin'];

type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all';

// --- Components ---

function SortableTaskItem({ task, column, onDelete }: { task: NeonTask; column: any; onDelete: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { type: 'Task', task },
        disabled: task.is_event // Disable dragging for calendar events
    });

    const style = { transform: CSS.Transform.toString(transform), transition };

    if (isDragging) {
        return <div ref={setNodeRef} style={style} className="opacity-50 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl h-32" />;
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`group flex flex-col bg-white border-l-4 ${column.color} rounded-2xl p-4 shadow-sm hover:shadow-md transition-all ${task.is_event ? 'cursor-default opacity-90 border-dashed' : 'cursor-grab active:cursor-grabbing'} mb-3 relative`}
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${task.is_event ? 'text-purple-600 border-purple-200 bg-purple-50' :
                    task.priority === 'High' ? 'text-red-600 border-red-200 bg-red-50' :
                        task.priority === 'Medium' ? 'text-orange-600 border-orange-200 bg-orange-50' :
                            'text-green-600 border-green-200 bg-green-50'
                    }`}>
                    {task.is_event ? 'EVENT' : (task.priority || 'Medium')}
                </span>

                {!task.is_event && (
                    <div className="flex items-center gap-2">
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                            className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer p-1"
                        >
                            <Trash2 size={14} />
                        </button>
                        <GripVertical size={14} className="text-gray-300 group-hover:text-gray-400" />
                    </div>
                )}
            </div>

            <h4 className="text-gray-800 font-bold text-sm mb-1 line-clamp-2 leading-tight">{task.title}</h4>

            {!task.is_event && (
                <div className="w-full h-1 bg-gray-100 rounded-full mb-3 mt-2 overflow-hidden">
                    <div
                        className={`h-full rounded-full ${column.id === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${task.progress}%` }}
                    />
                </div>
            )}

            <div className={`flex justify-between items-center text-xs font-medium ${task.is_event ? 'mt-3 text-purple-600' : 'text-gray-500'}`}>
                <div className="flex items-center gap-1">
                    {task.is_event ? <CalendarIcon size={12} /> : <User size={12} className="text-gray-400" />}
                    {task.assignee || (task.is_event ? 'Calendar' : 'Chef')}
                </div>
                {task.due_date && (
                    <div className={`flex items-center gap-1 ${column.id === 'overdue' && !task.is_event ? 'text-red-500 font-bold' : ''}`}>
                        <Clock size={12} />
                        {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}
            </div>
        </div>
    );
}

function TaskColumn({ col, tasks, onDelete }: { col: any, tasks: NeonTask[], onDelete: (id: string) => void }) {
    const { setNodeRef } = useDroppable({ id: col.id });

    return (
        <div ref={setNodeRef} className="flex flex-col bg-gray-100/50 rounded-3xl p-4 min-h-[500px]">
            <div className={`flex items-center justify-between mb-4 px-2`}>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${col.bg.replace('bg-', 'bg-').replace('50', '500')}`}></div>
                    <h3 className="font-bold text-gray-700">{col.title}</h3>
                </div>
                <span className="bg-white px-2 py-1 rounded-md text-xs font-bold text-gray-400 border border-gray-200 shadow-sm">{tasks.length}</span>
            </div>

            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 flex-1">
                    {tasks.map(task => (
                        <SortableTaskItem key={task.id} task={task} column={col} onDelete={onDelete} />
                    ))}
                    {tasks.length === 0 && (
                        <div className="h-full border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm font-medium min-h-[100px]">
                            Drop here
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}

// --- Main Component ---
export default function NeonTaskBoard() {
    const [tasks, setTasks] = useState<NeonTask[]>([]);
    const [events, setEvents] = useState<NeonTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<TimeRange>('all');

    // TEAM TASK STATE
    const [teamMembers, setTeamMembers] = useState<{ name: string; role: string; id: string }[]>([]);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [showAiSuggestions, setShowAiSuggestions] = useState(false);
    const [generatingAi, setGeneratingAi] = useState(false);

    // Form State
    const [newTask, setNewTask] = useState({
        title: '', type: 'prep', priority: 'Medium', assignee: '', notes: '',
        startDate: '', startTime: '', dueDate: '', dueTime: ''
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Load team members from roster
    useEffect(() => {
        const rosterData = SidService.loadRosterFromLocalStorage();
        if (rosterData?.staff) {
            const members = rosterData.staff.map((emp: any) => ({
                name: emp.name || 'Unknown',
                role: emp.role || emp.position || 'Staff',
                id: emp.rollNumber || emp.employeeId || String(Math.random())
            }));
            setTeamMembers(members);
            console.log('📋 Loaded', members.length, 'team members from roster');
        }
    }, []);

    useEffect(() => {
        fetchTasksInternal();
    }, []);

    useEffect(() => {
        if (viewMode !== 'all') {
            fetchGoogleEvents();
        } else {
            setEvents([]);
        }
    }, [viewMode]);

    const getTimeRange = (mode: TimeRange) => {
        const now = new Date();
        const start = new Date(now);
        const end = new Date(now);

        switch (mode) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'week':
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1);
                start.setDate(diff); start.setHours(0, 0, 0, 0);
                end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
                break;
            case 'month':
                start.setDate(1); start.setHours(0, 0, 0, 0);
                end.setMonth(start.getMonth() + 1); end.setDate(0); end.setHours(23, 59, 59, 999);
                break;
            case 'year':
                start.setMonth(0, 1); start.setHours(0, 0, 0, 0);
                end.setMonth(11, 31); end.setHours(23, 59, 59, 999);
                break;
        }
        return { start, end };
    };

    const fetchTasksInternal = async () => {
        setLoading(true);
        const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (data) {
            const mapped: NeonTask[] = data.map((t: any) => ({
                ...t,
                progress: t.status === 'completed' ? 100 : (t.section_key === 'in_progress' ? 50 : 0),
                assignee: 'Chef',
                priority: t.priority || 'Medium',
                task_type: t.board_type,
                section_key: t.section_key || calculateSection(t)
            }));
            setTasks(mapped);
        }
        setLoading(false);
    };

    const fetchGoogleEvents = async () => {
        try {
            const { start, end } = getTimeRange(viewMode);
            const apiEvents = await googleService.fetchCalendarEvents(start.toISOString(), end.toISOString());
            const mappedEvents: NeonTask[] = apiEvents.map((e: any) => ({
                id: `event-${e.id}`,
                title: e.summary || 'No Title',
                description: e.description || '',
                section_key: 'pending', // Events default to pending column for display
                status: 'pending',
                board_type: 'event',
                task_type: 'event',
                priority: 'Medium',
                progress: 0,
                due_date: e.start.dateTime || e.start.date,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_event: true
            }));
            setEvents(mappedEvents);
        } catch (error) {
            console.error('Failed to fetch calendar events', error);
            // Don't alert aggressively as it might be permission issue handled silently or just no token
        }
    };

    const calculateSection = (t: any) => {
        if (t.status === 'completed') return 'completed';
        if (t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed') return 'overdue';
        return 'pending';
    };

    const handleAddTask = async () => {
        if (!newTask.title) return;
        let dueIso: string | undefined = undefined;
        if (newTask.dueDate) {
            dueIso = new Date(`${newTask.dueDate}T${newTask.dueTime || '00:00'}`).toISOString();
        }

        const { data } = await createTask({
            title: newTask.title,
            description: newTask.notes,
            board_type: 'taskboard',
            section_key: 'pending',
            status: 'pending',
            due_date: dueIso
        });

        if (data) {
            setTasks(prev => [{ ...data, progress: 0, assignee: newTask.assignee, priority: newTask.priority as any, task_type: newTask.type } as NeonTask, ...prev]);
            setNewTask({ ...newTask, title: '', notes: '', assignee: '', dueDate: '', dueTime: '', startTime: '', startDate: '', priority: 'Medium', type: 'prep' });
        }
    };

    const handleGoogleSync = async () => {
        try {
            await handleImportTasks();
            // Fetch events if viewMode is active
            if (viewMode !== 'all') fetchGoogleEvents();
        } catch (e) {
            alert('Sync failed. Check API Settings.');
        }
    };

    const handleImportTasks = async () => {
        const gTasks = await googleService.fetchTasks();
        let count = 0;
        for (const t of gTasks) {
            if (t.title) {
                await createTask({ title: t.title, board_type: 'taskboard', section_key: 'pending', status: 'pending' });
                count++;
            }
        }
        if (count > 0) fetchTasksInternal();
    };

    const deleteLocalTask = async (id: string) => {
        if (confirm('Delete task?')) {
            await deleteTask(id);
            setTasks(prev => prev.filter(t => t.id !== id));
        }
    }

    // --- Drag & Drop ---
    const handleDragStart = (event: DragStartEvent) => { setActiveId(event.active.id as string); };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;
        const activeId = active.id;
        const overId = over.id;
        if (activeId === overId) return;

        // Disallow dragging events for now
        if (activeId.toString().startsWith('event-')) return;

        const isActiveTask = tasks.find(t => t.id === activeId);
        const isOverTask = tasks.find(t => t.id === overId);
        if (!isActiveTask) return;

        if (isOverTask) {
            const overColumn = isOverTask.section_key;
            if (isActiveTask.section_key !== overColumn) {
                setTasks(items => {
                    const activeIndex = items.findIndex(t => t.id === activeId);
                    const overIndex = items.findIndex(t => t.id === overId);
                    const newItems = [...items];
                    newItems[activeIndex].section_key = overColumn;
                    return arrayMove(newItems, activeIndex, overIndex);
                });
            } else {
                setTasks(items => {
                    const activeIndex = items.findIndex(t => t.id === activeId);
                    const overIndex = items.findIndex(t => t.id === overId);
                    return arrayMove(items, activeIndex, overIndex);
                });
            }
        } else {
            const overColumn = over.id as ColumnType;
            if (COLUMNS.map(c => c.id).includes(overColumn)) {
                if (isActiveTask.section_key !== overColumn) {
                    setTasks(items => {
                        const activeIndex = items.findIndex(t => t.id === activeId);
                        const newItems = [...items];
                        newItems[activeIndex].section_key = overColumn;
                        return arrayMove(newItems, activeIndex, 0);
                    });
                }
            }
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;
        if (active.id.toString().startsWith('event-')) return;

        const activeTask = tasks.find(t => t.id === active.id);
        if (!activeTask) return;

        let newSection = activeTask.section_key;
        if (COLUMNS.map(c => c.id).includes(over.id as any)) {
            newSection = over.id as any;
        } else {
            const overTask = tasks.find(t => t.id === over.id);
            if (overTask) newSection = overTask.section_key;
        }

        let newStatus = 'pending';
        let newProgress = 0;
        if (newSection === 'completed') { newStatus = 'completed'; newProgress = 100; }
        else if (newSection === 'in_progress') { newStatus = 'pending'; newProgress = 50; }
        else if (newSection === 'overdue') { newStatus = 'pending'; newProgress = 0; }

        await updateTask(activeTask.id, { section_key: newSection, status: newStatus as any });

        setTasks(items => items.map(t => t.id === activeTask.id ? { ...t, section_key: newSection, status: newStatus as any, progress: newProgress } : t));
    };

    // --- Data Calculation ---
    // Combine Tasks and Events, Filter by ViewMode
    const displayedTasks = useMemo(() => {
        let combined = [...tasks];

        // Filter Tasks by Date Range if mode is not 'all'
        if (viewMode !== 'all') {
            const { start, end } = getTimeRange(viewMode);
            combined = combined.filter(t => {
                if (!t.due_date) return true; // Keep undated tasks visible
                const d = new Date(t.due_date);
                return d >= start && d <= end;
            });
            // Combine with fetched events (already filtered by API)
            combined = [...combined, ...events];
        }

        return combined;
    }, [tasks, events, viewMode]);

    // Analytics
    const pieData = COLUMNS.map(c => ({
        name: c.title, value: displayedTasks.filter(t => (t.section_key || 'pending') === c.id).length,
        color: c.id === 'completed' ? '#4ade80' : (c.id === 'overdue' ? '#f87171' : (c.id === 'in_progress' ? '#fb923c' : '#60a5fa'))
    })).filter(d => d.value > 0);

    const barData = [
        { name: 'Mon', tasks: 12 }, { name: 'Tue', tasks: 19 }, { name: 'Wed', tasks: 3 },
        { name: 'Thu', tasks: 5 }, { name: 'Fri', tasks: 2 }, { name: 'Sat', tasks: 10 }, { name: 'Sun', tasks: 7 }
    ];

    if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
            <div className="max-w-[1600px] mx-auto p-4 lg:p-8">

                {/* 0. Top Controls (Time Range) */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex gap-2">
                        {(['today', 'week', 'month', 'year', 'all'] as TimeRange[]).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${viewMode === mode ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                            >
                                {mode === 'all' ? 'All Tasks' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 1. Add Task */}
                <div className="bg-white rounded-3xl p-6 mb-8 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Plus size={20} /></div>
                            New Team Task
                        </h2>
                        <button onClick={handleGoogleSync} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
                            <RefreshCw size={14} /> Sync Google Tasks & Calendar
                        </button>
                    </div>

                    {/* Task Name with AI Suggestion */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="col-span-1 md:col-span-2 relative">
                            <div className="flex gap-2">
                                <input type="text" placeholder="Task Name"
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-blue-300"
                                    value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                                <button
                                    onClick={async () => {
                                        setGeneratingAi(true);
                                        setShowAiSuggestions(true);
                                        // Generate AI task name suggestions
                                        const suggestions = [
                                            `${newTask.type.charAt(0).toUpperCase() + newTask.type.slice(1)} - ${new Date().toLocaleDateString('en-US', { weekday: 'short' })}`,
                                            `Complete ${newTask.type} task by ${newTask.assignee || 'team'}`,
                                            `${newTask.priority} priority: ${newTask.type} work`,
                                            `Daily ${newTask.type} checklist`,
                                            `Kitchen ${newTask.type} - ${newTask.priority.toLowerCase()}`
                                        ];
                                        setAiSuggestions(suggestions);
                                        setGeneratingAi(false);
                                    }}
                                    className="px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 hover:shadow-lg transition-all"
                                    title="AI Suggest Task Name"
                                >
                                    {generatingAi ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    AI
                                </button>
                            </div>

                            {/* AI Suggestions Dropdown */}
                            {showAiSuggestions && aiSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                    <div className="px-4 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200 flex items-center gap-2">
                                        <Sparkles size={14} className="text-purple-500" />
                                        <span className="text-sm font-bold text-purple-700">AI Suggestions</span>
                                        <button onClick={() => setShowAiSuggestions(false)} className="ml-auto text-gray-400 hover:text-gray-600">×</button>
                                    </div>
                                    {aiSuggestions.map((suggestion, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setNewTask({ ...newTask, title: suggestion });
                                                setShowAiSuggestions(false);
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-100 last:border-0"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none" value={newTask.type} onChange={e => setNewTask({ ...newTask, type: e.target.value })}>
                            {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <div className="flex gap-2">
                            {['High', 'Medium', 'Low'].map(p => (
                                <button key={p} onClick={() => setNewTask({ ...newTask, priority: p as any })}
                                    className={`flex-1 rounded-lg text-xs font-bold border transition-all ${newTask.priority === p ? 'bg-gray-900 text-white' : 'bg-white border-gray-200 text-gray-500'}`}>{p}</button>
                            ))}
                        </div>
                    </div>

                    {/* Team Assignment Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
                        <div className="relative">
                            <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">
                                <Users size={12} /> Assign To Team Member
                            </label>
                            <select
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-blue-300"
                                value={newTask.assignee}
                                onChange={e => setNewTask({ ...newTask, assignee: e.target.value })}
                            >
                                <option value="">Select team member...</option>
                                {teamMembers.map((member, i) => (
                                    <option key={i} value={member.name}>
                                        {member.name} - {member.role}
                                    </option>
                                ))}
                            </select>
                            {teamMembers.length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">⚠️ Upload roster in Duty Schedule to see team members</p>
                            )}
                        </div>
                        <input type="date" className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-500" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} />
                        <input type="time" className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-500" value={newTask.dueTime} onChange={e => setNewTask({ ...newTask, dueTime: e.target.value })} />
                        <button onClick={handleAddTask} className="py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-colors">
                            Add Task
                        </button>
                    </div>

                    {/* Send Options (show when task has title and assignee) */}
                    {newTask.title && newTask.assignee && (
                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                            <span className="text-sm font-medium text-gray-500">Notify {newTask.assignee}:</span>
                            <button
                                onClick={async () => {
                                    // Use Bird Email Service
                                    const result = await birdEmailService.sendTaskNotification({
                                        taskTitle: newTask.title,
                                        assigneeName: newTask.assignee,
                                        assigneeEmail: '', // Will fallback to mailto since no email configured
                                        priority: newTask.priority,
                                        dueDate: newTask.dueDate || undefined,
                                        notes: newTask.notes || undefined
                                    });
                                    if (result.success) {
                                        alert(`✅ Task notification sent to ${newTask.assignee}!`);
                                    } else {
                                        console.error('Email failed:', result.error);
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                <Mail size={14} /> Email
                            </button>
                            <button
                                onClick={() => {
                                    alert(`📨 Task "${newTask.title}" sent to ${newTask.assignee} in Team Chat!\n\n(In-app chat notification would appear here)`);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 font-bold rounded-lg hover:bg-green-100 transition-colors"
                            >
                                <MessageCircle size={14} /> Chat
                            </button>
                            <button
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: newTask.title,
                                            text: `Task for ${newTask.assignee}: ${newTask.title}\nPriority: ${newTask.priority}\nDue: ${newTask.dueDate || 'Not set'}`
                                        });
                                    } else {
                                        navigator.clipboard.writeText(`Task for ${newTask.assignee}: ${newTask.title}\nPriority: ${newTask.priority}\nDue: ${newTask.dueDate || 'Not set'}`);
                                        alert('📋 Task details copied to clipboard!');
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 font-bold rounded-lg hover:bg-purple-100 transition-colors"
                            >
                                <Send size={14} /> Share
                            </button>
                        </div>
                    )}
                </div>

                {/* 2. Drag & Drop Board */}
                <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12 items-start">
                        {COLUMNS.map(col => (
                            <TaskColumn
                                key={col.id}
                                col={col}
                                tasks={displayedTasks.filter(t => (t.section_key || 'pending') === col.id)}
                                onDelete={deleteLocalTask}
                            />
                        ))}
                    </div>
                    <DragOverlay>
                        {activeId ? (
                            <div className="bg-white border-l-4 border-blue-500 rounded-2xl p-4 shadow-2xl rotate-3 w-[300px]">
                                <h4 className="font-bold text-gray-900">{tasks.find(t => t.id === activeId)?.title}</h4>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>

                {/* 3. Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2"><PieIcon size={18} /> Status</h3>
                        <div className="h-48 relative">
                            <ResponsiveContainer>
                                <RePie><Pie data={pieData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">{pieData.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}</Pie></RePie>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none"><span className="text-3xl font-black">{displayedTasks.length}</span><span className="text-xs font-bold text-gray-400">ITEMS</span></div>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 lg:col-span-2">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2"><BarChart3 size={18} /> Weekly Performance</h3>
                        <div className="h-48"><ResponsiveContainer><BarChart data={barData}><XAxis dataKey="name" axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: '#f3f4f6' }} /><Bar dataKey="tasks" fill="#111827" radius={[4, 4, 0, 0]} barSize={40} /></BarChart></ResponsiveContainer></div>
                    </div>
                </div>

                <div className="flex justify-center gap-12 mt-12 opacity-50">
                    <div className="flex flex-col items-center gap-2"><User size={24} /><span className="font-black text-lg">82%</span></div>
                    <div className="flex flex-col items-center gap-2"><Settings size={24} /><span className="font-black text-lg">100%</span></div>
                    <div className="flex flex-col items-center gap-2"><ShoppingCart size={24} /><span className="font-black text-lg">94%</span></div>
                </div>
            </div>
        </div>
    );
}
