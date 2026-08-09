import React, { useState } from 'react';
import { Identity, Group, generateProof, SemaphoreProof } from '@semaphore-protocol/core';
import { examGroupManager } from '../groupManager.js';
import { ArrowRight, Check, FileCheck2, Fingerprint, GitBranch, Loader2, LockKeyhole, ShieldCheck, Users } from 'lucide-react';

interface Step3ProofGenerationProps {
  studentEmail: string;
  identity: Identity;
  onProceedToExam?: () => void;
}

export const Step3ProofGeneration: React.FC<Step3ProofGenerationProps> = ({ studentEmail, identity, onProceedToExam }) => {
  const [isJoined, setIsJoined] = useState(false);
  const [isProving, setIsProving] = useState(false);
  const [proof, setProof] = useState<SemaphoreProof | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleJoinGroup = () => {
    setErrorMsg(null);
    const result = examGroupManager.registerStudentCommitment(studentEmail, identity.commitment);
    if (result.success) setIsJoined(true);
    else setErrorMsg(result.message);
  };

  const handleGenerateMembershipProof = async () => {
    setIsProving(true);
    setErrorMsg(null);
    setProof(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const rawLeaves = examGroupManager.getPublicGroupLeaves();
      const commitmentsList = rawLeaves.map((leaf) => BigInt(leaf));
      const freshGroup = new Group(commitmentsList);
      const generatedProof = await generateProof(
        identity,
        freshGroup,
        '0',
        '101',
        12,
        {
          zkey: '/artifacts/semaphore-12.zkey',
          wasm: '/artifacts/semaphore-12.wasm'
        }
      );

      setProof(generatedProof);
    } catch (err: any) {
      console.error('Proof error:', err);
      setErrorMsg(err?.message || 'Failed to generate Zero-Knowledge membership proof.');
    } finally {
      setIsProving(false);
    }
  };

  const memberCount = examGroupManager.getPublicGroupLeaves().length;

  return (
    <div className="screen-content">
      <div className="screen-heading">
        <div className="screen-icon green"><ShieldCheck size={23} /></div>
        <div>
          <h2>Join the exam group</h2>
          <p>Register your commitment, then prove membership without revealing who you are.</p>
        </div>
      </div>

      <div className="proof-flow">
        <div className={`proof-node ${isJoined ? 'done' : 'active'}`}><span>{isJoined ? <Check size={15} /> : '01'}</span><div><strong>Register commitment</strong><small>Public leaf only</small></div></div>
        <div className={`proof-connector ${isJoined ? 'done' : ''}`} />
        <div className={`proof-node ${proof ? 'done' : isJoined ? 'active' : ''}`}><span>{proof ? <Check size={15} /> : '02'}</span><div><strong>Generate proof</strong><small>Computed locally</small></div></div>
        <div className={`proof-connector ${proof ? 'done' : ''}`} />
        <div className={`proof-node ${proof ? 'done' : ''}`}><span>{proof ? <Check size={15} /> : '03'}</span><div><strong>Verify eligibility</strong><small>No identity disclosure</small></div></div>
      </div>

      {errorMsg && <div className="error-banner">{errorMsg}</div>}

      {!isJoined ? (
        <div className="join-card">
          <div className="join-visual"><GitBranch size={25} /><div className="leaf-dot" /><div className="leaf-dot second" /><div className="leaf-dot third" /></div>
          <div className="join-copy"><div className="mini-label">EXAM GROUP</div><h3>CS101 Final Exam · 2026</h3><p>Your public commitment will become one leaf in the Semaphore Merkle tree. The Web2 record only knows that registration is complete.</p></div>
          <div className="join-stats"><div><Users size={15} /><span>{memberCount} members</span></div><div><LockKeyhole size={15} /><span>Identity hidden</span></div></div>
          <button className="primary-button green-button" onClick={handleJoinGroup}><span>Register & join group</span><ArrowRight size={17} /></button>
        </div>
      ) : (
        <div className="proof-area">
          <div className="joined-banner"><div className="joined-icon"><Check size={17} /></div><div><strong>You're in the group anonymously</strong><span>{memberCount} registered member{memberCount === 1 ? '' : 's'} · email-to-commitment link is not retained</span></div><div className="joined-tag">GROUP MEMBER</div></div>

          {!proof && (
            <div className="generate-card">
              <div className="generate-icon"><Fingerprint size={23} /></div>
              <div className="generate-copy"><h3>Generate a zero-knowledge membership proof</h3><p>Prove that your secret identity belongs to the exam group. The verifier learns membership, not your student identity.</p></div>
              <button className="primary-button" onClick={handleGenerateMembershipProof} disabled={isProving}>{isProving ? <><Loader2 size={17} className="spin" /> Computing proof…</> : <><FileCheck2 size={17} /> Generate proof</>}</button>
            </div>
          )}

          {proof && (
            <div className="proof-result">
              <div className="result-header"><div className="result-title"><div className="result-icon"><Check size={18} /></div><div><strong>Membership proof generated</strong><span>Valid Semaphore proof • ready for verification</span></div></div><div className="valid-chip"><span className="status-dot" /> VALID</div></div>
              <div className="proof-grid">
                <div className="proof-value"><span>Merkle tree root</span><code>{proof.merkleTreeRoot.toString()}</code></div>
                <div className="proof-value">
                  <span>Nullifier</span>
                  <code>{proof.nullifier.toString()}</code>
                </div>
              </div>

              {onProceedToExam && (
                <div style={{ marginTop: '16px' }}>
                  <button className="primary-button green-button" onClick={onProceedToExam} style={{ width: '100%', justifyContent: 'center' }}>
                    <span>Enter Anonymous Exam Portal</span>
                    <ArrowRight size={17} />
                  </button>
                </div>
              )}

              <div className="result-foot"><ShieldCheck size={15} /><span>The proof establishes group membership without exposing your email or secret identity.</span></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
