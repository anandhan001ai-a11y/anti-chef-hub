import { useState, useRef, useEffect } from 'react';
import { FileUp, Send, Sparkles, Loader2, X, Upload, ChefHat, MessageCircle } from 'lucide-react';
import { menuAIService } from '../../lib/MenuAIService';

interface MenuAIProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function MenuAI({ isOpen, onClose }: MenuAIProps) {
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your Menu AI assistant. Today is ${todayStr}.\n\nUpload a menu file and ask me anything about what's being served. You can ask using day numbers (Day 5) or actual dates (December 15, Christmas, etc.). I can help with ingredients, allergens, dietary options, and more.`,
      timestamp: new Date()
    }
  ]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMenuLoaded, setIsMenuLoaded] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      addMessage({
        role: 'assistant',
        content: 'Please upload an Excel file (.xlsx or .xls). You can also paste menu data as text.'
      });
      return;
    }

    setIsLoading(true);
    try {
      const menuData = await menuAIService.parseMenuFromFile(file);
      menuAIService.setMenuData(menuData);

      const summary = menuAIService.getMenuSummary();
      const todayDayNum = menuAIService.getTodaysDayNumber();
      const todaysMenu = menuAIService.getCurrentMenu()?.days[todayDayNum];
      const dateInfo = todaysMenu?.date_info;

      const todayStr = dateInfo ? `Today is ${dateInfo.formatted}` : 'Menu loaded';

      addMessage({
        role: 'assistant',
        content: `Perfect! ${summary}\n\n${todayStr}\n\nI now have access to the complete menu. You can ask me:\n- What's for breakfast/lunch/dinner on a specific day\n- What items contain specific allergens\n- What vegetarian/vegan options are available\n- What's being served around holidays or special dates\n\nWhat would you like to know?`
      });

      setIsMenuLoaded(true);
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: `Error loading menu: ${(error as any).message}`
      });
    }
    setIsLoading(false);
  };

  const addMessage = (
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      ...message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    if (!isMenuLoaded) {
      addMessage({
        role: 'assistant',
        content: 'Please upload a menu file first so I can answer your questions.'
      });
      return;
    }

    const userMessage = query.trim();
    setQuery('');
    addMessage({
      role: 'user',
      content: userMessage
    });

    setIsLoading(true);
    try {
      const response = await menuAIService.queryMenu(userMessage);
      addMessage({
        role: 'assistant',
        content: response
      });
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: `Error: ${(error as any).message}`
      });
    }
    setIsLoading(false);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Menu AI Assistant</h2>
              <p className="text-amber-100 text-xs">Ask about daily menus & allergens</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2.5 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-cyan-600 text-white rounded-br-none'
                    : 'bg-slate-700 text-slate-100 rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
                <span className="text-xs opacity-60 mt-1 block">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <div className="bg-slate-700 text-slate-100 px-4 py-2.5 rounded-lg rounded-bl-none">
                <p className="text-sm">Thinking...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Upload Area or Input */}
        {!isMenuLoaded ? (
          <div className="border-t border-slate-700 p-6">
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-slate-600 bg-slate-700/30'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <FileUp className="w-8 h-8 text-cyan-400" />
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    Drop menu file here or{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-cyan-400 hover:underline"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Excel files (.xlsx) or paste menu data
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendQuery} className="border-t border-slate-700 p-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ask about the menu... (e.g., What's for breakfast on December 15? or Day 5?)"
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  query.trim() && !isLoading
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 text-xs text-slate-400 hover:text-slate-300 flex items-center justify-center gap-2 transition-colors"
            >
              <Upload className="w-3 h-3" />
              Upload new menu file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
          </form>
        )}
      </div>
    </div>
  );
}
