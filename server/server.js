import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Configuration for Production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.xlsx', '.xls', '.csv'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel and CSV files are allowed!'));
        }
    }
});

// In-memory database (replace with actual database in production)
let schedules = [];
let staffMembers = [];

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Parse Excel/CSV file and extract roster data
const parseRosterFile = (filePath) => {
    try {
        console.log('📖 Reading workbook...');
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        console.log('✅ Workbook read, sheet:', sheetName);

        // Convert to JSON
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
        console.log('📊 Total rows in Excel:', jsonData.length);

        if (jsonData.length === 0) {
            return {
                success: false,
                error: 'Excel file is empty or has no data rows',
                schedules: [],
                staff: [],
                metadata: { totalRecords: 0, uniqueStaff: 0, headers: [], detectedColumns: {} }
            };
        }

        // Get headers
        const headers = Object.keys(jsonData[0] || {});
        console.log('📋 Headers found:', headers);

        // Detect format type
        const dayHeaders = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'genday'];
        const hasDayColumns = headers.some(h => dayHeaders.some(d => h.toLowerCase().includes(d)));

        if (hasDayColumns) {
            console.log('🔄 Detected ROW-PER-EMPLOYEE format (days as columns)');
            return parseRowPerEmployeeFormat(jsonData, headers);
        } else {
            console.log('🔄 Detected ROW-PER-DAY format (traditional)');
            return parseRowPerDayFormat(jsonData, headers);
        }
    } catch (error) {
        console.error('❌ Error parsing roster file:', error);
        return {
            success: false,
            error: error.message,
            schedules: [],
            staff: [],
            metadata: { totalRecords: 0, uniqueStaff: 0, headers: [], detectedColumns: {} }
        };
    }
};

