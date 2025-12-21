import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import DutySchedule from '../DutySchedule';
import OffDuty from '../OffDuty';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { aiService } from '../../lib/aiService';
import HierarchyTree from './HierarchyTree';

type StaffTab = 'overview' | 'roster' | 'off-duty' | 'hierarchy';

interface StaffMember {
    name: string;
    role: string;
    department: string;
}



// Sortable Staff Card for Grid View
const SortableStaffCard = ({ staff }: { staff: StaffMember }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: staff.name,
        data: staff
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 999 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`bg-white border p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-4 group cursor-grab active:cursor-grabbing touch-none select-none ${isDragging ? 'border-[#ff7a00] shadow-xl opacity-90 scale-105' : 'border-slate-200'}`}
        >
            <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold text-lg group-hover:from-[#ff7a00] group-hover:to-[#ff8f2d] group-hover:text-white transition-all">
                {staff.name.charAt(0)}
            </div>
            <div>
                <h4 className="font-bold text-slate-900">{staff.name}</h4>
                <p className="text-sm text-slate-600">{staff.role}</p>
                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full mt-1 inline-block">{staff.department || 'General'}</span>
            </div>
            <div className="ml-auto text-slate-400 hover:text-[#ff7a00]">
                <i className="fas fa-grip-vertical"></i>
            </div>
        </div>
    );
};

