import { aiService } from './aiService';

interface MenuItem {
  name: string;
  allergens?: string[];
}

interface MenuMeal {
  [category: string]: MenuItem[];
}

interface DateInfo {
  day_of_week: string;
  month: string;
  day: number;
  formatted: string;
  short: string;
}

interface MenuDayData {
  date_info?: DateInfo | null;
  breakfast: MenuMeal;
  lunch: MenuMeal;
  dinner: MenuMeal;
}

interface MenuData {
  loaded_at: string;
  source_file: string;
  date_mapping?: Record<string, DateInfo>;
  days: {
    [day: number]: MenuDayData;
  };
}

class MenuAIService {
  private currentMenu: MenuData | null = null;
  private systemPrompt: string = '';

  private allergenCodes: Record<string, string> = {
    MI: 'Milk/Dairy',
    EG: 'Eggs',
    SE: 'Sesame',
    GL: 'Gluten',
    TN: 'Tree Nuts',
    PE: 'Peanuts',
    FI: 'Fish',
    SO: 'Soy',
    MU: 'Mustard',
    CE: 'Celery',
    SU: 'Sulphites',
    CR: 'Crustaceans'
  };

  private defaultDateMapping: Record<string, DateInfo> = {
    '1': { day_of_week: 'Thursday', month: 'January', day: 8, formatted: 'Thursday, January 8', short: 'Jan 8' },
    '2': { day_of_week: 'Friday', month: 'January', day: 9, formatted: 'Friday, January 9', short: 'Jan 9' },
    '3': { day_of_week: 'Saturday', month: 'January', day: 10, formatted: 'Saturday, January 10', short: 'Jan 10' },
    '4': { day_of_week: 'Sunday', month: 'December', day: 14, formatted: 'Sunday, December 14', short: 'Dec 14' },
    '5': { day_of_week: 'Monday', month: 'December', day: 15, formatted: 'Monday, December 15', short: 'Dec 15' },
    '6': { day_of_week: 'Tuesday', month: 'December', day: 16, formatted: 'Tuesday, December 16', short: 'Dec 16' },
    '7': { day_of_week: 'Wednesday', month: 'December', day: 17, formatted: 'Wednesday, December 17', short: 'Dec 17' },
    '8': { day_of_week: 'Thursday', month: 'December', day: 18, formatted: 'Thursday, December 18', short: 'Dec 18' },
    '9': { day_of_week: 'Friday', month: 'December', day: 19, formatted: 'Friday, December 19', short: 'Dec 19' },
    '10': { day_of_week: 'Saturday', month: 'December', day: 20, formatted: 'Saturday, December 20', short: 'Dec 20' },
    '11': { day_of_week: 'Sunday', month: 'December', day: 21, formatted: 'Sunday, December 21', short: 'Dec 21' },
    '12': { day_of_week: 'Monday', month: 'December', day: 22, formatted: 'Monday, December 22', short: 'Dec 22' },
    '13': { day_of_week: 'Tuesday', month: 'December', day: 23, formatted: 'Tuesday, December 23', short: 'Dec 23' },
    '14': { day_of_week: 'Wednesday', month: 'December', day: 24, formatted: 'Wednesday, December 24', short: 'Dec 24' },
    '15': { day_of_week: 'Thursday', month: 'December', day: 25, formatted: 'Thursday, December 25', short: 'Dec 25' },
    '16': { day_of_week: 'Friday', month: 'December', day: 26, formatted: 'Friday, December 26', short: 'Dec 26' },
    '17': { day_of_week: 'Saturday', month: 'December', day: 27, formatted: 'Saturday, December 27', short: 'Dec 27' },
    '18': { day_of_week: 'Sunday', month: 'December', day: 28, formatted: 'Sunday, December 28', short: 'Dec 28' },
    '19': { day_of_week: 'Monday', month: 'December', day: 29, formatted: 'Monday, December 29', short: 'Dec 29' },
    '20': { day_of_week: 'Tuesday', month: 'December', day: 30, formatted: 'Tuesday, December 30', short: 'Dec 30' },
    '21': { day_of_week: 'Wednesday', month: 'December', day: 31, formatted: 'Wednesday, December 31', short: 'Dec 31' },
    '22': { day_of_week: 'Thursday', month: 'January', day: 1, formatted: 'Thursday, January 1', short: 'Jan 1' },
    '23': { day_of_week: 'Friday', month: 'January', day: 2, formatted: 'Friday, January 2', short: 'Jan 2' },
    '24': { day_of_week: 'Saturday', month: 'January', day: 3, formatted: 'Saturday, January 3', short: 'Jan 3' },
    '26': { day_of_week: 'Monday', month: 'January', day: 5, formatted: 'Monday, January 5', short: 'Jan 5' },
    '27': { day_of_week: 'Tuesday', month: 'January', day: 6, formatted: 'Tuesday, January 6', short: 'Jan 6' },
    '28': { day_of_week: 'Wednesday', month: 'January', day: 7, formatted: 'Wednesday, January 7', short: 'Jan 7' }
  };

