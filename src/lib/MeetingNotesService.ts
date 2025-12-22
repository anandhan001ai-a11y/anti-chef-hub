// Meeting Notes Service - Voice recording, transcription & AI summarization
import { supabase } from './supabase';

export interface MeetingNote {
    id: string;
    channel_id?: string;
    title: string;
    audio_url?: string;
    transcript: string;
    summary?: string;
    action_items?: ActionItem[];
    duration: number;
    recorded_by: string;
    created_at: string;
    status: 'recording' | 'transcribing' | 'summarizing' | 'complete';
}

export interface ActionItem {
    id: string;
    task: string;
    assignee: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: string;
    created: boolean;
}

class MeetingNotesService {
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private recognition: any = null;
    private currentTranscript: string = '';
    private recordingStartTime: number = 0;

    // Check if Speech Recognition is available
    isSpeechRecognitionAvailable(): boolean {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }

    // Start recording with live transcription
    async startRecording(onTranscriptUpdate?: (text: string) => void): Promise<boolean> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            this.currentTranscript = '';
            this.recordingStartTime = Date.now();

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.audioChunks.push(e.data);
                }
            };

            this.mediaRecorder.start(1000); // Collect data every second

            // Start speech recognition for live transcription
            if (this.isSpeechRecognitionAvailable()) {
                const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = true;
                this.recognition.interimResults = true;
                this.recognition.lang = 'en-US';

                this.recognition.onresult = (event: any) => {
                    let interim = '';
                    let final = '';

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            final += transcript + ' ';
                        } else {
                            interim += transcript;
                        }
                    }

                    if (final) {
                        this.currentTranscript += final;
                    }

                    if (onTranscriptUpdate) {
                        onTranscriptUpdate(this.currentTranscript + interim);
                    }
                };

                this.recognition.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                };

                this.recognition.start();
            }

            return true;
        } catch (err) {
            console.error('Error starting recording:', err);
            return false;
        }
    }

    // Stop recording and return the data
    async stopRecording(): Promise<{ audioBlob: Blob; transcript: string; duration: number } | null> {
        return new Promise((resolve) => {
            if (!this.mediaRecorder) {
                resolve(null);
                return;
            }

            const duration = Math.floor((Date.now() - this.recordingStartTime) / 1000);

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

                // Stop speech recognition
                if (this.recognition) {
                    this.recognition.stop();
                    this.recognition = null;
                }

                // Stop all tracks
                this.mediaRecorder?.stream.getTracks().forEach(track => track.stop());

                resolve({
                    audioBlob,
                    transcript: this.currentTranscript.trim(),
                    duration
                });
            };

            this.mediaRecorder.stop();
        });
    }

    // Cancel recording
    cancelRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        if (this.recognition) {
            this.recognition.stop();
            this.recognition = null;
        }
        this.audioChunks = [];
        this.currentTranscript = '';
    }

    // Get AI summary using Gemini
    async getSummary(transcript: string): Promise<string> {
        const geminiKey = localStorage.getItem('GOOGLE_GEMINI_KEY');

        if (!geminiKey || !transcript.trim()) {
            return this.generateLocalSummary(transcript);
        }

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `You are a professional meeting summarizer for a kitchen team. Summarize the following meeting transcript into clear, actionable bullet points. Focus on:
1. Key decisions made
2. Action items and who is responsible
3. Important updates or announcements
4. Any deadlines mentioned

Keep it concise and professional. If the transcript is short or unclear, provide a brief summary of what was discussed.

TRANSCRIPT:
${transcript}

SUMMARY:`
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.3,
                            maxOutputTokens: 500
                        }
                    })
                }
            );

            const data = await response.json();
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            }

            return this.generateLocalSummary(transcript);
        } catch (err) {
            console.error('Error getting AI summary:', err);
            return this.generateLocalSummary(transcript);
        }
    }

    // Fallback local summary when AI is not available
    private generateLocalSummary(transcript: string): string {
        if (!transcript.trim()) {
            return 'No speech detected during recording.';
        }

        const words = transcript.split(' ');
        const wordCount = words.length;

        // Extract potential action items (sentences with action words)
        const actionWords = ['need', 'must', 'should', 'will', 'prepare', 'check', 'make', 'order', 'clean', 'cook'];
        const sentences = transcript.split(/[.!?]+/).filter(s => s.trim());
        const actionItems = sentences.filter(s =>
            actionWords.some(w => s.toLowerCase().includes(w))
        ).slice(0, 3);

        let summary = `📝 **Meeting Brief** (${wordCount} words recorded)\n\n`;

        if (actionItems.length > 0) {
            summary += `**Key Points:**\n`;
            actionItems.forEach((item, i) => {
                summary += `${i + 1}. ${item.trim()}\n`;
            });
        } else {
            summary += `**Discussion:**\n${transcript.slice(0, 200)}${transcript.length > 200 ? '...' : ''}`;
        }

        return summary;
    }

    // Extract action items from transcript using AI
    async extractActionItems(transcript: string): Promise<ActionItem[]> {
        const geminiKey = localStorage.getItem('GOOGLE_GEMINI_KEY');

        if (!geminiKey || !transcript.trim()) {
            return this.extractLocalActionItems(transcript);
        }

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `You are an AI assistant for a kitchen team. Extract action items from this meeting transcript.

For each action item, identify:
1. The task to be done
2. Who should do it (use "Team" if unclear)
3. Priority (high/medium/low based on urgency words like "urgent", "ASAP", "today" = high)

Return ONLY a JSON array with this format, no other text:
[{"task": "task description", "assignee": "person name", "priority": "high|medium|low"}]

If no clear action items, return empty array: []

TRANSCRIPT:
${transcript}

JSON ARRAY:`
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.2,
                            maxOutputTokens: 500
                        }
                    })
                }
            );

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

            // Parse JSON from response
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const items = JSON.parse(jsonMatch[0]);
                return items.map((item: any, idx: number) => ({
                    id: `action-${Date.now()}-${idx}`,
                    task: item.task || 'Task',
                    assignee: item.assignee || 'Team',
                    priority: item.priority || 'medium',
                    created: false
                }));
            }

            return this.extractLocalActionItems(transcript);
        } catch (err) {
            console.error('Error extracting action items:', err);
            return this.extractLocalActionItems(transcript);
        }
    }

    // Local fallback for extracting action items
    private extractLocalActionItems(transcript: string): ActionItem[] {
        if (!transcript.trim()) return [];

        const actionWords = ['need to', 'must', 'should', 'will', 'has to', 'have to', 'please', 'make sure', 'don\'t forget'];
        const sentences = transcript.split(/[.!?]+/).filter(s => s.trim());

        const items: ActionItem[] = [];
        sentences.forEach((sentence, idx) => {
            const lower = sentence.toLowerCase();
            if (actionWords.some(w => lower.includes(w))) {
                // Try to extract assignee (look for names after "you", before "should/need/will")
                let assignee = 'Team';
                const nameMatch = sentence.match(/(\b[A-Z][a-z]+\b)/);
                if (nameMatch) {
                    assignee = nameMatch[1];
                }

                // Determine priority
                let priority: 'high' | 'medium' | 'low' = 'medium';
                if (lower.includes('urgent') || lower.includes('asap') || lower.includes('now') || lower.includes('immediately')) {
                    priority = 'high';
                } else if (lower.includes('when you can') || lower.includes('eventually')) {
                    priority = 'low';
                }

                items.push({
                    id: `action-${Date.now()}-${idx}`,
                    task: sentence.trim(),
                    assignee,
                    priority,
                    created: false
                });
            }
        });

        return items.slice(0, 5); // Max 5 items
    }

    // Save meeting note to Supabase
    async saveMeetingNote(note: Omit<MeetingNote, 'id' | 'created_at'>): Promise<MeetingNote | null> {
        try {
            localStorage.removeItem('meeting_notes');
        } catch {
        }

        const { data, error } = await supabase
            .from('meeting_notes')
            .insert(note)
            .select()
            .single();

        if (error) {
            console.error('Error saving meeting note:', error);
            return {
                ...note,
                id: `temp-${Date.now()}`,
                created_at: new Date().toISOString()
            } as MeetingNote;
        }

        return data;
    }

    // Get all meeting notes
    async getMeetingNotes(channelId?: string): Promise<MeetingNote[]> {
        let query = supabase.from('meeting_notes').select('*').order('created_at', { ascending: false });

        if (channelId) {
            query = query.eq('channel_id', channelId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching meeting notes:', error);
            return [];
        }

        return data || [];
    }

    // Get a single meeting brief
    async getMeetingBrief(noteId: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('meeting_notes')
            .select('summary, transcript')
            .eq('id', noteId)
            .maybeSingle();

        if (error || !data) {
            return null;
        }

        return data.summary || data.transcript;
    }
}

export const meetingNotesService = new MeetingNotesService();
export default meetingNotesService;
