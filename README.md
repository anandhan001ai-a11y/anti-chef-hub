# 🍽️ ChefAnand Hub - Kitchen Management SaaS Platform

> A professional, modern kitchen and restaurant management platform built with React, TypeScript, and Tailwind CSS.

![Version](https://img.shields.io/badge/version-1.0.0-orange)
![Status](https://img.shields.io/badge/status-active_development-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Design System](#design-system)
- [Getting Started](#getting-started)
- [Completed Features](#completed-features)
- [Planned Features](#planned-features)
- [Usage Guide](#usage-guide)
- [Development](#development)

---

## 🎯 Overview

**ChefAnand Hub** is a comprehensive SaaS application designed for kitchen and restaurant management. It provides tools for duty scheduling, staff management, absence tracking, analytics, and more - all in a beautiful, modern interface.

### Key Objectives

1. **Simplify kitchen operations** - Centralize all management tasks in one platform
2. **Automate repetitive tasks** - Excel upload, automatic absence detection
3. **Professional UX/UI** - Modern, responsive design with consistent theming
4. **No backend required** - Client-side processing for fast deployment

---

## ✨ Features

### 🎨 Landing Page
- Professional split-screen design
- Feature showcase with icons and descriptions
- Login/Signup authentication (Supabase)
- Time-based greetings
- Performance statistics display
- Fully responsive

### 📊 Analytics Dashboard
- **Top horizontal navigation** with 6 main sections
- **Time filter dropdown** (Today, This Week, Month, Quarter, Year)
- Real-time statistics cards
- Recent activity feed
- Quick action buttons
- Orange/slate themed interface

### 📅 Duty Schedule Management
- **One-click Excel upload** button
- **Client-side Excel parsing** (no backend needed)
- Automatic detection of:
  - Employee names
  - Roles/Positions
  - Daily shifts (Sunday-Saturday)
- **Dual view display**:
  - Original Excel mirror view
  - Parsed schedule calendar
- Color-coded shift status:
  - 🟢 Green = On Duty
  - 🔴 Red = Off Day
  - 🔵 Blue = Vacation
  - 🟡 Yellow = Sick Leave

### 🏖️ Off Duty Management *(NEW)*
- **Automatic absence detection** from uploaded schedules
- **Statistics dashboard**:
  - Total off duty today
  - Sick leave count
  - Annual leave count
  - Returning soon count
- **Filterable absence table**:
  - Search by staff name
  - Filter by leave type
  - View date ranges
  - Days remaining calculation
- **Document management**:
  - Upload medical certificates
  - Store leave request forms
  - Support for PDF, images (JPG, PNG)
  - Document preview

### 👥 Staff Management
- Staff directory (placeholder - ready for development)
- Department organization
- Status tracking

### 🍽️ Kitchen CRM
- Order management (placeholder - ready for development)
- Customer tracking

### 📤 Bulk Upload System
- Drag & drop file uploads
- Multi-format support (CSV, Excel, JSON, PDF)
- AI content analysis (ready for integration)
- Automatic categorization

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Vite** - Build tool and dev server
- **Lucide React** - Modern icon library

### Libraries
- **xlsx** - Excel file parsing (client-side)
- **Supabase** - Authentication and backend
- **React Router** - Navigation (implicit)

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **PostCSS** - CSS processing

---

## 📁 Project Structure

```
anti-chef-hub/
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx          # Split-screen login/signup page
│   │   ├── Dashboard.tsx            # Main dashboard container
│   │   ├── Sidebar.tsx              # Navigation sidebar
│   │   ├── TopNav.tsx               # Top navigation bar
│   │   ├── AnalyticsDashboard.tsx   # Analytics hub with tabs
│   │   ├── DutySchedule.tsx         # Duty roster management
│   │   ├── OffDuty.tsx              # Absence tracking (NEW)
│   │   ├── TasksPage.tsx            # Task management
│   │   ├── Calendar.tsx             # Calendar view
│   │   └── ...other components
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx          # Authentication context
│   │
│   ├── types/
│   │   └── analytics.types.ts       # TypeScript type definitions
│   │
│   ├── App.tsx                      # Main app component
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Global styles
│
├── public/                          # Static assets
├── index.html                       # HTML template
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── tailwind.config.js               # Tailwind config
└── vite.config.ts                   # Vite config
```

---

## 🎨 Design System

### Color Palette

#### Primary Colors
```css
/* Orange Gradient - Used for buttons, active states, headers */
--primary-from: #ff7a00;
--primary-to: #ff8f2d;
```

#### Neutral Palette (Slate)
```css
/* Backgrounds and UI elements */
--slate-50: #f8fafc;   /* Light backgrounds */
--slate-100: #f1f5f9;  /* Subtle backgrounds */
--slate-200: #e2e8f0;  /* Borders */
--slate-600: #475569;  /* Secondary text */
--slate-700: #334155;  /* Primary text */
--slate-900: #0f172a;  /* Headings */
```

#### Accent Colors
```css
/* Status indicators */
--success-green: #22c55e;  /* On duty, success states */
--danger-red: #ef4444;     /* Off duty, errors */
--info-blue: #3b82f6;      /* Annual leave, info */
--warning-yellow: #eab308; /* Sick leave, warnings */
```

### Typography

**Font Family**: System fonts for performance
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell';
```

**Font Sizes**:
- Headings: `text-2xl` (1.5rem) to `text-4xl` (2.25rem)
- Body: `text-base` (1rem)
- Small: `text-sm` (0.875rem)

### Component Patterns

#### Cards
- White background (`bg-white`)
- Slate border (`border-slate-200`)
- Rounded corners (`rounded-xl`)
- Subtle shadow (`shadow-sm`)
- Hover effect (`hover:shadow-md`)

#### Buttons - Primary
```css
bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d]
text-white
rounded-lg
font-semibold
hover:shadow-lg
transition-all
```

#### Buttons - Secondary
```css
bg-slate-200
text-slate-700
rounded-lg
hover:bg-slate-300
```

#### Status Badges
- Sick Leave: `bg-red-100 text-red-700`
- Annual Leave: `bg-blue-100 text-blue-700`
- Day Off: `bg-slate-100 text-slate-700`
- Other: `bg-yellow-100 text-yellow-700`

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16+ and npm
- Modern web browser
- **Supabase account** (for authentication)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/anandhan001ai-a11y/anti-chef-hub.git
cd anti-chef-hub
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Supabase**
   - Create a Supabase project
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Start development server**
```bash
npm run dev
```

5. **Open in browser**
```
http://localhost:5173
```

---

## ✅ Completed Features

### Phase 1: Landing Page & Authentication ✓
- [x] Split-screen landing page design
- [x] Login/Signup forms with validation
- [x] Supabase authentication integration
- [x] Time-based greetings
- [x] Responsive layout
- [x] Error handling for auth

### Phase 2: Dashboard Theme Unification ✓
- [x] Updated main dashboard colors (slate/orange)
- [x] Sidebar orange gradient branding
- [x] Active menu item highlighting
- [x] Hover states with orange theme
- [x] Status indicators updated
- [x] Consistent spacing and shadows

### Phase 3: Analytics Dashboard Redesign ✓
- [x] Top horizontal navigation tabs
- [x] Time filter dropdown
- [x] Statistics cards with gradients
- [x] Recent activity feed
- [x] Responsive grid layouts
- [x] Section-based routing

### Phase 4: Duty Schedule Upload Fix ✓
- [x] Removed backend dependency
- [x] Client-side Excel parsing (xlsx library)
- [x] Simplified upload button UI
- [x] Automatic column detection
- [x] Calendar preview with color-coding
- [x] Raw Excel mirror view
- [x] Progress indicators

### Phase 5: Off Duty Management ✓
- [x] Created OffDuty component
- [x] Added to Analytics Dashboard tabs
- [x] Statistics dashboard (4 cards)
- [x] Absence detection logic (ready for integration)
- [x] Filterable table view
- [x] Document upload functionality
- [x] Leave type categorization
- [x] Days remaining calculation

---

## 🔄 Planned Features

### Immediate Roadmap

#### 1. Off Duty Auto-Detection Integration
- [ ] Connect DutySchedule parser to OffDuty component
- [ ] Auto-create off-duty records when importing schedules
- [ ] Detect leave types from shift text (SICK, OFF, LEAVE, etc.)
- [ ] Store records in localStorage

#### 2. Staff Management Enhancement
- [ ] Staff directory with profiles
- [ ] Add/edit/delete staff members
- [ ] Department organization
- [ ] Contact information management
- [ ] Performance tracking

#### 3. Kitchen CRM Development
- [ ] Order management system
- [ ] Customer database
- [ ] Menu item tracking
- [ ] Sales analytics

#### 4. Advanced Features
- [ ] Calendar view for duty schedules
- [ ] Email notifications (when backend added)
- [ ] Export features (PDF, CSV downloads)
- [ ] Multi-user permissions
- [ ] Mobile app version

### Future Enhancements
- [ ] Inventory management
- [ ] Recipe database
- [ ] Food cost calculator
- [ ] Integration with POS systems
- [ ] Mobile apps (iOS/Android)
- [ ] Multi-language support
- [ ] Dark mode toggle

---

## 📖 Usage Guide

### 1. First-Time Setup

1. **Create an account**
   - Go to http://localhost:5173
   - Click "Sign up"
   - Enter name, email, password
   - Check email for confirmation (Supabase sends link)

2. **Sign in**
   - Enter email and password
   - Click "Sign In"

### 2. Uploading a Duty Schedule

1. Navigate to **Analytics Dashboard** → **Duty Schedule**
2. Click **"Upload Roster"** button
3. Select your Excel file (`.xlsx`, `.xls`, or `.csv`)
4. Wait for automatic parsing
5. Review the preview:
   - **Weekly Schedule Preview** - Calendar view
   - **Detected Columns** - Shows what was found
   - **Statistics** - Entry count, staff count
6. Click **"Import X Entries"** to save
7. View in:
   - **Original Excel View** - Exact mirror of your file
   - **Parsed Schedule Data** - Individual entries

### 3. Managing Off Duty Records

1. Navigate to **Analytics Dashboard** → **Off Duty**
2. View statistics:
   - Off duty today
   - Sick leave count
   - Annual leave count
   - Returning soon
3. Use filters:
   - Search by staff name
   - Filter by leave type
4. Upload documents:
   - Click upload icon on any record
   - Choose PDF or image file
   - Document is saved with the record

### 4. Excel File Format

Your duty roster Excel should have:

**Headers** (first row):
- `Name` or `Employee` - Staff member names
- `Role` or `Position` - Job title
- `Sunday`, `Monday`, `Tuesday`, etc. - Day columns

**Example:**
| Name | Role | Sunday | Monday | Tuesday | Wednesday |
|------|------|--------|--------|---------|-----------|
| John | Chef | 08:00-16:00 | OFF | 08:00-16:00 | SICK |
| Jane | Server | OFF | 10:00-18:00 | 10:00-18:00 | OFF |

**Shift Values:**
- Time (e.g., `08:00-16:00`, `9AM-5PM`) = On Duty
- `OFF` = Day off
- `SICK` = Sick leave
- `LEAVE`, `VACATION`, `ANNUAL` = Annual leave

---

## 👨‍💻 Development

### Running the Dev Server

```bash
npm run dev
```
Server starts at: `http://localhost:5173`

### Building for Production

```bash
npm run build
```
Output: `dist/` folder

### Preview Production Build

```bash
npm run preview
```

### Code Quality

**Linting:**
```bash
npm run lint
```

**Type Checking:**
```bash
npx tsc --noEmit
```

---

## 🎯 Current Status Summary

### What Works ✅
- Full authentication flow
- Landing page with modern design
- Dashboard with unified orange/slate theme
- Analytics Dashboard with tab navigation
- Duty Schedule Excel upload and parsing
- Original Excel mirror view
- Off Duty management UI
- Document upload system
- Responsive layouts

### In Progress 🔄
- Connecting DutySchedule to OffDuty (auto-detection)
- Staff Management full implementation
- Kitchen CRM full implementation

### Needs Backend (Future) 🔮
- Email notifications
- Multi-user data sharing
- Cloud file storage
- Real-time collaboration
- Advanced analytics

---

## 🤝 Contributing

This is a private project. If you need to make changes:

1. Create a feature branch
2. Make your changes following the design system
3. Test thoroughly
4. Ensure TypeScript has no errors
5. Maintain orange/slate color theme

---

## 📝 Notes for AI Assistants

### Design Principles
1. **Always use the orange/slate theme** - No purple, blue, or other gradient colors
2. **Maintain consistency** - Use existing component patterns
3. **Client-side first** - Prefer browser-based solutions over backend
4. **TypeScript strict** - All new code must be typed
5. **Responsive by default** - Test on mobile, tablet, desktop

### Common Tasks

**Adding a new tab to Analytics Dashboard:**
1. Create new component in `src/components/YourComponent.tsx`
2. Import in `AnalyticsDashboard.tsx`
3. Add to `tabs` array
4. Add to `NavigationSection` type in `analytics.types.ts`
5. Add render section with `{currentSection === 'your-tab' && <YourComponent />}`

**Adding a new color:**
- Check if slate palette colors work first
- If adding, document in design system section
- Ensure accessibility (WCAG AA contrast)

**File uploads:**
- Use `FileReader` API for client-side processing
- Store base64 in localStorage for simplicity
- Future: migrate to cloud storage

---

## 📄 License

MIT License - Free to use and modify

---

## 🙏 Acknowledgments

- **Supabase** - Authentication backend
- **Tailwind CSS** - Styling framework
- **Lucide** - Icon library
- **SheetJS (xlsx)** - Excel parsing

---

**Built with ❤️ for efficient kitchen management**
