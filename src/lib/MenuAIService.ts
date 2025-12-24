import { aiService } from './aiService';

interface MenuDay {
  day: number;
  date?: string;
  breakfast?: {
    hotEgg?: string;
    asian?: string;
    pancake?: string;
  };
  lunch?: {
    leafSalad?: string;
    grainSalad?: string;
    mixedSalad?: string;
  };
}

interface MenuData {
  cycleType: string;
  month: string;
  allergenCodes: Record<string, string>;
  days: MenuDay[];
  uploadedAt?: string;
  fileName?: string;
}

class MenuAIService {
  private currentMenu: MenuData | null = null;
  private menuDataForAI: string = '';

  setMenuData(data: MenuData) {
    this.currentMenu = data;
    this.buildAIContext();
  }

  getCurrentMenu(): MenuData | null {
    return this.currentMenu;
  }

  private buildAIContext() {
    if (!this.currentMenu) return;

    const menuText = `
CURRENT MENU CYCLE: ${this.currentMenu.cycleType}
PERIOD: ${this.currentMenu.month}
UPLOADED: ${this.currentMenu.uploadedAt}
SOURCE: ${this.currentMenu.fileName}

ALLERGEN CODES:
${Object.entries(this.currentMenu.allergenCodes)
  .map(([code, name]) => `- ${code} = ${name}`)
  .join('\n')}

MENU SCHEDULE:
${this.currentMenu.days
  .map(
    day => `
Day ${day.day}${day.date ? ` (${day.date})` : ''}:
${
  day.breakfast
    ? `BREAKFAST:
  - Hot Egg Dish: ${day.breakfast.hotEgg || 'N/A'}
  - Asian: ${day.breakfast.asian || 'N/A'}
  - Pancake: ${day.breakfast.pancake || 'N/A'}`
    : ''
}
${
  day.lunch
    ? `LUNCH:
  - Leaf Salad: ${day.lunch.leafSalad || 'N/A'}
  - Grain Salad: ${day.lunch.grainSalad || 'N/A'}
  - Mixed Salad: ${day.lunch.mixedSalad || 'N/A'}`
    : ''
}
`
  )
  .join('\n')}
`;

    this.menuDataForAI = menuText;
  }

