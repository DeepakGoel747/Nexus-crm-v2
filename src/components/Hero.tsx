import { useState } from 'react';
import { ArrowRight, Copy, Check, Terminal, Play, ShieldCheck, Database, Zap } from 'lucide-react';

interface HeroProps {
  onScrollToDemo: () => void;
  onOpenQuickStart: () => void;
}

export function Hero({ onScrollToDemo, onOpenQuickStart }: HeroProps) {
  const [copied, setCopied] = useState(false);
  const command = 'docker compose up -d nexus';

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative overflow-hidden pt-16 pb-14 md:pt-24 md:pb-20 text-center">
      {/* Background ambient radial glow */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[750px] rounded-full bg-gradient-to-b from-neutral-200/50 dark:from-white/[0.07] to-transparent blur-[120px]" 
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Subtle Announcement Kicker */}
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-white/[0.03] px-3.5 py-1 text-xs text-neutral-700 dark:text-neutral-300 transition-colors hover:border-neutral-400 dark:hover:border-white/20">
          <span className="font-semibold text-neutral-900 dark:text-white">Nexus v0.42</span>
          <span aria-hidden="true" className="text-neutral-400 dark:text-neutral-500">·</span>
          <span>Open-Source CRM built for speed</span>
          <ArrowRight className="h-3 w-3 text-neutral-500" />
        </div>

        {/* Main Headline */}
        <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-neutral-950 dark:text-white sm:text-6xl lg:text-7xl" style={{ textWrap: 'balance' }}>
          The open-source CRM.
          <span className="block mt-2 font-serif font-normal italic text-neutral-800 dark:text-neutral-300 text-3xl sm:text-5xl lg:text-6xl">
            A modern alternative to Salesforce.
          </span>
        </h1>

        {/* Subhead / Value Prop */}
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed" style={{ textWrap: 'balance' }}>
          Nexus puts you back in control of your customer data. Built with modern engineering principles,
          sub-50ms query speeds, keyboard-first navigation, and a native PostgreSQL architecture.
        </p>

        {/* Primary CTAs & Terminal Copy */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onScrollToDemo}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-neutral-950 dark:bg-white px-6 py-3 text-sm font-bold text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-md active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Explore Interactive Workspace</span>
          </button>

          {/* Quick-copy Docker CLI */}
          <div className="w-full sm:w-auto flex items-center gap-2 rounded-lg border border-neutral-300 dark:border-white/10 bg-[#f0f0eb] dark:bg-[#121316] px-3.5 py-2.5 text-xs text-neutral-800 dark:text-neutral-200 font-mono">
            <Terminal className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
            <span className="select-all font-medium">{command}</span>
            <button
              onClick={handleCopy}
              className="ml-2 flex items-center gap-1 rounded p-1 text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Proof Row - Adhering to Zero-Pill rule: clean inline text with dots */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-1.5 text-neutral-800 dark:text-neutral-300">
            <ShieldCheck className="h-3.5 w-3.5 text-neutral-500" />
            <span>100% Open Source (AGPLv3)</span>
          </div>
          <span aria-hidden="true" className="text-neutral-400 dark:text-neutral-600 hidden sm:inline">·</span>
          <div className="flex items-center gap-1.5 text-neutral-800 dark:text-neutral-300">
            <Database className="h-3.5 w-3.5 text-neutral-500" />
            <span>PostgreSQL & GraphQL Native</span>
          </div>
          <span aria-hidden="true" className="text-neutral-400 dark:text-neutral-600 hidden sm:inline">·</span>
          <div className="flex items-center gap-1.5 text-neutral-800 dark:text-neutral-300">
            <Zap className="h-3.5 w-3.5 text-neutral-500" />
            <span>&lt; 50ms Interaction Latency</span>
          </div>
          <span aria-hidden="true" className="text-neutral-400 dark:text-neutral-600 hidden sm:inline">·</span>
          <span className="text-neutral-800 dark:text-neutral-300">Zero Telemetry Tracking</span>
        </div>
      </div>
    </section>
  );
}
