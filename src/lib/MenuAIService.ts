import { aiService } from './aiService';

interface MenuItem {
  name: string;
  allergens?: string[];
}

interface MenuMeal {
  [category: string]: MenuItem[];
}

interface MenuDayData {
  breakfast: MenuMeal;
  lunch: MenuMeal;
  dinner: MenuMeal;
}

interface MenuData {
  loaded_at: string;
  source_file: string;
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

  setMenuData(data: MenuData) {
    this.currentMenu = data;
    this.generateSystemPrompt();
  }

  getCurrentMenu(): MenuData | null {
    return this.currentMenu;
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

    const menuDataJson = JSON.stringify(this.currentMenu.days, null, 2);

    this.systemPrompt = `# TROJENA Menu Assistant - Complete 28-Day Menu Cycle

You are an expert menu assistant with access to TROJENA's complete 28-Day Menu Cycle (28DMC).

## ALLERGEN CODES REFERENCE
${allergenCodesList}

## KEY INFORMATION
- Menu cycles every 28 days (Dec 14 - Jan 10)
- Three meals daily: Breakfast, Lunch, Dinner
- Each item may include allergen codes in parentheses
- Weeks are organized in the data structure below

## HOW TO ANSWER QUESTIONS
1. **Specific Day Queries**: Reference the exact day number (1-28) and meal period
2. **Allergen Questions**: Always mention which allergens (codes) are in/not in items
3. **Dietary Restrictions**: Filter by allergen codes to provide safe options
4. **Menu Rotations**: Highlight which items appear multiple times in the cycle
5. **Special Events**: Note Christmas (Day 15), New Year's (Days 21-22)

## RESPONSE FORMAT
- For day queries: List items organized by category
- Always include allergen codes in parentheses when listing items
- Be specific about which meal (breakfast/lunch/dinner)
- Suggest alternatives if items contain allergens

## COMPLETE MENU DATA
\`\`\`json
${menuDataJson}
\`\`\`

Now help the user with their menu questions. Be thorough, organized, and always mention allergens.`;
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
            days: {}
          };

          // Initialize all 28 days
          for (let i = 1; i <= 28; i++) {
            menuData.days[i] = {
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
              this.parseWeekSheet(json, menuData);
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

  private parseWeekSheet(rows: any[][], menuData: MenuData) {
    // Map to track: dayNum -> { lunch: colIdx, dinner: colIdx }
    const dayMealColumns: Map<number, { lunch?: number; dinner?: number }> = new Map();
    let contentStartRow = 0;

    // First pass: Find day headers and meal type indicators
    for (let rowIdx = 0; rowIdx < Math.min(10, rows.length); rowIdx++) {
      const row = rows[rowIdx];
      if (!row) continue;

      let foundDayHeaders = false;
      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const cell = this.cleanText(row[colIdx]) || '';
        const dayMatch = cell.match(/DAY\s*(\d+)/i);

        if (dayMatch) {
          const dayNum = parseInt(dayMatch[1]);
          if (!dayMealColumns.has(dayNum)) {
            dayMealColumns.set(dayNum, {});
          }
          foundDayHeaders = true;
        }
      }

      // Look ahead one row for LUNCH/DINNER labels
      if (foundDayHeaders && rowIdx + 1 < rows.length) {
        const nextRow = rows[rowIdx + 1];
        if (nextRow) {
          for (let colIdx = 0; colIdx < Math.min(nextRow.length, row.length); colIdx++) {
            const cell = this.cleanText(row[colIdx]) || '';
            const dayMatch = cell.match(/DAY\s*(\d+)/i);

            if (dayMatch) {
              const dayNum = parseInt(dayMatch[1]);
              const mealCell = this.cleanText(nextRow[colIdx]) || '';

              if (mealCell.toUpperCase().includes('LUNCH')) {
                const existing = dayMealColumns.get(dayNum) || {};
                existing.lunch = colIdx;
                dayMealColumns.set(dayNum, existing);
              } else if (mealCell.toUpperCase().includes('DINNER')) {
                const existing = dayMealColumns.get(dayNum) || {};
                existing.dinner = colIdx;
                dayMealColumns.set(dayNum, existing);
              }
            }
          }
        }
        contentStartRow = rowIdx + 2;
      }
    }

    // If no explicit lunch/dinner columns found, assume alternating or same column
    if (dayMealColumns.size === 0) {
      return; // No days found, skip this sheet
    }

    // Second pass: extract items
    let currentCategory: string | null = null;

    for (let rowIdx = Math.max(contentStartRow, 5); rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      if (!row || row.length === 0) continue;

      const firstCell = this.cleanText(row[0]);

      // Skip empty rows and headers
      if (!firstCell) continue;
      if (firstCell.toUpperCase().includes('DAY') ||
          firstCell.toUpperCase().includes('LUNCH') ||
          firstCell.toUpperCase().includes('DINNER')) {
        continue;
      }

      // Detect category changes (first column has text, rest mostly empty = category header)
      const nonEmptyCount = row.slice(1).filter(cell => this.cleanText(cell)).length;
      if (firstCell && nonEmptyCount <= 2) {
        currentCategory = firstCell;
        continue;
      }

      // Extract items for this row across all days
      if (currentCategory) {
        for (const [dayNum, mealCols] of dayMealColumns.entries()) {
          // Try lunch column
          if (mealCols.lunch !== undefined && mealCols.lunch < row.length) {
            const itemText = this.cleanText(row[mealCols.lunch]);
            if (itemText) {
              this.addMenuItem(menuData.days[dayNum], 'lunch', currentCategory, itemText);
            }
          }

          // Try dinner column (might be same as lunch if not separated)
          if (mealCols.dinner !== undefined && mealCols.dinner < row.length) {
            const itemText = this.cleanText(row[mealCols.dinner]);
            if (itemText && itemText !== this.cleanText(row[mealCols.lunch || mealCols.dinner])) {
              this.addMenuItem(menuData.days[dayNum], 'dinner', currentCategory, itemText);
            }
          }

          // If only one column per day, assume it applies to lunch
          if (!mealCols.lunch && !mealCols.dinner) {
            for (let colIdx = 1; colIdx < row.length; colIdx++) {
              const itemText = this.cleanText(row[colIdx]);
              if (itemText) {
                this.addMenuItem(menuData.days[dayNum], 'lunch', currentCategory, itemText);
              }
            }
          }
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
