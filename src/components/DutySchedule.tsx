import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { aiService } from '../lib/aiService';
import { SidService } from '../lib/SidService';


interface Schedule {
    id: string;
    employeeName: string;
    date: string;
    shift: string;
    role: string;
    department: string;
    status: string;
}

interface UploadedFile {
    name: string;
    size: number;
    progress: number;
    status: 'uploading' | 'processing' | 'completed' | 'error';
    error?: string;
}

interface ParseResult {
    success: boolean;
    schedules: Schedule[];
    metadata: {
        totalRecords: number;
        uniqueStaff: number;
        detectedColumns: Record<string, string>;
        sampleRow?: any;
        totalRowsInFile?: number;
    };
}

const parseExcelData = (rows: any[][]): ParseResult => {
    if (!rows || rows.length < 2) {
        return {
            success: false,
            schedules: [],
            metadata: {
                totalRecords: 0,
                uniqueStaff: 0,
                detectedColumns: {},
                totalRowsInFile: rows?.length || 0
            }
        };
    }

    // Debug logs
    console.log("Raw Rows:", rows.slice(0, 5));

    // Find header row (skip empty rows)
    let headerRowIndex = 0;
    while (headerRowIndex < rows.length) {
        const row = rows[headerRowIndex];
        if (row && row.some(cell => {
            if (!cell) return false;
            const str = String(cell).toUpperCase();
            return str.includes('NAME') || str.includes('SHIFT') || str.includes('EMPLOYEE') || str.includes('POSITION');
        })) {
            break;
        }
        headerRowIndex++;
    }

    console.log("Header Row Index:", headerRowIndex);

    if (headerRowIndex >= rows.length) {
        // Fallback: If no header found, try to guess based on data structure (assuming first non-empty row is header)
        // OR simply start parsing from row 0 if it looks like data
        console.warn("No obvious header row found, searching for data structure...");
        headerRowIndex = 0;
    }

    const headers = rows[headerRowIndex] ? rows[headerRowIndex].map((h: any) =>
        h ? String(h).trim().toUpperCase() : ''
    ) : [];
    console.log("Headers Detected:", headers);

    // Detect column mappings
    let nameCol = -1;
    let roleCol = -1;
    let extractedDayColumns: { index: number; day: string }[] = [];

    // Strategy 1: Explicit Header Names
    headers.forEach((h, i) => {
        if (h.includes('NAME') || h.includes('EMPLOYEE') || h.includes('STAFF')) nameCol = i;
        if (h.includes('ROLE') || h.includes('POSITION') || h.includes('DESIGNATION') || h.includes('JOB')) roleCol = i;
    });

    // Strategy 2: Positional Fallback (based on screenshot: Col 1=Name, Col 3=Role)
    if (nameCol === -1) {
        // Check if Col 1 (index 1) has data that looks like names
        // Heuristic: Strings, no numbers, length > 3
        const sampleRowToCheck = rows[headerRowIndex + 1] || rows[headerRowIndex + 2];
        if (sampleRowToCheck && typeof sampleRowToCheck[1] === 'string' && sampleRowToCheck[1].length > 3) {
            nameCol = 1; // Assuming 2nd column
        } else if (sampleRowToCheck && typeof sampleRowToCheck[0] === 'string') {
            nameCol = 0; // Assuming 1st column
        }
    }

    if (roleCol === -1) {
        // Based on screenshot, "BAKERY HELPER" is in Col 3 (index 3)
        roleCol = 3;
    }

    // Detect Date Columns
    // 1. Look for day names in header
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    headers.forEach((header, index) => {
        dayNames.forEach(day => {
            if (header.includes(day) || header === day) {
                extractedDayColumns.push({ index, day: day.charAt(0) + day.slice(1).toLowerCase() });
            }
        });
    });

    // 2. If no day headers found (e.g. headers are empty dates), assume columns 4-10 are Mon-Sun (or Sun-Sat)
    if (extractedDayColumns.length === 0) {
        // Screenshot shows times starting around col 4
        // Let's assume standard week starting at Col 4?
        const startCol = 4;
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        for (let i = 0; i < 7; i++) {
            if (headers[startCol + i] !== undefined) {
                extractedDayColumns.push({ index: startCol + i, day: days[i] });
            }
        }
    }

    console.log("Column Mapping -> Name:", nameCol, "Role:", roleCol, "Days:", extractedDayColumns);

    const schedules: Schedule[] = [];
    const employeeNames = new Set<string>();

    // Parse data rows
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.every(cell => !cell)) continue; // Skip empty rows

        // Strict skip: if name column is empty, it's not a valid staff row
        const employeeName = nameCol >= 0 && row[nameCol] ? String(row[nameCol]).trim() : '';
        if (!employeeName || employeeName.length < 2 || employeeName.toUpperCase() === 'NAME') continue;

        const role = roleCol >= 0 && row[roleCol] ? String(row[roleCol]).trim() : 'Staff';
        employeeNames.add(employeeName);

        // Extract department from role name
        const extractDepartment = (roleName: string): string => {
            const lower = roleName.toLowerCase();

            // Check for department keywords in role name
            if (lower.includes('hot kitchen') || lower.includes('hot-kitchen')) return 'Hot Kitchen';
            if (lower.includes('cold kitchen') || lower.includes('cold-kitchen')) return 'Cold Kitchen';
            if (lower.includes('bakery') || lower.includes('pastry')) return 'Pastry';
            if (lower.includes('butcher')) return 'Butchery';
            if (lower.includes('steward')) return 'Stewarding';
            if (lower.includes('service') || lower.includes('waiter') || lower.includes('server')) return 'Service';

            // Fallback: if role contains "chef" or "cook", likely Hot Kitchen
            if (lower.includes('chef') || lower.includes('cook') || lower.includes('commis')) return 'Hot Kitchen';

            return 'General';
        };

        // Create a schedule entry for each day column
        extractedDayColumns.forEach(({ index, day }) => {
            const shiftValue = row[index] ? String(row[index]).trim() : 'OFF'; // Default to OFF if empty/undefined? Or empty string? Users usually leave OFF blank or explicit.

            // Only add if it's not completely empty/null, though "OFF" is valid
            if (shiftValue) {
                schedules.push({
                    id: `${employeeName}-${day}-${i}`,
                    employeeName,
                    date: day,
                    shift: shiftValue,
                    role,
                    department: extractDepartment(role), // Extract from role name
                    status: 'scheduled'
                });
            }
        });
    }

    return {
        success: true,
        schedules,
        metadata: {
            totalRecords: schedules.length,
            uniqueStaff: employeeNames.size,
            detectedColumns: { name: String(nameCol), role: String(roleCol) },
            sampleRow: rows[headerRowIndex + 1],
            totalRowsInFile: rows.length
        }
    };
};

