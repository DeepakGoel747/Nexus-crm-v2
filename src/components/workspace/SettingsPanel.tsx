import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Blocks,
  Bot,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Code2,
  CreditCard,
  Database,
  ExternalLink,
  LayoutGrid,
  Mail,
  MessageCircle,
  Plug,
  RefreshCw,
  Save,
  Settings2,
  UserRound,
  Users,
  Workflow,
} from 'lucide-react';

export interface WorkspacePreferences {
  appearance?: string;
  language?: string;
  interfaceScale?: string;
  recordNavigation?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  numberFormat?: string;
  weekStartsOn?: 'sunday' | 'monday';
  defaultCalendarView?: 'month' | 'week';
  currency?: string;
  defaultCompanyTier?: 'Enterprise' | 'Mid-Market' | 'Growth' | 'Seed';
  emailImportScope?: string;
  emailVisibility?: string;
  autoCreateEmailContacts?: boolean;
  excludeGroupEmails?: boolean;
  excludeNonProfessionalEmails?: boolean;
  calendarEventVisibility?: string;
  autoCreateCalendarContacts?: boolean;
  emailSenderName?: string;
  emailSenderAddress?: string;
  syncInternalEmails?: boolean;
  emailBlocklist?: string[];
  sidebarItems?: string[];
}

interface SettingsUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SettingsMember extends SettingsUser {
  createdAt?: string;
}

interface SettingsPanelProps {
  isDark: boolean;
  user: SettingsUser;
  workspace: {
    id: string;
    name: string;
    companyName?: string;
    companyWebsite?: string;
    industry?: string;
    companySize?: string;
    country?: string;
  };
  customObjects: Array<{ id: string; name: string; fields?: string[] }>;
  recordCounts: { companies: number; people: number; opportunities: number; tasks: number };
  onCustomObjectAdded: (object: { id: string; name: string; fields?: string[] }) => void;
  onUserChanged: (user: SettingsUser) => void;
  onWorkspaceChanged: (workspace: SettingsPanelProps['workspace']) => void;
  onPreferencesSaved: (preferences: WorkspacePreferences) => void;
  onAppearanceChanged: (isDark: boolean) => void;
  onNavigationItemsChanged: (items: string[]) => void;
  onOpenMcpSetup: () => void;
}

type SectionId =
  | 'profile' | 'experience' | 'accounts' | 'emails' | 'calendars'
  | 'general' | 'data-model' | 'layout' | 'members' | 'billing'
  | 'mcp' | 'apps' | 'ai' | 'communication' | 'community' | 'support' | 'documentation';

const sections: Array<{ group: string; items: Array<{ id: SectionId; label: string; icon: typeof UserRound }> }> = [
  { group: 'User', items: [{ id: 'profile', label: 'Profile', icon: UserRound }, { id: 'experience', label: 'Experience', icon: Settings2 }, { id: 'accounts', label: 'Accounts', icon: Plug }, { id: 'emails', label: 'Emails', icon: Mail }, { id: 'calendars', label: 'Calendars', icon: CalendarDays }] },
  { group: 'Workspace', items: [{ id: 'general', label: 'General', icon: Settings2 }, { id: 'data-model', label: 'Data model', icon: Database }, { id: 'layout', label: 'Layout', icon: LayoutGrid }, { id: 'members', label: 'Members', icon: Users }, { id: 'billing', label: 'Billing', icon: CreditCard }, { id: 'mcp', label: 'MCP & APIs', icon: Code2 }, { id: 'apps', label: 'Apps', icon: Blocks }, { id: 'ai', label: 'AI', icon: Bot }, { id: 'communication', label: 'Communication', icon: MessageCircle }] },
  { group: 'Other', items: [{ id: 'community', label: 'Community', icon: Users }, { id: 'support', label: 'Support', icon: CircleHelp }, { id: 'documentation', label: 'Documentation', icon: ExternalLink }] },
];

const navigationOptions = [
  ['companies', 'Companies'], ['people', 'People'], ['opportunities', 'Opportunities'],
  ['tasks', 'Tasks'], ['notes', 'Notes'], ['analytics', 'Dashboards'],
  ['calendar', 'Calendar'], ['reports', 'Reports'], ['trash', 'Trash'], ['schema', 'Data model'],
];
const defaultNavigation = navigationOptions.map(([id]) => id);
const defaultPreferences: WorkspacePreferences = {
  appearance: 'light',
  language: 'English',
  interfaceScale: 'regular',
  recordNavigation: 'side-panel',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  dateFormat: 'locale',
  timeFormat: '12h',
  numberFormat: 'en-US',
  weekStartsOn: 'sunday',
  defaultCalendarView: 'month',
  currency: 'USD',
  defaultCompanyTier: 'Growth',
  emailImportScope: 'all',
  emailVisibility: 'participants-only',
  autoCreateEmailContacts: true,
  excludeGroupEmails: true,
  excludeNonProfessionalEmails: false,
  calendarEventVisibility: 'metadata',
  autoCreateCalendarContacts: true,
  syncInternalEmails: false,
  emailBlocklist: [],
  sidebarItems: defaultNavigation,
};

