import { ArrowLeft, CheckCircle2, ShieldCheck, Activity, RefreshCw } from 'lucide-react';

interface StatusPageProps {
  onBackToHome: () => void;
  isDark: boolean;
}

export function StatusPage({ onBackToHome, isDark }: StatusPageProps) {
  const systems = [
    { name: 'GraphQL & REST API Engine', status: 'Operational', latency: '14ms', uptime: '99.99%' },
    { name: 'PostgreSQL Relational DB Clusters', status: 'Operational', latency: '6ms', uptime: '100%' },
    { name: 'Native MCP Protocol Bridge', status: 'Operational', latency: '22ms', uptime: '99.98%' },
    { name: 'Background Queue & Event Webhooks', status: 'Operational', latency: '35ms', uptime: '99.95%' },
    { name: 'Self-Hosted Registry & Docker Hub Images', status: 'Operational', latency: '48ms', uptime: '100%' },
    { name: 'OAuth & SAML SSO Gateway', status: 'Operational', latency: '18ms', uptime: '99.99%' },
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
          <span className="text-xs font-bold text-neutral-900 dark:text-white">System Status</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>All Systems Operational</span>
        </div>
      </header>

      {/* Main Status Dashboard */}
      <main className="flex-1 mx-auto max-w-4xl w-full px-6 py-12 sm:py-16 space-y-8">
        <div>
          <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider block">
            Realtime Telemetry
          </span>
          <h1 className="mt-1 text-3xl sm:text-5xl font-extrabold tracking-tight">
            System Operational Status
          </h1>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
            Real-time latency, cluster uptime, and health metrics for the Nexus CRM infrastructure.
          </p>
        </div>

        {/* Global Banner */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-5 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
              All Core Systems are 100% Operational
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              Zero downtime or elevated API errors detected across all global edge regions over the last 90 days.
            </p>
          </div>
        </div>

        {/* Services Table */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0f1014] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Service Health
            </h3>
            <span className="text-[11px] font-mono text-neutral-400">P99 SLA: 99.99%</span>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-xs">
            {systems.map((s, idx) => (
              <div key={idx} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-neutral-900 dark:text-white">{s.name}</h4>
                  <span className="text-[11px] text-neutral-500 font-mono">Response: {s.latency}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-neutral-500 hidden sm:inline">{s.uptime} uptime</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>{s.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past Incident History */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0f1014] p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
            Past Incident History
          </h3>
          <p className="text-xs text-neutral-500">
            No incidents or degraded performance reported in the last 90 days.
          </p>
        </div>
      </main>
    </div>
  );
}
