/**
 * SID AI Service - Employee Data Extraction & Roster Management
 * For TAMIMI GLOBAL CO. LTD. (TAFGA) - NEOM Location #198
 * 
 * Capabilities:
 * - Employee Master Data extraction
 * - Schedule Information lookup
 * - Date-Based Queries
 * - Department summaries
 * 
 * NOTE: Uses LOCAL PROCESSING - No API calls = No cost for queries!
 */

export interface RosterContext {
    schedules?: any[];
    rawData?: any[][];
    staff?: any[];
    todaySchedule?: any[];
    rosterType?: string;
    today?: string;
}

export interface Employee {
    name: string;
    employeeId: string;
    position: string;
    department: string;
    category?: string; // Role category from the 21 categories
    shift?: string;
    status?: string;
    schedule?: { date: string; shift: string; shiftType: string }[];
}

// 21 Role Categories that SID uses to auto-sort staff
export const ROLE_CATEGORIES = [
    { id: 1, name: 'Executive Chef', icon: '👨‍🍳', color: '#8B0000', level: 'Executive' },
    { id: 2, name: 'Executive Sous Chef', icon: '👨‍🍳', color: '#A52A2A', level: 'Executive' },
    { id: 3, name: 'Sous Chef', icon: '👨‍🍳', color: '#CD5C5C', level: 'Management' },
    { id: 4, name: 'Chef De Partie (CDP)', icon: '👨‍🍳', color: '#F08080', level: 'Senior' },
    { id: 5, name: 'Demi Chef De Partie', icon: '👨‍🍳', color: '#FA8072', level: 'Senior' },
    { id: 6, name: 'Commi 1', icon: '🍳', color: '#4169E1', level: 'Mid' },
    { id: 7, name: 'Commi 2', icon: '🍳', color: '#6495ED', level: 'Mid' },
    { id: 8, name: 'Commi 3', icon: '🍳', color: '#87CEEB', level: 'Junior' },
    { id: 9, name: 'Kitchen Coordinator', icon: '📋', color: '#32CD32', level: 'Support' },
    { id: 10, name: 'Kitchen Helper', icon: '🧹', color: '#90EE90', level: 'Support' },
    { id: 11, name: 'Steward', icon: '🍽️', color: '#3CB371', level: 'Support' },
    { id: 12, name: 'Head Steward', icon: '🍽️', color: '#2E8B57', level: 'Senior' },
    { id: 13, name: 'Senior Steward', icon: '🍽️', color: '#228B22', level: 'Senior' },
    { id: 14, name: 'Trainee', icon: '📚', color: '#FFA500', level: 'Entry' },
    { id: 15, name: 'Apprentice', icon: '📚', color: '#FFB347', level: 'Entry' },
    { id: 16, name: 'Baker', icon: '🥖', color: '#DEB887', level: 'Mid' },
    { id: 17, name: 'Pastry Chef', icon: '🎂', color: '#D2691E', level: 'Senior' },
    { id: 18, name: 'Head Baker', icon: '🥖', color: '#8B4513', level: 'Management' },
    { id: 19, name: 'Butcher', icon: '🥩', color: '#DC143C', level: 'Mid' },
    { id: 20, name: 'Cold Kitchen Staff', icon: '🥗', color: '#00CED1', level: 'Mid' },
    { id: 21, name: 'Hot Kitchen Staff', icon: '🔥', color: '#FF6347', level: 'Mid' }
] as const;

export type RoleCategoryName = typeof ROLE_CATEGORIES[number]['name'];

export class SidService {

    // localStorage key for persisting roster data
    private static readonly STORAGE_KEY = 'sidRosterAnalysis';

    // ========================================
    // CONVERSATION MEMORY SYSTEM
    // ========================================
    // private static readonly MEMORY_KEY = 'sidConversationHistory'; // Reserved for future use
    private static readonly MAX_HISTORY = 10; // Keep last 10 exchanges

    // Conversation context
    private static conversationHistory: { role: 'user' | 'assistant'; content: string; timestamp: number; context?: any }[] = [];
    private static lastContext: {
        department?: string;
        dateLabel?: string;
        queryType?: string;
        lastResults?: any[];
        lastQuery?: string;
    } = {};

    /**
     * Add a message to conversation history
     */
    static addToHistory(role: 'user' | 'assistant', content: string, context?: any): void {
        this.conversationHistory.push({
            role,
            content,
            timestamp: Date.now(),
            context
        });
        // Keep only last MAX_HISTORY exchanges
        if (this.conversationHistory.length > this.MAX_HISTORY * 2) {
            this.conversationHistory = this.conversationHistory.slice(-this.MAX_HISTORY * 2);
        }
        console.log(`💭 SID Memory: Added ${role} message, history length: ${this.conversationHistory.length}`);
    }

    /**
     * Get conversation history for context
     */
    static getHistory(): typeof SidService.conversationHistory {
        return this.conversationHistory;
    }

