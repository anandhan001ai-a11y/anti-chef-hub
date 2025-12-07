import { useState } from 'react';
import {
    Thermometer,
    Flame,
    Snowflake,
    Clock,
    Box,
    ArrowRight,
    Printer,
    Fish,
    Drumstick,
    Beef,
    Utensils
} from 'lucide-react';

type TemperatureUnit = 'C' | 'F';

const NeonCard = ({ title, icon: Icon, children, className = '' }: any) => (
    <div className={`bg-white border-2 border-yellow-300 rounded-[24px] p-6 shadow-lg shadow-yellow-100/50 hover:shadow-xl transition-all duration-300 ${className}`}>
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Icon size={24} />
            </div>
            <h3 className="text-xl font-bold text-blue-600 tracking-tight uppercase shadow-blue-text">{title}</h3>
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const TempRow = ({ label, tempC, unit, icon: RowIcon }: { label: string, tempC: number | string, unit: TemperatureUnit, icon?: any }) => {
    const displayTemp = (val: number | string) => {
        if (typeof val === 'string') return val; // For ranges handled differently or text
        if (unit === 'F') return Math.round((val * 9 / 5) + 32);
        return val;
    };

    const formattedTemp = typeof tempC === 'number' ? displayTemp(tempC) : tempC;

    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-blue-50/30 transition-colors group">
            <div className="flex items-center gap-3">
                {RowIcon && <RowIcon size={16} className="text-gray-400 group-hover:text-blue-500" />}
                <span className="font-semibold text-gray-700">{label}</span>
            </div>
            <span className="text-xl font-black text-green-500 font-mono shadow-green-text">
                {formattedTemp}°{unit}
            </span>
        </div>
    );
};

export default function HaccpReference() {
    const [unit, setUnit] = useState<TemperatureUnit>('C');

    // Convert for ranges or specific display logic
    const convert = (c: number) => unit === 'F' ? Math.round((c * 9 / 5) + 32) : c;

    return (
        <div className="min-h-screen bg-gray-50 p-4 lg:p-10 font-sans pb-32">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 mb-2 flex items-center gap-3">
                            <Thermometer className="text-blue-600" size={36} />
                            HACCP <span className="text-blue-600">Master Log</span>
                        </h1>
                        <p className="text-gray-500 font-medium">Critical Control Points & Temperature Standards Check List</p>
                    </div>

                    <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button
                                onClick={() => setUnit('C')}
                                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${unit === 'C' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                            >
                                °C
                            </button>
                            <button
                                onClick={() => setUnit('F')}
                                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${unit === 'F' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                            >
                                °F
                            </button>
                        </div>

                        <button className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-200">
                            <Printer size={18} /> <span className="hidden sm:inline">Print / Export PDF</span>
                        </button>
                    </div>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                    {/* 1. Cooking Temperatures */}
                    <NeonCard title="Cooking Temps" icon={Flame} className="xl:col-span-1">
                        <TempRow label="Poultry" tempC={75} unit={unit} icon={Drumstick} />
                        <TempRow label="Ground Meat" tempC={70} unit={unit} icon={Beef} />
                        <TempRow label="Whole Cuts (Beef/Lamb)" tempC={63} unit={unit} icon={Utensils} />
                        <TempRow label="Fish & Seafood" tempC={63} unit={unit} icon={Fish} />
                        <TempRow label="Eggs (Service)" tempC={70} unit={unit} />
                        <TempRow label="Reheated Foods" tempC={74} unit={unit} />
                        <TempRow label="Sauces & Soups" tempC={74} unit={unit} />
                    </NeonCard>

                    {/* 2. Holding Temperatures */}
                    <NeonCard title="Holding Temps" icon={Clock} className="xl:col-span-1">
                        <div className="p-4 bg-red-50 rounded-xl border border-red-100 mb-2">
                            <div className="flex items-center gap-2 mb-2 text-red-600 font-bold">
                                <Flame size={18} /> Hot Holding
                            </div>
                            <p className="text-3xl font-black text-green-500 font-mono">≥ {convert(60)}°{unit}</p>
                            <p className="text-xs text-gray-400 mt-1">Keep above this limit</p>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-2 mb-2 text-blue-600 font-bold">
                                <Snowflake size={18} /> Cold Holding
                            </div>
                            <p className="text-3xl font-black text-green-500 font-mono">{convert(0)}–{convert(5)}°{unit}</p>
                            <p className="text-xs text-gray-400 mt-1">Danger zone starts &gt; 5°C</p>
                        </div>
                    </NeonCard>

                    {/* 3. Cooling Requirements */}
                    <NeonCard title="Cooling Rules" icon={Snowflake} className="xl:col-span-1">
                        <div className="relative pl-4 space-y-8 border-l-2 border-dashed border-gray-200 ml-2">
                            <div className="relative">
                                <div className="absolute -left-[25px] top-0 w-4 h-4 rounded-full bg-red-500 ring-4 ring-white" />
                                <p className="text-lg font-bold text-gray-800">{convert(60)}°{unit}</p>
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Cooking End</p>
                            </div>

                            <div className="relative">
                                <div className="absolute -left-[25px] top-0 w-4 h-4 rounded-full bg-yellow-400 ring-4 ring-white" />
                                <p className="text-lg font-bold text-gray-800">{convert(21)}°{unit}</p>
                                <p className="text-xs text-blue-500 font-bold flex items-center gap-1">
                                    <Clock size={12} /> First 2 Hours
                                </p>
                            </div>

                            <div className="relative">
                                <div className="absolute -left-[25px] top-0 w-4 h-4 rounded-full bg-green-500 ring-4 ring-white" />
                                <p className="text-lg font-bold text-gray-800">{convert(5)}°{unit}</p>
                                <p className="text-xs text-blue-500 font-bold flex items-center gap-1">
                                    <Clock size={12} /> Next 4 Hours
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 font-bold text-center">
                            Total Time: Max 6 Hours
                        </div>
                    </NeonCard>

                    {/* 4. Storage Temperatures */}
                    <NeonCard title="Storage" icon={Box} className="xl:col-span-1">
                        <TempRow label="Chiller / Fridge" tempC={`0–5`} unit={unit} />
                        <TempRow label="Freezer" tempC={`≤ -18`} unit={unit} />
                        <TempRow label="Dry Store" tempC={`10–21`} unit={unit} />

                        <div className="mt-6 space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Fridge Hygiene</h4>

                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-green-600 shadow-sm text-xs font-bold">TOP</div>
                                <span className="text-sm font-bold text-gray-700">Ready-to-eat Foods</span>
                            </div>

                            <div className="flex items-center justify-center py-1">
                                <ArrowRight className="rotate-90 text-gray-300" size={20} />
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-600 shadow-sm text-xs font-bold">BOT</div>
                                <span className="text-sm font-bold text-gray-700">Raw Meats / Fish</span>
                            </div>
                        </div>
                    </NeonCard>

                </div>

            </div>
        </div>
    );
}
