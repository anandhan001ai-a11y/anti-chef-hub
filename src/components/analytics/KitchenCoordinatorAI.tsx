import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, StopCircle, Volume2, VolumeX, Bot } from 'lucide-react';
import { aiService } from '../../lib/aiService';
import { supabase } from '../../lib/supabase';
import { SidService } from '../../lib/SidService';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const KitchenCoordinatorAI: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const synth = window.speechSynthesis;

    const [rosterData, setRosterData] = useState<any>(null);

    // Initialize Christine & Fetch Roster
    useEffect(() => {
        const greeting = "Hello Chef, I am Christine, your Kitchen Coordinator. How can I assist you today?";
        addMessage('assistant', greeting);

        // Wait for voices to load before speaking initial greeting
        const speakGreeting = () => {
            const voices = synth.getVoices();
            if (voices.length > 0) {
                speak(greeting);
            } else {
                // Voices not loaded yet, wait for them
                synth.onvoiceschanged = () => {
                    speak(greeting);
                };
            }
        };

        // Small delay to ensure component is mounted
        setTimeout(speakGreeting, 100);
        fetchRoster();
    }, []);

    const fetchRoster = async () => {
        try {
            // First check localStorage for SID analysis (most recent AI data)
            const sidAnalysis = localStorage.getItem('sidRosterAnalysis');
            if (sidAnalysis) {
                try {
                    const parsed = JSON.parse(sidAnalysis);
                    if (parsed.staff && parsed.staff.length > 0) {
                        console.log("🧠 Christine: Using SID analysis from localStorage with", parsed.staff.length, "staff");
                        setRosterData(parsed);
                        return;
                    }
                } catch (e) {
                    console.warn("Failed to parse localStorage sidRosterAnalysis:", e);
                }
            }

            // Fallback: fetch from Supabase
            const { data, error: _error } = await supabase
                .from('roster_uploads')
                .select('ai_analysis')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (data && data.ai_analysis) {
                const analysis = data.ai_analysis;
                let normalizedData: any = { schedules: [], rawData: [], staff: [] };

                if (Array.isArray(analysis)) {
                    normalizedData.schedules = analysis;
                } else {
                    normalizedData = analysis;
                }

                if (analysis.staff && analysis.staff.length > 0) {
                    normalizedData.staff = analysis.staff;
                    console.log("🧠 Christine: Using Supabase AI analysis with", analysis.staff.length, "staff");
                }

                setRosterData(normalizedData);
            }
        } catch (err) {
            console.error("Christine failed to fetch roster:", err);
        }
    };

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addMessage = (role: 'user' | 'assistant', content: string) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role,
            content,
            timestamp: new Date()
        }]);
    };

    const speak = (text: string) => {
        if (synth.speaking) synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Wait for voices to load if not already loaded
        const getVoices = (): SpeechSynthesisVoice[] => {
            let voices = synth.getVoices();
            if (voices.length === 0) {
                // Voices might not be loaded yet, try again
                synth.onvoiceschanged = () => {
                    voices = synth.getVoices();
                };
            }
            return voices;
        };

        const voices = getVoices();

        // FEMALE VOICE PRIORITY LIST - Christine MUST always sound female
        const femaleVoicePatterns = [
            // Priority 1: Microsoft Zira (best quality female)
            (v: SpeechSynthesisVoice) => v.name.includes('Zira'),
            // Priority 2: Microsoft female voices
            (v: SpeechSynthesisVoice) => v.name.includes('Microsoft') && (v.name.includes('Zira') || v.name.includes('Hazel') || v.name.includes('Susan') || v.name.includes('Linda') || v.name.includes('Catherine') || v.name.includes('Jenny') || v.name.includes('Aria')),
            // Priority 3: Google female voices
            (v: SpeechSynthesisVoice) => v.name.includes('Google') && v.name.includes('Female'),
            // Priority 4: Any English female voice (check common patterns)
            (v: SpeechSynthesisVoice) => v.lang.startsWith('en') && (v.name.toLowerCase().includes('female') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Karen') || v.name.includes('Moira') || v.name.includes('Fiona') || v.name.includes('Tessa')),
            // Priority 5: Any voice with "female" in name
            (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('female'),
            // Priority 6: Common female voice names across platforms
            (v: SpeechSynthesisVoice) => ['samantha', 'victoria', 'karen', 'moira', 'fiona', 'tessa', 'alice', 'emily', 'siri'].some(name => v.name.toLowerCase().includes(name)),
        ];

        let selectedVoice: SpeechSynthesisVoice | null = null;

        // Try each priority pattern
        for (const pattern of femaleVoicePatterns) {
            selectedVoice = voices.find(pattern) || null;
            if (selectedVoice) break;
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log("🔊 Christine using female voice:", selectedVoice.name);
        } else {
            // Last resort: use higher pitch to sound more feminine
            console.warn("⚠️ No female voice found. Available voices:", voices.map(v => v.name));
            utterance.pitch = 1.3; // Higher pitch for more feminine sound
        }

        // Always set these for a pleasant female voice
        utterance.rate = 1;
        utterance.pitch = selectedVoice ? 1.1 : 1.3; // Higher pitch if no female voice found

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);

        synth.speak(utterance);
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMessage = inputText;
        setInputText('');
        addMessage('user', userMessage);
        setIsThinking(true);

        try {
            // Context for Christine Persona
            const context = `You are Christine, a highly efficient and professional Kitchen Coordinator AI. 
PERSONALITY & TONE (maintain ALWAYS):
- Professional yet warm and approachable
- Address the user as "Chef" 
- Helpful, concise, and action-oriented
- Confident but never arrogant
- Use clear, direct language
- Always offer to help with next steps

ROLE: You manage schedules, inventory, staff coordination, and kitchen operations for Chef Anandhan's team.
STYLE: Keep responses brief (2-3 sentences max unless detailed info is requested). Be supportive and proactive.`;

            const lowerMsg = userMessage.toLowerCase();

            // Comprehensive detection for staff/team/roster related queries
            const staffKeywords = [
                'who', 'staff', 'team', 'schedule', 'roster', 'duty', 'shift',
                'working', 'off', 'vacation', 'leave', 'today', 'tomorrow',
                'employee', 'chef', 'cook', 'baker', 'butcher', 'commis', 'cdp',
                'sous', 'executive', 'coordinator', 'helper', 'steward',
                'department', 'kitchen', 'how many', 'list', 'show me', 'name',
                'available', 'absent', 'present', 'coming', 'morning', 'afternoon', 'night',
                'anandhan', 'imram', 'mohammed', 'christine',
                'id', 'roll', 'number', 'find', 'search', 'look up',
                'category', 'role', 'position', 'job', 'title'
            ];

            const isStaffQuery = staffKeywords.some(keyword => lowerMsg.includes(keyword));

            if (isStaffQuery) {
                // FOR STAFF QUERIES: Use SID directly
                console.log("🤖 Christine consulting SID AI for:", userMessage);
                addMessage('assistant', "Checking with Sid...");

                // ALWAYS get fresh roster data from localStorage
                let currentRosterData = rosterData;
                const freshSidAnalysis = localStorage.getItem('sidRosterAnalysis');
                if (freshSidAnalysis) {
                    try {
                        const parsed = JSON.parse(freshSidAnalysis);
                        if (parsed.staff && parsed.staff.length > 0) {
                            currentRosterData = parsed;
                            console.log("🔄 Christine: Using fresh SID data with", parsed.staff.length, "staff");
                        }
                    } catch (e) {
                        console.warn("Failed to get fresh SID data:", e);
                    }
                }

                if (!currentRosterData || !currentRosterData.staff || currentRosterData.staff.length === 0) {
                    addMessage('assistant', "I don't have roster data loaded yet, Chef. Please upload a duty schedule first in the Duty Schedule section.");
                } else {
                    const sidResponse = await SidService.askSid(userMessage, currentRosterData);
                    console.log("✅ SID Response:", sidResponse);
                    const christineResponse = `Chef, here's what Sid found:\n\n${sidResponse}`;
                    addMessage('assistant', christineResponse);
                    speak(sidResponse);
                }
            } else {
                // FOR NON-STAFF QUERIES: Use OpenAI as normal
                const response = await aiService.sendMessage(userMessage, context);
                addMessage('assistant', response);
                speak(response);
            }
        } catch (error) {
            console.error(error);
            addMessage('assistant', "I apologize, Chef. I'm having trouble connecting right now.");
        } finally {
            setIsThinking(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice input is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputText(transcript);
        };

        recognition.start();
    };

    const stopSpeaking = () => {
        if (synth.speaking) {
            synth.cancel();
            setIsSpeaking(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50 relative overflow-hidden rounded-2xl border border-slate-200 shadow-xl">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#ff7a00] to-[#ff4e00] rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20 relative">
                        <Bot className="text-white w-7 h-7" />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Christine</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                Kitchen Coordinator
                            </span>
                            {isThinking && <span className="text-xs text-[#ff7a00] animate-pulse font-medium">Processing...</span>}
                            {isSpeaking && <span className="text-xs text-blue-500 animate-pulse font-medium">Speaking...</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={stopSpeaking}
                        className={`p-2 rounded-full hover:bg-slate-100 transition-colors ${isSpeaking ? 'text-[#ff7a00]' : 'text-slate-400'}`}
                        title="Stop Speaking"
                    >
                        {isSpeaking ? <Volume2 width={20} height={20} /> : <VolumeX width={20} height={20} />}
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl p-4 shadow-sm relative ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-[#ff7a00] to-[#ff914d] text-white rounded-tr-none'
                                : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                                }`}
                        >
                            <div className={`absolute -top-3 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${msg.role === 'user'
                                ? 'bg-slate-800 -right-3'
                                : 'bg-gradient-to-br from-[#ff7a00] to-[#ff4e00] -left-3'
                                }`}>
                                {msg.role === 'user' ? (
                                    <span className="text-white text-xs font-bold">ME</span>
                                ) : (
                                    <Bot className="w-4 h-4 text-white" />
                                )}
                            </div>

                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <span className={`text-[10px] block mt-2 opacity-70 ${msg.role === 'user' ? 'text-white' : 'text-slate-400'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-slate-200 p-4">
                <div className="flex items-center gap-3 max-w-4xl mx-auto">
                    <button
                        onClick={toggleListening}
                        className={`p-3 rounded-full transition-all duration-300 shadow-md ${isListening
                            ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-500/20'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        title="Voice Input"
                    >
                        {isListening ? <StopCircle className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask Christine anything..."
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-full focus:outline-none focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 transition-all shadow-inner text-slate-800 placeholder:text-slate-400"
                            disabled={isThinking}
                        />
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={!inputText.trim() || isThinking}
                        className={`p-4 rounded-full shadow-lg transition-all duration-300 ${!inputText.trim() || isThinking
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] text-white hover:scale-105 hover:shadow-[#ff7a00]/30'
                            }`}
                    >
                        <Send className="w-6 h-6" />
                    </button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-xs text-slate-400">
                        Powered by Antigravity & OpenAI • Voice Enabled
                    </p>
                </div>
            </div>
        </div>
    );
};

export default KitchenCoordinatorAI;