// Parse ROW-PER-EMPLOYEE format (days as columns)
const parseRowPerEmployeeFormat = (jsonData, headers) => {
    console.log('📊 Parsing row-per-employee format...');
    console.log('Total rows:', jsonData.length);
    console.log('Headers:', headers);
    console.log('First 5 rows:', jsonData.slice(0, 5));

    // Find where actual data starts (skip header rows)
    let dataStartIndex = 0;
    const headerKeywords = ['name', 'employee', 'staff', 'position', 'job', 'title', 'shift', 'monday', 'tuesday', 'wednesday'];

    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i];
        const rowValues = Object.values(row).map(v => v.toString().toLowerCase());

        // Check if this row contains header keywords
        const isHeaderRow = rowValues.some(val =>
            headerKeywords.some(keyword => val === keyword || val.includes(keyword))
        ) || rowValues.every(val => !val || val.trim() === '');

        if (isHeaderRow) {
            console.log(`Row ${i} is a header row:`, row);
            dataStartIndex = i + 1;
        } else {
            // Found first data row
            console.log(`Data starts at row ${dataStartIndex}`);
            break;
        }
    }

    // Get actual data rows
    const dataRows = jsonData.slice(dataStartIndex);
    console.log(`Skipped ${dataStartIndex} header rows, ${dataRows.length} data rows remaining`);

    // Find name and position columns - look for "STAFF NAME" or similar
    const namePatterns = ['staff name', 'staffname', 'employee name', 'employeename', 'name', 'employee', 'staff'];
    const positionPatterns = ['position', 'role', 'title', 'job title', 'jobtitle', 'job', 'designation'];

    let nameCol = null;
    let positionCol = null;

    // Try to find exact matches first
    for (const header of headers) {
        const headerLower = header.toLowerCase().trim();

        if (!nameCol) {
            for (const pattern of namePatterns) {
                if (headerLower === pattern || headerLower.includes('staff') && headerLower.includes('name')) {
                    nameCol = header;
                    console.log(`Found NAME column: "${header}"`);
                    break;
                }
            }
        }

        if (!positionCol) {
            for (const pattern of positionPatterns) {
                if (headerLower === pattern || headerLower.includes(pattern)) {
                    positionCol = header;
                    console.log(`Found POSITION column: "${header}"`);
                    break;
                }
            }
        }
    }

    // If still not found, try fuzzy matching
    if (!nameCol) {
        nameCol = headers.find(h => {
            const hLower = h.toLowerCase();
            return namePatterns.some(p => hLower.includes(p));
        });
    }

    if (!positionCol) {
        positionCol = headers.find(h => {
            const hLower = h.toLowerCase();
            return positionPatterns.some(p => hLower.includes(p));
        });
    }

    console.log('Final Name column:', nameCol);
    console.log('Final Position column:', positionCol);

    // Map day columns - look for actual date values or day names
    const dayMapping = {
        'genday': 'Sunday',
        'sunday': 'Sunday', 'sun': 'Sunday',
        'monday': 'Monday', 'mon': 'Monday',
        'tuesday': 'Tuesday', 'tue': 'Tuesday',
        'wednesday': 'Wednesday', 'wed': 'Wednesday',
        'thursday': 'Thursday', 'thu': 'Thursday',
        'friday': 'Friday', 'fri': 'Friday',
        'saturday': 'Saturday', 'sat': 'Saturday'
    };

    const dayColumns = {};

    // First try to find day name columns
    headers.forEach(header => {
        const headerLower = header.toLowerCase().trim();
        for (const [pattern, dayName] of Object.entries(dayMapping)) {
            if (headerLower.includes(pattern)) {
                dayColumns[header] = dayName;
                console.log(`Mapped column "${header}" → ${dayName}`);
                return;
            }
        }
    });

    // If no day columns found, look for numeric columns (1-31) or dates
    if (Object.keys(dayColumns).length === 0) {
        console.log('No day name columns found, looking for numeric/date columns...');

        // Use current month/year to map day numbers
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const dayOfWeekMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        headers.forEach(header => {
            const headerStr = header.toString().trim();

            // Check if it's a number (day of month: 1-31)
            const dayNum = parseInt(headerStr);
            if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
                try {
                    const date = new Date(year, month, dayNum);
                    if (!isNaN(date.getTime())) {
                        const dayName = dayOfWeekMap[date.getDay()];
                        dayColumns[header] = dayName;
                        console.log(`Mapped day number "${header}" → ${dayName} (${month + 1}/${dayNum}/${year})`);
                    }
                } catch (e) {
                    console.warn(`Could not parse day number ${headerStr}`);
                }
            }
            // Check if it looks like a date string (14-DEC, 12/15, etc.)
            else if (/\d+[-\/]\w+/.test(headerStr) || /\d{1,2}[-\/]\d{1,2}/.test(headerStr)) {
                try {
                    const date = new Date(headerStr);
                    if (!isNaN(date.getTime())) {
                        const dayName = dayOfWeekMap[date.getDay()];
                        dayColumns[header] = dayName;
                        console.log(`Mapped date column "${header}" → ${dayName}`);
                    }
                } catch (e) {
                    console.warn(`Could not parse date ${headerStr}`);
                }
            }
        });
    }

    console.log('Day columns mapped:', dayColumns);
    console.log('Total day columns:', Object.keys(dayColumns).length);

    // Parse employee rows
    const parsedSchedules = [];
    const uniqueStaff = [];

    dataRows.forEach((row, index) => {
        const employeeName = (row[nameCol] || '').toString().trim();
        const position = (row[positionCol] || '').toString().trim();

        console.log(`Row ${index}: Name="${employeeName}", Position="${position}"`);

        // Skip if no valid name
        if (!employeeName ||
            employeeName === '' ||
            employeeName.length < 2 ||
            headerKeywords.some(kw => employeeName.toLowerCase() === kw)) {
            console.warn(`Skipping row ${index}: invalid name "${employeeName}"`);
            return;
        }

        // Add to staff list
        uniqueStaff.push({
            id: `staff-${Date.now()}-${index}`,
            name: employeeName,
            role: position || 'Staff',
            department: 'General'
        });

        // Create schedule entries for each day
        let hasAnyShift = false;
        Object.entries(dayColumns).forEach(([colName, dayName]) => {
            const shiftValue = (row[colName] || '').toString().trim();

            if (shiftValue && shiftValue !== '') {
                hasAnyShift = true;
                const scheduleEntry = {
                    id: `schedule-${Date.now()}-${index}-${dayName}`,
                    employeeName: employeeName,
                    date: dayName,
                    shift: shiftValue,
                    role: position || 'Staff',
                    department: 'General',
                    status: shiftValue.toLowerCase().includes('off') ? 'off' : 'scheduled',
                    dayOfWeek: dayName
                };

                parsedSchedules.push(scheduleEntry);
                console.log(`  ${dayName}: ${shiftValue}`);
            }
        });

        if (!hasAnyShift) {
            console.warn(`Employee ${employeeName} has no shifts`);
        }
    });

    console.log(`✅ Parsed ${parsedSchedules.length} schedule entries for ${uniqueStaff.length} employees`);

    return {
        success: true,
        schedules: parsedSchedules,
        staff: uniqueStaff,
        metadata: {
            totalRecords: parsedSchedules.length,
            uniqueStaff: uniqueStaff.length,
            headers: headers,
            detectedColumns: {
                name: nameCol,
                position: positionCol,
                dayColumns: dayColumns
            },
            sampleRow: dataRows[0],
            totalRowsInFile: dataRows.length,
            skippedHeaderRows: dataStartIndex,
            format: 'row-per-employee'
        }
    };
};