    /**
     * Clear conversation history
     */
    static clearHistory(): void {
        this.conversationHistory = [];
        this.lastContext = {};
        console.log("🧹 SID: Conversation history cleared");
    }

    /**
     * Set the last query context for follow-up questions
     */
    static setLastContext(context: typeof SidService.lastContext): void {
        this.lastContext = { ...this.lastContext, ...context };
        console.log("📌 SID Context set:", this.lastContext);
    }

    /**
     * Get last context
     */
    static getLastContext(): typeof SidService.lastContext {
        return this.lastContext;
    }

    /**
     * Check if query is a follow-up question
     */
    static isFollowUpQuestion(query: string): boolean {
        const followUpPatterns = [
            /^(what about|how about|and|also|else|more|other|another)/i,
            /^(who else|anyone else|somebody else)/i,
            /^(show me more|tell me more|give me more)/i,
            /^(yes|yeah|yep|ok|okay|sure|please)/i,
            /^(no|nope|not that)/i,
            /^(same|similar|like that)/i,
            /^(in|for) (bakery|hot kitchen|cold kitchen|stewarding|butchery|pastry)/i,
            /^(tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
            /\?$/ // Single word questions like "bakery?" "tomorrow?"
        ];

        const q = query.toLowerCase().trim();

        // Short queries are likely follow-ups
        if (q.split(' ').length <= 3) {
            return true;
        }

        return followUpPatterns.some(pattern => pattern.test(q));
    }

    /**
     * Expand follow-up query using context
     */
    static expandFollowUpQuery(query: string): string {
        const q = query.toLowerCase().trim();
        const ctx = this.lastContext;

        // If no context, return original
        if (!ctx.lastQuery && !ctx.queryType) {
            return query;
        }

        console.log("🔄 SID: Expanding follow-up query with context:", ctx);

        // Handle department switches: "what about bakery?" -> "who is working in bakery"
        const deptMatch = q.match(/(?:what about|how about|in|for)\s*(bakery|hot kitchen|cold kitchen|stewarding|butchery|pastry)/i);
        if (deptMatch) {
            const dept = deptMatch[1];
            if (ctx.queryType === 'working') {
                return `who is working in ${dept}`;
            } else if (ctx.queryType === 'off') {
                return `who is off in ${dept}`;
            } else if (ctx.queryType === 'leave') {
                return `who is on leave in ${dept}`;
            }
            return `who is working in ${dept}`;
        }

        // Handle day switches: "tomorrow?" or "what about tomorrow"
        const dayMatch = q.match(/(?:what about|how about)?\s*(tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
        if (dayMatch) {
            const day = dayMatch[1];
            if (ctx.queryType === 'working') {
                return `who is working ${day}${ctx.department ? ' in ' + ctx.department : ''}`;
            } else if (ctx.queryType === 'off') {
                return `who is off ${day}${ctx.department ? ' in ' + ctx.department : ''}`;
            }
            return `who is off ${day}`;
        }

        // Handle "who else" / "anyone else"
        if (/who else|anyone else|more people/i.test(q)) {
            // Return expanded version of last query
            return ctx.lastQuery || query;
        }

        // Handle short single-word department queries like "bakery?"
        if (/^(bakery|hot kitchen|cold kitchen|stewarding|butchery|pastry)\??$/i.test(q)) {
            const dept = q.replace('?', '');
            if (ctx.queryType === 'working') {
                return `who is working in ${dept}`;
            } else if (ctx.queryType === 'off') {
                return `who is off in ${dept}`;
            }
            return `who is working in ${dept}`;
        }

        return query;
    }

    // @ts-ignore - Reserved for future API-based queries
    private static readonly _SYSTEM_PROMPT = `
You are **SID**, an intelligent employee management assistant for **TAMIMI GLOBAL CO. LTD. (TAFGA) - NEOM Location #198**.

## Core Capabilities

### Employee Data You Track:
- **Employee Name** (Full name)
- **Employee ID** (TAMIMI ID - unique identifier, 6-7 digits)
- **Position/Job Title** (Executive Chef, Sous Chef, CDP, Commi-1/2/3, Kitchen Coordinator, etc.)
- **Department** (Hot Kitchen, Cold Kitchen, Bakery)
- **Shift Type** (Morning, Afternoon, Night)

### Schedule Values:
| Value | Meaning |
|-------|---------|
| 8AM-6PM, 7AM-6PM, etc. | Working shift |
| OFF | Weekly day off (regular rest day) |
| VACATION | Annual leave (paid vacation) |
| Leave, Un-paid Leave, UL | Unpaid leave |

## Response Guidelines:
1. **Be precise:** Always include Employee ID when mentioning employees
2. **Be current:** Reference the date when providing schedule information
3. **Be complete:** Include name, ID, position, department, schedule
4. **Be structured:** Use clear formatting with emojis for visual clarity
5. **Summarize:** End with totals (Working: X | Off: Y | Leave: Z)

## Sample Response Format:

**For "Who is working today?":**
\`\`\`
📅 Today's Schedule (Thursday, December 18, 2025):

HOT KITCHEN - MORNING SHIFT:
✓ Anandhan Ramachandraraja (Executive Sous Chef) - 8AM-6PM
✓ IMRAM MALIK (Sous Chef) - 8AM-6PM

🔴 OFF TODAY:
- Howard Poththewela (Executive Chef)

🌴 ON VACATION:
- Christine Allones (Kitchen Coordinator)

📊 Total: Working: 15 | Off: 3 | Leave: 2
\`\`\`

**For employee lookup:**
\`\`\`
👤 Employee Found:
Name: Anandhan Ramachandraraja
Employee ID: 5025875
Position: Executive Sous Chef
Department: Hot Kitchen
Status: Working
Today's Shift: 8AM-6PM
\`\`\`
`;

    // ========================================
    // LOCAL STORAGE PERSISTENCE METHODS
    // ========================================

    /**
     * Save roster data to localStorage for persistence
     * Called after file upload/analysis completes
     */
    static saveRosterToLocalStorage(data: RosterContext): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            console.log("💾 SID: Roster data saved to localStorage");
        } catch (error) {
            console.error("❌ SID: Failed to save roster to localStorage:", error);
        }
    }

    /**
     * Load roster data from localStorage
     * SID checks here first before requiring upload
     */
    static loadRosterFromLocalStorage(): RosterContext | null {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                console.log("📂 SID: Loaded roster from localStorage with", data.staff?.length || 0, "staff");
                return data;
            }
        } catch (error) {
            console.error("❌ SID: Failed to load roster from localStorage:", error);
        }
        return null;
    }

    /**
     * Check if roster data exists in localStorage
     */
    static hasStoredRoster(): boolean {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                return data.staff && data.staff.length > 0;
            } catch {
                return false;
            }
        }
        return false;
    }

    /**
     * Clear stored roster data
     */
    static clearStoredRoster(): void {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log("🗑️ SID: Roster data cleared from localStorage");
    }

    /**
     * Get stored roster info (for UI display)
     */
    static getStoredRosterInfo(): { staffCount: number; lastUpdated: string } | null {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                return {
                    staffCount: data.staff?.length || 0,
                    lastUpdated: data.lastUpdated || 'Unknown'
                };
            }
        } catch {
            return null;
        }
        return null;
    }

    // ========================================
    // MAIN QUERY METHOD
    // ========================================

    /**
     * Ask Sid a question about the roster - LOCAL PROCESSING (NO API COST)
     * Automatically loads from localStorage if no rosterData is provided!
     * NOW WITH CONVERSATION MEMORY for follow-up questions!
     */
    static async askSid(query: string, rosterData?: RosterContext): Promise<string> {
        try {
            console.log("🤖 SID: Processing query locally (no API cost)...");

            // AUTO-LOAD FROM LOCALSTORAGE if no data provided
            let data = rosterData;
            if (!data || !data.staff || data.staff.length === 0) {
                console.log("🔍 SID: No data passed, checking localStorage...");
                data = this.loadRosterFromLocalStorage() || { staff: [] };
            }

            // CHECK FOR FOLLOW-UP QUESTIONS
            let expandedQuery = query;
            if (this.isFollowUpQuestion(query)) {
                console.log("💭 SID: Detected follow-up question, expanding with context...");
                expandedQuery = this.expandFollowUpQuery(query);
                console.log(`💭 SID: Expanded "${query}" -> "${expandedQuery}"`);
            }

            // Add user message to history
            this.addToHistory('user', query);

            // ALL processing is done locally - NO API CALLS
            const response = this.processQueryLocally(expandedQuery, data);

            // Add response to history
            this.addToHistory('assistant', response);

            console.log("✅ SID: Response ready (local processing)");
            return response;

        } catch (error) {
            console.error("❌ SID Error:", error);
            return "I'm having trouble accessing the roster right now. Please try again.";
        }
    }

    /**
     * Process query locally without API calls - SAVES MONEY!
     * Returns HUMAN-FRIENDLY, conversational responses
     * Supports date queries: today, tomorrow, specific weekdays
     */
    private static processQueryLocally(query: string, data: RosterContext): string {
        const q = query.toLowerCase();
        const now = new Date();
        const hour = now.getHours();

        // Time-based greeting
        const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

        if (!data.staff || data.staff.length === 0) {
            return `${greeting}, Chef! 👋\n\nI don't have any roster data loaded yet. Could you please upload a duty schedule file so I can help you with staff information?`;
        }

        // ========================================
        // DATE DETECTION - Detect which day user is asking about
        // ========================================
        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        let targetDate = new Date(now); // Default to today
        let dateLabel = 'today';

        // Check for "tomorrow"
        if (q.includes('tomorrow')) {
            targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() + 1);
            dateLabel = 'tomorrow';
        }
        // Check for "yesterday"
        else if (q.includes('yesterday')) {
            targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() - 1);
            dateLabel = 'yesterday';
        }
        // Check for "next week" or "next [day]"
        else if (q.includes('next week')) {
            targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() + 7);
            dateLabel = 'next week';
        }
        // Check for specific weekday names
        else {
            for (let i = 0; i < weekdays.length; i++) {
                if (q.includes(weekdays[i])) {
                    const currentDay = now.getDay();
                    let daysToAdd = i - currentDay;

                    // If the day has passed this week, go to next week
                    if (daysToAdd <= 0 && !q.includes('last')) {
                        daysToAdd += 7;
                    }
                    // If user says "last monday", go backwards
                    if (q.includes('last')) {
                        daysToAdd = daysToAdd > 0 ? daysToAdd - 7 : daysToAdd;
                    }

                    targetDate = new Date(now);
                    targetDate.setDate(targetDate.getDate() + daysToAdd);
                    dateLabel = weekdays[i];
                    break;
                }
            }
        }

        const targetDayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const targetDateStr = targetDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
        const targetDayNum = targetDate.getDate();

        // ========================================
        // CATEGORIZE STAFF BY TARGET DATE'S SCHEDULE
        // ========================================
        const working: any[] = [];
        const off: any[] = [];
        const vacation: any[] = [];
        const leave: any[] = [];

        // Debug log
        console.log(`🔍 SID: Looking for schedule on ${targetDayName} (${targetDateStr})`);

        data.staff.forEach((emp: any) => {
            const name = emp.name || 'Unknown';
            const id = emp.rollNumber || emp.employeeId || 'N/A';
            const role = emp.role || emp.position || 'Staff';
            const dept = emp.department || 'Kitchen';

            let targetShift = 'Working';
            if (emp.schedule && Array.isArray(emp.schedule)) {
                // Schedule stores dates as weekday names like "Thursday", "Friday", "Saturday"
                const targetSch = emp.schedule.find((s: any) => {
                    const schDate = (s.date || '').toLowerCase().trim();
                    // Match by weekday name (primary method - schedules use day names)
                    // e.g., schDate = "saturday", targetDayName = "saturday"
                    if (schDate === targetDayName) return true;
                    // Also try partial match (e.g., "sat" in "saturday")
                    if (schDate.length >= 3 && targetDayName.includes(schDate.substring(0, 3))) return true;
                    if (targetDayName.length >= 3 && schDate.includes(targetDayName.substring(0, 3))) return true;
                    // Match by day number if schedule uses date format like "20" or "Dec 20"
                    if (schDate.includes(String(targetDayNum))) return true;
                    return false;
                });
                if (targetSch) {
                    targetShift = targetSch.shift || targetSch.shiftType || 'Working';
                    console.log(`  ✓ ${name}: Found schedule for ${targetDayName} -> ${targetShift}`);
                }
            }

            const empInfo = { name, id, role, dept, shift: targetShift };

            // Case-insensitive shift detection
            const shiftUpper = targetShift.toUpperCase();

            if (shiftUpper === 'OFF') {
                off.push(empInfo);
            } else if (shiftUpper === 'VACATION' || shiftUpper === 'ANNUAL_LEAVE' || shiftUpper.includes('VACATION')) {
                vacation.push(empInfo);
            } else if (shiftUpper.includes('LEAVE') || shiftUpper === 'UL' || shiftUpper.includes('UNPAID')) {
                leave.push(empInfo);
            } else {
                working.push(empInfo);
            }
        });

        console.log(`📊 SID Result for ${targetDayName}: Working=${working.length}, Off=${off.length}, Vacation=${vacation.length}, Leave=${leave.length}`);

        // ========================================
        // DEPARTMENT FILTERING
        // ========================================
        const departments = ['hot kitchen', 'cold kitchen', 'bakery', 'pastry', 'butchery', 'stewarding'];
        let targetDept: string | null = null;

        for (const dept of departments) {
            if (q.includes(dept)) {
                targetDept = dept;
                break;
            }
        }

        // Filter by department if specified
        const filterByDept = (list: any[]) => {
            if (!targetDept) return list;
            return list.filter(e => e.dept.toLowerCase().includes(targetDept!));
        };

        const workingFiltered = filterByDept(working);
        const offFiltered = filterByDept(off);
        const vacationFiltered = filterByDept(vacation);
        const leaveFiltered = filterByDept(leave);

        let response = '';

        // FIRST: Check if query contains a person name (prioritize person search)
        const allStaff = [...working, ...off, ...vacation, ...leave];
        const cleanQuery = q.replace(/is|the|on|off|today|duty|what|who|where|when|how|working|schedule|hot|cold|kitchen|bakery|pastry|butchery|stewarding|in/gi, '').trim();
        const foundPerson = allStaff.filter(e =>
            cleanQuery.length > 2 && (
                e.name.toLowerCase().includes(cleanQuery) ||
                cleanQuery.includes(e.name.toLowerCase().split(' ')[0])
            )
        );

        // If a person is found, show their info in a friendly way
        if (foundPerson.length > 0) {
            if (foundPerson.length === 1) {
                const e = foundPerson[0];
                const statusMsg = e.shift === 'OFF' ? "is enjoying their day off today 🏖️" :
                    e.shift === 'VACATION' ? "is on vacation ✈️" :
                        e.shift.toUpperCase().includes('LEAVE') ? "is on leave 📝" :
                            `is working today (${e.shift}) 💪`;
                response = `${greeting}, Chef! 👋\n\n`;
                response += `I found ${e.name} for you!\n\n`;
                response += `👤 ${e.name} ${statusMsg}\n`;
                response += `   📋 Role: ${e.role}\n`;
                response += `   🏢 Department: ${e.dept}\n`;
                response += `   🆔 Employee ID: ${e.id}\n\n`;
                response += `Is there anything else you'd like to know about the team?`;
            } else {
                response = `${greeting}, Chef! 👋\n\n`;
                response += `I found ${foundPerson.length} people matching your search:\n\n`;
                foundPerson.forEach(e => {
                    const status = e.shift === 'OFF' ? '🏖️ Off' :
                        e.shift === 'VACATION' ? '✈️ Vacation' :
                            `💪 ${e.shift}`;
                    response += `• ${e.name} - ${e.role} (${status})\n`;
                });
            }
        }
        // Query: Who is working?
        else if (q.includes('working') || (q.includes('on duty') && !foundPerson.length)) {
            const deptLabel = targetDept ? ` in ${targetDept.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}` : '';
            response = `${greeting}, Chef! 👋\n\n`;
            response += `Here's who's working${deptLabel} ${dateLabel === 'today' ? 'today' : 'on ' + targetDateStr}:\n\n`;
            response += `We have ${workingFiltered.length} team members working${deptLabel}:\n\n`;
            workingFiltered.slice(0, 15).forEach((e, i) => {
                response += `${i + 1}. ${e.name} - ${e.role} (${e.shift})\n`;
            });
            if (workingFiltered.length > 15) {
                response += `\n... and ${workingFiltered.length - 15} more team members\n`;
            }
            response += `\n📊 Quick Summary: ${workingFiltered.length} working, ${offFiltered.length} off, ${vacationFiltered.length + leaveFiltered.length} on leave\n`;
            response += `\nNeed details on anyone specific?`;

            // SAVE CONTEXT for follow-up questions
            this.setLastContext({ queryType: 'working', department: targetDept || undefined, dateLabel, lastQuery: query });
        }
        // Query: Who is off?
        else if (q.includes('off') || q.includes('day off')) {
            const deptLabel = targetDept ? ` in ${targetDept.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}` : '';
            response = `${greeting}, Chef! 👋\n\n`;
            if (offFiltered.length === 0) {
                response += `Everyone${deptLabel} is scheduled to work ${dateLabel}! No one has a day off on ${targetDateStr}. 💪`;
            } else {
                response += `Here's who has their day off${deptLabel} ${dateLabel === 'today' ? 'today' : 'on ' + targetDateStr}:\n\n`;
                offFiltered.forEach((e, i) => {
                    response += `${i + 1}. ${e.name} - ${e.role}\n`;
                });
                response += `\n🏖️ ${offFiltered.length} team member${offFiltered.length > 1 ? 's' : ''} enjoying their rest day!\n`;
                response += `\nWould you like me to show who's working instead?`;
            }

            // SAVE CONTEXT for follow-up questions
            this.setLastContext({ queryType: 'off', department: targetDept || undefined, dateLabel, lastQuery: query });
        }
        // Query: Who is on vacation/leave?
        else if (q.includes('vacation') || q.includes('leave') || q.includes('absent')) {
            const deptLabel = targetDept ? ` in ${targetDept.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}` : '';
            response = `${greeting}, Chef! 👋\n\n`;
            response += `Here's the leave status${deptLabel} for ${dateLabel} (${targetDateStr}):\n\n`;

            if (vacationFiltered.length > 0) {
                response += `✈️ On Vacation (${vacationFiltered.length}):\n`;
                vacationFiltered.forEach((e, i) => {
                    response += `   ${i + 1}. ${e.name} - ${e.role}\n`;
                });
                response += `\n`;
            } else {
                response += `✈️ No one is on vacation${deptLabel} today.\n\n`;
            }

            if (leaveFiltered.length > 0) {
                response += `📝 On Leave (${leaveFiltered.length}):\n`;
                leaveFiltered.forEach((e, i) => {
                    response += `   ${i + 1}. ${e.name} - ${e.role}\n`;
                });
            } else {
                response += `📝 No one is on leave${deptLabel} today.\n`;
            }

            const absent = vacationFiltered.length + leaveFiltered.length;
            response += `\nTotal absent${deptLabel}: ${absent} team member${absent !== 1 ? 's' : ''}\n`;
        }
        // Query: List all staff / names
        else if (q.includes('staff') || q.includes('name') || q.includes('list') || q.includes('all') || q.includes('team')) {
            response = `${greeting}, Chef! 👋\n\n`;
            response += `Here's your complete team roster:\n\n`;
            response += `👥 Total Team: ${data.staff.length} members\n\n`;

            response += `💪 Working Today (${working.length}):\n`;
            working.slice(0, 10).forEach((e, i) => {
                response += `   ${i + 1}. ${e.name} - ${e.role}\n`;
            });
            if (working.length > 10) response += `   ... and ${working.length - 10} more\n`;

            if (off.length > 0) {
                response += `\n🏖️ Day Off (${off.length}):\n`;
                off.forEach((e, i) => {
                    response += `   ${i + 1}. ${e.name} - ${e.role}\n`;
                });
            }

            if (vacation.length > 0) {
                response += `\n✈️ Vacation (${vacation.length}):\n`;
                vacation.forEach((e, i) => {
                    response += `   ${i + 1}. ${e.name} - ${e.role}\n`;
                });
            }

            response += `\nLet me know if you need details on anyone!`;
        }
        // Query: Find specific person
        else if (q.includes('find') || q.includes('search') || q.includes('where')) {
            const searchTerm = q.replace(/find|search|where|is|the|off|on|duty|today/gi, '').trim();
            const found = allStaff.filter(e =>
                e.name.toLowerCase().includes(searchTerm)
            );
            response = `${greeting}, Chef! 👋\n\n`;
            if (found.length > 0) {
                response += `I found ${found.length} match${found.length > 1 ? 'es' : ''} for "${searchTerm}":\n\n`;
                found.forEach(e => {
                    const status = e.shift === 'OFF' ? '🏖️ Day Off' :
                        e.shift === 'VACATION' ? '✈️ Vacation' :
                            `💪 Working (${e.shift})`;
                    response += `👤 ${e.name}\n`;
                    response += `   Role: ${e.role} | Dept: ${e.dept}\n`;
                    response += `   Today: ${status}\n`;
                    response += `   ID: ${e.id}\n\n`;
                });
            } else {
                response += `Hmm, I couldn't find anyone matching "${searchTerm}". 🤔\n\n`;
                response += `Would you like me to show you the full staff list instead?`;
            }
        }
        // Default: Show friendly summary
        else {
            // Check if query contains a potential person name
            const found = allStaff.filter(e =>
                e.name.toLowerCase().includes(cleanQuery) || cleanQuery.includes(e.name.toLowerCase().split(' ')[0])
            );

            if (found.length > 0 && cleanQuery.length > 2) {
                const e = found[0];
                const statusMsg = e.shift === 'OFF' ? "is on their day off" :
                    e.shift === 'VACATION' ? "is on vacation" :
                        `is working (${e.shift})`;
                response = `${greeting}, Chef! 👋\n\n`;
                response += `${e.name} ${statusMsg} today.\n\n`;
                response += `📋 ${e.role} | 🏢 ${e.dept} | 🆔 ${e.id}\n`;
            } else {
                response = `${greeting}, Chef! 👋\n\n`;
                response += `Here's the kitchen status for ${targetDateStr}:\n\n`;
                response += `📊 Team Summary:\n`;
                response += `   • 👥 Total Staff: ${data.staff.length}\n`;
                response += `   • 💪 Working: ${working.length}\n`;
                response += `   • 🏖️ Day Off: ${off.length}\n`;
                response += `   • ✈️ Vacation: ${vacation.length}\n`;
                response += `   • 📝 Leave: ${leave.length}\n\n`;
                response += `What would you like to know? Try asking:\n`;
                response += `• "Who is working today?"\n`;
                response += `• "Who is off?"\n`;
                response += `• "Find [name]"\n`;
            }
        }

        return response;
    }

    /**
     * Build readable context from roster data
     */
    // @ts-ignore - Reserved for future use
    private static _buildRosterContext(data: RosterContext): string {
        const parts: string[] = [];
        const today = new Date();
        const todayStr = today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const todayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

        parts.push(`📅 Current Date: ${todayStr}`);
        parts.push(`🏢 Location: TAMIMI GLOBAL CO. LTD. (TAFGA) - NEOM LOC# 198\n`);

        // All staff roster with today's status
        if (data.staff && data.staff.length > 0) {
            const workingStaff: string[] = [];
            const offStaff: string[] = [];
            const vacationStaff: string[] = [];
            const leaveStaff: string[] = [];

            data.staff.forEach((emp: any) => {
                const name = emp.name || 'Unknown';
                const id = emp.rollNumber || emp.employeeId || 'N/A';
                const role = emp.role || emp.position || 'Staff';
                const dept = emp.department || 'Kitchen';

                // Get today's shift
                let todayShift = 'Working';
                if (emp.schedule) {
                    const todaySch = emp.schedule.find((s: any) => {
                        const schDate = (s.date || '').toLowerCase();
                        return schDate.includes(todayName) || schDate.includes(String(today.getDate()));
                    });
                    if (todaySch) {
                        todayShift = todaySch.shift || todaySch.shiftType || 'Working';
                    }
                }

                const empLine = `${name} [ID: ${id}] - ${role} (${dept}) - Today: ${todayShift}`;

                if (todayShift === 'OFF') {
                    offStaff.push(empLine);
                } else if (todayShift === 'VACATION' || todayShift === 'ANNUAL_LEAVE') {
                    vacationStaff.push(empLine);
                } else if (todayShift === 'Leave' || todayShift === 'UNPAID_LEAVE' || todayShift.includes('Leave')) {
                    leaveStaff.push(empLine);
                } else {
                    workingStaff.push(empLine);
                }
            });

            if (workingStaff.length > 0) {
                parts.push(`## ✅ WORKING TODAY (${workingStaff.length}):`);
                workingStaff.forEach((s, i) => parts.push(`${i + 1}. ${s}`));
                parts.push('');
            }

            if (offStaff.length > 0) {
                parts.push(`## 🔴 WEEKLY DAY OFF (${offStaff.length}):`);
                offStaff.forEach((s, i) => parts.push(`${i + 1}. ${s}`));
                parts.push('');
            }

            if (vacationStaff.length > 0) {
                parts.push(`## ✈️ ANNUAL LEAVE / VACATION (${vacationStaff.length}):`);
                vacationStaff.forEach((s, i) => parts.push(`${i + 1}. ${s}`));
                parts.push('');
            }

            if (leaveStaff.length > 0) {
                parts.push(`## 📝 UNPAID LEAVE (${leaveStaff.length}):`);
                leaveStaff.forEach((s, i) => parts.push(`${i + 1}. ${s}`));
                parts.push('');
            }

            parts.push(`## 📊 SUMMARY:`);
            parts.push(`- Total Staff: ${data.staff.length}`);
            parts.push(`- Working: ${workingStaff.length}`);
            parts.push(`- Weekly Off: ${offStaff.length}`);
            parts.push(`- Annual Leave: ${vacationStaff.length}`);
            parts.push(`- Unpaid Leave: ${leaveStaff.length}`);
        } else if (data.schedules && data.schedules.length > 0) {
            parts.push("## SCHEDULE DATABASE:");
            data.schedules.slice(0, 30).forEach((s: any) => {
                parts.push(`- ${s.name || 'Staff'}: ${s.shift || s.status || 'Scheduled'}`);
            });
        } else {
            parts.push("⚠️ No staff data currently loaded. Please upload a roster first.");
        }

        return parts.join('\n');
    }

    /**
     * Get today's schedule summary
     */
    static getTodaySummary(data: RosterContext): { working: number; off: number; leave: number } {
        const working = data.todaySchedule?.length || 0;
        const total = data.staff?.length || 0;
        const off = total - working;

        return { working, off, leave: 0 };
    }

    /**
     * Categorize an employee into one of the 21 role categories
     * ORDER MATTERS: Check more specific roles FIRST before generic ones
     */
    static categorizeEmployee(position: string): typeof ROLE_CATEGORIES[number] | null {
        const posLower = position.toLowerCase().trim();

        // ===========================================
        // EXECUTIVE LEVEL (must match "exec" or "executive")
        // ===========================================
        if (posLower.includes('executive sous') || (posLower.includes('exec') && posLower.includes('sous'))) {
            return ROLE_CATEGORIES.find(c => c.name === 'Executive Sous Chef') || null;
        }
        if (posLower.includes('executive chef') || (posLower.includes('exec') && posLower.includes('chef') && !posLower.includes('sous'))) {
            return ROLE_CATEGORIES.find(c => c.name === 'Executive Chef') || null;
        }

        // ===========================================
        // MANAGEMENT LEVEL
        // ===========================================
        // Sous Chef (NOT executive) - must be just "sous chef" without "executive"
        if ((posLower === 'sous chef' || posLower.includes('sous chef')) && !posLower.includes('exec')) {
            return ROLE_CATEGORIES.find(c => c.name === 'Sous Chef') || null;
        }
        if (posLower.includes('head baker')) {
            return ROLE_CATEGORIES.find(c => c.name === 'Head Baker') || null;
        }

        // ===========================================
        // SENIOR LEVEL
        // ===========================================
        if (posLower.includes('demi chef') || posLower.includes('demi-chef') || posLower.includes('dcdp')) {
            return ROLE_CATEGORIES.find(c => c.name === 'Demi Chef De Partie') || null;
        }
        if (posLower.includes('cdp') || posLower.includes('chef de partie') || posLower.includes('de partie')) {
            return ROLE_CATEGORIES.find(c => c.name === 'Chef De Partie (CDP)') || null;
        }
        if (posLower.includes('head steward')) {
            return ROLE_CATEGORIES.find(c => c.name === 'Head Steward') || null;
        }
        if (posLower.includes('senior steward')) {
            return ROLE_CATEGORIES.find(c => c.name === 'Senior Steward') || null;
        }
        if (posLower.includes('pastry chef') || posLower.includes('pastry')) {
            return ROLE_CATEGORIES.find(c => c.name === 'Pastry Chef') || null;
        }

        // ===========================================
        // MID LEVEL - COMMI (check specific numbers FIRST)
        // ===========================================
        if (posLower.includes('commi 1') || posLower.includes('commi-1') || posLower.includes('commis 1') || posLower.includes('commis-1') || posLower === 'commi1') {
            return ROLE_CATEGORIES.find(c => c.name === 'Commi 1') || null;
        }
        if (posLower.includes('commi 2') || posLower.includes('commi-2') || posLower.includes('commis 2') || posLower.includes('commis-2') || posLower === 'commi2') {
            return ROLE_CATEGORIES.find(c => c.name === 'Commi 2') || null;
        }
        if (posLower.includes('commi 3') || posLower.includes('commi-3') || posLower.includes('commis 3') || posLower.includes('commis-3') || posLower === 'commi3') {
            return ROLE_CATEGORIES.find(c => c.name === 'Commi 3') || null;
        }
        // Generic "commi" without number defaults to Commi 1
        if (posLower.includes('commi') && !posLower.match(/commi\s*[123]/)) {
            return ROLE_CATEGORIES.find(c => c.name === 'Commi 1') || null;
        }

        // ===========================================
        // MID LEVEL - SPECIALTY
        // ===========================================
        if (posLower.includes('baker') && !posLower.includes('head')) {
            return ROLE_CATEGORIES.find(c => c.name === 'Baker') || null;
        }
        if (posLower.includes('butcher')) {
            return ROLE_CATEGORIES.find(c => c.name === 'Butcher') || null;
        }
        if (posLower.includes('cold kitchen') || posLower.includes('garde manger') || posLower.includes('salad')) {
            return ROLE_CATEGORIES.find(c => c.name === 'Cold Kitchen Staff') || null;
        }

        // ===========================================
        // SUPPORT LEVEL
        // ===========================================
        if (posLower.includes('coordinator')) {
            return ROLE_CATEGORIES.find(c => c.name === 'Kitchen Coordinator') || null;
        }
        if (posLower.includes('helper')) {
            return ROLE_CATEGORIES.find(c => c.name === 'Kitchen Helper') || null;
        }
        if (posLower.includes('steward') && !posLower.includes('head') && !posLower.includes('senior')) {
            return ROLE_CATEGORIES.find(c => c.name === 'Steward') || null;
        }

        // ===========================================
        // ENTRY LEVEL
        // ===========================================
        if (posLower.includes('trainee')) {
            return ROLE_CATEGORIES.find(c => c.name === 'Trainee') || null;
        }
        if (posLower.includes('apprentice')) {
            return ROLE_CATEGORIES.find(c => c.name === 'Apprentice') || null;
        }

        // ===========================================
        // DEFAULT: Hot Kitchen Staff for unmatched kitchen roles
        // ===========================================
        return ROLE_CATEGORIES.find(c => c.name === 'Hot Kitchen Staff') || null;
    }

    /**
     * Group staff by role category for UI display
     */
    static groupStaffByCategory(staff: any[]): Map<string, { category: typeof ROLE_CATEGORIES[number], staff: any[] }> {
        const groups = new Map<string, { category: typeof ROLE_CATEGORIES[number], staff: any[] }>();

        for (const emp of staff) {
            const position = emp.position || emp.role || 'Staff';
            const category = this.categorizeEmployee(position);

            if (category) {
                if (!groups.has(category.name)) {
                    groups.set(category.name, { category, staff: [] });
                }
                groups.get(category.name)!.staff.push({
                    ...emp,
                    category: category.name,
                    categoryIcon: category.icon,
                    categoryColor: category.color
                });
            }
        }

        // Sort by category level (Executive -> Management -> Senior -> Mid -> Junior -> Entry -> Support)
        const levelOrder = ['Executive', 'Management', 'Senior', 'Mid', 'Junior', 'Entry', 'Support'];
        const sortedGroups = new Map(
            [...groups.entries()].sort((a, b) => {
                const aLevel = levelOrder.indexOf(a[1].category.level);
                const bLevel = levelOrder.indexOf(b[1].category.level);
                return aLevel - bLevel;
            })
        );

        return sortedGroups;
    }

    /**
     * Get role categories summary for UI
     */
    static getRoleCategorySummary(staff: any[]): { categoryName: string; count: number; icon: string; color: string }[] {
        const groups = this.groupStaffByCategory(staff);
        return Array.from(groups.entries()).map(([name, data]) => ({
            categoryName: name,
            count: data.staff.length,
            icon: data.category.icon,
            color: data.category.color
        }));
    }
}


