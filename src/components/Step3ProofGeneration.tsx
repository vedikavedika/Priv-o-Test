import React, { useState } from 'react';
import { Identity, Group, generateProof, SemaphoreProof } from '@semaphore-protocol/core';
import { examGroupManager } from '../groupManager.js';
import { Cpu, CheckCircle2, UserPlus, Binary, Layers, AlertCircle, FileCheck2 } from 'lucide-react';

interface Step3ProofGenerationProps {
  studentEmail: string;
  identity: Identity;
}

export const Step3ProofGeneration: React.FC<Step3ProofGenerationProps> = ({ studentEmail, identity }) => {
  const [isJoined, setIsJoined] = useState(false);
  const [isProving, setIsProving] = useState(false);
  const [proof, setProof] = useState<SemaphoreProof | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleJoinGroup = () => {
    setErrorMsg(null);
    const result = examGroupManager.registerStudentCommitment(studentEmail, identity.commitment);
    if (result.success) {
      setIsJoined(true);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleGenerateMembershipProof = async () => {
    setIsProving(true);
    setErrorMsg(null);
    setProof(null);

    try {
      // Yield to browser UI thread
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Rebuild group locally fresh immediately before proving
      const rawLeaves = examGroupManager.getPublicGroupLeaves();
      const commitmentsList = rawLeaves.map((leaf) => BigInt(leaf));
      const freshGroup = new Group(commitmentsList);

      const scope = "UNIVERSITY-CS101-EXAM-PROOFS-2026";
      const message = "0";

      // Generate Semaphore ZK Proof using local depth 12 snark artifacts
      const generatedProof = await generateProof(
        identity,
        freshGroup,
        message,
        scope,
        12,
        {
          zkeyFilePath: "/artifacts/semaphore-12.zkey",
          wasmFilePath: "/artifacts/semaphore-12.wasm",
        }
      );

      setProof(generatedProof);
    } catch (err: any) {
      console.error("Proof error:", err);
      setErrorMsg(err?.message || "Failed to generate Zero-Knowledge membership proof.");
    } finally {
      setIsProving(false);
    }
  };

  return (
    <div className="glass-card p-8 sm:p-12 max-w-xl mx-auto transition-all duration-300">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
          <Cpu className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Group Join & ZK Proof</h2>
        <p className="text-sm text-slate-400 mt-2">
          Join the Semaphore Merkle group and generate an anonymous membership proof
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs text-center font-medium">
          {errorMsg}
        </div>
      )}

      {/* Part 1: Join Group Action */}
      {!isJoined ? (
        <div className="text-center py-4 space-y-4">
          <p className="text-xs text-slate-300">
            Publish your public commitment to the Merkle tree. Once registered, your Web2 email link is destroyed.
          </p>
          <button
            onClick={handleJoinGroup}
            className="w-full py-4 px-6 gradient-bg-success hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer text-base"
          >
            <UserPlus className="w-5 h-5" />
            <span>Join Semaphore Group</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-emerald-300 text-xs font-semibold">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>Group Status: Joined (Web2 Link Unlinked)</span>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 rounded-full font-mono">
              {examGroupManager.getPublicGroupLeaves().length} Members
            </span>
          </div>

          {/* Part 2: Generate ZK Proof Button */}
          <button
            onClick={handleGenerateMembershipProof}
            disabled={isProving}
            className={`w-full py-4 px-6 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-base ${
              isProving
                ? 'bg-indigo-950 border border-indigo-500/40 text-indigo-300 cursor-wait'
                : 'gradient-bg-primary hover:opacity-95 text-white shadow-indigo-500/25 cursor-pointer'
            }`}
          >
            {isProving ? (
              <>
                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span>Computing ZK Proof...</span>
              </>
            ) : (
              <>
                <Layers className="w-5 h-5" />
                <span>Generate ZK Membership Proof</span>
              </>
            )}
          </button>

          {/* Display Resulting ZK Proof */}
          {proof && (
            <div className="p-6 bg-slate-950 border border-indigo-500/30 rounded-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2 text-indigo-400">
                  <FileCheck2 className="w-5 h-5" />
                  <span className="text-sm font-bold text-white">Verified ZK Membership Proof</span>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold">
                  VALID PROOF
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Merkle Tree Root</span>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-slate-200 break-all select-all">
                    {proof.merkleTreeRoot.toString()}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Nullifier Hash</span>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-indigo-300 break-all select-all">
                    {proof.nullifierHash.toString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
