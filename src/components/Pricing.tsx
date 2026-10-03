import { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';

interface PricingProps {
  onSelectPlan: (plan: string) => void;
}

export function Pricing({ onSelectPlan }: PricingProps) {
  const [annualBilling, setAnnualBilling] = useState(true);

  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-semibold text-neutral-400">Simple, Transparent Pricing</span>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl" style={{ textWrap: 'balance' }}>
          Predictable plans. No hidden enterprise fees.
        </h2>
        <p className="mt-3 text-sm text-neutral-400">
          Run on your own infrastructure for free, or let us host and maintain your instances with automated backups and global CDN edge routing.
        </p>

        {/* Annual / Monthly Toggle */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-1 text-xs">
          <button
            onClick={() => setAnnualBilling(false)}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              !annualBilling ? 'bg-white text-black font-semibold shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setAnnualBilling(true)}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              annualBilling ? 'bg-white text-black font-semibold shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>Annual Billing</span>
            <span className="text-[10px] text-emerald-600 bg-emerald-100 font-bold px-1.5 py-0.2 rounded">Save 20%</span>
          </button>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tier 1: Community (Self-Hosted) */}
        <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#0d0e12] p-7 hover:border-white/20 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Community</h3>
              <span className="text-[11px] text-neutral-400 border border-white/10 px-2 py-0.5 rounded">Self-Hosted</span>
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              For developers and teams who prefer complete infrastructure sovereignty.
            </p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-black font-mono tracking-tight text-white">$0</span>
              <span className="text-xs text-neutral-400">/ forever</span>
            </div>

            <ul className="mt-6 space-y-3 text-xs text-neutral-300">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <span>Unlimited users & unlimited contacts</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <span>100% full source code access (AGPLv3)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <span>Native PostgreSQL & GraphQL API</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <span>Docker & Helm deployment scripts</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <span>GitHub Discussions & Community support</span>
              </li>
            </ul>
          </div>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="mt-8 block w-full rounded-md border border-white/20 py-2.5 text-center text-xs font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Deploy on GitHub
          </a>
        </div>

        {/* Tier 2: Cloud (Highlighted) */}
        <div className="relative flex flex-col justify-between rounded-xl border-2 border-white bg-[#121319] p-7 shadow-xl shadow-white/5">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
            Most Popular
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Nexus Cloud</h3>
              <span className="text-[11px] text-neutral-300 border border-white/20 px-2 py-0.5 rounded">Managed</span>
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              For high-velocity sales teams who want zero DevOps overhead.
            </p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-black font-mono tracking-tight text-white">
                ${annualBilling ? '15' : '19'}
              </span>
              <span className="text-xs text-neutral-400">/ user / month</span>
            </div>
            {annualBilling && (
              <span className="text-[10px] text-neutral-400 block mt-1 font-mono">Billed annually ($180/yr)</span>
            )}

            <ul className="mt-6 space-y-3 text-xs text-neutral-200">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Everything in Community, fully hosted</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Automated daily encrypted database backups</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Sub-50ms global edge CDN latency</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Two-way Google & Outlook calendar sync</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Priority email & in-app chat support</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => onSelectPlan('Cloud')}
            className="mt-8 flex w-full items-center justify-center gap-1.5 rounded-md bg-white py-2.5 text-xs font-bold text-black hover:bg-neutral-200 transition-colors"
          >
            <span>Start 14-Day Free Trial</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Tier 3: Enterprise */}
        <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#0d0e12] p-7 hover:border-white/20 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Enterprise</h3>
              <span className="text-[11px] text-neutral-400 border border-white/10 px-2 py-0.5 rounded">VPC / Dedicated</span>
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              For organizations with stringent security, compliance, or dedicated VPC isolation.
            </p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-black font-mono tracking-tight text-white">Custom</span>
            </div>
            <span className="text-[10px] text-neutral-400 block mt-1">Starting from 25 seats</span>

            <ul className="mt-6 space-y-3 text-xs text-neutral-300">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <span>Dedicated isolated VPC or on-prem deployment</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <span>99.99% uptime SLA guarantee</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <span>SAML 2.0 / Okta SSO & SCIM provisioning</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <span>Dedicated Technical Account Manager</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <span>Custom Salesforce migration service</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => onSelectPlan('Enterprise')}
            className="mt-8 block w-full rounded-md border border-white/20 py-2.5 text-center text-xs font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Contact Sales
          </button>
        </div>
      </div>
    </section>
  );
}