  async queryMenu(question: string): Promise<string> {
    if (!this.currentMenu || !this.menuDataForAI) {
      return 'No menu data loaded. Please upload a menu file first.';
    }

    const prompt = `You are a helpful menu assistant for TROJENA kitchen operations.
You have access to the complete 28-day menu cycle with allergen information.

CONTEXT - COMPLETE MENU DATA:
${this.menuDataForAI}

USER QUESTION: ${question}

Please answer the question based on the menu data above. If the question is about a specific day, date, or meal period, search through the menu data carefully.
Always mention allergen codes when relevant (e.g., "MI" for milk, "GL" for gluten, etc.).
Be helpful and specific with day numbers and dates when possible.`;

    try {
      const response = await aiService.sendMessage(
        prompt,
        'Menu Query Assistant',
        undefined,
        2048
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

  parseMenuFromText(text: string): MenuData {
    const lines = text.split('\n');
    const menuData: MenuData = {
      cycleType: '28-Day Menu Cycle',
      month: '',
      allergenCodes: {
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
      },
      days: []
    };

    const dayPattern = /^### Day (\d+)/;
    let currentDay: MenuDay | null = null;

    for (const line of lines) {
      const dayMatch = line.match(dayPattern);
      if (dayMatch) {
        if (currentDay && currentDay.day) {
          menuData.days.push(currentDay);
        }
        currentDay = {
          day: parseInt(dayMatch[1]),
          breakfast: {},
          lunch: {}
        };
        continue;
      }

      if (!currentDay) continue;

      if (line.includes('Hot Egg:') || line.includes('- Hot Egg')) {
        const match = line.match(/Hot Egg[^:]*:\s*(.+)/);
        if (match && currentDay.breakfast) {
          currentDay.breakfast.hotEgg = match[1].trim();
        }
      }
      if (line.includes('Asian:') || line.includes('- Asian')) {
        const match = line.match(/Asian[^:]*:\s*(.+)/);
        if (match && currentDay.breakfast) {
          currentDay.breakfast.asian = match[1].trim();
        }
      }
      if (line.includes('Pancake:') || line.includes('- Pancake')) {
        const match = line.match(/Pancake[^:]*:\s*(.+)/);
        if (match && currentDay.breakfast) {
          currentDay.breakfast.pancake = match[1].trim();
        }
      }

      if (line.includes('Leaf:') || line.includes('- Leaf')) {
        const match = line.match(/Leaf[^:]*:\s*(.+)/);
        if (match && currentDay.lunch) {
          currentDay.lunch.leafSalad = match[1].trim();
        }
      }
      if (line.includes('Grain:') || line.includes('- Grain')) {
        const match = line.match(/Grain[^:]*:\s*(.+)/);
        if (match && currentDay.lunch) {
          currentDay.lunch.grainSalad = match[1].trim();
        }
      }
      if (line.includes('Mixed:') || line.includes('- Mixed')) {
        const match = line.match(/Mixed[^:]*:\s*(.+)/);
        if (match && currentDay.lunch) {
          currentDay.lunch.mixedSalad = match[1].trim();
        }
      }
    }

    if (currentDay && currentDay.day) {
      menuData.days.push(currentDay);
    }

    return menuData;
  }

  async parseMenuFromFile(file: File): Promise<MenuData> {
    const XLSX = await import('xlsx');

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet);

          const menuData = this.parseMenuJSON(json as any[]);
          menuData.uploadedAt = new Date().toLocaleString();
          menuData.fileName = file.name;

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

  private parseMenuJSON(data: any[]): MenuData {
    const menuData: MenuData = {
      cycleType: '28-Day Menu Cycle',
      month: 'December 2025 - January 2026',
      allergenCodes: {
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
      },
      days: []
    };

    const dayMap = new Map<number, MenuDay>();

    for (const row of data) {
      if (!row || typeof row !== 'object') continue;

      const dayNum = parseInt(Object.keys(row)[0] || '0');
      if (isNaN(dayNum) || dayNum < 1 || dayNum > 28) continue;

      if (!dayMap.has(dayNum)) {
        dayMap.set(dayNum, { day: dayNum, breakfast: {}, lunch: {} });
      }

      const day = dayMap.get(dayNum)!;

      for (const [key, value] of Object.entries(row)) {
        const lowerKey = String(key).toLowerCase();
        const strValue = String(value || '');

        if (lowerKey.includes('hot egg') || lowerKey.includes('breakfast egg')) {
          day.breakfast!.hotEgg = strValue;
        }
        if (lowerKey.includes('asian') && lowerKey.includes('breakfast')) {
          day.breakfast!.asian = strValue;
        }
        if (lowerKey.includes('pancake') || lowerKey.includes('waffle')) {
          day.breakfast!.pancake = strValue;
        }

        if (
          lowerKey.includes('leaf') ||
          lowerKey.includes('salad 1') ||
          lowerKey.includes('lunch salad')
        ) {
          day.lunch!.leafSalad = strValue;
        }
        if (
          lowerKey.includes('grain') ||
          lowerKey.includes('salad 2') ||
          lowerKey.includes('starch salad')
        ) {
          day.lunch!.grainSalad = strValue;
        }
        if (lowerKey.includes('mixed') || lowerKey.includes('salad 3')) {
          day.lunch!.mixedSalad = strValue;
        }
      }
    }

    menuData.days = Array.from(dayMap.values()).sort((a, b) => a.day - b.day);
    return menuData;
  }

  getMenuSummary(): string {
    if (!this.currentMenu || this.currentMenu.days.length === 0) {
      return 'No menu data loaded';
    }

    const dayCount = this.currentMenu.days.length;
    return `Menu loaded: ${this.currentMenu.cycleType} (${dayCount} days) - ${this.currentMenu.uploadedAt}`;
  }
}

export const menuAIService = new MenuAIService();
