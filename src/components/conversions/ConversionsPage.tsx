import { useState, useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS as DndCSS } from '@dnd-kit/utilities';
import {
    Scale,
    Calculator,
    Beaker,
    Utensils,
    FileText,
    Filter,
    GripVertical,
    ArrowRight
} from 'lucide-react';

// --- Types ---
type ToolId = 'spoons' | 'dry-cups' | 'liquid-cups' | 'scale' | 'charts' | 'calculator';

type ConversionTool = {
    id: ToolId;
    title: string;
    description: string;
    type: 'measure' | 'device' | 'chart' | 'calc';
    color: string;
    bgColor: string;
    icon: any;
};

// --- Constant Data ---
const initialTools: ConversionTool[] = [
    {
        id: 'calculator',
        title: 'Recipe Scaling Calculator',
        description: 'Calculate scaling factor for recipe adjustments.',
        type: 'calc',
        color: 'text-violet-600',
        bgColor: 'bg-violet-50',
        icon: Calculator,
    },
    {
        id: 'scale',
        title: 'Weight Converter',
        description: 'Convert between Grams (g) and Ounces (oz).',
        type: 'device',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        icon: Scale,
    },
    {
        id: 'liquid-cups',
        title: 'Volume Converter',
        description: 'Convert Milliliters, Liters, and Fluid Ounces.',
        type: 'measure',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        icon: Beaker,
    },
    {
        id: 'spoons',
        title: 'Spoon Converter',
        description: 'Tbsp, Tsp, and Milliliters.',
        type: 'measure',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: Utensils,
    },
    {
        id: 'charts',
        title: 'Temperature Converter',
        description: 'Celsius to Fahrenheit conversion & reference.',
        type: 'chart',
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        icon: FileText,
    },
];

// --- Functional Widgets ---

const ScalerWidget = () => {
    const [original, setOriginal] = useState<string>('');
    const [target, setTarget] = useState<string>('');

    const factor = useMemo(() => {
        const o = parseFloat(original);
        const t = parseFloat(target);
        if (!o || !t) return null;
        return (t / o).toFixed(2);
    }, [original, target]);

    return (
        <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Original Yield</label>
                    <input
                        type="number"
                        value={original}
                        onChange={e => setOriginal(e.target.value)}
                        className="w-full mt-1 p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none text-gray-900 font-medium"
                        placeholder="e.g. 4"
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Desired Yield</label>
                    <input
                        type="number"
                        value={target}
                        onChange={e => setTarget(e.target.value)}
                        className="w-full mt-1 p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none text-gray-900 font-medium"
                        placeholder="e.g. 10"
                    />
                </div>
            </div>

            {factor && (
                <div className="bg-violet-100 p-3 rounded-lg flex items-center justify-between">
                    <span className="text-violet-800 font-medium text-sm">Scaling Factor:</span>
                    <span className="text-2xl font-bold text-violet-700">{factor}x</span>
                </div>
            )}
        </div>
    );
};

