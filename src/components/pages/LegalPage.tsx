import { useState } from 'react';
import { ArrowLeft, Shield, FileText, Lock, CheckCircle2 } from 'lucide-react';

interface LegalPageProps {
  initialTab?: 'license' | 'security' | 'soc2' | 'privacy' | 'terms';
  onBackToHome: () => void;
  isDark: boolean;
}

export function LegalPage({ initialTab = 'license', onBackToHome, isDark }: LegalPageProps) {
  const [tab, setTab] = useState<'license' | 'security' | 'soc2' | 'privacy' | 'terms'>(initialTab);

  return (
    <div className={`min-h-screen flex flex-col ${
      isDark ? 'bg-[#090a0b] text-[#ededed]' : 'bg-[#faf9f6] text-[#141518]'
    }`}>
      {/* Top Bar */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-white/90 px-3 py-3.5 backdrop-blur-md dark:border-white/[0.08] dark:bg-[#090a0b]/85 sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Nexus Home</span>
          </button>
          <span className="text-neutral-300 dark:text-neutral-700">/</span>
          <span className="text-xs font-bold text-neutral-900 dark:text-white">Security & Legal</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full min-w-0 max-w-4xl flex-1 space-y-8 px-4 py-8 sm:px-6 sm:py-12">
        {/* Tab Selector */}
        <div className="flex flex-wrap gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-4 text-xs font-semibold">
          {[
            { id: 'license', label: 'GNU AGPLv3 License' },
            { id: 'security', label: 'Security Whitepaper' },
            { id: 'soc2', label: 'SOC2 Compliance' },
            { id: 'privacy', label: 'Privacy Policy' },
            { id: 'terms', label: 'Terms of Service' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                tab === t.id
                  ? 'bg-neutral-950 dark:bg-white text-white dark:text-black font-bold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: AGPLv3 License */}
        {tab === 'license' && (
          <article className="space-y-4 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 dark:text-white">
              GNU Affero General Public License v3 (AGPL-3.0)
            </h1>
            <p>
              Nexus CRM is free, libre, and open-source software licensed under the AGPLv3. This ensures that you have complete freedom to run, modify, inspect, and self-host the software in perpetuity without proprietary licensing restrictions.
            </p>
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 bg-white dark:bg-[#0f1014] space-y-2">
              <h3 className="font-bold text-neutral-950 dark:text-white text-sm">Key Rights:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Freedom to run the program on your own private infrastructure for any purpose.</li>
                <li>Access to the complete TypeScript and React frontend source code and NestJS/PostgreSQL backend engine.</li>
                <li>Zero per-seat licensing fees or forced cloud telemetry.</li>
              </ul>
            </div>
          </article>
        )}

        {/* Tab 2: Security Whitepaper */}
        {tab === 'security' && (
          <article className="space-y-4 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 dark:text-white">
              Security Architecture Whitepaper
            </h1>
            <p>
              Security is foundational to Nexus CRM. We enforce strict data isolation, encryption standards, and self-hosting safeguards.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 bg-white dark:bg-[#0f1014]">
                <h3 className="font-bold text-neutral-950 dark:text-white mb-1">Encryption at Rest & Transit</h3>
                <p className="text-neutral-500">All data is encrypted with AES-256 at rest and TLS 1.3 in transit with automated HSTS enforcement.</p>
              </div>
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 bg-white dark:bg-[#0f1014]">
                <h3 className="font-bold text-neutral-950 dark:text-white mb-1">Zero Telemetry Phone-Home</h3>
                <p className="text-neutral-500">Self-hosted builds contain zero tracking beacons, telemetry pings, or background analytics.</p>
              </div>
            </div>
          </article>
        )}

        {/* Tab 3: SOC2 Compliance */}
        {tab === 'soc2' && (
          <article className="space-y-4 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 dark:text-white">
              SOC 2 Type II Certification
            </h1>
            <p>
              Nexus Cloud workspaces are audited annually by independent AICPA-accredited auditors for Security, Confidentiality, and Availability trust service criteria.
            </p>
          </article>
        )}

        {/* Tab 4: Privacy Policy */}
        {tab === 'privacy' && (
          <article className="space-y-4 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 dark:text-white">
              Privacy Policy
            </h1>
            <p>
              We do not sell, rent, or monetize your customer records. Your data belongs exclusively to your organization. Full GDPR and CCPA data subject access requests are supported natively.
            </p>
          </article>
        )}

        {/* Tab 5: Terms of Service */}
        {tab === 'terms' && (
          <article className="space-y-4 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 dark:text-white">
              Terms of Service
            </h1>
            <p>
              Clear, transparent terms governing the usage of Nexus Cloud hosting, managed cluster SLA, and open-source software distribution.
            </p>
          </article>
        )}
      </main>
    </div>
  );
}
