import React, { useState } from 'react';
import { Identity } from '@semaphore-protocol/core';
import { KeyRound, Sparkles, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

interface Step2IdentityProps {
  studentEmail: string;
  onIdentityCreated: (identity: Identity) => void;
}

export const Step2Identity: React.FC<Step2IdentityProps> = ({ studentEmail, onIdentityCreated }) => {
  const [createdIdentity, setCreatedIdentity] = useState<Identity | null>(null);

  const handleGenerateIdentity = () => {
    const identity = new Identity();
    setCreatedIdentity(identity);
    onIdentityCreated(identity);
  };

  return (
    <div className="glass-card p-8 sm:p-12 max-w-lg mx-auto text-center transition-all duration-300">
      {/* Header */}
      <div className="inline-flex p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400 mb-4 shadow-lg shadow-purple-500/10">
        <KeyRound className="w-10 h-10" />
      </div>
      <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Semaphore Identity</h2>
      <p className="text-sm text-slate-400 mt-2">
        Generate your anonymous cryptographic identity locally inside your browser
      </p>

      {/* Authenticated Banner */}
      <div className="my-6 p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl inline-flex items-center space-x-2 text-xs text-slate-300">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Verified Student: <strong className="text-white font-mono">{studentEmail}</strong></span>
      </div>

      {!createdIdentity ? (
        <div className="mt-4">
          <button
            onClick={handleGenerateIdentity}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer text-base"
          >
            <Sparkles className="w-5 h-5" />
            <span>Generate Local Identity</span>
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-6 text-left">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-3 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>Local Identity Created Successfully!</span>
          </div>

          {/* Public Commitment Display */}
          <div className="p-5 bg-slate-900/90 border border-purple-500/20 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Public Commitment Leaf</span>
              <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full font-mono">
                Safe to Register
              </span>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-purple-200 break-all select-all">
              {createdIdentity.commitment.toString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
