import { useEffect, useState } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip,
    LineChart, Line
} from 'recharts';
import { supabase } from '../../lib/supabase';
import {
    CheckCircle2,
    TrendingUp,
    ClipboardList,
    UtensilsCrossed,
    UserCircle
} from 'lucide-react';

// --- Colors (Pastel / Flat Vector Style) ---
const COLORS = {
    completed: '#4FD1C5', // Teal
    pending: '#F6AD55',   // Orange
    overdue: '#FC8181',   // Soft Red
    text: '#718096',      // Gray 600
    grid: '#E2E8F0'       // Gray 200
};

// --- Mock Data for History (Since we don't track history yet) ---
const WEEKLY_DATA = [
    { name: 'Mon', completed: 12 },
    { name: 'Tue', completed: 19 },
    { name: 'Wed', completed: 15 },
    { name: 'Thu', completed: 22 },
    { name: 'Fri', completed: 30 },
    { name: 'Sat', completed: 45 },
    { name: 'Sun', completed: 38 },
];

const TREND_DATA = [
    { name: 'Wk1', value: 65 },
    { name: 'Wk2', value: 72 },
    { name: 'Wk3', value: 78 },
    { name: 'Wk4', value: 85 },
];

export default function TaskAnalyticsDashboard() {
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        foh: 0,
        checklist: 0,
        prep: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data: tasks } = await supabase.from('tasks').select('*');

            if (tasks) {
                const total = tasks.length;
                const completed = tasks.filter(t => t.status === 'completed').length;

                // Overdue Logic
                const now = new Date();
                const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

                const pendingTasks = tasks.filter(t => t.status !== 'completed');
                const overdueCount = pendingTasks.filter(t => new Date(t.created_at) < yesterday).length;
                const purePending = pendingTasks.length - overdueCount;

                // Category Breakdowns
                const foh = tasks.filter(t => t.board_type === 'todo').length;
                const checklist = tasks.filter(t => t.board_type === 'cleaning').length;
                const prep = tasks.filter(t => t.board_type === 'taskboard').length;

                setStats({
                    total,
                    completed,
                    pending: purePending,
                    overdue: overdueCount,
                    foh: total > 0 ? Math.round((foh / total) * 100) : 0,
                    checklist: total > 0 ? Math.round((checklist / total) * 100) : 0,
                    prep: total > 0 ? Math.round((prep / total) * 100) : 0
                });
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    // Pie Data
    const pieData = [
        { name: 'Completed', value: stats.completed },
        { name: 'Pending', value: stats.pending },
        { name: 'Overdue', value: stats.overdue }
    ].filter(d => d.value > 0);
    // If empty, push placeholders so chart isn't empty
    if (pieData.length === 0) pieData.push({ name: 'No Data', value: 1 });

    // Percentages
    const getPercent = (val: number) => stats.total > 0 ? Math.round((val / stats.total) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#FDFBF7] p-6 lg:p-10 pb-32 font-sans">
            <div className="max-w-7xl mx-auto">

                <div className="flex items-center gap-3 mb-10">
                    <div className="p-3 bg-teal-100 text-teal-600 rounded-xl">
                        <TrendingUp size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Analytics Dashboard</h1>
                        <p className="text-gray-500 font-medium">Real-time Performance Metrics</p>
                    </div>
                </div>

                {/* TOP ROW: CHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                    {/* 1. Main Pie Chart (Completion Status) */}
                    <div className="bg-white rounded-[30px] p-8 shadow-sm flex flex-col items-center justify-center relative border border-gray-100">
                        <h3 className="absolute top-8 left-8 text-xl font-bold text-gray-700">Task Status</h3>

                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => {
                                            let col = COLORS.grid;
                                            if (entry.name === 'Completed') col = COLORS.completed;
                                            if (entry.name === 'Pending') col = COLORS.pending;
                                            if (entry.name === 'Overdue') col = COLORS.overdue;
                                            return <Cell key={`cell-${index}`} fill={col} />;
                                        })}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend Row */}
                        <div className="flex gap-8 mt-4">
                            <div className="text-center">
                                <span className="text-3xl font-bold text-teal-500 block">{getPercent(stats.completed)}%</span>
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Done</span>
                            </div>
                            <div className="text-center">
                                <span className="text-3xl font-bold text-orange-400 block">{getPercent(stats.pending)}%</span>
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Pending</span>
                            </div>
                            <div className="text-center">
                                <span className="text-3xl font-bold text-red-400 block">{getPercent(stats.overdue)}%</span>
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Overdue</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Overdue Donut & Weekly Activity */}
                    <div className="space-y-8">

                        {/* Bar Chart */}
                        <div className="bg-white rounded-[30px] p-8 shadow-sm border border-gray-100 h-[300px]">
                            <h3 className="text-xl font-bold text-gray-700 mb-4">Weekly Completion</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={WEEKLY_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: '#EDF2F7' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                    <Bar dataKey="completed" fill={COLORS.pending} radius={[6, 6, 6, 6]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Line Chart Trend */}
                        <div className="bg-white rounded-[30px] p-8 shadow-sm border border-gray-100 h-[250px]">
                            <h3 className="text-xl font-bold text-gray-700 mb-4">Efficiency Trend</h3>
                            <ResponsiveContainer width="100%" height="80%">
                                <LineChart data={TREND_DATA}>
                                    <Line type="monotone" dataKey="value" stroke={COLORS.completed} strokeWidth={4} dot={{ r: 6, fill: COLORS.completed, strokeWidth: 2, stroke: 'white' }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                    </div>
                </div>

                {/* BOTTOM ROW: ICON STATS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-1">
                            <UserCircle size={32} />
                        </div>
                        <span className="text-3xl font-bold text-gray-800">{stats.foh}%</span>
                        <span className="text-xs text-gray-400 font-bold uppercase">FOH Tasks</span>
                    </div>

                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center mb-1">
                            <CheckCircle2 size={32} />
                        </div>
                        <span className="text-3xl font-bold text-gray-800">{stats.checklist}%</span>
                        <span className="text-xs text-gray-400 font-bold uppercase">Checklists</span>
                    </div>

                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 bg-orange-50 text-orange-400 rounded-full flex items-center justify-center mb-1">
                            <UtensilsCrossed size={32} />
                        </div>
                        <span className="text-3xl font-bold text-gray-800">{stats.prep}%</span>
                        <span className="text-xs text-gray-400 font-bold uppercase">Prep Lists</span>
                    </div>

                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mb-1">
                            <ClipboardList size={32} />
                        </div>
                        <span className="text-3xl font-bold text-gray-800">{Math.max(0, 100 - (stats.foh + stats.checklist + stats.prep))}%</span>
                        <span className="text-xs text-gray-400 font-bold uppercase">Admin</span>
                    </div>

                </div>

            </div>
        </div>
    );
}
