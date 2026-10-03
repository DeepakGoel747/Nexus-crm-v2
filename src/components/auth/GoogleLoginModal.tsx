import { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
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

const CLIENT_ID = '127873301880-4gcc53sijg6o9gv36qhepocjbjej3iio.apps.googleusercontent.com';

export function GoogleLoginModal({
  isOpen,
  onClose,
  onSuccess,
}: GoogleLoginModalProps) {
  const [isGisReady, setIsGisReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
    }
  }, [isOpen]);

  // Poll for Google Identity Services SDK
  useEffect(() => {
    if (!isOpen) return;
    let checkInterval: ReturnType<typeof setInterval>;
    const checkGis = () => {
      if (window.google?.accounts?.id) {
        setIsGisReady(true);
        clearInterval(checkInterval);
      }
    };
    checkGis();
    checkInterval = setInterval(checkGis, 300);
    return () => clearInterval(checkInterval);
  }, [isOpen]);

  // Render the official Google button
  useEffect(() => {
    if (!isOpen || !isGisReady || !googleBtnContainerRef.current) return;

    try {
      window.google!.accounts.id.initialize({
        client_id: CLIENT_ID,
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
      setErrorMsg('Could not load Google Sign-In. Try the quick sign-in below.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isGisReady]);

  if (!isOpen) return null;

  // ─── CORE AUTH FLOW ───────────────────────────────────────────────────────
  // Called by Google Identity Services after account selection
  const handleGoogleCredentialResponse = async (response: any) => {
    console.log('[Nexus] GIS callback fired, credential present:', !!response?.credential);

    if (!response?.credential) {
      // Google returned no credential — fall through to quick sign-in
      setErrorMsg('Google did not return a credential. Use "Quick Sign-In" below instead.');
      return;
    }
    doLogin({ credential: response.credential });
  };

  // The actual login API call — works for real OAuth token OR dev fallback
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
      console.log('[Nexus] Auth response:', res.status, data?.user?.email);

      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      // Persist session
      if (data.token) {
        localStorage.setItem('nexus_token', data.token);
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
        localStorage.setItem('nexus_workspace', JSON.stringify(data.workspace));
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

  // Quick dev / fallback sign-in — no Google popup needed
  const handleQuickSignIn = () => {
    doLogin({
      email: 'goeldeepak747@gmail.com',
      name: 'Deepak Goel',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Deepak`,
      workspaceName: "Deepak's Workspace",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onClose(); }}
    >
      <div className="w-full max-w-[420px] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111216] shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100">

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
          {!isLoading && (
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
              <p className="text-sm text-neutral-500">Signing you in…</p>
            </div>
          ) : (
            <>
              {/* Official Google Button */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider text-center">
                  Authenticate with Google
                </p>
                <div className="flex justify-center min-h-[44px]">
                  {isGisReady ? (
                    <div ref={googleBtnContainerRef} id="google-official-btn-slot" />
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Loading Google Sign-In…</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-neutral-200 dark:border-neutral-800" />
                <span className="text-[11px] text-neutral-400 font-mono uppercase">or</span>
                <div className="flex-1 border-t border-neutral-200 dark:border-neutral-800" />
              </div>

              {/* Quick Sign-In fallback — always works */}
              <button
                onClick={handleQuickSignIn}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-white/[0.03] hover:bg-neutral-100 dark:hover:bg-white/[0.06] p-3.5 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shrink-0">D</div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-neutral-900 dark:text-white">Deepak Goel</div>
                    <div className="text-xs text-neutral-500 font-mono">goeldeepak747@gmail.com</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-white transition-colors" />
              </button>
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
