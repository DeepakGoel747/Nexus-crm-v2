import { RotateCcw, Trash2 } from 'lucide-react';

export interface TrashRecord {
  id: string;
  entityType: string;
  record: Record<string, unknown>;
  deletedAt: string;
}

interface TrashViewProps {
  records: TrashRecord[];
  isDark: boolean;
  onRestore: (id: string) => Promise<void>;
  onDeletePermanently: (id: string) => Promise<void>;
}

export function TrashView({ records, isDark, onRestore, onDeletePermanently }: TrashViewProps) {
  const panel = `rounded-xl border ${isDark ? 'border-neutral-800 bg-[#0c0d10]' : 'border-neutral-200 bg-white'} shadow-sm`;
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Trash</h1>
        <p className="mt-1 text-xs text-neutral-500">Deleted companies and linked deals are retained here until restored or permanently removed.</p>
      </div>
      <div className={`${panel} divide-y divide-neutral-100 dark:divide-neutral-800`}>
        {records.length === 0 ? (
          <div className="p-10 text-center">
            <Trash2 className="mx-auto h-6 w-6 text-neutral-400" />
            <p className="mt-3 text-sm font-semibold">Trash is empty</p>
            <p className="mt-1 text-xs text-neutral-500">Deleted records will be available here to restore.</p>
          </div>
        ) : records.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{String(item.record.name || item.record.title || 'Untitled record')}</p>
              <p className="mt-1 text-[10px] capitalize text-neutral-500">{item.entityType} · Deleted {new Date(item.deletedAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => void onRestore(item.id)} className="inline-flex items-center gap-1 rounded border border-neutral-200 px-2.5 py-1.5 text-[11px] font-semibold dark:border-neutral-700"><RotateCcw className="h-3 w-3" /> Restore</button>
              <button onClick={() => { if (window.confirm('Permanently delete this record? This cannot be undone.')) void onDeletePermanently(item.id); }} className="inline-flex items-center gap-1 rounded border border-red-200 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 dark:border-red-500/30 dark:text-red-400"><Trash2 className="h-3 w-3" /> Delete forever</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
