import React, { useState } from 'react';
import { universityDb, StudentRecord } from '../studentDb.js';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';

interface Step1LoginGateProps {
  onSuccess: (student: Omit<StudentRecord, 'password' | 'hasRegistered'>) => void;
}

export const Step1LoginGate: React.FC<Step1LoginGateProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const result = universityDb.authenticateStudent(email, password);
    window.setTimeout(() => {
      setIsSubmitting(false);
      if (result.success && result.student) onSuccess(result.student);
      else setErrorMsg(result.message);
    }, 350);
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('pass123');
    setErrorMsg(null);
  };

  return (
    <div className="screen-content">
      <div className="screen-heading">
        <div className="screen-icon blue"><LockKeyhole size={23} /></div>
        <div>
          <h2>Verify your student identity</h2>
          <p>Use your university credentials to establish exam eligibility.</p>
        </div>
      </div>

      <div className="trust-strip">
        <ShieldCheck size={17} />
        <span>Authentication is used only to verify eligibility before anonymity is established.</span>
      </div>

      {errorMsg && <div className="error-banner">{errorMsg}</div>}

      <form onSubmit={handleLogin} className="auth-form">
        <div className="field-group">
          <label htmlFor="email">University email</label>
          <div className="input-wrap">
            <Mail size={17} />
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alice@university.edu" required autoComplete="username" />
          </div>
        </div>

        <div className="field-group">
          <div className="field-label-row"><label htmlFor="password">Password</label><span>University account</span></div>
          <div className="input-wrap">
            <LockKeyhole size={17} />
            <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password" />
            <button type="button" className="input-action" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <span className="spinner" /> : <UserRound size={17} />}
          <span>{isSubmitting ? 'Verifying credentials…' : 'Verify & continue'}</span>
          {!isSubmitting && <ArrowRight size={17} />}
        </button>
      </form>

      <div className="demo-section">
        <div className="demo-label">Demo accounts</div>
        <div className="demo-grid">
          {['alice@university.edu', 'bob@university.edu'].map((account) => (
            <button key={account} className="demo-account" onClick={() => handleQuickFill(account)} type="button">
              <span className="avatar">{account[0].toUpperCase()}</span>
              <span>{account.split('@')[0]}</span>
              <span className="demo-arrow">↗</span>
            </button>
          ))}
        </div>
        <p className="demo-hint">Demo password: <code>pass123</code></p>
      </div>
    </div>
  );
};
