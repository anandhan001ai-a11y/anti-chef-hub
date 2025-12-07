import { useState, useMemo } from 'react';
import {
    Star,
    HelpCircle,
    Tractor,
    Bone,
    TrendingUp
} from 'lucide-react';

// --- Types ---
type MenuItem = {
    id: string;
    name: string;
    foodCost: number;
    sellingPrice: number;
    soldCount: number;
};

// --- Helper Components ---

const MatrixCard = ({
    title,
    icon: Icon,
    items,
    colorClass,
    description
}: {
    title: string;
    icon: any;
    items: any[];
    colorClass: string;
    description: string;
}) => {
    return (
        <div className={`bg-white border-2 rounded-2xl p-6 h-full shadow-lg transition-all hover:scale-[1.02] ${colorClass}`}>
            <div className="flex justify-between items-start mb-4 border-b pb-4 border-gray-100">
                <div>
                    <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                        <Icon className="w-6 h-6" /> {title}
                    </h3>
                    <p className="text-xs font-bold opacity-60 mt-1">{description}</p>
                </div>
                <div className="text-3xl font-black opacity-10">{items.length}</div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.length === 0 && <p className="text-sm text-gray-400 italic">No items in this category.</p>}
                {items.map(item => (
                    <div key={item.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
                        <div className="flex justify-between font-bold text-gray-800 mb-1">
                            <span>{item.name}</span>
                            <span className="text-sm opacity-60">{item.soldCount} Sold</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>Margin: ${item.margin.toFixed(2)}</span>
                            <span className={`font-mono px-1.5 py-0.5 rounded ${item.popIndex >= 1 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                                PI: {item.popIndex.toFixed(2)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function MenuEngineering() {
    // Use sample data or empty state
    const [menuItems, setMenuItems] = useState<MenuItem[]>([
        { id: '1', name: 'Signature Steak', foodCost: 15, sellingPrice: 45, soldCount: 120 },
        { id: '2', name: 'Truffle Pasta', foodCost: 8, sellingPrice: 28, soldCount: 95 },
        { id: '3', name: 'Caesar Salad', foodCost: 4, sellingPrice: 14, soldCount: 40 },
        { id: '4', name: 'Lobster Bisque', foodCost: 12, sellingPrice: 22, soldCount: 30 },
        { id: '5', name: 'Cheeseburger', foodCost: 5, sellingPrice: 16, soldCount: 200 },
        { id: '6', name: 'Veggie Wrap', foodCost: 3, sellingPrice: 12, soldCount: 25 },
        { id: '7', name: 'Filet Mignon', foodCost: 20, sellingPrice: 55, soldCount: 85 },
        { id: '8', name: 'Onion Rings', foodCost: 1, sellingPrice: 8, soldCount: 150 },
    ]);

    // --- Calculations ---
    const analysis = useMemo(() => {
        if (menuItems.length === 0) return { stars: [], plowhorses: [], puzzles: [], dogs: [] };

        // 1. Calculate Averages
        const totalSold = menuItems.reduce((acc, item) => acc + item.soldCount, 0);
        const avgCoversPerItem = totalSold / menuItems.length;

        const totalMargin = menuItems.reduce((acc, item) => acc + (item.sellingPrice - item.foodCost), 0);
        const avgMargin = totalMargin / menuItems.length;

        // 2. Classify Items
        const classifiedItems = menuItems.map(item => {
            const margin = item.sellingPrice - item.foodCost;
            const popIndex = item.soldCount / avgCoversPerItem;

            // Logic:
            // STAR: High Pop (>=1), High Margin (>=Avg)
            // PLOWHORSE: High Pop (>=1), Low Margin (<Avg)
            // PUZZLE: Low Pop (<1), High Margin (>=Avg)
            // DOG: Low Pop (<1), Low Margin (<Avg)

            let category = 'DOG';
            if (popIndex >= 1 && margin >= avgMargin) category = 'STAR';
            else if (popIndex >= 1 && margin < avgMargin) category = 'PLOWHORSE';
            else if (popIndex < 1 && margin >= avgMargin) category = 'PUZZLE';

            return { ...item, margin, popIndex, category };
        });

        return {
            stars: classifiedItems.filter(i => i.category === 'STAR'),
            plowhorses: classifiedItems.filter(i => i.category === 'PLOWHORSE'),
            puzzles: classifiedItems.filter(i => i.category === 'PUZZLE'),
            dogs: classifiedItems.filter(i => i.category === 'DOG'),
            avgMargin,
            avgCoversPerItem
        };
    }, [menuItems]);

    return (
        <div className="min-h-screen bg-white p-6 lg:p-10 pb-32">
            <div className="max-w-7xl mx-auto">

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Menu Engineering</h1>
                        <p className="text-gray-500 font-medium">Profitability & Popularity Analysis Matrix</p>
                    </div>

                    <div className="flex gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="px-4 border-r border-gray-200">
                            <p className="text-xs text-gray-400 uppercase font-bold">Avg Margin</p>
                            <p className="text-xl font-black text-gray-900">${(analysis.avgMargin || 0).toFixed(2)}</p>
                        </div>
                        <div className="px-4">
                            <p className="text-xs text-gray-400 uppercase font-bold">Avg Popularity</p>
                            <p className="text-xl font-black text-gray-900">{Math.round(analysis.avgCoversPerItem || 0)} <span className="text-sm font-normal text-gray-400">covers</span></p>
                        </div>
                    </div>
                </div>

                {/* INPUT FORM (Data Sandbox) - MOVED TO TOP */}
                <div className="mb-12 p-8 bg-gray-900 rounded-3xl text-white shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-600 rounded-lg"><TrendingUp /></div>
                        <h3 className="text-xl font-bold">Menu Data Sandbox</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-4 text-sm font-bold text-gray-400 uppercase tracking-widest px-2">
                        <div className="sm:col-span-2">Item Name</div>
                        <div>Cost ($)</div>
                        <div>Price ($)</div>
                        <div>Sold Qty</div>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {menuItems.map((item, idx) => (
                            <div key={item.id} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center bg-gray-800 p-3 rounded-xl border border-gray-700">
                                <input
                                    value={item.name}
                                    onChange={(e) => {
                                        const newItems = [...menuItems];
                                        newItems[idx].name = e.target.value;
                                        setMenuItems(newItems);
                                    }}
                                    className="sm:col-span-2 bg-transparent text-white font-bold outline-none"
                                />
                                <input
                                    type="number"
                                    value={item.foodCost}
                                    onChange={(e) => {
                                        const newItems = [...menuItems];
                                        newItems[idx].foodCost = parseFloat(e.target.value) || 0;
                                        setMenuItems(newItems);
                                    }}
                                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1 text-center"
                                />
                                <input
                                    type="number"
                                    value={item.sellingPrice}
                                    onChange={(e) => {
                                        const newItems = [...menuItems];
                                        newItems[idx].sellingPrice = parseFloat(e.target.value) || 0;
                                        setMenuItems(newItems);
                                    }}
                                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1 text-center"
                                />
                                <input
                                    type="number"
                                    value={item.soldCount}
                                    onChange={(e) => {
                                        const newItems = [...menuItems];
                                        newItems[idx].soldCount = parseFloat(e.target.value) || 0;
                                        setMenuItems(newItems);
                                    }}
                                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1 text-center"
                                />
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setMenuItems([...menuItems, { id: Math.random().toString(), name: 'New Item', foodCost: 5, sellingPrice: 15, soldCount: 50 }])}
                        className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-colors"
                    >
                        + Add New Menu Item
                    </button>
                </div>

                {/* THE MATRIX GRID - MOVED TO BOTTOM */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[700px]">

                    {/* TOP LEFT: PLOWHORSE (High Pop, Low Margin) - User Request */}
                    <MatrixCard
                        title="PLOWHORSE"
                        icon={Tractor}
                        description="High Popularity, Low Margin. Increase prices or reduce portion cost."
                        items={analysis.plowhorses}
                        colorClass="border-yellow-400 text-yellow-600 shadow-yellow-100"
                    />

                    {/* TOP RIGHT: STAR (High Pop, High Margin) - User Request */}
                    <MatrixCard
                        title="STAR"
                        icon={Star}
                        description="High Popularity, High Margin. Keep consistent and promote!"
                        items={analysis.stars}
                        colorClass="border-emerald-500 text-emerald-600 shadow-emerald-100"
                    />

                    {/* BOTTOM LEFT: DOG (Low Pop, Low Margin) - User Request */}
                    <MatrixCard
                        title="DOG"
                        icon={Bone}
                        description="Low Popularity, Low Margin. Consider removing from menu."
                        items={analysis.dogs}
                        colorClass="border-red-500 text-red-600 shadow-red-100"
                    />

                    {/* BOTTOM RIGHT: PUZZLE (Low Pop, High Margin) - User Request */}
                    <MatrixCard
                        title="PUZZLE"
                        icon={HelpCircle}
                        description="Low Popularity, High Margin. Need better marketing or placement."
                        items={analysis.puzzles}
                        colorClass="border-cyan-500 text-cyan-600 shadow-cyan-100"
                    />

                </div>

            </div>
        </div>
    );
}