// Draggable Staff Card
const DraggableStaffCard = ({ staff }: { staff: StaffMember }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: staff.name,
        data: staff
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 999 : 'auto',
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`bg-white p-3 rounded-lg shadow-sm border ${isDragging ? 'border-[#ff7a00] shadow-xl rotate-2 opacity-90' : 'border-slate-200 hover:shadow-md'} transition-all cursor-grab active:cursor-grabbing mb-2 touch-none select-none`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${isDragging ? 'bg-[#ff7a00]' : 'bg-slate-400'}`}>
                    {staff.name.charAt(0)}
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 text-sm">{staff.name}</h4>
                    <p className="text-xs text-slate-500">{staff.role}</p>
                </div>
            </div>
        </div>
    );
};

// Droppable Column
const DroppableColumn = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div ref={setNodeRef} className={`bg-slate-50 rounded-xl p-4 min-w-[280px] w-80 flex-shrink-0 border-2 transition-colors ${isOver ? 'border-[#ff7a00] bg-orange-50' : 'border-transparent'}`}>
            <h4 className="font-bold text-slate-700 mb-4 flex items-center justify-between">
                {title}
                <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full">{React.Children.count(children)}</span>
            </h4>
            <div className="min-h-[200px]">
                {children}
            </div>
        </div>
    );
};

const StaffManagement: React.FC = () => {
    // Drag to Scroll Logic
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const [isDraggingBoard, setIsDraggingBoard] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current || (e.target as HTMLElement).closest('[data-no-drag]')) return;
        setIsDraggingBoard(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDraggingBoard(false);
    };

    const handleMouseUp = () => {
        setIsDraggingBoard(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingBoard || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };
    const [activeTab, setActiveTab] = useState<StaffTab>('overview');
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [showAddModal, setShowAddModal] = useState(false);
    const [newStaff, setNewStaff] = useState<StaffMember>({ name: '', role: '', department: '' });

    const [viewMode, setViewMode] = useState<'grid' | 'board'>('grid');
    const [activeDraggable, setActiveDraggable] = useState<StaffMember | null>(null);
    const [showTools, setShowTools] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [rawData, setRawData] = useState<any[][] | null>(null);
    const [showRawData, setShowRawData] = useState(false);

    const handleClearOverrides = () => {
        if (confirm('Clear all department changes? This overrides your local drag-and-drop actions.')) {
            localStorage.removeItem('chef_hub_staff_overrides');
            loadStaffData();
            setShowTools(false);
        }
    };

    const handleClearManual = () => {
        if (confirm('Remove all manually added staff? This acts as a "Reset".')) {
            localStorage.removeItem('chef_hub_manual_staff');
            loadStaffData();
            setShowTools(false);
        }
    };

    const handleAutoSort = async () => {
        if (!staffList.length) return;
        setIsAnalyzing(true);
        try {
            const mapping = await aiService.analyzeStaffRoles(staffList);
            console.log("Sid Analysis:", mapping);

            if (Object.keys(mapping).length > 0) {
                // Update State
                setStaffList(prev => prev.map(s => {
                    const suggestedDept = mapping[s.role];
                    // Only update if it's currently generic/unassigned or we want to force smart sort
                    // For now, let's prioritize AI over 'null', but maybe respect manual overrides? 
                    // User asked to "update accordingly", implying AI knows best.
                    if (suggestedDept) {
                        return { ...s, department: suggestedDept };
                    }
                    return s;
                }));

                // Persist Overrides
                const overridesData = localStorage.getItem('chef_hub_staff_overrides');
                const overrides: Record<string, string> = overridesData ? JSON.parse(overridesData) : {};

                staffList.forEach(s => {
                    const dept = mapping[s.role];
                    if (dept) overrides[s.name] = dept;
                });

                localStorage.setItem('chef_hub_staff_overrides', JSON.stringify(overrides));
                alert(`Sid has sorted your team into ${Object.keys(mapping).length} role categories!`);
            } else {
                alert("Sid couldn't identify distinct roles to sort.");
            }
        } catch (e) {
            console.error(e);
            alert("Sid ran into an error sorting the team.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleResetAllData = async () => {
        if (!confirm('⚠️ RESET ALL DATA? This will:\n\n1. Delete ALL roster uploads from database\n2. Clear all manual staff\n3. Clear all department overrides\n\nThis cannot be undone. Continue?')) {
            return;
        }

        setLoading(true);
        try {
            // 1. Delete all roster uploads from Supabase
            const { error: deleteError } = await supabase
                .from('roster_uploads')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

            if (deleteError) {
                console.error('Error deleting rosters:', deleteError);
                alert('Error clearing database. Check console.');
            } else {
                console.log('✅ Database cleared');
            }

            // 2. Clear LocalStorage
            localStorage.removeItem('chef_hub_manual_staff');
            localStorage.removeItem('chef_hub_staff_overrides');
            console.log('✅ LocalStorage cleared');

            // 3. Reset state
            setStaffList([]);
            setRawData(null);

            alert('✅ All data cleared! You can now upload a fresh roster file.');
            setShowTools(false);
        } catch (err) {
            console.error('Reset error:', err);
            alert('Error during reset. Check console.');
        } finally {
            setLoading(false);
        }
    };

    const handleReclassify = async () => {
        if (!staffList.length) {
            alert('No staff to classify!');
            return;
        }

        if (!confirm('Re-classify all staff departments using AI? This will override your current department assignments.')) {
            return;
        }

        setIsAnalyzing(true);
        try {
            console.log("🧠 Re-classifying all staff with updated AI logic...");
            const mapping = await aiService.analyzeStaffRoles(staffList);
            console.log("✅ New classification:", mapping);

            // Update all staff with new classifications
            const updatedStaff = staffList.map(s => ({
                ...s,
                department: mapping[s.role] || s.department || 'General'
            }));

            setStaffList(updatedStaff);

            // Save new classifications as overrides
            const overrides: Record<string, string> = {};
            updatedStaff.forEach(s => {
                if (mapping[s.role]) {
                    overrides[s.name] = mapping[s.role];
                }
            });
            localStorage.setItem('chef_hub_staff_overrides', JSON.stringify(overrides));

            alert(`✅ Re-classified ${Object.keys(mapping).length} role types!`);
        } catch (err) {
            console.error('Re-classification error:', err);
            alert('Error during re-classification. Check console.');
        } finally {
            setIsAnalyzing(false);
        }
    };



    // Sensors for DnD
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (activeTab === 'overview') {
            loadStaffData();
        }
    }, [activeTab]); // Removed viewMode from dep to avoid re-fetch loop, data is same

    const loadStaffData = async () => {
        setLoading(true);
        try {
            // 1. Fetch from Roster (DB)
            let rosterStaff: StaffMember[] = [];
            // ... (existing fetch logic remains same) ... 
            // (Re-using existing fetch code logic, just wrapped in function)
            const { data, error } = await supabase
                .from('roster_uploads')
                .select('ai_analysis')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                console.error('Error fetching roster:', error);
            }

            if (data && data.ai_analysis) {
                let schedules: any[] = [];
                const analysis = data.ai_analysis;
                if (Array.isArray(analysis)) {
                    schedules = analysis;
                } else if (analysis.schedules) {
                    schedules = analysis.schedules;
                    if (analysis.rawData) setRawData(analysis.rawData);
                }


                const uniqueStaffMap = new Map<string, StaffMember>();
                schedules.forEach(schedule => {
                    if (schedule.employeeName) {
                        uniqueStaffMap.set(schedule.employeeName, {
                            name: schedule.employeeName,
                            role: schedule.role || 'Staff',
                            department: schedule.department || schedule.role || 'General' // Will be AI-classified below
                        });
                    }
                });
                rosterStaff = Array.from(uniqueStaffMap.values());

                // Auto-classify departments if they're missing (using AI)
                const needsClassification = rosterStaff.some(s => !s.department || s.department === s.role || s.department === 'General');
                if (needsClassification && rosterStaff.length > 0) {
                    try {
                        console.log("🧠 Auto-classifying departments with AI...");
                        const mapping = await aiService.analyzeStaffRoles(rosterStaff);
                        rosterStaff = rosterStaff.map(s => ({
                            ...s,
                            department: mapping[s.role] || s.department || 'General'
                        }));
                        console.log("✅ AI Classification complete:", mapping);
                    } catch (err) {
                        console.warn("AI classification failed, using fallback", err);
                    }
                }
            }

            // 2. Fetch from LocalStorage (Manual Offline)
            const localData = localStorage.getItem('chef_hub_manual_staff');
            const manualStaff: StaffMember[] = localData ? JSON.parse(localData) : [];

            // 3. Fetch Overrides (Department changes)
            const overridesData = localStorage.getItem('chef_hub_staff_overrides');
            const overrides: Record<string, string> = overridesData ? JSON.parse(overridesData) : {};

            // 4. Merge
            const finalMap = new Map<string, StaffMember>();

            // Add roster staff (applying overrides)
            rosterStaff.forEach(s => {
                if (overrides[s.name]) {
                    s.department = overrides[s.name];
                }
                finalMap.set(s.name, s);
            });

            // Add manual staff (applying overrides if any, though usually direct update)
            manualStaff.forEach(s => {
                if (overrides[s.name]) {
                    s.department = overrides[s.name];
                }
                finalMap.set(s.name, s);
            });

            setStaffList(Array.from(finalMap.values()));

        } catch (error) {
            console.error('Error fetching staff directory:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const staff = staffList.find(s => s.name === active.id);
        if (staff) setActiveDraggable(staff);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDraggable(null);

        if (!over) return;

        // Grid Reordering
        if (viewMode === 'grid') {
            if (active.id !== over.id) {
                setStaffList((items) => {
                    const oldIndex = items.findIndex((item) => item.name === active.id);
                    const newIndex = items.findIndex((item) => item.name === over.id);
                    return arrayMove(items, oldIndex, newIndex);
                });
            }
            return;
        }

        // Board Reordering (Department Change)
        const staffName = String(active.id);
        const newDepartment = String(over.id); // Droppable ID will be Department Name

        // Update State
        setStaffList(prev => prev.map(s => {
            if (s.name === staffName) {
                return { ...s, department: newDepartment };
            }
            return s;
        }));

        // Persist Override
        const overridesData = localStorage.getItem('chef_hub_staff_overrides');
        const overrides: Record<string, string> = overridesData ? JSON.parse(overridesData) : {};
        overrides[staffName] = newDepartment;
        localStorage.setItem('chef_hub_staff_overrides', JSON.stringify(overrides));

        // Also update manual list if they exist there (for consistency)
        const localManual = localStorage.getItem('chef_hub_manual_staff');
        if (localManual) {
            const manuals: StaffMember[] = JSON.parse(localManual);
            const updatedManuals = manuals.map(s => s.name === staffName ? { ...s, department: newDepartment } : s);
            localStorage.setItem('chef_hub_manual_staff', JSON.stringify(updatedManuals));
        }
    };

    const handleAddStaff = () => {
        if (!newStaff.name || !newStaff.role) return;

        // Save to LocalStorage
        const localData = localStorage.getItem('chef_hub_manual_staff');
        const manualStaff: StaffMember[] = localData ? JSON.parse(localData) : [];
        const updatedManual = [...manualStaff, newStaff];
        localStorage.setItem('chef_hub_manual_staff', JSON.stringify(updatedManual));

        // Update UI
        setStaffList(prev => {
            // Check if exists to avoid dupe in view (though map handles it on reload, let's be clean)
            const exists = prev.some(s => s.name === newStaff.name);
            if (exists) return prev.map(s => s.name === newStaff.name ? newStaff : s);
            return [...prev, newStaff];
        });

        setShowAddModal(false);
        setNewStaff({ name: '', role: '', department: '' });
    };



    const departments = ['Hot Kitchen', 'Cold Kitchen', 'Pastry', 'Bakery', 'Butchery', 'General', 'Stewarding', 'Service'];

    // Group staff by department
    const staffByDept: Record<string, StaffMember[]> = {};
    departments.forEach(d => staffByDept[d] = []);

    // Also catch any "Other" departments
    const otherDept = 'Other';
    staffByDept[otherDept] = [];

    staffList.forEach(staff => {
        // Department now comes from Excel parsing which extracts it from role name
        const dept = staff.department || 'General';
        // Normalize
        // Find best match in our defined list
        const match = departments.find(d => d.toLowerCase() === dept.toLowerCase());
        if (match) {
            staffByDept[match].push(staff);
        } else {
            // Check if we already created a dynamic key
            if (!staffByDept[dept] && dept !== 'General') {
                // We could add dynamic keys, but let's stick to "Other" or mapped for simplicity in this iteration
                // Or simpler: Just push to 'General' if no match? Or allow dynamic?
                // Let's use General fallback for now to keep columns clean
                staffByDept['General'].push(staff);
            } else {
                staffByDept['General'].push(staff);
            }
        }
    });

    const filteredStaff = staffList.filter(staff =>
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[600px] flex flex-col">

            {/* Add Staff Modal */}
            {showAddModal && (
                <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-900">Add Team Member</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#ff7a00] outline-none"
                                    value={newStaff.name}
                                    onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                                    placeholder="e.g. Chef Ram"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#ff7a00] outline-none"
                                    value={newStaff.role}
                                    onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                                    placeholder="e.g. Sous Chef"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                                <select
                                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#ff7a00] outline-none bg-white"
                                    value={newStaff.department}
                                    onChange={e => setNewStaff({ ...newStaff, department: e.target.value })}
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            <button
                                onClick={handleAddStaff}
                                disabled={!newStaff.name || !newStaff.role}
                                className="w-full py-3 bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                Save Member
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-Header / Navigation */}
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-slate-900">Staff Management</h2>
                    <div className="h-6 w-px bg-slate-300"></div>
                    <nav className="flex gap-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview'
                                ? 'bg-white text-[#ff7a00] shadow-sm ring-1 ring-slate-200'
                                : 'text-slate-600 hover:bg-white/50'
                                }`}
                        >
                            <i className="fas fa-users mr-2"></i>Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('roster')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'roster'
                                ? 'bg-white text-[#ff7a00] shadow-sm ring-1 ring-slate-200'
                                : 'text-slate-600 hover:bg-white/50'
                                }`}
                        >
                            <i className="fas fa-calendar-alt mr-2"></i>Duty Schedule
                        </button>
                        <button
                            onClick={() => setActiveTab('off-duty')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'off-duty'
                                ? 'bg-white text-[#ff7a00] shadow-sm ring-1 ring-slate-200'
                                : 'text-slate-600 hover:bg-white/50'
                                }`}
                        >
                            <i className="fas fa-plane-departure mr-2"></i>Off Duty
                        </button>
                        <button
                            onClick={() => setActiveTab('hierarchy')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'hierarchy'
                                ? 'bg-white text-[#ff7a00] shadow-sm ring-1 ring-slate-200'
                                : 'text-slate-600 hover:bg-white/50'
                                }`}
                        >
                            <i className="fas fa-sitemap mr-2"></i>Hierarchy
                        </button>
                    </nav>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {activeTab === 'overview' && (
                    <div className="p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6 flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Staff Directory</h3>
                                <p className="text-slate-600 text-sm">Manage your kitchen brigade ({staffList.length} members)</p>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* View Toggle */}
                                <div className="bg-slate-100 p-1 rounded-lg flex">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <i className="fas fa-th-large mr-2"></i>Grid
                                    </button>
                                    <button
                                        onClick={() => setViewMode('board')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'board' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <i className="fas fa-columns mr-2"></i>Board
                                    </button>
                                </div>

                                <div className="h-8 w-px bg-slate-200"></div>

                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="px-4 py-2 bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] text-white rounded-lg font-medium hover:shadow-lg transition-all"
                                >
                                    <i className="fas fa-user-plus mr-2"></i> Add Staff
                                </button>

                                <button
                                    onClick={() => setShowTools(true)}
                                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                                    title="Troubleshooting & Data Tools"
                                >
                                    <i className="fas fa-cog"></i>
                                </button>

                                {viewMode === 'board' && (
                                    <button
                                        onClick={handleAutoSort}
                                        disabled={isAnalyzing}
                                        className={`ml-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 ${isAnalyzing ? 'opacity-75 cursor-wait' : ''}`}
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <i className="fas fa-magic fa-spin"></i> Sid is Thinking...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-magic"></i> Auto-Sort
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Tools Modal */}
                        {showTools && (
                            <div className="absolute top-16 right-6 z-50 bg-white shadow-xl border border-slate-200 rounded-xl p-4 w-64 animate-in fade-in zoom-in duration-200">
                                <h4 className="font-bold text-slate-900 mb-3 border-b pb-2">Data Tools</h4>
                                <div className="space-y-2">
                                    <button
                                        onClick={loadStaffData}
                                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-2"
                                    >
                                        <i className="fas fa-sync-alt text-blue-500"></i> Refresh Data
                                    </button>
                                    <button
                                        onClick={() => { setShowRawData(true); setShowTools(false); }}
                                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-2"
                                    >
                                        <i className="fas fa-table text-green-600"></i> View Raw Excel
                                    </button>
                                    <button
                                        onClick={handleClearOverrides}
                                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-2"
                                    >
                                        <i className="fas fa-undo text-orange-500"></i> Reset Departments
                                    </button>
                                    <button
                                        onClick={handleReclassify}
                                        disabled={isAnalyzing}
                                        className={`w-full text-left px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-sm font-bold text-purple-700 flex items-center gap-2 border-2 border-purple-200 ${isAnalyzing ? 'opacity-50 cursor-wait' : ''}`}
                                    >
                                        <i className={`fas fa-magic ${isAnalyzing ? 'fa-spin' : ''}`}></i> {isAnalyzing ? 'Re-classifying...' : 'Re-Classify with AI'}
                                    </button>
                                    <button
                                        onClick={handleClearManual}
                                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-sm font-medium text-red-600 flex items-center gap-2"
                                    >
                                        <i className="fas fa-trash-alt"></i> Clear Manual Staff
                                    </button>
                                    <div className="border-t my-2"></div>
                                    <button
                                        onClick={handleResetAllData}
                                        className="w-full text-left px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-sm font-bold text-red-700 flex items-center gap-2 border-2 border-red-200"
                                    >
                                        <i className="fas fa-exclamation-triangle"></i> RESET ALL DATA
                                    </button>
                                </div>
                                <div className="mt-3 pt-2 border-t text-center">
                                    <button onClick={() => setShowTools(false)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
                                </div>
                            </div>
                        )}


                        {/* Raw Data Modal - Full Screen Overlay */}
                        {showRawData && rawData && (
                            <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in fade-in zoom-in duration-200">
                                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <i className="fas fa-file-excel text-green-600"></i> Raw Roster Data
                                    </h3>
                                    <button
                                        onClick={() => setShowRawData(false)}
                                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition-colors"
                                    >
                                        Close Viewer
                                    </button>
                                </div>
                                <div className="flex-1 overflow-auto p-4">
                                    <table className="w-full min-w-[800px] border-collapse">
                                        <thead>
                                            <tr>
                                                {rawData[0]?.map((header: any, idx: number) => (
                                                    <th key={idx} className="p-2 border border-slate-300 bg-slate-100 text-left font-semibold text-xs text-slate-600 sticky top-0">
                                                        {header || `Column ${idx + 1}`}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rawData.slice(1).map((row: any[], rowIdx: number) => (
                                                <tr key={rowIdx} className="hover:bg-yellow-50">
                                                    {row.map((cell: any, cellIdx: number) => (
                                                        <td key={cellIdx} className="p-2 border border-slate-200 text-sm text-slate-700 whitespace-nowrap">
                                                            {cell !== null && cell !== undefined ? String(cell) : ''}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Search Bar - Only in Grid or handle filtering in Board too? Let's just keep simple for now */}
                        {viewMode === 'grid' && (
                            <div className="mb-6 relative flex-shrink-0">
                                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                <input
                                    type="text"
                                    placeholder="Search staff by name or role..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#ff7a00] focus:ring-1 focus:ring-[#ff7a00]"
                                />
                            </div>
                        )}

                        {loading ? (
                            <div className="text-center py-12">
                                <i className="fas fa-circle-notch fa-spin text-3xl text-[#ff7a00] mb-3"></i>
                                <p className="text-slate-600">Loading staff directory...</p>
                            </div>
                        ) : (
                            <>
                                {viewMode === 'grid' && (
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCorners}
                                        onDragEnd={handleDragEnd}
                                        onDragStart={handleDragStart}
                                    >
                                        <SortableContext
                                            items={filteredStaff.map(s => s.name)}
                                            strategy={rectSortingStrategy}
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4">
                                                {filteredStaff.map((staff) => (
                                                    <SortableStaffCard key={staff.name} staff={staff} />
                                                ))}
                                            </div>
                                        </SortableContext>
                                        <DragOverlay>
                                            {activeDraggable ? (
                                                <div className="bg-white p-4 rounded-xl shadow-xl border border-[#ff7a00] rotate-2 opacity-90 scale-105 cursor-grabbing w-full max-w-[300px]">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-[#ff7a00] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                            {activeDraggable.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900">{activeDraggable.name}</h4>
                                                            <p className="text-sm text-slate-600">{activeDraggable.role}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </DragOverlay>
                                    </DndContext>
                                )}

                                {viewMode === 'board' && (
                                    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                                        <div
                                            ref={scrollContainerRef}
                                            className={`flex gap-4 overflow-x-auto pb-4 h-full items-start ${isDraggingBoard ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
                                            onMouseDown={handleMouseDown}
                                            onMouseLeave={handleMouseLeave}
                                            onMouseUp={handleMouseUp}
                                            onMouseMove={handleMouseMove}
                                        >
                                            {departments.map(dept => (
                                                <DroppableColumn key={dept} id={dept} title={dept}>
                                                    {staffByDept[dept].map(staff => (
                                                        <DraggableStaffCard key={staff.name} staff={staff} />
                                                    ))}
                                                </DroppableColumn>
                                            ))}
                                        </div>
                                        <DragOverlay>
                                            {activeDraggable ? (
                                                <div className="bg-white p-3 rounded-lg shadow-xl border border-[#ff7a00] rotate-3 opacity-90 scale-105 cursor-grabbing w-64">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-[#ff7a00]">
                                                            {activeDraggable.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-sm">{activeDraggable.name}</h4>
                                                            <p className="text-xs text-slate-500">{activeDraggable.role}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </DragOverlay>
                                    </DndContext>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ... Other Tabs (Roster, Off-Duty) ... */}
                {activeTab === 'roster' && (
                    <div className="bg-slate-50 overflow-y-auto h-full">
                        <DutySchedule />
                    </div>
                )}

                {activeTab === 'off-duty' && (
                    <div className="bg-slate-50 overflow-y-auto h-full">
                        <OffDuty />
                    </div>
                )}

                {activeTab === 'hierarchy' && (
                    <div className="bg-slate-50 overflow-hidden h-full flex flex-col">
                        <div className="p-6 border-b border-slate-200 bg-white">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <i className="fas fa-project-diagram text-[#ff7a00]"></i> Kitchen Hierarchy
                            </h3>
                            <p className="text-slate-500 text-sm">Visual Organizational Chart with Live Duty Status (Green = Working Today)</p>
                        </div>
                        <div className="flex-1 overflow-auto bg-slate-50 relative">
                            <HierarchyTree
                                staffList={staffList}
                                onDutyMap={staffList.reduce((acc, staff) => {
                                    acc[staff.name] = true; // Defaulting to true for demo as requested
                                    return acc;
                                }, {} as Record<string, boolean>)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default StaffManagement;
