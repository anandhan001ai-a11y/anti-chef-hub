# Analytics Dashboard Backend API

This is the backend server for the Analytics Dashboard with Excel roster parsing capabilities.

## Features

- 📊 **Excel File Parsing** - Automatically parse .xlsx, .xls, and .csv files
- 🤖 **Smart Column Detection** - Intelligently detects employee names, dates, shifts, roles, and departments
- 📁 **File Upload** - Handle file uploads with multer
- 🔍 **Data Filtering** - Filter schedules by date, employee, department
- 📈 **Analytics** - Get statistics about schedules and staff

## Installation

```bash
cd server
npm install
```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will run on `http://localhost:3001`

## API Endpoints

### Health Check
- **GET** `/api/health` - Check if server is running

### Roster Upload
- **POST** `/api/roster/upload` - Upload and parse Excel roster file
  - Body: FormData with 'file' field
  - Returns: Parsed schedules and metadata

### Schedules
- **GET** `/api/schedules` - Get all schedules
  - Query params: `date`, `employee`, `department`
- **POST** `/api/schedules` - Create new schedule entry
- **PUT** `/api/schedules/:id` - Update schedule
- **DELETE** `/api/schedules/:id` - Delete schedule

### Staff
- **GET** `/api/staff` - Get all staff members

### Analytics
- **GET** `/api/analytics/stats` - Get statistics

## Excel File Format

The backend automatically detects columns. Your Excel file can have columns like:

- **Name/Employee/Staff** - Employee names
- **Date/Day/Schedule_Date** - Shift dates
- **Shift/Time/Hours** - Shift times
- **Role/Position** - Job roles
- **Department/Dept** - Departments

Example:
```
| Name        | Date       | Shift      | Role      | Department |
|-------------|------------|------------|-----------|------------|
| John Doe    | 2025-12-15 | Morning    | Chef      | Kitchen    |
| Jane Smith  | 2025-12-15 | Evening    | Server    | Service    |
```

## Technologies Used

- **Express.js** - Web framework
- **multer** - File upload handling
- **xlsx** - Excel file parsing
- **cors** - Cross-origin resource sharing
- **body-parser** - Request body parsing

## Notes

- Files are stored in the `uploads/` directory
- Data is currently stored in memory (replace with database in production)
- Supports .xlsx, .xls, and .csv files

## License

ISC
