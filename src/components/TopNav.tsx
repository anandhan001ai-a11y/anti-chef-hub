import { Plus, Command, Bot, Loader2, Mic, Square, FileText, X, Sparkles, Clock, UserPlus, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { googleService } from '../lib/google';
import { createTask } from '../lib/taskService';
import { aiService } from '../lib/aiService';
import { meetingNotesService, MeetingNote, ActionItem } from '../lib/MeetingNotesService';

type TopNavProps = {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddTask: () => void;
  activeSection?: string;
};

const filters = ['This Week', 'This Month', 'Full Year'];

export default function TopNav({
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery,
  onAddTask,
  activeSection
}: TopNavProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [meetingSummary, setMeetingSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [savedNotes, setSavedNotes] = useState<MeetingNote[]>([]);
  const [showNotesList, setShowNotesList] = useState(false);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [creatingTask, setCreatingTask] = useState<string | null>(null);
  const [quickTaskInput, setQuickTaskInput] = useState('');
  const [quickTaskAssignee, setQuickTaskAssignee] = useState('');
  const [isAddingQuickTask, setIsAddingQuickTask] = useState(false);

  // Timer for recording duration
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Load saved notes when modal opens
  useEffect(() => {
    if (showMeetingModal) {
      loadSavedNotes();
    }
  }, [showMeetingModal]);

  const loadSavedNotes = async () => {
    const notes = await meetingNotesService.getMeetingNotes();
    setSavedNotes(notes.slice(0, 5)); // Show last 5
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setLiveTranscript('');
    setMeetingSummary('');
    setRecordingDuration(0);

    const started = await meetingNotesService.startRecording((text) => {
      setLiveTranscript(text);
    });

    if (started) {
      setIsRecording(true);
    } else {
      alert('Could not start recording. Please allow microphone access.');
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setIsSummarizing(true);

    const result = await meetingNotesService.stopRecording();

    if (result) {
      // Get AI summary and action items in parallel
      const [summary, items] = await Promise.all([
        meetingNotesService.getSummary(result.transcript),
        meetingNotesService.extractActionItems(result.transcript)
      ]);

      setMeetingSummary(summary);
      setActionItems(items);

      // Save the meeting note
      const profile = localStorage.getItem('chef_profile');
      const userName = profile ? JSON.parse(profile).name : 'Chef';

      await meetingNotesService.saveMeetingNote({
        title: `Meeting ${new Date().toLocaleDateString()}`,
        transcript: result.transcript,
        summary: summary,
        action_items: items,
        duration: result.duration,
        recorded_by: userName,
        status: 'complete'
      });

      loadSavedNotes();
    }

    setIsSummarizing(false);
  };

  const cancelRecording = () => {
    meetingNotesService.cancelRecording();
    setIsRecording(false);
    setRecordingDuration(0);
    setLiveTranscript('');
  };

  const getBrief = async (noteId: string) => {
    const brief = await meetingNotesService.getMeetingBrief(noteId);
    if (brief) {
      setMeetingSummary(brief);
      setShowNotesList(false);
    }
  };

  // Create task from action item
  const createTaskFromAction = async (item: ActionItem) => {
    setCreatingTask(item.id);
    try {
      await createTask({
        title: item.task,
        description: `Assigned to: ${item.assignee}\nFrom meeting notes`,
        board_type: 'todo',
        status: 'pending'
      });

      // Mark as created
      setActionItems(prev => prev.map(ai =>
        ai.id === item.id ? { ...ai, created: true } : ai
      ));
    } catch (err) {
      console.error('Error creating task:', err);
    }
    setCreatingTask(null);
  };

  // Quick add manual task
  const handleQuickAddTask = async () => {
    if (!quickTaskInput.trim()) return;

    setIsAddingQuickTask(true);
    try {
      await createTask({
        title: quickTaskInput.trim(),
        description: quickTaskAssignee ? `Assigned to: ${quickTaskAssignee}\nFrom meeting notes` : 'From meeting notes',
        board_type: 'todo',
        status: 'pending'
      });

      setQuickTaskInput('');
      setQuickTaskAssignee('');
      alert('✅ Task created successfully!');
    } catch (err) {
      console.error('Error creating quick task:', err);
      alert('Failed to create task');
    }
    setIsAddingQuickTask(false);
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsProcessing(true);
      const cmd = searchQuery.toLowerCase();

      try {
        // --- AI COMMAND: SYNC TASKS ---
        if (cmd.includes('sync') && (cmd.includes('task') || cmd.includes('google'))) {
          const tasks = await googleService.fetchTasks();
          let count = 0;
          for (const t of tasks) {
            // Only import if title exists
            if (t.title) {
              await createTask({
                title: t.title,
                description: t.notes || 'Imported from Google Tasks',
                board_type: 'todo',
                status: t.status === 'completed' ? 'completed' : 'pending'
              });
              count++;
            }
          }
          alert(`✨ Success! Synced ${count} tasks from Google.`);
          setSearchQuery('');
        }

        // --- AI COMMAND: CONNECT INVENTORY (Mock for specific Sheet ID) ---
        else if (cmd.includes('inventory') && cmd.includes('sheet')) {
          // In a real app, AI would extract the ID. Here we mock or ask user.
          const sheetId = prompt("Please enter the Google Sheet ID:");
          if (sheetId) {
            const data = await googleService.fetchInventory(sheetId, 'Sheet1!A1:B10');
            console.log('Inventory Data:', data);
            alert(`Fetched ${data?.length || 0} rows from Sheet. (View console)`);
          }
        }

        // --- GENERAL AI QUERY ---
        else {
          const response = await aiService.sendMessage(searchQuery);
          alert(response); // In future, use a nice toast or modal
          setSearchQuery('');
        }

      } catch (err) {
        console.error(err);
        alert('Error executing AI command. Please check your Google Credentials in the Settings page and ensure you have granted pop-up permissions.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40 shadow-soft">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">

          {/* Meeting Notes Button + Filters */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full lg:w-auto pb-2 lg:pb-0 h-10">
            {/* Meeting Notes Button */}
            <button
              onClick={() => setShowMeetingModal(true)}
              className="px-4 lg:px-6 py-2 rounded-full text-xs lg:text-sm font-bold transition-all duration-200 whitespace-nowrap bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-200 hover:scale-105 flex items-center gap-2"
            >
              <Mic size={14} />
              Meeting Notes
            </button>

            {activeSection !== 'whiteboard' && filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 lg:px-6 py-2 rounded-full text-xs lg:text-sm font-bold transition-all duration-200 whitespace-nowrap ${activeFilter === filter
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* AI Command Center */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative group flex-1 lg:w-96">
              {/* Glow Effect */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 rounded-full opacity-30 group-hover:opacity-60 transition duration-500 blur ${isProcessing ? 'animate-pulse opacity-100' : ''}`}></div>

              <div className="relative flex items-center bg-white rounded-full border border-gray-100 shadow-sm">
                <div className="pl-4 pr-2">
                  {isProcessing ? <Loader2 className="w-5 h-5 text-purple-500 animate-spin" /> : <Bot className="w-5 h-5 text-purple-500" />}
                </div>
                <input
                  type="text"
                  placeholder="Ask AI: 'Sync Google Tasks' or 'Check Inventory'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full py-3 bg-transparent border-none outline-none text-gray-700 text-sm placeholder-gray-400 font-medium"
                />
                <div className="pr-2 hidden md:block">
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded text-[10px] font-bold text-gray-400 border border-gray-100">
                    <Command size={10} /> K
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onAddTask}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full font-bold hover:bg-black hover:scale-105 transition-all duration-200 whitespace-nowrap shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden md:inline">Add</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Meeting Notes Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Mic size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Meeting Notes</h2>
                    <p className="text-sm text-white/80">Record, transcribe & get AI briefs</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (isRecording) cancelRecording();
                    setShowMeetingModal(false);
                    setMeetingSummary('');
                    setLiveTranscript('');
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Recording Controls */}
              <div className="flex items-center justify-center gap-4">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-bold hover:scale-105 transition-all shadow-xl"
                  >
                    <Mic size={20} />
                    Start Recording
                  </button>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-6 py-3 bg-red-50 rounded-full">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="font-mono text-red-600 font-bold text-lg">
                        {formatDuration(recordingDuration)}
                      </span>
                    </div>
                    <button
                      onClick={stopRecording}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full font-bold hover:bg-black transition-all"
                    >
                      <Square size={16} />
                      Stop & Get Brief
                    </button>
                    <button
                      onClick={cancelRecording}
                      className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </>
                )}
              </div>

              {/* Live Transcript */}
              {(isRecording || liveTranscript) && (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2">
                    <FileText size={14} />
                    Live Transcript
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed min-h-[60px]">
                    {liveTranscript || (isRecording ? 'Listening...' : 'No speech detected')}
                  </p>
                </div>
              )}

              {/* AI Summary */}
              {isSummarizing && (
                <div className="flex items-center justify-center gap-3 py-8">
                  <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" />
                  <span className="text-gray-600 font-medium">Generating AI Brief...</span>
                </div>
              )}

              {meetingSummary && !isSummarizing && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100">
                  <div className="flex items-center gap-2 text-sm font-bold text-purple-600 mb-3">
                    <Sparkles size={14} />
                    AI Meeting Brief
                  </div>
                  <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {meetingSummary}
                  </div>
                </div>
              )}

              {/* Action Items - Assign to Staff */}
              {actionItems.length > 0 && !isSummarizing && (
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-4 border border-orange-100">
                  <div className="flex items-center gap-2 text-sm font-bold text-orange-600 mb-3">
                    <UserPlus size={14} />
                    Action Items ({actionItems.length})
                  </div>
                  <div className="space-y-2">
                    {actionItems.map(item => (
                      <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border ${item.created ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${item.created ? 'text-green-700 line-through' : 'text-gray-800'}`}>
                            {item.task}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">👤 {item.assignee}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${item.priority === 'high' ? 'bg-red-100 text-red-600' :
                              item.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                              {item.priority}
                            </span>
                          </div>
                        </div>
                        {item.created ? (
                          <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
                            <CheckCircle size={14} />
                            Added
                          </div>
                        ) : (
                          <button
                            onClick={() => createTaskFromAction(item)}
                            disabled={creatingTask === item.id}
                            className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {creatingTask === item.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Plus size={12} />
                            )}
                            Assign Task
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Add Task - Always Available */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
                <div className="flex items-center gap-2 text-sm font-bold text-green-600 mb-3">
                  <Plus size={14} />
                  Quick Add Task
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={quickTaskInput}
                    onChange={(e) => setQuickTaskInput(e.target.value)}
                    placeholder="Enter task from meeting..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={quickTaskAssignee}
                      onChange={(e) => setQuickTaskAssignee(e.target.value)}
                      placeholder="Assign to (optional)"
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                    <button
                      onClick={handleQuickAddTask}
                      disabled={!quickTaskInput.trim() || isAddingQuickTask}
                      className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isAddingQuickTask ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Plus size={14} />
                      )}
                      Add Task
                    </button>
                  </div>
                </div>
              </div>

              {/* Previous Notes */}
              <div>
                <button
                  onClick={() => setShowNotesList(!showNotesList)}
                  className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                >
                  <Clock size={14} />
                  Previous Meetings ({savedNotes.length})
                </button>

                {showNotesList && savedNotes.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {savedNotes.map(note => (
                      <div key={note.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{note.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(note.created_at).toLocaleString()} • {formatDuration(note.duration)}
                          </p>
                        </div>
                        <button
                          onClick={() => getBrief(note.id)}
                          className="px-3 py-1.5 bg-purple-100 text-purple-600 rounded-lg text-xs font-bold hover:bg-purple-200 transition-colors"
                        >
                          Get Brief
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

