import { useState } from 'react';
import { Bot, Terminal, Play, Sparkles, Database, CheckCircle, ArrowRight, CornerDownLeft } from 'lucide-react';
import { MCP_TOOLS } from '../data/mockCrmData';

export function McpAiSection() {
  const [selectedToolKey, setSelectedToolKey] = useState<string>('find_deals');
  const [isRunning, setIsRunning] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<string | null>(MCP_TOOLS.find_deals.sampleResponse);
  const [customPrompt, setCustomPrompt] = useState('Find all enterprise deals in negotiation stage above $100k');

  const handleRunMcp = (toolKey: string) => {
    setSelectedToolKey(toolKey);
    setIsRunning(true);
    setExecutionOutput(null);
    setTimeout(() => {
      setIsRunning(false);
      setExecutionOutput(MCP_TOOLS[toolKey].sampleResponse);
    }, 450);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    setIsRunning(true);
    setExecutionOutput(null);
    setTimeout(() => {
      setIsRunning(false);
      if (customPrompt.toLowerCase().includes('enrich') || customPrompt.toLowerCase().includes('resend')) {
        setSelectedToolKey('enrich_lead');
        setExecutionOutput(MCP_TOOLS.enrich_lead.sampleResponse);
      } else if (customPrompt.toLowerCase().includes('log') || customPrompt.toLowerCase().includes('note')) {
        setSelectedToolKey('log_activity');
        setExecutionOutput(MCP_TOOLS.log_activity.sampleResponse);
      } else {
        setSelectedToolKey('find_deals');
        setExecutionOutput(MCP_TOOLS.find_deals.sampleResponse);
      }
    }, 500);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
      <div className="rounded-2xl border border-white/10 bg-[#0d0e12] p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Explanations */}
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-neutral-300">
              <Bot className="h-3.5 w-3.5 text-neutral-300" />
              <span>Native MCP Protocol Server</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white" style={{ textWrap: 'balance' }}>
              Connect your CRM directly to Claude, Cursor, and LLM Agents
            </h2>

            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Nexus includes an official Model Context Protocol (MCP) server. Your AI assistants can search companies, update deal stages, enrich contacts, and log calls directly through natural language.
            </p>

            {/* Quick tool selector buttons */}
            <div className="pt-2 space-y-2">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                Sample MCP Actions
              </span>
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    setCustomPrompt('Find all enterprise deals in negotiation stage above $100k');
                    handleRunMcp('find_deals');
                  }}
                  className={`w-full flex items-center justify-between rounded-lg border p-2.5 text-xs text-left transition-colors ${
                    selectedToolKey === 'find_deals'
                      ? 'border-white/30 bg-white/10 text-white font-medium'
                      : 'border-white/[0.06] bg-white/[0.02] text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5 text-neutral-400" />
                    <span>find_deals(filters)</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">Query</span>
                </button>

                <button
                  onClick={() => {
                    setCustomPrompt('Enrich company metadata for resend.com');
                    handleRunMcp('enrich_lead');
                  }}
                  className={`w-full flex items-center justify-between rounded-lg border p-2.5 text-xs text-left transition-colors ${
                    selectedToolKey === 'enrich_lead'
                      ? 'border-white/30 bg-white/10 text-white font-medium'
                      : 'border-white/[0.06] bg-white/[0.02] text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-neutral-400" />
                    <span>enrich_company(domain)</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">Mutation</span>
                </button>

                <button
                  onClick={() => {
                    setCustomPrompt('Log meeting note to Linear Systems account timeline');
                    handleRunMcp('log_activity');
                  }}
                  className={`w-full flex items-center justify-between rounded-lg border p-2.5 text-xs text-left transition-colors ${
                    selectedToolKey === 'log_activity'
                      ? 'border-white/30 bg-white/10 text-white font-medium'
                      : 'border-white/[0.06] bg-white/[0.02] text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-neutral-400" />
                    <span>log_activity(recordId, payload)</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">Write</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live MCP Playground Console */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-white/10 bg-[#08090b] overflow-hidden shadow-2xl flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 bg-[#0f1014]">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-neutral-400" />
                  <span className="text-[11px] font-mono text-neutral-300">nexus-mcp-server: stdio</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-neutral-400 font-mono">MCP Protocol v1.0</span>
                </div>
              </div>

              {/* Natural Language Prompt Input */}
              <form onSubmit={handleCustomSubmit} className="border-b border-white/10 p-3 bg-white/[0.02]">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Ask your LLM assistant to query or update CRM..."
                    className="w-full rounded-md border border-white/10 bg-white/[0.04] py-2 pl-3 pr-20 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                  />
                  <button
                    type="submit"
                    disabled={isRunning}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded bg-white px-2.5 py-1 text-[11px] font-semibold text-black hover:bg-neutral-200 transition-colors disabled:opacity-50"
                  >
                    <span>Run</span>
                    <CornerDownLeft className="h-2.5 w-2.5" />
                  </button>
                </div>
              </form>

              {/* Tool Execution Stream */}
              <div className="p-4 font-mono text-xs space-y-3 min-h-[220px]">
                {/* Invoked Tool Call */}
                <div className="text-neutral-400">
                  <span className="text-neutral-500">&gt; Invoking tool:</span>{' '}
                  <span className="text-white font-semibold">
                    {MCP_TOOLS[selectedToolKey]?.sampleQuery}
                  </span>
                </div>

                {/* Output */}
                {isRunning ? (
                  <div className="flex items-center gap-2 text-neutral-500 pt-4">
                    <span className="h-2 w-2 rounded-full bg-neutral-400 animate-ping" />
                    <span>Executing tool against PostgreSQL database...</span>
                  </div>
                ) : executionOutput ? (
                  <div className="rounded border border-white/10 bg-black/40 p-3 overflow-x-auto text-[11px] text-emerald-400/90 leading-relaxed">
                    <pre>
                      <code>{executionOutput}</code>
                    </pre>
                  </div>
                ) : null}
              </div>

              {/* Footer */}
              <div className="border-t border-white/10 px-4 py-2 bg-[#0c0d10] flex items-center justify-between text-[11px] text-neutral-500">
                <span>Compatible with Claude Desktop, Cursor, and Ollama</span>
                <span className="font-mono">Zero API Keys Leaked</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
