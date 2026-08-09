import React, { useState } from 'react';
import { Identity } from '@semaphore-protocol/core';
import { StudentRecord } from './studentDb.js';
import { Step1LoginGate } from './components/Step1LoginGate.js';
import { Step2Identity } from './components/Step2Identity.js';
import { Step3ProofGeneration } from './components/Step3ProofGeneration.js';
import { GraduationCap, CheckCircle, RotateCcw } from 'lucide-react';
import './styles.css';

export function App() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [authenticatedStudent, setAuthenticatedStudent] = useState<Omit<StudentRecord, 'password' | 'hasRegistered'> | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);

  const handleStep1Success = (student: Omit<StudentRecord, 'password' | 'hasRegistered'>) => {
    setAuthenticatedStudent(student);
    setCurrentStep(2);
  };

  const handleStep2IdentityCreated = (createdIdentity: Identity) => {
    setIdentity(createdIdentity);
    setCurrentStep(3);
  };

  const handleReset = () => {
    setCurrentStep(1);
    setAuthenticatedStudent(null);
    setIdentity(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-indigo-500 selection:text-white py-8">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto px-6 w-full flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 gradient-bg-primary rounded-2xl shadow-lg shadow-indigo-500/30">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center space-x-2">
              <span>Exam Portal</span>
              <span className="text-xs px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full font-mono font-medium">
                Semaphore V4
              </span>
            </h1>
            <p className="text-xs text-slate-400">Anonymous Student Eligibility & Proof Verification</p>
          </div>
        </div>

        {(authenticatedStudent || identity) && (
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white px-4 py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Flow</span>
          </button>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-6 w-full flex-grow flex flex-col justify-center">
        {/* Spacious Step Stepper Bar */}
        <div className="mb-12 max-w-md mx-auto w-full">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800/80 rounded-full -z-10" />

            {/* Step 1 Badge */}
            <div className="flex flex-col items-center space-y-2 bg-slate-950 px-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base transition-all duration-300 ${
                  currentStep >= 1
                    ? 'gradient-bg-primary text-white shadow-lg shadow-indigo-500/30 scale-105'
                    : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                {currentStep > 1 ? <CheckCircle className="w-6 h-6 text-white" /> : '1'}
              </div>
              <span className={`text-xs font-semibold ${currentStep >= 1 ? 'text-indigo-400' : 'text-slate-500'}`}>
                Login
              </span>
            </div>

            {/* Step 2 Badge */}
            <div className="flex flex-col items-center space-y-2 bg-slate-950 px-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base transition-all duration-300 ${
                  currentStep >= 2
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                    : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                {currentStep > 2 ? <CheckCircle className="w-6 h-6 text-white" /> : '2'}
              </div>
              <span className={`text-xs font-semibold ${currentStep >= 2 ? 'text-purple-400' : 'text-slate-500'}`}>
                Identity
              </span>
            </div>

            {/* Step 3 Badge */}
            <div className="flex flex-col items-center space-y-2 bg-slate-950 px-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base transition-all duration-300 ${
                  currentStep === 3
                    ? 'gradient-bg-success text-white shadow-lg shadow-emerald-500/30 scale-105'
                    : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                3
              </div>
              <span className={`text-xs font-semibold ${currentStep === 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
                ZK Proof
              </span>
            </div>
          </div>
        </div>

        {/* Step Views */}
        {currentStep === 1 && <Step1LoginGate onSuccess={handleStep1Success} />}
        {currentStep === 2 && authenticatedStudent && (
          <Step2Identity studentEmail={authenticatedStudent.email} onIdentityCreated={handleStep2IdentityCreated} />
        )}
        {currentStep === 3 && authenticatedStudent && identity && (
          <Step3ProofGeneration studentEmail={authenticatedStudent.email} identity={identity} />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="mt-12 text-center text-xs text-slate-400 font-medium">
        University Anonymous Exam System • Semaphore V4 Zero-Knowledge Protocol
      </footer>
    </div>
  );
}

export default App;
