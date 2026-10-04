import { useState } from 'react';
import { 
  Github, 
  Menu, 
  X, 
  ArrowUpRight, 
  ChevronDown, 
  Database, 
  Layers, 
  Workflow, 
  Bot, 
  Code2, 
  Terminal, 
  Sun, 
  Moon,
  FileText,
  Activity,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  onOpenDemo: () => void;
  onOpenCommand: () => void;
  onNavigate: (view: 'home' | 'workspace' | 'login' | 'docs' | 'changelog' | 'status' | 'legal') => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function Navbar({ onOpenDemo, onOpenCommand, onNavigate, isDark, onToggleTheme }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'product' | 'resources' | null>(null);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#090a0b]/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single Brand Icon/Wordmark (Exact match of Twenty's [20] black box) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-white font-mono text-xs font-black shadow-sm group-hover:scale-95 transition-transform">
              N
            </div>
            <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">
              Nexus
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links with uppercase tracking & vertical dividers '|' as seen in screenshot */}
        <nav className="hidden lg:flex items-center gap-4 text-[11px] font-bold tracking-widest uppercase text-neutral-600 dark:text-neutral-400">
          {/* PRODUCT DROPDOWN */}
          <div 
            className="relative"
            onMouseEnter={() => setActiveDropdown('product')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'product' ? null : 'product')}
              className="flex items-center gap-1 hover:text-black dark:hover:text-white transition-colors py-2 cursor-pointer"
            >
              <span>PRODUCT</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${activeDropdown === 'product' ? 'rotate-180' : ''}`} />
            </button>

            {activeDropdown === 'product' && (
              <div className="absolute left-0 top-full mt-0.5 w-64 rounded-xl border border-neutral-200 dark:border-white/15 bg-white dark:bg-[#101116] p-2 shadow-2xl z-50 text-left normal-case tracking-normal">
                <a
                  href="#problem"
                  onClick={() => {
                    onNavigate('home');
                    setActiveDropdown(null);
                  }}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.05] transition-colors"
                >
                  <Layers className="h-4 w-4 text-neutral-700 dark:text-neutral-300 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">The Problem & Solution</p>
                    <p className="text-[11px] text-neutral-500">Break free from legacy monoliths</p>
                  </div>
                </a>
                <a
                  href="#product-tour"
                  onClick={() => {
                    onNavigate('home');
                    setActiveDropdown(null);
                  }}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.05] transition-colors"
                >
                  <Database className="h-4 w-4 text-neutral-700 dark:text-neutral-300 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">Interactive Workspace</p>
                    <p className="text-[11px] text-neutral-500">Live tables, Kanbans, and drawers</p>
                  </div>
                </a>
                <a
                  href="#workflows"
                  onClick={() => {
                    onNavigate('home');
                    setActiveDropdown(null);
                  }}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.05] transition-colors"
                >
                  <Workflow className="h-4 w-4 text-neutral-700 dark:text-neutral-300 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">Workflow Automations</p>
                    <p className="text-[11px] text-neutral-500">Event-driven pipelines</p>
                  </div>
                </a>
                <a
                  href="#mcp-ai"
                  onClick={() => {
                    onNavigate('home');
                    setActiveDropdown(null);
                  }}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.05] transition-colors"
                >
                  <Bot className="h-4 w-4 text-neutral-700 dark:text-neutral-300 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">Native MCP Server</p>
                    <p className="text-[11px] text-neutral-500">Claude & Cursor AI agents</p>
                  </div>
                </a>
              </div>
            )}
          </div>

          <span className="text-neutral-300 dark:text-neutral-700 select-none">|</span>

          {/* RESOURCES DROPDOWN */}
          <div 
            className="relative"
            onMouseEnter={() => setActiveDropdown('resources')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'resources' ? null : 'resources')}
              className="flex items-center gap-1 hover:text-black dark:hover:text-white transition-colors py-2 cursor-pointer"
            >
              <span>RESOURCES</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${activeDropdown === 'resources' ? 'rotate-180' : ''}`} />
            </button>

            {activeDropdown === 'resources' && (
              <div className="absolute left-0 top-full mt-0.5 w-60 rounded-xl border border-neutral-200 dark:border-white/15 bg-white dark:bg-[#101116] p-2 shadow-2xl z-50 text-left normal-case tracking-normal">
                <button
                  onClick={() => {
                    onNavigate('docs');
                    setActiveDropdown(null);
                  }}
                  className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.05] transition-colors text-left cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-neutral-700 dark:text-neutral-300 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">Documentation</p>
                    <p className="text-[11px] text-neutral-500">Guides, APIs, and schemas</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onNavigate('changelog');
                    setActiveDropdown(null);
                  }}
                  className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.05] transition-colors text-left cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-neutral-700 dark:text-neutral-300 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">Changelog</p>
                    <p className="text-[11px] text-neutral-500">Latest v0.42 release notes</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onNavigate('status');
                    setActiveDropdown(null);
                  }}
                  className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.05] transition-colors text-left cursor-pointer"
                >
                  <Activity className="h-4 w-4 text-neutral-700 dark:text-neutral-300 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">System Status</p>
                    <p className="text-[11px] text-neutral-500">Realtime cluster uptime</p>
                  </div>
                </button>
                <a
                  href="#self-host"
                  onClick={() => {
                    onNavigate('home');
                    setActiveDropdown(null);
                  }}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.05] transition-colors"
                >
                  <Terminal className="h-4 w-4 text-neutral-700 dark:text-neutral-300 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">Docker Self-Hosting</p>
                    <p className="text-[11px] text-neutral-500">Run private cluster</p>
                  </div>
                </a>
              </div>
            )}
          </div>

          <span className="text-neutral-300 dark:text-neutral-700 select-none">|</span>

          <a href="#comparison" onClick={() => onNavigate('home')} className="hover:text-black dark:hover:text-white transition-colors">
            COMPARISON
          </a>

          <span className="text-neutral-300 dark:text-neutral-700 select-none">|</span>

          <a href="#pricing" onClick={() => onNavigate('home')} className="hover:text-black dark:hover:text-white transition-colors">
            PRICING
          </a>
        </nav>

        {/* Zone 3: Primary Actions (GitHub link, Log In, Get Started, Theme Toggle) */}
        <div className="hidden lg:flex items-center gap-3">
          {/* GitHub Link */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors mr-1"
          >
            <span>GITHUB</span>
            <ArrowUpRight className="h-3 w-3" />
          </a>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-md border border-neutral-200 dark:border-white/10 text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          {/* LOG IN button */}
          <button
            onClick={() => onNavigate('login')}
            className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            LOG IN
          </button>

          {/* OPEN WORKSPACE button */}
          <button
            onClick={() => onNavigate('workspace')}
            className="rounded-md border border-purple-500/40 bg-purple-500/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300 hover:bg-purple-500/20 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="h-3 w-3 text-purple-500" />
            <span>OPEN CRM</span>
          </button>

          {/* GET STARTED button */}
          <button
            onClick={onOpenDemo}
            className="rounded-md bg-neutral-950 dark:bg-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white dark:text-neutral-950 hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            GET STARTED
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded border border-neutral-200 dark:border-white/10 text-neutral-500"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-neutral-600 dark:text-neutral-400"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0c0d0e] px-4 py-4 space-y-3">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('login');
            }}
            className="w-full text-left block text-sm font-bold text-neutral-900 dark:text-white"
          >
            Log In to Workspace
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('docs');
            }}
            className="w-full text-left block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Documentation
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('changelog');
            }}
            className="w-full text-left block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Changelog
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('status');
            }}
            className="w-full text-left block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            System Status
          </button>
          <a
            href="#product-tour"
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('home');
            }}
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Interactive Workspace
          </a>
          <a
            href="#pricing"
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('home');
            }}
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Pricing
          </a>
          <div className="pt-3 border-t border-neutral-200 dark:border-white/10 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('workspace');
              }}
              className="w-full rounded-md border border-purple-500/40 bg-purple-500/10 py-2 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 text-center"
            >
              Open CRM Workspace
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDemo();
              }}
              className="w-full rounded-md bg-neutral-950 dark:bg-white py-2 text-xs font-bold uppercase tracking-wider text-white dark:text-neutral-950 text-center"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
