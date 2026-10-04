import { useState } from 'react';
import { Building2, CheckSquare, DollarSign, MoreHorizontal, Pencil, Star, Users } from 'lucide-react';
import { Company, Deal, Person, Task } from '../../types/crm';

interface AnalyticsDashboardProps {
  companies: Company[];
  deals: Deal[];
  people: Person[];
  tasks: Task[];
  isDark: boolean;
  currencyCode?: string;
  onAskAI: () => void;
}

export function AnalyticsDashboard({ companies, deals, people, tasks, isDark, currencyCode = 'USD', onAskAI }: AnalyticsDashboardProps) {
  const [isFavorite, setIsFavorite] = useState(() => localStorage.getItem('nexus_dashboard_favorite') === 'true');
  const [isEditing, setIsEditing] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('nexus_dashboard_widgets');
      return saved ? JSON.parse(saved) as Record<string, boolean> : {};
    } catch (error) {
      console.error('Unable to load dashboard layout preferences:', error);
      return {};
    }
  });
  const [showActions, setShowActions] = useState(false);
  const openDeals = deals.filter((deal) => !['won', 'lost'].includes(deal.stage));
  const currency = (amount: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(amount);
  const pipelineValue = openDeals.reduce((total, deal) => total + Number(deal.amount || 0), 0);
  const weightedValue = openDeals.reduce((total, deal) => total + Number(deal.amount || 0) * Number(deal.probability || 0) / 100, 0);
  const completedTasks = tasks.filter((task) => task.completed).length;
  const stageCounts = [
    { label: 'Prospecting', key: 'prospect', color: 'bg-sky-500' },
    { label: 'Qualified', key: 'qualified', color: 'bg-indigo-500' },
    { label: 'Proposal', key: 'proposal', color: 'bg-violet-500' },
    { label: 'Negotiation', key: 'negotiation', color: 'bg-amber-500' },
    { label: 'Won', key: 'won', color: 'bg-emerald-500' },
    { label: 'Lost', key: 'lost', color: 'bg-rose-500' },
  ].map((stage) => ({
    ...stage,
    count: deals.filter((deal) => deal.stage === stage.key).length,
    amount: deals.filter((deal) => deal.stage === stage.key).reduce((sum, deal) => sum + Number(deal.amount || 0), 0),
  }));
  const maxStageValue = Math.max(1, ...stageCounts.map((stage) => stage.amount));
  const panel = `rounded-xl border ${isDark ? 'border-neutral-800 bg-[#0c0d10]' : 'border-neutral-200 bg-white'} p-5 shadow-sm`;
  const widgetVisible = (widget: string) => visibleWidgets[widget] !== false;
  const toggleWidget = (widget: string) => {
    const next = { ...visibleWidgets, [widget]: !widgetVisible(widget) };
    setVisibleWidgets(next);
    localStorage.setItem('nexus_dashboard_widgets', JSON.stringify(next));
  };
  const metrics = [
    { label: 'Companies', value: companies.length.toLocaleString(), icon: Building2, detail: 'Accounts in workspace', color: 'text-sky-500' },
    { label: 'Open pipeline', value: currency(pipelineValue), icon: DollarSign, detail: `${openDeals.length} active deals`, color: 'text-emerald-500' },
    { label: 'Weighted pipeline', value: currency(weightedValue), icon: Users, detail: 'Probability-adjusted value', color: 'text-violet-500' },
    { label: 'Tasks completed', value: `${completedTasks}/${tasks.length}`, icon: CheckSquare, detail: `${people.length} contacts`, color: 'text-amber-500' },
  ];

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[11px] text-neutral-500">Dashboards</p>
          <h1 className="text-lg font-bold">Sales pipeline overview</h1>
          <p className="mt-1 text-xs text-neutral-500">Live metrics from your opportunities and workspace records.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const next = !isFavorite;
              setIsFavorite(next);
              localStorage.setItem('nexus_dashboard_favorite', String(next));
            }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className="rounded-md border border-neutral-200 p-2 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-white/[0.06]"
          >
            <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsEditing((current) => !current)}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-2 text-xs font-medium ${isEditing ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-white/[0.06]'}`}
          >
            <Pencil className="h-3.5 w-3.5" />{isEditing ? 'Done editing' : 'Edit dashboard'}
          </button>
          <button type="button" onClick={onAskAI} className="rounded-md border border-neutral-200 px-2.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-white/[0.06]">Ask AI</button>
          <div className="relative">
            <button
              type="button"
              aria-label="Dashboard actions"
              onClick={() => setShowActions((current) => !current)}
              className="rounded-md border border-neutral-200 p-2 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-white/[0.06]"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            {showActions && (
              <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-[#14151a]">
                <button type="button" onClick={() => { setIsFavorite((current) => { const next = !current; localStorage.setItem('nexus_dashboard_favorite', String(next)); return next; }); setShowActions(false); }} className="w-full rounded px-2.5 py-2 text-left text-xs hover:bg-neutral-100 dark:hover:bg-white/[0.06]">
                  {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                </button>
                <button type="button" onClick={() => { setIsEditing(true); setShowActions(false); }} className="w-full rounded px-2.5 py-2 text-left text-xs hover:bg-neutral-100 dark:hover:bg-white/[0.06]">Edit layout</button>
              </div>
            )}
          </div>
        </div>
      </div>
      {isEditing && (
        <div className={`${panel} flex flex-wrap items-center gap-x-5 gap-y-2`}>
          <span className="mr-1 text-xs font-semibold">Dashboard layout</span>
          {[
            ['metrics', 'Workspace metrics'],
            ['stages', 'Pipeline by stage'],
            ['health', 'Workspace health'],
          ].map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
              <input type="checkbox" checked={widgetVisible(key)} onChange={() => toggleWidget(key)} />
              {label}
            </label>
          ))}
        </div>
      )}
      {widgetVisible('metrics') && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, detail, color }) => (
          <article className={panel} key={label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-neutral-500">{label}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
              </div>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="mt-3 text-[11px] text-neutral-500">{detail}</p>
          </article>
        ))}
      </div>}
      <div className="grid gap-4 lg:grid-cols-2">
        {widgetVisible('stages') && <article className={panel}>
          <h2 className="mb-5 text-sm font-bold">Pipeline by stage</h2>
          <div className="space-y-4">
            {stageCounts.map((stage) => (
              <div key={stage.key}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium">{stage.label} <span className="text-neutral-400">({stage.count})</span></span>
                  <span className="font-mono text-neutral-500">{currency(stage.amount)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                  <div className={`h-full rounded-full ${stage.color}`} style={{ width: `${(stage.amount / maxStageValue) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>}
        {widgetVisible('health') && <article className={panel}>
          <h2 className="mb-5 text-sm font-bold">Workspace health</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-neutral-50 p-4 dark:bg-white/[0.04]">
              <p className="text-[11px] text-neutral-500">Win rate</p>
              <p className="mt-2 text-xl font-bold">{deals.length ? `${Math.round((deals.filter((deal) => deal.stage === 'won').length / deals.length) * 100)}%` : '—'}</p>
              <p className="mt-1 text-[10px] text-neutral-400">Won deals / all deals</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-4 dark:bg-white/[0.04]">
              <p className="text-[11px] text-neutral-500">Task completion</p>
              <p className="mt-2 text-xl font-bold">{tasks.length ? `${Math.round((completedTasks / tasks.length) * 100)}%` : '—'}</p>
              <p className="mt-1 text-[10px] text-neutral-400">Completed / all tasks</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-4 dark:bg-white/[0.04]">
              <p className="text-[11px] text-neutral-500">Average deal size</p>
              <p className="mt-2 text-xl font-bold">{deals.length ? currency(deals.reduce((sum, deal) => sum + Number(deal.amount || 0), 0) / deals.length) : '—'}</p>
              <p className="mt-1 text-[10px] text-neutral-400">Across {deals.length} deals</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-4 dark:bg-white/[0.04]">
              <p className="text-[11px] text-neutral-500">Customer ARR</p>
              <p className="mt-2 text-xl font-bold">{currency(companies.reduce((sum, company) => sum + Number(company.arr || 0), 0))}</p>
              <p className="mt-1 text-[10px] text-neutral-400">Across {companies.length} companies</p>
            </div>
          </div>
        </article>}
      </div>
    </section>
  );
}
