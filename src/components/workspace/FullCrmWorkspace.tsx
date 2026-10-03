import { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  DollarSign, 
  Users, 
  CheckSquare, 
  Workflow, 
  Database, 
  Search, 
  Sparkles, 
  Plus, 
  SlidersHorizontal, 
  Columns, 
  Download, 
  ArrowUpDown, 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  ExternalLink, 
  X, 
  CheckCircle2, 
  Code2, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Star, 
  RefreshCw,
  Sun, 
  Moon, 
  LayoutGrid, 
  List, 
  Send, 
  ShieldCheck, 
  Activity,
  Layers,
  FileText,
  UserCheck,
  Globe,
  Bot
} from 'lucide-react';
import { Company, Deal, Person, Task, DealStage } from '../../types/crm';
import { AiCopilotDrawer } from '../AiCopilotDrawer';
import { ExportToAiCoderModal } from '../export/ExportToAiCoderModal';

interface FullCrmWorkspaceProps {
  onBackToWebsite: () => void;
  onSignOut: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenCommand: () => void;
}

export function FullCrmWorkspace({
  onBackToWebsite,
  onSignOut,
  isDark,
  onToggleTheme,
  onOpenCommand,
}: FullCrmWorkspaceProps) {
  // Navigation & active object
  const [activeTab, setActiveTab] = useState<'companies' | 'opportunities' | 'people' | 'tasks' | 'workflows' | 'schema'>('companies');
  const [dealsLayout, setDealsLayout] = useState<'kanban' | 'table'>('kanban');

  // Workspace & User state
  const [workspace, setWorkspace] = useState({ id: 'ws-demo', name: 'Acme Systems' });
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [editingWorkspaceName, setEditingWorkspaceName] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showExportAiModal, setShowExportAiModal] = useState(false);

  // Entities state loaded from backend API
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [customObjects, setCustomObjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper for authenticated requests
  const getAuthHeaders = () => {
    const token = localStorage.getItem('nexus_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [sortField, setSortField] = useState<'name' | 'arr'>('arr');
  const [sortAsc, setSortAsc] = useState(false);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showColumnsPopover, setShowColumnsPopover] = useState(false);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    domain: true,
    tier: true,
    arr: true,
    contact: true,
    status: true,
    owner: true,
  });

  // Slide-over drawer state
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'activity' | 'notes' | 'graphql'>('overview');
  const [timelineActivities, setTimelineActivities] = useState<any[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [isDraftingEmail, setIsDraftingEmail] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);

  // AI Copilot state
  const [showAiDrawer, setShowAiDrawer] = useState(false);

  // New Record Modals
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompDomain, setNewCompDomain] = useState('');
  const [newCompTier, setNewCompTier] = useState<'Enterprise' | 'Mid-Market' | 'Growth' | 'Seed'>('Growth');
  const [newCompArr, setNewCompArr] = useState('50000');

  // Current logged in user
  const [currentUser, setCurrentUser] = useState({
    name: 'Alex Vance',
    email: 'alex@acme.corp',
    role: 'Admin / VP Sales',
    workspace: 'Acme Systems (Nexus Cloud)',
    workspaceName: 'Acme Systems',
  });

  // Fetch initial data from backend API
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const headers = getAuthHeaders();
      const [compRes, dealRes, peoRes, tskRes, wfRes, coRes, meRes] = await Promise.all([
        fetch('/api/companies', { headers }).then((r) => r.json()).catch(() => ({ companies: [] })),
        fetch('/api/opportunities', { headers }).then((r) => r.json()).catch(() => ({ opportunities: [] })),
        fetch('/api/people', { headers }).then((r) => r.json()).catch(() => ({ people: [] })),
        fetch('/api/tasks', { headers }).then((r) => r.json()).catch(() => ({ tasks: [] })),
        fetch('/api/workflows', { headers }).then((r) => r.json()).catch(() => ({ workflows: [] })),
        fetch('/api/custom-objects', { headers }).then((r) => r.json()).catch(() => ({ customObjects: [] })),
        fetch('/api/auth/me', { headers }).then((r) => r.json()).catch(() => ({ user: null })),
      ]);

      if (compRes.companies) setCompanies(compRes.companies);
      if (dealRes.opportunities) setDeals(dealRes.opportunities);
      if (peoRes.people) setPeople(peoRes.people);
      if (tskRes.tasks) setTasks(tskRes.tasks);
      if (wfRes.workflows) setWorkflows(wfRes.workflows);
      if (coRes.customObjects) setCustomObjects(coRes.customObjects);
      if (meRes.user) setCurrentUser(meRes.user);
      if (meRes.workspace) setWorkspace(meRes.workspace);
    } catch (err) {
      console.error('Error fetching CRM data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Fetch activities for selected company
  useEffect(() => {
    if (selectedCompany) {
      fetch(`/api/activities?companyId=${selectedCompany.id}`, { headers: getAuthHeaders() })
        .then((r) => r.json())
        .then((data) => {
          if (data.activities) setTimelineActivities(data.activities);
        })
        .catch(() => {});
    }
  }, [selectedCompany]);

  // Rename workspace handler
  const handleRenameWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkspaceName.trim()) return;
    try {
      const res = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: editingWorkspaceName.trim() }),
      });
      const data = await res.json();
      if (data.workspace) {
        setWorkspace(data.workspace);
        setShowWorkspaceModal(false);
      }
    } catch (err) {
      console.error('Error renaming workspace:', err);
    }
  };

  // Sign out handler
  const handleSignOut = () => {
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('nexus_workspace');
    onSignOut();
  };

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    return companies
      .filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.primaryContact || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
        return matchesSearch && matchesTier;
      })
      .sort((a, b) => {
        if (sortField === 'name') {
          return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        return sortAsc ? a.arr - b.arr : b.arr - a.arr;
      });
  }, [companies, searchQuery, tierFilter, sortField, sortAsc]);

  // Advance deal stage (with real backend PATCH)
  const advanceDealStage = async (dealId: string) => {
    const stageOrder: DealStage[] = ['prospect', 'qualified', 'proposal', 'negotiation', 'won'];
    const current = deals.find((d) => d.id === dealId);
    if (!current) return;

    const currentIndex = stageOrder.indexOf(current.stage);
    const nextStage = currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1] : stageOrder[0];

    // Optimistic UI update
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: nextStage } : d)));

    try {
      await fetch(`/api/opportunities/${dealId}/stage`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ stage: nextStage }),
      });
      // Refresh tasks if onboarding was triggered
      const tRes = await fetch('/api/tasks', { headers: getAuthHeaders() }).then((r) => r.json());
      if (tRes.tasks) setTasks(tRes.tasks);
    } catch (err) {
      console.error('Error advancing deal stage:', err);
    }
  };

  // Toggle Task Completion
  const toggleTask = async (taskId: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)));
    try {
      await fetch(`/api/tasks/${taskId}/toggle`, { method: 'PATCH', headers: getAuthHeaders() });
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  // Toggle Workflow Automation
  const toggleWorkflow = async (wfId: string) => {
    setWorkflows((prev) => prev.map((w) => (w.id === wfId ? { ...w, enabled: !w.enabled } : w)));
    try {
      await fetch(`/api/workflows/${wfId}/toggle`, { method: 'PATCH', headers: getAuthHeaders() });
    } catch (err) {
      console.error('Error toggling workflow:', err);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedCompanyIds.length === 0) return;
    const toDelete = [...selectedCompanyIds];
    setCompanies((prev) => prev.filter((c) => !toDelete.includes(c.id)));
    setSelectedCompanyIds([]);

    try {
      await fetch('/api/companies/bulk-delete', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: toDelete }),
      });
    } catch (err) {
      console.error('Error deleting companies:', err);
    }
  };

  // Add Company Handler
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim()) return;

    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newCompName.trim(),
          domain: newCompDomain.trim() || `${newCompName.toLowerCase().replace(/\s+/g, '')}.com`,
          tier: newCompTier,
          arr: parseInt(newCompArr, 10) || 50000,
          primaryContact: 'Lead Executive',
        }),
      });
      const data = await res.json();
      if (data.company) {
        setCompanies([data.company, ...companies]);
        setSelectedCompany(data.company);
        setShowAddCompanyModal(false);
        setNewCompName('');
        setNewCompDomain('');
      }
    } catch (err) {
      console.error('Error creating company:', err);
    }
  };

  // Trigger Gemini AI Company Enrichment
  const handleEnrichCompany = async (comp: Company) => {
    setIsEnriching(true);
    try {
      const res = await fetch('/api/ai/enrich-company', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ domain: comp.domain, companyName: comp.name }),
      });
      const data = await res.json();
      if (data.enriched) {
        const enriched = data.enriched;
        const updatedComp = {
          ...comp,
          employees: enriched.estimatedEmployees || comp.employees,
          techStack: enriched.techStack || comp.techStack,
          notes: `${comp.notes}\n\n[✨ AI Enrichment]: ${enriched.elevatorPitch || ''} (Fit Score: ${enriched.strategicFitScore || 92}/100)`,
        };
        setSelectedCompany(updatedComp);
        setCompanies((prev) => prev.map((c) => (c.id === comp.id ? updatedComp : c)));
      }
    } catch (err) {
      console.error('Enrichment error:', err);
    } finally {
      setIsEnriching(false);
    }
  };

  // Trigger Gemini AI Sales Email Drafting
  const handleDraftEmail = async () => {
    if (!selectedCompany) return;
    setIsDraftingEmail(true);
    try {
      const res = await fetch('/api/ai/draft-email', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          companyName: selectedCompany.name,
          recipientName: selectedCompany.primaryContact,
          context: selectedCompany.notes,
          goal: 'Confirm procurement sign-off and schedule onboarding technical spike',
        }),
      });
      const data = await res.json();
      setGeneratedEmail(data);
    } catch (err) {
      console.error('Draft email error:', err);
    } finally {
      setIsDraftingEmail(false);
    }
  };

  // Add internal note to timeline
  const handleAddNote = async () => {
    if (!newNoteText.trim() || !selectedCompany) return;
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          companyId: selectedCompany.id,
          type: 'note',
          title: 'Internal Note',
          description: newNoteText.trim(),
        }),
      });
      const data = await res.json();
      if (data.activity) {
        setTimelineActivities([data.activity, ...timelineActivities]);
        setNewNoteText('');
      }
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };

  const KANBAN_STAGES: { id: DealStage; label: string }[] = [
    { id: 'prospect', label: 'Prospecting' },
    { id: 'qualified', label: 'Qualified' },
    { id: 'proposal', label: 'Proposal' },
    { id: 'negotiation', label: 'Negotiation' },
    { id: 'won', label: 'Closed Won' },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#090a0d] text-[#ededed]' : 'bg-[#faf9f6] text-[#141518]'}`}>
      {/* 1. TOP GLOBAL WORKSPACE HEADER */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#090a0d]/90 backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-white font-mono text-xs font-black shadow-sm">
              N
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white truncate max-w-[160px] sm:max-w-[220px]">
                {workspace.name || 'Custom Workspace'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingWorkspaceName(workspace.name);
                  setShowWorkspaceModal(true);
                }}
                className="text-[10px] text-neutral-400 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-neutral-800 rounded px-1.5 py-0.5"
                title="Rename Workspace"
              >
                Settings
              </button>
            </div>
          </div>

          <span className="text-neutral-300 dark:text-neutral-700 hidden md:inline">/</span>

          {/* Object Navigation Bar */}
          <nav className="flex items-center gap-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('companies')}
              className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'companies'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-black font-bold shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Companies
            </button>
            <button
              onClick={() => setActiveTab('opportunities')}
              className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'opportunities'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-black font-bold shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setActiveTab('people')}
              className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer hidden md:inline-block ${
                activeTab === 'people'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-black font-bold shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              People
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer hidden md:inline-block ${
                activeTab === 'tasks'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-black font-bold shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('workflows')}
              className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer hidden lg:inline-block ${
                activeTab === 'workflows'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-black font-bold shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Workflows
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer hidden lg:inline-block ${
                activeTab === 'schema'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-black font-bold shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Schema
            </button>
          </nav>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Search trigger */}
          <button
            onClick={onOpenCommand}
            className="flex items-center gap-2 rounded-md border border-neutral-300 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.04] px-2.5 py-1.5 text-xs text-neutral-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="font-mono text-[9px] bg-neutral-200 dark:bg-white/10 px-1 py-0.5 rounded">⌘K</kbd>
          </button>

          {/* Twenty AI Copilot (MCP) */}
          <button
            onClick={() => setShowAiDrawer(true)}
            className="flex items-center gap-1.5 rounded-md border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-600 dark:text-purple-300 hover:bg-purple-500/20 transition-colors cursor-pointer shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-500 animate-pulse" />
            <span>Twenty AI</span>
            <span className="text-[9px] font-mono bg-purple-500/20 px-1 py-0.5 rounded">MCP</span>
          </button>

          {/* New Record Modal Trigger */}
          <button
            onClick={() => setShowAddCompanyModal(true)}
            className="flex items-center gap-1 rounded-md bg-neutral-950 dark:bg-white px-3 py-1.5 text-xs font-bold text-white dark:text-neutral-950 hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Record</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-md border border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white font-bold text-[10px]">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 hidden lg:inline max-w-[110px] truncate">
                {currentUser?.name || 'Account'}
              </span>
              <ChevronDown className="h-3 w-3 text-neutral-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121318] p-2 shadow-2xl z-50 animate-in fade-in text-xs">
                <div className="px-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                  <p className="font-bold text-neutral-900 dark:text-white truncate">{currentUser?.name}</p>
                  <p className="text-[11px] text-neutral-500 font-mono truncate">{currentUser?.email}</p>
                  <span className="inline-block mt-1 text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono px-1.5 py-0.5 rounded">
                    {workspace.name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    setEditingWorkspaceName(workspace.name);
                    setShowWorkspaceModal(true);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 cursor-pointer flex items-center justify-between"
                >
                  <span>Workspace Settings</span>
                  <SlidersHorizontal className="h-3 w-3 text-neutral-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onBackToWebsite();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 cursor-pointer flex items-center justify-between"
                >
                  <span>Visit Marketing Site</span>
                  <Globe className="h-3 w-3 text-neutral-400" />
                </button>

                <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    handleSignOut();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold cursor-pointer"
                >
                  Sign Out of Workspace
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. SUB-TOOLBAR (Search, Filter, Column Visibility, Export) */}
      <div className="border-b border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0c0d10] px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder={`Filter ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] py-1 pl-8 pr-3 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
            />
          </div>

          {activeTab === 'companies' && (
            <div className="relative">
              <button
                onClick={() => setShowFilterPopover(!showFilterPopover)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded border text-xs cursor-pointer ${
                  tierFilter !== 'all'
                    ? 'border-neutral-950 dark:border-white bg-neutral-100 dark:bg-white/10 text-neutral-950 dark:text-white font-bold'
                    : 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <span>Tier: {tierFilter === 'all' ? 'All' : tierFilter}</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {showFilterPopover && (
                <div className="absolute left-0 top-full mt-1 w-40 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#14151a] p-1.5 shadow-xl z-30">
                  {['all', 'Enterprise', 'Mid-Market', 'Growth', 'Seed'].map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTierFilter(t);
                        setShowFilterPopover(false);
                      }}
                      className="w-full text-left px-2 py-1 rounded text-xs hover:bg-neutral-100 dark:hover:bg-white/10"
                    >
                      {t === 'all' ? 'Show All Tiers' : t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'opportunities' && (
            <div className="flex items-center rounded-md border border-neutral-300 dark:border-neutral-700 p-0.5">
              <button
                onClick={() => setDealsLayout('kanban')}
                className={`p-1 rounded ${dealsLayout === 'kanban' ? 'bg-neutral-200 dark:bg-white/15' : ''}`}
                title="Kanban Board"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDealsLayout('table')}
                className={`p-1 rounded ${dealsLayout === 'table' ? 'bg-neutral-200 dark:bg-white/15' : ''}`}
                title="Table View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => setShowExportAiModal(true)}
            className="flex items-center gap-1.5 rounded border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 font-bold transition-colors cursor-pointer"
            title="Connect your AI Coder (Cursor, Windsurf, Claude) to this CRM via Model Context Protocol (MCP)"
          >
            <Bot className="h-3.5 w-3.5 text-purple-500" />
            <span className="hidden sm:inline">Connect to AI Coder</span>
            <span className="text-[9px] font-mono bg-purple-500/20 px-1 py-0.5 rounded">MCP</span>
          </button>

          <a
            href="/api/export/companies/csv"
            download
            className="flex items-center gap-1 rounded border border-neutral-300 dark:border-neutral-700 px-2.5 py-1 text-xs text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
            title="Download CSV export"
          >
            <Download className="h-3 w-3" />
            <span className="hidden sm:inline">Export CSV</span>
          </a>

          <button
            onClick={fetchAllData}
            className="p-1 rounded text-neutral-500 hover:text-black dark:hover:text-white"
            title="Sync Database"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bulk Delete Bar */}
      {selectedCompanyIds.length > 0 && activeTab === 'companies' && (
        <div className="bg-neutral-100 dark:bg-white/10 border-b border-neutral-300 dark:border-white/10 px-6 py-2 flex items-center justify-between text-xs animate-in fade-in">
          <span className="font-semibold text-neutral-900 dark:text-white">
            {selectedCompanyIds.length} {selectedCompanyIds.length === 1 ? 'company' : 'companies'} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10 cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              <span>Delete Selected</span>
            </button>
            <button
              onClick={() => setSelectedCompanyIds([])}
              className="text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE VIEW */}
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {/* VIEW 1: COMPANIES TABLE */}
        {activeTab === 'companies' && (
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d10] overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-white/[0.02] text-neutral-500 font-mono">
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={filteredCompanies.length > 0 && selectedCompanyIds.length === filteredCompanies.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedCompanyIds(filteredCompanies.map((c) => c.id));
                        else setSelectedCompanyIds([]);
                      }}
                    />
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-neutral-900 dark:text-white">Company</th>
                  <th className="py-2.5 px-4">Domain</th>
                  <th className="py-2.5 px-4">Tier</th>
                  <th className="py-2.5 px-4 text-right">ARR</th>
                  <th className="py-2.5 px-4">Primary Contact</th>
                  <th className="py-2.5 px-4">Health</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {filteredCompanies.map((company) => {
                  const isSelected = selectedCompanyIds.includes(company.id);
                  return (
                    <tr
                      key={company.id}
                      className={`group cursor-pointer transition-colors ${
                        isSelected ? 'bg-neutral-100 dark:bg-white/[0.06]' : 'hover:bg-neutral-50 dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedCompanyIds((prev) =>
                              prev.includes(company.id) ? prev.filter((id) => id !== company.id) : [...prev, company.id]
                            );
                          }}
                        />
                      </td>
                      <td onClick={() => setSelectedCompany(company)} className="py-3 px-4 font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-black dark:bg-white font-mono text-[10px] text-white dark:text-black font-bold">
                          {company.name.charAt(0)}
                        </div>
                        <span className="group-hover:underline">{company.name}</span>
                      </td>
                      <td onClick={() => setSelectedCompany(company)} className="py-3 px-4 font-mono text-neutral-500">
                        {company.domain}
                      </td>
                      <td onClick={() => setSelectedCompany(company)} className="py-3 px-4 text-neutral-700 dark:text-neutral-300">
                        {company.tier}
                      </td>
                      <td onClick={() => setSelectedCompany(company)} className="py-3 px-4 text-right font-mono font-bold text-neutral-950 dark:text-white">
                        ${company.arr.toLocaleString()}
                      </td>
                      <td onClick={() => setSelectedCompany(company)} className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                        {company.primaryContact}
                      </td>
                      <td onClick={() => setSelectedCompany(company)} className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded ${
                            (company.aiHealthScore || 80) >= 80
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          ⚡ {company.aiHealthScore || 85}%
                        </span>
                      </td>
                      <td onClick={() => setSelectedCompany(company)} className="py-3 px-4">
                        <span className="text-neutral-700 dark:text-neutral-300">{company.status}</span>
                      </td>
                      <td onClick={() => setSelectedCompany(company)} className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 group-hover:text-black dark:group-hover:text-white">
                          <span>Open</span>
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 2: PIPELINE KANBAN */}
        {activeTab === 'opportunities' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {KANBAN_STAGES.map((stage) => {
              const stageDeals = deals.filter((d) => d.stage === stage.id);
              const stageTotal = stageDeals.reduce((sum, d) => sum + d.amount, 0);

              return (
                <div
                  key={stage.id}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d10] p-3 flex flex-col shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-3">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span>{stage.label}</span>
                      <span className="text-[10px] font-mono text-neutral-400">({stageDeals.length})</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                      ${(stageTotal / 1000).toFixed(0)}k
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1">
                    {stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-white/[0.02] p-3 shadow-xs hover:border-neutral-400 dark:hover:border-neutral-700 transition-all group"
                      >
                        <div className="font-semibold text-xs text-neutral-900 dark:text-white group-hover:underline">
                          {deal.title}
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">{deal.companyName}</div>

                        <div className="mt-3 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800/80 pt-2 text-[11px]">
                          <span className="font-mono font-bold text-neutral-950 dark:text-white">
                            ${deal.amount.toLocaleString()}
                          </span>

                          <button
                            onClick={() => advanceDealStage(deal.id)}
                            className="flex items-center gap-0.5 text-[10px] font-bold text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white bg-white dark:bg-white/10 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 rounded cursor-pointer"
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

        {/* VIEW 3: PEOPLE / CONTACTS */}
        {activeTab === 'people' && (
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d10] overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-white/[0.02] text-neutral-500 font-mono">
                  <th className="py-2.5 px-4 font-semibold text-neutral-900 dark:text-white">Name</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Title</th>
                  <th className="py-2.5 px-4">Company</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {people.map((person) => (
                  <tr key={person.id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">{person.name}</td>
                    <td className="py-3 px-4 font-mono text-neutral-500">{person.email}</td>
                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300">{person.title}</td>
                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300">{person.companyName}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">{person.status}</span>
                    </td>
                    <td className="py-3 px-4 text-neutral-400 font-mono text-[11px]">{person.lastActivity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 4: TASKS */}
        {activeTab === 'tasks' && (
          <div className="max-w-4xl space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d10] p-4 text-xs hover:border-neutral-400 dark:hover:border-neutral-700 cursor-pointer shadow-sm transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                      task.completed
                        ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                        : 'border-neutral-400'
                    }`}
                  >
                    {task.completed && <CheckCircle2 className="h-3 w-3 stroke-[3]" />}
                  </button>
                  <div>
                    <p className={`font-semibold ${task.completed ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-white'}`}>
                      {task.title}
                    </p>
                    <span className="text-[11px] text-neutral-500">
                      {task.relatedEntity} · Assigned to {task.assignedTo}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px] text-neutral-500">
                  <span>Due {task.dueDate}</span>
                  <span className="capitalize border border-neutral-200 dark:border-neutral-800 px-1.5 py-0.5 rounded text-neutral-700 dark:text-neutral-300">
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VIEW 5: WORKFLOWS */}
        {activeTab === 'workflows' && (
          <div className="max-w-4xl space-y-4">
            <div className="mb-2">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Active Event Workflows</h2>
              <p className="text-xs text-neutral-500">Event-driven automations triggered on record changes.</p>
            </div>

            {workflows.map((wf) => (
              <div
                key={wf.id}
                className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d10] p-4 text-xs shadow-sm"
              >
                <div>
                  <h3 className="font-bold text-neutral-900 dark:text-white">{wf.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-500 font-mono">
                    <span>Trigger: {wf.trigger}</span>
                    <span>Action: {wf.action}</span>
                    <span>Fired {wf.executionCount} times</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleWorkflow(wf.id)}
                  className={`px-3 py-1 rounded-md font-bold text-xs cursor-pointer ${
                    wf.enabled
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-neutral-200 dark:bg-white/10 text-neutral-500'
                  }`}
                >
                  {wf.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* VIEW 6: SCHEMA & CUSTOM OBJECTS */}
        {activeTab === 'schema' && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Relational PostgreSQL Schema</h2>
              <p className="text-xs text-neutral-500">Native database objects and user-defined custom tables.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {customObjects.map((co) => (
                <div
                  key={co.id}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d10] p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-neutral-900 dark:text-white">{co.name}</h3>
                    <span className="font-mono text-[10px] text-neutral-400">table: {co.slug}</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">{co.description}</p>
                  <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                      Fields
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {co.fields.map((f: string) => (
                        <span key={f} className="font-mono text-[10px] bg-neutral-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-400">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 4. SLIDE-OVER RECORD DRAWER */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg border-l border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0e0f13] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{selectedCompany.name}</h3>
                <span className="text-xs font-mono text-neutral-500">{selectedCompany.domain}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEnrichCompany(selectedCompany)}
                  disabled={isEnriching}
                  className="flex items-center gap-1 rounded-md border border-purple-500/40 bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-600 dark:text-purple-300 hover:bg-purple-500/20 cursor-pointer disabled:opacity-50"
                  title="Enrich company with Gemini AI"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{isEnriching ? 'Enriching...' : 'AI Enrich'}</span>
                </button>

                <button
                  onClick={() => setSelectedCompany(null)}
                  className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-200 dark:border-white/10 px-6 text-xs font-medium">
              <button
                onClick={() => setDrawerTab('overview')}
                className={`py-2.5 px-3 border-b-2 ${
                  drawerTab === 'overview' ? 'border-black dark:border-white font-bold' : 'border-transparent text-neutral-400'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setDrawerTab('activity')}
                className={`py-2.5 px-3 border-b-2 ${
                  drawerTab === 'activity' ? 'border-black dark:border-white font-bold' : 'border-transparent text-neutral-400'
                }`}
              >
                Activity Timeline
              </button>
              <button
                onClick={() => setDrawerTab('notes')}
                className={`py-2.5 px-3 border-b-2 ${
                  drawerTab === 'notes' ? 'border-black dark:border-white font-bold' : 'border-transparent text-neutral-400'
                }`}
              >
                Internal Notes
              </button>
              <button
                onClick={() => setDrawerTab('graphql')}
                className={`py-2.5 px-3 border-b-2 ${
                  drawerTab === 'graphql' ? 'border-black dark:border-white font-bold' : 'border-transparent text-neutral-400'
                }`}
              >
                GraphQL
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {drawerTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-white/[0.02]">
                      <span className="text-[10px] text-neutral-400 uppercase font-bold">ARR</span>
                      <p className="text-base font-bold font-mono mt-0.5">${selectedCompany.arr.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-white/[0.02]">
                      <span className="text-[10px] text-neutral-400 uppercase font-bold">Employees</span>
                      <p className="text-base font-bold font-mono mt-0.5">{selectedCompany.employees || 45}</p>
                    </div>
                  </div>

                  {selectedCompany.techStack && (
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">
                        Detected Tech Stack
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCompany.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="font-mono text-[10px] bg-neutral-100 dark:bg-white/10 px-2 py-0.5 rounded text-neutral-800 dark:text-neutral-200"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">
                      Account Notes & AI Summary
                    </span>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed bg-neutral-50 dark:bg-white/[0.02] p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 whitespace-pre-wrap">
                      {selectedCompany.notes}
                    </p>
                  </div>

                  {/* AI Email Drafter Action */}
                  <div className="pt-2">
                    <button
                      onClick={handleDraftEmail}
                      disabled={isDraftingEmail}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-white/5 py-2 font-bold hover:bg-neutral-200 dark:hover:bg-white/10 cursor-pointer"
                    >
                      <Mail className="h-3.5 w-3.5 text-blue-500" />
                      <span>{isDraftingEmail ? 'Drafting with Gemini...' : 'Draft Sales Outreach Email with AI'}</span>
                    </button>

                    {generatedEmail && (
                      <div className="mt-3 p-3 rounded-lg border border-blue-500/30 bg-blue-500/[0.03] space-y-2">
                        <span className="font-bold text-neutral-900 dark:text-white">
                          Subject: {generatedEmail.subject}
                        </span>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                          {generatedEmail.body}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {drawerTab === 'activity' && (
                <div className="space-y-3">
                  {timelineActivities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-white/[0.02] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-900 dark:text-white">{act.title}</span>
                        <span className="text-[10px] font-mono text-neutral-400">{act.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-400">{act.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === 'notes' && (
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    placeholder="Write internal account note..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-3 text-xs focus:outline-none"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNoteText.trim()}
                    className="rounded-md bg-neutral-950 dark:bg-white px-3 py-1.5 font-bold text-white dark:text-neutral-950 cursor-pointer disabled:opacity-50"
                  >
                    Save Note
                  </button>
                </div>
              )}

              {drawerTab === 'graphql' && (
                <div className="space-y-2">
                  <span className="text-[11px] text-neutral-500">Live query representation for this record:</span>
                  <pre className="rounded-lg bg-neutral-900 text-neutral-200 p-3 font-mono text-[11px] overflow-x-auto">
                    <code>{`query GetCompany {
  company(id: "${selectedCompany.id}") {
    name
    domain
    tier
    arr
    employees
    status
    owner
  }
}`}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. ADD COMPANY MODAL */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#101116] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-4">Add New Account</h3>
            <form onSubmit={handleCreateCompany} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Cloud"
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2"
                />
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Domain</label>
                <input
                  type="text"
                  placeholder="acme.com"
                  value={newCompDomain}
                  onChange={(e) => setNewCompDomain(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Tier</label>
                  <select
                    value={newCompTier}
                    onChange={(e: any) => setNewCompTier(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2"
                  >
                    <option value="Enterprise">Enterprise</option>
                    <option value="Mid-Market">Mid-Market</option>
                    <option value="Growth">Growth</option>
                    <option value="Seed">Seed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">ARR ($)</label>
                  <input
                    type="number"
                    value={newCompArr}
                    onChange={(e) => setNewCompArr(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
                  className="px-3 py-1.5 text-neutral-500 hover:text-black dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-neutral-950 dark:bg-white px-4 py-1.5 font-bold text-white dark:text-neutral-950 cursor-pointer"
                >
                  Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5B. RENAME WORKSPACE MODAL */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#101116] p-6 shadow-2xl animate-in fade-in">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1">Workspace Settings</h3>
            <p className="text-xs text-neutral-500 mb-4">Customize the organization name for this private workspace.</p>
            <form onSubmit={handleRenameWorkspace} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={editingWorkspaceName}
                  onChange={(e) => setEditingWorkspaceName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowWorkspaceModal(false)}
                  className="px-3 py-1.5 text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-neutral-950 dark:bg-white px-4 py-1.5 font-bold text-white dark:text-neutral-950 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. TWENTY AI COPILOT DRAWER */}
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
                    notes: `${c.notes}\n\n[✨ AI Enrichment]: ${enriched.elevatorPitch || ''}`,
                  }
                : c
            )
          );
        }}
      />
      {/* 7. EXPORT TO AI CODER MODAL */}
      <ExportToAiCoderModal
        isOpen={showExportAiModal}
        onClose={() => setShowExportAiModal(false)}
        workspaceName={workspace.name}
      />
    </div>
  );
}
