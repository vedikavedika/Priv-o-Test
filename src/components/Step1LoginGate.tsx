import React, { useState } from 'react';
import { universityDb, StudentRecord } from '../studentDb.js';
import { ShieldCheck, ArrowRight, Mail, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

interface Step1LoginGateProps {
  onSuccess: (student: Omit<StudentRecord, 'password' | 'hasRegistered'>) => void;
}

export const Step1LoginGate: React.FC<Step1LoginGateProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = universityDb.authenticateStudent(email, password);
    if (result.success && result.student) {
      onSuccess(result.student);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('pass123');
    setErrorMsg(null);
  };

  return (
    <div className="glass-card p-8 sm:p-12 max-w-lg mx-auto transition-all duration-300">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Student Login</h2>
        <p className="text-sm text-slate-400 mt-2">Enter your university credentials to verify exam eligibility</p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs text-center font-medium animate-fadeIn">
          {errorMsg}
        </div>
      )}

      {/* Clean Form */}
      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Email Address</label>
          <div className="relative input-focus-glow rounded-xl transition-all">
            <Mail className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alice@university.edu"
              required
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Password</label>
          <div className="relative input-focus-glow rounded-xl transition-all">
            <Lock className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 px-6 gradient-bg-primary hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer text-base mt-2"
        >
          <span>Verify & Continue</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      {/* Quick Test Demo Chips */}
      <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-3">
          Quick Demo Login
        </span>
        <div className="flex flex-wrap gap-2 justify-center">
          {['alice@university.edu', 'bob@university.edu', 'charlie@university.edu'].map((demoEmail) => (
            <button
              key={demoEmail}
              type="button"
              onClick={() => handleQuickFill(demoEmail)}
              className="px-3 py-1.5 bg-slate-800/60 hover:bg-indigo-950/60 border border-slate-700/50 hover:border-indigo-500/40 rounded-lg text-slate-300 hover:text-indigo-300 text-xs font-mono transition-all cursor-pointer"
            >
              {demoEmail.split('@')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
