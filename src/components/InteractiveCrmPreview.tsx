import { useState, useMemo } from 'react';
import { 
  Building2, 
  DollarSign, 
  Users, 
  CheckSquare, 
  Search, 
  SlidersHorizontal, 
  Plus, 
  ExternalLink, 
  X, 
  ChevronRight, 
  ChevronDown,
  ArrowUpDown, 
  Clock, 
  Mail, 
  MessageSquare, 
  Calendar,
  Layers,
  LayoutGrid,
  List,
  Sparkles,
  CheckCircle2,
  Trash2,
  Send,
  Star,
  FileText,
  Settings,
  Maximize2,
  Minimize2,
  Download,
  Filter as FilterIcon,
  Columns,
  Code2,
  ChevronLeft
} from 'lucide-react';
import { Company, Deal, Person, Task, DealStage } from '../types/crm';
import { INITIAL_COMPANIES, INITIAL_DEALS, INITIAL_PEOPLE, INITIAL_TASKS, MOCK_ACTIVITIES, AVATARS } from '../data/mockCrmData';
import { AiCopilotDrawer } from './AiCopilotDrawer';

interface InteractiveCrmPreviewProps {
  onOpenCommand: () => void;
}

export function InteractiveCrmPreview({ onOpenCommand }: InteractiveCrmPreviewProps) {
  // Navigation & layout
  const [activeObject, setActiveObject] = useState<'companies' | 'opportunities' | 'people' | 'tasks'>('companies');
  const [dealsLayout, setDealsLayout] = useState<'kanban' | 'table'>('kanban');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(false);

  // Saved Views
  const [activeView, setActiveView] = useState<'all' | 'enterprise' | 'high_arr'>('all');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showColumnsPopover, setShowColumnsPopover] = useState(false);
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'arr'>('arr');
  const [sortAsc, setSortAsc] = useState(false);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    domain: true,
    tier: true,
    arr: true,
    contact: true,
    status: true,
    owner: true,
  });

  // Entities state
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  // Selection state for bulk actions
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);

  // Detail Drawer state
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'activity' | 'notes' | 'graphql'>('overview');
  const [newNoteText, setNewNoteText] = useState('');

  // New Record Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyDomain, setNewCompanyDomain] = useState('');
  const [newCompanyTier, setNewCompanyTier] = useState<'Enterprise' | 'Mid-Market' | 'Growth' | 'Seed'>('Growth');
  const [newCompanyArr, setNewCompanyArr] = useState('45000');

  // Filtered & Sorted Companies
  const filteredCompanies = useMemo(() => {
    return companies
      .filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.primaryContact.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesView = true;
        if (activeView === 'enterprise') matchesView = c.tier === 'Enterprise';
        if (activeView === 'high_arr') matchesView = c.arr >= 100000;

        const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
        return matchesSearch && matchesView && matchesTier;
      })
      .sort((a, b) => {
        if (sortField === 'name') {
          return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        return sortAsc ? a.arr - b.arr : b.arr - a.arr;
      });
  }, [companies, searchQuery, activeView, tierFilter, sortField, sortAsc]);

  // Kanban Stage columns
  const KANBAN_STAGES: { id: DealStage; label: string }[] = [
    { id: 'prospect', label: 'Prospecting' },
    { id: 'qualified', label: 'Qualified' },
    { id: 'proposal', label: 'Proposal' },
    { id: 'negotiation', label: 'Negotiation' },
    { id: 'won', label: 'Closed Won' },
  ];

  // Move deal to next stage
  const advanceDealStage = (dealId: string) => {
    const stageOrder: DealStage[] = ['prospect', 'qualified', 'proposal', 'negotiation', 'won'];
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id === dealId) {
          const currentIndex = stageOrder.indexOf(d.stage);
          const nextStage = currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1] : stageOrder[0];
          return { ...d, stage: nextStage };
        }
        return d;
      })
    );
  };

  // Toggle Task completion
  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCompanyIds(filteredCompanies.map((c) => c.id));
    } else {
      setSelectedCompanyIds([]);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    setCompanies((prev) => prev.filter((c) => !selectedCompanyIds.includes(c.id)));
    setSelectedCompanyIds([]);
  };

  // Add new company handler
  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    const newComp: Company = {
      id: `comp-${Date.now()}`,
      name: newCompanyName.trim(),
      domain: newCompanyDomain.trim() || `${newCompanyName.toLowerCase().replace(/\s+/g, '')}.com`,
      tier: newCompanyTier,
      arr: parseInt(newCompanyArr, 10) || 50000,
      dealCount: 1,
      city: 'San Francisco',
      country: 'United States',
      employees: 25,
      primaryContact: 'Founder & CEO',
      owner: 'Sarah Miller',
      status: 'Prospect',
      notes: 'Imported during Nexus live tour session.',
      tags: ['New Lead', 'Inbound'],
    };

    setCompanies([newComp, ...companies]);
    setNewCompanyName('');
    setNewCompanyDomain('');
    setShowAddModal(false);
    setSelectedCompany(newComp);
  };

  // Add note inside drawer
  const handleAddNote = () => {
    if (!newNoteText.trim() || !selectedCompany) return;
    setSelectedCompany({
      ...selectedCompany,
      notes: `${selectedCompany.notes}\n\n[${new Date().toLocaleTimeString()}]: ${newNoteText.trim()}`,
    });
    setNewNoteText('');
  };

  // Export CSV simulation
  const handleExportCsv = () => {
    const csvContent =
      'Name,Domain,Tier,ARR,Primary Contact,Status,Owner\n' +
      filteredCompanies
        .map(
          (c) =>
            `"${c.name}","${c.domain}","${c.tier}",${c.arr},"${c.primaryContact}","${c.status}","${c.owner}"`
        )
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nexus_companies_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section id="product-tour" className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 scroll-mt-20">
      {/* Section Kicker */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400">
            <span>Figma-Grade UI Canvas</span>
            <span>·</span>
            <span>Local-First React Engine</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            The Complete Nexus CRM Interface
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            A full-fidelity replica of Twenty CRM's frontend: collapsible navigation sidebar, saved views, custom columns, live multi-select, and GraphQL query inspector.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiDrawer(true)}
            className="flex items-center gap-1.5 rounded-md border border-purple-500/40 bg-purple-500/15 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/25 transition-colors cursor-pointer shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
            <span>Twenty AI Copilot</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Expand Viewport'}</span>
          </button>
        </div>
      </div>

      {/* Main CRM Application Window */}
      <div
        className={`relative overflow-hidden rounded-xl border border-white/15 bg-[#0b0c0f] shadow-2xl transition-all duration-300 ${
          isFullscreen ? 'fixed inset-4 z-50 rounded-xl overflow-hidden' : 'min-h-[620px]'
        }`}
      >
        <div className="flex h-full min-h-[580px]">
          {/* 1. LEFT WORKSPACE SIDEBAR (Twenty CRM iconic sidebar) */}
          <aside
            className={`border-r border-white/[0.08] bg-[#090a0d] flex flex-col justify-between transition-all duration-200 ${
              isSidebarCollapsed ? 'w-14 items-center' : 'w-56'
            }`}
          >
            {/* Top Workspace Selector */}
            <div>
              <div className="p-3 border-b border-white/[0.08] flex items-center justify-between">
                {!isSidebarCollapsed ? (
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-white text-black font-bold text-xs shrink-0">
                      N
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">Acme Systems</p>
                      <p className="text-[10px] text-neutral-500 font-mono">Workspace</p>
                    </div>
                    <ChevronDown className="h-3 w-3 text-neutral-500" />
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-white text-black font-bold text-xs">
                    N
                  </div>
                )}
              </div>

              {/* Quick Search & AI Copilot Buttons */}
              <div className="p-2 space-y-1.5">
                <button
                  onClick={onOpenCommand}
                  className="w-full flex items-center justify-between rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs text-neutral-400 hover:text-white hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-3.5 w-3.5 text-neutral-400" />
                    {!isSidebarCollapsed && <span>Search</span>}
                  </div>
                  {!isSidebarCollapsed && <kbd className="font-mono text-[9px] bg-white/10 px-1 py-0.5 rounded">⌘K</kbd>}
                </button>

                <button
                  onClick={() => setShowAiDrawer(true)}
                  className="w-full flex items-center justify-between rounded-md border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-xs text-purple-300 hover:text-white hover:bg-purple-500/20 transition-colors cursor-pointer"
                  title="Twenty AI Copilot"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                    {!isSidebarCollapsed && <span className="font-semibold">Twenty AI</span>}
                  </div>
                  {!isSidebarCollapsed && <span className="font-mono text-[9px] bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded">MCP</span>}
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="p-2 space-y-4 text-xs">
                {/* Favorites */}
                {!isSidebarCollapsed && (
                  <div>
                    <span className="px-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                      Favorites
                    </span>
                    <div className="space-y-0.5">
                      <button
                        onClick={() => {
                          setActiveObject('companies');
                          setSelectedCompany(companies[0]);
                        }}
                        className="w-full flex items-center gap-2 rounded px-2 py-1 text-neutral-400 hover:text-white hover:bg-white/[0.04] text-left truncate"
                      >
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400/30" />
                        <span>Linear Systems</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveObject('opportunities');
                          setDealsLayout('kanban');
                        }}
                        className="w-full flex items-center gap-2 rounded px-2 py-1 text-neutral-400 hover:text-white hover:bg-white/[0.04] text-left truncate"
                      >
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400/30" />
                        <span>Q4 Deals Pipeline</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Core CRM Objects */}
                <div>
                  {!isSidebarCollapsed && (
                    <span className="px-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                      Workspace
                    </span>
                  )}
                  <div className="space-y-0.5">
                    <button
                      onClick={() => setActiveObject('companies')}
                      className={`w-full flex items-center justify-between rounded px-2 py-1.5 transition-colors ${
                        activeObject === 'companies'
                          ? 'bg-white/10 text-white font-medium'
                          : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                      title="Companies"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5" />
                        {!isSidebarCollapsed && <span>Companies</span>}
                      </div>
                      {!isSidebarCollapsed && (
                        <span className="text-[10px] font-mono text-neutral-500">{companies.length}</span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveObject('opportunities')}
                      className={`w-full flex items-center justify-between rounded px-2 py-1.5 transition-colors ${
                        activeObject === 'opportunities'
                          ? 'bg-white/10 text-white font-medium'
                          : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                      title="Opportunities"
                    >
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5" />
                        {!isSidebarCollapsed && <span>Opportunities</span>}
                      </div>
                      {!isSidebarCollapsed && (
                        <span className="text-[10px] font-mono text-neutral-500">{deals.length}</span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveObject('people')}
                      className={`w-full flex items-center justify-between rounded px-2 py-1.5 transition-colors ${
                        activeObject === 'people'
                          ? 'bg-white/10 text-white font-medium'
                          : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                      title="People"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" />
                        {!isSidebarCollapsed && <span>People</span>}
                      </div>
                      {!isSidebarCollapsed && (
                        <span className="text-[10px] font-mono text-neutral-500">{INITIAL_PEOPLE.length}</span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveObject('tasks')}
                      className={`w-full flex items-center justify-between rounded px-2 py-1.5 transition-colors ${
                        activeObject === 'tasks'
                          ? 'bg-white/10 text-white font-medium'
                          : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                      title="Tasks"
                    >
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-3.5 w-3.5" />
                        {!isSidebarCollapsed && <span>Tasks</span>}
                      </div>
                      {!isSidebarCollapsed && (
                        <span className="text-[10px] font-mono text-neutral-500">
                          {tasks.filter((t) => !t.completed).length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Custom Objects */}
                {!isSidebarCollapsed && (
                  <div>
                    <span className="px-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                      Custom Objects
                    </span>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between rounded px-2 py-1 text-neutral-500 cursor-not-allowed">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5" />
                          <span>Contracts</span>
                        </div>
                        <span className="text-[9px] bg-white/5 px-1 rounded">Schema</span>
                      </div>
                    </div>
                  </div>
                )}
              </nav>
            </div>

            {/* Bottom User Bar & Collapse Trigger */}
            <div className="p-2 border-t border-white/[0.08] flex items-center justify-between">
              {!isSidebarCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative">
                    <img
                      src={AVATARS.alex}
                      alt="User avatar"
                      referrerPolicy="no-referrer"
                      className="h-6 w-6 rounded-full object-cover border border-white/20"
                    />
                    <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">Alex Chen</p>
                    <p className="text-[10px] text-neutral-500">Admin</p>
                  </div>
                </div>
              ) : null}

              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1 rounded text-neutral-500 hover:text-white hover:bg-white/10 transition-colors"
                title="Collapse / Expand Sidebar"
              >
                <ChevronLeft className={`h-4 w-4 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </aside>

          {/* 2. MAIN CRM CANVAS VIEWPORT */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#0c0d10]">
            {/* View Tabs & Action Bar */}
            <div className="border-b border-white/[0.08] bg-[#0f1013] px-4 pt-2">
              {/* Row 1: Saved View Tabs */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-xs">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveView('all')}
                    className={`px-3 py-1 rounded font-medium transition-colors ${
                      activeView === 'all'
                        ? 'bg-white text-black font-semibold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    All {activeObject}
                  </button>
                  {activeObject === 'companies' && (
                    <>
                      <button
                        onClick={() => setActiveView('enterprise')}
                        className={`px-3 py-1 rounded font-medium transition-colors ${
                          activeView === 'enterprise'
                            ? 'bg-white text-black font-semibold'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Enterprise Tier
                      </button>
                      <button
                        onClick={() => setActiveView('high_arr')}
                        className={`px-3 py-1 rounded font-medium transition-colors ${
                          activeView === 'high_arr'
                            ? 'bg-white text-black font-semibold'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        High ARR (&gt;$100k)
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-neutral-500 hidden sm:inline">
                    {filteredCompanies.length} visible records
                  </span>
                  <button
                    onClick={handleExportCsv}
                    className="flex items-center gap-1 rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-neutral-300 hover:text-white transition-colors"
                    title="Export filtered records to CSV"
                  >
                    <Download className="h-3 w-3" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Filter Toolbar */}
              <div className="py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <div className="relative w-full">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                    <input
                      type="text"
                      placeholder={`Filter ${activeObject}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-md border border-white/10 bg-white/[0.04] py-1 pl-8 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Filter Popover Trigger */}
                  <div className="relative">
                    <button
                      onClick={() => setShowFilterPopover(!showFilterPopover)}
                      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
                        tierFilter !== 'all'
                          ? 'border-white/40 bg-white/10 text-white'
                          : 'border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white'
                      }`}
                    >
                      <FilterIcon className="h-3 w-3" />
                      <span>Filter: {tierFilter === 'all' ? 'All Tiers' : tierFilter}</span>
                      <ChevronDown className="h-2.5 w-2.5" />
                    </button>

                    {showFilterPopover && (
                      <div className="absolute right-0 top-full mt-1.5 w-48 rounded-lg border border-white/15 bg-[#14151a] p-2 shadow-2xl z-20 space-y-1">
                        <span className="text-[10px] font-semibold text-neutral-500 uppercase px-2">Account Tier</span>
                        {['all', 'Enterprise', 'Mid-Market', 'Growth'].map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              setTierFilter(t);
                              setShowFilterPopover(false);
                            }}
                            className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                              tierFilter === t ? 'bg-white/15 text-white font-medium' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            {t === 'all' ? 'Show All Tiers' : t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Columns Chooser */}
                  <div className="relative">
                    <button
                      onClick={() => setShowColumnsPopover(!showColumnsPopover)}
                      className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-neutral-300 hover:text-white transition-colors"
                      title="Toggle Columns"
                    >
                      <Columns className="h-3 w-3" />
                      <span className="hidden sm:inline">Fields</span>
                    </button>

                    {showColumnsPopover && (
                      <div className="absolute right-0 top-full mt-1.5 w-44 rounded-lg border border-white/15 bg-[#14151a] p-2 shadow-2xl z-20 space-y-1 text-xs">
                        <span className="text-[10px] font-semibold text-neutral-500 uppercase px-2">Visible Fields</span>
                        {Object.entries(visibleColumns).map(([col, isVisible]) => (
                          <label key={col} className="flex items-center gap-2 px-2 py-1 text-neutral-300 hover:text-white cursor-pointer capitalize">
                            <input
                              type="checkbox"
                              checked={isVisible}
                              onChange={() =>
                                setVisibleColumns((prev: any) => ({ ...prev, [col]: !prev[col] }))
                              }
                              className="rounded border-white/20 bg-white/5"
                            />
                            <span>{col}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Layout switch for Opportunities */}
                  {activeObject === 'opportunities' && (
                    <div className="flex items-center rounded-md border border-white/10 bg-white/[0.04] p-0.5">
                      <button
                        onClick={() => setDealsLayout('kanban')}
                        className={`p-1 rounded text-xs ${dealsLayout === 'kanban' ? 'bg-white/15 text-white' : 'text-neutral-400'}`}
                        title="Kanban Board"
                      >
                        <LayoutGrid className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDealsLayout('table')}
                        className={`p-1 rounded text-xs ${dealsLayout === 'table' ? 'bg-white/15 text-white' : 'text-neutral-400'}`}
                        title="Table View"
                      >
                        <List className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Primary Add Button */}
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1 text-xs font-semibold text-neutral-950 hover:bg-neutral-200 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Record</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Selection Action Bar */}
            {selectedCompanyIds.length > 0 && activeObject === 'companies' && (
              <div className="bg-white/10 border-b border-white/15 px-4 py-2 flex items-center justify-between text-xs animate-in fade-in">
                <span className="font-medium text-white">
                  {selectedCompanyIds.length} {selectedCompanyIds.length === 1 ? 'company' : 'companies'} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1 text-red-400 hover:text-red-300 font-medium px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                  <button
                    onClick={() => setSelectedCompanyIds([])}
                    className="text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* VIEW CONTENTS */}
            <div className="flex-1 overflow-auto">
              {/* TAB 1: COMPANIES TABLE */}
              {activeObject === 'companies' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02] text-neutral-400 sticky top-0 bg-[#0c0d10] z-10">
                      <th className="py-2.5 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={
                            filteredCompanies.length > 0 &&
                            selectedCompanyIds.length === filteredCompanies.length
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-white/20 bg-white/5"
                        />
                      </th>
                      <th className="py-2.5 px-4 font-medium">
                        <button
                          onClick={() => {
                            setSortField('name');
                            setSortAsc(!sortAsc);
                          }}
                          className="flex items-center gap-1 hover:text-white"
                        >
                          <span>Company</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      {visibleColumns.domain && <th className="py-2.5 px-4 font-medium">Domain</th>}
                      {visibleColumns.tier && <th className="py-2.5 px-4 font-medium">Tier</th>}
                      {visibleColumns.arr && (
                        <th className="py-2.5 px-4 font-medium text-right">
                          <button
                            onClick={() => {
                              setSortField('arr');
                              setSortAsc(!sortAsc);
                            }}
                            className="flex items-center justify-end gap-1 w-full hover:text-white"
                          >
                            <span>ARR</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                      )}
                      {visibleColumns.contact && <th className="py-2.5 px-4 font-medium">Primary Contact</th>}
                      {visibleColumns.status && <th className="py-2.5 px-4 font-medium">Status</th>}
                      {visibleColumns.owner && <th className="py-2.5 px-4 font-medium">Lead Owner</th>}
                      <th className="py-2.5 px-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {filteredCompanies.map((company) => {
                      const isSelected = selectedCompanyIds.includes(company.id);
                      return (
                        <tr
                          key={company.id}
                          className={`group cursor-pointer transition-colors ${
                            isSelected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                          }`}
                        >
                          <td className="py-3 px-3 w-8">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectRow(company.id)}
                              className="rounded border-white/20 bg-white/5"
                            />
                          </td>
                          <td
                            onClick={() => setSelectedCompany(company)}
                            className="py-3 px-4 font-medium text-white flex items-center gap-2"
                          >
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-white/5 font-mono text-[10px] text-neutral-300">
                              {company.name.charAt(0)}
                            </div>
                            <span className="group-hover:text-blue-300 transition-colors">{company.name}</span>
                          </td>
                          {visibleColumns.domain && (
                            <td onClick={() => setSelectedCompany(company)} className="py-3 px-4 text-neutral-400 font-mono text-[11px]">
                              {company.domain}
                            </td>
                          )}
                          {visibleColumns.tier && (
                            <td onClick={() => setSelectedCompany(company)} className="py-3 px-4 text-neutral-300">
                              {company.tier}
                            </td>
                          )}
                          {visibleColumns.arr && (
                            <td onClick={() => setSelectedCompany(company)} className="py-3 px-4 text-right font-mono tabular-nums text-white font-medium">
                              ${company.arr.toLocaleString()}
                            </td>
                          )}
                          {visibleColumns.contact && (
                            <td onClick={() => setSelectedCompany(company)} className="py-3 px-4 text-neutral-300">
                              {company.primaryContact}
                            </td>
                          )}
                          {visibleColumns.status && (
                            <td onClick={() => setSelectedCompany(company)} className="py-3 px-4">
                              <span className="text-neutral-300">{company.status}</span>
                            </td>
                          )}
                          {visibleColumns.owner && (
                            <td onClick={() => setSelectedCompany(company)} className="py-3 px-4 text-neutral-400">
                              {company.owner}
                            </td>
                          )}
                          <td onClick={() => setSelectedCompany(company)} className="py-3 px-4 text-right">
                            <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 group-hover:text-neutral-200">
                              Open <ChevronRight className="h-3 w-3" />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* TAB 2: OPPORTUNITIES (KANBAN OR TABLE) */}
              {activeObject === 'opportunities' && dealsLayout === 'kanban' && (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {KANBAN_STAGES.map((col) => {
                    const stageDeals = deals.filter((d) => d.stage === col.id);
                    const colTotal = stageDeals.reduce((sum, d) => sum + d.amount, 0);

                    return (
                      <div key={col.id} className="flex flex-col rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-neutral-200">{col.label}</span>
                            <span className="text-[11px] text-neutral-500 font-mono">({stageDeals.length})</span>
                          </div>
                          <span className="text-[11px] font-mono tabular-nums text-neutral-400">
                            ${(colTotal / 1000).toFixed(0)}k
                          </span>
                        </div>

                        <div className="space-y-2 flex-1">
                          {stageDeals.map((deal) => (
                            <div
                              key={deal.id}
                              className="group relative rounded-md border border-white/10 bg-[#141519] p-2.5 shadow-sm hover:border-white/20 hover:bg-[#18191f] transition-all"
                            >
                              <div className="text-xs font-medium text-white group-hover:text-blue-300 transition-colors">
                                {deal.title}
                              </div>
                              <div className="mt-1 text-[11px] text-neutral-400">{deal.companyName}</div>

                              <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.06] pt-2 text-[11px]">
                                <span className="font-mono tabular-nums text-white font-semibold">
                                  ${deal.amount.toLocaleString()}
                                </span>

                                <button
                                  onClick={() => advanceDealStage(deal.id)}
                                  className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-0.5 rounded px-1.5 py-0.5 hover:bg-white/10 transition-colors"
                                  title="Advance to next pipeline stage"
                                >
                                  <span>Advance</span>
                                  <ChevronRight className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 3: PEOPLE */}
              {activeObject === 'people' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02] text-neutral-400 sticky top-0 bg-[#0c0d10]">
                      <th className="py-2.5 px-4 font-medium">Name</th>
                      <th className="py-2.5 px-4 font-medium">Email</th>
                      <th className="py-2.5 px-4 font-medium">Title</th>
                      <th className="py-2.5 px-4 font-medium">Company</th>
                      <th className="py-2.5 px-4 font-medium">Status</th>
                      <th className="py-2.5 px-4 font-medium">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {INITIAL_PEOPLE.map((person) => (
                      <tr key={person.id} className="hover:bg-white/[0.03]">
                        <td className="py-3 px-4 font-medium text-white">{person.name}</td>
                        <td className="py-3 px-4 text-neutral-400 font-mono text-[11px]">{person.email}</td>
                        <td className="py-3 px-4 text-neutral-300">{person.title}</td>
                        <td className="py-3 px-4 text-neutral-300">{person.companyName}</td>
                        <td className="py-3 px-4 text-neutral-300">{person.status}</td>
                        <td className="py-3 px-4 text-neutral-500 text-[11px]">{person.lastActivity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* TAB 4: TASKS */}
              {activeObject === 'tasks' && (
                <div className="p-4 space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 text-xs hover:border-white/20 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                            task.completed ? 'bg-white text-black border-white' : 'border-neutral-500'
                          }`}
                        >
                          {task.completed && <CheckCircle2 className="h-3 w-3 stroke-[3]" />}
                        </button>
                        <div>
                          <p className={`font-medium ${task.completed ? 'line-through text-neutral-500' : 'text-white'}`}>
                            {task.title}
                          </p>
                          <span className="text-[11px] text-neutral-400">
                            {task.relatedEntity} · Assigned to {task.assignedTo}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-neutral-400 font-mono text-[11px]">
                        <span>Due {task.dueDate}</span>
                        <span className="text-neutral-300 capitalize">{task.priority} priority</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Status Bar */}
            <div className="flex items-center justify-between border-t border-white/[0.08] bg-[#090a0d] px-4 py-2 text-[11px] text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Connected to PostgreSQL read-replica</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Query latency: 14ms</span>
                <span className="font-mono">Nexus v0.42</span>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* SLIDE-OVER RECORD DRAWER WITH GRAPHQL INSPECTOR */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-lg border-l border-white/10 bg-[#0e0f13] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-white text-black font-bold text-xs">
                  {selectedCompany.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedCompany.name}</h3>
                  <a
                    href={`https://${selectedCompany.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 font-mono"
                  >
                    <span>{selectedCompany.domain}</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAiDrawer(true)}
                  className="flex items-center gap-1 rounded border border-purple-500/40 bg-purple-500/15 px-2.5 py-1 text-xs text-purple-300 hover:bg-purple-500/25 transition-colors cursor-pointer"
                  title="Query Nexus AI for account insights"
                >
                  <Sparkles className="h-3 w-3 text-purple-400" />
                  <span>Ask AI</span>
                </button>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="rounded p-1 text-neutral-400 hover:text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="flex border-b border-white/10 px-5 text-xs font-medium">
              <button
                onClick={() => setDrawerTab('overview')}
                className={`py-2.5 px-3 border-b-2 transition-colors ${
                  drawerTab === 'overview' ? 'border-white text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setDrawerTab('activity')}
                className={`py-2.5 px-3 border-b-2 transition-colors ${
                  drawerTab === 'activity' ? 'border-white text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Activity Timeline
              </button>
              <button
                onClick={() => setDrawerTab('notes')}
                className={`py-2.5 px-3 border-b-2 transition-colors ${
                  drawerTab === 'notes' ? 'border-white text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Internal Notes
              </button>
              <button
                onClick={() => setDrawerTab('graphql')}
                className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1 ${
                  drawerTab === 'graphql' ? 'border-white text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Code2 className="h-3 w-3" />
                <span>GraphQL</span>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {drawerTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                      <span className="text-neutral-500">Annual Contract Value</span>
                      <p className="mt-1 text-base font-bold font-mono tabular-nums text-white">
                        ${selectedCompany.arr.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                      <span className="text-neutral-500">Account Tier</span>
                      <p className="mt-1 text-base font-semibold text-white">{selectedCompany.tier}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/[0.02] divide-y divide-white/[0.06]">
                    <div className="flex items-center justify-between p-3">
                      <span className="text-neutral-400">Account Status</span>
                      <span className="font-medium text-white">{selectedCompany.status}</span>
                    </div>
                    <div className="flex items-center justify-between p-3">
                      <span className="text-neutral-400">Account Executive</span>
                      <span className="font-medium text-white">{selectedCompany.owner}</span>
                    </div>
                    <div className="flex items-center justify-between p-3">
                      <span className="text-neutral-400">Primary Contact</span>
                      <span className="font-medium text-white">{selectedCompany.primaryContact}</span>
                    </div>
                    <div className="flex items-center justify-between p-3">
                      <span className="text-neutral-400">Location</span>
                      <span className="font-medium text-white">{selectedCompany.city}, {selectedCompany.country}</span>
                    </div>
                    <div className="flex items-center justify-between p-3">
                      <span className="text-neutral-400">Team Size</span>
                      <span className="font-medium text-white font-mono tabular-nums">{selectedCompany.employees} members</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-neutral-500 block mb-2">Segment Tags</span>
                    <div className="flex flex-wrap gap-2 text-neutral-300">
                      {selectedCompany.tags.map((tag) => (
                        <span key={tag} className="border border-white/10 rounded px-2 py-0.5 text-[11px]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'activity' && (
                <div className="space-y-4">
                  {(MOCK_ACTIVITIES[selectedCompany.id] || []).map((act) => (
                    <div key={act.id} className="relative pl-6 border-l border-white/10 pb-4">
                      <div className="absolute -left-1.5 top-0.5 h-3 w-3 rounded-full bg-white/20 border border-white/40" />
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{act.title}</span>
                        <span className="text-neutral-500 text-[10px]">{act.timestamp}</span>
                      </div>
                      <p className="mt-1 text-neutral-400 leading-relaxed">{act.description}</p>
                      <span className="mt-1.5 block text-[10px] text-neutral-500">Logged by {act.author}</span>
                    </div>
                  ))}
                  {(!MOCK_ACTIVITIES[selectedCompany.id] || MOCK_ACTIVITIES[selectedCompany.id].length === 0) && (
                    <div className="text-center py-8 text-neutral-500">
                      No prior activities logged for this account yet.
                    </div>
                  )}
                </div>
              )}

              {drawerTab === 'notes' && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {selectedCompany.notes}
                  </div>

                  <div className="pt-2">
                    <label className="block text-neutral-400 text-xs mb-1">Add Note</label>
                    <textarea
                      rows={3}
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Type internal account note..."
                      className="w-full rounded-md border border-white/10 bg-white/[0.04] p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={handleAddNote}
                        disabled={!newNoteText.trim()}
                        className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-neutral-200 disabled:opacity-40"
                      >
                        <Send className="h-3 w-3" />
                        <span>Post Note</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'graphql' && (
                <div className="space-y-3 font-mono text-xs">
                  <span className="text-neutral-400 text-[11px] block">
                    Underlying GraphQL Query for Record #{selectedCompany.id}:
                  </span>
                  <div className="rounded-lg border border-white/10 bg-[#08090b] p-3 text-neutral-300 overflow-x-auto text-[11px] leading-relaxed">
                    <pre>
                      <code>{`query GetCompanyRecord {
  company(id: "${selectedCompany.id}") {
    id
    name: "${selectedCompany.name}"
    domain: "${selectedCompany.domain}"
    tier: ${selectedCompany.tier}
    arr: ${selectedCompany.arr}
    status: "${selectedCompany.status}"
    owner: "${selectedCompany.owner}"
    activities(first: 10) {
      edges {
        node {
          type
          title
          timestamp
        }
      }
    }
  }
}`}</code>
                    </pre>
                  </div>
                  <span className="text-[10px] text-neutral-500 block">
                    All CRM fields are generated from PostgreSQL schema metadata dynamically.
                  </span>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-white/10 px-5 py-3 flex items-center justify-between text-xs">
              <span className="text-neutral-500">Record ID: {selectedCompany.id}</span>
              <button
                onClick={() => setSelectedCompany(null)}
                className="rounded-md border border-white/10 px-3 py-1.5 text-neutral-300 hover:text-white"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW COMPANY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-white/15 bg-[#121318] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Create New Company</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddCompany} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/[0.04] p-2 text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Domain</label>
                <input
                  type="text"
                  placeholder="e.g. acme.com"
                  value={newCompanyDomain}
                  onChange={(e) => setNewCompanyDomain(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/[0.04] p-2 text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Tier</label>
                  <select
                    value={newCompanyTier}
                    onChange={(e) => setNewCompanyTier(e.target.value as any)}
                    className="w-full rounded-md border border-white/10 bg-[#16181d] p-2 text-white focus:outline-none"
                  >
                    <option value="Enterprise">Enterprise</option>
                    <option value="Mid-Market">Mid-Market</option>
                    <option value="Growth">Growth</option>
                    <option value="Seed">Seed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Estimated ARR ($)</label>
                  <input
                    type="number"
                    value={newCompanyArr}
                    onChange={(e) => setNewCompanyArr(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-white/[0.04] p-2 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-md border border-white/10 px-3 py-1.5 text-neutral-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-white px-4 py-1.5 font-semibold text-neutral-950 hover:bg-neutral-200"
                >
                  Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Twenty CRM Model Context Protocol (MCP) AI Copilot Drawer */}
      <AiCopilotDrawer
        isOpen={showAiDrawer}
        onClose={() => setShowAiDrawer(false)}
        companies={companies}
        deals={deals}
        onEnrichCompany={(companyId, enriched) => {
          setCompanies((prev) =>
            prev.map((c) =>
              c.id === companyId
                ? {
                    ...c,
                    employees: enriched.estimatedEmployees || c.employees,
                    notes: `${c.notes}\n\n[AI Enrichment]: Tech Stack: ${(enriched.techStack || []).join(', ')}. Fit Score: ${enriched.strategicFitScore || 92}/100. ${enriched.elevatorPitch || ''}`,
                  }
                : c
            )
          );
        }}
      />
    </section>
  );
}
