import { useState } from 'react';
import { 
  ArrowLeft, 
  Github, 
  Server, 
  Cloud, 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck,
  AlertCircle,
  Building2,
  User,
  Sparkles,
  Layers
} from 'lucide-react';
import { GoogleLoginModal } from '../auth/GoogleLoginModal';

interface LoginPageProps {
  onBackToHome: () => void;
  onLoginSuccess: (workspaceName: string) => void;
  isDark: boolean;
}

export function LoginPage({ onBackToHome, onLoginSuccess, isDark }: LoginPageProps) {
  const [tab, setTab] = useState<'login' | 'register'>('register');
  const [authMode, setAuthMode] = useState<'cloud' | 'self_host'>('cloud');
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [seedDemoData, setSeedDemoData] = useState(true);
  const [instanceUrl, setInstanceUrl] = useState('https://crm.mycompany.internal');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Submit Handler: Real API Request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const endpoint = tab === 'register' ? '/api/auth/register' : '/api/auth/login';
    const payload = tab === 'register'
      ? { name, email, password, workspaceName, seedDemoData }
      : { email, password, authMode, instanceUrl };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.token) {
        localStorage.setItem('nexus_token', data.token);
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
        localStorage.setItem('nexus_workspace', JSON.stringify(data.workspace));
      }

      const activeWs = data.workspace?.name || data.user?.workspaceName || 'Custom Workspace';
      onLoginSuccess(activeWs);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to connect to Nexus server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google SSO Handler — opens the modal
  const handleGoogleSSO = () => {
    setShowGoogleModal(true);
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between ${
      isDark ? 'bg-[#090a0b] text-[#ededed]' : 'bg-[#faf9f6] text-[#141518]'
    }`}>
      {/* Top Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-4 dark:border-white/[0.08] sm:px-6 sm:py-5">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Nexus Home</span>
        </button>

        <a href="#" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-black text-white font-mono text-xs font-black shadow-sm">
            N
          </div>
          <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">
            Nexus CRM
          </span>
        </a>

        <div className="text-xs text-neutral-500 font-mono hidden sm:inline">
          Open-Source Workspace
        </div>
      </header>

      {/* Main Form Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-800 dark:bg-[#0f1014] sm:p-8">
          {/* Header Switcher: Sign In vs Create Workspace */}
          <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-white/[0.04] p-1 mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                tab === 'register'
                  ? 'bg-white dark:bg-[#1a1b22] text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Create New Workspace
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                tab === 'login'
                  ? 'bg-white dark:bg-[#1a1b22] text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
          </div>

          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {tab === 'register' ? 'Provision Your Custom Workspace' : 'Welcome Back to Nexus'}
            </h1>
            <p className="mt-1 text-xs text-neutral-500">
              {tab === 'register'
                ? 'Create a dedicated, private CRM workspace with full data isolation and custom schema.'
                : 'Sign in to access your accounts, pipeline, workflows, and Model Context Protocol AI.'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Social SSO: Google 1-Click */}
          <div className="space-y-2 mb-6">
            <button
              onClick={() => setShowGoogleModal(true)}
              type="button"
              className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-white/[0.04] py-3 px-4 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/[0.08] transition-all cursor-pointer shadow-xs group"
            >
              <svg className="h-4 w-4 shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <div className="text-left">
                <span className="block leading-tight">Continue with Google</span>
                <span className="text-[10px] text-neutral-400 font-normal font-mono block">
                  Secure sign in with your Google account
                </span>
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#0f1014] px-2 text-neutral-400 font-mono text-[10px]">
                or with credentials
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Deepak Goel"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] py-2 pl-9 pr-3 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-black dark:focus:border-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Custom Workspace Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Starlight Systems or Acme Tech"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] py-2 pl-9 pr-3 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-black dark:focus:border-white"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] py-2 pl-9 pr-3 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-black dark:focus:border-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.04] py-2 pl-9 pr-3 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-black dark:focus:border-white font-mono"
                />
              </div>
            </div>

            {tab === 'register' && (
              <label className="flex items-start gap-2 pt-1 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seedDemoData}
                  onChange={(e) => setSeedDemoData(e.target.checked)}
                  className="mt-0.5 rounded border-neutral-300 dark:border-neutral-700"
                />
                <span>
                  Seed workspace with initial starter templates (sample enterprise deal, contact, and workflow automation).
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-neutral-950 dark:bg-white py-2.5 px-4 text-xs font-bold text-white dark:text-neutral-950 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 mt-2"
            >
              <span>{isLoading ? 'Processing...' : tab === 'register' ? 'Create Custom Workspace' : 'Sign In to Workspace'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

        </div>
      </main>

      {/* Trust Footer */}
      <footer className="py-6 px-6 border-t border-neutral-200 dark:border-white/[0.08] text-center text-xs text-neutral-500">
        <div className="flex flex-wrap items-center justify-center gap-6 text-[11px]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>End-to-End Workspace Isolation</span>
          </span>
          <span>·</span>
          <span>SOC2 Type II Certified</span>
          <span>·</span>
          <span>GNU AGPLv3 Open Source</span>
        </div>
      </footer>

      {/* Google Login Account Chooser Modal */}
      <GoogleLoginModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={(ws) => {
          setShowGoogleModal(false);
          onLoginSuccess(ws);
        }}
      />
    </div>
  );
}
