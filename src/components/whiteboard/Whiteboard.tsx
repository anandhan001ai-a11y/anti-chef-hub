import { useState, useRef, useEffect } from 'react';
import {
    MousePointer2, Hand, PenTool, Type, StickyNote, Square, Circle as CircleIcon,
    X, Trash2, Layers
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// --- Types ---
type ToolType = 'select' | 'hand' | 'pen' | 'text' | 'sticky' | 'rect' | 'circle';

interface WhiteboardItem {
    id: string;
    type: 'text' | 'sticky' | 'rect' | 'circle' | 'path' | 'task';
    x: number;
    y: number;
    width?: number;
    height?: number;
    content?: string; // Text or Path Data or Task ID
    color: string;
    rotation?: number;
}

// --- Constants ---
const COLORS = ['#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];

// --- Helper Functions ---
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function Whiteboard() {
    // Canvas State
    const [items, setItems] = useState<WhiteboardItem[]>([]);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [tool, setTool] = useState<ToolType>('select');
    const [color, setColor] = useState('#ffffff');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Task Mode State
    const [isTaskMode, setIsTaskMode] = useState(false);
    const [tasks, setTasks] = useState<any[]>([]);

    // Interaction State
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Refs
    const canvasRef = useRef<HTMLDivElement>(null);

    // --- Init ---
    useEffect(() => {
        // Load local storage if available
        const saved = localStorage.getItem('whiteboard_items');
        if (saved) setItems(JSON.parse(saved));
    }, []);

    useEffect(() => {
        localStorage.setItem('whiteboard_items', JSON.stringify(items));
    }, [items]);

    useEffect(() => {
        if (isTaskMode) {
            // Fetch tasks to display in task docker
            supabase.from('tasks').select('*').then(({ data }) => {
                if (data) setTasks(data);
            });
        }
    }, [isTaskMode]);

    // --- Coords ---
    const getMapPoint = (e: React.MouseEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - offset.x) / zoom,
            y: (e.clientY - rect.top - offset.y) / zoom
        };
    };

    // --- Handlers ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (tool === 'hand') {
            setIsDragging(true);
            setDragStart({ x: e.clientX, y: e.clientY });
            return;
        }

        const point = getMapPoint(e);

        if (tool === 'pen') {
            setIsDragging(true);
            const id = generateId();
            const newItem: WhiteboardItem = {
                id, type: 'path', x: point.x, y: point.y,
                content: `M ${point.x} ${point.y}`,
                color: color === '#ffffff' ? '#000000' : color // Default black for drawing if white selected
            };
            setItems(prev => [...prev, newItem]);
            setSelectedId(id);
            // We modify the LAST item in mouseMove
        } else if (tool === 'sticky' || tool === 'text') {
            const id = generateId();
            const newItem: WhiteboardItem = {
                id, type: tool,
                x: point.x - (tool === 'sticky' ? 75 : 0),
                y: point.y - (tool === 'sticky' ? 75 : 0),
                width: tool === 'sticky' ? 150 : 200, height: tool === 'sticky' ? 150 : 50,
                content: tool === 'sticky' ? 'New Note' : 'Text',
                color
            };
            setItems(prev => [...prev, newItem]);
            setTool('select');
            setSelectedId(id);
        } else if (tool === 'rect' || tool === 'circle') {
            const id = generateId();
            const newItem: WhiteboardItem = {
                id, type: tool,
                x: point.x, y: point.y,
                width: 0, height: 0,
                content: '', color
            };
            setItems(prev => [...prev, newItem]);
            setIsDragging(true);
            setSelectedId(id); // Use to resize
            setDragStart({ x: point.x, y: point.y });
        } else if (tool === 'select') {
            // Handle Selection via child onClick, or deselect here
            const target = e.target as HTMLElement;
            if (target.id === 'canvas-bg') {
                setSelectedId(null);
                // If dragging pan area
                setIsDragging(true);
                setDragStart({ x: e.clientX, y: e.clientY });
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;

        if (tool === 'hand' || (tool === 'select' && !selectedId)) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setDragStart({ x: e.clientX, y: e.clientY });
            return;
        }

        const point = getMapPoint(e);

        if (tool === 'pen' && selectedId) {
            setItems(prev => prev.map(item => {
                if (item.id === selectedId && item.type === 'path') {
                    return { ...item, content: item.content + ` L ${point.x} ${point.y}` };
                }
                return item;
            }));
        } else if ((tool === 'rect' || tool === 'circle') && selectedId) {
            setItems(prev => prev.map(item => {
                if (item.id === selectedId) {
                    return {
                        ...item,
                        width: point.x - dragStart.x,
                        height: point.y - dragStart.y
                    };
                }
                return item;
            }));
        } else if (tool === 'select' && selectedId) {
            // Dragging item
            const dx = (e.clientX - dragStart.x) / zoom;
            const dy = (e.clientY - dragStart.y) / zoom;

            setItems(prev => prev.map(item => {
                if (item.id === selectedId) {
                    return { ...item, x: item.x + dx, y: item.y + dy };
                }
                return item;
            }));
            setDragStart({ x: e.clientX, y: e.clientY }); // Reset simple drag anchor for items
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (tool === 'rect' || tool === 'circle' || tool === 'pen') {
            setTool('select');
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            const scaleBy = 1.1;
            const newZoom = e.deltaY < 0 ? zoom * scaleBy : zoom / scaleBy;
            setZoom(Math.max(0.1, Math.min(5, newZoom)));
        } else {
            // Pan
            setOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    // --- Actions ---
    const addTaskToBoard = (task: any) => {
        const id = generateId();
        const centerX = (-offset.x + window.innerWidth / 2) / zoom;
        const centerY = (-offset.y + window.innerHeight / 2) / zoom;

        setItems(prev => [...prev, {
            id, type: 'task',
            x: centerX, y: centerY,
            width: 250, height: 180,
            content: task.id, // Store Task ID
            color: '#ffffff'
        }]);
    };

    const deleteSelected = () => {
        if (selectedId) {
            setItems(prev => prev.filter(i => i.id !== selectedId));
            setSelectedId(null);
        }
    };

    // --- Rendering Items ---
    const renderItem = (item: WhiteboardItem) => {
        const isSelected = selectedId === item.id;
        const borderStyle = isSelected ? 'ring-2 ring-blue-500' : '';
        const baseStyle = {
            position: 'absolute' as const,
            left: item.x, top: item.y,
            width: item.width, height: item.height,
            transform: `rotate(${item.rotation || 0}deg)`,
            pointerEvents: 'all' as const
        };

        if (item.type === 'path') {
            return (
                <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
                    <path d={item.content} stroke={item.color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        }

        if (item.type === 'sticky') {
            return (
                <div
                    style={{ ...baseStyle, backgroundColor: item.color }}
                    className={`shadow-lg p-4 flex items-center justify-center font-hand text-center ${borderStyle}`}
                    onMouseDown={(e) => { e.stopPropagation(); setSelectedId(item.id); setDragStart({ x: e.clientX, y: e.clientY }); setIsDragging(true); }}
                >
                    <textarea
                        className="w-full h-full bg-transparent resize-none outline-none text-center font-bold text-gray-800 placeholder-black/30"
                        value={item.content}
                        onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, content: e.target.value } : i))}
                    />
                </div>
            );
        }

        if (item.type === 'task') {
            // Find task data
            const taskData = tasks.find(t => t.id === item.content) || { title: 'Loading...', status: 'pending', priority: 'Medium' };
            return (
                <div
                    style={{ ...baseStyle, backgroundColor: '#1e1e1e' }}
                    className={`rounded-xl border border-white/10 shadow-xl overflow-hidden flex flex-col ${borderStyle}`}
                    onMouseDown={(e) => { e.stopPropagation(); setSelectedId(item.id); setDragStart({ x: e.clientX, y: e.clientY }); setIsDragging(true); }}
                >
                    <div className={`h-2 w-full ${taskData.priority === 'High' ? 'bg-red-500' : 'bg-blue-500'}`} />
                    <div className="p-4 flex-1">
                        <h4 className="text-white font-bold mb-2">{taskData.title}</h4>
                        <span className="text-xs text-gray-400 capitalize">{taskData.status}</span>
                    </div>
                </div>
            );
        }

        if (item.type === 'rect') {
            return (
                <div
                    style={{ ...baseStyle, border: `3px solid ${item.color}` }}
                    onMouseDown={(e) => { e.stopPropagation(); setSelectedId(item.id); setDragStart({ x: e.clientX, y: e.clientY }); setIsDragging(true); }}
                    className={`${borderStyle}`}
                />
            );
        }
        if (item.type === 'circle') {
            return (
                <div
                    style={{ ...baseStyle, border: `3px solid ${item.color}`, borderRadius: '50%' }}
                    onMouseDown={(e) => { e.stopPropagation(); setSelectedId(item.id); setDragStart({ x: e.clientX, y: e.clientY }); setIsDragging(true); }}
                    className={`${borderStyle}`}
                />
            );
        }

        return null;
    };

    return (
        <div className="h-screen w-full relative overflow-hidden bg-gray-50 flex" onKeyDown={e => { if (e.key === 'Delete') deleteSelected() }} tabIndex={0}>

            {/* Toolbar */}
            <div className="absolute top-[16px] left-6 z-50 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-2 flex flex-row gap-2 items-center">
                {[
                    { id: 'select', icon: MousePointer2 },
                    { id: 'hand', icon: Hand },
                    { id: 'pen', icon: PenTool },
                    { id: 'text', icon: Type },
                    { id: 'sticky', icon: StickyNote },
                    { id: 'rect', icon: Square },
                    { id: 'circle', icon: CircleIcon },
                ].map(toolItem => (
                    <button
                        key={toolItem.id}
                        onClick={() => setTool(toolItem.id as any)}
                        className={`p-3 rounded-xl transition-all ${tool === toolItem.id ? 'bg-black text-neon-blue' : 'hover:bg-gray-100 text-gray-500'}`}
                    >
                        <toolItem.icon size={20} />
                    </button>
                ))}

                <div className="w-px h-8 bg-gray-200 mx-1" />

                {COLORS.map(c => (
                    <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'scale-110 border-gray-900' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                    />
                ))}

                <div className="w-px h-8 bg-gray-200 mx-1" />
                <button onClick={() => setIsTaskMode(!isTaskMode)} className={`p-3 rounded-xl ${isTaskMode ? 'bg-neon-blue text-white' : 'hover:bg-gray-100 text-gray-500'}`}>
                    <Layers size={20} />
                </button>
            </div>

            {/* Task Docker */}
            {isTaskMode && (
                <div className="absolute right-6 top-6 bottom-6 w-80 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-100 p-6 overflow-y-auto z-20">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">Tasks</h3>
                        <button onClick={() => setIsTaskMode(false)}><X size={20} className="text-gray-400 hover:text-red-500" /></button>
                    </div>
                    <div className="space-y-3">
                        {tasks.map(task => (
                            <div
                                key={task.id}
                                onClick={() => addTaskToBoard(task)}
                                className="bg-white border border-gray-200 p-3 rounded-xl shadow-sm hover:shadow-md cursor-pointer hover:border-blue-400 transition-all active:scale-95"
                            >
                                <div className="text-xs font-bold text-gray-400 mb-1 uppercase">{task.status}</div>
                                <div className="font-bold text-gray-800 text-sm">{task.title}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Canvas */}
            <div
                ref={canvasRef}
                className="w-full h-full cursor-crosshair relative"
                id="canvas-bg"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                style={{
                    cursor: tool === 'hand' || (tool === 'select' && !selectedId) ? 'grab' : 'default',
                    touchAction: 'none'
                }}
            >
                {/* Transform Container */}
                <div
                    className="absolute top-0 left-0 w-full h-full origin-top-left will-change-transform"
                    style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
                >
                    {/* Items Layer */}
                    {items.map(item => (
                        <div key={item.id} className="absolute inset-0 pointer-events-none">
                            {renderItem(item)}
                        </div>
                    ))}
                </div>

                {/* Mini Stats / Zoom Info */}
                <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur rounded-full px-4 py-2 shadow-lg border border-gray-100 text-xs font-bold text-gray-500 pointer-events-none">
                    {Math.round(zoom * 100)}%
                </div>

                {/* Delete Button (Contextual) */}
                {selectedId && (
                    <button
                        onClick={deleteSelected}
                        className="absolute bottom-6 right-1/2 translate-x-1/2 bg-red-500 hover:bg-red-600 text-white rounded-full p-4 shadow-xl z-30 transition-transform active:scale-90"
                    >
                        <Trash2 size={24} />
                    </button>
                )}
            </div>
        </div>
    );
}
