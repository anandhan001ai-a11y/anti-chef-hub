import { useState } from 'react';
import { Mail, Send, Sparkles, Copy, Check, RefreshCw, Trash2, ChevronRight, FileText } from 'lucide-react';
import { aiService } from '../../lib/aiService';

type EmailMode = 'reply' | 'new';
type EmailTone = 'professional' | 'friendly' | 'formal' | 'casual';

interface EmailWriterProps {
  onClose?: () => void;
}

export default function EmailWriter({ onClose }: EmailWriterProps) {
  const [mode, setMode] = useState<EmailMode>('reply');
  const [step, setStep] = useState<1 | 2>(1);
  const [receivedEmail, setReceivedEmail] = useState('');
  const [emailDetails, setEmailDetails] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [subject, setSubject] = useState('');
  const [tone, setTone] = useState<EmailTone>('professional');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (mode === 'reply' && !receivedEmail.trim()) {
      return;
    }
    if (!emailDetails.trim()) {
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = buildPrompt();
      const response = await aiService.sendMessage(prompt, 'Email Writing Assistant');

      const cleanedResponse = response
        .replace(/```[\w]*\n?/g, '')
        .replace(/```/g, '')
        .trim();

      setGeneratedEmail(cleanedResponse);
    } catch (error) {
      console.error('Email generation error:', error);
      setGeneratedEmail('Failed to generate email. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const buildPrompt = () => {
    const toneDescriptions: Record<EmailTone, string> = {
      professional: 'professional yet warm, clear and concise',
      friendly: 'friendly and approachable while maintaining professionalism',
      formal: 'highly formal and structured, suitable for official communications',
      casual: 'casual and conversational, relaxed but appropriate for work'
    };

    if (mode === 'reply') {
      return `You are an expert email writing assistant. Write a reply email based on the following:

**Original Email Received:**
${receivedEmail}

**What the user wants to say in their reply:**
${emailDetails}

**Tone:** ${toneDescriptions[tone]}
${recipientName ? `**Recipient Name:** ${recipientName}` : ''}

**Instructions:**
1. Analyze the original email to understand context, sender's concerns, and any questions asked
2. Craft a thoughtful reply that addresses all points from the original email
3. Incorporate the user's intended message naturally
4. Match the tone specified
5. Include appropriate greeting and sign-off
6. Keep it concise but complete
7. Do NOT include subject line - just the email body
8. Do NOT add any explanations or notes - just the email text

Write the reply email now:`;
    } else {
      return `You are an expert email writing assistant. Write a new email based on the following:

**Purpose/Message:**
${emailDetails}

**Tone:** ${toneDescriptions[tone]}
${recipientName ? `**Recipient Name:** ${recipientName}` : ''}
${subject ? `**Subject Context:** ${subject}` : ''}

**Instructions:**
1. Write a clear, well-structured email
2. Include appropriate greeting and sign-off
3. Match the tone specified
4. Be concise but thorough
5. Do NOT include subject line - just the email body
6. Do NOT add any explanations or notes - just the email text

Write the email now:`;
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setReceivedEmail('');
    setEmailDetails('');
    setRecipientName('');
    setSubject('');
    setGeneratedEmail('');
    setStep(1);
  };

  const canProceedToStep2 = mode === 'new' || receivedEmail.trim().length > 0;
  const canGenerate = emailDetails.trim().length > 0;

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">AI Email Writer</h2>
            <p className="text-cyan-100 text-sm">Powered by Sid AI</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            &times;
          </button>
        )}
      </div>

      <div className="p-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => { setMode('reply'); setStep(1); }}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              mode === 'reply'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Reply to Email
          </button>
          <button
            onClick={() => { setMode('new'); setStep(2); }}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              mode === 'new'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            New Email
          </button>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            step === 1 ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-400'
          }`}>
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">1</span>
            {mode === 'reply' ? 'Received Email' : 'Start'}
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            step === 2 ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-400'
          }`}>
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">2</span>
            Email Details
          </div>
        </div>

        {mode === 'reply' && step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Paste the Email You Received
              </label>
              <textarea
                value={receivedEmail}
                onChange={(e) => setReceivedEmail(e.target.value)}
                placeholder="Copy and paste the email you want to reply to here...

Example:
Hi Team,

I wanted to follow up on our meeting yesterday regarding the new menu items. Can you please send me the updated pricing by end of day?

Thanks,
John"
                className="w-full h-48 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
              />
              <p className="text-slate-500 text-xs mt-1">
                Pasting the original email helps AI understand context and write a better reply
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canProceedToStep2}
              className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                canProceedToStep2
                  ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              Continue to Step 2
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {mode === 'reply' && receivedEmail && (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wide">Original Email</span>
                  <button
                    onClick={() => setStep(1)}
                    className="text-cyan-400 text-xs hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-slate-300 text-sm line-clamp-3">{receivedEmail}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Recipient Name (optional)
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g., John"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as EmailTone)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
            </div>

            {mode === 'new' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Subject (optional)
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What is this email about?"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Sparkles className="w-4 h-4 inline mr-2 text-amber-400" />
                What do you want to say?
              </label>
              <textarea
                value={emailDetails}
                onChange={(e) => setEmailDetails(e.target.value)}
                placeholder={mode === 'reply'
                  ? "Describe what you want to say in your reply...\n\nExample:\n- Yes, I'll send the pricing by 5pm\n- Also ask about the vegetarian options\n- Thank them for the quick turnaround"
                  : "Describe what you want to communicate...\n\nExample:\n- Request time off for next week\n- Inform about the kitchen maintenance schedule\n- Ask about the new supplier contract"
                }
                className="w-full h-36 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
              />
              <p className="text-slate-500 text-xs mt-1">
                Be as detailed as you want - bullet points work great!
              </p>
            </div>

            <div className="flex gap-3">
              {mode === 'reply' && (
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
                className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                  canGenerate && !isGenerating
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-600/30'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Email
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {generatedEmail && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" />
                Generated Email
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Regenerate"
                >
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleCopy}
                  className="p-2 text-slate-400 hover:text-green-400 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleReset}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
              <pre className="text-slate-200 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {generatedEmail}
              </pre>
            </div>

            {copied && (
              <div className="text-center text-green-400 text-sm">
                Email copied to clipboard!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
