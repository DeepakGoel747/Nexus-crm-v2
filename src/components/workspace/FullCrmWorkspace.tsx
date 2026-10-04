import { lazy, Suspense, useState, useEffect, useMemo } from 'react';
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
  Bot,
  Bell,
  Upload,
  Home,
  MessageCircle,
  Settings,
  MoreHorizontal,
  ChevronUp,
  CircleDot,
  CalendarDays,
  BarChart3,
  FileBarChart,
  BriefcaseBusiness
} from 'lucide-react';
import { Company, Deal, Person, Task, DealStage } from '../../types/crm';
import { AiCopilotDrawer } from '../AiCopilotDrawer';
import { ExportToAiCoderModal } from '../export/ExportToAiCoderModal';
import type { CrmMeeting } from './CalendarView';
import type { TrashRecord } from './TrashView';
import { SettingsPanel, type WorkspacePreferences } from './SettingsPanel';
import { WorkspaceAiPage } from './WorkspaceAiPage';

const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard').then((module) => ({ default: module.AnalyticsDashboard })));
const CalendarView = lazy(() => import('./CalendarView').then((module) => ({ default: module.CalendarView })));
const ReportsView = lazy(() => import('./ReportsView').then((module) => ({ default: module.ReportsView })));
const TrashView = lazy(() => import('./TrashView').then((module) => ({ default: module.TrashView })));
const CompanyCsvImport = lazy(() => import('./CompanyCsvImport').then((module) => ({ default: module.CompanyCsvImport })));

interface FullCrmWorkspaceProps {
  onBackToWebsite: () => void;
  onSignOut: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenCommand: () => void;
}

type WorkspaceTab = 'companies' | 'opportunities' | 'people' | 'tasks' | 'workflows' | 'schema' | 'analytics' | 'calendar' | 'reports' | 'trash' | 'notes' | 'settings' | 'ai';
type CompanyTier = 'Enterprise' | 'Mid-Market' | 'Growth' | 'Seed';
const WORKSPACE_TABS: WorkspaceTab[] = ['companies', 'opportunities', 'people', 'tasks', 'workflows', 'schema', 'analytics', 'calendar', 'reports', 'trash', 'notes'];
const PRIMARY_NAV_ITEMS = [
  { id: 'companies', label: 'Companies', icon: Building2, color: 'text-blue-600' },
  { id: 'people', label: 'People', icon: UserCheck, color: 'text-blue-600' },
  { id: 'opportunities', label: 'Opportunities', icon: CircleDot, color: 'text-red-500' },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, color: 'text-teal-600' },
  { id: 'notes', label: 'Notes', icon: FileText, color: 'text-teal-600' },
  { id: 'analytics', label: 'Dashboards', icon: BarChart3, color: 'text-neutral-500' },
] as const;
const SECONDARY_NAV_ITEMS = [
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'reports', label: 'Reports', icon: FileBarChart },
  { id: 'trash', label: 'Trash', icon: Trash2 },
  { id: 'schema', label: 'Data model', icon: Database },
] as const;

const formatDueDate = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
  return value;
};

