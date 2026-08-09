import { createLocalSemaphoreIdentity } from "../src/identity.js";

/**
 * Script demonstrating Step 2: Local Semaphore Identity creation for students
 */
function runStep2Demo() {
  console.log("\n--- STEP 2: Browser Local Identity Generation ---");

  const students = ["Alice (alice@university.edu)", "Bob (bob@university.edu)", "Charlie (charlie@university.edu)"];

  students.forEach((studentName, idx) => {
    // Generate identity locally in browser memory
    const { identity, publicCommitment, publicCommitmentHex } = createLocalSemaphoreIdentity(`student-seed-${idx + 1}`);

    console.log(`\n[${studentName}]`);
    console.log(`  └─ Secret Private Key generated locally (never leaves browser/client memory)`);
    console.log(`  └─ Public Identity Commitment (BigInt): ${publicCommitment}`);
    console.log(`  └─ Public Identity Commitment (Hex):    ${publicCommitmentHex}`);
  });
}

runStep2Demo();
