import { useState } from 'react';
import { 
  ArrowLeft, 
  Terminal, 
  Database, 
  Code2, 
  Bot, 
  Server, 
  Layers, 
  Copy, 
  Check, 
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface DocsPageProps {
  onBackToHome: () => void;
  isDark: boolean;
}

export function DocsPage({ onBackToHome, isDark }: DocsPageProps) {
  const [activeSection, setActiveSection] = useState<'quickstart' | 'data_model' | 'graphql' | 'mcp' | 'self_host'>('quickstart');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const navItems = [
    { id: 'quickstart', label: 'Getting Started', icon: Terminal },
    { id: 'data_model', label: 'Data Model & Schema', icon: Database },
    { id: 'graphql', label: 'GraphQL & REST API', icon: Code2 },
    { id: 'mcp', label: 'MCP Server & AI', icon: Bot },
    { id: 'self_host', label: 'Docker Self-Hosting', icon: Server },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${
      isDark ? 'bg-[#090a0b] text-[#ededed]' : 'bg-[#faf9f6] text-[#141518]'
    }`}>
      {/* Top Docs Header */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#090a0b]/85 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Nexus Home</span>
          </button>
          <span className="text-neutral-300 dark:text-neutral-700">/</span>
          <span className="text-xs font-bold text-neutral-900 dark:text-white">Documentation</span>
          <span className="text-[10px] font-mono border border-neutral-200 dark:border-neutral-800 px-1.5 py-0.5 rounded text-neutral-500">
            v0.42.0
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search docs..."
              className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-white/[0.04] py-1 pl-8 pr-3 text-xs focus:outline-none"
            />
          </div>
        </div>
      </header>

      {/* Docs Body with Left Sidebar */}
      <div className="flex-1 mx-auto max-w-7xl w-full flex">
        {/* Left Navigation Sidebar */}
        <aside className="w-64 border-r border-neutral-200 dark:border-white/[0.08] p-6 hidden md:block shrink-0">
          <div className="space-y-1 text-xs">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-2 px-2">
              Core Guides
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as any)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left cursor-pointer ${
                    activeSection === item.id
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-black font-bold shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block px-2">
              Reference
            </span>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center justify-between px-2 py-1.5 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white">
              <span>GitHub Repo</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <a href="#self-host" className="flex items-center justify-between px-2 py-1.5 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white">
              <span>Compose Spec</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 sm:p-12 max-w-4xl">
          {activeSection === 'quickstart' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-neutral-500">Getting Started</span>
                <h1 className="mt-1 text-2xl sm:text-4xl font-extrabold tracking-tight">
                  Nexus CRM Quickstart Guide
                </h1>
                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Get a complete instance of Nexus running locally with Docker in under 60 seconds. All core objects (Companies, Opportunities, People, Tasks) and PostgreSQL schemas are bootstrapped automatically.
                </p>
              </div>

              {/* Step 1 */}
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-[#101116] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">1. Spin up with Docker Compose</h3>
                  <button
                    onClick={() => handleCopy('c1', 'docker compose up -d')}
                    className="flex items-center gap-1 text-[11px] font-mono text-neutral-500 hover:text-black dark:hover:text-white"
                  >
                    {copiedCode === 'c1' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCode === 'c1' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="rounded-lg bg-neutral-900 text-neutral-200 p-3 font-mono text-xs overflow-x-auto">
                  <code>curl -O https://raw.githubusercontent.com/nexus/nexus/main/docker-compose.yml && docker compose up -d</code>
                </div>
              </div>

              {/* Step 2 */}
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-[#101116] space-y-3">
                <h3 className="text-sm font-bold">2. Access your local web workspace</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Open your browser and navigate to <code className="font-mono bg-neutral-100 dark:bg-white/10 px-1 py-0.5 rounded text-neutral-900 dark:text-white">http://localhost:3000</code>. Complete the initial admin signup wizard to initialize your workspace database credentials.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'data_model' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-neutral-500">Architecture</span>
                <h1 className="mt-1 text-2xl sm:text-4xl font-extrabold tracking-tight">
                  Relational Data Model & PostgreSQL
                </h1>
                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Unlike legacy CRMs with proprietary multi-tenant schema locks, Nexus creates native PostgreSQL tables, foreign keys, and indexes directly for your entities.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-[#101116] space-y-4">
                <h3 className="text-sm font-bold">Standard Entities Overview</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-mono">
                        <th className="pb-2">Table</th>
                        <th className="pb-2">Primary Key</th>
                        <th className="pb-2">Key Relations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono">
                      <tr>
                        <td className="py-2.5 font-bold">companies</td>
                        <td>id (UUID)</td>
                        <td>opportunities (1:N), people (1:N)</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold">opportunities</td>
                        <td>id (UUID)</td>
                        <td>company_id (FK), owner_id (FK)</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold">people</td>
                        <td>id (UUID)</td>
                        <td>company_id (FK), activities (1:N)</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold">tasks</td>
                        <td>id (UUID)</td>
                        <td>assignee_id (FK), target_id (FK)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'graphql' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-neutral-500">Developer APIs</span>
                <h1 className="mt-1 text-2xl sm:text-4xl font-extrabold tracking-tight">
                  GraphQL & REST API Reference
                </h1>
                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Every field, custom object, and relationship created in the Nexus UI is instantly queryable and mutable via type-safe GraphQL or REST.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-[#101116] space-y-3">
                <h3 className="text-sm font-bold">Sample GraphQL Query</h3>
                <div className="rounded-lg bg-neutral-900 text-neutral-200 p-4 font-mono text-xs overflow-x-auto">
                  <pre>
                    <code>{`query GetHighValueDeals {
  opportunities(
    filter: { amount: { gte: 50000 }, stage: { eq: "negotiation" } }
  ) {
    id
    title
    amount
    company {
      name
      domain
    }
  }
}`}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'mcp' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-neutral-500">AI Integration</span>
                <h1 className="mt-1 text-2xl sm:text-4xl font-extrabold tracking-tight">
                  Native Model Context Protocol (MCP) Server
                </h1>
                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Connect your CRM database directly into Claude Desktop, Cursor, or your internal LLM agents via standard stdio or SSE transport.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-[#101116] space-y-3">
                <h3 className="text-sm font-bold">Claude Desktop Configuration (claude_desktop_config.json)</h3>
                <div className="rounded-lg bg-neutral-900 text-neutral-200 p-4 font-mono text-xs overflow-x-auto">
                  <pre>
                    <code>{`{
  "mcpServers": {
    "nexus-crm": {
      "command": "npx",
      "args": ["@nexus/mcp-server"],
      "env": {
        "NEXUS_SERVER_URL": "http://localhost:3000",
        "NEXUS_API_KEY": "nex_live_your_secret_token"
      }
    }
  }
}`}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'self_host' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-neutral-500">Deployment</span>
                <h1 className="mt-1 text-2xl sm:text-4xl font-extrabold tracking-tight">
                  Docker Compose & Helm Production Guide
                </h1>
                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Host Nexus on AWS ECS, GCP Cloud Run, DigitalOcean, or private bare-metal clusters with automated daily database backups.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-[#101116] space-y-3">
                <h3 className="text-sm font-bold">Standard Environment Variables</h3>
                <div className="rounded-lg bg-neutral-900 text-neutral-200 p-4 font-mono text-xs overflow-x-auto space-y-1">
                  <div>DATABASE_URL=postgresql://nexus:password@postgres:5432/nexus</div>
                  <div>SERVER_URL=https://crm.yourcompany.com</div>
                  <div>JWT_SECRET=your_32_character_super_secret_key</div>
                  <div>PORT=3000</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
