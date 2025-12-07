# 🤖 AI Bot Assistant Development Plan

## 🎯 Objective
Transform the current text-based command bar into a fully "Agentic" Kitchen Assistant capable of understanding natural language, retrieving data (Recipes, Inventory), and performing actions (Creating Tasks, Scheduling).

## 🛠️ Phase 1: Robust Command System (The "Smart" Basics)
*Target: Immediate Stability*
Currently, the bot uses simple `if (text.includes('sync'))` logic. This is brittle.
**Action Plan:**
1.  **Implement a Command Registry:** A structured list of available valid commands.
2.  **Fuzzy Matching:** Allow "Import tasks", "Get tasks", "Sync my list" to all trigger the same function.
3.  **Help System:** Typing `help` should list available commands.
4.  **Feedback UI:** clearer success/error toasts instead of `alert()`.

## 🧠 Phase 2: Action Integration (Doing Real Work)
*Target: Deep Integration*
The bot needs to touch every part of the app.
**Capabilities to Add:**
- **"Add to Whiteboard":** *Command:* "Idea: new spring menu" -> Creates a Sticky Note on Whiteboard.
- **"Check Inventory":** *Command:* "Do we have milk?" -> Queries `inventory` table in Supabase.
- **"Scale Recipe":** *Command:* "Scale pasta for 50 pax" -> Opens scaling tool with preset values.

## 🚀 Phase 3: True AI (LLM Integration)
*Target: Natural Intelligence*
To handle complex queries like "Plan a menu for next week focused on seasonal vegetables", we need an LLM.
**Architecture Options:**
1.  **Chrome Built-in AI (Gemini Nano):** Free, local, private. (Best for this user).
2.  **Google Gemini API:** Requires API Key. Extremely powerful.
3.  **OpenAI API:** Requires API Key.

**Proposed Feature: "ChefBrain"**
- A setting to toggle "Enhanced AI".
- If enabled, the input is sent to the LLM to decide which function to call (Function Calling).

## 📅 Roadmap / Next Steps for You
1.  **Refactor `TopNav.tsx` logic** into a separate `AICore.ts` service.
2.  **Add `help` command** immediately so users know what to type.
3.  **Connect Whiteboard:** Allow creating notes from the bot.

---
**Technical Note:**
We will assume the privacy-first approach (Scenario 1 or 2) where keys are stored locally or we use browser capabilities.
