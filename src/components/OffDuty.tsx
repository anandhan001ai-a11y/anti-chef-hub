import React, { useState, useRef, ChangeEvent } from 'react';
import { Calendar, FileText, Upload, Search, Filter } from 'lucide-react';

interface OffDutyRecord {
    id: string;
    employeeName: string;
    employeeId?: string;
    role?: string;
    department?: string;
    leaveType: 'annual' | 'sick' | 'dayoff' | 'other';
    startDate: string;
    endDate: string;
    daysCount: number;
    reason?: string;
    documents: {
        id: string;
        filename: string;
        uploadDate: Date;
        fileData: string;
    }[];
    status: 'active' | 'completed';
    createdAt: Date;
    source?: 'manual' | 'sid';
}

const OffDuty: React.FC = () => {
    const [offDutyRecords, setOffDutyRecords] = useState<OffDutyRecord[]>([]);
    const [filterType, setFilterType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<OffDutyRecord | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load off duty records from localStorage AND SID analysis
    React.useEffect(() => {
        const loadRecords = () => {
            const allRecords: OffDutyRecord[] = [];
            const today = new Date();
            const todayStr = today.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });

            // 1. Load manual records from localStorage
            const storedManual = localStorage.getItem('offDutyRecords');
            if (storedManual) {
                try {
                    const parsed = JSON.parse(storedManual);
                    const manualRecords = parsed.map((r: any) => ({
                        ...r,
                        source: 'manual',
                        createdAt: new Date(r.createdAt),
                        documents: r.documents?.map((d: any) => ({
                            ...d,
                            uploadDate: new Date(d.uploadDate)
                        })) || []
                    }));
                    allRecords.push(...manualRecords);
                } catch (e) {
                    console.error('Error parsing manual records:', e);
                }
            }

            // 2. Load SID analysis data - check for OFF, VACATION, and LEAVE staff
            const sidAnalysis = localStorage.getItem('sidRosterAnalysis');
            if (sidAnalysis) {
                try {
                    const analysis = JSON.parse(sidAnalysis);
                    const staff = analysis.staff || [];
                    const todayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

                    console.log('🤖 SID Off-Duty: Processing', staff.length, 'staff members');

                    staff.forEach((emp: any) => {
                        // Find today's schedule entry
                        const todaySchedule = emp.schedule?.find((sch: any) => {
                            const schedDate = (sch.date || '').toLowerCase();
                            return schedDate.includes(todayName) ||
                                schedDate.includes(String(today.getDate()));
                        });

                        if (todaySchedule) {
                            const shift = (todaySchedule.shift || '').toUpperCase();
                            const shiftType = (todaySchedule.shiftType || '').toUpperCase();

                            // Check if Weekly Day OFF
                            if (shift === 'OFF' || shiftType === 'OFF') {
                                const exists = allRecords.find(r =>
                                    r.employeeName === emp.name && r.source === 'sid' && r.leaveType === 'dayoff'
                                );
                                if (!exists) {
                                    allRecords.push({
                                        id: `sid-off-${emp.rollNumber || emp.name}`,
                                        employeeName: emp.name,
                                        employeeId: emp.rollNumber,
                                        role: emp.role || emp.position,
                                        department: emp.department,
                                        leaveType: 'dayoff',
                                        startDate: todayStr,
                                        endDate: todayStr,
                                        daysCount: 1,
                                        reason: 'Weekly Day Off',
                                        documents: [],
                                        status: 'active',
                                        createdAt: new Date(),
                                        source: 'sid'
                                    });
                                }
                            }
                            // Check if on ANNUAL LEAVE (VACATION)
                            else if (shift === 'VACATION' || shiftType === 'ANNUAL_LEAVE' ||
                                shift.includes('VACATION')) {
                                const exists = allRecords.find(r =>
                                    r.employeeName === emp.name && r.source === 'sid' && r.leaveType === 'annual'
                                );
                                if (!exists) {
                                    allRecords.push({
                                        id: `sid-vac-${emp.rollNumber || emp.name}`,
                                        employeeName: emp.name,
                                        employeeId: emp.rollNumber,
                                        role: emp.role || emp.position,
                                        department: emp.department,
                                        leaveType: 'annual',
                                        startDate: todayStr,
                                        endDate: todayStr,
                                        daysCount: 1,
                                        reason: 'Annual Leave (Vacation)',
                                        documents: [],
                                        status: 'active',
                                        createdAt: new Date(),
                                        source: 'sid'
                                    });
                                }
                            }
                            // Check if UNPAID LEAVE
                            else if (shift === 'LEAVE' || shift === 'UN-PAID LEAVE' || shift === 'UL' ||
                                shiftType === 'UNPAID_LEAVE' || shift.includes('UNPAID') || shift.includes('UN-PAID')) {
                                const exists = allRecords.find(r =>
                                    r.employeeName === emp.name && r.source === 'sid' && r.leaveType === 'other'
                                );
                                if (!exists) {
                                    allRecords.push({
                                        id: `sid-ul-${emp.rollNumber || emp.name}`,
                                        employeeName: emp.name,
                                        employeeId: emp.rollNumber,
                                        role: emp.role || emp.position,
                                        department: emp.department,
                                        leaveType: 'other',
                                        startDate: todayStr,
                                        endDate: todayStr,
                                        daysCount: 1,
                                        reason: 'Unpaid Leave',
                                        documents: [],
                                        status: 'active',
                                        createdAt: new Date(),
                                        source: 'sid'
                                    });
                                }
                            }
                        }
                    });

                    console.log('🤖 SID Off-Duty: Found', allRecords.filter(r => r.source === 'sid').length, 'from roster');
                } catch (e) {
                    console.error('Error parsing SID analysis:', e);
                }
            }

            setOffDutyRecords(allRecords);
        };

        loadRecords();

        // Listen for SID analysis updates
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'sidRosterAnalysis') {
                loadRecords();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const getLeaveTypeLabel = (type: string) => {
        switch (type) {
            case 'annual': return '✈️ Annual Leave';
            case 'sick': return '🤒 Sick Leave';
            case 'dayoff': return '📅 Weekly Off';
            case 'other': return '📝 Unpaid Leave';
            default: return type;
        }
    };

    const getLeaveTypeBadge = (type: string) => {
        switch (type) {
            case 'annual': return 'bg-blue-100 text-blue-700';
            case 'sick': return 'bg-red-100 text-red-700';
            case 'dayoff': return 'bg-slate-100 text-slate-700';
            case 'other': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleFileUpload = (record: OffDutyRecord, event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const newDocument = {
                id: Date.now().toString(),
                filename: file.name,
                uploadDate: new Date(),
                fileData: e.target?.result as string
            };

            const updatedRecords = offDutyRecords.map(r =>
                r.id === record.id
                    ? { ...r, documents: [...r.documents, newDocument] }
                    : r
            );

            setOffDutyRecords(updatedRecords);
            localStorage.setItem('offDutyRecords', JSON.stringify(updatedRecords));
            setShowUploadModal(false);
            alert('Document uploaded successfully!');
        };
        reader.readAsDataURL(file);
    };

    const calculateDaysRemaining = (endDate: string) => {
        const end = new Date(endDate);
        const today = new Date();
        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const getFilteredRecords = () => {
        return offDutyRecords.filter(record => {
            const matchesType = filterType === 'all' || record.leaveType === filterType;
            const matchesSearch = !searchQuery ||
                record.employeeName.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesType && matchesSearch && record.status === 'active';
        });
    };

    const filteredRecords = getFilteredRecords();

    // Calculate statistics
    const activeRecords = offDutyRecords.filter(r => r.status === 'active');
    const stats = {
        total: activeRecords.length,
        sick: activeRecords.filter(r => r.leaveType === 'sick').length,
        annual: activeRecords.filter(r => r.leaveType === 'annual').length,
        dayoff: activeRecords.filter(r => r.leaveType === 'dayoff').length,
        unpaid: activeRecords.filter(r => r.leaveType === 'other').length,
        returning: activeRecords.filter(r => calculateDaysRemaining(r.endDate) <= 2).length
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-gradient-to-br from-[#ff7a00] to-[#ff8f2d] text-white rounded-xl shadow-lg p-5">
                    <div className="text-3xl font-bold mb-1">{stats.total}</div>
                    <div className="text-sm opacity-90">Off Duty Today</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="text-2xl font-bold text-slate-600 mb-1">{stats.dayoff}</div>
                    <div className="text-sm text-slate-600">📅 Weekly Off</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{stats.annual}</div>
                    <div className="text-sm text-slate-600">✈️ Annual Leave</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.unpaid}</div>
                    <div className="text-sm text-slate-600">📝 Unpaid Leave</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="text-2xl font-bold text-green-600 mb-1">{stats.returning}</div>
                    <div className="text-sm text-slate-600">🟢 Returning Soon</div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <Search className="w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by staff name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-slate-400" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 transition-all"
                        >
                            <option value="all">All Leave Types</option>
                            <option value="dayoff">Weekly Off</option>
                            <option value="annual">Annual Leave</option>
                            <option value="other">Unpaid Leave</option>
                            <option value="sick">Sick Leave</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Active Absences Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-[#ff7a00]" />
                    Active Absences ({filteredRecords.length})
                </h2>

                {filteredRecords.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600">No off-duty records found</p>
                        <p className="text-sm text-slate-400 mt-2">
                            Upload a duty schedule to automatically track absences
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] text-white">
                                <tr>
                                    <th className="p-3 text-left font-semibold">Staff Name</th>
                                    <th className="p-3 text-left font-semibold">Leave Type</th>
                                    <th className="p-3 text-left font-semibold">Date</th>
                                    <th className="p-3 text-left font-semibold">Reason</th>
                                    <th className="p-3 text-center font-semibold">Documents</th>
                                    <th className="p-3 text-center font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map((record) => (
                                    <tr key={record.id} className="border-t border-slate-200 hover:bg-orange-50 transition-colors">
                                        <td className="p-3">
                                            <div className="font-semibold text-slate-900">{record.employeeName}</div>
                                            {record.role && (
                                                <div className="text-xs text-slate-500">{record.role}</div>
                                            )}
                                            {record.department && (
                                                <div className="text-xs text-slate-400">{record.department}</div>
                                            )}
                                            {record.source === 'sid' && (
                                                <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">🤖 SID</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLeaveTypeBadge(record.leaveType)}`}>
                                                {getLeaveTypeLabel(record.leaveType)}
                                            </span>
                                        </td>
                                        <td className="p-3 text-slate-600 text-sm">{record.startDate}</td>
                                        <td className="p-3 text-slate-600 text-sm">{record.reason || '-'}</td>
                                        <td className="p-3 text-center">
                                            {record.documents.length > 0 ? (
                                                <span className="text-green-600 font-semibold">
                                                    ✓ {record.documents.length}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedRecord(record);
                                                        setShowUploadModal(true);
                                                    }}
                                                    className="p-2 bg-[#ff7a00] text-white rounded-lg hover:bg-[#ff8f2d] transition-colors"
                                                    title="Upload Document"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                </button>
                                                {record.documents.length > 0 && (
                                                    <button
                                                        onClick={() => setSelectedRecord(record)}
                                                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                                        title="View Documents"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showUploadModal && selectedRecord && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Upload Document</h3>
                        <p className="text-slate-600 mb-4">
                            Upload medical certificate or leave request for <strong>{selectedRecord.employeeName}</strong>
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) => handleFileUpload(selectedRecord, e)}
                            className="hidden"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                            >
                                <Upload className="w-5 h-5 inline mr-2" />
                                Choose File
                            </button>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="px-4 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OffDuty;