// Parse ROW-PER-DAY format (traditional - one row per schedule entry)
const parseRowPerDayFormat = (jsonData, headers) => {
    // ... existing parser logic ...
    // Keep the existing parser for traditional format
    console.log('Using traditional row-per-day parser...');

    const namePatterns = ['name', 'employee', 'staff', 'worker', 'personnel', 'emp', 'person'];
    const datePatterns = ['date', 'day', 'shift_date', 'schedule_date', 'work_date', 'datum'];
    const shiftPatterns = ['shift', 'time', 'hours', 'duty', 'timing', 'period', 'turn'];
    const rolePatterns = ['role', 'position', 'job', 'title', 'designation'];
    const departmentPatterns = ['department', 'dept', 'division', 'team', 'section'];

    const findColumn = (patterns, fallbackHeaders = []) => {
        let found = headers.find(h =>
            patterns.some(p => h.toLowerCase().includes(p))
        );

        if (!found && fallbackHeaders.length > 0) {
            found = headers.find(h => fallbackHeaders.includes(h));
        }

        return found;
    };

    const nameCol = findColumn(namePatterns);
    const dateCol = findColumn(datePatterns);
    const shiftCol = findColumn(shiftPatterns);
    const roleCol = findColumn(rolePatterns);
    const deptCol = findColumn(departmentPatterns);

    console.log('🔍 Detected columns:');
    console.log('  Name column:', nameCol || 'NOT FOUND');
    console.log('  Date column:', dateCol || 'NOT FOUND');
    console.log('  Shift column:', shiftCol || 'NOT FOUND');
    console.log('  Role column:', roleCol || 'NOT FOUND');
    console.log('  Department column:', deptCol || 'NOT FOUND');

    // If no name column found, try first column as name
    const actualNameCol = nameCol || headers[0];
    console.log('📝 Using column for names:', actualNameCol);

    // Show first row sample
    console.log('📄 First row sample:', JSON.stringify(jsonData[0], null, 2));

    const parsedSchedules = jsonData.map((row, index) => {
        let employeeName = row[actualNameCol] || row[nameCol] || row.Name || row.Employee || '';

        if (!employeeName && headers.length > 0) {
            employeeName = row[headers[0]] || '';
        }

        const scheduleEntry = {
            id: `schedule-${Date.now()}-${index}`,
            employeeName: employeeName.toString().trim(),
            date: (row[dateCol] || row.Date || row.Day || '').toString(),
            shift: (row[shiftCol] || row.Shift || row.Time || '').toString(),
            role: (row[roleCol] || row.Position || row.Role || '').toString(),
            department: (row[deptCol] || row.Department || row.Dept || '').toString(),
            status: 'scheduled',
            rawData: row
        };

        return scheduleEntry;
    }).filter(entry => {
        const hasName = entry.employeeName && entry.employeeName !== '' && entry.employeeName !== 'Unknown';
        if (!hasName) {
            console.log('⚠️ Skipping row with no name:', entry.rawData);
        }
        return hasName;
    });

    console.log('✅ Parsed schedules:', parsedSchedules.length);

    const uniqueStaff = [...new Set(parsedSchedules.map(s => s.employeeName))].map(name => {
        const staffSchedules = parsedSchedules.filter(s => s.employeeName === name);
        const roles = [...new Set(staffSchedules.map(s => s.role).filter(r => r))];
        const departments = [...new Set(staffSchedules.map(s => s.department).filter(d => d))];

        return {
            id: `staff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: name,
            role: roles[0] || 'Staff',
            department: departments[0] || 'General',
            scheduleCount: staffSchedules.length
        };
    });

    const result = {
        success: true,
        schedules: parsedSchedules,
        staff: uniqueStaff,
        metadata: {
            totalRecords: parsedSchedules.length,
            uniqueStaff: uniqueStaff.length,
            headers: headers,
            detectedColumns: {
                name: actualNameCol,
                date: dateCol,
                shift: shiftCol,
                role: roleCol,
                department: deptCol
            },
            sampleRow: jsonData[0],
            totalRowsInFile: jsonData.length,
            format: 'row-per-day'
        }
    };

    if (parsedSchedules.length === 0) {
        result.warning = 'No employee names found in the file. Please ensure the file has a column with employee names.';
        console.warn('⚠️ WARNING: No schedules parsed!');
        console.warn('⚠️ First row data:', jsonData[0]);
        console.warn('⚠️ Headers:', headers);
    }

    return result;
};

// Upload and parse roster Excel file
app.post('/api/roster/upload', upload.single('file'), (req, res) => {
    try {
        console.log('\n========== NEW UPLOAD REQUEST ==========');
        console.log('📁 File received:', req.file?.originalname);

        if (!req.file) {
            console.error('❌ No file in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        console.log('📂 File path:', filePath);
        console.log('🔍 Parsing file...');

        const parseResult = parseRosterFile(filePath);

        console.log('📊 Parse result success:', parseResult.success);
        console.log('📋 Schedules found:', parseResult.schedules?.length || 0);
        console.log('👥 Staff found:', parseResult.staff?.length || 0);
        console.log('🔢 Metadata:', JSON.stringify(parseResult.metadata, null, 2));

        if (parseResult.success) {
            // Store in memory database
            schedules = [...schedules, ...parseResult.schedules];

            // Update staff members
            parseResult.staff.forEach(newStaff => {
                const existingStaff = staffMembers.find(s => s.name === newStaff.name);
                if (!existingStaff) {
                    staffMembers.push(newStaff);
                }
            });

            const responseData = {
                success: true,
                message: 'File parsed successfully',
                data: {
                    filename: req.file.originalname,
                    uploadedAt: new Date().toISOString(),
                    ...parseResult
                }
            };

            console.log('✅ Sending response...');
            console.log('Response data keys:', Object.keys(responseData.data));
            console.log('Schedules in response:', responseData.data.schedules?.length);
            console.log('========================================\n');

            res.json(responseData);
        } else {
            console.error('❌ Parse failed:', parseResult.error);
            console.log('========================================\n');

            res.status(400).json({
                success: false,
                error: parseResult.error
            });
        }

        // Clean up uploaded file (optional)
        // fs.unlinkSync(filePath);

    } catch (error) {
        console.error('❌ Upload error:', error);
        console.log('========================================\n');

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Upload menu file (keeps only latest file)
app.post('/api/menu/upload', upload.single('file'), (req, res) => {
    try {
        console.log('\n========== MENU UPLOAD REQUEST ==========');
        console.log('📁 File received:', req.file?.originalname);

        if (!req.file) {
            console.error('❌ No file in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const menuUploadsDir = path.join(__dirname, 'uploads', 'menu');
        if (!fs.existsSync(menuUploadsDir)) {
            fs.mkdirSync(menuUploadsDir, { recursive: true });
        }

        // Delete all existing menu files
        const existingFiles = fs.readdirSync(menuUploadsDir);
        for (const file of existingFiles) {
            const filePath = path.join(menuUploadsDir, file);
            fs.unlinkSync(filePath);
            console.log('🗑️  Deleted old menu file:', file);
        }

        // Move the new file to menu directory
        const newFilePath = path.join(menuUploadsDir, req.file.originalname);
        fs.copyFileSync(req.file.path, newFilePath);
        fs.unlinkSync(req.file.path);

        console.log('✅ Menu file saved:', newFilePath);
        console.log('========================================\n');

        res.json({
            success: true,
            message: 'Menu file uploaded successfully',
            filename: req.file.originalname,
            uploadedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Menu upload error:', error);
        console.log('========================================\n');

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get all schedules
app.get('/api/schedules', (req, res) => {
    try {
        const { date, employee, department } = req.query;

        let filteredSchedules = [...schedules];

        if (date) {
            filteredSchedules = filteredSchedules.filter(s =>
                s.date.includes(date)
            );
        }

        if (employee) {
            filteredSchedules = filteredSchedules.filter(s =>
                s.employeeName.toLowerCase().includes(employee.toLowerCase())
            );
        }

        if (department) {
            filteredSchedules = filteredSchedules.filter(s =>
                s.department.toLowerCase() === department.toLowerCase()
            );
        }

        res.json({
            success: true,
            count: filteredSchedules.length,
            schedules: filteredSchedules
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get all staff members
app.get('/api/staff', (req, res) => {
    try {
        res.json({
            success: true,
            count: staffMembers.length,
            staff: staffMembers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create new schedule entry
app.post('/api/schedules', (req, res) => {
    try {
        const newSchedule = {
            id: `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...req.body,
            status: req.body.status || 'scheduled',
            createdAt: new Date().toISOString()
        };

        schedules.push(newSchedule);

        res.json({
            success: true,
            schedule: newSchedule
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update schedule
app.put('/api/schedules/:id', (req, res) => {
    try {
        const { id } = req.params;
        const index = schedules.findIndex(s => s.id === id);

        if (index === -1) {
            return res.status(404).json({
                success: false,
                error: 'Schedule not found'
            });
        }

        schedules[index] = {
            ...schedules[index],
            ...req.body,
            updatedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            schedule: schedules[index]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete schedule
app.delete('/api/schedules/:id', (req, res) => {
    try {
        const { id } = req.params;
        const index = schedules.findIndex(s => s.id === id);

        if (index === -1) {
            return res.status(404).json({
                success: false,
                error: 'Schedule not found'
            });
        }

        schedules.splice(index, 1);

        res.json({
            success: true,
            message: 'Schedule deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get analytics/statistics
app.get('/api/analytics/stats', (req, res) => {
    try {
        const totalSchedules = schedules.length;
        const uniqueStaff = staffMembers.length;
        const departments = [...new Set(schedules.map(s => s.department).filter(d => d))];
        const shifts = [...new Set(schedules.map(s => s.shift).filter(s => s))];

        res.json({
            success: true,
            stats: {
                totalSchedules,
                uniqueStaff,
                totalDepartments: departments.length,
                totalShifts: shifts.length,
                departments,
                shifts
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
    console.log(`📁 Uploads directory: ${uploadsDir}`);
});
