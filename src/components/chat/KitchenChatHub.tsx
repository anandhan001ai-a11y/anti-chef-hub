import React, { useState, useEffect, useRef } from 'react';
import {
    MessageSquare, Send, Mic, Image, Paperclip, Phone,
    Video, Search, Plus, Settings, X, Check, CheckCheck,
    Play, Pause, Square, Smile, ArrowLeft
} from 'lucide-react';
import { chatService, Channel, ChatMessage, UserPresence } from '../../lib/ChatService';
import { supabase } from '../../lib/supabase';

// Voice Recorder Component
const VoiceRecorder: React.FC<{
    onRecordComplete: (blob: Blob, duration: number) => void;
    onCancel: () => void;
}> = ({ onRecordComplete, onCancel }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                onRecordComplete(blob, duration);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setDuration(0);

            timerRef.current = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Please allow microphone access to record voice messages');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
        onCancel();
    };

    const formatDuration = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const s = secs % 60;
        return `${mins}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-3 bg-red-50 rounded-2xl px-4 py-2 animate-pulse">
            <button onClick={cancelRecording} className="p-2 hover:bg-red-100 rounded-full">
                <X size={18} className="text-red-500" />
            </button>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-600 font-mono">{formatDuration(duration)}</span>
            </div>
            <div className="flex-1 h-8 bg-red-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-400 to-red-500 animate-pulse"
                    style={{ width: `${Math.min(100, (duration / 60) * 100)}%` }} />
            </div>
            {!isRecording ? (
                <button onClick={startRecording} className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600">
                    <Mic size={20} />
                </button>
            ) : (
                <button onClick={stopRecording} className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700">
                    <Square size={20} />
                </button>
            )}
        </div>
    );
};

// Voice Player Component
const VoicePlayer: React.FC<{ url: string; duration?: number }> = ({ url, duration = 0 }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
        audio.onended = () => setIsPlaying(false);

        return () => {
            audio.pause();
            audio.src = '';
        };
    }, [url]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const formatTime = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${mins}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-2 min-w-[180px]">
            <button onClick={togglePlay} className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600">
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all"
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
            </div>
            <span className="text-xs text-slate-500 font-mono">{formatTime(currentTime)}</span>
        </div>
    );
};

// Main Chat Hub Component
const KitchenChatHub: React.FC = () => {
    // State
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
    const [showNewChannelModal, setShowNewChannelModal] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileView] = useState(false);
    const [showChannelList, setShowChannelList] = useState(true);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize
    useEffect(() => {
        chatService.init().then(() => {
            loadChannels();
            loadOnlineUsers();
        });

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        const presenceInterval = setInterval(() => {
            chatService.updatePresence('online');
            loadOnlineUsers();
        }, 30000);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            clearInterval(presenceInterval);
        };
    }, []);

    const handleVisibilityChange = () => {
        chatService.updatePresence(document.hidden ? 'away' : 'online');
    };

    const handleBeforeUnload = () => {
        chatService.cleanup();
    };

    // Load channels
    const loadChannels = async () => {
        const chans = await chatService.getChannels();
        setChannels(chans);
        if (chans.length > 0 && !selectedChannel) {
            setSelectedChannel(chans[0]);
        }
    };

    // Load online users
    const loadOnlineUsers = async () => {
        const users = await chatService.getOnlineUsers();
        setOnlineUsers(users);
    };

    // Load messages when channel changes
    useEffect(() => {
        if (!selectedChannel) return;

        loadMessages();
        const cleanup = setupRealtimeSubscription();

        return cleanup;
    }, [selectedChannel]);

    const loadMessages = async () => {
        if (!selectedChannel) return;
        const msgs = await chatService.getMessages(selectedChannel.id);
        setMessages(msgs);
    };

    const setupRealtimeSubscription = () => {
        if (!selectedChannel) return () => {};

        const channel = chatService.subscribeToChannel(selectedChannel.id, (newMsg) => {
            setMessages(prev => [...prev, newMsg]);
        });

        const typingChannel = chatService.subscribeToTyping(selectedChannel.id, (userName) => {
            setTypingUsers(prev => {
                if (!prev.includes(userName)) return [...prev, userName];
                return prev;
            });
            setTimeout(() => {
                setTypingUsers(prev => prev.filter(u => u !== userName));
            }, 3000);
        });

        const legacyChannel = chatService.subscribeToLegacyMessages((newMsg) => {
            setMessages(prev => [...prev, newMsg]);
        });

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(typingChannel);
            supabase.removeChannel(legacyChannel);
        };
    };

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send message
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedChannel) return;

        await chatService.sendMessage({
            channel_id: selectedChannel.id,
            content: newMessage.trim(),
            message_type: 'text',
        });

        setNewMessage('');
    };

    // Handle typing
    const handleTyping = () => {
        if (selectedChannel) {
            chatService.broadcastTyping(selectedChannel.id);
        }
    };

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Handle voice message
    const handleVoiceComplete = async (blob: Blob, _duration: number) => {
        if (!selectedChannel) return;
        setIsRecording(false);
        await chatService.uploadVoiceMessage(blob, selectedChannel.id);
    };

    // Handle image upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedChannel) return;

        // Show preview
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);

        await chatService.uploadImage(file, selectedChannel.id);
        setImagePreview(null);
    };

    // Create new channel
    const handleCreateChannel = async () => {
        if (!newChannelName.trim()) return;

        const channel = await chatService.createChannel({
            name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
            description: '',
            icon: '💬',
            color: 'blue',
        });

        if (channel) {
            setChannels(prev => [...prev, channel]);
            setSelectedChannel(channel);
        }

        setNewChannelName('');
        setShowNewChannelModal(false);
    };

    // Format time
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
            ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Get channel color
    const getChannelColor = (color: string) => {
        const colors: Record<string, string> = {
            orange: 'from-orange-500 to-orange-600',
            green: 'from-green-500 to-green-600',
            pink: 'from-pink-500 to-pink-600',
            blue: 'from-blue-500 to-blue-600',
            red: 'from-red-500 to-red-600',
            purple: 'from-purple-500 to-purple-600',
        };
        return colors[color] || colors.blue;
    };

    // Filter channels
    const filteredChannels = channels.filter(ch =>
        ch.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            {/* Left Sidebar - Channels & DMs */}
            <div className={`w-80 bg-slate-50 border-r border-slate-200 flex flex-col ${isMobileView && !showChannelList ? 'hidden' : ''
                }`}>
                {/* Sidebar Header */}
                <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-orange-500" />
                            Team Chat
                        </h2>
                        <button
                            onClick={() => setShowNewChannelModal(true)}
                            className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search channels..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                </div>

                {/* Channels List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
                        Channels
                    </div>

                    {filteredChannels.map(channel => (
                        <button
                            key={channel.id}
                            onClick={() => {
                                setSelectedChannel(channel);
                                if (isMobileView) setShowChannelList(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${selectedChannel?.id === channel.id
                                ? 'bg-gradient-to-r ' + getChannelColor(channel.color) + ' text-white shadow-lg'
                                : 'hover:bg-slate-100 text-slate-700'
                                }`}
                        >
                            <span className="text-xl">{channel.icon}</span>
                            <div className="flex-1 text-left">
                                <div className="font-medium text-sm">#{channel.name}</div>
                                {channel.description && (
                                    <div className={`text-xs truncate ${selectedChannel?.id === channel.id ? 'text-white/70' : 'text-slate-400'
                                        }`}>
                                        {channel.description}
                                    </div>
                                )}
                            </div>
                            {channel.unread_count && channel.unread_count > 0 && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                    {channel.unread_count}
                                </span>
                            )}
                        </button>
                    ))}

                    {/* Online Users */}
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-2 mt-6">
                        Online ({onlineUsers.length})
                    </div>

                    {onlineUsers.map(user => (
                        <div key={user.user_id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100">
                            <div className="relative">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    {user.user_name.charAt(0).toUpperCase()}
                                </div>
                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${user.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                                    }`} />
                            </div>
                            <span className="text-sm text-slate-700">{user.user_name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedChannel ? (
                    <>
                        {/* Channel Header */}
                        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3">
                                {isMobileView && (
                                    <button onClick={() => setShowChannelList(true)} className="p-2 hover:bg-slate-100 rounded-lg">
                                        <ArrowLeft size={20} />
                                    </button>
                                )}
                                <span className="text-2xl">{selectedChannel.icon}</span>
                                <div>
                                    <h3 className="font-bold text-slate-800">#{selectedChannel.name}</h3>
                                    <p className="text-xs text-slate-500">{selectedChannel.description}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors">
                                    <Phone size={18} />
                                </button>
                                <button className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
                                    <Video size={18} />
                                </button>
                                <button className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                                    <Settings size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                            {messages.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">{selectedChannel.icon}</div>
                                    <h3 className="text-xl font-bold text-slate-700">Welcome to #{selectedChannel.name}</h3>
                                    <p className="text-slate-500 mt-2">This is the start of the conversation</p>
                                </div>
                            )}

                            {messages.map((msg, idx) => {
                                const isMe = msg.sender_name === chatService.getCurrentUserName();
                                const showAvatar = idx === 0 || messages[idx - 1]?.sender_name !== msg.sender_name;

                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex gap-3 max-w-[70%] ${isMe ? 'flex-row-reverse' : ''}`}>
                                            {/* Avatar */}
                                            {showAvatar && !isMe && (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                                    {msg.sender_name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            {!showAvatar && !isMe && <div className="w-10" />}

                                            {/* Message Content */}
                                            <div className={`${isMe ? 'items-end' : 'items-start'}`}>
                                                {showAvatar && !isMe && (
                                                    <span className="text-xs font-bold text-slate-600 ml-1 mb-1 block">
                                                        {msg.sender_name}
                                                    </span>
                                                )}

                                                <div className={`px-4 py-2.5 rounded-2xl ${isMe
                                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-br-md'
                                                    : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-md'
                                                    }`}>
                                                    {/* Voice Message */}
                                                    {msg.message_type === 'voice' && msg.media_url && (
                                                        <VoicePlayer url={msg.media_url} duration={msg.media_duration} />
                                                    )}

                                                    {/* Image Message */}
                                                    {msg.message_type === 'image' && msg.media_url && (
                                                        <img
                                                            src={msg.media_url}
                                                            alt="Shared image"
                                                            className="max-w-[300px] rounded-xl cursor-pointer hover:opacity-90"
                                                            onClick={() => setImagePreview(msg.media_url || null)}
                                                        />
                                                    )}

                                                    {/* Text Message */}
                                                    {msg.message_type === 'text' && (
                                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                    )}

                                                    {/* Task Message */}
                                                    {msg.message_type === 'task' && msg.task_title && (
                                                        <div className={`p-3 rounded-xl border ${isMe ? 'bg-orange-600/30 border-orange-400/30' : 'bg-slate-50 border-slate-200'
                                                            }`}>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Paperclip size={14} />
                                                                <span className="text-xs font-bold uppercase">Shared Task</span>
                                                            </div>
                                                            <p className="font-bold">{msg.task_title}</p>
                                                            {msg.content && <p className="text-sm mt-1 opacity-80">{msg.content}</p>}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Time & Read Receipt */}
                                                <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                                                    <span className="text-[10px] text-slate-400">{formatTime(msg.created_at)}</span>
                                                    {isMe && (
                                                        <span className="text-blue-500">
                                                            {msg.is_read ? <CheckCheck size={12} /> : <Check size={12} />}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Typing Indicator */}
                            {typingUsers.length > 0 && (
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-slate-200 bg-white">
                            {isRecording ? (
                                <VoiceRecorder
                                    onRecordComplete={handleVoiceComplete}
                                    onCancel={() => setIsRecording(false)}
                                />
                            ) : (
                                <div className="flex items-center gap-3">
                                    {/* Attach Button */}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                                    >
                                        <Image size={20} />
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                    />

                                    {/* Message Input */}
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                                            onKeyDown={handleKeyPress}
                                            placeholder="Type a message..."
                                            className="w-full px-5 py-3 bg-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 pr-12"
                                        />
                                        <button
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <Smile size={20} />
                                        </button>
                                    </div>

                                    {/* Voice Button */}
                                    <button
                                        onClick={() => setIsRecording(true)}
                                        className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                                    >
                                        <Mic size={20} />
                                    </button>

                                    {/* Send Button */}
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim()}
                                        className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/30"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-slate-50">
                        <div className="text-center">
                            <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-600">Select a channel</h3>
                            <p className="text-slate-400 mt-2">Choose a channel to start chatting</p>
                        </div>
                    </div>
                )}
            </div>

            {/* New Channel Modal */}
            {showNewChannelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Create New Channel</h3>

                        <input
                            type="text"
                            value={newChannelName}
                            onChange={(e) => setNewChannelName(e.target.value)}
                            placeholder="Channel name (e.g. pastry-section)"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowNewChannelModal(false)}
                                className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateChannel}
                                disabled={!newChannelName.trim()}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 font-medium disabled:opacity-50"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {imagePreview && (
                <div
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 cursor-pointer"
                    onClick={() => setImagePreview(null)}
                >
                    <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20">
                        <X size={24} className="text-white" />
                    </button>
                    <img src={imagePreview} alt="Preview" className="max-w-[90%] max-h-[90%] rounded-lg" />
                </div>
            )}
        </div>
    );
};

export default KitchenChatHub;
