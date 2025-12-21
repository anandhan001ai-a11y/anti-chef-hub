import React, { useState } from 'react';
import { Users, Calendar, UserCheck, Clock, Bot } from 'lucide-react';
import StaffManagement from './analytics/StaffManagement';
import KitchenCoordinatorAI from './analytics/KitchenCoordinatorAI';
import DutySchedule from './DutySchedule';
import OffDuty from './OffDuty';

type TabType = 'duty-schedule' | 'off-duty' | 'staff-list' | 'christine';

const AnalyticsDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('duty-schedule');

    const tabs = [
        { id: 'duty-schedule', label: 'Duty Schedule', icon: Calendar, color: 'from-blue-500 to-blue-600' },
        { id: 'off-duty', label: 'Off Duty', icon: UserCheck, color: 'from-green-500 to-green-600' },
        { id: 'staff-list', label: 'Staff List', icon: Users, color: 'from-purple-500 to-purple-600' },
        { id: 'christine', label: 'Christine AI', icon: Bot, color: 'from-orange-500 to-orange-600' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Title */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#ff7a00] to-[#ff4e00] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Kitchen Crew</h1>
                                <p className="text-sm text-slate-500">Manage schedules, duties & staff</p>
                            </div>
                        </div>

                        {/* Current Time */}
                        <div className="hidden md:flex items-center gap-2 text-slate-600">
                            <Clock className="w-5 h-5" />
                            <span className="font-medium">
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <nav className="flex items-center gap-2 mt-6 -mb-px overflow-x-auto pb-px">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-medium text-sm transition-all whitespace-nowrap ${isActive
                                        ? 'bg-gradient-to-r ' + tab.color + ' text-white shadow-lg'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-6">
                {/* Duty Schedule Tab */}
                {activeTab === 'duty-schedule' && (
                    <div className="animate-fadeIn">
                        <DutySchedule />
                    </div>
                )}

                {/* Off Duty Tab */}
                {activeTab === 'off-duty' && (
                    <div className="animate-fadeIn">
                        <OffDuty />
                    </div>
                )}

                {/* Staff List Tab */}
                {activeTab === 'staff-list' && (
                    <div className="animate-fadeIn">
                        <StaffManagement />
                    </div>
                )}

                {/* Christine AI Tab */}
                {activeTab === 'christine' && (
                    <div className="animate-fadeIn">
                        <KitchenCoordinatorAI />
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 py-4 mt-8">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-sm text-slate-500">
                        ChefAnand Hub • Staff Management System • Powered by Antigravity & OpenAI
                    </p>
                </div>
            </footer>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default AnalyticsDashboard;
