import { useState } from 'react';
import { Database, Zap, Code2, Lock, Workflow, Share2, Copy, Check } from 'lucide-react';

export function FeatureBento() {
  const [activeCodeTab, setActiveCodeTab] = useState<'graphql' | 'rest' | 'sql'>('graphql');
  const [codeCopied, setCodeCopied] = useState(false);

  const codeSnippets = {
    graphql: `query GetEnterpriseAccounts {
  companies(
    filter: { arr: { gte: 100000 }, status: { eq: "Active" } }
    orderBy: { arr: Desc }
  ) {
    id
    name
    domain
    arr
    opportunities {
      id
      title
      amount
      stage
    }
  }
}`,
    rest: `curl -X GET "https://api.nexus.internal/v1/companies" \\
  -H "Authorization: Bearer nex_live_99f2b87a" \\
  -H "Content-Type: application/json" \\
  -d '{"filter": {"tier": "Enterprise"}}'`,
    sql: `SELECT 
  c.id, 
  c.name, 
  c.domain, 
  SUM(o.amount) as total_pipeline
FROM companies c
JOIN opportunities o ON o.company_id = c.id
WHERE o.stage != 'lost'
GROUP BY c.id, c.name, c.domain
ORDER BY total_pipeline DESC;`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeCodeTab]);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <section id="architecture" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
      {/* Section Header */}
      <div className="max-w-3xl">
        <span className="text-xs font-semibold text-neutral-400">Architectural Foundations</span>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl" style={{ textWrap: 'balance' }}>
          Engineered for developers. Loved by revenue teams.
        </h2>
        <p className="mt-3 text-base text-neutral-400 leading-relaxed">
          Unlike legacy platforms built on 20-year-old proprietary databases, Nexus is constructed around
          open standards: PostgreSQL, Prisma, GraphQL, and modern React.
        </p>
      </div>

      {/* Asymmetric Bento Grid */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Bento 1: Interactive API Console (Span 7) */}
        <div className="md:col-span-7 rounded-xl border border-white/10 bg-[#0d0e12] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-neutral-300" />
                <h3 className="text-sm font-semibold text-white">First-Class API Architecture</h3>
              </div>

              {/* Code Language Tabs */}
              <div className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] p-0.5 text-xs">
                {(['graphql', 'rest', 'sql'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveCodeTab(lang)}
                    className={`px-2.5 py-1 rounded capitalize font-mono text-[11px] transition-colors ${
                      activeCodeTab === lang ? 'bg-white/10 text-white font-medium' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-3 text-xs text-neutral-400 leading-relaxed">
              Every custom field, object, and pipeline relation you define in the UI is immediately queryable via
              type-safe GraphQL, standard REST, or direct SQL read replicas.
            </p>

            {/* Code Block Window */}
            <div className="mt-4 relative rounded-lg border border-white/10 bg-[#090a0d] p-4 font-mono text-xs text-neutral-300 overflow-x-auto">
              <button
                onClick={handleCopyCode}
                className="absolute right-3 top-3 p-1.5 rounded border border-white/10 bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Copy snippet"
              >
                {codeCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <pre className="text-[12px] leading-relaxed select-all">
                <code>{codeSnippets[activeCodeTab]}</code>
              </pre>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between text-[11px] text-neutral-500 border-t border-white/[0.06] pt-3">
            <span>Generated TypeScript types included</span>
            <span className="font-mono">Sub-20ms P99 Latency</span>
          </div>
        </div>

        {/* Bento 2: Full Data Sovereignty (Span 5) */}
        <div className="md:col-span-5 rounded-xl border border-white/10 bg-[#0d0e12] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-white/[0.08]">
              <Database className="h-4 w-4 text-neutral-300" />
              <h3 className="text-sm font-semibold text-white">100% Data Sovereignty</h3>
            </div>

            <p className="mt-4 text-xs text-neutral-400 leading-relaxed">
              Never let your most precious customer intelligence get trapped behind arbitrary seat pricing,
              API rate limits, or proprietary vendor silos.
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs">
                <span className="font-semibold text-white block">PostgreSQL Native</span>
                <span className="text-neutral-400 mt-1 block">
                  Run Nexus on AWS RDS, Supabase, Neon, or your private on-prem bare metal.
                </span>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs">
                <span className="font-semibold text-white block">Zero Vendor Lock-in</span>
                <span className="text-neutral-400 mt-1 block">
                  Export complete relational dumps anytime with standard <code className="font-mono text-neutral-300">pg_dump</code>.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 text-[11px] text-neutral-500 border-t border-white/[0.06] pt-3 flex items-center justify-between">
            <span>Licensed under AGPLv3</span>
            <span>Self-Hostable</span>
          </div>
        </div>

        {/* Bento 3: Extensible Custom Objects (Span 6) */}
        <div className="md:col-span-6 rounded-xl border border-white/10 bg-[#0d0e12] p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-white/[0.08]">
            <Workflow className="h-4 w-4 text-neutral-300" />
            <h3 className="text-sm font-semibold text-white">Custom Objects & Relational Modeling</h3>
          </div>

          <p className="mt-4 text-xs text-neutral-400 leading-relaxed">
            Model your real-world business entities. Create custom relations between Companies, Contracts,
            Invoices, Support Tickets, and Hardware Devices without writing database migrations.
          </p>

          {/* Interactive visual schema representation */}
          <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-white/10 bg-[#121318] p-3">
              <div className="flex items-center justify-between font-mono text-[11px] text-neutral-300 border-b border-white/[0.06] pb-1.5 mb-2">
                <span>Company</span>
                <span className="text-neutral-500">Table</span>
              </div>
              <ul className="space-y-1 text-neutral-400 text-[11px] font-mono">
                <li>• id: UUID (PK)</li>
                <li>• name: String</li>
                <li>• arr: Numeric</li>
                <li>• tier: Enum</li>
              </ul>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#121318] p-3">
              <div className="flex items-center justify-between font-mono text-[11px] text-neutral-300 border-b border-white/[0.06] pb-1.5 mb-2">
                <span>Contract</span>
                <span className="text-neutral-500">Custom</span>
              </div>
              <ul className="space-y-1 text-neutral-400 text-[11px] font-mono">
                <li>• id: UUID (PK)</li>
                <li>• company_id: FK</li>
                <li>• renewal_date: Date</li>
                <li>• pdf_hash: String</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bento 4: Speed & Keyboard-First UX (Span 6) */}
        <div className="md:col-span-6 rounded-xl border border-white/10 bg-[#0d0e12] p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-white/[0.08]">
            <Zap className="h-4 w-4 text-neutral-300" />
            <h3 className="text-sm font-semibold text-white">Local-First Speed & Keyboard Flow</h3>
          </div>

          <p className="mt-4 text-xs text-neutral-400 leading-relaxed">
            Eliminate 3-second page loads. Every view switch, search filter, and record edit updates optimistically
            in under 16ms with background syncing.
          </p>

          <div className="mt-5 rounded-lg border border-white/10 bg-[#121318] p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Command Palette</span>
              <kbd className="font-mono text-[11px] bg-white/10 px-1.5 py-0.5 rounded text-neutral-300">⌘K</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Create New Record</span>
              <kbd className="font-mono text-[11px] bg-white/10 px-1.5 py-0.5 rounded text-neutral-300">C</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Toggle Kanban / Table</span>
              <kbd className="font-mono text-[11px] bg-white/10 px-1.5 py-0.5 rounded text-neutral-300">V</kbd>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
