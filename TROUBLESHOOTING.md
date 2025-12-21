# 🔍 TROUBLESHOOTING GUIDE

## The parser is not detecting your data correctly.

### Quick Diagnostic:

**1. Open Browser Console (F12)**
- Look for these messages after upload:
  - "ROW-PER-EMPLOYEE format detected" ✅
  - OR "ROW-PER-DAY format detected" ❌
  
**2. Check Backend Terminal**
- Look in the terminal running `npm start`
- Should show:
  ```
  📖 Reading workbook...
  📊 Parsing row-per-employee format...
  Headers: [...]
  Skipped X header rows
  Found NAME column: "STAFF NAME"
  ```

### If Still Not Working:

Your Excel file likely has:
- **Merged cells** in headers
- **Multiple header rows** (2-3 rows before data)
- **Empty columns** between data

### Solution:

**Option 1: Clean Your Excel File**
1. Remove merged cells
2. Keep only ONE header row
3. Make sure "STAFF NAME" is a single cell
4. Remove empty rows at top

**Option 2: Share Column Names**
Tell me exactly what the column headers are in your Excel file (row 1, row 2, etc.)

### What I Need:

Paste here what the browser console shows when you upload!