const DutySchedule: React.FC = () => {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [parseResult, setParseResult] = useState<ParseResult | null>(null);
    const [rawExcelData, setRawExcelData] = useState<any[][] | null>(null); // Store raw Excel rows
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterDate, setFilterDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // AI Analysis State
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [isAiProcessing, setIsAiProcessing] = useState(false);

    // Fetch existing schedules on mount
    useEffect(() => {
        fetchExistingSchedules();
    }, []);

    const fetchExistingSchedules = async () => {
        try {
            const { data, error } = await supabase
                .from('roster_uploads')
                .select('ai_analysis')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching schedules:', error);
                return;
            }

            if (data && data.ai_analysis) {
                const analysis = data.ai_analysis;
                // Handle both new format { schedules, rawData } and old format [schedules]
                if (Array.isArray(analysis)) {
                    setSchedules(analysis);
                } else if (analysis.schedules) {
                    setSchedules(analysis.schedules);
                    if (analysis.rawData) {
                        setRawExcelData(analysis.rawData);

                        // Trigger AI analysis on existing data
                        setIsAiProcessing(true);
                        try {
                            console.log("🧠 Sid analyzing existing roster data...");
                            const aiResult = await aiService.analyzeRosterFile(analysis.rawData);
                            setAiAnalysis(aiResult);

                            // Save to localStorage for OffDuty component
                            localStorage.setItem('sidRosterAnalysis', JSON.stringify(aiResult));
                            console.log("✅ Sid AI Analysis complete and saved:", aiResult);
                        } catch (aiErr) {
                            console.warn("AI analysis failed:", aiErr);
                        } finally {
                            setIsAiProcessing(false);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load existing schedules:', err);
        }
    };

    const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            uploadFile(files[0]);
        }
        e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            uploadFile(files[0]);
        }
    };

    // Helper: Detect month from filename (e.g., "BOH_December_2025.xlsx")
    const detectMonthFromFilename = (filename: string): string | null => {
        const months = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        const lowerName = filename.toLowerCase();

        for (const month of months) {
            if (lowerName.includes(month)) {
                // Try to find year
                const yearMatch = lowerName.match(/20\d{2}/);
                const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();
                return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
            }
        }
        return null;
    };

    // Helper: Detect month from Excel data (look for "DECEMBER 2025" etc in headers)
    const detectMonthFromData = (data: any[][]): string | null => {
        const months = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];

        // Check first 10 rows for month pattern
        for (let i = 0; i < Math.min(10, data.length); i++) {
            const row = data[i];
            if (!row) continue;

            const rowText = row.join(' ').toLowerCase();

            for (const month of months) {
                if (rowText.includes(month)) {
                    const yearMatch = rowText.match(/20\d{2}/);
                    const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();
                    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
                }
            }
        }
        return null;
    };

    const uploadFile = async (file: File) => {
        setUploadedFile({
            name: file.name,
            size: file.size,
            progress: 0,
            status: 'uploading'
        });

        try {
            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('rosters')
                .upload(filePath, file);

            if (uploadError) {
                console.error("Storage Upload Error:", uploadError);
                throw new Error(`Storage Error: ${uploadError.message || 'Check connection/permissions'}`);
            }

            setUploadedFile(prev => prev ? { ...prev, progress: 50, status: 'processing' } : null);

            // 2. Local Deterministic Parsing
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            // Get raw data for display
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            setRawExcelData(jsonData as any[][]);

            // Parse full dataset locally
            const parseResultLocal = parseExcelData(jsonData as any[][]);

            if (!parseResultLocal.success) {
                throw new Error("Parsing Error: Could not understand Excel format.");
            }

            const parsedSchedules = parseResultLocal.schedules;

            // 2.5 AI Analysis with Sid (parallel to local parsing)
            setIsAiProcessing(true);
            let aiResult = null;
            try {
                aiResult = await aiService.analyzeRosterFile(jsonData as any[][]);
                setAiAnalysis(aiResult);

                // Save to localStorage for OffDuty component
                localStorage.setItem('sidRosterAnalysis', JSON.stringify(aiResult));
                console.log("🧠 Sid AI Analysis:", aiResult);
            } catch (aiError) {
                console.warn("AI Analysis failed, using local parsing:", aiError);
            } finally {
                setIsAiProcessing(false);
            }

            const currentUser = (await supabase.auth.getUser()).data.user;

            // ========================================
            // SID RULE: Detect month and deduplicate
            // ========================================
            const rosterMonth = aiResult?.month || detectMonthFromFilename(file.name) || detectMonthFromData(jsonData as any[][]);
            console.log(`📅 SID: Detected roster month: ${rosterMonth}`);

            if (rosterMonth) {
                // Delete old rosters for the same month
                const { data: existingRosters, error: fetchError } = await supabase
                    .from('roster_uploads')
                    .select('id, filename, ai_analysis, created_at')
                    .order('created_at', { ascending: false });

                if (!fetchError && existingRosters) {
                    // Find rosters that match the same month
                    const duplicates = existingRosters.filter(roster => {
                        // Check filename for month pattern
                        const rosterInfo = roster.filename?.toLowerCase() || '';
                        const monthLower = rosterMonth.toLowerCase();

                        // Also check stored ai_analysis.month
                        const storedMonth = roster.ai_analysis?.month?.toLowerCase() || '';

                        // Direct match with stored month
                        if (storedMonth && storedMonth === monthLower) {
                            return true;
                        }

                        // Extract month/year patterns from filename
                        const monthPatterns = [
                            monthLower.split(' ')[0], // "December"
                            monthLower.split(' ')[1], // "2025"
                            monthLower.replace(' ', '_'), // "December_2025"
                            monthLower.replace(' ', '-') // "December-2025"
                        ];

                        return monthPatterns.some(pattern => pattern && rosterInfo.includes(pattern));
                    });

                    if (duplicates.length > 0) {
                        console.log(`🗑️ SID: Found ${duplicates.length} existing rosters for ${rosterMonth}. Replacing with new upload.`);

                        // Delete duplicates (keep only the current upload)
                        const idsToDelete = duplicates.map(r => r.id);
                        const { error: deleteError } = await supabase
                            .from('roster_uploads')
                            .delete()
                            .in('id', idsToDelete);

                        if (deleteError) {
                            console.warn("SID: Could not delete old rosters:", deleteError);
                        } else {
                            console.log(`✅ SID: Deleted ${duplicates.length} old roster(s) for ${rosterMonth}`);
                        }
                    }
                }
            }

            // 3. Save Record to Database (Full Dataset + Raw Data)
            const { error: dbError } = await supabase
                .from('roster_uploads')
                .insert({
                    filename: file.name,
                    file_url: uploadData.path,
                    file_size: file.size,
                    // Note: Month is stored in ai_analysis.month
                    ai_analysis: {
                        schedules: parsedSchedules,
                        rawData: jsonData, // Persist raw data for "Original View"
                        month: rosterMonth
                    },
                    raw_text: "Parsed via Logic",
                    status: 'completed',
                    uploaded_by: currentUser ? currentUser.id : null
                });

            if (dbError) {
                console.warn("DB Save Warning:", dbError);
            }

            setSchedules(parsedSchedules); // Immediate UI update
            setParseResult(parseResultLocal);
            setUploadedFile(prev => prev ? { ...prev, progress: 100, status: 'completed' } : null);


        } catch (error: any) {
            console.error('Upload Process Error:', error);
            setUploadedFile(prev => prev ? { ...prev, status: 'error', error: error.message } : null);
            // alert(`Error: ${error.message}. Please check Console for details.`);
        }
    };



    const handleConfirmImport = () => {
        if (parseResult && parseResult.schedules) {
            setSchedules(prev => [...prev, ...parseResult.schedules]);
            setParseResult(null);
            setUploadedFile(null);
        }
    };

    const handleCancelImport = () => {
        setParseResult(null);
        setUploadedFile(null);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFilteredSchedules = () => {
        return schedules.filter(schedule => {
            const matchesDepartment = filterDepartment === 'all' || schedule.department === filterDepartment;
            const matchesDate = !filterDate || schedule.date.includes(filterDate);
            const matchesSearch = !searchQuery ||
                schedule.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                schedule.role.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesDepartment && matchesDate && matchesSearch;
        });
    };

    const departments = ['all', ...new Set(schedules.map(s => s.department).filter(d => d))];
    const filteredSchedules = getFilteredSchedules();

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Header with Upload Button / Drop Zone */}
            <div
                className="bg-white rounded-xl shadow-sm border-2 border-dashed border-slate-300 hover:border-[#ff7a00] hover:bg-orange-50 transition-all p-8 mb-6 cursor-pointer group"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-orange-100 text-[#ff7a00] rounded-full flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                        <i className="fas fa-cloud-upload-alt"></i>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Upload Duty Roster</h1>
                    <p className="text-slate-500 max-w-md mx-auto mb-6">
                        Drag and drop your Excel roster here, or click to browse.
                        <br />
                        <span className="text-xs text-slate-400">(Supports .xlsx, .xls, .csv)</span>
                    </p>
                    <button className="px-6 py-3 bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                        <i className="fas fa-folder-open"></i>
                        Browse Files
                    </button>
                </div>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
                style={{ display: 'none' }}
            />

            {/* Upload Progress */}
            {uploadedFile && !parseResult && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <i className={`fas text-3xl ${uploadedFile.status === 'error' ? 'fa-exclamation-circle text-red-500' :
                            uploadedFile.status === 'completed' ? 'fa-check-circle text-green-500' :
                                'fa-file-excel text-[#ff7a00]'
                            }`}></i>
                        <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{uploadedFile.name}</h4>
                            <p className="text-sm text-slate-600">{formatFileSize(uploadedFile.size)}</p>
                        </div>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                        <div
                            className="h-full bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] transition-all duration-300"
                            style={{ width: `${uploadedFile.progress}%` }}
                        ></div>
                    </div>
                    <p className="text-sm font-semibold text-center">
                        {uploadedFile.status === 'uploading' && 'Uploading...'}
                        {uploadedFile.status === 'processing' && 'Processing...'}
                        {uploadedFile.status === 'completed' && 'Completed!'}
                        {uploadedFile.status === 'error' && (
                            <span className="text-red-600">
                                {uploadedFile.error || 'Error occurred - Please check console'}
                            </span>
                        )}
                    </p>
                </div>
            )}

            {/* Parse Results */}
            {parseResult && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="text-center mb-6">
                        <i className="fas fa-check-circle text-5xl text-green-500 mb-3"></i>
                        <h2 className="text-2xl font-bold text-slate-900">File Parsed Successfully!</h2>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold">{parseResult.metadata.totalRecords}</div>
                            <div className="text-sm opacity-90">Schedule Entries</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold">{parseResult.metadata.uniqueStaff}</div>
                            <div className="text-sm opacity-90">Staff Members</div>
                        </div>
                        <div className="bg-gradient-to-br from-[#ff7a00] to-[#ff8f2d] text-white rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold">
                                {Object.keys(parseResult.metadata.detectedColumns).length}
                            </div>
                            <div className="text-sm opacity-90">Detected Columns</div>
                        </div>
                    </div>

                    {/* Preview Calendar */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">📅 Weekly Schedule Preview</h3>
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full min-w-[800px]">
                                <thead className="bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] text-white">
                                    <tr>
                                        <th className="p-3 text-left sticky left-0 bg-[#ff7a00]">Name</th>
                                        <th className="p-3 text-left">Role</th>
                                        <th className="p-3 text-center">Sunday</th>
                                        <th className="p-3 text-center">Monday</th>
                                        <th className="p-3 text-center">Tuesday</th>
                                        <th className="p-3 text-center">Wednesday</th>
                                        <th className="p-3 text-center">Thursday</th>
                                        <th className="p-3 text-center">Friday</th>
                                        <th className="p-3 text-center">Saturday</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {(() => {
                                        const employeeMap = new Map<string, any>();

                                        parseResult.schedules.forEach(schedule => {
                                            if (!employeeMap.has(schedule.employeeName)) {
                                                employeeMap.set(schedule.employeeName, {
                                                    name: schedule.employeeName,
                                                    role: schedule.role,
                                                    days: {}
                                                });
                                            }
                                            employeeMap.get(schedule.employeeName).days[schedule.date] = schedule.shift;
                                        });

                                        return Array.from(employeeMap.values()).map((employee, idx) => (
                                            <tr key={idx} className="border-t border-slate-200 hover:bg-slate-50">
                                                <td className="p-3 font-semibold text-slate-900 sticky left-0 bg-white">{employee.name}</td>
                                                <td className="p-3 text-slate-600">{employee.role}</td>
                                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                                    <td key={day} className={`p-3 text-center text-sm ${employee.days[day]
                                                        ? (employee.days[day].toLowerCase().includes('off')
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-green-100 text-green-700')
                                                        : 'bg-slate-50 text-slate-400'
                                                        }`}>
                                                        {employee.days[day] || 'OFF'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={handleConfirmImport}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                            <i className="fas fa-check mr-2"></i>
                            Import {parseResult.schedules.length} Entries
                        </button>
                        <button
                            onClick={handleCancelImport}
                            className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                        >
                            <i className="fas fa-times mr-2"></i>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Today's Schedule - SID AI Analysis - TAMIMI GLOBAL FORMAT */}
            {(aiAnalysis || isAiProcessing) && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                📅 Today's Schedule
                                <span className="text-sm font-normal text-slate-500">
                                    ({new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })})
                                </span>
                            </h3>
                            <p className="text-sm text-slate-600">TAMIMI GLOBAL CO. LTD. (TAFGA) - NEOM LOC# 198</p>
                        </div>
                        {isAiProcessing && (
                            <div className="flex items-center gap-2 text-purple-600">
                                <i className="fas fa-magic fa-spin"></i>
                                <span className="text-sm font-medium">SID is analyzing...</span>
                            </div>
                        )}
                    </div>

                    {aiAnalysis && !aiAnalysis.error && (
                        <>
                            {/* 21 Role Categories Summary */}
                            {(() => {
                                const categorySummary = SidService.getRoleCategorySummary(aiAnalysis.staff || []);
                                return categorySummary.length > 0 && (
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 mb-4">
                                        <h4 className="font-bold text-indigo-700 flex items-center gap-2 mb-3">
                                            📊 Staff by Role Category
                                            <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                                                {categorySummary.length} categories | {aiAnalysis.staff?.length || 0} total staff
                                            </span>
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                                            {categorySummary.map((cat, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-sm border"
                                                    style={{ borderColor: cat.color + '40' }}
                                                >
                                                    <span className="text-lg">{cat.icon}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-medium text-slate-700 truncate">{cat.categoryName}</div>
                                                        <div className="text-sm font-bold" style={{ color: cat.color }}>{cat.count}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3 text-xs text-indigo-600 flex items-center gap-2">
                                            <i className="fas fa-info-circle"></i>
                                            SID auto-sorts staff into 21 role categories for easy management
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Department Summary Section */}
                            {(() => {
                                const departmentIcons: Record<string, string> = {
                                    'Hot Kitchen': '🔥',
                                    'Cold Kitchen': '❄️',
                                    'Bakery': '🥖',
                                    'Butchery': '🥩',
                                    'Stewarding': '🍽️'
                                };
                                const departmentColors: Record<string, string> = {
                                    'Hot Kitchen': '#DC2626',
                                    'Cold Kitchen': '#0EA5E9',
                                    'Bakery': '#D97706',
                                    'Butchery': '#7C3AED',
                                    'Stewarding': '#059669'
                                };

                                // Count staff by department
                                const deptCounts: Record<string, number> = {};
                                (aiAnalysis.staff || []).forEach((s: any) => {
                                    const dept = s.department || 'Hot Kitchen';
                                    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
                                });

                                const departments = Object.entries(deptCounts);

                                return departments.length > 0 && (
                                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4 mb-4">
                                        <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
                                            🏢 Staff by Department
                                            <span className="text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
                                                {departments.length} departments
                                            </span>
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                            {departments.map(([dept, count], idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border-l-4"
                                                    style={{ borderLeftColor: departmentColors[dept] || '#6B7280' }}
                                                >
                                                    <span className="text-2xl">{departmentIcons[dept] || '👨‍🍳'}</span>
                                                    <div>
                                                        <div className="text-sm font-semibold text-slate-700">{dept}</div>
                                                        <div className="text-lg font-bold" style={{ color: departmentColors[dept] || '#6B7280' }}>{count}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}


                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
                                <h4 className="font-bold text-green-700 flex items-center gap-2 mb-3">
                                    ✓ WORKING TODAY
                                    <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                                        {aiAnalysis.todaySchedule?.length || 0}
                                    </span>
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {aiAnalysis.todaySchedule?.map((staff: any, idx: number) => {
                                        const shift = staff.schedule?.find((s: any) =>
                                            s.shiftType !== 'OFF' && s.shift !== 'OFF' && s.shift !== 'VACATION'
                                        )?.shift || '8AM-6PM';
                                        return (
                                            <div key={idx} className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border border-green-100">
                                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                    {staff.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-slate-800 truncate">{staff.name}</div>
                                                    <div className="text-xs text-slate-500">{staff.role || staff.position}</div>
                                                    {staff.rollNumber && (
                                                        <div className="text-xs text-slate-400">ID: {staff.rollNumber}</div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-semibold text-green-600">{shift}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {(!aiAnalysis.todaySchedule || aiAnalysis.todaySchedule.length === 0) && (
                                        <div className="col-span-3 text-center text-green-600 py-4">
                                            <i className="fas fa-info-circle mr-2"></i>
                                            No staff scheduled for today
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* OFF/Vacation Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* OFF Today */}
                                <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="font-bold text-red-700 flex items-center gap-2 mb-3">
                                        🔴 OFF TODAY
                                        <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                                            {aiAnalysis.staff?.filter((s: any) =>
                                                s.schedule?.some((sch: any) => {
                                                    const schedDate = (sch.date || '').toLowerCase();
                                                    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                                                    return schedDate.includes(today) && sch.shiftType === 'OFF';
                                                })
                                            ).length || 0}
                                        </span>
                                    </h4>
                                    <div className="space-y-2">
                                        {aiAnalysis.staff?.filter((s: any) =>
                                            s.schedule?.some((sch: any) => {
                                                const schedDate = (sch.date || '').toLowerCase();
                                                const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                                                return schedDate.includes(today) && sch.shiftType === 'OFF';
                                            })
                                        ).map((staff: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm">
                                                <span className="font-medium text-slate-700">• {staff.name}</span>
                                                <span className="text-slate-500 text-xs">({staff.role})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* On Vacation */}
                                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
                                    <h4 className="font-bold text-amber-700 flex items-center gap-2 mb-3">
                                        🌴 ON VACATION
                                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                                            {aiAnalysis.staff?.filter((s: any) =>
                                                s.schedule?.some((sch: any) => {
                                                    const schedDate = (sch.date || '').toLowerCase();
                                                    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                                                    return schedDate.includes(today) &&
                                                        (sch.shift === 'VACATION' || sch.shiftType === 'VACATION');
                                                })
                                            ).length || 0}
                                        </span>
                                    </h4>
                                    <div className="space-y-2">
                                        {aiAnalysis.staff?.filter((s: any) =>
                                            s.schedule?.some((sch: any) => {
                                                const schedDate = (sch.date || '').toLowerCase();
                                                const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                                                return schedDate.includes(today) &&
                                                    (sch.shift === 'VACATION' || sch.shiftType === 'VACATION');
                                            })
                                        ).map((staff: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm">
                                                <span className="font-medium text-slate-700">• {staff.name}</span>
                                                <span className="text-slate-500 text-xs">({staff.role})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Summary Footer */}
                            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                    <span className="text-slate-600">Working: <strong className="text-green-700">{aiAnalysis.todaySchedule?.length || 0}</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                                    <span className="text-slate-600">Off: <strong className="text-red-700">{
                                        aiAnalysis.staff?.filter((s: any) =>
                                            s.schedule?.some((sch: any) => sch.shiftType === 'OFF')
                                        ).length || 0
                                    }</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                                    <span className="text-slate-600">Leave: <strong className="text-amber-700">{
                                        aiAnalysis.staff?.filter((s: any) =>
                                            s.schedule?.some((sch: any) => sch.shift === 'VACATION' || sch.shiftType === 'VACATION')
                                        ).length || 0
                                    }</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 bg-slate-400 rounded-full"></span>
                                    <span className="text-slate-600">Total Staff: <strong>{aiAnalysis.staff?.length || 0}</strong></span>
                                </div>
                            </div>
                        </>
                    )}

                    {aiAnalysis?.error && (
                        <div className="text-center py-4 text-red-500">
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            SID analysis failed. Using local parsing.
                        </div>
                    )}

                    {aiAnalysis?.source === 'local' && !aiAnalysis?.error && (
                        <div className="text-center py-2 text-blue-500 text-sm">
                            <i className="fas fa-database mr-2"></i>
                            Using LOCAL parsing (OpenAI unavailable)
                        </div>
                    )}
                </div>
            )}

            {/* Original Excel View - Always show if data exists */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">📋 Original Excel View</h3>
                        <p className="text-sm text-slate-600">Exact mirror of your uploaded roster file</p>
                    </div>
                    {/* Reprocess Button - Show if we have raw data but 0 schedules (or forcing re-parse) */}
                    {rawExcelData && rawExcelData.length > 0 && schedules.length === 0 && (
                        <button
                            onClick={async () => {
                                if (rawExcelData) {
                                    const result = parseExcelData(rawExcelData);
                                    if (result.success) {
                                        setSchedules(result.schedules);
                                        setParseResult(result);

                                        // Update Supabase to persist this fix for Sid
                                        try {
                                            const { data: latestUpload } = await supabase
                                                .from('roster_uploads')
                                                .select('id')
                                                .order('created_at', { ascending: false })
                                                .limit(1)
                                                .single();

                                            if (latestUpload) {
                                                await supabase.from('roster_uploads').update({
                                                    ai_analysis: {
                                                        schedules: result.schedules,
                                                        rawData: rawExcelData
                                                    }
                                                }).eq('id', latestUpload.id);
                                                console.log("Reprocessed data saved to DB for Sid.");
                                            }
                                        } catch (err) {
                                            console.error("Failed to persist reprocess:", err);
                                        }

                                    } else {
                                        alert("Reprocessing failed. Please check the Excel format.");
                                    }
                                }
                            }}
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm"
                        >
                            <i className="fas fa-sync-alt mr-2"></i>
                            Reprocess & Save
                        </button>
                    )}
                </div>

                {rawExcelData && rawExcelData.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full min-w-[600px]">
                            <thead className="bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] text-white">
                                <tr>
                                    {rawExcelData[0]?.map((header: any, idx: number) => (
                                        <th key={idx} className="p-3 text-left font-semibold border-r border-orange-400 last:border-r-0">
                                            {header || `Column ${idx + 1}`}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {rawExcelData.slice(1).map((row: any[], rowIdx: number) => (
                                    <tr key={rowIdx} className="bg-white border-b border-gray-200 hover:bg-orange-50 transition-colors">
                                        {row.map((cell: any, cellIdx: number) => (
                                            <td key={cellIdx} className="p-3 text-slate-700 border-r border-slate-100 last:border-r-0">
                                                {cell !== null && cell !== undefined ? String(cell) : ''}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400 italic">
                        No raw data available. Upload a file to view content.
                    </div>
                )}
            </div>

            {schedules.length > 0 && !parseResult && (
                <>
                    {/* Filters & Search */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                <input
                                    type="text"
                                    placeholder="Search staff, role..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#ff7a00] focus:ring-1 focus:ring-[#ff7a00]"
                                />
                            </div>

                            {/* Department Filter */}
                            <select
                                value={filterDepartment}
                                onChange={(e) => setFilterDepartment(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#ff7a00] focus:ring-1 focus:ring-[#ff7a00] bg-white"
                            >
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>
                                        {dept === 'all' ? 'All Roles/Departments' : dept}
                                    </option>
                                ))}
                            </select>

                            {/* Date Filter */}
                            <input
                                type="text"
                                placeholder="Filter by Day (e.g. Monday)"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#ff7a00] focus:ring-1 focus:ring-[#ff7a00]"
                            />
                        </div>
                    </div>

                    {/* Parsed Schedule Data */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">📊 Parsed Schedule Data ({schedules.length} entries)</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="p-3 text-left text-slate-700">Employee</th>
                                        <th className="p-3 text-left text-slate-700">Day</th>
                                        <th className="p-3 text-left text-slate-700">Shift</th>
                                        <th className="p-3 text-left text-slate-700">Role</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSchedules.slice(0, 50).map(schedule => (
                                        <tr key={schedule.id} className="border-t border-slate-200 hover:bg-slate-50">
                                            <td className="p-3 text-slate-900">{schedule.employeeName}</td>
                                            <td className="p-3 text-slate-600">{schedule.date}</td>
                                            <td className="p-3">
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${schedule.shift.toLowerCase().includes('off')
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {schedule.shift}
                                                </span>
                                            </td>
                                            <td className="p-3 text-slate-600">{schedule.role}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Empty State */}
            {schedules.length === 0 && !parseResult && !uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <i className="fas fa-calendar-alt text-6xl text-slate-300 mb-4"></i>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Schedules Yet</h3>
                    <p className="text-slate-600">Click "Upload Roster" button to upload your Excel file</p>
                </div>
            )}
        </div>
    );
};


export default DutySchedule;
