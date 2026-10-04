import { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (momentListener?: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (workspaceName: string) => void;
  defaultEmail?: string;
}

export function GoogleLoginModal({
  isOpen,
  onClose,
  onSuccess,
}: GoogleLoginModalProps) {
  const [isGisReady, setIsGisReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [googleSdkTimedOut, setGoogleSdkTimedOut] = useState(false);
  const [googleConfigError, setGoogleConfigError] = useState<string | null>(null);
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);
  const [onboardingToken, setOnboardingToken] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('1-10');
  const [country, setCountry] = useState('');

  const googleBtnContainerRef = useRef<HTMLDivElement | null>(null);
  // Keep latest onSuccess in a ref so the GIS callback always has current version
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsLoading(false);
      setGoogleSdkTimedOut(false);
      setGoogleClientId(null);
      setIsGisReady(false);
      setGoogleConfigError(null);
      setRequiresOnboarding(false);
      setOnboardingToken(null);
      setCompanyName('');
      setCompanyWebsite('');
      setIndustry('');
      setCompanySize('1-10');
      setCountry('');

      let isCurrent = true;
      fetch('/api/auth/google/config')
        .then(async (response) => {
          if (!response.ok) throw new Error(`Google sign-in configuration request failed (${response.status}).`);
          const data = await response.json();
          if (!isCurrent) return;
          const configuredClientId = typeof data?.clientId === 'string' ? data.clientId.trim() : null;
          setGoogleClientId(configuredClientId);
          if (!configuredClientId) {
            setGoogleConfigError('Google OAuth is not configured. Add a Google OAuth Web client ID to the server environment and restart Nexus.');
          }
        })
        .catch((error: unknown) => {
          if (isCurrent) {
            setGoogleClientId(null);
            setGoogleConfigError(error instanceof Error ? error.message : 'Unable to load Google sign-in configuration.');
          }
        });

      return () => {
        isCurrent = false;
      };
    }
  }, [isOpen]);

  // Poll for Google Identity Services SDK and fall back gracefully if the client is not configured.
  useEffect(() => {
    if (!isOpen || !googleClientId) return;

    let checkInterval: ReturnType<typeof setInterval> | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const checkGis = () => {
      if (window.google?.accounts?.id) {
        setIsGisReady(true);
        setGoogleSdkTimedOut(false);
        if (checkInterval) clearInterval(checkInterval);
        if (timeoutId) clearTimeout(timeoutId);
        return true;
      }
      return false;
    };

    checkGis();
    checkInterval = setInterval(checkGis, 300);
    timeoutId = setTimeout(() => {
      if (!checkGis()) {
        setGoogleSdkTimedOut(true);
        setIsGisReady(false);
      }
      if (checkInterval) clearInterval(checkInterval);
    }, 2500);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen, googleClientId]);

  // Render the official Google button
  useEffect(() => {
    if (!isOpen || !isGisReady || !googleBtnContainerRef.current || !googleClientId) return;

    try {
      window.google!.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: false,
        ux_mode: 'popup',
      });

      googleBtnContainerRef.current.innerHTML = '';
      window.google!.accounts.id.renderButton(googleBtnContainerRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 380,
      });
    } catch (err: any) {
      console.error('GIS init error:', err);
      setErrorMsg('Could not load Google Sign-In. Close this dialog to use email and password, or configure Google OAuth.');
      setGoogleSdkTimedOut(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isGisReady, googleClientId]);

  if (!isOpen) return null;

  // ─── CORE AUTH FLOW ───────────────────────────────────────────────────────
  // Called by Google Identity Services after account selection
  const handleGoogleCredentialResponse = async (response: any) => {
    console.log('[Nexus] GIS callback fired, credential present:', !!response?.credential);

    if (!response?.credential) {
      setErrorMsg('Google did not return a credential. Please try again or use email and password sign-in.');
      return;
    }
    doLogin({ credential: response.credential });
  };

  // The API only accepts cryptographically verified Google ID tokens.
  const doLogin = async (payload: Record<string, string>) => {
    setIsLoading(true);
    setErrorMsg(null);
    console.log('[Nexus] Sending login payload to /api/auth/google', Object.keys(payload));

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      if (typeof data.token !== 'string' || !data.token) throw new Error('Google sign-in did not return a valid session. Please try again.');

      // Persist session
      localStorage.setItem('nexus_token', data.token);
      localStorage.setItem('nexus_user', JSON.stringify(data.user));
      localStorage.setItem('nexus_workspace', JSON.stringify(data.workspace));

      if (data.requiresOnboarding) {
        setOnboardingToken(data.token);
        setCompanyName('');
        setRequiresOnboarding(true);
        setIsLoading(false);
        return;
      }

      const wsName = data.workspace?.name || `${data.user?.name || 'My'}'s Workspace`;
      setSuccessMsg(`✓ Signed in as ${data.user?.name || data.user?.email}. Entering workspace...`);

      // Navigate — call onSuccess + force hash navigation as belt-and-suspenders
      console.log('[Nexus] Navigating to workspace:', wsName);
      setTimeout(() => {
        onSuccessRef.current(wsName);   // triggers App.tsx handleLoginSuccess → setCurrentView('workspace')
        window.location.hash = 'workspace'; // belt-and-suspenders direct nav
      }, 600);
    } catch (err: any) {
      console.error('[Nexus] Login error:', err);
      setErrorMsg(err.message || 'Sign-in failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleOnboardingSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onboardingToken) {
      setErrorMsg('Your sign-in session is missing. Refresh this page and sign in again.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/workspace/onboarding', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${onboardingToken}`,
        },
        body: JSON.stringify({ companyName, website: companyWebsite, industry, companySize, country }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save your company profile.');

      const savedUser = JSON.parse(localStorage.getItem('nexus_user') || '{}');
      localStorage.setItem('nexus_user', JSON.stringify({ ...savedUser, workspaceName: data.workspace.name }));
      localStorage.setItem('nexus_workspace', JSON.stringify(data.workspace));
      setSuccessMsg(`Company profile saved. Welcome to ${data.workspace.name}!`);
      setRequiresOnboarding(false);
      setTimeout(() => {
        onSuccessRef.current(data.workspace.name);
        window.location.hash = 'workspace';
      }, 600);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save your company profile.');
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={(e) => { if (e.target === e.currentTarget && !isLoading && !requiresOnboarding) onClose(); }}
    >
      <div className="max-h-[90vh] w-full max-w-[420px] overflow-y-auto rounded-2xl border border-neutral-200 bg-white text-neutral-900 shadow-2xl dark:border-neutral-800 dark:bg-[#111216] dark:text-neutral-100">

        {/* ── Header ── */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-neutral-200 shadow-sm shrink-0">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight text-neutral-900 dark:text-white">Sign in with Google</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Continue to your Nexus CRM workspace</p>
            </div>
          </div>
          {!isLoading && !requiresOnboarding && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ── Body ── */}
        <div className="p-6 space-y-5">

          {/* Error */}
          {errorMsg && (
            <div className="p-3 rounded-xl border border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success */}
          {successMsg && (
            <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              <p className="text-sm text-neutral-500">{requiresOnboarding ? 'Saving your company profile…' : 'Signing you in…'}</p>
            </div>
          ) : requiresOnboarding ? (
            <form onSubmit={handleOnboardingSubmit} className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold">Tell us about your company</h4>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                  This creates your workspace profile. Your CRM starts empty, without sample companies or deals.
                </p>
              </div>
              <label className="block text-xs font-medium">
                Company name *
                <input required maxLength={100} autoFocus value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Your company name" className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-white/[0.04]" />
              </label>
              <label className="block text-xs font-medium">
                Company website
                <input type="url" value={companyWebsite} onChange={(event) => setCompanyWebsite(event.target.value)} placeholder="https://example.com" className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-white/[0.04]" />
              </label>
              <label className="block text-xs font-medium">
                Industry
                <input maxLength={100} value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder="e.g. Software, healthcare, retail" className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-white/[0.04]" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-medium">
                  Company size
                  <select value={companySize} onChange={(event) => setCompanySize(event.target.value)} className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-[#111216]">
                    {['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'].map((size) => <option key={size} value={size}>{size} employees</option>)}
                  </select>
                </label>
                <label className="block text-xs font-medium">
                  Country
                  <input maxLength={100} value={country} onChange={(event) => setCountry(event.target.value)} placeholder="Country" className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-white/[0.04]" />
                </label>
              </div>
              <button type="submit" className="w-full rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 dark:bg-white dark:text-neutral-950">
                Create my workspace
              </button>
            </form>
          ) : (
            <>
              {/* Official Google Button */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider text-center">
                  Authenticate with Google
                </p>
                <div className="flex justify-center min-h-[44px]">
                  {isGisReady && googleClientId ? (
                    <div ref={googleBtnContainerRef} id="google-official-btn-slot" />
                  ) : googleConfigError ? (
                    <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                      <p>{googleConfigError}</p>
                      <p className="mt-2">
                        In Google Cloud Console, create a Web application OAuth client and add this app’s origin to Authorized JavaScript origins. Put its client ID in <code className="font-mono">GOOGLE_CLIENT_ID</code> in <code className="font-mono">.env</code>, then restart Nexus.
                      </p>
                      <a className="mt-2 inline-block font-semibold underline" href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer">
                        Open Google Cloud credentials
                      </a>
                      <p className="mt-2">Or close this dialog and sign in with your email and password.</p>
                    </div>
                  ) : googleSdkTimedOut ? (
                    <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                      Google Identity Services did not load. Check your network or browser extensions, then retry. You can also use email and password sign-in.
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Loading Google Sign-In…</span>
                    </div>
                  )}
                </div>
              </div>

            </>
          )}

          {/* Trust bar */}
          <div className="flex items-center justify-center gap-4 pt-1 border-t border-neutral-100 dark:border-neutral-800">
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Verified OAuth 2.0
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <Lock className="h-3 w-3" />
              End-to-end encrypted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
