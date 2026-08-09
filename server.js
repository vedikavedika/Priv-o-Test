import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Provider & Relayer Wallet (Pays gas for submissions)
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY');

let relayerWallet;
try {
  relayerWallet = process.env.RELAYER_PRIVATE_KEY && process.env.RELAYER_PRIVATE_KEY !== '0x_YOUR_TESTNET_RELAYER_PRIVATE_KEY'
    ? new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider)
    : ethers.Wallet.createRandom().connect(provider);
} catch (err) {
  relayerWallet = ethers.Wallet.createRandom().connect(provider);
}

// Load ExamSystem Contract
const examSystemABI = [
  "function submit(uint256 merkleTreeDepth, uint256 merkleTreeRoot, uint256 nullifier, uint256 answerHash, uint256 scope, uint256[8] calldata points) external",
  "function sendFeedback(uint256 merkleTreeDepth, uint256 merkleTreeRoot, uint256 nullifier, uint256 feedback, uint256[8] calldata points) external"
];
const examContract = new ethers.Contract(process.env.EXAM_CONTRACT_ADDRESS || ethers.ZeroAddress, examSystemABI, relayerWallet);

// Relay Endpoint: Receives proof from student & submits on-chain
app.post('/api/relay-submission', async (req, res) => {
  try {
    const { merkleTreeDepth, merkleTreeRoot, nullifier, answerHash, scope, points } = req.body;

    console.log(`Relaying submission for nullifier: ${nullifier}`);

    // Relayer wallet executes transaction on behalf of student
    const pointsArray = Array.isArray(points) && points.length === 8
      ? points.map(p => BigInt(p))
      : [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n];

    const tx = await (examContract.submit
      ? examContract.submit(
          merkleTreeDepth || 12,
          BigInt(merkleTreeRoot || 0),
          BigInt(nullifier),
          BigInt(answerHash),
          BigInt(scope || 101),
          pointsArray
        )
      : examContract.sendFeedback(
          merkleTreeDepth || 12,
          BigInt(merkleTreeRoot || 0),
          BigInt(nullifier),
          BigInt(answerHash),
          pointsArray
        ));

    await tx.wait();
    res.status(200).json({ success: true, txHash: tx.hash });
  } catch (error) {
    console.error("Relayer execution failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Privacy Relay Server running on port ${PORT}`));