interface WorkspaceNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export function FullCrmWorkspace({
  onBackToWebsite,
  onSignOut,
  isDark,
  onToggleTheme,
  onOpenCommand,
}: FullCrmWorkspaceProps) {
  // Navigation & active object
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => {
    const savedTab = localStorage.getItem('nexus_workspace_tab');
    return WORKSPACE_TABS.includes(savedTab as WorkspaceTab) ? savedTab as WorkspaceTab : 'companies';
  });
  const [isWorkflowNavOpen, setIsWorkflowNavOpen] = useState(true);
  const [visibleSidebarItems, setVisibleSidebarItems] = useState<string[]>(() => {
    try {
      const savedItems = JSON.parse(localStorage.getItem('nexus_sidebar_items') || 'null');
      return Array.isArray(savedItems) ? savedItems : ['companies', 'people', 'opportunities', 'tasks', 'notes', 'analytics', 'calendar', 'reports', 'trash', 'schema'];
    } catch {
      return ['companies', 'people', 'opportunities', 'tasks', 'notes', 'analytics', 'calendar', 'reports', 'trash', 'schema'];
    }
  });
  const [workflowSection, setWorkflowSection] = useState<'workflows' | 'runs' | 'versions'>('workflows');
  const [dealsLayout, setDealsLayout] = useState<'kanban' | 'table'>('kanban');

  // Workspace & User state
  const [workspace, setWorkspace] = useState<{
    id: string;
    name: string;
    companyName?: string;
    companyWebsite?: string;
    industry?: string;
    companySize?: string;
    country?: string;
  }>({ id: 'ws-demo', name: 'Acme Systems' });
  const [workspacePreferences, setWorkspacePreferences] = useState<WorkspacePreferences>({
    currency: 'USD',
    defaultCompanyTier: 'Growth',
    weekStartsOn: 'sunday',
    defaultCalendarView: 'month',
  });
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [editingWorkspaceName, setEditingWorkspaceName] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showExportAiModal, setShowExportAiModal] = useState(false);
  const [showCompanyImport, setShowCompanyImport] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Entities state loaded from backend API
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [customObjects, setCustomObjects] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<CrmMeeting[]>([]);
  const [trashRecords, setTrashRecords] = useState<TrashRecord[]>([]);
  const [notifications, setNotifications] = useState<WorkspaceNotification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
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
  const [newCompTier, setNewCompTier] = useState<CompanyTier>('Growth');
  const [newCompArr, setNewCompArr] = useState('50000');

  // New Person modal state
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonEmail, setNewPersonEmail] = useState('');
  const [newPersonTitle, setNewPersonTitle] = useState('');
  const [newPersonPhone, setNewPersonPhone] = useState('');
  const [newPersonStatus, setNewPersonStatus] = useState<Person['status']>('Lead');
  const [newPersonCompanyId, setNewPersonCompanyId] = useState('');

  // New Opportunity modal state
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealAmount, setNewDealAmount] = useState('50000');
  const [newDealCompanyId, setNewDealCompanyId] = useState('');
  const [newDealStage, setNewDealStage] = useState<DealStage>('prospect');
  const [newDealProbability, setNewDealProbability] = useState('20');
  const [newDealCloseDate, setNewDealCloseDate] = useState(() => {
    const target = new Date();
    target.setDate(target.getDate() + 30);
    return target.toISOString().slice(0, 10);
  });

  // New Task modal state
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');
  const [newTaskCompanyId, setNewTaskCompanyId] = useState('');

  // Current logged in user
  const [currentUser, setCurrentUser] = useState({
    id: 'usr-demo',
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
      const meResponse = await fetch('/api/auth/me', { headers });
      if (meResponse.status === 401) {
        handleSignOut();
        return;
      }
      if (!meResponse.ok) throw new Error('Unable to verify your workspace session.');
      const meRes = await meResponse.json();
      const [compRes, dealRes, peoRes, tskRes, wfRes, coRes, meetingRes, trashRes, notificationRes, activityRes] = await Promise.all([
        fetch('/api/companies', { headers }).then((r) => r.json()).catch(() => ({ companies: [] })),
        fetch('/api/opportunities', { headers }).then((r) => r.json()).catch(() => ({ opportunities: [] })),
        fetch('/api/people', { headers }).then((r) => r.json()).catch(() => ({ people: [] })),
        fetch('/api/tasks', { headers }).then((r) => r.json()).catch(() => ({ tasks: [] })),
        fetch('/api/workflows', { headers }).then((r) => r.json()).catch(() => ({ workflows: [] })),
        fetch('/api/custom-objects', { headers }).then((r) => r.json()).catch(() => ({ customObjects: [] })),
        fetch('/api/meetings', { headers }).then((r) => r.json()).catch(() => ({ meetings: [] })),
        fetch('/api/trash', { headers }).then((r) => r.json()).catch(() => ({ records: [] })),
        fetch('/api/notifications', { headers }).then((r) => r.json()).catch(() => ({ notifications: [], unreadCount: 0 })),
        fetch('/api/activities', { headers }).then((r) => r.json()).catch(() => ({ activities: [] })),
      ]);

      if (compRes.companies) setCompanies(compRes.companies);
      if (dealRes.opportunities) setDeals(dealRes.opportunities);
      if (peoRes.people) setPeople(peoRes.people);
      if (tskRes.tasks) setTasks(tskRes.tasks);
      if (wfRes.workflows) setWorkflows(wfRes.workflows);
      if (coRes.customObjects) setCustomObjects(coRes.customObjects);
      if (meetingRes.meetings) setMeetings(meetingRes.meetings);
      if (trashRes.records) setTrashRecords(trashRes.records);
      if (notificationRes.notifications) setNotifications(notificationRes.notifications);
      if (typeof notificationRes.unreadCount === 'number') setUnreadNotificationCount(notificationRes.unreadCount);
      if (activityRes.activities) setNotes(activityRes.activities.filter((activity: any) => activity.type === 'note'));
      if (meRes.user) setCurrentUser(meRes.user);
      if (meRes.workspace) {
        setWorkspace(meRes.workspace);
        const savedPreferences = meRes.workspace.settings || {};
        const savedCurrency = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'].includes(savedPreferences.currency)
          ? savedPreferences.currency
          : null;
        const savedTier = ['Enterprise', 'Mid-Market', 'Growth', 'Seed'].includes(savedPreferences.defaultCompanyTier)
          ? savedPreferences.defaultCompanyTier
          : null;
        const savedWeekStart = ['sunday', 'monday'].includes(savedPreferences.weekStartsOn)
          ? savedPreferences.weekStartsOn
          : null;
        const savedCalendarView = ['month', 'week'].includes(savedPreferences.defaultCalendarView)
          ? savedPreferences.defaultCalendarView
          : null;
        setWorkspacePreferences((current) => ({
          ...current,
          currency: savedCurrency || current.currency,
          defaultCompanyTier: savedTier || current.defaultCompanyTier,
          weekStartsOn: savedWeekStart || current.weekStartsOn,
          defaultCalendarView: savedCalendarView || current.defaultCalendarView,
        }));
        if (savedTier) setNewCompTier(savedTier);
        if (Array.isArray(meRes.workspace.settings?.sidebarItems)) {
          setVisibleSidebarItems(meRes.workspace.settings.sidebarItems);
          localStorage.setItem('nexus_sidebar_items', JSON.stringify(meRes.workspace.settings.sidebarItems));
        }
      }
    } catch (err) {
      console.error('Error fetching CRM data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    localStorage.setItem('nexus_workspace_tab', activeTab);
  }, [activeTab]);

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

  const handleToggleAppearance = () => {
    const appearance = isDark ? 'light' : 'dark';
    onToggleTheme();
    fetch('/api/workspace/settings', {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ settings: { appearance } }),
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save appearance preference.');
    }).catch((err: unknown) => {
      setWorkspaceError(err instanceof Error ? err.message : 'Unable to save appearance preference.');
    });
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
    setSelectedCompanyIds([]);

    try {
      const response = await fetch('/api/companies/bulk-delete', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: toDelete }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to move companies to Trash.');
      setCompanies((prev) => prev.filter((company) => !toDelete.includes(company.id)));
      await fetchAllData();
      setWorkspaceError(null);
    } catch (err) {
      console.error('Error deleting companies:', err);
      setWorkspaceError(err instanceof Error ? err.message : 'Unable to move companies to Trash.');
    }
  };

  const handleImportCompanies = async (rows: Record<string, string>[]) => {
    const response = await fetch('/api/import/companies', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rows }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Company import failed (${response.status}).`);
    if (Array.isArray(data.companies)) setCompanies((previous) => [...data.companies, ...previous]);
    if (data.importedCount) {
      try {
        await refreshNotifications();
      } catch (err) {
        setWorkspaceError(err instanceof Error ? `Import succeeded, but notifications could not be refreshed: ${err.message}` : 'Import succeeded, but notifications could not be refreshed.');
      }
    }
    return { imported: data.importedCount || 0, errors: data.errors || [] };
  };

  const handleCreateMeeting = async (meeting: Omit<CrmMeeting, 'id'>) => {
    const response = await fetch('/api/meetings', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(meeting),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Unable to schedule meeting (${response.status}).`);
    setMeetings((previous) => [data.meeting, ...previous]);
    try {
      await refreshNotifications();
    } catch (err) {
      setWorkspaceError(err instanceof Error ? `Meeting scheduled, but notifications could not be refreshed: ${err.message}` : 'Meeting scheduled, but notifications could not be refreshed.');
    }
  };

  const refreshTrash = async () => {
    const response = await fetch('/api/trash', { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load Trash.');
    setTrashRecords(data.records || []);
  };

  const restoreTrashRecord = async (id: string) => {
    const response = await fetch(`/api/trash/${id}/restore`, { method: 'POST', headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to restore record.');
    await Promise.all([fetchAllData(), refreshTrash()]);
  };

  const permanentlyDeleteTrashRecord = async (id: string) => {
    const response = await fetch(`/api/trash/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to permanently delete record.');
    await refreshTrash();
  };

  const refreshNotifications = async () => {
    const response = await fetch('/api/notifications', { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load notifications.');
    setNotifications(data.notifications || []);
    setUnreadNotificationCount(data.unreadCount || 0);
  };

  const markNotificationRead = async (id: string) => {
    const response = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH', headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to update notification.');
    setNotifications((previous) => previous.map((notification) => notification.id === id ? { ...notification, read: true } : notification));
    setUnreadNotificationCount((count) => Math.max(0, count - 1));
  };

  const markAllNotificationsRead = async () => {
    const response = await fetch('/api/notifications/read-all', { method: 'PATCH', headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to update notifications.');
    setNotifications((previous) => previous.map((notification) => ({ ...notification, read: true })));
    setUnreadNotificationCount(0);
  };

  // Authenticated CSV export — a plain <a href> cannot send the Bearer token,
  // so the download goes through fetch -> Blob -> object URL.
  const handleExportCompaniesCsv = async () => {
    try {
      const response = await fetch('/api/export/companies/csv', { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('CSV export failed. Sign in and try again.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${workspace.name.toLowerCase().replace(/\s+/g, '_')}_companies.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setWorkspaceError(null);
    } catch (err) {
      setWorkspaceError(err instanceof Error ? err.message : 'CSV export failed.');
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

  // Add Person Handler (Twenty-style "New person")
  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    const company = companies.find((c) => c.id === newPersonCompanyId);
    if (!newPersonName.trim() || !company) return;
    try {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newPersonName.trim(),
          email: newPersonEmail.trim(),
          title: newPersonTitle.trim(),
          phone: newPersonPhone.trim(),
          status: newPersonStatus,
          companyId: company.id,
          companyName: company.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to create contact.');
      setPeople((previous) => [data.person, ...previous]);
      setShowAddPersonModal(false);
      setNewPersonName('');
      setNewPersonEmail('');
      setNewPersonTitle('');
      setNewPersonPhone('');
      setNewPersonStatus('Lead');
      setNewPersonCompanyId('');
      setWorkspaceError(null);
    } catch (err) {
      console.error('Error creating person:', err);
      setWorkspaceError(err instanceof Error ? err.message : 'Unable to create contact.');
    }
  };

  // Add Opportunity Handler (Twenty-style "New opportunity")
  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    const company = companies.find((c) => c.id === newDealCompanyId);
    if (!newDealTitle.trim() || !company) return;
    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: newDealTitle.trim(),
          companyId: company.id,
          companyName: company.name,
          amount: parseInt(newDealAmount, 10) || 50000,
          stage: newDealStage,
          probability: parseInt(newDealProbability, 10) || 20,
          closeDate: newDealCloseDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to create opportunity.');
      setDeals((previous) => [data.deal, ...previous]);
      setShowAddDealModal(false);
      setNewDealTitle('');
      setNewDealAmount('50000');
      setNewDealCompanyId('');
      setNewDealStage('prospect');
      setNewDealProbability('20');
      setWorkspaceError(null);
    } catch (err) {
      console.error('Error creating opportunity:', err);
      setWorkspaceError(err instanceof Error ? err.message : 'Unable to create opportunity.');
    }
  };

  // Add Task Handler (Twenty-style "New task")
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const company = companies.find((c) => c.id === newTaskCompanyId);
    if (!newTaskTitle.trim()) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          dueDate: newTaskDueDate,
          priority: newTaskPriority,
          assignedTo: newTaskAssignedTo.trim() || currentUser.name,
          relatedEntity: company ? company.name : 'General',
          entityId: company ? company.id : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to create task.');
      setTasks((previous) => [data.task, ...previous]);
      setShowAddTaskModal(false);
      setNewTaskTitle('');
      setNewTaskDueDate('');
      setNewTaskPriority('medium');
      setNewTaskAssignedTo('');
      setNewTaskCompanyId('');
      setWorkspaceError(null);
    } catch (err) {
      console.error('Error creating task:', err);
      setWorkspaceError(err instanceof Error ? err.message : 'Unable to create task.');
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
      if (!res.ok) throw new Error(data.error || `AI enrichment failed (${res.status}).`);
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
      setWorkspaceError(err instanceof Error ? err.message : 'AI enrichment failed.');
    } finally {
      setIsEnriching(false);
    }
  };

  // Trigger Gemini AI Sales Email Drafting
  const handleDraftEmail = async () => {
    if (!selectedCompany) return;
    setGeneratedEmail(null);
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
      if (!res.ok || !data.subject || !data.body) {
        throw new Error(data.error || 'AI email drafting returned no content.');
      }
      setGeneratedEmail({ subject: data.subject, body: data.body });
      setWorkspaceError(null);
    } catch (err) {
      console.error('Draft email error:', err);
      setWorkspaceError(err instanceof Error ? err.message : 'AI email drafting failed.');
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
        setNotes((previous) => [data.activity, ...previous]);
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
  const activeTitle: Record<WorkspaceTab, string> = {
    ai: 'AI',
    companies: 'Companies',
    opportunities: 'Opportunities',
    people: 'People',
    tasks: 'Tasks',
    workflows: workflowSection === 'runs' ? 'Workflow runs' : workflowSection === 'versions' ? 'Workflow versions' : 'Workflows',
    schema: 'Data model',
    analytics: 'Dashboards',
    calendar: 'Calendar',
    reports: 'Reports',
    trash: 'Trash',
    notes: 'Notes',
    settings: 'Settings',
  };
  const createButtonLabel =
    activeTab === 'people' ? 'New Person' :
    activeTab === 'opportunities' ? 'New Opportunity' :
    activeTab === 'tasks' ? 'New Task' : 'Create';
  const activeRecordCount: Partial<Record<WorkspaceTab, number>> = {
    companies: companies.length,
    opportunities: deals.length,
    people: people.length,
    tasks: tasks.length,
    workflows: workflows.length,
    notes: notes.length,
  };

  return (
    <div className={`flex min-h-screen min-w-0 ${isDark ? 'dark bg-[#090a0d] text-[#ededed]' : 'bg-white text-[#141518]'}`}>
      <aside className="z-40 flex w-[220px] shrink-0 flex-col border-r border-neutral-200 bg-[#fbfbfc] dark:border-neutral-800 dark:bg-[#101115] max-md:w-[58px]">
        <div className="flex h-12 items-center justify-between border-b border-neutral-200 px-3 dark:border-neutral-800">
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex min-w-0 items-center gap-2 text-left">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-violet-600 text-[10px] font-bold text-white">{currentUser?.name?.charAt(0) || 'D'}</span>
            <span className="truncate text-xs font-semibold max-md:hidden">{currentUser?.name || workspace.name}</span>
            <ChevronDown className="h-3 w-3 text-neutral-400 max-md:hidden" />
          </button>
          <button type="button" onClick={onOpenCommand} title="Search" className="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/10"><Search className="h-3.5 w-3.5" /></button>
        </div>
        <div className="border-b border-neutral-200 p-2 dark:border-neutral-800">
          <button onClick={() => setActiveTab('analytics')} className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium ${activeTab === 'analytics' ? 'bg-neutral-200/70 dark:bg-white/10' : 'hover:bg-neutral-100 dark:hover:bg-white/[0.06]'}`}>
            <Home className="h-3.5 w-3.5" /><span className="max-md:hidden">Home</span>
          </button>
          <button onClick={() => setActiveTab('ai')} className={`mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium ${activeTab === 'ai' ? 'bg-neutral-200/70 text-neutral-900 dark:bg-white/10 dark:text-white' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/[0.06]'}`}>
            <Sparkles className="h-3.5 w-3.5 text-violet-500" /><span className="max-md:hidden">AI</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium ${activeTab === 'settings' ? 'bg-neutral-200/70 dark:bg-white/10' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/[0.06]'}`}>
            <Settings className="h-3.5 w-3.5" /><span className="max-md:hidden">Settings</span>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <p className="mb-2 px-2 text-[10px] font-medium text-neutral-400 max-md:hidden">Workspace</p>
          <div className="space-y-0.5">
            {PRIMARY_NAV_ITEMS.filter(({ id }) => visibleSidebarItems.includes(id)).map(({ id, label, icon: Icon, color }) => (
              <button key={id} onClick={() => setActiveTab(id)} className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${activeTab === id ? 'bg-[#eceef1] font-semibold text-neutral-900 dark:bg-white/10 dark:text-white' : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/[0.06]'}`}>
                <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} /><span className="max-md:hidden">{label}</span>
              </button>
            ))}
            <div>
              <button onClick={() => { setIsWorkflowNavOpen(!isWorkflowNavOpen); setActiveTab('workflows'); }} className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${activeTab === 'workflows' ? 'bg-[#eceef1] font-semibold text-neutral-900 dark:bg-white/10 dark:text-white' : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/[0.06]'}`}>
                <Workflow className="h-3.5 w-3.5 shrink-0 text-orange-500" /><span className="flex-1 text-left max-md:hidden">Workflows</span>{isWorkflowNavOpen ? <ChevronDown className="h-3 w-3 text-neutral-400 max-md:hidden" /> : <ChevronRight className="h-3 w-3 text-neutral-400 max-md:hidden" />}
              </button>
              {isWorkflowNavOpen && <div className="ml-3 border-l border-neutral-300 py-0.5 pl-2 dark:border-neutral-700 max-md:hidden">
                {[
                  { label: 'Workflows', section: 'workflows' as const },
                  { label: 'Workflow Runs', section: 'runs' as const },
                  { label: 'Workflow Versions', section: 'versions' as const },
                ].map(({ label, section }) => (
                  <button key={label} onClick={() => { setWorkflowSection(section); setActiveTab('workflows'); }} className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ${activeTab === 'workflows' && workflowSection === section ? 'bg-[#eceef1] text-neutral-900 dark:bg-white/10 dark:text-white' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/[0.06]'}`}>
                    <Workflow className="h-3 w-3" /><span>{label}</span>
                  </button>
                ))}
              </div>}
            </div>
            <button onClick={() => setActiveTab('reports')} className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/[0.06] ${activeTab === 'reports' ? 'bg-[#eceef1] font-semibold dark:bg-white/10' : ''}`}>
              <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0 text-blue-600" /><span className="max-md:hidden">Projects</span>
            </button>
          </div>
          <div className="my-3 border-t border-neutral-200 dark:border-neutral-800" />
          <p className="mb-2 px-2 text-[10px] font-medium text-neutral-400 max-md:hidden">More</p>
          <div className="space-y-0.5">
            {SECONDARY_NAV_ITEMS.filter(({ id }) => visibleSidebarItems.includes(id)).map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { setActiveTab(id); if (id === 'trash') refreshTrash().catch((err) => setWorkspaceError(err instanceof Error ? err.message : 'Unable to load Trash.')); }} className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ${activeTab === id ? 'bg-[#eceef1] font-semibold text-neutral-900 dark:bg-white/10 dark:text-white' : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/[0.06]'}`}>
                <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-500" /><span className="max-md:hidden">{label}</span>
              </button>
            ))}
          </div>
        </nav>
        <button onClick={onBackToWebsite} className="flex items-center gap-2 border-t border-neutral-200 px-4 py-3 text-left text-[11px] text-neutral-500 hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-white/[0.06] max-md:justify-center max-md:px-0" title="Visit marketing site">
          <Globe className="h-3.5 w-3.5" /><span className="max-md:hidden">Visit website</span>
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
      {/* Workspace page header */}
      <header className="sticky top-0 z-30 flex min-h-12 flex-wrap items-center justify-between gap-y-2 border-b border-neutral-200 bg-white/95 px-3 py-2 dark:border-neutral-800 dark:bg-[#090a0d]/95 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-sm font-semibold">{activeTitle[activeTab]}</h1>
          {activeRecordCount[activeTab] !== undefined && <span className="text-xs text-neutral-400">· {activeRecordCount[activeTab]}</span>}
        </div>

        {/* Header Right Actions */}
        <div className={`ml-auto flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 ${activeTab === 'ai' || activeTab === 'settings' ? 'hidden' : ''}`}>
          <div className="relative">
            <button
              type="button"
              aria-label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread` : ''}`}
              onClick={() => {
                const opening = !showNotifications;
                setShowNotifications(opening);
                if (opening) refreshNotifications().catch((err) => setWorkspaceError(err instanceof Error ? err.message : 'Unable to load notifications.'));
              }}
              className="relative rounded-md border border-neutral-300 p-1.5 text-neutral-600 hover:text-black dark:border-white/10 dark:text-neutral-400 dark:hover:text-white"
            >
              <Bell className="h-3.5 w-3.5" />
              {unreadNotificationCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</span>}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full z-50 mt-2 w-[min(24rem,90vw)] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-[#14151a]">
                <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                  <div><h2 className="text-xs font-bold">Notifications</h2><p className="mt-0.5 text-[10px] text-neutral-500">{unreadNotificationCount} unread</p></div>
                  <button onClick={() => markAllNotificationsRead().catch((err) => setWorkspaceError(err instanceof Error ? err.message : 'Unable to update notifications.'))} disabled={!unreadNotificationCount} className="text-[10px] font-semibold text-blue-600 disabled:opacity-40 dark:text-blue-400">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-6 text-center text-xs text-neutral-500">No notifications yet.</p>
                  ) : notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => { if (!notification.read) markNotificationRead(notification.id).catch((err) => setWorkspaceError(err instanceof Error ? err.message : 'Unable to update notification.')); }}
                      className={`block w-full border-b border-neutral-100 px-4 py-3 text-left last:border-0 dark:border-neutral-800 ${notification.read ? '' : 'bg-blue-50/70 dark:bg-blue-500/[0.06]'}`}
                    >
                      <span className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">{notification.title}</span>{!notification.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />}</span>
                      <span className="mt-1 block text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">{notification.message}</span>
                      <span className="mt-1 block text-[9px] text-neutral-400">{new Date(notification.createdAt).toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

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
            <span className="hidden sm:inline">Twenty AI</span>
            <span className="hidden rounded bg-purple-500/20 px-1 py-0.5 font-mono text-[9px] sm:inline">MCP</span>
          </button>

          {/* New Record Modal Trigger — context-aware like Twenty's "+ New" */}
          <button
            onClick={() => {
              if (activeTab === 'people') setShowAddPersonModal(true);
              else if (activeTab === 'opportunities') setShowAddDealModal(true);
              else if (activeTab === 'tasks') setShowAddTaskModal(true);
              else setShowAddCompanyModal(true);
            }}
            className="flex items-center gap-1 rounded-md bg-[#4263eb] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#364fc7] transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{createButtonLabel}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={handleToggleAppearance}
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

      {workspaceError && (
        <div role="alert" className="flex items-center justify-between border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          <span>{workspaceError}</span>
          <button onClick={() => setWorkspaceError(null)} aria-label="Dismiss error"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* 2. SUB-TOOLBAR (Search, Filter, Column Visibility, Export) */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-2.5 text-xs dark:border-neutral-800 dark:bg-[#0c0d10] sm:px-5 ${activeTab === 'settings' || activeTab === 'ai' ? 'hidden' : ''}`}>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
          <button className="flex shrink-0 items-center gap-1.5 rounded px-1.5 py-1 font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/[0.06]">
            <LayoutGrid className="h-3.5 w-3.5 text-neutral-500" />
            <span>All {activeTitle[activeTab]}</span>
            {activeRecordCount[activeTab] !== undefined && <span className="text-neutral-400">· {activeRecordCount[activeTab]}</span>}
            <ChevronDown className="h-3 w-3 text-neutral-400" />
          </button>
          <div className="relative min-w-[120px] w-full max-w-sm flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder={`Search ${activeTitle[activeTab].toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-neutral-200 bg-white py-1.5 pl-8 pr-3 text-xs text-neutral-900 placeholder-neutral-400 focus:border-blue-400 focus:outline-none dark:border-neutral-700 dark:bg-white/[0.04] dark:text-white"
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
                <span>Filter{tierFilter !== 'all' ? ` · ${tierFilter}` : ''}</span>
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

        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => { setSortField((field) => field === 'arr' ? 'name' : 'arr'); setSortAsc(false); }}
            className="hidden items-center gap-1 rounded px-2 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/[0.06] sm:flex"
          >
            <ArrowUpDown className="h-3 w-3" /> Sort
          </button>
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setShowColumnsPopover(!showColumnsPopover)}
              className="flex items-center gap-1 rounded px-2 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/[0.06]"
            >
              <MoreHorizontal className="h-3.5 w-3.5" /> Options
            </button>
            {showColumnsPopover && activeTab === 'companies' && (
              <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-lg border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-700 dark:bg-[#14151a]">
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase text-neutral-400">Visible columns</p>
                {([
                  ['domain', 'Domain'],
                  ['tier', 'Tier'],
                  ['arr', 'ARR'],
                  ['contact', 'Primary contact'],
                  ['status', 'Status'],
                  ['owner', 'Owner'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-neutral-100 dark:hover:bg-white/[0.06]">
                    <input type="checkbox" checked={visibleColumns[key]} onChange={(event) => setVisibleColumns((columns) => ({ ...columns, [key]: event.target.checked }))} />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>
          {activeTab === 'companies' && (
            <button
              type="button"
              onClick={() => setShowCompanyImport(true)}
              className="flex items-center gap-1 rounded border border-neutral-300 px-2.5 py-1 text-xs text-neutral-700 hover:text-black dark:border-neutral-700 dark:text-neutral-300 dark:hover:text-white"
            >
              <Upload className="h-3 w-3" />
              <span>Import CSV</span>
            </button>
          )}
          {activeTab === 'people' && (
            <button
              type="button"
              onClick={() => setShowAddPersonModal(true)}
              className="flex items-center gap-1 rounded border border-neutral-300 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:text-black dark:border-neutral-700 dark:text-neutral-300 dark:hover:text-white cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              <span>New Person</span>
            </button>
          )}
          {activeTab === 'opportunities' && (
            <button
              type="button"
              onClick={() => setShowAddDealModal(true)}
              className="flex items-center gap-1 rounded border border-neutral-300 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:text-black dark:border-neutral-700 dark:text-neutral-300 dark:hover:text-white cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              <span>New Opportunity</span>
            </button>
          )}
          {activeTab === 'tasks' && (
            <button
              type="button"
              onClick={() => setShowAddTaskModal(true)}
              className="flex items-center gap-1 rounded border border-neutral-300 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:text-black dark:border-neutral-700 dark:text-neutral-300 dark:hover:text-white cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              <span>New Task</span>
            </button>
          )}
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

          <button
            type="button"
            onClick={handleExportCompaniesCsv}
            className="flex items-center gap-1 rounded border border-neutral-300 dark:border-neutral-700 px-2.5 py-1 text-xs text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            title="Download CSV export"
          >
            <Download className="h-3 w-3" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

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
      <main className="flex-1 overflow-auto bg-white p-4 sm:p-5 dark:bg-[#090a0d]">
        {activeTab === 'ai' && (
          <WorkspaceAiPage
            isDark={isDark}
            onCreateRecord={() => {
              setActiveTab('companies');
              setShowAddCompanyModal(true);
            }}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsPanel
            isDark={isDark}
            user={currentUser}
            workspace={workspace}
            customObjects={customObjects}
            recordCounts={{ companies: companies.length, people: people.length, opportunities: deals.length, tasks: tasks.length }}
            onCustomObjectAdded={(object) => setCustomObjects((current) => [object, ...current])}
            onUserChanged={(user) => setCurrentUser((current) => ({ ...current, ...user }))}
            onWorkspaceChanged={setWorkspace}
            onPreferencesSaved={(preferences) => {
              setWorkspacePreferences((current) => ({ ...current, ...preferences }));
              if (preferences.defaultCompanyTier) setNewCompTier(preferences.defaultCompanyTier);
            }}
            onAppearanceChanged={(dark) => {
              if (dark !== isDark) {
                localStorage.setItem('nexus_theme', dark ? 'dark' : 'light');
                onToggleTheme();
              }
            }}
            onNavigationItemsChanged={(items) => {
              setVisibleSidebarItems(items);
              localStorage.setItem('nexus_sidebar_items', JSON.stringify(items));
            }}
            onOpenMcpSetup={() => setShowExportAiModal(true)}
          />
        )}
        <Suspense fallback={<div className="py-8 text-center text-xs text-neutral-500">Loading workspace view…</div>}>
          {activeTab === 'analytics' && (
            <AnalyticsDashboard companies={companies} deals={deals} people={people} tasks={tasks} isDark={isDark} currencyCode={workspacePreferences.currency} onAskAI={() => setShowAiDrawer(true)} />
          )}

          {activeTab === 'calendar' && (
            <CalendarView meetings={meetings} isDark={isDark} defaultView={workspacePreferences.defaultCalendarView} weekStartsOn={workspacePreferences.weekStartsOn} onCreate={handleCreateMeeting} />
          )}

          {activeTab === 'reports' && (
            <ReportsView companies={companies} deals={deals} people={people} tasks={tasks} isDark={isDark} />
          )}

          {activeTab === 'trash' && (
            <TrashView
              records={trashRecords}
              isDark={isDark}
              onRestore={async (id) => {
                try {
                  await restoreTrashRecord(id);
                  setWorkspaceError(null);
                } catch (err) {
                  setWorkspaceError(err instanceof Error ? err.message : 'Unable to restore record.');
                }
              }}
              onDeletePermanently={async (id) => {
                try {
                  await permanentlyDeleteTrashRecord(id);
                  setWorkspaceError(null);
                } catch (err) {
                  setWorkspaceError(err instanceof Error ? err.message : 'Unable to permanently delete record.');
                }
              }}
            />
          )}
        </Suspense>

        {activeTab === 'notes' && (
          <section className="mx-auto max-w-5xl">
            <div className="mb-4">
              <h2 className="text-base font-semibold">Notes</h2>
              <p className="mt-1 text-xs text-neutral-500">Internal notes and account updates from your workspace.</p>
            </div>
            <div className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
              {notes.length === 0 ? (
                <p className="py-10 text-center text-xs text-neutral-500">No notes yet. Add a note from a company record.</p>
              ) : notes.map((note) => (
                <article key={note.id} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                  <div><h3 className="text-xs font-semibold">{note.title}</h3><p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">{note.description}</p></div>
                  <div className="text-[10px] text-neutral-400 sm:text-right"><p>{note.author}</p><p className="mt-1">{note.timestamp}</p></div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* VIEW 1: COMPANIES TABLE */}
        {activeTab === 'companies' && (
          <div className="overflow-x-auto border-y border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#0c0d10]">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-[#fbfbfc] font-medium text-neutral-500 dark:border-neutral-800 dark:bg-white/[0.02]">
                  <th className="w-8 border-r border-neutral-200 px-3 py-2.5 dark:border-neutral-800">
                    <input
                      type="checkbox"
                      checked={filteredCompanies.length > 0 && selectedCompanyIds.length === filteredCompanies.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedCompanyIds(filteredCompanies.map((c) => c.id));
                        else setSelectedCompanyIds([]);
                      }}
                    />
                  </th>
                  <th className="border-r border-neutral-200 px-3 py-2.5 font-semibold text-neutral-700 dark:border-neutral-800 dark:text-neutral-200"><span className="mr-2 text-neutral-400">⚙</span>Name</th>
                  {visibleColumns.domain && <th className="border-r border-neutral-200 px-3 py-2.5 dark:border-neutral-800">Domain</th>}
                  {visibleColumns.tier && <th className="border-r border-neutral-200 px-3 py-2.5 dark:border-neutral-800">Tier</th>}
                  {visibleColumns.arr && <th className="border-r border-neutral-200 px-3 py-2.5 text-right dark:border-neutral-800">ARR</th>}
                  {visibleColumns.contact && <th className="border-r border-neutral-200 px-3 py-2.5 dark:border-neutral-800">Primary Contact</th>}
                  <th className="border-r border-neutral-200 px-3 py-2.5 dark:border-neutral-800">Health</th>
                  {visibleColumns.status && <th className="border-r border-neutral-200 px-3 py-2.5 dark:border-neutral-800">Status</th>}
                  {visibleColumns.owner && <th className="border-r border-neutral-200 px-3 py-2.5 dark:border-neutral-800">Owner</th>}
                  <th className="px-3 py-2.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/70">
                {filteredCompanies.map((company) => {
                  const isSelected = selectedCompanyIds.includes(company.id);
                  return (
                    <tr
                      key={company.id}
                      className={`group cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 dark:bg-white/[0.06]' : 'hover:bg-[#f8f9fb] dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="border-r border-neutral-200 px-3 py-2 dark:border-neutral-800">
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
                      <td onClick={() => setSelectedCompany(company)} className="border-r border-neutral-200 px-3 py-2 font-medium text-blue-700 dark:border-neutral-800 dark:text-blue-300">
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-[9px] font-semibold text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-200">
                          {company.name.charAt(0)}
                        </span>
                        <span className="group-hover:underline">{company.name}</span>
                      </td>
                      {visibleColumns.domain && <td onClick={() => setSelectedCompany(company)} className="border-r border-neutral-200 px-3 py-2 text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
                        {company.domain}
                      </td>}
                      {visibleColumns.tier && <td onClick={() => setSelectedCompany(company)} className="border-r border-neutral-200 px-3 py-2 text-neutral-700 dark:border-neutral-800 dark:text-neutral-300">
                        {company.tier}
                      </td>}
                      {visibleColumns.arr && <td onClick={() => setSelectedCompany(company)} className="border-r border-neutral-200 px-3 py-2 text-right font-mono text-neutral-700 dark:border-neutral-800 dark:text-neutral-300">
                        ${company.arr.toLocaleString()}
                      </td>}
                      {visibleColumns.contact && <td onClick={() => setSelectedCompany(company)} className="border-r border-neutral-200 px-3 py-2 text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
                        {company.primaryContact}
                      </td>}
                      <td onClick={() => setSelectedCompany(company)} className="border-r border-neutral-200 px-3 py-2 dark:border-neutral-800">
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
                      {visibleColumns.status && <td onClick={() => setSelectedCompany(company)} className="border-r border-neutral-200 px-3 py-2 dark:border-neutral-800">
                        <span className="text-neutral-700 dark:text-neutral-300">{company.status}</span>
                      </td>}
                      {visibleColumns.owner && <td onClick={() => setSelectedCompany(company)} className="border-r border-neutral-200 px-3 py-2 text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">{company.owner}</td>}
                      <td onClick={() => setSelectedCompany(company)} className="px-3 py-2 text-right">
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
                  <span>Due {formatDueDate(task.dueDate)}</span>
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
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">{activeTitle.workflows}</h2>
                <p className="mt-1 text-xs text-neutral-500">
                  {workflowSection === 'workflows'
                    ? 'Event-driven automations triggered on record changes.'
                    : workflowSection === 'runs'
                      ? 'Execution totals are available; individual run history is not recorded yet.'
                      : 'Current workflow configurations and their enabled state. Version history is not tracked yet.'}
                </p>
              </div>
              {workflowSection === 'workflows' && (
                <button type="button" onClick={() => setShowAiDrawer(true)} className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-white/[0.06]">
                  <Sparkles className="h-3.5 w-3.5" /> Ask AI about workflows
                </button>
              )}
            </div>
            <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
              {[
                { id: 'workflows' as const, label: 'Workflows' },
                { id: 'runs' as const, label: 'Workflow Runs' },
                { id: 'versions' as const, label: 'Workflow Versions' },
              ].map(({ id, label }) => (
                <button key={id} type="button" onClick={() => setWorkflowSection(id)} className={`border-b-2 px-3 py-2 text-xs ${workflowSection === id ? 'border-neutral-900 font-semibold text-neutral-900 dark:border-white dark:text-white' : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>
                  {label}
                </button>
              ))}
            </div>
            {workflowSection === 'workflows' && (
              <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
                <table className="w-full min-w-[680px] text-left text-xs">
                  <thead className="bg-neutral-50 text-[10px] uppercase tracking-wide text-neutral-500 dark:bg-white/[0.03]">
                    <tr><th className="px-4 py-3 font-semibold">Name</th><th className="px-4 py-3 font-semibold">Trigger</th><th className="px-4 py-3 font-semibold">Action</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Runs</th></tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {workflows.map((wf) => (
                      <tr key={wf.id} className="bg-white dark:bg-[#0c0d10]">
                        <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">{wf.name}</td>
                        <td className="max-w-56 truncate px-4 py-3 font-mono text-[10px] text-neutral-500" title={wf.trigger}>{wf.trigger}</td>
                        <td className="max-w-56 truncate px-4 py-3 font-mono text-[10px] text-neutral-500" title={wf.action}>{wf.action}</td>
                        <td className="px-4 py-3">
                          <button type="button" onClick={() => toggleWorkflow(wf.id)} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${wf.enabled ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-neutral-100 text-neutral-500 dark:bg-white/10'}`}>
                            {wf.enabled ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-neutral-600 dark:text-neutral-400">{Number(wf.executionCount || 0)}</td>
                      </tr>
                    ))}
                    {workflows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-500">No workflows have been configured.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
            {workflowSection === 'runs' && (
              <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="bg-neutral-50 text-[10px] uppercase tracking-wide text-neutral-500 dark:bg-white/[0.03]">
                    <tr><th className="px-4 py-3 font-semibold">Workflow</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Total runs</th><th className="px-4 py-3 font-semibold">Run history</th></tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {workflows.map((wf) => (
                      <tr key={wf.id} className="bg-white dark:bg-[#0c0d10]">
                        <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">{wf.name}</td>
                        <td className="px-4 py-3">{wf.enabled ? 'Active' : 'Disabled'}</td>
                        <td className="px-4 py-3 tabular-nums">{Number(wf.executionCount || 0)}</td>
                        <td className="px-4 py-3 text-neutral-500">Detailed run history unavailable</td>
                      </tr>
                    ))}
                    {workflows.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-500">No workflow runs to show.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
            {workflowSection === 'versions' && (
              <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="bg-neutral-50 text-[10px] uppercase tracking-wide text-neutral-500 dark:bg-white/[0.03]">
                    <tr><th className="px-4 py-3 font-semibold">Workflow</th><th className="px-4 py-3 font-semibold">Current configuration</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Runs</th></tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {workflows.map((wf) => (
                      <tr key={wf.id} className="bg-white dark:bg-[#0c0d10]">
                        <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">{wf.name}</td>
                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">Current</td>
                        <td className="px-4 py-3">{wf.enabled ? 'Active' : 'Draft / disabled'}</td>
                        <td className="px-4 py-3 tabular-nums">{Number(wf.executionCount || 0)}</td>
                      </tr>
                    ))}
                    {workflows.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-500">No workflow configurations to show.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
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

      {/* 5C. ADD PERSON MODAL (Twenty-style "New person") */}
      {showAddPersonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#101116] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-4">New Person</h3>
            <form onSubmit={handleCreatePerson} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ada Lovelace"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="ada@company.com"
                    value={newPersonEmail}
                    onChange={(e) => setNewPersonEmail(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 010-0000"
                    value={newPersonPhone}
                    onChange={(e) => setNewPersonPhone(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Job Title</label>
                  <input
                    type="text"
                    placeholder="VP of Engineering"
                    value={newPersonTitle}
                    onChange={(e) => setNewPersonTitle(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Status</label>
                  <select
                    value={newPersonStatus}
                    onChange={(e) => setNewPersonStatus(e.target.value as Person['status'])}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Contact">Contact</option>
                    <option value="Customer">Customer</option>
                    <option value="Champion">Champion</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Company</label>
                <select
                  required
                  value={newPersonCompanyId}
                  onChange={(e) => setNewPersonCompanyId(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2"
                >
                  <option value="">Select a company…</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button type="button" onClick={() => setShowAddPersonModal(false)} className="px-3 py-1.5 text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-md bg-neutral-950 dark:bg-white px-4 py-1.5 font-bold text-white dark:text-neutral-950 cursor-pointer">Create Person</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5D. ADD OPPORTUNITY MODAL (Twenty-style "New opportunity") */}
      {showAddDealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#101116] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-4">New Opportunity</h3>
            <form onSubmit={handleCreateDeal} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Deal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise — Annual Renewal"
                  value={newDealTitle}
                  onChange={(e) => setNewDealTitle(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2"
                />
              </div>
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Company</label>
                <select
                  required
                  value={newDealCompanyId}
                  onChange={(e) => setNewDealCompanyId(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2"
                >
                  <option value="">Select a company…</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Amount ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={newDealAmount}
                    onChange={(e) => setNewDealAmount(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Stage</label>
                  <select
                    value={newDealStage}
                    onChange={(e) => setNewDealStage(e.target.value as DealStage)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2"
                  >
                    <option value="prospect">Prospecting</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Closed Won</option>
                    <option value="lost">Closed Lost</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Win Probability (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newDealProbability}
                    onChange={(e) => setNewDealProbability(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Close Date</label>
                  <input
                    type="date"
                    value={newDealCloseDate}
                    onChange={(e) => setNewDealCloseDate(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button type="button" onClick={() => setShowAddDealModal(false)} className="px-3 py-1.5 text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-md bg-neutral-950 dark:bg-white px-4 py-1.5 font-bold text-white dark:text-neutral-950 cursor-pointer">Create Opportunity</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5E. ADD TASK MODAL (Twenty-style "New task") */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#101116] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-4">New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Send security questionnaire to procurement"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Assigned To</label>
                <input
                  type="text"
                  placeholder={currentUser.name || 'Workspace admin'}
                  value={newTaskAssignedTo}
                  onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2"
                />
              </div>
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Related Company</label>
                <select
                  value={newTaskCompanyId}
                  onChange={(e) => setNewTaskCompanyId(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] p-2"
                >
                  <option value="">General (no company link)</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button type="button" onClick={() => setShowAddTaskModal(false)} className="px-3 py-1.5 text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-md bg-neutral-950 dark:bg-white px-4 py-1.5 font-bold text-white dark:text-neutral-950 cursor-pointer">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. TWENTY AI COPILOT DRAWER */}
      <Suspense fallback={null}>
        <CompanyCsvImport
          isOpen={showCompanyImport}
          isDark={isDark}
          onClose={() => setShowCompanyImport(false)}
          onImport={handleImportCompanies}
        />
      </Suspense>

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
    </div>
  );
}
