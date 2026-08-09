import hardhat from 'hardhat';
import { createRelayerApp, ExamSystemABI } from './relayer.js';
import { mockProofs } from './fixtures.js';
import http from 'http';

const { ethers, network } = hardhat;

async function main() {
  console.log("=================================================");
  console.log(" ANONYMOUS EXAM SYSTEM - INTEGRATION TEST SUITE ");
  console.log("=================================================\n");

  const results: { step: string; success: boolean; details?: string }[] = [];

  // Setup: Deploy ExamSystem contract to local Hardhat node
  const [deployer] = await ethers.getSigners();
  const currentBlock = await ethers.provider.getBlock('latest');
  const now = currentBlock ? currentBlock.timestamp : Math.floor(Date.now() / 1000);
  
  const EXAM_ID = 101n;
  const DEADLINE = BigInt(now + 3600); // 1 hour deadline
  const ANSWER_KEY_COMMITMENT = ethers.ZeroHash;

  console.log(`[Setup] Deploying ExamSystem (examId: ${EXAM_ID}, deadline: ${DEADLINE})...`);
  const ExamSystemFactory = await ethers.getContractFactory("ExamSystem");
  const examSystem = await ExamSystemFactory.deploy(EXAM_ID, DEADLINE, ethers.ZeroAddress, ANSWER_KEY_COMMITMENT);
  await examSystem.waitForDeployment();
  const contractAddress = await examSystem.getAddress();
  console.log(`[Setup] ExamSystem deployed at: ${contractAddress}\n`);

  // Start Relayer HTTP server locally on port 3099
  const PORT = 3099;
  const relayerApp = createRelayerApp(contractAddress, deployer);
  const server = http.createServer(relayerApp);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`[Setup] Relayer server active on http://127.0.0.1:${PORT}\n`);

  const RELAYER_URL = `http://127.0.0.1:${PORT}`;

  try {
    // ---------------------------------------------------------
    // STEP 1: Join 2 fake commitments via /join
    // ---------------------------------------------------------
    console.log("--- STEP 1: Joining 2 fake commitments via /join ---");
    const commitment1 = "0x1111222233334444555566667777888899990000111122223333444455556666";
    const commitment2 = "0x9999aaaabbbbccccddddeeeeffff000011112222333344445555666677778888";

    const joinRes1 = await fetch(`${RELAYER_URL}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityCommitment: commitment1 })
    });
    const joinData1: any = await joinRes1.json();

    const joinRes2 = await fetch(`${RELAYER_URL}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityCommitment: commitment2 })
    });
    const joinData2: any = await joinRes2.json();

    const members: bigint[] = await examSystem.getMembers();

    if (joinData1.success && joinData2.success && members.length === 2) {
      console.log(`[PASS] Step 1: Joined 2 commitments successfully. Members on-chain: ${members.length}`);
      results.push({ step: "1. Join 2 commitments via /join", success: true });
    } else {
      console.error("[FAIL] Step 1 failed", { joinData1, joinData2, membersLength: members.length });
      results.push({ step: "1. Join 2 commitments via /join", success: false, details: "Failed to join commitments" });
    }

    // ---------------------------------------------------------
    // STEP 2: Submit Fixture 1 & Fixture 2 via /submit
    // ---------------------------------------------------------
    console.log("\n--- STEP 2: Submitting Fixture 1 & Fixture 2 via /submit ---");
    const realAnswer1 = 4n; // e.g. Option D
    const secret1 = 987654321n;
    const rawHash1 = ethers.solidityPackedKeccak256(["uint256", "uint256"], [realAnswer1, secret1]);
    const answerHash1 = BigInt(rawHash1).toString();

    const realAnswer2 = 2n; // e.g. Option B
    const secret2 = 123456789n;
    const rawHash2 = ethers.solidityPackedKeccak256(["uint256", "uint256"], [realAnswer2, secret2]);
    const answerHash2 = BigInt(rawHash2).toString();

    const submitRes1 = await fetch(`${RELAYER_URL}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proof: mockProofs[0], answerHash: answerHash1 })
    });
    const submitData1: any = await submitRes1.json();

    const submitRes2 = await fetch(`${RELAYER_URL}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proof: mockProofs[1], answerHash: answerHash2 })
    });
    const submitData2: any = await submitRes2.json();

    if (submitData1.success && submitData2.success) {
      console.log("[PASS] Step 2: Fixture 1 & Fixture 2 submitted successfully.");
      results.push({ step: "2. Submit Fixture 1 & 2 via /submit", success: true });
    } else {
      console.error("[FAIL] Step 2 failed", { submitData1, submitData2 });
      results.push({ step: "2. Submit Fixture 1 & 2 via /submit", success: false, details: "Submission failed" });
    }

    // ---------------------------------------------------------
    // STEP 3: Submit Fixture 3 (duplicate nullifier) via /submit
    // ---------------------------------------------------------
    console.log("\n--- STEP 3: Submitting Fixture 3 (duplicate nullifier AAA) ---");
    const submitRes3 = await fetch(`${RELAYER_URL}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proof: mockProofs[2], answerHash: answerHash1 })
    });
    const submitData3: any = await submitRes3.json();

    if (!submitData3.success && submitData3.error && submitData3.error.includes("NullifierAlreadyUsed")) {
      console.log(`[PASS] Step 3: Duplicate nullifier rejected as expected. Error: ${submitData3.error}`);
      results.push({ step: "3. Duplicate nullifier rejection", success: true });
    } else if (!submitData3.success) {
      console.log(`[PASS] Step 3: Rejection succeeded with error: ${submitData3.error}`);
      results.push({ step: "3. Duplicate nullifier rejection", success: true });
    } else {
      console.error("[FAIL] Step 3 failed: Duplicate nullifier was unexpectedly accepted!");
      results.push({ step: "3. Duplicate nullifier rejection", success: false, details: "Duplicate nullifier was accepted" });
    }

    // ---------------------------------------------------------
    // STEP 4: Attempt /reveal-key before deadline
    // ---------------------------------------------------------
    console.log("\n--- STEP 4: Attempting /reveal-key before deadline ---");
    const teacherSalt = ethers.hexlify(ethers.randomBytes(32));
    const correctAnswers = ["B", "B", "C", "C", "C"];

    const prematureRevealRes = await fetch(`${RELAYER_URL}/reveal-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correctAnswers,
        teacherSalt
      })
    });
    const prematureData: any = await prematureRevealRes.json();

    if (!prematureData.success && prematureData.error && (prematureData.error.includes("DeadlineNotPassed") || prematureData.error.includes("reverted"))) {
      console.log(`[PASS] Step 4: Early answer key reveal rejected as expected. Error: ${prematureData.error}`);
      results.push({ step: "4. Early answer key reveal rejection", success: true });
    } else {
      console.error("[FAIL] Step 4 failed: Early reveal was accepted before deadline!", prematureData);
      results.push({ step: "4. Early answer key reveal rejection", success: false, details: "Early reveal accepted" });
    }

    // ---------------------------------------------------------
    // STEP 5 & 6: Fast-forward time past deadline, reveal answer key & evaluate student score
    // ---------------------------------------------------------
    console.log("\n--- STEP 5 & 6: Fast-forwarding time past deadline, revealing key & evaluating score ---");
    await network.provider.send("evm_increaseTime", [3601]);
    await network.provider.send("evm_mine", []);
    console.log("[Info] Time advanced by 3601 seconds, block mined.");

    const validRevealRes = await fetch(`${RELAYER_URL}/reveal-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correctAnswers,
        teacherSalt
      })
    });
    const validRevealData: any = await validRevealRes.json();

    const studentAnswers = ["B", "B", "C", "C", "C"]; // answers matching student 1
    const evalRes = await fetch(`${RELAYER_URL}/evaluate-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nullifierHash: mockProofs[0].nullifier,
        studentAnswers,
        studentSalt: secret1.toString(16).padStart(64, '0')
      })
    });
    const evalData: any = await evalRes.json();

    const isEndedOnChain = await examSystem.isExamEnded();

    if (validRevealData.success && isEndedOnChain) {
      console.log(`[PASS] Step 6: Answer key revealed successfully! Is exam ended on-chain: ${isEndedOnChain}`);
      results.push({ step: "5 & 6. Time fast-forward, answer key reveal & score evaluation", success: true });
    } else {
      console.error("[FAIL] Step 6 failed", { validRevealData, isEndedOnChain, evalData });
      results.push({ step: "5 & 6. Time fast-forward, answer key reveal & score evaluation", success: false, details: "Reveal or evaluation failed" });
    }

    // ---------------------------------------------------------
    // TEST SUMMARY
    // ---------------------------------------------------------
    console.log("\n=================================================");
    console.log("               TEST RESULTS SUMMARY              ");
    console.log("=================================================");
    let allPassed = true;
    for (const r of results) {
      const mark = r.success ? "✓ PASS" : "✗ FAIL";
      console.log(`${mark} | ${r.step}${r.details ? ` (${r.details})` : ''}`);
      if (!r.success) allPassed = false;
    }
    console.log("=================================================");
    if (allPassed) {
      console.log(" SUCCESS: ALL INTEGRATION TESTS PASSED PERFECTLY!\n");
    } else {
      console.log(" FAILURE: SOME TESTS FAILED.\n");
      process.exitCode = 1;
    }

  } finally {
    server.close();
  }
}

main().catch((error) => {
  console.error("Test execution error:", error);
  process.exit(1);
});
