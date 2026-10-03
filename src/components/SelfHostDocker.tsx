import { useState } from 'react';
import { Terminal, Copy, Check, Server, Shield, Cpu, HardDrive } from 'lucide-react';

export function SelfHostDocker() {
  const [copied, setCopied] = useState(false);

  const dockerComposeYaml = `version: '3.8'

services:
  nexus-server:
    image: nexus/nexus-server:latest
    container_name: nexus-server
    restart: always
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://nexus:secret@postgres:5432/nexus_crm
      - SERVER_URL=http://localhost:3000
      - JWT_SECRET=nexus_super_secret_signing_key_2026
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    container_name: nexus-postgres
    restart: always
    environment:
      POSTGRES_USER: nexus
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: nexus_crm
    volumes:
      - nexus_pgdata:/var/lib/postgresql/data

volumes:
  nexus_pgdata:`;

  const handleCopy = () => {
    navigator.clipboard.writeText(dockerComposeYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="self-host" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
      <div className="rounded-2xl border border-white/10 bg-[#0d0e12] p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Explanations */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-semibold text-neutral-400">Self-Hosting Quickstart</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white" style={{ textWrap: 'balance' }}>
              Spin up your own private CRM cluster in 60 seconds
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Run on your private cloud, Kubernetes cluster, or home lab. Complete data privacy, zero external telemetry pings, and automatic database migrations out of the box.
            </p>

            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-3 text-xs text-neutral-300">
                <Cpu className="h-4 w-4 text-neutral-400" />
                <span>Lightweight: Runs comfortably on 1 vCPU & 1.5GB RAM</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-300">
                <HardDrive className="h-4 w-4 text-neutral-400" />
                <span>PostgreSQL 15+ compatible with standard connection strings</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-300">
                <Shield className="h-4 w-4 text-neutral-400" />
                <span>Zero telemetry backdoors or phone-home tracking</span>
              </div>
            </div>
          </div>

          {/* Right Column: Code Window */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-white/10 bg-[#08090b] overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 bg-[#0f1014]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500/50" />
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400 ml-2">docker-compose.yml</span>
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied YAML' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-4 overflow-x-auto text-[11px] font-mono leading-relaxed text-neutral-300">
                <pre>
                  <code>{dockerComposeYaml}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