  setMenuData(data: MenuData) {
    this.currentMenu = data;
    this.generateSystemPrompt();
  }

  getCurrentMenu(): MenuData | null {
    return this.currentMenu;
  }

  getTodaysDayNumber(): number {
    if (!this.currentMenu) return 1;
    const today = new Date();
    const dateMapping = this.currentMenu.date_mapping || this.defaultDateMapping;

    for (const [dayStr, dateInfo] of Object.entries(dateMapping)) {
      const dayNum = parseInt(dayStr);
      const date = new Date(today.getFullYear(), this.getMonthIndex(dateInfo.month), dateInfo.day);

      if (date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth()) {
        return dayNum;
      }
    }

    return 1;
  }

  private getMonthIndex(monthName: string): number {
    const months: Record<string, number> = {
      'January': 0, 'February': 1, 'March': 2, 'April': 3,
      'May': 4, 'June': 5, 'July': 6, 'August': 7,
      'September': 8, 'October': 9, 'November': 10, 'December': 11
    };
    return months[monthName] || 0;
  }

  getTodaysMenu(): MenuData | null {
    if (!this.currentMenu) return null;
    const dayNum = this.getTodaysDayNumber();
    return {
      ...this.currentMenu,
      days: {
        [dayNum]: this.currentMenu.days[dayNum]
      }
    };
  }

  private extractAllergens(text: string): { allergens: string[] | null; cleanName: string } {
    const allergenMatch = text.match(/\(([A-Z,\s]+)\)\s*$/);
    if (allergenMatch) {
      const allergens = allergenMatch[1].split(',').map(a => a.trim());
      const cleanName = text.substring(0, allergenMatch.index).trim();
      return { allergens, cleanName };
    }
    return { allergens: null, cleanName: text };
  }

  private generateSystemPrompt() {
    if (!this.currentMenu) return;

    const allergenCodesList = Object.entries(this.allergenCodes)
      .map(([code, name]) => `${code}=${name}`)
      .join(', ');

    const dateMapping = this.currentMenu.date_mapping || this.defaultDateMapping;
    const dateMapList = Object.entries(dateMapping)
      .map(([day, info]) => `- Day ${day} = ${info.formatted}`)
      .join('\n');

    const todayDayNum = this.getTodaysDayNumber();
    const todayDateInfo = dateMapping[String(todayDayNum)];
    const todayDateStr = todayDateInfo ? `Today is Day ${todayDayNum} (${todayDateInfo.formatted})` : `Today's menu is available`;

    const menuDataJson = JSON.stringify(this.currentMenu.days, null, 2);

    this.systemPrompt = `# TROJENA Menu Assistant (with Date Support)

You are a menu assistant for TROJENA's 28-Day Menu Cycle. You can answer questions using EITHER day numbers OR actual dates.

## TODAY'S DATE

${todayDateStr}

When users ask "what's for today" or "today's menu", refer to this date.

## DATE MAPPING

Users can ask using:
- Day numbers: "Day 5", "Day 12"
- Full dates: "December 14", "December 25"
- Short dates: "Dec 14", "Dec 25"
- Day + Date: "What's for lunch on Sunday December 14?"

## CURRENT DATE MAPPING:

${dateMapList}

## ALLERGEN CODES
${allergenCodesList}

## RESPONSE FORMAT

When answering:
1. **Confirm the date**: "On Day 5 (Monday, December 15)..."
2. **List key items by category**
3. **Always include allergen codes**

## EXAMPLE RESPONSES

**Q: "What's for breakfast on December 14?"**
A: "On Day 4 (Sunday, December 14), breakfast includes:
- Category 1: Item Name (AL, LE)
- Category 2: Item Name
..."

**Q: "What's for lunch on Christmas Day?"**
A: "On Day 15 (Thursday, December 25), lunch features:
- Category 1: Item Name (AL)
- Category 2: Item Name
..."

## COMPLETE MENU DATA

\`\`\`json
${menuDataJson}
\`\`\`

Now help the user with their menu questions. Be thorough, organized, and always mention allergens when relevant.`;
  }

