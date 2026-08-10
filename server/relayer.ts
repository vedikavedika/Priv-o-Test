import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { ethers } from 'ethers';

const EXAM_ID = process.env.EXAM_ID || '101';
// Deadline set at server startup (default now + 4 minutes, or EXAM_DEADLINE env var timestamp)
const DEFAULT_DEADLINE_DURATION_MS = 4 * 60 * 1000;
let deadline = process.env.EXAM_DEADLINE
  ? Number(process.env.EXAM_DEADLINE)
  : Date.now() + DEFAULT_DEADLINE_DURATION_MS;

interface SubmissionRecord {
  answerHash: string;
  scope: string;
  submittedAt: number;
}

interface RevealedRecord {
  chosenAnswers: string[];
  studentSalt: string;
  revealedAt: number;
}

const submissions = new Map<string, SubmissionRecord>();
const revealedAnswers = new Map<string, RevealedRecord>();

const app = express();
app.use(cors());
app.use(express.json());

// Generous rate limit (100 req/min) on /submit and /reveal
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

app.use('/submit', limiter);
app.use('/reveal', limiter);

// 1. POST /join
app.post('/join', (req, res) => {
  try {
    const { identityCommitment } = req.body || {};
    console.log(`[${new Date().toISOString()}] POST /join - Identity commitment: ${identityCommitment || 'N/A'}`);
    return res.json({ success: true });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in POST /join:`, err);
    return res.status(500).json({ success: false, message: 'Internal server error on join pass-through' });
  }
});

// 2. POST /submit
app.post('/submit', (req, res) => {
  try {
    const { proof, nullifierHash, merkleTreeRoot, answerHash } = req.body || {};

    console.log(`[${new Date().toISOString()}] POST /submit attempt - nullifierHash: ${nullifierHash || 'missing'}`);

    // Validate the shape of `proof`
    // TODO: replace this shape check with real @semaphore-protocol/core verifyProof() once ready to validate the actual cryptography
    if (
      !proof ||
      proof.merkleTreeDepth === undefined ||
      !proof.merkleTreeRoot ||
      !proof.nullifier ||
      !proof.message ||
      !proof.scope ||
      !Array.isArray(proof.points)
    ) {
      console.warn(`[${new Date().toISOString()}] POST /submit REJECTED: Invalid proof shape`);
      return res.status(400).json({ success: false, message: 'Invalid proof shape' });
    }

    // Check proof.scope === EXAM_ID
    if (proof.scope !== EXAM_ID) {
      console.warn(`[${new Date().toISOString()}] POST /submit REJECTED: Scope mismatch (${proof.scope} !== ${EXAM_ID})`);
      return res.status(400).json({ success: false, message: 'wrong scope / wrong exam' });
    }

    // Check answerHash is present and non-empty
    if (!answerHash || typeof answerHash !== 'string' || answerHash.trim() === '') {
      console.warn(`[${new Date().toISOString()}] POST /submit REJECTED: Missing answerHash`);
      return res.status(400).json({ success: false, message: 'Missing or empty answerHash' });
    }

    // Check for nullifierHash presence
    if (!nullifierHash) {
      console.warn(`[${new Date().toISOString()}] POST /submit REJECTED: Missing nullifierHash`);
      return res.status(400).json({ success: false, message: 'Missing nullifierHash' });
    }

    // Check submissions.has(nullifierHash)
    if (submissions.has(nullifierHash)) {
      console.warn(`[${new Date().toISOString()}] POST /submit REJECTED: Duplicate nullifierHash (${nullifierHash})`);
      return res.status(409).json({
        success: false,
        message: 'Duplicate submission blocked: this identity has already submitted for this exam.',
      });
    }

    // Store submission
    submissions.set(nullifierHash, {
      answerHash,
      scope: proof.scope,
      submittedAt: Date.now(),
    });

    // Reset the exam deadline timer to a fresh 4-minute lock starting from submission time
    deadline = Date.now() + DEFAULT_DEADLINE_DURATION_MS;

    console.log(`[${new Date().toISOString()}] POST /submit SUCCESS: Submission stored for nullifier ${nullifierHash}. Deadline reset to 4 minutes from now (${new Date(deadline).toISOString()}).`);
    return res.json({ success: true, message: 'Submission received anonymously.' });
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}] Error in POST /submit:`, err);
    return res.status(500).json({ success: false, message: err?.message || 'Server error on submission' });
  }
});

