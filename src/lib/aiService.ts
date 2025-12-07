import { GoogleGenerativeAI } from "@google/generative-ai";

class AIService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;

    init() {
        const key = localStorage.getItem('GOOGLE_GEMINI_KEY');
        if (key) {
            this.genAI = new GoogleGenerativeAI(key);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        }
    }

    async sendMessage(prompt: string, context: string = ''): Promise<string> {
        if (!this.model) this.init();
        if (!this.model) return "⚠️ AI not configured. Please add your Gemini Key in Settings.";

        try {
            // Simple prompt engineering
            const systemPrompt = `You are a helpful kitchen assistant named 'ChefBrain'. 
            Your user is a busy professional Chef. keep answers short and actionable.
            Context: ${context}
            User: ${prompt}`;

            const result = await this.model.generateContent(systemPrompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("AI Error:", error);
            return "❌ AI Error: " + (error as any).message;
        }
    }
}

export const aiService = new AIService();
