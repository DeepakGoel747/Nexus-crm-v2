import { Github, Twitter, ArrowUpRight } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: 'home' | 'login' | 'docs' | 'changelog' | 'status' | 'legal', extra?: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-neutral-200 dark:border-white/[0.08] bg-[#f5f5f2] dark:bg-[#08090b] text-xs text-neutral-600 dark:text-neutral-400 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="col-span-2">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 text-base font-bold text-neutral-950 dark:text-white cursor-pointer"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-black text-white font-mono text-xs font-black">
                N
              </div>
              <span>Nexus</span>
            </button>
            <p className="mt-3 text-xs text-neutral-600 dark:text-neutral-400 max-w-xs leading-relaxed">
              The modern open-source CRM alternative to Salesforce. Full data ownership, sub-50ms query speeds, and native PostgreSQL.
            </p>
            <div className="mt-5 flex items-center gap-3 text-neutral-500">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-black dark:hover:text-white p-1" title="GitHub">
                <Github className="h-4 w-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-black dark:hover:text-white p-1" title="Twitter / X">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Column: Product */}
          <div>
            <h4 className="font-bold text-neutral-900 dark:text-white mb-3 uppercase tracking-wider text-[11px]">
              Product
            </h4>
            <ul className="space-y-2">
              <li><a href="#product-tour" className="hover:text-black dark:hover:text-white transition-colors">Interactive Tour</a></li>
              <li><a href="#architecture" className="hover:text-black dark:hover:text-white transition-colors">GraphQL & REST</a></li>
              <li><a href="#workflows" className="hover:text-black dark:hover:text-white transition-colors">Workflows Engine</a></li>
              <li><a href="#mcp-ai" className="hover:text-black dark:hover:text-white transition-colors">MCP Protocol Server</a></li>
              <li><a href="#comparison" className="hover:text-black dark:hover:text-white transition-colors">Nexus vs Salesforce</a></li>
              <li><a href="#self-host" className="hover:text-black dark:hover:text-white transition-colors">Docker Quickstart</a></li>
              <li><a href="#pricing" className="hover:text-black dark:hover:text-white transition-colors">Pricing Plans</a></li>
            </ul>
          </div>

          {/* Column: Resources */}
          <div>
            <h4 className="font-bold text-neutral-900 dark:text-white mb-3 uppercase tracking-wider text-[11px]">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('docs')}
                  className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Documentation
                </button>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                  <span>GitHub Repo</span>
                  <ArrowUpRight className="h-2.5 w-2.5" />
                </a>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('changelog')}
                  className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Changelog (v0.42)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('status')}
                  className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  System Status
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('login')}
                  className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Sign In Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Column: Security & Legal */}
          <div>
            <h4 className="font-bold text-neutral-900 dark:text-white mb-3 uppercase tracking-wider text-[11px]">
              Security & Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('legal', 'license')}
                  className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  AGPLv3 License
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('legal', 'security')}
                  className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Security Whitepaper
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('legal', 'soc2')}
                  className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  SOC2 Compliance
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('legal', 'privacy')}
                  className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('legal', 'terms')}
                  className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-neutral-300 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500">
          <span>© {new Date().getFullYear()} Nexus CRM, Inc. Licensed under AGPLv3. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Built with modern open web standards</span>
            <span>·</span>
            <span>Local-first architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
