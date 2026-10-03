import { useState, useEffect } from 'react';
import { Search, Building2, DollarSign, Command, ArrowRight, X, Terminal, ExternalLink, Moon } from 'lucide-react';
import { INITIAL_COMPANIES, INITIAL_DEALS } from '../data/mockCrmData';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionType: string, payload?: any) => void;
}

export function CommandPalette({ isOpen, onClose, onSelectAction }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onSelectAction('open_cmd');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onSelectAction]);

  if (!isOpen) return null;

  const filteredCompanies = INITIAL_COMPANIES.filter(
    (c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.domain.toLowerCase().includes(query.toLowerCase())
  );

  const filteredDeals = INITIAL_DEALS.filter(
    (d) => d.title.toLowerCase().includes(query.toLowerCase()) || d.companyName.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-32 px-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl rounded-xl border border-white/20 bg-[#111216] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-white/10 px-4 py-3 gap-3">
          <Search className="h-4 w-4 text-neutral-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search companies, deals, docs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
          />
          <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-neutral-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-4 text-xs">
          {/* Quick Actions */}
          <div>
            <div className="px-2.5 py-1 text-[11px] font-medium text-neutral-500">Quick Actions</div>
            <div className="space-y-0.5 mt-1">
              <button
                onClick={() => {
                  onSelectAction('scroll_product');
                  onClose();
                }}
                className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Command className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Navigate to Interactive Workspace</span>
                </div>
                <ArrowRight className="h-3 w-3 text-neutral-500" />
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText('docker compose up -d');
                  onClose();
                }}
                className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Copy Docker Compose Run Command</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">docker compose up</span>
              </button>
            </div>
          </div>

          {/* Companies Match */}
          {filteredCompanies.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-medium text-neutral-500">Companies</div>
              <div className="space-y-0.5 mt-1">
                {filteredCompanies.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectAction('view_company', c);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-neutral-400" />
                      <span className="font-medium text-white">{c.name}</span>
                      <span className="text-[11px] text-neutral-500 font-mono">({c.domain})</span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400">${c.arr.toLocaleString()} ARR</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Deals Match */}
          {filteredDeals.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-medium text-neutral-500">Opportunities</div>
              <div className="space-y-0.5 mt-1">
                {filteredDeals.slice(0, 3).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      onSelectAction('scroll_product');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5 text-neutral-400" />
                      <span className="font-medium text-white">{d.title}</span>
                      <span className="text-[11px] text-neutral-500">· {d.companyName}</span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400">${d.amount.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="border-t border-white/10 bg-[#0e0f12] px-4 py-2 flex items-center justify-between text-[11px] text-neutral-500">
          <div className="flex items-center gap-2">
            <span>Use</span>
            <kbd className="rounded border border-white/10 px-1 text-[10px]">↑</kbd>
            <kbd className="rounded border border-white/10 px-1 text-[10px]">↓</kbd>
            <span>to navigate</span>
          </div>
          <span>Press ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
}
