import { useState, useEffect } from 'react';
import { Key, Lock, CheckCircle, Smartphone, Zap, AlertTriangle, Brain } from 'lucide-react';
import { googleService } from '../../lib/google';

export default function GoogleCredentialsPage() {
    // We use localStorage for this demo environment to simulate "Backend" persistence
    const [apiKey, setApiKey] = useState('');
    const [clientId, setClientId] = useState('');
    const [geminiKey, setGeminiKey] = useState('');
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');

    useEffect(() => {
        const savedKey = localStorage.getItem('GOOGLE_API_KEY');
        const savedClient = localStorage.getItem('GOOGLE_CLIENT_ID');
        const savedGemini = localStorage.getItem('GOOGLE_GEMINI_KEY');
        if (savedKey) setApiKey(savedKey);
        if (savedClient) setClientId(savedClient);
        if (savedGemini) setGeminiKey(savedGemini);
    }, []);

    const handleSave = async () => {
        localStorage.setItem('GOOGLE_API_KEY', apiKey);
        localStorage.setItem('GOOGLE_CLIENT_ID', clientId);
        localStorage.setItem('GOOGLE_GEMINI_KEY', geminiKey);

        setStatus('connecting');
        try {
            // Initialize standard Google Services
            if (clientId && apiKey) {
                await googleService.init(clientId, apiKey);
                await googleService.login();
                setStatus('connected');
            } else {
                // If only Gemini is provided, just say saved
                setStatus('idle');
                alert('Settings Saved!');
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-10 pb-32">
            <div className="max-w-4xl mx-auto">

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                        <Key size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Credentials & Integrations</h1>
                        <p className="text-gray-500">Connect Google Workspace and AI Services.</p>
                    </div>
                </div>

                <div className="space-y-6">

                    {/* Status Card */}
                    {status === 'connected' && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 font-bold animate-in fade-in slide-in-from-top-4">
                            <CheckCircle size={20} />
                            Google Workspace Connected Successfully
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 font-bold animate-in fade-in slide-in-from-top-4">
                            <AlertTriangle size={20} />
                            Connection Failed. Check your Client ID/API Key or Origins.
                        </div>
                    )}

                    {/* 1. Standard API Key */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                                    <Lock size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">1. Google API Key</h3>
                                    <p className="text-gray-500 text-sm">Required for Tasks & Sheets API.</p>
                                </div>
                            </div>
                        </div>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    {/* 2. OAuth Client ID */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                    <Smartphone size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">2. OAuth 2.0 Client ID</h3>
                                    <p className="text-gray-500 text-sm">For secure login to your Google Account.</p>
                                </div>
                            </div>
                        </div>
                        <input
                            type="text"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            placeholder="123456...apps.googleusercontent.com"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    {/* 3. Gemini AI Key */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm border-l-4 border-l-purple-500">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                    <Brain size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">3. Gemini AI API Key</h3>
                                    <p className="text-gray-500 text-sm">Powers the 'Chef Brain' assistant.</p>
                                </div>
                            </div>
                        </div>
                        <input
                            type="password"
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            placeholder="AIzaSy... (Gemini Key)"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-gray-600 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        />
                        <p className="mt-2 text-xs text-gray-400">Get a free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline text-purple-600">Google AI Studio</a>.</p>
                    </div>

                    {/* Save Action */}
                    <div className="flex items-center gap-4 pt-4">
                        <button
                            onClick={handleSave}
                            disabled={status === 'connecting'}
                            className="flex items-center gap-2 px-8 py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl w-full justify-center text-lg"
                        >
                            {status === 'connecting' ? 'Connecting...' : 'Save All & Connect'}
                            <Zap size={20} fill="currentColor" className="text-yellow-400" />
                        </button>
                    </div>

                    <div className="p-6 bg-gray-100 rounded-2xl text-center">
                        <h4 className="font-bold text-gray-700 mb-2">Setup Guide</h4>
                        <p className="text-sm text-gray-500 mb-4">Ensure `http://localhost:5173` is added to your Authorized JavaScript Origins in Google Cloud Console.</p>
                        <a href="https://console.cloud.google.com/" target="_blank" className="text-blue-600 font-bold hover:underline">Google Cloud Console &rarr;</a>
                    </div>

                </div>
            </div>
        </div>
    );
}
