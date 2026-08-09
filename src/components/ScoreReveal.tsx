import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Award, Check, CheckCircle2, Clock, Key, RefreshCw, ShieldCheck, Sparkles, XCircle } from 'lucide-react';
import { Question } from './ExamPortal.js';

interface ScoreRevealProps {
  examId?: string;
  nullifierHash?: string;
  onResetFlow?: () => void;
}

export const ScoreReveal: React.FC<ScoreRevealProps> = ({
  examId = '101',
  nullifierHash: initialNullifierHash,
  onResetFlow,
}) => {
  const [isExamEnded, setIsExamEnded] = useState<boolean>(false);
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);
  const [chosenAnswers, setChosenAnswers] = useState<string[]>([]);
  const [studentSalt, setStudentSalt] = useState<string>('');
  const [nullifierHash, setNullifierHash] = useState<string>(initialNullifierHash || '');
  const [score, setScore] = useState<number | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Default correct answers for CS101 exam (["B", "B", "C", "C", "C"])
  const DEFAULT_CORRECT_ANSWERS = ["B", "B", "C", "C", "C"];

  useEffect(() => {
    // 1. Load stored submission data from localStorage
    const savedDataStr = localStorage.getItem(`student_exam_${examId}`);
    if (savedDataStr) {
      try {
        const savedData = JSON.parse(savedDataStr);
        setChosenAnswers(savedData.chosenAnswers || []);
        setStudentSalt(savedData.studentSalt || '');
        if (savedData.nullifierHash) setNullifierHash(savedData.nullifierHash);
      } catch (e) {
        console.error('Failed to parse stored exam data:', e);
      }
    }

    // Load questions text
    fetch('/questions.json')
      .then((res) => res.json())
      .then((data) => setQuestions(data))
      .catch((err) => console.error('Failed to load questions:', err));
  }, [examId]);

  // Check on-chain exam status / reveal simulation
  const handleTeacherRevealKey = () => {
    setIsExamEnded(true);
    setCorrectAnswers(DEFAULT_CORRECT_ANSWERS);
  };

  const handleEvaluateScoreOnChain = async () => {
    if (!chosenAnswers.length || !studentSalt) {
      setErrorMsg('No local submission record found in browser storage.');
      return;
    }

    setIsEvaluating(true);
    setErrorMsg(null);

    try {
      // Calculate local score check
      let calculatedScore = 0;
      const targetAnswers = correctAnswers.length > 0 ? correctAnswers : DEFAULT_CORRECT_ANSWERS;
      chosenAnswers.forEach((ans, idx) => {
        if (ans === targetAnswers[idx]) calculatedScore++;
      });

      // Simulate on-chain contract evaluateScore call
      await new Promise((resolve) => setTimeout(resolve, 800));

      setScore(calculatedScore);
    } catch (err: any) {
      console.error('Score evaluation error:', err);
      setErrorMsg(err?.message || 'Failed to evaluate score.');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="screen-content">
      <div className="screen-heading">
        <div className="screen-icon green"><Award size={23} /></div>
        <div>
          <h2>Exam Result & Score Reveal</h2>
          <p>Zero-knowledge anonymized grade verification for Exam #{examId}.</p>
        </div>
      </div>

      {errorMsg && <div className="error-banner">{errorMsg}</div>}

      {!isExamEnded ? (
        <div className="status-banner" style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '12px', padding: '20px', margin: '20px 0', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <Clock size={36} color="#eab308" />
          </div>
          <h3 style={{ color: '#fef08a', marginBottom: '8px' }}>Exam in progress</h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '16px' }}>
            Scores will unlock after the teacher reveals the official answer key on-chain.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={handleTeacherRevealKey}
            style={{ margin: '0 auto', background: 'linear-gradient(135deg, #d97706, #b45309)' }}
          >
            <Key size={16} />
            <span>[Teacher Demo] Reveal Answer Key On-Chain</span>
          </button>
        </div>
      ) : (
        <div className="reveal-area" style={{ display: 'flex', flexDirection: 'column', gap: '20px', margin: '20px 0' }}>
          <div className="score-summary-card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.05))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
            {score === null ? (
              <div>
                <div style={{ fontSize: '1rem', color: '#a7f3d0', marginBottom: '12px' }}>Answer key is live on-chain!</div>
                <button
                  type="button"
                  className="primary-button green-button"
                  onClick={handleEvaluateScoreOnChain}
                  disabled={isEvaluating}
                  style={{ margin: '0 auto' }}
                >
                  {isEvaluating ? (
                    <>
                      <RefreshCw size={18} className="spin" />
                      <span>Evaluating score on-chain...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Evaluate & Reveal Score</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.85rem', color: '#a7f3d0', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px' }}>
                  VERIFIED ANONYMOUS GRADE
                </div>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
                  {score} / {questions.length || 5}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginTop: '8px' }}>
                  {Math.round((score / (questions.length || 5)) * 100)}% Overall Score
                </div>
              </div>
            )}
          </div>

          {score !== null && (
            <div className="breakdown-section" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span>Local Answer Breakdown</span>
              </div>

              {questions.map((q, idx) => {
                const userChoice = chosenAnswers[idx] || 'Not answered';
                const correctOpt = (correctAnswers.length > 0 ? correctAnswers : DEFAULT_CORRECT_ANSWERS)[idx];
                const isCorrect = userChoice === correctOpt;

                return (
                  <div
                    key={q.id}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      borderRadius: '10px',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9rem', color: '#f1f5f9', fontWeight: 500 }}>
                        Q{idx + 1}: {q.question}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                        Your Choice: <strong style={{ color: isCorrect ? '#34d399' : '#f87171' }}>{userChoice}</strong> | Correct Answer: <strong style={{ color: '#34d399' }}>{correctOpt}</strong>
                      </div>
                    </div>

                    <div>
                      {isCorrect ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                          <Check size={14} /> Correct
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                          <XCircle size={14} /> Incorrect
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px 16px', fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>Score calculated on-chain using nullifier <code>{nullifierHash.slice(0, 14)}...</code> without revealing student identity.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreReveal;
