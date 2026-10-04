import { useState } from 'react';
import { AlertCircle, Upload, X } from 'lucide-react';

interface CompanyCsvImportProps {
  isOpen: boolean;
  isDark: boolean;
  onClose: () => void;
  onImport: (rows: Record<string, string>[]) => Promise<{ imported: number; errors: string[] }>;
}

const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char === '"') {
      if (quoted && input[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[index + 1] === '\n') index += 1;
      row.push(cell.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (quoted) throw new Error('The CSV contains an unclosed quoted value.');
  row.push(cell.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
};

const normalizeHeader = (header: string) => header.trim().toLowerCase().replace(/[\s_-]+/g, '');

export function CompanyCsvImport({ isOpen, isDark, onClose, onImport }: CompanyCsvImportProps) {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  if (!isOpen) return null;

  const selectFile = async (file?: File) => {
    setError('');
    setResult('');
    setRows([]);
    setFileName(file?.name || '');
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Choose a .csv file.');
      return;
    }
    if (file.size > 512 * 1024) {
      setError('The CSV must be 512 KB or smaller.');
      return;
    }
    try {
      const parsed = parseCsv(await file.text());
      if (parsed.length < 2) throw new Error('The CSV must contain a header row and at least one company.');
      const headers = parsed[0].map(normalizeHeader);
      if (!headers.includes('name')) throw new Error('A "Name" column is required.');
      const importedRows = parsed.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])));
      const missingNames = importedRows.filter((row) => !row.name.trim()).length;
      if (missingNames) throw new Error(`${missingNames} row(s) are missing a company name.`);
      if (importedRows.length > 500) throw new Error('Import is limited to 500 companies per file.');
      setRows(importedRows);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : 'Unable to read this CSV file.');
    }
  };

  const runImport = async () => {
    setIsImporting(true);
    setError('');
    try {
      const outcome = await onImport(rows);
      setResult(`${outcome.imported} ${outcome.imported === 1 ? 'company' : 'companies'} imported.${outcome.errors.length ? ` ${outcome.errors.length} row(s) were skipped: ${outcome.errors.slice(0, 3).join('; ')}` : ''}`);
      if (outcome.imported > 0) {
        setRows([]);
        setFileName('');
      }
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Unable to import this file.');
    } finally {
      setIsImporting(false);
    }
  };

  const panel = `w-full max-w-2xl rounded-2xl border ${isDark ? 'border-neutral-800 bg-[#101116]' : 'border-neutral-200 bg-white'} p-5 shadow-2xl`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(event) => { if (event.target === event.currentTarget && !isImporting) onClose(); }}>
      <div className={panel}>
        <div className="mb-4 flex items-center justify-between">
          <div><h2 className="text-base font-bold">Import companies from CSV</h2><p className="mt-1 text-xs text-neutral-500">Upload a CSV with a required Name column. Supported fields include domain, tier, ARR, status, city, country, and owner.</p></div>
          <button onClick={onClose} disabled={isImporting} aria-label="Close import dialog" className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 px-4 py-7 text-center dark:border-neutral-700">
          <Upload className="h-5 w-5 text-neutral-500" />
          <span className="mt-2 text-xs font-semibold">{fileName || 'Choose a CSV file'}</span>
          <span className="mt-1 text-[10px] text-neutral-500">Maximum 500 company rows · 512 KB file size</span>
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => void selectFile(event.currentTarget.files?.[0])} />
        </label>
        {error && <div role="alert" className="mt-3 flex gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
        {result && <p role="status" className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{result}</p>}
        {rows.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex justify-between text-xs"><span className="font-semibold">Preview</span><span className="text-neutral-500">{rows.length} rows</span></div>
            <div className="max-h-52 overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
              <table className="w-full text-left text-[10px]">
                <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-800"><tr>{Object.keys(rows[0]).map((key) => <th key={key} className="px-2 py-2 capitalize">{key}</th>)}</tr></thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">{rows.slice(0, 5).map((row, index) => <tr key={`${row.name}-${index}`}>{Object.keys(rows[0]).map((key) => <td key={key} className="max-w-40 truncate px-2 py-2">{row[key]}</td>)}</tr>)}</tbody>
              </table>
            </div>
          </div>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} disabled={isImporting} className="rounded border border-neutral-200 px-3 py-2 text-xs dark:border-neutral-700">Close</button>
          <button onClick={() => void runImport()} disabled={!rows.length || isImporting} className="rounded bg-neutral-950 px-3 py-2 text-xs font-bold text-white disabled:opacity-40 dark:bg-white dark:text-black">{isImporting ? 'Importing…' : `Import ${rows.length || ''} companies`}</button>
        </div>
      </div>
    </div>
  );
}