  async queryMenu(question: string): Promise<string> {
    if (!this.currentMenu || !this.systemPrompt) {
      return 'No menu data loaded. Please upload a menu file first.';
    }

    try {
      const response = await aiService.sendMessage(
        question,
        this.systemPrompt,
        undefined,
        3000
      );

      if (response.startsWith('❌') || response.startsWith('⚠️')) {
        return `Could not query menu: ${response}`;
      }

      return response;
    } catch (error) {
      console.error('Menu AI Query Error:', error);
      return `Error querying menu: ${(error as any).message}`;
    }
  }

  async parseMenuFromFile(file: File): Promise<MenuData> {
    const XLSX = await import('xlsx');

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });

          const menuData: MenuData = {
            loaded_at: new Date().toISOString(),
            source_file: file.name,
            date_mapping: this.defaultDateMapping,
            days: {}
          };

          // Initialize all 28 days with date info
          for (let i = 1; i <= 28; i++) {
            menuData.days[i] = {
              date_info: this.defaultDateMapping[String(i)] || null,
              breakfast: {},
              lunch: {},
              dinner: {}
            };
          }

          // Process each sheet
          for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

            if (sheetName.toLowerCase().includes('breakfast')) {
              this.parseBreakfastSheet(json, menuData);
            } else if (sheetName.toLowerCase().includes('week') || sheetName.toLowerCase().includes('lunch') || sheetName.toLowerCase().includes('dinner')) {
              this.parseWeekSheet(json, menuData, sheetName);
            }
          }

          resolve(menuData);
        } catch (error) {
          reject(new Error(`Failed to parse menu file: ${(error as any).message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsBinaryString(file);
    });
  }

  private cleanText(text: any): string | null {
    if (!text) return null;
    let str = String(text).trim();
    str = str.replace(/\s+/g, ' ');
    if (str === '' || str.toLowerCase() === 'nan') return null;
    return str;
  }

  private parseBreakfastSheet(rows: any[][], menuData: MenuData) {
    // Find where actual data starts (skip headers)
    let dataStartRow = 0;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const row = rows[i];
      if (row && row.length > 2) {
        // Check if row contains numeric indicators of days
        const hasNumbers = row.some(cell => {
          const text = this.cleanText(cell);
          return text && /^(Day|1|2|3|4|5|6|7)/.test(text);
        });
        if (hasNumbers) {
          dataStartRow = i + 1;
          break;
        }
      }
    }

    let currentMainCat: string | null = null;

    for (let rowIdx = dataStartRow; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      if (!row || row.length < 2) continue;

      const col0 = this.cleanText(row[0]);
      const col1 = this.cleanText(row[1]);

      // Track main category
      if (col0 && !col1) {
        currentMainCat = col0;
        continue;
      }

      const categoryKey = col1 || col0 || currentMainCat;
      if (!categoryKey) continue;

      // Breakfast items start from column 2
      // Assuming 4 weeks with 7 days each = 28 days
      let itemCount = 0;
      for (let colIdx = 2; colIdx < Math.min(row.length, 30); colIdx++) {
        const itemText = this.cleanText(row[colIdx]);
        if (itemText) {
          const dayNum = colIdx - 1; // Column 2 = Day 1, Column 3 = Day 2, etc.
          if (dayNum >= 1 && dayNum <= 28) {
            this.addMenuItem(menuData.days[dayNum], 'breakfast', categoryKey, itemText);
            itemCount++;
          }
        }
      }

      // If we found items, don't treat this as a category header next time
      if (itemCount === 0 && col0) {
        currentMainCat = col0;
      }
    }
  }

  private parseWeekSheet(rows: any[][], menuData: MenuData, sheetName: string) {
    // Determine meal type from sheet name
    const mealType: 'lunch' | 'dinner' = sheetName.toLowerCase().includes('dinner') ? 'dinner' : 'lunch';

    // Find where data starts (skip headers)
    let dataStartRow = 0;
    const dayColumns: Map<number, number> = new Map();

    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const row = rows[i];
      if (!row) continue;

      // Look for DAY headers
      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const cell = this.cleanText(row[colIdx]) || '';
        const dayMatch = cell.match(/DAY\s*(\d+)/i);
        if (dayMatch) {
          const dayNum = parseInt(dayMatch[1]);
          dayColumns.set(dayNum, colIdx);
        }
      }

      // Check if this row has day indicators
      const hasDay = row.some(cell => {
        const text = this.cleanText(cell);
        return text && /^DAY\s*\d+/i.test(text);
      });

      if (hasDay) {
        dataStartRow = i + 1;
      }
    }

    // If we found day columns, extract items
    if (dayColumns.size > 0) {
      let currentMainCat: string | null = null;

      for (let rowIdx = dataStartRow; rowIdx < rows.length; rowIdx++) {
        const row = rows[rowIdx];
        if (!row || row.length < 2) continue;

        const col0 = this.cleanText(row[0]);
        const col1 = this.cleanText(row[1]);

        // Skip headers and empty rows
        if (!col0) continue;
        if (col0.toUpperCase().includes('DAY') ||
            col0.toUpperCase().includes('LUNCH') ||
            col0.toUpperCase().includes('DINNER')) {
          continue;
        }

        // Track main category (column 0 only, no column 1)
        if (col0 && !col1) {
          currentMainCat = col0;
          continue;
        }

        const categoryKey = col1 || col0 || currentMainCat;
        if (!categoryKey) continue;

        // Extract items from day columns
        let itemCount = 0;
        for (const [dayNum, colIdx] of dayColumns.entries()) {
          if (colIdx < row.length) {
            const itemText = this.cleanText(row[colIdx]);
            if (itemText) {
              this.addMenuItem(menuData.days[dayNum], mealType, categoryKey, itemText);
              itemCount++;
            }
          }
        }

        // If we found items, don't treat this as a category header next time
        if (itemCount === 0 && col0) {
          currentMainCat = col0;
        }
      }
    }
  }

  private addMenuItem(dayData: MenuDayData, meal: 'breakfast' | 'lunch' | 'dinner', category: string, itemText: string) {
    const { allergens, cleanName } = this.extractAllergens(itemText);

    if (!dayData[meal][category]) {
      dayData[meal][category] = [];
    }

    const item: MenuItem = {
      name: cleanName
    };

    if (allergens && allergens.length > 0) {
      item.allergens = allergens;
    }

    dayData[meal][category].push(item);
  }

  getMenuSummary(): string {
    if (!this.currentMenu) {
      return 'No menu data loaded';
    }

    const dayCount = Object.keys(this.currentMenu.days).length;
    const itemsLoaded = Object.values(this.currentMenu.days).reduce((acc, day) => {
      return acc +
        Object.values(day.breakfast).reduce((a, b) => a + b.length, 0) +
        Object.values(day.lunch).reduce((a, b) => a + b.length, 0) +
        Object.values(day.dinner).reduce((a, b) => a + b.length, 0);
    }, 0);

    return `Menu loaded: ${dayCount} days, ${itemsLoaded} items - ${new Date(this.currentMenu.loaded_at).toLocaleString()}`;
  }
}

export const menuAIService = new MenuAIService();
