import React, { useState } from 'react';
import { Identity } from '@semaphore-protocol/core';
import { ArrowRight, Check, Copy, Fingerprint, ShieldCheck, Sparkles } from 'lucide-react';

interface Step2IdentityProps {
  studentEmail: string;
  onIdentityCreated: (identity: Identity) => void;
  onContinue: () => void;
}

export const Step2Identity: React.FC<Step2IdentityProps> = ({ studentEmail, onIdentityCreated, onContinue }) => {
  const [createdIdentity, setCreatedIdentity] = useState<Identity | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateIdentity = () => {
    const identity = new Identity();
    setCreatedIdentity(identity);
    onIdentityCreated(identity);
  };

  const copyCommitment = async () => {
    if (!createdIdentity) return;
    await navigator.clipboard?.writeText(createdIdentity.commitment.toString());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="screen-content">
      <div className="screen-heading">
        <div className="screen-icon violet"><Fingerprint size={23} /></div>
        <div>
          <h2>Create your anonymous identity</h2>
          <p>A fresh Semaphore identity is generated locally in your browser.</p>
        </div>
      </div>

      <div className="identity-bridge">
        <div className="bridge-node real"><span className="node-icon">✓</span><div><small>Verified</small><strong>{studentEmail}</strong></div></div>
        <div className="bridge-arrow">→</div>
        <div className="bridge-node anon"><span className="node-icon"><Fingerprint size={15} /></span><div><small>Anonymous</small><strong>Cryptographic identity</strong></div></div>
      </div>

      {!createdIdentity ? (
        <div className="action-panel">
          <div className="illustration-orbit"><div className="orbit orbit-a" /><div className="orbit orbit-b" /><div className="orbit-core"><Fingerprint size={25} /></div></div>
          <h3>Separate who you are from what you prove</h3>
          <p>The generated identity becomes the credential used by the zero-knowledge layer. Your email is not included in the cryptographic commitment.</p>
          <button className="primary-button violet-button" onClick={handleGenerateIdentity}>
            <Sparkles size={17} /> Generate anonymous identity <ArrowRight size={17} />
          </button>
        </div>
      ) : (
        <div className="success-panel">
          <div className="success-heading"><div className="success-check"><Check size={19} /></div><div><strong>Anonymous identity created</strong><span>Generated locally • ready for group registration</span></div></div>
          <div className="commitment-card">
            <div className="commitment-top"><div><span className="mini-label">PUBLIC COMMITMENT</span><span className="safe-chip"><ShieldCheck size={11} /> Safe to register</span></div><button className="copy-button" onClick={copyCommitment}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}</button></div>
            <code>{createdIdentity.commitment.toString()}</code>
          </div>
          <div className="warning-note"><ShieldCheck size={16} /><span>Your secret identity remains in memory only. The group receives the public commitment, not your email or secret.</span></div>
          <button className="primary-button" onClick={onContinue}><span>Continue to proof</span><ArrowRight size={17} /></button>
        </div>
      )}
    </div>
  );
};