const WeightWidget = () => {
    const [grams, setGrams] = useState<string>('');
    const [oz, setOz] = useState<string>('');

    const handleGrams = (val: string) => {
        setGrams(val);
        const g = parseFloat(val);
        if (!isNaN(g)) {
            setOz((g / 28.3495).toFixed(2));
        } else {
            setOz('');
        }
    };

    const handleOz = (val: string) => {
        setOz(val);
        const o = parseFloat(val);
        if (!isNaN(o)) {
            setGrams((o * 28.3495).toFixed(1));
        } else {
            setGrams('');
        }
    };

    return (
        <div className="flex items-center gap-2 mt-2">
            <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Grams</label>
                <input
                    type="number"
                    value={grams}
                    onChange={(e) => handleGrams(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:border-orange-400 outline-none"
                    placeholder="g"
                />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 mt-5" />
            <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Ounces</label>
                <input
                    type="number"
                    value={oz}
                    onChange={(e) => handleOz(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:border-orange-400 outline-none"
                    placeholder="oz"
                />
            </div>
        </div>
    );
};

const VolumeWidget = () => {
    const [ml, setMl] = useState<string>('');
    const [floz, setFloz] = useState<string>('');

    const handleMl = (val: string) => {
        setMl(val);
        const m = parseFloat(val);
        if (!isNaN(m)) setFloz((m / 29.5735).toFixed(2));
        else setFloz('');
    }

    const handleFloz = (val: string) => {
        setFloz(val);
        const f = parseFloat(val);
        if (!isNaN(f)) setMl((f * 29.5735).toFixed(1));
        else setMl('');
    }

    return (
        <div className="flex items-center gap-2 mt-2">
            <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Milliliters</label>
                <input
                    type="number"
                    value={ml}
                    onChange={(e) => handleMl(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:border-blue-400 outline-none"
                    placeholder="ml"
                />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 mt-5" />
            <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Fl Oz</label>
                <input
                    type="number"
                    value={floz}
                    onChange={(e) => handleFloz(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:border-blue-400 outline-none"
                    placeholder="fl oz"
                />
            </div>
        </div>
    );
}

const TemperatureWidget = () => {
    const [c, setC] = useState<string>('');
    const [f, setF] = useState<string>('');

    const handleC = (val: string) => {
        setC(val);
        const valC = parseFloat(val);
        if (!isNaN(valC)) setF(((valC * 9 / 5) + 32).toFixed(1));
        else setF('');
    }

    const handleF = (val: string) => {
        setF(val);
        const valF = parseFloat(val);
        if (!isNaN(valF)) setC(((valF - 32) * 5 / 9).toFixed(1));
        else setC('');
    }

    return (
        <div className="space-y-3 mt-2">
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Celsius</label>
                    <input
                        type="number"
                        value={c}
                        onChange={(e) => handleC(e.target.value)}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:border-pink-400 outline-none"
                        placeholder="°C"
                    />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 mt-5" />
                <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Fahrenheit</label>
                    <input
                        type="number"
                        value={f}
                        onChange={(e) => handleF(e.target.value)}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:border-pink-400 outline-none"
                        placeholder="°F"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                <div className="text-center p-1 bg-gray-50 rounded text-[10px] text-gray-600 font-medium">180°C = 350°F</div>
                <div className="text-center p-1 bg-gray-50 rounded text-[10px] text-gray-600 font-medium">200°C = 400°F</div>
                <div className="text-center p-1 bg-gray-50 rounded text-[10px] text-gray-600 font-medium">220°C = 425°F</div>
            </div>
        </div>
    );
};

const SpoonsWidget = () => {
    const [tbsp, setTbsp] = useState<string>('');
    const [tsp, setTsp] = useState<string>('');
    const [ml, setMl] = useState<string>('');

    const handleTbsp = (val: string) => {
        setTbsp(val);
        const v = parseFloat(val);
        if (!isNaN(v)) {
            setTsp((v * 3).toFixed(1).replace(/\.0$/, ''));
            setMl((v * 15).toFixed(1).replace(/\.0$/, ''));
        } else {
            setTsp('');
            setMl('');
        }
    };

    const handleTsp = (val: string) => {
        setTsp(val);
        const v = parseFloat(val);
        if (!isNaN(v)) {
            setTbsp((v / 3).toFixed(2).replace(/\.00$/, '').replace(/\.0$/, ''));
            setMl((v * 5).toFixed(1).replace(/\.0$/, ''));
        } else {
            setTbsp('');
            setMl('');
        }
    };

    const handleMl = (val: string) => {
        setMl(val);
        const v = parseFloat(val);
        if (!isNaN(v)) {
            setTsp((v / 5).toFixed(2).replace(/\.00$/, ''));
            setTbsp((v / 15).toFixed(2).replace(/\.00$/, ''));
        } else {
            setTsp('');
            setTbsp('');
        }
    };

    return (
        <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Tbsp</label>
                    <input
                        type="number"
                        value={tbsp}
                        onChange={(e) => handleTbsp(e.target.value)}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:border-green-400 outline-none"
                        placeholder="Tbsp"
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Tsp</label>
                    <input
                        type="number"
                        value={tsp}
                        onChange={(e) => handleTsp(e.target.value)}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:border-green-400 outline-none"
                        placeholder="Tsp"
                    />
                </div>
            </div>
            <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Milliliters (approx)</label>
                <input
                    type="number"
                    value={ml}
                    onChange={(e) => handleMl(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:border-green-400 outline-none"
                    placeholder="ml"
                />
            </div>
        </div>
    );
};

// --- Sortable Card ---
function ToolCard({ tool }: { tool: ConversionTool }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: tool.id });

    const style = {
        transform: DndCSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    const Icon = tool.icon;

    const renderContent = () => {
        switch (tool.id) {
            case 'calculator': return <ScalerWidget />;
            case 'scale': return <WeightWidget />;
            case 'liquid-cups': return <VolumeWidget />;
            case 'charts': return <TemperatureWidget />;
            // SpoonsWidget added here
            case 'spoons': return <SpoonsWidget />;
            default: return null;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
        bg-white
        border border-gray-100
        rounded-2xl p-5
        shadow-sm hover:shadow-md
        transition-all duration-300
        relative overflow-hidden
        ${isDragging ? 'shadow-xl scale-105 z-50 ring-2 ring-blue-500' : ''}
      `}
        >
            {/* Header with Drag Handle */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${tool.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${tool.color}`} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 leading-tight">{tool.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{tool.description}</p>
                    </div>
                </div>

                <button
                    {...attributes}
                    {...listeners}
                    className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
                >
                    <GripVertical className="w-5 h-5" />
                </button>
            </div>

            {/* Interactive Body */}
            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100 min-h-[100px]">
                {renderContent() || (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                        Interactive tool coming soon...
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Main Page ---
export default function ConversionsPage() {
    const [tools, setTools] = useState(initialTools);
    const [filter, setFilter] = useState<'all' | 'measure' | 'device' | 'chart' | 'calc'>('all');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setTools((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const filteredTools = filter === 'all' ? tools : tools.filter(t => t.type === filter);

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10 pb-24 font-sans text-gray-900">

            {/* Light Theme Header */}
            <div className="max-w-7xl mx-auto mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Kitchen Tools
                        </h1>
                        <p className="text-gray-500 font-medium">
                            Professional conversion calculators & reference.
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            const filters: Array<'all' | 'measure' | 'device' | 'chart' | 'calc'> = ['all', 'measure', 'device', 'chart', 'calc'];
                            const nextIndex = (filters.indexOf(filter) + 1) % filters.length;
                            setFilter(filters[nextIndex]);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 text-gray-600 transition-all font-medium shadow-sm"
                    >
                        <Filter className="w-4 h-4" />
                        <span className="capitalize">
                            {filter === 'all' ? 'All Tools' : filter}
                        </span>
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="max-w-7xl mx-auto">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={filteredTools.map(t => t.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredTools.map((tool) => (
                                <ToolCard key={tool.id} tool={tool} />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}
