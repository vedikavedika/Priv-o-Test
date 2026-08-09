import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { ethers } from 'ethers';

// Contract ABI matching ExamSystem.sol
export const ExamSystemABI = [
  "function join(uint256 identityCommitment) external",
  "function submit(uint256 merkleTreeDepth, uint256 merkleTreeRoot, uint256 nullifier, uint256 answerHash, uint256 scope, uint256[8] calldata points) external",
  "function revealAnswerKey(string[] memory _correctAnswers, bytes32 _teacherSalt) external",
  "function evaluateScore(uint256 nullifierHash, string[] calldata studentAnswers, bytes32 studentSalt) external returns (uint256)",
  "function getMembers() external view returns (uint256[])",
  "function isExamEnded() external view returns (bool)",
  "function studentScores(uint256 nullifierHash) external view returns (uint256)"
];

/**
 * Validates the shape of a incoming Semaphore V4 proof object.
 * @param {object} proof 
 */
export function checkProofShape(proof) {
  if (!proof) throw new Error("Missing proof object");

  const requiredFields = ['merkleTreeDepth', 'merkleTreeRoot', 'nullifier', 'scope'];
  for (const field of requiredFields) {
    if (proof[field] === undefined || proof[field] === null) {
      throw new Error(`Invalid proof shape: missing field '${field}'`);
    }
  }

  return true;
}

/**
 * Creates an Express app instance for the Relayer Server.
 */
export function createRelayerApp(contractAddress, signer) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Express Rate Limiter
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: { error: "Rate limit exceeded. Try again later." }
  });
  app.use(limiter);

  const contract = new ethers.Contract(contractAddress, ExamSystemABI, signer);

  // POST /join — Accepts { identityCommitment }
  app.post('/join', async (req, res) => {
    const { identityCommitment } = req.body;
    console.log(`\n[Relayer Log] POST /join hit with identityCommitment: ${identityCommitment}`);

    if (!identityCommitment) {
      return res.status(400).json({ error: "Missing identityCommitment parameter" });
    }

    try {
      const tx = await contract.join(BigInt(identityCommitment));
      console.log(`[Relayer Log] Transaction broadcasted. Tx Hash: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`[Relayer Log] Transaction confirmed in block ${receipt.blockNumber}`);
      return res.json({ success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
    } catch (err) {
      console.error(`[Relayer Error] /join failed:`, err.reason || err.message);
      return res.status(400).json({ error: err.reason || err.message });
    }
  });

  // POST /submit — Accepts { proof, answerHash }
  app.post('/submit', async (req, res) => {
    const { proof, answerHash } = req.body;
    console.log(`\n[Relayer Log] POST /submit hit with nullifier: ${proof?.nullifier}`);

    try {
      checkProofShape(proof);

      if (!answerHash) {
        return res.status(400).json({ error: "Missing answerHash parameter" });
      }

      const points = Array.isArray(proof.points) && proof.points.length === 8 
        ? proof.points.map(p => BigInt(p))
        : [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n];

      const tx = await contract.submit(
        proof.merkleTreeDepth || 12,
        BigInt(proof.merkleTreeRoot || 0),
        BigInt(proof.nullifier),
        BigInt(answerHash),
        BigInt(proof.scope || 101),
        points
      );

      console.log(`[Relayer Log] Submission transaction broadcasted. Tx Hash: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`[Relayer Log] Submission confirmed in block ${receipt.blockNumber}`);

      return res.json({ success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
    } catch (err) {
      console.error(`[Relayer Error] /submit failed:`, err.reason || err.message);
      return res.status(400).json({ error: err.reason || err.message });
    }
  });

  // POST /reveal-key — Accepts { correctAnswers, teacherSalt }
  app.post('/reveal-key', async (req, res) => {
    const { correctAnswers, teacherSalt } = req.body;
    console.log(`\n[Relayer Log] POST /reveal-key hit`);

    if (!correctAnswers || !teacherSalt) {
      return res.status(400).json({ error: "Missing correctAnswers or teacherSalt" });
    }

    try {
      const tx = await contract.revealAnswerKey(correctAnswers, teacherSalt);
      const receipt = await tx.wait();
      return res.json({ success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
    } catch (err) {
      console.error(`[Relayer Error] /reveal-key failed:`, err.reason || err.message);
      return res.status(400).json({ error: err.reason || err.message });
    }
  });

  // POST /evaluate-score — Accepts { nullifierHash, studentAnswers, studentSalt }
  app.post('/evaluate-score', async (req, res) => {
    const { nullifierHash, studentAnswers, studentSalt } = req.body;
    console.log(`\n[Relayer Log] POST /evaluate-score hit for nullifier: ${nullifierHash}`);

    if (!nullifierHash || !studentAnswers || !studentSalt) {
      return res.status(400).json({ error: "Missing nullifierHash, studentAnswers, or studentSalt" });
    }

    try {
      const tx = await contract.evaluateScore(BigInt(nullifierHash), studentAnswers, studentSalt);
      const receipt = await tx.wait();
      const score = await contract.studentScores(BigInt(nullifierHash));
      return res.json({ success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber, score: score.toString() });
    } catch (err) {
      console.error(`[Relayer Error] /evaluate-score failed:`, err.reason || err.message);
      return res.status(400).json({ error: err.reason || err.message });
    }
  });

  return app;
}
