import { ScanlineMonolith } from './ScanlineMonolith';
import { ArrowRight, Layers, Cpu, ShieldCheck } from 'lucide-react';

interface ProblemSectionProps {
  isDark?: boolean;
}

export function ProblemSection({ isDark }: ProblemSectionProps) {
  return (
    <section className="py-20 sm:py-28 border-b border-neutral-200 dark:border-neutral-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ROW 1: "The Problem." (Exact match of Twenty's screenshot) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Generative Scanline Monolith Art */}
          <div className="lg:col-span-6 flex justify-center lg:justify-start">
            <ScanlineMonolith isDark={isDark} />
          </div>

          {/* Right Column: Editorial Copy */}
          <div className="lg:col-span-6 space-y-8">
            {/* Blue accent indicator */}
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-3 rounded-xs bg-[#2563eb]" />
              <span className="text-xs font-semibold tracking-wider text-neutral-600 dark:text-neutral-400">
                The Problem.
              </span>
            </div>

            {/* Headline with serif + bold sans pairing */}
            <h2 className="text-3xl sm:text-5xl font-normal leading-[1.12] tracking-tight">
              <span className="font-serif italic font-normal text-neutral-900 dark:text-neutral-100">
                A custom CRM gives your org an edge,
              </span>{' '}
              <span className="font-bold text-neutral-950 dark:text-white">
                but building one comes with tradeoffs
              </span>
            </h2>

            {/* Dashed divider */}
            <div className="border-t border-dashed border-neutral-300 dark:border-neutral-800" />

            {/* Problem 1: The Giant Monolith */}
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                The Giant Monolith
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Proprietary languages, slow deployment cycles, and "black box" logic.
              </p>
            </div>

            {/* Dashed divider */}
            <div className="border-t border-dashed border-neutral-300 dark:border-neutral-800" />

            {/* Problem 2: The In-house Burden */}
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                The In-house Burden
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                It's fragile. V1 ships quickly, but maintaining and making changes is a long term burden.
              </p>
            </div>
          </div>
        </div>

        {/* ROW 2: "Stop settling for trade-offs." (Exact second section seen in screenshot) */}
        <div className="mt-28 pt-16 border-t border-neutral-200 dark:border-neutral-800/80">
          <div className="max-w-3xl">
            {/* Blue accent indicator */}
            <div className="flex items-center gap-2 mb-4">
              <span className="h-1.5 w-3 rounded-xs bg-[#2563eb]" />
              <span className="text-xs font-semibold tracking-wider text-neutral-600 dark:text-neutral-400">
                Stop settling for trade-offs.
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-neutral-950 dark:text-white leading-[1.15]">
              Assemble, iterate and adapt a custom CRM that fits your business
            </h2>

            <p className="mt-5 text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Compose your CRM and internal apps with a single extensibility toolkit. Start with production-grade building blocks and continue iterating with familiar developer workflows.
            </p>
          </div>

          {/* Three Pillars */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-[#f9f9f7] dark:bg-[#111216] p-6 space-y-3">
              <div className="h-8 w-8 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-black">
                <Layers className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Production-Grade Building Blocks
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Pre-built relational tables, Kanban pipelines, activity timelines, and custom layouts ready to use out of the box.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-[#f9f9f7] dark:bg-[#111216] p-6 space-y-3">
              <div className="h-8 w-8 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-black">
                <Cpu className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Continuous Iteration Without Friction
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Unlimited customization with AI coding tools, GraphQL endpoints, and instant PostgreSQL migrations.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-[#f9f9f7] dark:bg-[#111216] p-6 space-y-3">
              <div className="h-8 w-8 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-black">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Stay in Complete Control
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                100% open source under AGPLv3. Self-host on your own infrastructure with zero vendor lock-in or telemetry.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
