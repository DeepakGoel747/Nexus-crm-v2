import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProblemSection } from './components/ProblemSection';
import { InteractiveCrmPreview } from './components/InteractiveCrmPreview';
import { FeatureBento } from './components/FeatureBento';
import { WorkflowSection } from './components/WorkflowSection';
import { McpAiSection } from './components/McpAiSection';
import { ComparisonTable } from './components/ComparisonTable';
import { SelfHostDocker } from './components/SelfHostDocker';
import { Pricing } from './components/Pricing';
import { Faq } from './components/Faq';
import { Footer } from './components/Footer';
import { CommandPalette } from './components/CommandPalette';
import { TrialModal } from './components/TrialModal';

// Dedicated Sub-Pages
import { LoginPage } from './components/pages/LoginPage';
import { DocsPage } from './components/pages/DocsPage';
import { ChangelogPage } from './components/pages/ChangelogPage';
import { StatusPage } from './components/pages/StatusPage';
import { LegalPage } from './components/pages/LegalPage';
import { FullCrmWorkspace } from './components/workspace/FullCrmWorkspace';

export type AppView = 'home' | 'workspace' | 'login' | 'docs' | 'changelog' | 'status' | 'legal';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [legalTab, setLegalTab] = useState<'license' | 'security' | 'soc2' | 'privacy' | 'terms'>('license');
  const [isTrialOpen, setIsTrialOpen] = useState(false);
  const [trialPlan, setTrialPlan] = useState('Cloud');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isDark, setIsDark] = useState(false); // Clean light mode matching Twenty rebrand screenshot
  const [userNotification, setUserNotification] = useState<string | null>(null);

  // Sync with browser hash for intuitive navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['workspace', 'login', 'docs', 'changelog', 'status', 'legal'].includes(hash)) {
        setCurrentView(hash as AppView);
      } else {
        setCurrentView('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial check
    const initialHash = window.location.hash.replace('#', '');
    if (['workspace', 'login', 'docs', 'changelog', 'status', 'legal'].includes(initialHash)) {
      setCurrentView(initialHash as AppView);
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Global keydown for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigateTo = (view: AppView, extra?: string) => {
    if (extra && view === 'legal') {
      setLegalTab(extra as any);
    }
    setCurrentView(view);
    window.location.hash = view === 'home' ? '' : view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToDemo = () => {
    if (currentView !== 'home') {
      setCurrentView('home');
      window.location.hash = '';
      setTimeout(() => {
        const el = document.getElementById('product-tour');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('product-tour');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectPlan = (plan: string) => {
    setTrialPlan(plan);
    setIsTrialOpen(true);
  };

  const handleCommandAction = (actionType: string, payload?: any) => {
    if (actionType === 'scroll_product') {
      scrollToDemo();
    } else if (actionType === 'open_cmd') {
      setIsCommandOpen(true);
    }
  };

  const handleLoginSuccess = (workspace: string) => {
    setUserNotification(`Logged in successfully to ${workspace}`);
    setCurrentView('workspace');
    window.location.hash = 'workspace';
    setTimeout(() => {
      setUserNotification(null);
    }, 5000);
  };

  // ROUTE 0: FULL STANDALONE TWENTY CRM WORKSPACE
  if (currentView === 'workspace') {
    return (
      <FullCrmWorkspace
        onBackToWebsite={() => navigateTo('home')}
        onSignOut={() => {
          setCurrentView('login');
          window.location.hash = 'login';
        }}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onOpenCommand={() => setIsCommandOpen(true)}
      />
    );
  }

  // ROUTE 1: LOGIN PAGE
  if (currentView === 'login') {
    return (
      <LoginPage
        onBackToHome={() => navigateTo('home')}
        onLoginSuccess={handleLoginSuccess}
        isDark={isDark}
      />
    );
  }

  // ROUTE 2: DOCUMENTATION PAGE
  if (currentView === 'docs') {
    return (
      <DocsPage
        onBackToHome={() => navigateTo('home')}
        isDark={isDark}
      />
    );
  }

  // ROUTE 3: CHANGELOG PAGE
  if (currentView === 'changelog') {
    return (
      <ChangelogPage
        onBackToHome={() => navigateTo('home')}
        isDark={isDark}
      />
    );
  }

  // ROUTE 4: SYSTEM STATUS PAGE
  if (currentView === 'status') {
    return (
      <StatusPage
        onBackToHome={() => navigateTo('home')}
        isDark={isDark}
      />
    );
  }

  // ROUTE 5: SECURITY & LEGAL PAGE
  if (currentView === 'legal') {
    return (
      <LegalPage
        initialTab={legalTab}
        onBackToHome={() => navigateTo('home')}
        isDark={isDark}
      />
    );
  }

  // ROUTE 0: MAIN HOME LANDING PAGE
  return (
    <div
      className={`min-h-screen font-sans antialiased transition-colors duration-200 ${
        isDark
          ? 'dark bg-[#090a0b] text-[#ededed] selection:bg-white/20 selection:text-white'
          : 'bg-[#faf9f6] text-[#141518] selection:bg-black/10 selection:text-black'
      }`}
    >
      {/* Toast Notification if logged in */}
      {userNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md px-4 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top duration-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{userNotification}</span>
        </div>
      )}

      {/* Top Navigation with Mega Menus and Theme Switcher */}
      <Navbar
        onOpenDemo={scrollToDemo}
        onOpenCommand={() => setIsCommandOpen(true)}
        onNavigate={navigateTo}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      {/* Hero Section */}
      <main>
        <Hero
          onScrollToDemo={scrollToDemo}
          onOpenQuickStart={() => {
            const el = document.getElementById('self-host');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* The Problem & Solution section from Twenty's rebrand */}
        <div id="problem">
          <ProblemSection isDark={isDark} />
        </div>

        {/* Live Interactive CRM Workspace (rebrand centerpiece) */}
        <InteractiveCrmPreview
          onOpenCommand={() => setIsCommandOpen(true)}
        />

        {/* Core Architecture & Relational Data Model Bento */}
        <FeatureBento />

        {/* Visual Workflow Automation Engine */}
        <div id="workflows">
          <WorkflowSection />
        </div>

        {/* Native Model Context Protocol (MCP) & AI Agents */}
        <div id="mcp-ai">
          <McpAiSection />
        </div>

        {/* Head-to-Head Comparison: Nexus vs Salesforce vs HubSpot */}
        <ComparisonTable />

        {/* Self-Hosting 60-Second Docker Quickstart */}
        <SelfHostDocker />

        {/* Transparent Pricing Plans */}
        <Pricing onSelectPlan={handleSelectPlan} />

        {/* Frequently Asked Questions */}
        <Faq />
      </main>

      {/* Modern Minimalist Footer with fully wired sub-pages */}
      <Footer onNavigate={navigateTo} />

      {/* Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onSelectAction={handleCommandAction}
      />

      {/* Free Trial / Provisioning Lead Modal */}
      <TrialModal
        isOpen={isTrialOpen}
        selectedPlan={trialPlan}
        onClose={() => setIsTrialOpen(false)}
      />
    </div>
  );
}