// 3. POST /reveal
app.post('/reveal', (req, res) => {
  try {
    const { nullifierHash, chosenAnswers, studentSalt } = req.body || {};

    // Reject with 403 if Date.now() < deadline
    if (Date.now() < deadline) {
      return res.status(403).json({
        success: false,
        message: 'Reveal is locked until the exam deadline has passed.',
      });
    }

    // Reject with 404 if nullifierHash isn't in submissions
    if (!nullifierHash || !submissions.has(nullifierHash)) {
      return res.status(404).json({
        success: false,
        message: 'No submission found for this identity.',
      });
    }

    // Reject with 409 if nullifierHash is already in revealedAnswers
    if (revealedAnswers.has(nullifierHash)) {
      return res.status(409).json({
        success: false,
        message: 'This submission has already been revealed.',
      });
    }

    // Recompute the hash using ethers
    const storedSubmission = submissions.get(nullifierHash)!;
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const encodedAnswers = abiCoder.encode(['string[]', 'bytes32'], [chosenAnswers, studentSalt]);
    const recomputedHash = ethers.keccak256(encodedAnswers);

    if (recomputedHash.toLowerCase() !== storedSubmission.answerHash.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Answer does not match original submission hash',
      });
    }

    // Store in revealedAnswers
    const revealedRecord: RevealedRecord = {
      chosenAnswers,
      studentSalt,
      revealedAt: Date.now(),
    };
    revealedAnswers.set(nullifierHash, revealedRecord);

    console.log(`[${new Date().toISOString()}] POST /reveal SUCCESS: Revealed answers for nullifier ${nullifierHash}`);
    return res.json({ success: true, chosenAnswers });
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}] Error in POST /reveal:`, err);
    return res.status(500).json({ success: false, message: err?.message || 'Server error on reveal' });
  }
});

// 4. GET /results
app.get('/results', (_req, res) => {
  const results = Array.from(revealedAnswers.entries()).map(([nullifierHash, data]) => ({
    nullifierHash,
    chosenAnswers: data.chosenAnswers,
    revealedAt: data.revealedAt,
  }));

  return res.json(results);
});

// 5. GET /status
app.get('/status', (_req, res) => {
  return res.json({
    totalSubmissions: submissions.size,
    totalRevealed: revealedAnswers.size,
    deadline,
    examId: EXAM_ID,
    timeUntilDeadlineMs: Math.max(0, deadline - Date.now()),
  });
});

// 6. POST /admin/skip-deadline
app.post('/admin/skip-deadline', (req, res) => {
  try {
    const { adminKey } = req.body || {};
    const expectedKey = process.env.ADMIN_KEY || 'demo-reset-2026';

    if (adminKey !== expectedKey) {
      return res.status(401).json({ success: false, message: 'Invalid admin key.' });
    }

    deadline = Date.now() - 1;
    console.log(`[${new Date().toISOString()}] POST /admin/skip-deadline SUCCESS: Deadline set into past (${deadline})`);
    return res.json({ success: true, message: 'Deadline skipped, reveal unlocked.' });
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}] Error in POST /admin/skip-deadline:`, err);
    return res.status(500).json({ success: false, message: err?.message || 'Server error on skip deadline' });
  }
});

const PORT = process.env.PORT || 3099;

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`===================================================`);
  console.log(`  Priv-o-Test Anonymous Network Relayer Server`);
  console.log(`  Running on http://localhost:${PORT}`);
  console.log(`===================================================`);
  console.log(`  Exam ID: ${EXAM_ID}`);
  console.log(`  Deadline: ${new Date(deadline).toISOString()} (${new Date(deadline).toLocaleString()})`);
  console.log(`===================================================`);
  console.log(`  Relayer ready for anonymous submissions!`);
  console.log(`===================================================`);
});
