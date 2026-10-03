import { useState } from 'react';
import { Workflow, Play, CheckCircle2, ArrowDown, Zap, Filter, MessageSquare, CheckSquare, Sparkles, RefreshCw } from 'lucide-react';
import { SAMPLE_WORKFLOW } from '../data/mockCrmData';

export function WorkflowSection() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [workflowLog, setWorkflowLog] = useState<string[]>([]);

  const runSimulation = () => {
    setIsSimulating(true);
    setWorkflowLog([]);
    setActiveStep(0);

    const logs = [
      'Event detected: Deal #deal-1 transitioned stage to "won"',
      'Condition passed: ARR $148,000 >= threshold $50,000',
      'Webhook delivered: #executive-deals notified with win card',
      'Linear sync: Created project "Linear Systems Onboarding" (CS-104)',
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setActiveStep(index);
        setWorkflowLog((prev) => [...prev, log]);
        if (index === logs.length - 1) {
          setIsSimulating(false);
        }
      }, (index + 1) * 600);
    });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-6 mb-12">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-neutral-300 mb-2">
            <Workflow className="h-3.5 w-3.5 text-neutral-300" />
            <span>Visual Workflow Engine</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl" style={{ textWrap: 'balance' }}>
            Automate revenue operations without writing glue code
          </h2>
          <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
            Build reactive, event-driven pipelines triggered by CRM lifecycle changes. Connect native objects to Slack, Linear, webhooks, or custom serverless functions.
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={isSimulating}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-bold text-black hover:bg-neutral-200 transition-colors shadow-lg active:scale-95 disabled:opacity-50"
        >
          {isSimulating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-black" />}
          <span>{isSimulating ? 'Simulating Pipeline...' : 'Test Run Workflow'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Node Flow Canvas */}
        <div className="lg:col-span-7 space-y-4">
          {SAMPLE_WORKFLOW.map((node, index) => {
            const isCurrent = activeStep === index;
            const isCompleted = activeStep !== null && activeStep > index;

            return (
              <div key={node.id} className="relative">
                {/* Node Box */}
                <div
                  className={`rounded-xl border p-4.5 transition-all ${
                    isCurrent
                      ? 'border-white bg-[#15161c] shadow-lg shadow-white/5 ring-1 ring-white/20'
                      : isCompleted
                      ? 'border-emerald-500/40 bg-[#0f1214]'
                      : 'border-white/10 bg-[#0d0e12]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-mono font-bold ${
                          isCompleted
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : isCurrent
                            ? 'bg-white text-black border-white'
                            : 'bg-white/5 border-white/10 text-neutral-400'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : `0${index + 1}`}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{node.title}</span>
                        </h4>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{node.subtitle}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-neutral-500 border border-white/10 px-2 py-0.5 rounded">
                      {node.badge}
                    </span>
                  </div>

                  {/* Config parameters */}
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono text-neutral-400 bg-black/30 p-2 rounded border border-white/[0.04]">
                    {Object.entries(node.config).map(([k, v]) => (
                      <span key={k}>
                        <span className="text-neutral-500">{k}:</span> <span className="text-neutral-200">{v}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Connector Arrow */}
                {index < SAMPLE_WORKFLOW.length - 1 && (
                  <div className="flex justify-center my-1.5">
                    <ArrowDown className="h-3.5 w-3.5 text-neutral-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Execution Log & Trigger Simulator */}
        <div className="lg:col-span-5">
          <div className="rounded-xl border border-white/10 bg-[#08090b] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#0f1014]">
              <span className="text-xs font-mono text-neutral-300">Live Workflow Execution Logs</span>
              <span className="text-[10px] text-neutral-500 font-mono">Engine: BullMQ / Redis</span>
            </div>

            <div className="p-4 font-mono text-xs space-y-2 min-h-[280px]">
              {workflowLog.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center text-neutral-500 space-y-2">
                  <Workflow className="h-6 w-6 stroke-1 text-neutral-600" />
                  <p className="text-[11px]">Click "Test Run Workflow" above to watch this event pipeline execute in real time.</p>
                </div>
              ) : (
                workflowLog.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed text-neutral-300 animate-in fade-in duration-200">
                    <span className="text-emerald-400 shrink-0 font-bold">✓</span>
                    <span>{log}</span>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-white/10 px-4 py-2.5 bg-[#0c0d10] flex items-center justify-between text-[11px] text-neutral-500">
              <span>Automatic exponential backoff retries</span>
              <span>100% Guaranteed Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
