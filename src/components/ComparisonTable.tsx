import { Check, X, Minus } from 'lucide-react';

export function ComparisonTable() {
  const comparisons = [
    {
      feature: 'Source Code Availability',
      nexus: '100% Open Source (AGPLv3)',
      salesforce: 'Proprietary Closed Source',
      hubspot: 'Proprietary Closed Source',
      nexusHighlight: true,
    },
    {
      feature: 'Self-Hosting & VPC Deployment',
      nexus: 'Full Support (Docker / Helm)',
      salesforce: 'Not Supported',
      hubspot: 'Not Supported',
      nexusHighlight: true,
    },
    {
      feature: 'Database Architecture',
      nexus: 'Native PostgreSQL & Prisma',
      salesforce: 'Proprietary Oracle / SOQL Silo',
      hubspot: 'Closed Internal Cloud DB',
      nexusHighlight: true,
    },
    {
      feature: 'Starting Cloud Seat Price',
      nexus: '$19 / user / month',
      salesforce: '$165+ / user / month (Enterprise)',
      hubspot: '$90+ / user / month (Sales Pro)',
      nexusHighlight: true,
    },
    {
      feature: 'Custom Objects & Relational Fields',
      nexus: 'Included on all tiers',
      salesforce: 'Requires Enterprise + Add-ons',
      hubspot: 'Requires Enterprise ($150+/mo)',
      nexusHighlight: true,
    },
    {
      feature: 'API Support',
      nexus: 'GraphQL, REST & Direct SQL',
      salesforce: 'SOAP & Complex REST Limits',
      hubspot: 'REST with Strict Rate Limits',
      nexusHighlight: true,
    },
    {
      feature: 'Average View Interaction Latency',
      nexus: '< 50ms (Optimistic UI)',
      salesforce: '1,800ms – 3,200ms',
      hubspot: '600ms – 1,200ms',
      nexusHighlight: true,
    },
    {
      feature: 'Data Export & Sovereignty',
      nexus: 'Standard pg_dump in seconds',
      salesforce: 'Slow CSV weekly export queues',
      hubspot: 'Manual batch exports',
      nexusHighlight: true,
    },
  ];

  return (
    <section id="comparison" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-semibold text-neutral-400">Head-to-Head Comparison</span>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl" style={{ textWrap: 'balance' }}>
          Why modern teams are switching to Nexus
        </h2>
        <p className="mt-3 text-base text-neutral-400 leading-relaxed">
          See how Nexus compares directly against 20-year-old enterprise incumbents.
        </p>
      </div>

      <div className="mt-12 overflow-x-auto rounded-xl border border-white/10 bg-[#0d0e12]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="py-4 px-6 font-semibold text-neutral-300 w-1/3">Capability</th>
              <th className="py-4 px-6 font-bold text-white bg-white/[0.04] w-1/4">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded bg-white text-black font-black font-mono flex items-center justify-center text-[10px]">
                    N
                  </div>
                  <span>Nexus CRM</span>
                </div>
              </th>
              <th className="py-4 px-6 font-medium text-neutral-400 w-1/5">Salesforce Sales Cloud</th>
              <th className="py-4 px-6 font-medium text-neutral-400 w-1/5">HubSpot Sales Hub</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {comparisons.map((row, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3.5 px-6 font-medium text-neutral-200">{row.feature}</td>
                <td className="py-3.5 px-6 font-medium text-white bg-white/[0.03]">
                  <div className="flex items-center gap-1.5 text-neutral-100">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{row.nexus}</span>
                  </div>
                </td>
                <td className="py-3.5 px-6 text-neutral-400">{row.salesforce}</td>
                <td className="py-3.5 px-6 text-neutral-400">{row.hubspot}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
