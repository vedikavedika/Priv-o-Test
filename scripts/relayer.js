import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { ethers } from 'ethers';

// Contract ABI matching ExamSystem.sol
export const ExamSystemABI = [
  "function join(uint256 identityCommitment) external",
  "function submit(uint256 merkleTreeDepth, uint256 merkleTreeRoot, uint256 nullifier, uint256 answerHash, uint256 scope, uint256[8] calldata points) external",
  "function reveal(uint256 nullifier, uint256 realAnswer, uint256 secret) external",
  "function getMembers() external view returns (uint256[])",
  "function getResults() external view returns (tuple(uint256 nullifier, uint256 answer)[])"
];

/**
 * Validates the shape of a incoming Semaphore V4 proof object.
 * @param {object} proof 
 */
export function checkProofShape(proof) {
  // TODO: replace with real @semaphore-protocol/core verifyProof() later
  if (!proof) throw new Error("Missing proof object");

  const requiredFields = ['merkleTreeDepth', 'merkleTreeRoot', 'nullifier', 'message', 'scope', 'points'];
  for (const field of requiredFields) {
    if (proof[field] === undefined || proof[field] === null) {
      throw new Error(`Invalid proof shape: missing field '${field}'`);
    }
  }

  if (!Array.isArray(proof.points) || proof.points.length !== 8) {
    throw new Error("Invalid proof shape: points must be an array of 8 elements");
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
      // Validate proof shape stub
      checkProofShape(proof);

      if (!answerHash) {
        return res.status(400).json({ error: "Missing answerHash parameter" });
      }

      const tx = await contract.submit(
        proof.merkleTreeDepth,
        BigInt(proof.merkleTreeRoot),
        BigInt(proof.nullifier),
        BigInt(answerHash),
        BigInt(proof.scope),
        proof.points.map(p => BigInt(p))
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

  // POST /reveal — Accepts { nullifier, realAnswer, secret }
  app.post('/reveal', async (req, res) => {
    const { nullifier, realAnswer, secret } = req.body;
    console.log(`\n[Relayer Log] POST /reveal hit for nullifier: ${nullifier}`);

    if (nullifier === undefined || realAnswer === undefined || secret === undefined) {
      return res.status(400).json({ error: "Missing nullifier, realAnswer, or secret" });
    }

    try {
      const tx = await contract.reveal(
        BigInt(nullifier),
        BigInt(realAnswer),
        BigInt(secret)
      );

      console.log(`[Relayer Log] Reveal transaction broadcasted. Tx Hash: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`[Relayer Log] Reveal confirmed in block ${receipt.blockNumber}`);

      return res.json({ success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
    } catch (err) {
      console.error(`[Relayer Error] /reveal failed:`, err.reason || err.message);
      return res.status(400).json({ error: err.reason || err.message });
    }
  });

  return app;
}
