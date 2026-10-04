import { useRef, useState } from 'react';
import { Bot, Database, Plus, Send, Sparkles, Workflow } from 'lucide-react';
import { MarkdownText } from '../MarkdownText';

interface WorkspaceAiPageProps {
  isDark: boolean;
  onCreateRecord: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const workflowPrompt = 'Help me design a CRM workflow automation. Ask me what trigger and action I want, then propose a clear workflow configuration. Do not claim it is active until I configure it in Nexus.';

export function WorkspaceAiPage({ isDark, onCreateRecord }: WorkspaceAiPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCapabilities, setShowCapabilities] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sendMessage = async (message = prompt) => {
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: 'user', text: trimmed }]);
    setPrompt('');
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('nexus_token');
      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `AI request failed (${response.status}).`);
      if (typeof data.reply !== 'string' || !data.reply.trim()) {
        throw new Error('Nexus AI returned an empty response. Please try again.');
      }
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: 'assistant', text: data.reply }]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to contact Nexus AI.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const composer = (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void sendMessage();
      }}
      className={`rounded-xl border p-3 shadow-sm focus-within:border-blue-500 ${isDark ? 'border-neutral-700 bg-[#101116]' : 'border-neutral-300 bg-white'}`}
    >
      <textarea
        ref={inputRef}
        aria-label="Ask Nexus AI"
        placeholder="Ask anything, or ask about your CRM..."
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void sendMessage();
          }
        }}
        rows={3}
        disabled={loading}
        className="max-h-40 min-h-16 w-full resize-y bg-transparent text-sm outline-none placeholder:text-neutral-400 disabled:opacity-60"
      />
      <div className="flex items-center justify-between pt-2">
        <span className="text-[10px] text-neutral-400">Enter to send · Shift + Enter for a new line</span>
        <button type="submit" disabled={!prompt.trim() || loading} aria-label="Send message" className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white disabled:cursor-not-allowed disabled:opacity-40">
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </form>
  );

  return (
    <section className={`-m-4 flex min-h-full flex-col sm:-m-5 ${isDark ? 'bg-[#090a0d]' : 'bg-white'}`}>
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl">
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">What can I help you with?</h2>
              <p className="mt-2 text-xs text-neutral-500">Ask questions about your CRM or get help planning repetitive work.</p>
            </div>
            <div className="mb-3 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => { setPrompt(workflowPrompt); inputRef.current?.focus(); }} className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-2 text-[11px] text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-white/[0.05]">
                <Workflow className="h-3.5 w-3.5" /> Create a workflow
              </button>
              <button type="button" onClick={onCreateRecord} className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-2 text-[11px] text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-white/[0.05]">
                <Plus className="h-3.5 w-3.5" /> Create a record
              </button>
              <button type="button" onClick={() => setShowCapabilities((visible) => !visible)} className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-2 text-[11px] text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-white/[0.05]">
                <Sparkles className="h-3.5 w-3.5" /> See what I can do
              </button>
            </div>
            {showCapabilities && (
              <div className="mb-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs dark:border-neutral-800 dark:bg-white/[0.03]">
                <p className="font-medium">Nexus AI can help with</p>
                <ul className="mt-2 space-y-1.5 text-neutral-500">
                  <li>• Answer questions about company and opportunity data in this workspace.</li>
                  <li>• Summarize pipeline risks and recommend next steps.</li>
                  <li>• Draft emails and help design event-driven workflows.</li>
                </ul>
                <p className="mt-2 text-[10px] text-neutral-400">AI provides suggestions. Workflow rules must be configured and enabled in Nexus before they run.</p>
              </div>
            )}
            {error && <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
            {composer}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {[
                'Summarize my open pipeline and flag risks',
                'Which companies have no recent activity?',
                'Help me draft a follow-up email',
              ].map((example) => (
                <button key={example} type="button" onClick={() => void sendMessage(example)} className="rounded-full bg-neutral-100 px-3 py-1.5 text-[10px] text-neutral-600 hover:bg-neutral-200 dark:bg-white/[0.05] dark:text-neutral-400 dark:hover:bg-white/[0.1]">{example}</button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto max-w-3xl space-y-5">
              {messages.map((message) => (
                <article key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"><Bot className="h-4 w-4" /></span>}
                  {message.role === 'user' ? (
                    <p className="max-w-[85%] whitespace-pre-wrap rounded-xl bg-blue-600 px-4 py-3 text-sm leading-relaxed text-white">{message.text}</p>
                  ) : (
                    <div className="max-w-[85%] rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed dark:border-neutral-800 dark:bg-white/[0.03]">
                      <MarkdownText text={message.text} />
                    </div>
                  )}
                </article>
              ))}
              {loading && <p role="status" className="text-xs text-neutral-500">Nexus AI is checking your workspace…</p>}
              {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
            </div>
          </div>
          <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <div className="mx-auto max-w-3xl">
              <div className="mb-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => { setPrompt(workflowPrompt); inputRef.current?.focus(); }} className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2.5 py-1.5 text-[10px] text-neutral-600 dark:border-neutral-800 dark:text-neutral-300"><Workflow className="h-3 w-3" /> Design workflow</button>
                <button type="button" onClick={onCreateRecord} className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2.5 py-1.5 text-[10px] text-neutral-600 dark:border-neutral-800 dark:text-neutral-300"><Database className="h-3 w-3" /> Create record</button>
              </div>
              {composer}
            </div>
          </div>
        </>
      )}
      <p className="pb-2 text-center text-[10px] text-neutral-400">AI responses can be inaccurate. Review suggestions before acting.</p>
    </section>
  );
}
