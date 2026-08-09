import React, { useState } from 'react';
import { Identity } from '@semaphore-protocol/core';
import { StudentRecord } from './studentDb.js';
import { Step1LoginGate } from './components/Step1LoginGate.js';
import { Step2Identity } from './components/Step2Identity.js';
import { Step3ProofGeneration } from './components/Step3ProofGeneration.js';
import { ExamPortal } from './components/ExamPortal.js';
import { ScoreReveal } from './components/ScoreReveal.js';
import { ArrowRight, Award, Check, FileText, LockKeyhole, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import './styles.css';

export function App() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [authenticatedStudent, setAuthenticatedStudent] = useState<Omit<StudentRecord, 'password' | 'hasRegistered'> | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [submissionData, setSubmissionData] = useState<{ nullifierHash: string; chosenAnswers: string[]; studentSalt: string } | null>(null);

  const handleStep1Success = (student: Omit<StudentRecord, 'password' | 'hasRegistered'>) => {
    setAuthenticatedStudent(student);
    setCurrentStep(2);
  };

  const handleStep2IdentityCreated = (createdIdentity: Identity) => {
    setIdentity(createdIdentity);
  };

  const handleContinueToProof = () => setCurrentStep(3);

  const handleProceedToExam = () => setCurrentStep(4);

  const handleSubmittedSuccess = (data: { nullifierHash: string; chosenAnswers: string[]; studentSalt: string }) => {
    setSubmissionData(data);
    setCurrentStep(5);
  };

  const handleReset = () => {
    setCurrentStep(1);
    setAuthenticatedStudent(null);
    setIdentity(null);
    setSubmissionData(null);
  };

  const steps = [
    { number: 1, label: 'Authenticate', caption: 'Verify student', icon: LockKeyhole },
    { number: 2, label: 'Anonymize', caption: 'Create identity', icon: Sparkles },
    { number: 3, label: 'Prove', caption: 'Join & ZK proof', icon: ShieldCheck },
    { number: 4, label: 'Take Exam', caption: 'Submit answers', icon: FileText },
    { number: 5, label: 'Results', caption: 'Score reveal', icon: Award },
  ];

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="grid-overlay" />

      <header className="topbar page-width">
        <div className="brand">
          <div className="brand-mark"><ShieldCheck size={20} /></div>
          <div>
            <div className="brand-name">Priv<span>-o-</span>Test</div>
            <div className="brand-subtitle">Private exam verification</div>
          </div>
        </div>

        <div className="topbar-right">
          <div className="secure-pill"><span className="status-dot" /> Local & encrypted</div>
          {(authenticatedStudent || identity) && (
            <button className="ghost-button" onClick={handleReset} title="Restart the flow">
              <RotateCcw size={15} /> Reset
            </button>
          )}
        </div>
      </header>

      <main className="page-width main-content">
        <section className="hero-copy">
          <div className="eyebrow"><span>ZERO-KNOWLEDGE EXAM ACCESS</span></div>
          <h1>Prove you're eligible.<br /><em>Keep your identity private.</em></h1>
          <p>
            Priv-o-Test verifies your university credentials once, then separates your real identity
            from the cryptographic identity used for the exam.
          </p>
        </section>

        <div className="workspace">
          <aside className="journey-panel">
            <div className="journey-label">YOUR PRIVACY JOURNEY</div>
            <div className="journey-list">
              {steps.map((step, index) => {
                const active = currentStep === step.number;
                const complete = currentStep > step.number;
                const Icon = step.icon;
                return (
                  <React.Fragment key={step.number}>
                    <div className={`journey-step ${active ? 'active' : ''} ${complete ? 'complete' : ''}`}>
                      <div className="step-icon">
                        {complete ? <Check size={16} strokeWidth={3} /> : <Icon size={17} />}
                      </div>
                      <div>
                        <div className="step-label">{step.label}</div>
                        <div className="step-caption">{step.caption}</div>
                      </div>
                    </div>
                    {index < steps.length - 1 && <div className={`journey-line ${complete ? 'complete' : ''}`} />}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="privacy-note">
              <ShieldCheck size={18} />
              <div>
                <strong>Your identity stays yours</strong>
                <p>Your email authenticates eligibility. It is not used as your anonymous exam identity.</p>
              </div>
            </div>
          </aside>

          <section className="flow-card">
            <div className="flow-card-top">
              <div className="step-counter">STEP {currentStep} OF 5</div>
              {authenticatedStudent && (
                <div className="verified-chip"><Check size={13} /> Student verified</div>
              )}
            </div>

            {currentStep === 1 && <Step1LoginGate onSuccess={handleStep1Success} />}
            {currentStep === 2 && authenticatedStudent && (
              <Step2Identity
                studentEmail={authenticatedStudent.email}
                onIdentityCreated={handleStep2IdentityCreated}
                onContinue={handleContinueToProof}
              />
            )}
            {currentStep === 3 && authenticatedStudent && identity && (
              <Step3ProofGeneration
                studentEmail={authenticatedStudent.email}
                identity={identity}
                onProceedToExam={handleProceedToExam}
              />
            )}
            {currentStep === 4 && identity && (
              <ExamPortal
                examId="101"
                identity={identity}
                onSubmittedSuccess={handleSubmittedSuccess}
              />
            )}
            {currentStep === 5 && (
              <ScoreReveal
                examId="101"
                nullifierHash={submissionData?.nullifierHash}
                onResetFlow={handleReset}
              />
            )}

            {currentStep <= 3 && identity && (
              <div className="flow-footer-note"><ArrowRight size={14} /> Your proof can demonstrate group membership without revealing your student identity.</div>
            )}
          </section>
        </div>
      </main>

      <footer className="footer page-width">
        <span>Priv-o-Test</span>
        <span className="footer-separator">•</span>
        <span>Semaphore-powered zero-knowledge verification</span>
      </footer>
    </div>
  );
}

export default App;

