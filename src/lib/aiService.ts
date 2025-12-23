/**
 * AIService - "Sid" - Kitchen AI Assistant
 * Uses OpenAI GPT-4o-mini API
 * 
 * Features:
 * - analyzeStaffRoles: Classify staff into departments
 * - analyzeRosterFile: Parse Excel roster with AI
 * - buildHierarchy: Create org chart structure
 */
class AIService {
    // Configuration - Using OpenAI GPT-4o-mini (fast and affordable)
    private readonly DEFAULT_MODEL = "gpt-4o-mini";

    // API Client
    private openaiKey: string | null = null;

    /**
     * Initialize API key from environment or localStorage
     */
    init() {
        this.openaiKey = import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('OPENAI_API_KEY');

        // Debug: Show if key is found
        console.log("🔑 API Keys check:", {
            openai: this.openaiKey ? `Found (${this.openaiKey.substring(0, 8)}...)` : "NOT FOUND"
        });

        if (this.openaiKey) {
            console.log("🤖 Sid AI: Using OpenAI GPT-4o-mini");
        } else {
            console.warn("⚠️ Sid AI: NOT CONFIGURED - Add VITE_OPENAI_API_KEY to .env");
        }
    }

    async sendMessage(prompt: string, context: string = '', _modelOverride?: string, maxTokens: number = 4096): Promise<string> {
        if (!this.openaiKey) this.init();

        if (!this.openaiKey) return "⚠️ AI not configured. Please add VITE_OPENAI_API_KEY to .env";

        try {
            const systemContent = "You are 'Sid', an expert Kitchen Manager and AI assistant.";
            const userContent = `Context: ${context}\nUser: ${prompt}`;

            console.log("🤖 Sid calling OpenAI...");

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.openaiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: this.DEFAULT_MODEL,
                    messages: [
                        { role: "system", content: systemContent },
                        { role: "user", content: userContent }
                    ],
                    temperature: 0.7,
                    max_tokens: maxTokens
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error("OpenAI Error:", response.status, errorBody);
                throw new Error(`OpenAI API Error: ${response.status} - ${errorBody}`);
            }

            const data = await response.json();
            console.log("✅ Sid response received");

            // Check if response was truncated
            const finishReason = data.choices[0]?.finish_reason;
            if (finishReason === 'length') {
                console.warn("⚠️ AI response was truncated due to token limit");
                return "❌ Response truncated";
            }

            return data.choices[0]?.message?.content || "No response received.";

        } catch (error) {
            console.error("AI Error:", error);
            return "❌ AI Error: " + (error as any).message;
        }
    }

    async analyzeStaffRoles(staffList: any[]): Promise<Record<string, string>> {
        if (!this.openaiKey) this.init();

        const uniqueRoles = [...new Set(staffList.map(s => s.role))].filter(r => r);
        if (uniqueRoles.length === 0) return {};

        const prompt = `
        You are 'Sid', an expert Executive Chef and Kitchen Manager. 
        Your task is to classify the following kitchen staff roles into specific Departments.

        **Departments to use:**
        - Hot Kitchen (chefs, cooks, kitchen helpers, commis)
        - Cold Kitchen (cold prep, salad, garde manger)
        - Pastry (pastry chefs, bakers, bakery helpers)
        - Butchery (butchers, meat prep)
        - Service (waiters, runners, hosts, servers)
        - Stewarding (ONLY dishwashers, stewards, pot washers - NOT kitchen helpers!)
        - General (admins, drivers, HR, unknown roles)

        **Important Rules:**
        - "Kitchen Helper" → Hot Kitchen (they help with cooking/prep)
        - "kitchen Helper" → hot,could,pastery&bakery (they help with cook)
        - "Bakery Helper" → Pastry
        - "Commis" → Hot Kitchen
        - If role contains "Chef", "Cook", or "Helper" (except Steward/Bakery) → Hot Kitchen

        **Roles to classify:**
        ${JSON.stringify(uniqueRoles)}

        **Instructions:**
        - Analyze each role carefully based on standard culinary hierarchy.
        - Return ONLY a valid JSON object where keys are the specific 'Role' strings provided, and values are the 'Department'.
        - Do not add markdown formatting or explanations. Just the JSON.
        `;

        try {
            // Using Google Gemini 2.0 Flash (fast, intelligent, excellent at structured outputs)
            const responseText = await this.sendMessage(prompt, "Staff Role Classification", "google/gemini-2.0-flash-exp:free");

            // Clean response to ensure valid JSON (remove backticks if any)
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const mapping = JSON.parse(cleanJson);

            // Hardcoded fallback rules to fix common misclassifications
            const fallbackRules: Record<string, string> = {
                'KITCHEN HELPER': 'Hot Kitchen',
                'Kitchen Helper': 'Hot Kitchen',
                'kitchen helper': 'Hot Kitchen',
                'STEWARD HELPER': 'Stewarding',
                'Steward Helper': 'Stewarding',
                'BAKERY HELPER': 'Pastry',
                'Bakery Helper': 'Pastry',
                'COMMIS': 'Hot Kitchen',
                'Commis': 'Hot Kitchen',
                'Commis 1': 'Hot Kitchen',
                'Commis 2': 'Hot Kitchen',
                'Commis 3': 'Hot Kitchen'
            };

            // Apply fallback rules for any roles AI might have misclassified
            uniqueRoles.forEach(role => {
                if (fallbackRules[role]) {
                    mapping[role] = fallbackRules[role];
                    console.log(`✅ Fallback rule applied: ${role} → ${fallbackRules[role]}`);
                }
            });

            return mapping;
        } catch (error) {
            console.error("Sid Classification Error:", error);

            // Emergency fallback - return basic classification
            const fallbackMapping: Record<string, string> = {};
            uniqueRoles.forEach(role => {
                const roleLower = role.toLowerCase();
                if (roleLower.includes('kitchen helper')) fallbackMapping[role] = 'Hot Kitchen';
                else if (roleLower.includes('steward')) fallbackMapping[role] = 'Stewarding';
                else if (roleLower.includes('baker') || roleLower.includes('pastry')) fallbackMapping[role] = 'Pastry';
                else if (roleLower.includes('butcher')) fallbackMapping[role] = 'Butchery';
                else if (roleLower.includes('chef') || roleLower.includes('cook') || roleLower.includes('commis')) fallbackMapping[role] = 'Hot Kitchen';
                else fallbackMapping[role] = 'General';
            });
            return fallbackMapping;
        }
    }

    // SID AI Roster Reader - Extracts employee data from TAMIMI GLOBAL Excel files
    async analyzeRosterFile(rawData: any[][]): Promise<any> {
        if (!this.openaiKey) this.init();

        // Convert raw Excel data to string for AI analysis
        const dataPreview = rawData.slice(0, 50).map(row => row.join(' | ')).join('\n');

        const prompt = `
You are 'SID', an intelligent employee management assistant for TAMIMI GLOBAL CO. LTD. (TAFGA) - NEOM Location #198.
Analyze this BOH Duty Roster Excel file and extract employee data.

**Raw Data (first 50 rows):**
${dataPreview}

**Excel Structure to Recognize:**
- Header rows contain: Company name, "BOH DUTY ROASTER [MONTH] [YEAR]", "TAFGA NEOM LOC# 198"
- Column headers: SR #, NAME, ID, JOB TITLE, followed by day columns (1-31)
- **DEPARTMENT SECTION MARKERS** (VERY IMPORTANT): 
  * "HOT KITCHEN" or "HOT KITCHEN SECTION" = Hot Kitchen department
  * "COLD KITCHEN" or "COLD KITCHEN SECTION" or "GARDE MANGER" = Cold Kitchen department
  * "BAKERY" or "BAKERY SECTION" or "PASTRY" = Bakery department
  * "BUTCHERY" or "BUTCHER SECTION" = Butchery department
  * "STEWARDING" or "STEWARD SECTION" = Stewarding department
  
**DEPARTMENT DETECTION RULES:**
1. Look for section headers like "HOT KITCHEN", "COLD KITCHEN", "BAKERY" in the data
2. All employees listed AFTER a section header belong to that department
3. If no section header found, detect department from job title:
   - Butcher → Butchery
   - Baker, Pastry → Bakery
   - Steward → Stewarding
   - CDP, Commi, Chef → Hot Kitchen (default)
   - Garde Manger, Salad → Cold Kitchen

**Schedule Values:**
- "8AM-6PM", "7AM-6PM", etc. = Working shift
- "OFF" = Weekly Day Off (regular day off)
- "VACATION" = Annual Leave (paid vacation)
- "Leave", "Un-paid Leave", "UL" = Unpaid Leave

**Extract for each employee:**
- rollNumber (Employee ID - 6-7 digit number from ID column)
- name (Full name)
- role (Job title: Executive Chef, Sous Chef, CDP, Commi-1/2/3, etc.)
- department (MUST be one of: Hot Kitchen, Cold Kitchen, Bakery, Butchery, Stewarding)
- schedule array with: date (day name), shift (time or status), shiftType (see types below)

**Leave/Shift Type Definitions (IMPORTANT):**
- shiftType: "Morning" = shift starts 6AM-10AM
- shiftType: "Afternoon" = shift starts 10AM-4PM  
- shiftType: "Night" = shift starts 4PM-12AM
- shiftType: "OFF" = Weekly day off (regular rest day)
- shiftType: "ANNUAL_LEAVE" = Annual leave / Vacation (paid)
- shiftType: "UNPAID_LEAVE" = Unpaid leave / Leave

**Output JSON:**
{
    "rosterType": "monthly",
    "month": "December 2025",
    "departments": ["Hot Kitchen", "Cold Kitchen", "Bakery", "Butchery", "Stewarding"],
    "staff": [{
        "rollNumber": "5025875",
        "name": "Anandhan Ramachandraraja",
        "role": "Executive Sous Chef",
        "department": "Hot Kitchen",
        "schedule": [
            {"date": "Thursday", "shift": "8AM-6PM", "shiftType": "Morning"},
            {"date": "Friday", "shift": "OFF", "shiftType": "OFF"},
            {"date": "Saturday", "shift": "VACATION", "shiftType": "ANNUAL_LEAVE"},
            {"date": "Sunday", "shift": "Leave", "shiftType": "UNPAID_LEAVE"}
        ]
    }]
}

**Shift Type Rules:**
- Start 6AM-10AM = "Morning"
- Start 10AM-4PM = "Afternoon"  
- Start 4PM-12AM = "Night"
- "OFF" value = "OFF"
- "VACATION" value = "VACATION"

CRITICAL: 
1. Extract ALL employees from the roster. Do not skip any rows.
2. ALWAYS assign a department to each employee based on section headers or job title.
3. Include the "departments" array in output showing all departments found.

Return ONLY valid JSON, no markdown.
        `.trim();

        try {
            console.log("🤖 Sid analyzing roster with OpenAI...");
            // Use higher token limit for large rosters (16000 tokens = ~50-60 staff members)
            const responseText = await this.sendMessage(prompt, "Roster Analysis", undefined, 16000);

            // Check if AI returned an error message or was truncated
            if (responseText.startsWith('❌') || responseText.startsWith('⚠️')) {
                console.warn("⚠️ OpenAI not available or response truncated, using LOCAL parsing...");
                return this.localParseRoster(rawData);
            }

            // Clean JSON response
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

            // Detect if JSON is incomplete (common signs of truncation)
            if (!cleanJson.endsWith('}') && !cleanJson.endsWith(']')) {
                console.warn("⚠️ AI response appears truncated (no closing bracket), using LOCAL parsing...");
                return this.localParseRoster(rawData);
            }

            let analysis;
            try {
                analysis = JSON.parse(cleanJson);
            } catch (parseError) {
                console.error("JSON Parse Error:", parseError);
                console.error("Raw response (first 500 chars):", responseText.substring(0, 500));
                console.error("Raw response (last 200 chars):", responseText.substring(Math.max(0, responseText.length - 200)));
                console.warn("🔄 Falling back to LOCAL parsing...");
                return this.localParseRoster(rawData);
            }

            // Validate that we got expected structure
            if (!analysis.staff || !Array.isArray(analysis.staff)) {
                console.warn("⚠️ AI response missing staff array, using LOCAL parsing...");
                return this.localParseRoster(rawData);
            }

            // Add today matching with multiple format support
            const today = new Date();
            const todayName = today.toLocaleDateString('en-US', { weekday: 'long' }); // "Thursday"
            const todayShort = today.toLocaleDateString('en-US', { weekday: 'short' }); // "Thu"
            const todayDate = today.getDate(); // 18

            analysis.today = todayName;

            // Match today's schedule with flexible date matching
            analysis.todaySchedule = analysis.staff?.filter((s: any) =>
                s.schedule?.some((sch: any) => {
                    const schedDate = (sch.date || '').toLowerCase();
                    const matchesDay = schedDate.includes(todayName.toLowerCase()) ||
                        schedDate.includes(todayShort.toLowerCase()) ||
                        schedDate.includes(String(todayDate));
                    const isWorking = sch.shiftType !== 'OFF' && sch.shift !== 'OFF' && sch.shift !== 'VACATION';
                    return matchesDay && isWorking;
                })
            ) || [];

            console.log(`✅ Sid analyzed roster: ${analysis.staff?.length || 0} staff, ${analysis.todaySchedule?.length || 0} working today (${todayName})`);
            return analysis;
        } catch (error) {
            console.error("Sid Roster Analysis Error:", error);
            console.log("🔄 Falling back to LOCAL parsing...");
            return this.localParseRoster(rawData);
        }
    }

    // LOCAL FALLBACK: Parse roster without AI when OpenAI is unavailable
    private localParseRoster(rawData: any[][]): any {
        console.log("📊 LOCAL parsing roster data...");

        const staff: any[] = [];
        const today = new Date();
        const todayName = today.toLocaleDateString('en-US', { weekday: 'long' });
        const departmentsFound = new Set<string>();

        // Find header row (look for "NAME" or "SR #")
        let headerRow = -1;
        let nameCol = -1;
        let idCol = -1;
        let roleCol = -1;

        for (let i = 0; i < Math.min(10, rawData.length); i++) {
            const row = rawData[i];
            if (!row) continue;

            for (let j = 0; j < row.length; j++) {
                const cell = String(row[j] || '').toUpperCase();
                if (cell.includes('NAME')) { headerRow = i; nameCol = j; }
                if (cell.includes('ID') || cell.includes('SR')) { idCol = j; }
                if (cell.includes('JOB') || cell.includes('TITLE') || cell.includes('POSITION')) { roleCol = j; }
            }
            if (headerRow >= 0) break;
        }

        // Parse staff rows - TRACK CURRENT DEPARTMENT FROM SECTION HEADERS
        const startRow = headerRow >= 0 ? headerRow + 1 : 5; // Default to row 5 if no header
        if (nameCol < 0) nameCol = 1; // Default name column
        if (roleCol < 0) roleCol = 3; // Default role column

        let currentDepartment = 'Hot Kitchen'; // Default department

        for (let i = startRow; i < rawData.length && staff.length < 100; i++) {
            const row = rawData[i];
            if (!row) continue;

            const firstCell = String(row[0] || '').toUpperCase().trim();
            const nameCell = String(row[nameCol] || '').trim();
            const rowText = row.join(' ').toUpperCase();

            // DETECT DEPARTMENT SECTION HEADERS
            // Must be a header-style row: first cell contains it OR entire row is just the section name
            const isSectionHeader = (keyword: string) => {
                // Check if first cell is the keyword (section marker)
                if (firstCell === keyword || firstCell.startsWith(keyword)) return true;
                // Check if the row is short (less than 4 cells) and contains the keyword
                const nonEmptyCells = row.filter((c: any) => String(c || '').trim().length > 0);
                if (nonEmptyCells.length <= 3 && rowText.includes(keyword)) return true;
                return false;
            };

            if (isSectionHeader('HOT KITCHEN')) {
                currentDepartment = 'Hot Kitchen';
                departmentsFound.add('Hot Kitchen');
                console.log(`📍 Section: Hot Kitchen`);
                continue;
            }
            if (isSectionHeader('COLD KITCHEN') || isSectionHeader('GARDE MANGER') || firstCell === 'COLD') {
                currentDepartment = 'Cold Kitchen';
                departmentsFound.add('Cold Kitchen');
                console.log(`📍 Section: Cold Kitchen`);
                continue;
            }
            if (isSectionHeader('BAKERY') || isSectionHeader('PASTRY SECTION')) {
                currentDepartment = 'Bakery';
                departmentsFound.add('Bakery');
                console.log(`📍 Section: Bakery`);
                continue;
            }
            // Butchery section - be very strict (only if first cell says BUTCHER or BUTCHERY)
            if (firstCell === 'BUTCHER' || firstCell === 'BUTCHERY' || firstCell.startsWith('BUTCHER SECTION')) {
                currentDepartment = 'Butchery';
                departmentsFound.add('Butchery');
                console.log(`📍 Section: Butchery`);
                continue;
            }
            if (isSectionHeader('STEWARDING') || firstCell === 'STEWARD') {
                currentDepartment = 'Stewarding';
                departmentsFound.add('Stewarding');
                console.log(`📍 Section: Stewarding`);
                continue;
            }

            // Skip other section headers (MORNING SHIFT, etc.)
            if (nameCell.match(/^(MORNING|AFTERNOON|EVENING|NIGHT|SHIFT)/i)) continue;
            if (!nameCell || nameCell.length < 2 || nameCell.toUpperCase() === 'NAME') continue;

            const id = String(row[idCol] || '').trim();
            const role = String(row[roleCol] || 'Staff').trim();

            // Detect department from role if not from section
            let department = currentDepartment;
            const roleLower = role.toLowerCase();
            if (roleLower.includes('butcher')) {
                department = 'Butchery';
                departmentsFound.add('Butchery');
            } else if (roleLower.includes('baker') || roleLower.includes('pastry')) {
                department = 'Bakery';
                departmentsFound.add('Bakery');
            } else if (roleLower.includes('steward')) {
                department = 'Stewarding';
                departmentsFound.add('Stewarding');
            } else if (roleLower.includes('cold') || roleLower.includes('garde') || roleLower.includes('salad')) {
                department = 'Cold Kitchen';
                departmentsFound.add('Cold Kitchen');
            }

            // ==========================================
            // EXTRACT FULL WEEK SCHEDULE (ALL 7 DAYS)
            // ==========================================
            const schedule: { date: string; shift: string; shiftType: string }[] = [];
            const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

            // Find the first day column (usually column 4 or 5 after SR#, NAME, ID, JOB TITLE)
            // Roster columns are typically: 0=SR#, 1=NAME, 2=ID, 3=JOB, 4=Day1, 5=Day2, etc.
            const firstDayCol = Math.max(4, roleCol + 1);

            // Extract shifts for each day of the month (columns represent days 1-31)
            for (let dayIdx = 0; dayIdx < 31; dayIdx++) {
                const colIndex = firstDayCol + dayIdx;
                if (colIndex >= row.length) break;

                const cellValue = String(row[colIndex] || '').trim().toUpperCase();
                if (!cellValue) continue;

                // Calculate the weekday name for this day number
                // We need to know the month - let's use current month as approximation
                const dayOfMonth = dayIdx + 1;
                const dateForDay = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
                const weekdayName = dateForDay.toLocaleDateString('en-US', { weekday: 'long' });

                // Determine shift type
                let shiftType = 'Morning';
                if (cellValue === 'OFF') {
                    shiftType = 'OFF';
                } else if (cellValue === 'VACATION' || cellValue.includes('VACATION')) {
                    shiftType = 'ANNUAL_LEAVE';
                } else if (cellValue.includes('LEAVE') || cellValue === 'UL' || cellValue.includes('UNPAID')) {
                    shiftType = 'UNPAID_LEAVE';
                } else if (cellValue.includes('PM') || cellValue.includes('14') || cellValue.includes('15') || cellValue.includes('16')) {
                    shiftType = 'Afternoon';
                } else if (cellValue.includes('22') || cellValue.includes('23') || cellValue.includes('00')) {
                    shiftType = 'Night';
                }

                schedule.push({
                    date: weekdayName,
                    shift: cellValue,
                    shiftType: shiftType
                });
            }

            // If no schedule extracted, add today with default
            if (schedule.length === 0) {
                schedule.push({
                    date: todayName,
                    shift: 'Working',
                    shiftType: 'Morning'
                });
            }

            staff.push({
                rollNumber: id,
                name: nameCell,
                role: role,
                department: department,
                schedule: schedule
            });
        }

        // Filter today's working staff
        const todaySchedule = staff.filter(s =>
            s.schedule?.some((sch: any) => sch.shiftType !== 'OFF')
        );

        console.log(`✅ LOCAL parsed: ${staff.length} staff, ${todaySchedule.length} working today`);
        console.log(`📊 Departments found: ${Array.from(departmentsFound).join(', ')}`);

        return {
            rosterType: 'monthly',
            today: todayName,
            departments: Array.from(departmentsFound),
            staff: staff,
            todaySchedule: todaySchedule,
            source: 'local' // Mark as local parse
        };
    }

    async buildHierarchy(staffList: any[], _rosterData?: any[]): Promise<any> {
        if (!this.openaiKey) this.init();

        const simplifiedStaff = staffList.map(s => ({
            name: s.name,
            role: s.role,
            department: s.department,
            shift: s.shift || 'Morning' // Default to morning if no shift data
        }));

        // Utility: Parse shift from time string (e.g., "6:00-14:00")
        const parseShift = (shiftString: string): 'Morning' | 'Afternoon' | 'Night' | 'OFF' => {
            if (!shiftString || shiftString.toUpperCase() === 'OFF') return 'OFF';

            // Parse time range (e.g., "6:00-14:00")
            const match = shiftString.match(/(\d+):(\d+)/);
            if (match) {
                const startHour = parseInt(match[1]);
                if (startHour >= 6 && startHour < 14) return 'Morning';
                if (startHour >= 14 && startHour < 22) return 'Afternoon';
                return 'Night'; // 22:00-06:00
            }

            // Fallback to keywords
            const lower = shiftString.toLowerCase();
            if (lower.includes('morning') || lower.includes('am')) return 'Morning';
            if (lower.includes('afternoon') || lower.includes('pm')) return 'Afternoon';
            if (lower.includes('night')) return 'Night';
            return 'Morning'; // default
        };

        // Smart Fallback Builder (Org Chart Logic with Shift Grouping)
        const buildLocalFallback = () => {
            // 1. Identify Key Leaders (Exec Chef & Exec Sous)
            // Exec Chef must NOT be a specific department head (Pastry, Butcher, Baker, Steward)
            // 1. Identify Key Leaders (Exec Chef & Exec Sous)
            const isExecChef = (s: any) => {
                const r = s.role.toLowerCase();
                const d = (s.department || "").toLowerCase();

                // 1. STRONG MATCH: "Executive Chef" (or typo) - ALWAYS Root (unless Sous)
                // This overrides department checks. If you are Executive Chef of Pastry, you are probably just Executive Chef.
                if (/ex(e|c)ut.*chef/i.test(r) && !/sous/i.test(r)) {
                    return true;
                }

                // 2. WEAK MATCH: "Head Chef" - Must NOT be a department head
                const isGenericHead = /head.*chef/i.test(r);
                const isDeptSpecific = /pastry|butcher|baker|steward|sushi|cold|hot|banquet/i.test(r) ||
                    /pastry|butcher|baker|steward|sushi|cold|hot|banquet/i.test(d);

                return isGenericHead && !isDeptSpecific;
            };

            // Log matching staff to help debugging if needed (removed for production)
            const execChefUser = simplifiedStaff.find(s => isExecChef(s));
            const execChef = execChefUser || { name: "Executive Chef", role: "Vacant", department: "Management" };

            // Handle Exec sous typo just in case
            const execSous = simplifiedStaff.find(s => /ex.*c.*tive.*sous|executive.*sous/i.test(s.role));

            // 2. Group Valid Departments
            const departments: Record<string, any[]> = {};

            simplifiedStaff.forEach(s => {
                // Skip if they are the leaders we already identified
                if (s.name === execChef.name || (execSous && s.name === execSous.name)) return;

                const department = s.department || "General Kitchen";
                if (!departments[department]) departments[department] = [];
                departments[department].push(s);
            });

            // 3. Define Rank Logic (Updated for proper vertical stacking)
            const getRank = (role: string) => {
                const r = role.toLowerCase();
                // Rank 0: Executive Chefs (Safety net for those not picked as Root)
                if (r.includes('exec') || r.includes('excut')) return 0;
                // Rank 1: Department Heads / CDC (e.g. Head Pastry Chef)
                if (r.includes('head chef') || r.includes('chef de cuisine') || r.includes('cdc') || r.includes('head')) return 1;
                // Rank 2: Sous Chef
                if (r.includes('sous')) return 2;
                // Rank 3: Chef de Partie
                if (r.includes('chef de partie') || r.includes('cdp')) return 3;

                if (r.includes('demi')) return 4;
                if (r.includes('commis 1') || r.includes('i')) return 5;
                if (r.includes('commis 2') || r.includes('ii')) return 6;
                if (r.includes('commis 3') || r.includes('iii')) return 6;
                if (r.includes('trainee') || r.includes('steward')) return 7;
                return 10;
            };

            // 4. Build Department Nodes with Shift Grouping
            const deptNodes = Object.keys(departments).map(dept => {
                const deptStaff = departments[dept];

                // Group by shift within this department
                const shiftGroups: Record<string, any[]> = {
                    Morning: [],
                    Afternoon: [],
                    Night: []
                };

                deptStaff.forEach(staff => {
                    const shift = parseShift(staff.shift || 'Morning');
                    if (shift !== 'OFF' && shiftGroups[shift]) {
                        shiftGroups[shift].push(staff);
                    }
                });

                // Create shift nodes with vertical stacking
                const shiftNodes = Object.entries(shiftGroups)
                    .filter(([_, staff]) => staff.length > 0)
                    .map(([shiftName, staff]) => {
                        // Sort by rank within shift
                        const sorted = staff.sort((a, b) => getRank(a.role) - getRank(b.role));

                        // Build vertical chain for this shift
                        let current = { ...sorted[0], children: [] as any[] };
                        const rootOfShift = current;

                        sorted.slice(1).forEach(s => {
                            const nextNode = { ...s, children: [] as any[] };
                            current.children = [nextNode];
                            current = nextNode;
                        });

                        // Wrap in a Shift Label Node
                        return {
                            name: `${shiftName} Shift`,
                            role: "Shift",
                            shift: shiftName,
                            shiftTime: shiftName === 'Morning' ? '6:00-14:00' :
                                shiftName === 'Afternoon' ? '14:00-22:00' : '22:00-06:00',
                            children: [rootOfShift]
                        };
                    });

                // Wrap in Department Node
                return {
                    name: dept,
                    role: "Department",
                    children: shiftNodes
                };
            });

            // 5. Connect the Global Tree
            const execSousNode = execSous ? { ...execSous, children: deptNodes } : null;

            // If Exec Sous exists, they hold the departments. If not, Exec Chef holds them.
            const root = {
                ...execChef,
                children: execSousNode ? [execSousNode] : deptNodes
            };

            return root;
        };

        if (!this.openaiKey) {
            console.warn("AI not configured, using local hierarchy fallback.");
            return buildLocalFallback();
        }

        const prompt = `
        You are 'Sid', an expert Executive Chef and efficient Kitchen Manager.
        Your task is to organize the following kitchen staff into a strict **Hierarchical Organizational Chart Tree**.

        **Staff List:**
        ${JSON.stringify(simplifiedStaff)}

        **🧠 "Training" & Knowledge Base:**
        1. **Typo Tolerance**: 
           - Users often misspell "Executive" as "Excut", "Execut", or "Ecx". Treat these as "Executive".
           - "Commi" = "Commis".
        2. **Hierarchy Rules (Chain of Command)**:
           - **Level 0**: Executive Chef (The "Boss"). There can be only ONE Root.
           - **Level 1**: Executive Sous Chef (SINGLE child of Executive Chef).
           - **Level 2**: ALL DEPARTMENTS (Children of Executive Sous Chef ONLY).
           - **Level 3**: SHIFTS within each Department (Morning/Afternoon/Night).
           - **Level 4+**: Staff within each shift, ranked vertically.
        3. **Shift Organization (NEW)**:
           - Each department MUST be divided into shift nodes:
             * Morning Shift (6:00-14:00)
             * Afternoon Shift (14:00-22:00)
             * Night Shift (22:00-06:00)
           - Staff are grouped under their shift time
           - Within each shift, rank by: Head/CDC/Sous → CDP → Commis
        
        **CRITICAL Structure Rule:**
        - Executive Chef has EXACTLY ONE child: Executive Sous Chef
        - Executive Sous Chef has MULTIPLE children: One for EACH Department
        - Each Department Node is the TOP person in that department, with subordinates as their children in a vertical chain
        
        **Instructions:**
        1. **Find the Root**: Identify "Executive Chef" (or misspelled "EXCUTIVE CHEF") as the single Root.
        2. **Find Exec Sous**: Identify "Executive Sous Chef" as the ONLY child of Root.
        3. **Group by Department**: All remaining staff MUST be grouped into departments.
        4. **Group by Shift**: Within each department, create shift nodes (Morning/Afternoon/Night based on staff.shift field).
        5. **Vertical Stacking**: Within each shift, create a vertical chain sorted by rank.
        6. **Output**: Return a SINGLE valid JSON object.

        **Example Structure:**
        {
          "name": "Howard", "role": "Executive Chef",
          "children": [{
            "name": "Anandhan", "role": "Executive Sous Chef",
            "children": [
              { "name": "Essam", "role": "Head Pastry Chef", "children": [/* Pastry staff */] },
              { "name": "John", "role": "Sous Chef", "children": [/* Hot Kitchen staff */] }
            ]
          }]
        }
        
        Return ONLY valid JSON.
        `;

        try {
            // Using Google Gemini 2.0 Flash (fast, intelligent, great for hierarchy construction)
            const responseText = await this.sendMessage(prompt, "Hierarchy Construction", "google/gemini-2.0-flash-exp:free");

            // Check for AI Error Strings
            if (responseText.startsWith("❌") || responseText.startsWith("⚠")) {
                console.warn("AI returned error, using fallback.", responseText);
                return buildLocalFallback();
            }

            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const hierarchy = JSON.parse(cleanJson);
            return hierarchy;
        } catch (error) {
            console.error("Sid Hierarchy Error, switching to fallback:", error);
            return buildLocalFallback();
        }
    }
}

export const aiService = new AIService();
