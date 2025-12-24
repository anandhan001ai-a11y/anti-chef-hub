import { Plus, Mic, Square, FileText, X, Sparkles, Clock, UserPlus, CheckCircle, Mail, Send, Loader2, ChefHat } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createTask } from '../lib/taskService';
import { aiService } from '../lib/aiService';
import { meetingNotesService, MeetingNote, ActionItem } from '../lib/MeetingNotesService';
import MenuAI from './menu/MenuAI';

type TopNavProps = {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  onAddTask: () => void;
  activeSection?: string;
};

const filters = ['This Week', 'This Month', 'Full Year'];

export default function TopNav({
  activeFilter,
  setActiveFilter,
  onAddTask,
  activeSection
}: TopNavProps) {
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

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailDetails, setEmailDetails] = useState('');
  const [isRecordingEmail, setIsRecordingEmail] = useState(false);
  const [emailRecordingDuration, setEmailRecordingDuration] = useState(0);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [generatedBulletPoints, setGeneratedBulletPoints] = useState<string[]>([]);
  const [generatedEmailBody, setGeneratedEmailBody] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showMenuAI, setShowMenuAI] = useState(false);

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

  // Timer for email recording duration
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecordingEmail) {
      timer = setInterval(() => {
        setEmailRecordingDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecordingEmail]);

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

  // Email Recording
  const startEmailRecording = async () => {
    setEmailDetails('');
    setEmailRecordingDuration(0);

    const started = await meetingNotesService.startRecording((text) => {
      setEmailDetails(text);
    });

    if (started) {
      setIsRecordingEmail(true);
    } else {
      alert('Could not start recording. Please allow microphone access.');
    }
  };

  const stopEmailRecording = async () => {
    setIsRecordingEmail(false);
    const result = await meetingNotesService.stopRecording();
    if (result) {
      setEmailDetails(result.transcript);
    }
  };

  const cancelEmailRecording = () => {
    meetingNotesService.cancelRecording();
    setIsRecordingEmail(false);
    setEmailRecordingDuration(0);
    setEmailDetails('');
  };

  // Generate Email with AI
  const generateEmail = async () => {
    if (!emailDetails.trim()) {
      alert('Please provide some details for the email');
      return;
    }

    setIsGeneratingEmail(true);
    try {
      const prompt = `Based on the following details, create:
1. A list of key bullet points (3-5 points)
2. A professional email body incorporating these points

Details: ${emailDetails}

Format your response as JSON:
{
  "bulletPoints": ["point 1", "point 2", ...],
  "emailBody": "Professional email text here",
  "subject": "Suggested subject line"
}`;

      const response = await aiService.sendMessage(prompt);

      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setGeneratedBulletPoints(parsed.bulletPoints || []);
          setGeneratedEmailBody(parsed.emailBody || response);
          setEmailSubject(parsed.subject || '');
        } else {
          setGeneratedEmailBody(response);
          setGeneratedBulletPoints(['AI generated email - see body below']);
        }
      } catch (parseErr) {
        setGeneratedEmailBody(response);
        setGeneratedBulletPoints(['Email details provided successfully']);
      }
    } catch (err) {
      console.error('Error generating email:', err);
      alert('Failed to generate email. Please try again.');
    }
    setIsGeneratingEmail(false);
  };

  // Send Email
  const handleSendEmail = async () => {
    if (!emailTo.trim() || !generatedEmailBody.trim()) {
      alert('Please provide recipient email and generate email body');
      return;
    }

    setIsSendingEmail(true);
    try {
      console.log('Sending email to:', emailTo);
      console.log('Subject:', emailSubject);
      console.log('Body:', generatedEmailBody);

      alert('✅ Email draft created! (Email sending would be implemented with your email service)');

      setShowEmailModal(false);
      resetEmailModal();
    } catch (err) {
      console.error('Error sending email:', err);
      alert('Failed to send email');
    }
    setIsSendingEmail(false);
  };

  const resetEmailModal = () => {
    setEmailDetails('');
    setGeneratedBulletPoints([]);
    setGeneratedEmailBody('');
    setEmailSubject('');
    setEmailTo('');
    setEmailRecordingDuration(0);
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

            {/* Menu AI Button */}
            <button
              onClick={() => setShowMenuAI(true)}
              className="px-4 lg:px-6 py-2 rounded-full text-xs lg:text-sm font-bold transition-all duration-200 whitespace-nowrap bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-200 hover:scale-105 flex items-center gap-2"
            >
              <ChefHat size={14} />
              Menu AI
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

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full font-bold hover:scale-105 transition-all duration-200 whitespace-nowrap shadow-xl"
            >
              <Mail className="w-5 h-5" />
              <span className="hidden md:inline">Write Mail</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Email Composition Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Write Professional Email</h2>
                    <p className="text-sm text-white/80">AI-powered email composition with voice or text</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (isRecordingEmail) cancelEmailRecording();
                    setShowEmailModal(false);
                    resetEmailModal();
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Step 1: Input Details */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-100">
                <div className="flex items-center gap-2 text-sm font-bold text-blue-600 mb-3">
                  <FileText size={14} />
                  Step 1: Provide Email Details
                </div>

                <textarea
                  value={emailDetails}
                  onChange={(e) => setEmailDetails(e.target.value)}
                  placeholder="Type or record the details you want in your email...

Example: Tell the supplier we need 50kg tomatoes, 30kg onions by Friday. Payment terms net 30. Urgent order."
                  className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none h-32 mb-3"
                  disabled={isRecordingEmail}
                />

                {/* Voice Recording Controls */}
                <div className="flex items-center gap-3">
                  {!isRecordingEmail ? (
                    <button
                      onClick={startEmailRecording}
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all text-sm"
                    >
                      <Mic size={16} />
                      Record Details
                    </button>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="font-mono text-red-600 font-bold text-sm">
                          {formatDuration(emailRecordingDuration)}
                        </span>
                      </div>
                      <button
                        onClick={stopEmailRecording}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all text-sm"
                      >
                        <Square size={14} />
                        Stop
                      </button>
                      <button
                        onClick={cancelEmailRecording}
                        className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}

                  <button
                    onClick={generateEmail}
                    disabled={!emailDetails.trim() || isGeneratingEmail}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:scale-105 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                  >
                    {isGeneratingEmail ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Generate Email
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* AI Generating Indicator */}
              {isGeneratingEmail && (
                <div className="flex items-center justify-center gap-3 py-6">
                  <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" />
                  <span className="text-gray-600 font-medium">AI is crafting your professional email...</span>
                </div>
              )}

              {/* Step 2: Bullet Points */}
              {generatedBulletPoints.length > 0 && !isGeneratingEmail && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
                  <div className="flex items-center gap-2 text-sm font-bold text-purple-600 mb-3">
                    <Sparkles size={14} />
                    Key Points
                  </div>
                  <ul className="space-y-2">
                    {generatedBulletPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step 3: Generated Email */}
              {generatedEmailBody && !isGeneratingEmail && (
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
                    <div className="flex items-center gap-2 text-sm font-bold text-green-600 mb-3">
                      <Mail size={14} />
                      Professional Email Draft
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-gray-600 mb-1 block">To:</label>
                        <input
                          type="email"
                          value={emailTo}
                          onChange={(e) => setEmailTo(e.target.value)}
                          placeholder="recipient@example.com"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-600 mb-1 block">Subject:</label>
                        <input
                          type="text"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="Email subject"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-600 mb-1 block">Body:</label>
                        <textarea
                          value={generatedEmailBody}
                          onChange={(e) => setGeneratedEmailBody(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none h-48"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={handleSendEmail}
                    disabled={!emailTo.trim() || isSendingEmail}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Create Email Draft
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Helper Text */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-start gap-2 text-xs text-gray-600">
                  <Sparkles size={14} className="flex-shrink-0 mt-0.5 text-purple-500" />
                  <p>
                    <strong>How it works:</strong> Provide details via text or voice, click "Generate Email" to create bullet points and a professional email body, then review and send.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu AI Modal */}
      <MenuAI isOpen={showMenuAI} onClose={() => setShowMenuAI(false)} />

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

