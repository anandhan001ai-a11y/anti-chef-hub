import { useState, useEffect } from 'react';
import { User, Palette, Moon, Sun, Monitor, Camera, Save, Check, Users, Mail, Copy, UserPlus, CheckCircle, Key } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import GoogleCredentialsPage from '../credentials/GoogleCredentialsPage';

export default function SettingsPage() {
    // --- State ---
    const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'team' | 'credentials' | 'api-keys'>('profile');
    const [profile, setProfile] = useState({
        name: 'Chef Ram',
        role: 'Executive Chef',
        restaurant: 'The Grand Kitchen',
        email: 'ram@kitchen.com',
        avatar: ''
    });

    const [theme, setTheme] = useState('light');
    const [accentColor, setAccentColor] = useState('blue');
    const [saving, setSaving] = useState(false);

    // API Keys State
    const [openaiKey, setOpenaiKey] = useState('');
    const [showOpenaiKey, setShowOpenaiKey] = useState(false);
    const [apiKeySaved, setApiKeySaved] = useState(false);

    // Team State
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState('');
    const [inviteError, setInviteError] = useState('');
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [copied, setCopied] = useState(false);

    // --- Effects ---
    useEffect(() => {
        const savedProfile = localStorage.getItem('chef_profile');
        const savedTheme = localStorage.getItem('app_theme');
        const savedOpenaiKey = localStorage.getItem('OPENAI_API_KEY');
        if (savedProfile) setProfile(JSON.parse(savedProfile));
        if (savedTheme) setTheme(savedTheme);
        if (savedOpenaiKey) setOpenaiKey(savedOpenaiKey);
    }, []);

    useEffect(() => {
        if (activeTab === 'team') {
            fetchTeamMembers();
        }
    }, [activeTab]);

    // --- Actions ---
    const handleSave = () => {
        setSaving(true);
        localStorage.setItem('chef_profile', JSON.stringify(profile));
        localStorage.setItem('app_theme', theme);
        window.dispatchEvent(new Event('theme-change'));
        setTimeout(() => setSaving(false), 800);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile({ ...profile, avatar: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const fetchTeamMembers = async () => {
        // Fetch unique users who have sent messages (as a proxy for team)
        const { data } = await supabase
            .from('messages')
            .select('user_name')
            .order('created_at', { ascending: false });

        if (data) {
            const uniqueMembers = [...new Set(data.map((m: { user_name: string }) => m.user_name))];
            setTeamMembers(uniqueMembers.map(name => ({ name })));
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail.trim()) {
            setInviteError('Please enter an email address');
            return;
        }

        setInviting(true);
        setInviteError('');
        setInviteSuccess('');

        try {
            // Create a personalized invite message
            const inviteMessage = `Hi! You're invited to join our kitchen team on ChefAnand Hub.

🍳 Sign up here: ${window.location.origin}

Just click the link, create your account with your email (${inviteEmail.trim()}), and we can collaborate in real-time!

Invited by: ${profile.name}
Restaurant: ${profile.restaurant}`;

            // Try to open email client
            const mailtoLink = `mailto:${inviteEmail.trim()}?subject=You're invited to ChefAnand Hub&body=${encodeURIComponent(inviteMessage)}`;
            window.open(mailtoLink, '_blank');

            setInviteSuccess(`Opening your email app to send invitation to ${inviteEmail}!`);
            setInviteEmail('');
        } catch (err: any) {
            setInviteError('Could not open email app. Please copy the link below and share manually.');
        } finally {
            setInviting(false);
        }
    };

    const copyInviteLink = () => {
        const link = `${window.location.origin}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveApiKeys = () => {
        if (openaiKey.trim()) {
            localStorage.setItem('OPENAI_API_KEY', openaiKey.trim());
            setApiKeySaved(true);
            setTimeout(() => setApiKeySaved(false), 3000);
        }
    };

    // --- Render ---

    const renderProfile = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-6">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                        {profile.avatar ? (
                            <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={40} className="text-gray-300" />
                        )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 cursor-pointer shadow-md transition-transform hover:scale-105">
                        <Camera size={16} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Profile Picture</h3>
                    <p className="text-sm text-gray-500">Upload a professional headshot or kitchen logo.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Full Name</label>
                    <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Role / Title</label>
                    <input
                        type="text"
                        value={profile.role}
                        onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Restaurant Name</label>
                    <input
                        type="text"
                        value={profile.restaurant}
                        onChange={(e) => setProfile({ ...profile, restaurant: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Email Address</label>
                    <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
            </div>
        </div>
    );

    const renderAppearance = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Interface Theme</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setTheme('light')}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${theme === 'light' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <Sun className={theme === 'light' ? 'text-blue-600' : 'text-gray-400'} size={24} />
                            {theme === 'light' && <Check size={16} className="text-blue-600" />}
                        </div>
                        <div className="font-bold text-gray-900">Day Service</div>
                        <div className="text-xs text-gray-500 mt-1">Best for bright kitchens.</div>
                    </button>

                    <button
                        onClick={() => setTheme('dark')}
                        className={`p-4 rounded-xl border-2 text-left transition-all bg-gray-900 ${theme === 'dark' ? 'border-blue-500' : 'border-transparent hover:border-gray-700'}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <Moon className={theme === 'dark' ? 'text-blue-400' : 'text-gray-400'} size={24} />
                            {theme === 'dark' && <Check size={16} className="text-blue-400" />}
                        </div>
                        <div className="font-bold text-white">Night Service</div>
                        <div className="text-xs text-gray-400 mt-1">Reduces eye strain.</div>
                    </button>

                    <button
                        onClick={() => setTheme('system')}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${theme === 'system' ? 'border-purple-600 bg-purple-50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <Monitor className={theme === 'system' ? 'text-purple-600' : 'text-gray-400'} size={24} />
                            {theme === 'system' && <Check size={16} className="text-purple-600" />}
                        </div>
                        <div className="font-bold text-gray-900">System Sync</div>
                        <div className="text-xs text-gray-500 mt-1">Matches device settings.</div>
                    </button>
                </div>
            </div>

            <div className="h-px bg-gray-100" />

            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Brand Accent</h3>
                <div className="flex gap-4">
                    {['blue', 'purple', 'orange', 'green'].map(color => (
                        <button
                            key={color}
                            onClick={() => setAccentColor(color)}
                            className={`w-12 h-12 rounded-full border-4 transition-transform ${accentColor === color ? 'scale-110 border-gray-900' : 'border-transparent'}`}
                            style={{ backgroundColor: color === 'blue' ? '#3b82f6' : color === 'purple' ? '#a855f7' : color === 'orange' ? '#f97316' : '#22c55e' }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );

    const renderTeam = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Invite Section */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-xl">
                        <UserPlus size={24} className="text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Invite Team Member</h3>
                        <p className="text-sm text-gray-500">Send an email invitation to join your kitchen team</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="chef.ali@restaurant.com"
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <button
                        onClick={handleInvite}
                        disabled={inviting}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {inviting ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Mail size={18} />
                                Send Invite
                            </>
                        )}
                    </button>
                </div>

                {inviteError && (
                    <p className="mt-3 text-sm text-red-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        {inviteError}
                    </p>
                )}
                {inviteSuccess && (
                    <p className="mt-3 text-sm text-green-600 flex items-center gap-2">
                        <CheckCircle size={16} />
                        {inviteSuccess}
                    </p>
                )}
            </div>

            {/* Share Link */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-2">Or Share Signup Link</h4>
                <p className="text-sm text-gray-500 mb-4">Copy this link and share it with your team members</p>

                <div className="flex gap-3">
                    <div className="flex-1 bg-white px-4 py-3 rounded-xl border border-gray-200 font-mono text-sm text-gray-600 truncate">
                        {window.location.origin}
                    </div>
                    <button
                        onClick={copyInviteLink}
                        className={`px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${copied
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                            }`}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>

            {/* Team Members */}
            <div>
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Users size={18} />
                    Active Team Members
                </h4>

                {teamMembers.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-100">
                        <Users size={32} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500 text-sm">No team members yet</p>
                        <p className="text-gray-400 text-xs mt-1">Team members appear here after they send a message</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {member.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 truncate">{member.name}</p>
                                    <p className="text-xs text-gray-500">Team Member</p>
                                </div>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Active" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderApiKeys = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* OpenAI API Key */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 border border-green-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-xl">
                        <Key size={24} className="text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">OpenAI API Key</h3>
                        <p className="text-sm text-gray-500">Required for AI features like Write Mail, Meeting Notes, and Roster Analysis</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 block">API Key</label>
                        <div className="relative">
                            <input
                                type={showOpenaiKey ? "text" : "password"}
                                value={openaiKey}
                                onChange={(e) => setOpenaiKey(e.target.value)}
                                placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxx"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm"
                            />
                            <button
                                onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showOpenaiKey ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSaveApiKeys}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all flex items-center gap-2"
                        >
                            <Save size={18} />
                            Save API Key
                        </button>
                        {apiKeySaved && (
                            <div className="flex items-center gap-2 text-green-600 animate-in fade-in">
                                <CheckCircle size={18} />
                                <span className="text-sm font-bold">Saved securely!</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-800 font-medium mb-2">How to get your API key:</p>
                        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                            <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-blue-900">platform.openai.com/api-keys</a></li>
                            <li>Sign up or log in to your OpenAI account</li>
                            <li>Click "Create new secret key"</li>
                            <li>Copy the key (starts with sk-) and paste it above</li>
                        </ol>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <p className="text-sm text-yellow-800">
                            <span className="font-bold">Note:</span> Your API key is stored securely in your browser and never sent to any third-party servers except OpenAI when you use AI features.
                        </p>
                    </div>
                </div>
            </div>

            {/* Future: Other API Keys */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-2">Other API Integrations</h4>
                <p className="text-sm text-gray-500">Additional API integrations will appear here as they become available.</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-6 lg:p-10 pb-32">
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
                    <p className="text-gray-500">Manage your profile, team, and preferences.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-70"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                    {!saving && <Save size={18} />}
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col md:flex-row">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-6 flex flex-col gap-2">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                    >
                        <User size={18} /> Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('team')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'team' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                    >
                        <Users size={18} /> Team
                    </button>
                    <button
                        onClick={() => setActiveTab('appearance')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'appearance' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                    >
                        <Palette size={18} /> Appearance
                    </button>
                    <button
                        onClick={() => setActiveTab('credentials')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'credentials' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                    >
                        <Key size={18} /> Google Credentials
                    </button>
                    <button
                        onClick={() => setActiveTab('api-keys')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'api-keys' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                    >
                        <Key size={18} /> API Keys
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 lg:p-12">
                    {activeTab === 'profile' && renderProfile()}
                    {activeTab === 'team' && renderTeam()}
                    {activeTab === 'appearance' && renderAppearance()}
                    {activeTab === 'credentials' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <GoogleCredentialsPage />
                        </div>
                    )}
                    {activeTab === 'api-keys' && renderApiKeys()}
                </div>
            </div>
        </div>
    );
}
