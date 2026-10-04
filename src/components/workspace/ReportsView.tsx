import { useMemo, useState } from 'react';
import { Download, FileBarChart } from 'lucide-react';
import { Company, Deal, Person, Task } from '../../types/crm';

type Dataset = 'companies' | 'deals' | 'people' | 'tasks';

interface ReportsViewProps {
  companies: Company[];
  deals: Deal[];
  people: Person[];
  tasks: Task[];
  isDark: boolean;
}

const fields: Record<Dataset, string[]> = {
  companies: ['name', 'domain', 'tier', 'arr', 'status', 'owner', 'city', 'country'],
  deals: ['title', 'companyName', 'amount', 'stage', 'probability', 'closeDate', 'owner'],
  people: ['name', 'email', 'title', 'companyName', 'phone', 'status', 'lastActivity'],
  tasks: ['title', 'dueDate', 'assignedTo', 'completed', 'priority', 'relatedEntity'],
};

const quoteCsvCell = (value: unknown) => {
  let text = String(value ?? '');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export function ReportsView({ companies, deals, people, tasks, isDark }: ReportsViewProps) {
  const [dataset, setDataset] = useState<Dataset>('companies');
  const [reportName, setReportName] = useState('Workspace report');
  const [period, setPeriod] = useState<'all' | 'this-month'>('all');
  const [selectedFields, setSelectedFields] = useState<string[]>(fields.companies);
  const rows = useMemo(() => {
    const source = { companies, deals, people, tasks }[dataset] as unknown as Record<string, unknown>[];
    if (period === 'all') return source;
    const now = new Date();
    return source.filter((item) => {
      const dateValue = item.closeDate;
      if (typeof dateValue !== 'string') return false;
      const date = new Date(dateValue);
      return !Number.isNaN(date.getTime()) && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    });
  }, [companies, deals, people, tasks, dataset, period]);
  const panel = `rounded-xl border ${isDark ? 'border-neutral-800 bg-[#0c0d10]' : 'border-neutral-200 bg-white'} p-5 shadow-sm`;

  const downloadReport = () => {
    const csv = [
      selectedFields.map(quoteCsvCell).join(','),
      ...rows.map((row) => selectedFields.map((field) => quoteCsvCell(row[field])).join(',')),
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'workspace-report'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Reports</h1>
        <p className="mt-1 text-xs text-neutral-500">Build a report from your CRM records and export it as CSV.</p>
      </div>
      <div className={`${panel} grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]`}>
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold"><FileBarChart className="h-4 w-4 text-violet-500" /> Report builder</h2>
          <label className="block text-xs">Report name<input value={reportName} onChange={(event) => setReportName(event.target.value)} className="mt-1 w-full rounded border border-neutral-300 bg-transparent p-2 dark:border-neutral-700" /></label>
          <label className="block text-xs">Records<select value={dataset} onChange={(event) => { const nextDataset = event.target.value as Dataset; setDataset(nextDataset); setSelectedFields(fields[nextDataset]); if (nextDataset !== 'deals') setPeriod('all'); }} className="mt-1 w-full rounded border border-neutral-300 bg-transparent p-2 dark:border-neutral-700"><option value="companies">Companies</option><option value="deals">Deals</option><option value="people">People</option><option value="tasks">Tasks</option></select></label>
          {dataset === 'deals' && <label className="block text-xs">Close date<select value={period} onChange={(event) => setPeriod(event.target.value as 'all' | 'this-month')} className="mt-1 w-full rounded border border-neutral-300 bg-transparent p-2 dark:border-neutral-700"><option value="all">All close dates</option><option value="this-month">Closing this month</option></select></label>}
          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold">Include fields</legend>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-neutral-50 p-3 text-[11px] dark:bg-white/[0.04]">
              {fields[dataset].map((field) => (
                <label key={field} className="flex items-center gap-1.5 capitalize text-neutral-600 dark:text-neutral-300">
                  <input type="checkbox" checked={selectedFields.includes(field)} onChange={(event) => setSelectedFields((current) => event.target.checked ? [...current, field] : current.filter((item) => item !== field))} />
                  {field}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="text-[11px] text-neutral-500">{selectedFields.length} field{selectedFields.length === 1 ? '' : 's'} selected</div>
          <button onClick={downloadReport} disabled={rows.length === 0 || selectedFields.length === 0} className="inline-flex w-full items-center justify-center gap-2 rounded bg-neutral-950 px-3 py-2 text-xs font-bold text-white disabled:opacity-40 dark:bg-white dark:text-black">
            <Download className="h-3.5 w-3.5" /> Download CSV ({rows.length} records)
          </button>
        </div>
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-bold">Preview</h2><span className="text-[10px] text-neutral-500">Showing up to 8 rows</span></div>
          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-xs text-neutral-500 dark:border-neutral-700">No matching records for this report.</div>
          ) : (
            <div className="max-h-80 overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
              <table className="w-full text-left text-[10px]">
                <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-800"><tr>{selectedFields.map((field) => <th key={field} className="whitespace-nowrap px-2 py-2 font-semibold">{field}</th>)}</tr></thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">{rows.slice(0, 8).map((row, index) => <tr key={String(row.id || index)}>{selectedFields.map((field) => <td key={field} className="max-w-40 truncate px-2 py-2 text-neutral-600 dark:text-neutral-300">{String(row[field] ?? '')}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
