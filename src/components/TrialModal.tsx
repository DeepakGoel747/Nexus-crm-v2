import { useState } from 'react';
import { X, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

interface TrialModalProps {
  isOpen: boolean;
  selectedPlan: string;
  onClose: () => void;
}

export function TrialModal({ isOpen, selectedPlan, onClose }: TrialModalProps) {
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-white/15 bg-[#111216] p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {!submitted ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-5 rounded bg-white text-black font-mono font-black text-xs flex items-center justify-center">
                N
              </div>
              <span className="text-xs font-semibold text-neutral-400">Nexus Cloud · {selectedPlan || 'Free Trial'}</span>
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">
              Create your Nexus CRM workspace
            </h3>
            <p className="mt-1 text-xs text-neutral-400">
              No credit card required. 14 days of full access with automated daily backups.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/[0.04] p-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Company / Workspace Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/[0.04] p-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-md bg-white py-2.5 font-bold text-black hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Provisioning instance...</span>
                  ) : (
                    <>
                      <span>Get Instant Access</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 pt-1">
                <ShieldCheck className="h-3 w-3 text-neutral-400" />
                <span>AGPLv3 Open Source Core · SOC2 Type II Certified</span>
              </div>
            </form>
          </div>
        ) : (
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Your Workspace is Ready!</h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              We've created a temporary sandboxed workspace for <span className="text-white font-medium">{companyName}</span> ({email}).
            </p>
            <div className="pt-3">
              <button
                onClick={onClose}
                className="w-full rounded-md bg-white py-2 text-xs font-semibold text-black hover:bg-neutral-200"
              >
                Back to Website
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
