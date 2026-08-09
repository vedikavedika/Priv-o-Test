import React, { useState, useEffect } from 'react';
import { Identity, Group, generateProof, SemaphoreProof } from '@semaphore-protocol/core';
import { ArrowRight, Check, FileCheck2, Fingerprint, GitBranch, Loader2, LockKeyhole, ShieldCheck, Users, RotateCcw } from 'lucide-react';

interface Step3ProofGenerationProps {
  studentEmail: string;
  identity: Identity;
  onProceedToExam?: () => void;
}

export const Step3ProofGeneration: React.FC<Step3ProofGenerationProps> = ({ studentEmail, identity, onProceedToExam }) => {
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isProving, setIsProving] = useState(false);
  const [proof, setProof] = useState<SemaphoreProof | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [joiningStatus, setJoiningStatus] = useState<string>('');
  const [groupMembers, setGroupMembers] = useState<string[]>([]);

  const fetchGroupMembers = async () => {
    try {
      const res = await fetch('http://localhost:3001/group');
      const data = await res.json();
      if (data.members && Array.isArray(data.members)) {
        setGroupMembers(data.members);
      }
    } catch (err) {
      console.error('Failed to fetch shared group state from backend:', err);
    }
  };

  useEffect(() => {
    fetchGroupMembers();
  }, []);

  const handleJoinGroup = async () => {
    setErrorMsg(null);
    setIsJoining(true);
    setJoiningStatus('Verifying student eligibility & registering commitment leaf on server...');

    try {
      // 1. Join request to shared backend server
      const res = await fetch('http://localhost:3001/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: studentEmail,
          identityCommitment: identity.commitment.toString(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to join exam group.');
      }

      setJoiningStatus('Fetching updated shared Merkle tree state...');
      await fetchGroupMembers();

      // 2. Relayer dispatch fallback if relayer service is running
      try {
        await fetch('http://127.0.0.1:3099/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identityCommitment: identity.commitment.toString() })
        });
      } catch (relayerErr) {
        // Optional relayer service, safe to ignore
      }

      setJoiningStatus('Group joined! Shared Merkle tree root synchronized.');
      setIsJoined(true);
    } catch (err: any) {
      console.error('Join error:', err);
      setErrorMsg(err?.message || 'Failed to join exam group.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleGenerateMembershipProof = async () => {
    setIsProving(true);
    setErrorMsg(null);
    setProof(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Re-fetch exact confirmed Merkle tree leaves from server immediately before proving
      const res = await fetch('http://localhost:3001/group');
      const data = await res.json();
      const members: string[] = data.members || [];
      setGroupMembers(members);

      const commitmentsList = members.map((leaf) => BigInt(leaf));
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

  const handleAdminReset = async () => {
    const adminKey = window.prompt('Enter Admin Key to reset registration state:');
    if (!adminKey) return;

    try {
      const res = await fetch('http://localhost:3001/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Reset successful! All student registrations cleared and pre-seeded anonymity floor of 8 restored.');
        setIsJoined(false);
        setProof(null);
        await fetchGroupMembers();
      } else {
        alert('Admin reset failed: ' + (data.message || 'Invalid admin key.'));
      }
    } catch (err: any) {
      alert('Error connecting to admin reset endpoint: ' + err.message);
    }
  };

  const memberCount = groupMembers.length;

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
          <div className="join-copy"><div className="mini-label">EXAM GROUP</div><h3>CS101 Final Exam · 2026</h3><p>Your public commitment will become one leaf in the shared Semaphore Merkle tree. The Web2 record only knows that registration is complete.</p></div>
          <div className="join-stats">
            <div>
              <Users size={15} />
              <span>Group size: <strong>{memberCount}</strong> members</span>
            </div>
            <div>
              <LockKeyhole size={15} />
              <span>Identity hidden</span>
            </div>
          </div>
          <button className="primary-button green-button" onClick={handleJoinGroup} disabled={isJoining}>
            {isJoining ? (
              <>
                <Loader2 size={17} className="spin" />
                <span>{joiningStatus || 'Updating server Merkle tree...'}</span>
              </>
            ) : (
              <>
                <span>Register & join group</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="proof-area">
          <div className="joined-banner">
            <div className="joined-icon"><Check size={17} /></div>
            <div>
              <strong>You're in the group anonymously</strong>
              <span>Group size: <strong>{memberCount}</strong> registered member{memberCount === 1 ? '' : 's'} · email-to-commitment link is not retained</span>
            </div>
            <div className="joined-tag">GROUP MEMBER</div>
          </div>

          {!proof && (
            <div className="generate-card">
              <div className="generate-icon"><Fingerprint size={23} /></div>
              <div className="generate-copy">
                <h3>Generate a zero-knowledge membership proof</h3>
                <p>Prove that your secret identity belongs to the shared exam group ({memberCount} members). The verifier learns membership, not your student identity.</p>
              </div>
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

      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <button
          type="button"
          onClick={handleAdminReset}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            textDecoration: 'underline',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Admin tool to reset demo registrations"
        >
          <RotateCcw size={12} />
          <span>Admin Reset State</span>
        </button>
      </div>
    </div>
  );
};

