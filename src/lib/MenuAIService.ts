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
    let currentCategory: string | null = null;

    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      if (!row || row.length < 2) continue;

      const mainCat = this.cleanText(row[0]);
      const subCat = this.cleanText(row[1]);

      if (mainCat) {
        currentCategory = mainCat;
      }

      const categoryKey = subCat || currentCategory;
      if (!categoryKey) continue;

      // Breakfast data typically starts from column 2
      for (let dayIdx = 1; dayIdx <= 28; dayIdx++) {
        const colIdx = dayIdx + 1;
        if (colIdx >= row.length) continue;

        const itemText = this.cleanText(row[colIdx]);
        if (itemText) {
          this.addMenuItem(menuData.days[dayIdx], 'breakfast', categoryKey, itemText);
        }
      }
    }
  }

  private parseWeekSheet(rows: any[][], menuData: MenuData) {
    let currentDay: number | null = null;
    let currentMeal: 'lunch' | 'dinner' = 'lunch';
    let currentCategory: string | null = null;

    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      if (!row || row.length < 1) continue;

      // Check for day/meal headers
      const firstCell = this.cleanText(row[0]) || '';
      const upperFirst = firstCell.toUpperCase();

      if (upperFirst.includes('DAY')) {
        const dayMatch = firstCell.match(/DAY\s*(\d+)/i);
        if (dayMatch) {
          currentDay = parseInt(dayMatch[1]);
        }
      }

      if (upperFirst.includes('LUNCH')) {
        currentMeal = 'lunch';
      } else if (upperFirst.includes('DINNER')) {
        currentMeal = 'dinner';
      }

      if (currentDay && (upperFirst.includes('BREAKFAST') || upperFirst.includes('LUNCH') || upperFirst.includes('DINNER'))) {
        const mealMatch = firstCell.match(/(breakfast|lunch|dinner)/i);
        if (mealMatch) {
          currentMeal = mealMatch[1].toLowerCase() as 'lunch' | 'dinner';
        }
      }

      // Check for category header
      if (firstCell && !upperFirst.includes('DAY') && !upperFirst.includes('LUNCH') && !upperFirst.includes('DINNER')) {
        currentCategory = firstCell;
      }

      // Add items
      if (currentDay && currentCategory) {
        for (let colIdx = 1; colIdx < row.length; colIdx++) {
          const itemText = this.cleanText(row[colIdx]);
          if (itemText) {
            // Try to map column to a day
            const dayToAdd = currentDay + (colIdx - 1);
            if (dayToAdd >= 1 && dayToAdd <= 28) {
              this.addMenuItem(menuData.days[dayToAdd], currentMeal, currentCategory, itemText);
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
