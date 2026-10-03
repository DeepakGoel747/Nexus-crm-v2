import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does Nexus differ from Salesforce and HubSpot?',
      a: 'Nexus is built on an open-source, local-first architecture with modern web standards (React, TypeScript, GraphQL, PostgreSQL). Unlike Salesforce—which locks your data into proprietary query languages and charges steep seat minimums—Nexus gives you 100% data ownership, sub-50ms query latency, and full freedom to self-host.',
    },
    {
      q: 'Can I self-host Nexus on my own company infrastructure?',
      a: 'Yes. Nexus is licensed under AGPLv3. You can deploy it using our official Docker Compose file or Kubernetes Helm charts on AWS, Google Cloud, Azure, or bare-metal servers. There are no artificial seat restrictions or telemetry backdoors in self-hosted builds.',
    },
    {
      q: 'How do I migrate our existing records from Salesforce or HubSpot?',
      a: 'Nexus includes a native CSV and JSON import wizard with automated column schema mapping for Companies, Deals, Contacts, and Activity history. For enterprise migrations, we provide a bidirectional sync pipeline that runs alongside your legacy CRM until your team is ready to cut over.',
    },
    {
      q: 'Does Nexus support custom fields and custom objects?',
      a: 'Absolutely. You can create custom fields (text, numbers, currency, relations, multi-select tags, dates) and brand-new custom objects directly in the settings UI. Every custom object is automatically exposed through our GraphQL and REST APIs immediately.',
    },
    {
      q: 'Can I build custom integrations or webhooks?',
      a: 'Yes. Nexus features native webhooks for events like deal stage transitions, new inbound leads, or status modifications. You can connect Nexus to Slack, Zapier, Make, Resend, or your internal microservices using standard HMAC-signed payloads.',
    },
  ];

  return (
    <section id="faq" className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
      <div className="text-center max-w-xl mx-auto">
        <span className="text-xs font-semibold text-neutral-400">Frequently Asked Questions</span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white" style={{ textWrap: 'balance' }}>
          Everything you need to know about Nexus
        </h2>
      </div>

      <div className="mt-10 space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-lg border border-white/10 bg-[#0d0e12] overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-semibold text-white hover:text-neutral-200 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-xs text-neutral-400 leading-relaxed border-t border-white/[0.05] pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