function getHeaders() {
  const token = localStorage.getItem('nexus_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function errorMessage(data: unknown, fallback: string) {
  return data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
    ? data.error
    : fallback;
}

function SettingCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#101116]">
      <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="mt-1 text-xs leading-relaxed text-neutral-500">{description}</p>}
      </div>
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">{children}</div>
    </section>
  );
}

function SettingRow({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium">{title}</p>
        {description && <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{description}</p>}
      </div>
      <div className="w-full sm:w-auto sm:min-w-48">{children}</div>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs leading-relaxed text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/[0.08] dark:text-blue-200">{children}</p>;
}

export function SettingsPanel({
  isDark,
  user,
  workspace,
  customObjects,
  recordCounts,
  onCustomObjectAdded,
  onUserChanged,
  onWorkspaceChanged,
  onPreferencesSaved,
  onAppearanceChanged,
  onNavigationItemsChanged,
  onOpenMcpSetup,
}: SettingsPanelProps) {
  const [section, setSection] = useState<SectionId>('general');
  const [gmailStatus, setGmailStatus] = useState<{ connected: boolean; configured: boolean; email: string | null; importedCount: number; lastSyncAt: string | null } | null>(null);
  const [gmailBusy, setGmailBusy] = useState(false);
  const [gmailMessage, setGmailMessage] = useState('');

  const apiHeaders = useMemo<Record<string, string>>(() => {
    const headers: Record<string, string> = {};
    const token = localStorage.getItem('nexus_token') || '';
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  const loadGmailStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/integrations/gmail/status', { headers: apiHeaders });
      if (!response.ok) throw new Error('status failed');
      setGmailStatus(await response.json());
    } catch {
      setGmailStatus({ connected: false, configured: false, email: null, importedCount: 0, lastSyncAt: null });
    }
  }, [apiHeaders]);

  useEffect(() => {
    if (section === 'apps') loadGmailStatus();
  }, [section, loadGmailStatus]);

  // Google redirects back with ?gmail=connected or ?gmail=error after consent.
  useEffect(() => {
    const hash = window.location.hash || '';
    if (!hash.includes('gmail=')) return;
    if (hash.includes('gmail=connected')) setGmailMessage('Gmail connected. Run a sync to import your messages.');
    else if (hash.includes('gmail=error')) setGmailMessage('Gmail connection failed. Check the OAuth redirect URI matches this deployment origin.');
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#workspace`);
    loadGmailStatus();
  }, [loadGmailStatus]);

  const gmailConnect = async () => {
    setGmailBusy(true);
    setGmailMessage('');
    try {
      const response = await fetch('/api/integrations/gmail/auth-url', { headers: apiHeaders });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not start the Gmail connection.');
      window.location.href = data.url;
    } catch (err: any) {
      setGmailMessage(err?.message || 'Could not start the Gmail connection.');
      setGmailBusy(false);
    }
  };

  const gmailSync = async () => {
    setGmailBusy(true);
    setGmailMessage('');
    try {
      const response = await fetch('/api/integrations/gmail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...apiHeaders },
        body: JSON.stringify({ maxResults: 25 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gmail sync failed.');
      setGmailMessage(data.message || 'Sync complete.');
      await loadGmailStatus();
    } catch (err: any) {
      setGmailMessage(err?.message || 'Gmail sync failed.');
    } finally {
      setGmailBusy(false);
    }
  };

  const gmailDisconnect = async () => {
    setGmailBusy(true);
    try {
      await fetch('/api/integrations/gmail/disconnect', { method: 'POST', headers: apiHeaders });
      setGmailMessage('Gmail disconnected.');
      await loadGmailStatus();
    } finally {
      setGmailBusy(false);
    }
  };
  const [preferences, setPreferences] = useState<WorkspacePreferences>(defaultPreferences);
  const [members, setMembers] = useState<SettingsMember[]>([]);
  const [advanced, setAdvanced] = useState(false);
  const [userName, setUserName] = useState(user.name);
  const [workspaceName, setWorkspaceName] = useState(workspace.name);
  const [companyName, setCompanyName] = useState(workspace.companyName || workspace.name);
  const [companyWebsite, setCompanyWebsite] = useState(workspace.companyWebsite || '');
  const [industry, setIndustry] = useState(workspace.industry || '');
  const [companySize, setCompanySize] = useState(workspace.companySize || '1-10');
  const [country, setCountry] = useState(workspace.country || '');
  const [showObjectForm, setShowObjectForm] = useState(false);
  const [objectName, setObjectName] = useState('');
  const [blocklistDraft, setBlocklistDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setUserName(user.name);
  }, [user.name]);

  useEffect(() => {
    setWorkspaceName(workspace.name);
    setCompanyName(workspace.companyName || workspace.name);
    setCompanyWebsite(workspace.companyWebsite || '');
    setIndustry(workspace.industry || '');
    setCompanySize(workspace.companySize || '1-10');
    setCountry(workspace.country || '');
  }, [workspace.name, workspace.companyName, workspace.companyWebsite, workspace.industry, workspace.companySize, workspace.country]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/workspace/settings', { headers: getHeaders() }),
      fetch('/api/workspace/members', { headers: getHeaders() }),
    ]).then(async ([settingsResponse, membersResponse]) => {
      const [settingsData, membersData] = await Promise.all([
        settingsResponse.json(),
        membersResponse.json(),
      ]);
      if (!settingsResponse.ok) throw new Error(errorMessage(settingsData, 'Unable to load workspace preferences.'));
      if (!membersResponse.ok) throw new Error(errorMessage(membersData, 'Unable to load workspace members.'));
      if (!active) return;
      const loaded = { ...defaultPreferences, appearance: isDark ? 'dark' : 'light', ...(settingsData.settings || {}) };
      setPreferences(loaded);
      setMembers(Array.isArray(membersData.members) ? membersData.members : []);
      if (Array.isArray(loaded.sidebarItems)) onNavigationItemsChanged(loaded.sidebarItems);
      const prefersDark = loaded.appearance === 'dark' ||
        (loaded.appearance === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      onAppearanceChanged(prefersDark);
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load Settings.');
    });
    return () => {
      active = false;
    };
  // Load once per mount; parent callbacks update only theme/navigation state.
  }, []);

  const sectionLabel = useMemo(
    () => sections.flatMap((group) => group.items).find((item) => item.id === section)?.label || 'Settings',
    [section],
  );

  const updatePreference = <K extends keyof WorkspacePreferences>(key: K, value: WorkspacePreferences[K]) => {
    setPreferences((current) => ({ ...current, [key]: value }));
    setSuccess('');
  };

  const savePreferences = async (keys?: Array<keyof WorkspacePreferences>, overrides: Partial<WorkspacePreferences> = {}) => {
    const settings = keys
      ? Object.fromEntries(keys.map((key) => [key, overrides[key] ?? preferences[key]]))
      : { ...preferences, ...overrides };
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/workspace/settings', {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ settings }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(errorMessage(data, 'Unable to save preferences.'));
      setPreferences((current) => ({ ...current, ...data.settings }));
      onPreferencesSaved(data.settings);
      if (keys?.includes('sidebarItems') && Array.isArray(data.settings.sidebarItems)) {
        onNavigationItemsChanged(data.settings.sidebarItems);
      }
      if (keys?.includes('appearance')) {
        const setting = data.settings.appearance;
        onAppearanceChanged(setting === 'dark' || (setting === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
      }
      setSuccess('Changes saved.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save preferences.');
    } finally {
      setBusy(false);
    }
  };

  const saveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ name: userName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(errorMessage(data, 'Unable to update profile.'));
      onUserChanged(data.user);
      setSuccess('Profile updated.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update profile.');
    } finally {
      setBusy(false);
    }
  };

  const saveWorkspace = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          name: workspaceName,
          companyName,
          website: companyWebsite,
          industry,
          companySize,
          country,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(errorMessage(data, 'Unable to update workspace.'));
      onWorkspaceChanged(data.workspace);
      setSuccess('Workspace updated.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update workspace.');
    } finally {
      setBusy(false);
    }
  };

  const createCustomObject = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/custom-objects', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: objectName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(errorMessage(data, 'Unable to create custom object.'));
      onCustomObjectAdded(data.customObject);
      setObjectName('');
      setShowObjectForm(false);
      setSuccess('Custom object created.');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create custom object.');
    } finally {
      setBusy(false);
    }
  };

  const saveBlocklist = async () => {
    const items = blocklistDraft.split(/[,\n]/).map((item) => item.trim().toLowerCase()).filter(Boolean);
    if (!items.length) return;
    const next = [...new Set([...(preferences.emailBlocklist || []), ...items])];
    updatePreference('emailBlocklist', next);
    setBlocklistDraft('');
    await savePreferences(['emailBlocklist'], { emailBlocklist: next });
  };

  const renderSelect = (key: keyof WorkspacePreferences, label: string, options: string[], onSaveKeys?: Array<keyof WorkspacePreferences>) => (
    <SettingRow title={label}>
      <div className="flex gap-2">
        <select
          aria-label={label}
          value={typeof preferences[key] === 'string' ? preferences[key] as string : ''}
          onChange={(event) => updatePreference(key, event.target.value)}
          className="min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-xs dark:border-neutral-700 dark:bg-[#0c0d10]"
        >
          {Array.from(new Set(options)).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        {onSaveKeys && <button type="button" disabled={busy} onClick={() => savePreferences(onSaveKeys)} className="rounded-md border border-neutral-200 px-2 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-white/5" aria-label={`Save ${label}`}><Save className="h-3.5 w-3.5" /></button>}
      </div>
    </SettingRow>
  );

  const renderToggle = (key: keyof WorkspacePreferences, title: string, description?: string) => {
    const value = preferences[key] === true;
    return (
      <SettingRow title={title} description={description}>
        <button
          type="button"
          role="switch"
          aria-checked={value}
          onClick={() => updatePreference(key, !value)}
          className={`relative h-5 w-9 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
        >
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
        </button>
      </SettingRow>
    );
  };

  const renderPage = () => {
    switch (section) {
      case 'profile':
        return (
          <div className="space-y-4">
            <form onSubmit={saveUser} className="space-y-4">
              <SettingCard title="Personal information" description="Manage the name shown across your Nexus workspace.">
                <SettingRow title="Profile picture" description="Avatar uploads are not available in this build."><span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">{user.name.slice(0, 1).toUpperCase()}</span></SettingRow>
                <SettingRow title="Full name"><input value={userName} maxLength={100} onChange={(event) => setUserName(event.target.value)} className="w-full rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-xs dark:border-neutral-700 dark:bg-[#0c0d10]" /></SettingRow>
                <SettingRow title="Email address" description="Email changes are managed through your account provider."><input value={user.email} readOnly className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-xs text-neutral-500 dark:border-neutral-700 dark:bg-white/[0.03]" /></SettingRow>
              </SettingCard>
              <SettingCard title="Security" description="Authentication controls available for this account.">
                <SettingRow title="Two-factor authentication" description="Authenticator setup is not currently available."><span className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] text-neutral-500 dark:bg-white/[0.06]">Not configured</span></SettingRow>
                <SettingRow title="Password and devices" description="Password reset and active-session management are not currently available."><span className="text-[11px] text-neutral-400">Unavailable</span></SettingRow>
              </SettingCard>
              <div className="flex justify-end"><button disabled={busy} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">Save profile</button></div>
            </form>
            <SettingCard title="Delete account">
              <SettingRow title="Account deletion" description="Account deletion is disabled because this deployment has no account recovery flow."><span className="text-xs text-neutral-400">Unavailable</span></SettingRow>
            </SettingCard>
          </div>
        );
      case 'experience':
        return (
          <div className="space-y-4">
            <SettingCard title="Appearance">
              {renderSelect('appearance', 'Theme', ['light', 'dark', 'system'])}
              {renderSelect('language', 'Language', ['English'])}
              {renderSelect('interfaceScale', 'Interface scale', ['compact', 'regular', 'comfortable'])}
              {renderSelect('recordNavigation', 'Record navigation', ['side-panel', 'full-page'])}
            </SettingCard>
            <SettingCard title="Regional formats" description="These workspace defaults are saved for future use; some existing date and number displays still use the browser locale.">
              {renderSelect('timezone', 'Timezone', [preferences.timezone || 'UTC', 'UTC', 'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Asia/Kolkata'])}
              {renderSelect('dateFormat', 'Date format', ['locale', 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'])}
              {renderSelect('timeFormat', 'Time format', ['12h', '24h'])}
              {renderSelect('numberFormat', 'Number format', ['en-US', 'en-IN', 'de-DE', 'fr-FR'])}
              {renderSelect('weekStartsOn', 'Week starts on', ['monday', 'sunday'])}
              {renderSelect('defaultCalendarView', 'Default calendar view', ['month', 'week'])}
            </SettingCard>
            <div className="flex justify-end"><button type="button" disabled={busy} onClick={() => savePreferences(['appearance', 'language', 'interfaceScale', 'recordNavigation', 'timezone', 'dateFormat', 'timeFormat', 'numberFormat', 'weekStartsOn', 'defaultCalendarView'])} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">Save experience</button></div>
          </div>
        );
      case 'accounts':
        return (
          <div className="space-y-4">
            <Notice>External mailbox and calendar providers are not connected in this Nexus deployment. These settings pages let you review sync preferences, but they will not import or send data until an integration is configured.</Notice>
            <SettingCard title="Connected accounts" description="Connectors are not configured.">
              <SettingRow title="Email accounts" description="No email provider is connected."><span className="text-xs text-neutral-400">Not connected</span></SettingRow>
              <SettingRow title="Calendar accounts" description="No calendar provider is connected."><span className="text-xs text-neutral-400">Not connected</span></SettingRow>
            </SettingCard>
            <SettingCard title="Account preferences">
              <SettingRow title="Email settings"><button type="button" onClick={() => setSection('emails')} className="flex items-center justify-end gap-1 text-xs text-blue-600 dark:text-blue-400">Configure <ChevronRight className="h-3.5 w-3.5" /></button></SettingRow>
              <SettingRow title="Calendar settings"><button type="button" onClick={() => setSection('calendars')} className="flex items-center justify-end gap-1 text-xs text-blue-600 dark:text-blue-400">Configure <ChevronRight className="h-3.5 w-3.5" /></button></SettingRow>
              <SettingRow title="Blocklist"><button type="button" onClick={() => setSection('communication')} className="flex items-center justify-end gap-1 text-xs text-blue-600 dark:text-blue-400">Manage <ChevronRight className="h-3.5 w-3.5" /></button></SettingRow>
            </SettingCard>
          </div>
        );
      case 'emails':
        return (
          <div className="space-y-4">
            <Notice>No email provider is connected. Preferences are saved to the workspace, but syncing, sending, and importing are not active.</Notice>
            <SettingCard title="Email sync preferences">
              {renderSelect('emailImportScope', 'Import scope', ['all', 'last-30-days', 'none'])}
              {renderSelect('emailVisibility', 'Email visibility', ['participants-only', 'all', 'metadata'])}
              {renderToggle('autoCreateEmailContacts', 'Automatically create contacts')}
              {renderToggle('excludeGroupEmails', 'Exclude group emails')}
              {renderToggle('excludeNonProfessionalEmails', 'Exclude non-professional addresses')}
            </SettingCard>
            <SettingCard title="Email sender" description="Used for drafts and outbound email once a sending integration exists.">
              <SettingRow title="Sender name"><input value={preferences.emailSenderName || ''} onChange={(event) => updatePreference('emailSenderName', event.target.value)} className="w-full rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-xs dark:border-neutral-700 dark:bg-[#0c0d10]" /></SettingRow>
              <SettingRow title="Sender address"><input type="email" value={preferences.emailSenderAddress || ''} onChange={(event) => updatePreference('emailSenderAddress', event.target.value)} className="w-full rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-xs dark:border-neutral-700 dark:bg-[#0c0d10]" /></SettingRow>
            </SettingCard>
            <div className="flex justify-end"><button type="button" disabled={busy} onClick={() => savePreferences(['emailImportScope', 'emailVisibility', 'autoCreateEmailContacts', 'excludeGroupEmails', 'excludeNonProfessionalEmails', 'emailSenderName', 'emailSenderAddress'])} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">Save email preferences</button></div>
          </div>
        );
      case 'calendars':
        return (
          <div className="space-y-4">
            <Notice>No external calendar is connected. You can still manage Nexus CRM meetings from the Calendar workspace view.</Notice>
            <SettingCard title="Calendar preferences" description="Default view and week start are applied to the Nexus CRM Calendar; external event sync still requires a provider integration.">
              {renderSelect('calendarEventVisibility', 'Event visibility', ['metadata', 'everything'])}
              {renderToggle('autoCreateCalendarContacts', 'Automatically create contacts from attendees')}
              {renderSelect('defaultCalendarView', 'Default view', ['month', 'week'])}
              {renderSelect('weekStartsOn', 'Week starts on', ['monday', 'sunday'])}
            </SettingCard>
            <div className="flex justify-end"><button type="button" disabled={busy} onClick={() => savePreferences(['calendarEventVisibility', 'autoCreateCalendarContacts', 'defaultCalendarView', 'weekStartsOn'])} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">Save calendar preferences</button></div>
          </div>
        );
      case 'general':
        return (
          <div className="space-y-4">
            <form onSubmit={saveWorkspace}>
              <SettingCard title="Workspace profile" description="Company details are stored with this workspace and can be changed later.">
                <SettingRow title="Workspace name"><input value={workspaceName} maxLength={100} onChange={(event) => setWorkspaceName(event.target.value)} className="w-full rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-xs dark:border-neutral-700 dark:bg-[#0c0d10]" /></SettingRow>
                <SettingRow title="Company name"><input value={companyName} maxLength={100} onChange={(event) => setCompanyName(event.target.value)} className="w-full rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-xs dark:border-neutral-700 dark:bg-[#0c0d10]" /></SettingRow>
                <SettingRow title="Company website"><input type="url" value={companyWebsite} onChange={(event) => setCompanyWebsite(event.target.value)} placeholder="https://example.com" className="w-full rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-xs dark:border-neutral-700 dark:bg-[#0c0d10]" /></SettingRow>
                <SettingRow title="Industry"><input value={industry} maxLength={100} onChange={(event) => setIndustry(event.target.value)} placeholder="e.g. Software" className="w-full rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-xs dark:border-neutral-700 dark:bg-[#0c0d10]" /></SettingRow>
                <SettingRow title="Company size">
                  <select value={companySize} onChange={(event) => setCompanySize(event.target.value)} className="w-full rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-xs dark:border-neutral-700 dark:bg-[#0c0d10]">
                    {['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'].map((size) => <option key={size} value={size}>{size} employees</option>)}
                  </select>
                </SettingRow>
                <SettingRow title="Country"><input value={country} maxLength={100} onChange={(event) => setCountry(event.target.value)} placeholder="Country" className="w-full rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-xs dark:border-neutral-700 dark:bg-[#0c0d10]" /></SettingRow>
                <SettingRow title="Workspace URL" description="Custom subdomains and domains are not configured by this self-hosted deployment."><span className="text-xs text-neutral-400">Not configured</span></SettingRow>
              </SettingCard>
              <div className="mt-3 flex justify-end"><button disabled={busy} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">Save workspace</button></div>
            </form>
            <SettingCard title="Workspace defaults" description="Defaults for newly created records and currency display.">
              {renderSelect('currency', 'Currency', ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'], ['currency'])}
              {renderSelect('defaultCompanyTier', 'Default company tier', ['Enterprise', 'Mid-Market', 'Growth', 'Seed'], ['defaultCompanyTier'])}
            </SettingCard>
            <SettingCard title="Workspace security">
              <SettingRow title="Security controls" description="SSO, allowed-domain policies, audit logs, and workspace deletion are not available in this build."><span className="text-xs text-neutral-400">Not configured</span></SettingRow>
            </SettingCard>
          </div>
        );
      case 'data-model':
        return (
          <div className="space-y-4">
            <Notice>Custom object descriptors are supported, but custom-field schema editing and records are not yet connected to the CRM data engine.</Notice>
            <SettingCard title="Data model" description="Objects currently available in this workspace.">
              <SettingRow title="Custom object" description="Create an object descriptor for a future custom schema.">
                <button type="button" onClick={() => setShowObjectForm((visible) => !visible)} className="rounded-md border border-neutral-200 px-3 py-2 text-xs hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-white/[0.05]">Add object</button>
              </SettingRow>
              {showObjectForm && (
                <form onSubmit={createCustomObject} className="flex gap-2 border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
                  <input required maxLength={60} value={objectName} onChange={(event) => setObjectName(event.target.value)} placeholder="Object name" className="min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-xs dark:border-neutral-700 dark:bg-[#0c0d10]" />
                  <button disabled={busy || !objectName.trim()} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">Create</button>
                </form>
              )}
              {[
                ['Companies', recordCounts.companies],
                ['People', recordCounts.people],
                ['Opportunities', recordCounts.opportunities],
                ['Tasks', recordCounts.tasks],
                ...customObjects.map((object) => [object.name, 0] as [string, number]),
              ].map(([name, count]) => (
                <SettingRow key={String(name)} title={String(name)} description={customObjects.some((object) => object.name === name) ? 'Custom object descriptor' : 'Built-in CRM object'}>
                  <span className="text-right text-xs text-neutral-500">{count} records</span>
                </SettingRow>
              ))}
            </SettingCard>
            <p className="text-[11px] text-neutral-500">To add or edit custom objects, use Data model in the workspace navigation. Field metadata editing is not implemented yet.</p>
          </div>
        );
      case 'layout': {
        const selected = new Set(preferences.sidebarItems || defaultNavigation);
        return (
          <div className="space-y-4">
            <SettingCard title="Workspace navigation" description="Choose which sections appear in the main workspace sidebar.">
              {navigationOptions.map(([id, label]) => (
                <SettingRow key={id} title={label}>
                  <button
                    type="button"
                    role="switch"
                    aria-label={`Show ${label} in sidebar`}
                    aria-checked={selected.has(id)}
                    onClick={() => {
                      const next = new Set(selected);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      updatePreference('sidebarItems', Array.from(next));
                    }}
                    className={`relative h-5 w-9 rounded-full transition-colors ${selected.has(id) ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${selected.has(id) ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                  </button>
                </SettingRow>
              ))}
            </SettingCard>
            <div className="flex justify-end"><button type="button" disabled={busy} onClick={() => savePreferences(['sidebarItems'])} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">Save layout</button></div>
          </div>
        );
      }
      case 'members':
        return (
          <div className="space-y-4">
            <SettingCard title="Workspace members" description="People with accounts in this workspace.">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_110px] gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-400"><span>Name</span><span>Email</span><span>Role</span></div>
              {members.map((member) => <div key={member.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_110px] gap-3 border-t border-neutral-100 px-4 py-3 text-xs dark:border-neutral-800"><span className="truncate font-medium">{member.name}</span><span className="truncate text-neutral-500">{member.email}</span><span className="truncate text-neutral-500">{member.role}</span></div>)}
              {members.length === 0 && <p className="border-t border-neutral-100 px-4 py-5 text-xs text-neutral-500 dark:border-neutral-800">No members found.</p>}
            </SettingCard>
            <Notice>Invitations and role editing are not available yet; this list reflects accounts currently registered in the workspace.</Notice>
          </div>
        );
      case 'billing':
        return <SettingCard title="Billing" description="Nexus CRM is self-hosted and does not include a subscription or payment processor."><SettingRow title="Plan and invoices" description="There are no billable seats or invoices in this deployment."><span className="text-xs text-neutral-500">Not applicable</span></SettingRow><SettingRow title="Usage limits" description="No hosted usage-metering service is connected."><span className="text-xs text-neutral-500">Not configured</span></SettingRow></SettingCard>;
      case 'mcp':
        return (
          <div className="space-y-4">
            <SettingCard title="Connect AI tools" description="Open Nexus's existing export and MCP setup panel for supported clients.">
              <SettingRow title="MCP configuration" description="Configuration uses the API endpoint and token format documented by Nexus."><button type="button" onClick={onOpenMcpSetup} className="rounded-md border border-neutral-200 px-3 py-2 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-white/[0.05]">Open MCP setup</button></SettingRow>
              <SettingRow title="API credentials" description="Server credentials are managed by the deployment and are never shown here."><span className="text-xs text-neutral-500">Environment configuration</span></SettingRow>
            </SettingCard>
            <Notice>Never paste private API keys into workspace preferences. Configure secrets on the server and rotate them if exposed.</Notice>
          </div>
        );
      case 'apps':
        return (
          <div className="space-y-4">
            <SettingCard title="Gmail" description="Import your recent Gmail messages as activity records linked to matching contacts, so correspondence history appears alongside each deal. Read-only: Nexus never sends, edits, or deletes mail.">
              {gmailStatus?.connected ? (
                <>
                  <SettingRow title="Connected mailbox">
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-200">{gmailStatus.email || 'connected'}</span>
                  </SettingRow>
                  <SettingRow title="Messages imported">
                    <span className="text-xs text-neutral-500">{gmailStatus.importedCount || 0}</span>
                  </SettingRow>
                  <SettingRow title="Last sync">
                    <span className="text-xs text-neutral-500">{gmailStatus.lastSyncAt ? new Date(gmailStatus.lastSyncAt).toLocaleString() : 'Never'}</span>
                  </SettingRow>
                </>
              ) : (
                <SettingRow title="Status">
                  <span className="text-xs text-neutral-500">{gmailStatus === null ? 'Loading…' : gmailStatus.configured ? 'Not connected' : 'Server has no GOOGLE_CLIENT_ID configured'}</span>
                </SettingRow>
              )}
              <SettingRow title="Actions">
                <span className="flex items-center justify-end gap-2">
                  {gmailStatus?.connected ? (
                    <>
                      <button type="button" onClick={gmailSync} disabled={gmailBusy} className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-white/[0.06]">
                        <RefreshCw className={`h-3.5 w-3.5 ${gmailBusy ? 'animate-spin' : ''}`} /> {gmailBusy ? 'Syncing…' : 'Sync now'}
                      </button>
                      <button type="button" onClick={gmailDisconnect} disabled={gmailBusy} className="rounded-md border border-neutral-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-red-400">Disconnect</button>
                    </>
                  ) : (
                    <button type="button" onClick={gmailConnect} disabled={gmailBusy} className="inline-flex items-center gap-1 rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900">
                      <Mail className="h-3.5 w-3.5" /> Connect Gmail
                    </button>
                  )}
                </span>
              </SettingRow>
            </SettingCard>
            {gmailMessage && <p className="text-xs text-neutral-600 dark:text-neutral-400">{gmailMessage}</p>}
            <SettingCard title="Other applications" description="No application marketplace is configured in this Nexus build.">
              <SettingRow title="Developer applications"><span className="text-xs text-neutral-500">Not available</span></SettingRow>
            </SettingCard>
          </div>
        );
      case 'ai':
        return (
          <div className="space-y-4">
            <SettingCard title="AI features" description="Nexus AI features use the server-side provider configuration. Secrets are not editable or displayed in Settings.">
              <SettingRow title="AI copilot" description="Available in the workspace when a provider API key is configured by the operator."><span className="inline-flex items-center gap-1 text-xs text-neutral-500"><Bot className="h-3.5 w-3.5" /> Server-configured</span></SettingRow>
              <SettingRow title="Models" description="Model selection is controlled by the AI provider integration."><span className="text-xs text-neutral-500">Provider default</span></SettingRow>
              <SettingRow title="Skills and tools" description="Nexus CRM actions are available through the existing AI copilot and MCP export."><span className="text-xs text-neutral-500">Built-in actions</span></SettingRow>
              <SettingRow title="Usage analytics" description="Token-level usage metering is not recorded by this build."><span className="text-xs text-neutral-500">Not tracked</span></SettingRow>
            </SettingCard>
            <button type="button" onClick={onOpenMcpSetup} className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-xs hover:bg-neutral-50 dark:border-neutral-800 dark:bg-[#101116] dark:hover:bg-white/[0.04]"><span className="flex items-center gap-2"><Workflow className="h-4 w-4 text-violet-500" />Connect an AI client using MCP</span><ChevronRight className="h-4 w-4 text-neutral-400" /></button>
          </div>
        );
      case 'communication':
        return (
          <div className="space-y-4">
            <Notice>Communication channels and mailbox sync are not integrated. The controls below store workspace preferences only.</Notice>
            <SettingCard title="Channels"><SettingRow title="Email" description="Outbound email sending is not configured."><span className="text-xs text-neutral-500">Not connected</span></SettingRow><SettingRow title="WhatsApp and calls"><span className="text-xs text-neutral-500">Not available</span></SettingRow></SettingCard>
            <SettingCard title="Sync and blocklist">
              {renderToggle('syncInternalEmails', 'Sync internal emails')}
              <SettingRow title="Blocklist" description="Add email addresses or domains to exclude from future syncs.">
                <div className="flex gap-2"><input value={blocklistDraft} onChange={(event) => setBlocklistDraft(event.target.value)} placeholder="address or domain" className="min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 py-2 text-xs dark:border-neutral-700 dark:bg-[#0c0d10]" /><button type="button" onClick={saveBlocklist} disabled={!blocklistDraft.trim() || busy} className="rounded-md border border-neutral-200 px-2 text-xs disabled:opacity-40 dark:border-neutral-700">Add</button></div>
              </SettingRow>
              {(preferences.emailBlocklist || []).map((item) => <SettingRow key={item} title={item}><button type="button"               onClick={() => { const next = (preferences.emailBlocklist || []).filter((entry) => entry !== item); updatePreference('emailBlocklist', next); void savePreferences(['emailBlocklist'], { emailBlocklist: next }); }} className="text-xs text-red-600">Remove</button></SettingRow>)}
            </SettingCard>
            <div className="flex justify-end"><button type="button" disabled={busy} onClick={() => savePreferences(['syncInternalEmails'])} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">Save communication settings</button></div>
          </div>
        );
      case 'community':
        return <SettingCard title="Community"><SettingRow title="Product updates" description="Community and partner portals are not embedded in this application."><span className="text-xs text-neutral-500">Coming later</span></SettingRow></SettingCard>;
      case 'support':
      case 'documentation':
        return <SettingCard title={sectionLabel}><SettingRow title="Help resources" description="See the project README and in-app documentation available in this deployment."><a href="/docs" className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">Open documentation <ExternalLink className="h-3 w-3" /></a></SettingRow></SettingCard>;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-full flex-col -m-4 sm:-m-5 lg:flex-row">
      <aside className="w-full shrink-0 border-b border-neutral-200 bg-[#fbfbfc] p-3 dark:border-neutral-800 dark:bg-[#101115] lg:w-56 lg:border-b-0 lg:border-r lg:p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold">Settings</span>
          <button type="button" role="switch" aria-checked={advanced} onClick={() => setAdvanced(!advanced)} className={`rounded-full px-2 py-1 text-[10px] ${advanced ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-neutral-100 text-neutral-500 dark:bg-white/[0.06]'}`}>Advanced {advanced ? 'On' : 'Off'}</button>
        </div>
        {advanced && <p className="mb-3 rounded-md bg-neutral-100 px-2 py-1.5 text-[10px] leading-relaxed text-neutral-500 dark:bg-white/[0.04]">Server-managed and integration controls are marked unavailable until configured.</p>}
        <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:block lg:space-y-3">
          {sections.map((group) => (
            <div key={group.group}>
              <p className="mb-1 hidden px-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 lg:block">{group.group}</p>
              <div className="space-y-0.5">
                {group.items.map(({ id, label, icon: Icon }) => (
                  <button key={id} type="button" onClick={() => { setSection(id); setError(''); setSuccess(''); }} className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs ${section === id ? 'bg-neutral-200/80 font-semibold text-neutral-900 dark:bg-white/10 dark:text-white' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/[0.06]'}`}>
                    <Icon className="h-3.5 w-3.5 shrink-0" /><span>{label}</span>{section === id && <Check className="ml-auto h-3 w-3 text-blue-600 dark:text-blue-400" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-3xl space-y-5">
          <header className="border-b border-neutral-200 pb-4 dark:border-neutral-800">
            <p className="text-[11px] text-neutral-400">{workspace.name} / Settings</p>
            <h2 className="mt-1 text-xl font-semibold">{sectionLabel}</h2>
          </header>
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
          {success && <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">{success}</p>}
          {renderPage()}
          <p className="flex items-center gap-1 pt-2 text-[10px] text-neutral-400"><Activity className="h-3 w-3" />Saved preferences affect the parts of Nexus where the setting is currently supported; unavailable integrations are labeled.</p>
        </div>
      </section>
    </div>
  );
}
