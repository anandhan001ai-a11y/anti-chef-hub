# 🚀 Analytics Dashboard with Duty Schedule - Setup Guide

## What's New? ✨

You now have a complete **Analytics Dashboard** with an advanced **Duty Schedule Management** system that supports:

1. **📁 Drag & Drop Excel Upload** - Simply drag your roster Excel file
2. **🤖 AI-Powered Parsing** - Automatically detects and extracts schedule data
3. **📊 Real-time Preview** - See parsed data before importing
4. **🔍 Smart Filtering** - Filter by department, date, employee name
5. **💾 Backend API** - Full REST API for schedule management

## Architecture

```
📦 Project Structure
├── server/                    # Backend API Server
│   ├── server.js             # Express server with Excel parsing
│   ├── package.json          # Backend dependencies
│   └── uploads/              # Uploaded files storage
│
├── src/
│   └── components/
│       ├── DutySchedule.tsx  # Main duty schedule component
│       ├── duty-schedule.css # Premium styling
│       └── AnalyticsDashboard.tsx  # Main dashboard
```

## Quick Start 🏃‍♂️

### Step 1: Start the Backend Server

Open a **NEW terminal** and run:

```powershell
cd server
npm start
```

The server will start on `http://localhost:3001`

### Step 2: Keep Frontend Running

Your frontend is already running on `http://localhost:5173`
(Keep the existing `npm run dev` terminal running)

## How to Use 📖

### 1. Navigate to Duty Schedule
- Open `http://localhost:5173` in your browser
- Click on **"Duty Schedule"** in the sidebar

### 2. Upload Your Roster
- Drag and drop your Excel file (`.xlsx`, `.xls`, or `.csv`)
- OR click to browse and select a file

### 3. Review Parsed Data
- The system will automatically:
  - Upload the file to the backend
  - Parse and extract schedule data
  - Detect column names (Name, Date, Shift, Role, Department)
  - Show you a preview of detected data

### 4. Confirm Import
- Review the preview table
- Click **"Import X Entries"** to add to your schedule
- Use filters to view specific schedules

## Excel File Format 📋

Your Excel file should have columns like:

| Name/Employee | Date | Shift | Role/Position | Department |
|---------------|------|-------|---------------|------------|
| John Doe | 2025-12-15 | Morning | Chef | Kitchen |
| Jane Smith | 2025-12-15 | Evening | Server | Service |

The system is smart and can detect various column names:
- **Name columns**: "Name", "Employee", "Staff", "Worker"
- **Date columns**: "Date", "Day", "Schedule Date"
- **Shift columns**: "Shift", "Time", "Hours", "Duty"
- **Role columns**: "Role", "Position", "Job"

## API Endpoints 🔗

### Upload Roster
```bash
POST http://localhost:3001/api/roster/upload
Content-Type: multipart/form-data
Body: FormData with 'file' field
```

### Get Schedules
```bash
GET http://localhost:3001/api/schedules
Query params: ?date=2025-12-15&department=Kitchen
```

### Get Statistics
```bash
GET http://localhost:3001/api/analytics/stats
```

## Features Breakdown ⚡

### Frontend (React + TypeScript)
- ✅ Drag-and-drop file upload
- ✅ Real-time upload progress
- ✅ Automatic file parsing
- ✅ Data preview before import
- ✅ Advanced filtering system
- ✅ Responsive design with glassmorphism
- ✅ Beautiful gradients and animations

### Backend (Node.js + Express)
- ✅ Multi-file format support (.xlsx, .xls, .csv)
- ✅ Smart column detection
- ✅ RESTful API
- ✅ File upload handling
- ✅ Data validation
- ✅ In-memory storage (can be replaced with database)

## Customization 🎨

### Change Colors
Edit `src/components/duty-schedule.css`:
```css
/* Main gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Change to your preferred gradient */
background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
```

### Add Database
Replace in-memory storage in `server/server.js`:
```javascript
// Replace
let schedules = [];
let staffMembers = [];

// With your database calls
const schedules = await db.schedules.findAll();
```

## Troubleshooting 🔧

### Backend not responding?
1. Make sure the server is running: `cd server && npm start`
2. Check the server is on port 3001: `http://localhost:3001/api/health`

### File upload fails?
1. Check file format (.xlsx, .xls, .csv only)
2. Verify backend server is running
3. Check browser console for errors

### Data not showing?
1. Ensure your Excel has proper column headers
2. Check that data rows are not empty
3. Review the backend console for parsing errors

## Next Steps 🎯

Want to enhance the system? Here are some ideas:

1. **Add Authentication** - Secure your API endpoints
2. **Database Integration** - Connect to PostgreSQL/MongoDB
3. **Email Notifications** - Send schedule updates to staff
4. **Calendar View** - Visual calendar for schedules
5. **Export Feature** - Download schedules as PDF/Excel
6. **Mobile App** - React Native mobile version

## Technologies Used 💻

**Frontend:**
- React 18
- TypeScript
- CSS3 with Glassmorphism
- Font Awesome Icons

**Backend:**
- Node.js
- Express.js
- Multer (file uploads)
- xlsx (Excel parsing)
- CORS

## Support & Documentation 📚

- Backend API: See `server/README.md`
- Component Docs: Check inline comments in `DutySchedule.tsx`

---

**Happy Scheduling! 🎉**

If you encounter any issues, check the browser console and backend terminal for detailed error messages.
