import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Paperclip, Users, CheckSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
    id: string;
    user_name: string;
    content: string;
    task_id?: string;
    task_title?: string;
    task_status?: string;
    task_priority?: string;
    created_at: string;
}

interface TaskItem {
    id: string;
    title: string;
    status: string;
    priority?: string;
}

export default function CollaborationPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [userName, setUserName] = useState('');
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [showTaskPicker, setShowTaskPicker] = useState(false);
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load user name from settings
    useEffect(() => {
        const profile = localStorage.getItem('chef_profile');
        if (profile) {
            const parsed = JSON.parse(profile);
            setUserName(parsed.name || 'Chef');
        } else {
            setUserName('Chef');
        }
    }, []);

    // Fetch messages and setup realtime
    useEffect(() => {
        fetchMessages();
        fetchTasks();

        // Subscribe to new messages
        const messagesChannel = supabase
            .channel('messages-channel')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                setMessages(prev => [...prev, payload.new as Message]);
            })
            .subscribe();

        // Subscribe to typing indicators (using broadcast)
        const typingChannel = supabase
            .channel('typing-channel')
            .on('broadcast', { event: 'typing' }, (payload) => {
                const typer = payload.payload.user_name;
                if (typer !== userName) {
                    setTypingUsers(prev => {
                        if (!prev.includes(typer)) return [...prev, typer];
                        return prev;
                    });

                    // Remove after 3 seconds of no activity
                    setTimeout(() => {
                        setTypingUsers(prev => prev.filter(u => u !== typer));
                    }, 3000);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(messagesChannel);
            supabase.removeChannel(typingChannel);
        };
    }, [userName]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchMessages = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(100);

        if (data) setMessages(data);
    };

    const fetchTasks = async () => {
        const { data } = await supabase
            .from('tasks')
            .select('id, title, status, priority')
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) setTasks(data as TaskItem[]);
    };

    const sendMessage = async () => {
        if (!newMessage.trim() && !selectedTask) return;

        const messageData: any = {
            user_name: userName,
            content: newMessage.trim() || (selectedTask ? `Shared a task: ${selectedTask.title}` : '')
        };

        if (selectedTask) {
            messageData.task_id = selectedTask.id;
            messageData.task_title = selectedTask.title;
            messageData.task_status = selectedTask.status;
            messageData.task_priority = selectedTask.priority || 'Medium';
        }

        const { error } = await supabase.from('messages').insert(messageData);

        if (!error) {
            setNewMessage('');
            setSelectedTask(null);
            setShowTaskPicker(false);
        }
    };

    const handleTyping = () => {
        // Broadcast typing event
        supabase.channel('typing-channel').send({
            type: 'broadcast',
            event: 'typing',
            payload: { user_name: userName }
        });

        // Debounce: Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'High': return 'bg-red-100 text-red-700 border-red-200';
            case 'Low': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-orange-100 text-orange-700 border-orange-200';
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                    } bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-110`}
            >
                <MessageCircle size={24} />
                {messages.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center">
                        {messages.length > 99 ? '99+' : messages.length}
                    </span>
                )}
            </button>

            {/* Slide-Out Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <div className="flex items-center gap-3">
                        <Users size={20} />
                        <div>
                            <h2 className="font-bold">Team Chat</h2>
                            <p className="text-xs text-white/70">Collaborate in real-time</p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-400 mt-12">
                            <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="font-medium">No messages yet</p>
                            <p className="text-sm">Start the conversation!</p>
                        </div>
                    )}

                    {messages.map((msg) => {
                        const isMe = msg.user_name === userName;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] ${isMe ? 'order-2' : ''}`}>
                                    <div className={`px-4 py-2 rounded-2xl ${isMe
                                        ? 'bg-blue-600 text-white rounded-br-md'
                                        : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                                        }`}>
                                        {!isMe && (
                                            <p className="text-xs font-bold text-blue-600 mb-1">{msg.user_name}</p>
                                        )}
                                        {msg.content && <p className="text-sm">{msg.content}</p>}

                                        {/* Attached Task Card */}
                                        {msg.task_title && (
                                            <div className={`mt-2 p-3 rounded-xl border ${isMe ? 'bg-blue-700/30 border-blue-400/30' : 'bg-gray-50 border-gray-200'
                                                }`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CheckSquare size={14} className={isMe ? 'text-blue-200' : 'text-blue-600'} />
                                                    <span className={`text-xs font-bold uppercase ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>
                                                        Shared Task
                                                    </span>
                                                </div>
                                                <p className={`text-sm font-bold ${isMe ? 'text-white' : 'text-gray-900'}`}>
                                                    {msg.task_title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isMe ? 'bg-white/20 border-white/30 text-white' : getPriorityColor(msg.task_priority)
                                                        }`}>
                                                        {msg.task_priority || 'Medium'}
                                                    </span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isMe ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                                                        }`}>
                                                        {msg.task_status}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <p className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'text-right' : ''}`}>
                                        {formatTime(msg.created_at)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}

                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                        <div className="flex items-center gap-2 text-gray-400 text-sm animate-pulse">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                            <span className="text-xs">
                                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                            </span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Task Picker Modal */}
                {showTaskPicker && (
                    <div className="absolute bottom-24 left-4 right-4 bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-64 overflow-y-auto z-10">
                        <div className="p-3 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                            <span className="font-bold text-gray-700 text-sm">Select a Task to Share</span>
                            <button onClick={() => setShowTaskPicker(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-2">
                            {tasks.map(task => (
                                <button
                                    key={task.id}
                                    onClick={() => {
                                        setSelectedTask(task);
                                        setShowTaskPicker(false);
                                    }}
                                    className="w-full text-left p-3 hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-3"
                                >
                                    <CheckSquare size={16} className="text-blue-600" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                                        <p className="text-xs text-gray-500 capitalize">{task.status}</p>
                                    </div>
                                </button>
                            ))}
                            {tasks.length === 0 && (
                                <p className="text-center text-gray-400 text-sm py-4">No tasks found</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Selected Task Preview */}
                {selectedTask && (
                    <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckSquare size={16} className="text-blue-600" />
                            <span className="text-sm font-medium text-blue-900 truncate max-w-[200px]">
                                {selectedTask.title}
                            </span>
                        </div>
                        <button
                            onClick={() => setSelectedTask(null)}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-gray-100 bg-white">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setShowTaskPicker(!showTaskPicker); fetchTasks(); }}
                            className={`p-3 rounded-full transition-all ${showTaskPicker || selectedTask
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            title="Attach a task"
                        >
                            <Paperclip size={18} />
                        </button>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!newMessage.trim() && !selectedTask}
                            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                        Logged in as <span className="font-bold">{userName}</span>
                    </p>
                </div>
            </div>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
