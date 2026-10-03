import { ArrowLeft, Sparkles, Zap, Shield, Bug, ArrowUpRight } from 'lucide-react';

interface ChangelogPageProps {
  onBackToHome: () => void;
  isDark: boolean;
}

export function ChangelogPage({ onBackToHome, isDark }: ChangelogPageProps) {
  const releases = [
    {
      version: 'v0.42.0',
      date: 'October 2, 2026',
      badge: 'Latest Release',
      title: 'Native MCP Protocol Server & Dynamic Column Visibility',
      description: 'Major release introducing first-class Model Context Protocol (MCP) server support, allowing Claude and Cursor to directly interact with Nexus CRM databases via natural language tool calls.',
      features: [
        'Added native MCP stdio and SSE server implementation with find_deals, enrich_company, and log_activity tools',
        'Dynamic Column Chooser: hide, reorder, and save customized table fields on any entity view',
        'Sub-50ms optimistic UI rendering across all Kanban stage drag-and-drop transitions',
        'PostgreSQL schema sync speedup for large datasets (>100,000 records)',
      ],
    },
    {
      version: 'v0.41.0',
      date: 'September 18, 2026',
      badge: 'Feature Drop',
      title: 'Visual Workflow Automations & Slack Integration',
      description: 'Design multi-step event triggers and automated actions without writing backend code.',
      features: [
        'Node-based visual workflow builder with instant execution simulator',
        'Native webhooks for Opportunity stage changes, Inbound leads, and custom field mutations',
        'PostgreSQL 16 Alpine default image upgrade in official Docker Compose setup',
        'Expanded keyboard shortcuts for rapid batch updates and field editing',
      ],
    },
    {
      version: 'v0.40.0',
      date: 'August 24, 2026',
      badge: 'Core Update',
      title: 'Custom Relational Objects & Global Command Palette',
      description: 'Model real-world business domains with user-defined relational tables and foreign keys.',
      features: [
        'Support for custom objects with arbitrary 1:N and N:M relations',
        'Universal ⌘K Command Palette with fuzzy search across companies, deals, and settings',
        'CSV and JSON bulk export with automatic column mapping',
        'Self-hosted Helm chart support for Kubernetes deployments',
      ],
    },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${
      isDark ? 'bg-[#090a0b] text-[#ededed]' : 'bg-[#faf9f6] text-[#141518]'
    }`}>
      {/* Top Bar */}
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
          <span className="text-xs font-bold text-neutral-900 dark:text-white">Changelog</span>
        </div>

        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-neutral-500 hover:text-black dark:hover:text-white"
        >
          <span>View on GitHub</span>
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </header>

      {/* Main Changelog Stream */}
      <main className="flex-1 mx-auto max-w-4xl w-full px-6 py-12 sm:py-16">
        <div className="mb-12">
          <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider block">
            Product Updates
          </span>
          <h1 className="mt-1 text-3xl sm:text-5xl font-extrabold tracking-tight">
            Changelog & Release Notes
          </h1>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
            Follow the latest features, architectural upgrades, and bug fixes shipped to Nexus CRM.
          </p>
        </div>

        <div className="space-y-12">
          {releases.map((rel) => (
            <article
              key={rel.version}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 bg-white dark:bg-[#0f1014] shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-bold bg-neutral-900 dark:bg-white text-white dark:text-black px-2.5 py-0.5 rounded-md">
                    {rel.version}
                  </span>
                  <span className="text-xs font-semibold text-neutral-500 border border-neutral-200 dark:border-neutral-800 px-2 py-0.5 rounded">
                    {rel.badge}
                  </span>
                </div>
                <time className="text-xs font-mono text-neutral-400">{rel.date}</time>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
                {rel.title}
              </h2>

              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {rel.description}
              </p>

              <div className="pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  What's New:
                </h3>
                <ul className="space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                  {rel.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-neutral-400 font-bold">•</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
