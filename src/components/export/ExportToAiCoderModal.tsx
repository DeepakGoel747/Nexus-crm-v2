import { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Code2, 
  Terminal, 
  Sparkles, 
  ExternalLink,
  Bot,
  Laptop
} from 'lucide-react';

interface ExportToAiCoderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceName?: string;
}

export function ExportToAiCoderModal({
  isOpen,
  onClose,
  workspaceName = 'Nexus CRM',
}: ExportToAiCoderModalProps) {
  const [activeTab, setActiveTab] = useState<'cursor' | 'claude' | 'cli' | 'json'>('cursor');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const mcpUrl = `${currentOrigin}/api/ai/mcp`;

  const cursorConfig = JSON.stringify(
    {
      mcpServers: {
        'nexus-crm': {
          command: 'node',
          args: ['server.ts'],
          url: mcpUrl,
          env: {
            PORT: '3000',
            GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY',
          },
        },
      },
    },
    null,
    2
  );

  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        'nexus-crm': {
          command: 'node',
          args: ['/path/to/nexus-crm/server.ts'],
          env: {
            PORT: '3000',
            GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY',
          },
        },
      },
    },
    null,
    2
  );

  const cliCommands = `# 1. Install dependencies
npm install

# 2. Set environment variables
echo "GEMINI_API_KEY=your_key_here" > .env

# 3. Launch full-stack system with persistent database & Gemini AI
npm run dev

# 4. Open in Cursor / Windsurf / VS Code
cursor .`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111216] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Export System to Your AI Coder
              </h2>
              <p className="text-xs text-neutral-500">
                Connect Cursor, Windsurf, Claude Code, or VS Code to this CRM via Model Context Protocol (MCP)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-5 bg-neutral-50 dark:bg-white/[0.02] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('cursor')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'cursor'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <Laptop className="h-3.5 w-3.5" />
            <span>Cursor & Windsurf (MCP)</span>
          </button>

          <button
            onClick={() => setActiveTab('claude')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'claude'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>Claude Desktop</span>
          </button>

          <button
            onClick={() => setActiveTab('cli')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'cli'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Local CLI Setup</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'json'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <Download className="h-3.5 w-3.5" />
            <span>Raw Database JSON</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: CURSOR MCP */}
          {activeTab === 'cursor' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5 text-purple-800 dark:text-purple-300">
                <p className="font-semibold mb-1">How to connect Cursor directly to your live CRM database:</p>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                  <li>In Cursor, open <strong>Settings</strong> (<code>⌘ ,</code>) → <strong>Features</strong> → <strong>MCP</strong>.</li>
                  <li>Click <strong>+ Add New MCP Server</strong>.</li>
                  <li>Paste the configuration snippet below or save it as <code>.cursor/mcp.json</code> in your project.</li>
                  <li>In Cursor Composer / Chat, your AI can now run tools like <code>find_deals</code>, <code>enrich_company</code>, and <code>log_activity</code>!</li>
                </ol>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between bg-neutral-900 text-neutral-400 px-3 py-1.5 rounded-t-lg font-mono text-[11px]">
                  <span>.cursor/mcp.json</span>
                  <button
                    onClick={() => handleCopy(cursorConfig, 'cursor')}
                    className="flex items-center gap-1 text-white hover:text-purple-400 cursor-pointer"
                  >
                    {copiedKey === 'cursor' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === 'cursor' ? 'Copied!' : 'Copy Config'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-neutral-950 text-neutral-200 rounded-b-lg font-mono text-[11px] overflow-x-auto">
                  <code>{cursorConfig}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: CLAUDE DESKTOP */}
          {activeTab === 'claude' && (
            <div className="space-y-3">
              <p className="text-neutral-600 dark:text-neutral-400">
                Add this to your Claude Desktop config (<code>~/Library/Application Support/Claude/claude_desktop_config.json</code> on macOS):
              </p>

              <div className="relative">
                <div className="flex items-center justify-between bg-neutral-900 text-neutral-400 px-3 py-1.5 rounded-t-lg font-mono text-[11px]">
                  <span>claude_desktop_config.json</span>
                  <button
                    onClick={() => handleCopy(claudeDesktopConfig, 'claude')}
                    className="flex items-center gap-1 text-white hover:text-purple-400 cursor-pointer"
                  >
                    {copiedKey === 'claude' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === 'claude' ? 'Copied!' : 'Copy Config'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-neutral-950 text-neutral-200 rounded-b-lg font-mono text-[11px] overflow-x-auto">
                  <code>{claudeDesktopConfig}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: CLI SETUP */}
          {activeTab === 'cli' && (
            <div className="space-y-3">
              <p className="text-neutral-600 dark:text-neutral-400">
                Commands to run the entire backend server, persistent database, and frontend locally on your machine:
              </p>

              <div className="relative">
                <div className="flex items-center justify-between bg-neutral-900 text-neutral-400 px-3 py-1.5 rounded-t-lg font-mono text-[11px]">
                  <span>terminal commands</span>
                  <button
                    onClick={() => handleCopy(cliCommands, 'cli')}
                    className="flex items-center gap-1 text-white hover:text-purple-400 cursor-pointer"
                  >
                    {copiedKey === 'cli' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === 'cli' ? 'Copied!' : 'Copy Commands'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-neutral-950 text-neutral-200 rounded-b-lg font-mono text-[11px] overflow-x-auto">
                  <code>{cliCommands}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: DATABASE JSON */}
          {activeTab === 'json' && (
            <div className="space-y-3">
              <p className="text-neutral-600 dark:text-neutral-400">
                Download a complete, isolated JSON backup of all accounts, opportunities, contacts, tasks, notes, and workflows for <strong>{workspaceName}</strong>.
              </p>

              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-white/[0.02] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-neutral-900 dark:text-white">Workspace Data Export</h4>
                  <p className="text-[11px] text-neutral-500">Includes all entities, custom fields, and AI enrichment history</p>
                </div>

                <a
                  href="/api/export/full-database"
                  download
                  className="rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-bold px-4 py-2 flex items-center gap-1.5 shadow-sm hover:opacity-90"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download JSON</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-white/[0.02] flex items-center justify-between text-xs">
          <span className="text-neutral-500 font-mono text-[11px]">
            MCP Endpoint: <code className="text-purple-600 dark:text-purple-400">{mcpUrl}</code>
          </span>

          <button
            onClick={onClose}
            className="rounded-lg bg-neutral-200 dark:bg-white/10 px-4 py-1.5 font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-white/20 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
