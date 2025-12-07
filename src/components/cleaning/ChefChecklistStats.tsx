import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { fetchTasks } from '../../lib/taskService';
import { Loader2 } from 'lucide-react';

export default function ChefChecklistStats() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ pending: 0, completed: 0 });

    useEffect(() => {
        loadStats();
        // Refresh task stats periodically to keep dashboard in sync
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadStats = async () => {
        // Only fetch cleaning tasks
        const { data } = await fetchTasks('cleaning');
        if (data) {
            const pending = data.filter(t => t.status !== 'completed').length;
            const completed = data.filter(t => t.status === 'completed').length;
            setStats({ pending, completed });
            setLoading(false);
        } else {
            setLoading(false);
        }
    };

    const data = [
        { name: 'Pending', value: stats.pending },
        { name: 'Done', value: stats.completed },
    ];

    // Theme colors: Pending (Light Gray), Done (Brand Orange)
    const COLORS = ['#e2e8f0', '#ff7a00'];

    if (loading) {
        return (
            <div className="bg-white rounded-24 shadow-soft p-6 h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#ff7a00] animate-spin" />
            </div>
        );
    }

    // If no tasks, show empty state
    if (stats.pending === 0 && stats.completed === 0) {
        return (
            <div className="bg-white rounded-24 shadow-soft p-6 h-auto">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Chef Check List</h3>
                <div className="py-8 text-center text-gray-500 text-sm">
                    No checklist tasks found.
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-24 shadow-soft p-6">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900">Chef Check List</h3>
                <span className="text-sm font-medium text-[#ff7a00] bg-orange-50 px-3 py-1 rounded-full">
                    {Math.round((stats.completed / (stats.pending + stats.completed)) * 100) || 0}% Done
                </span>
            </div>

            <div className="h-[250px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#374151', fontWeight: 500 }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Content */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
                    <span className="text-3xl font-bold text-gray-900">{stats.completed}</span>
                    <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Done</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-bold text-gray-700">{stats.pending}</p>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Pending</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-xl">
                    <p className="text-2xl font-bold text-[#ff7a00]">{stats.completed}</p>
                    <p className="text-xs text-[#ff7a00] font-semibold uppercase">Completed</p>
                </div>
            </div>
        </div>
    );
}
