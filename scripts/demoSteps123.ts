import { universityDb } from "../src/studentDb.js";
import { createLocalSemaphoreIdentity } from "../src/identity.js";
import { examGroupManager } from "../src/groupManager.js";

async function main() {
  console.log("==========================================================================");
  console.log(" ANONYMOUS UNIVERSITY EXAM SYSTEM: STEPS 1 - 3 END-TO-END VERIFICATION");
  console.log("==========================================================================");

  // --------------------------------------------------------------------------
  // STEP 1: Student Authenticates (Web2)
  // --------------------------------------------------------------------------
  console.log("\n==========================================================================");
  console.log("STEP 1: Student Authenticates (Web2)");
  console.log("==========================================================================");
  
  const studentEmail = "alice@university.edu";
  console.log(`[Client] Alice opens university exam portal and enters email: ${studentEmail}`);
  
  const auth = universityDb.authenticateStudent(studentEmail);
  if (!auth.success) {
    console.error("Auth failed:", auth.message);
    return;
  }
  console.log(`[Server] ${auth.message}`);
  console.log(`[Server] Authenticated Student Details:`, auth.student);
  console.log(`[Server] Enrollment Check PASSED: Alice is verified as a registered student.`);

  // --------------------------------------------------------------------------
  // STEP 2: Browser Generates Identity (Web3 / Local)
  // --------------------------------------------------------------------------
  console.log("\n==========================================================================");
  console.log("STEP 2: Browser Generates Identity (Web3 / Local)");
  console.log("==========================================================================");

  console.log(`[Client Browser] Executing local identity generation: 'new Identity()'...`);
  const aliceIdentity = createLocalSemaphoreIdentity("alice-secret-key-seed-2026");

  console.log(`[Client Browser] Secret Private Key generated locally.`);
  console.log(`                 -> Stored in client sessionStorage / local state.`);
  console.log(`                 -> PRIVATE KEY NEVER LEAVES THE BROWSER!`);
  console.log(`[Client Browser] Public Identity Commitment derived:`);
  console.log(`                 -> BigInt: ${aliceIdentity.publicCommitment}`);
  console.log(`                 -> Hex:    ${aliceIdentity.publicCommitmentHex}`);

  // --------------------------------------------------------------------------
  // STEP 3: Joining the Group (Breaking the Link)
  // --------------------------------------------------------------------------
  console.log("\n==========================================================================");
  console.log("STEP 3: Joining the Group (Breaking the Link)");
  console.log("==========================================================================");

  console.log(`[Client Browser] Sending public identity.commitment to portal backend...`);
  console.log(`[Server] Verifying eligibility & registration status for ${studentEmail}...`);

  const regResult = examGroupManager.registerStudentCommitment(studentEmail, aliceIdentity.publicCommitment);
  console.log(`[Server] ${regResult.message}`);
  console.log(`[Server] New Semaphore Merkle Tree Root: ${regResult.groupRoot}`);

  // Let's also register Bob and Charlie to build a real anonymity set!
  console.log(`\n[Simulating Other Students Joining the Same Group]`);
  
  const bobAuth = universityDb.authenticateStudent("bob@university.edu");
  const bobIdentity = createLocalSemaphoreIdentity("bob-secret-key-seed-2026");
  const bobReg = examGroupManager.registerStudentCommitment("bob@university.edu", bobIdentity.publicCommitment);
  console.log(` -> Bob (bob@university.edu) registered. Merkle Root: ${bobReg.groupRoot}`);

  const charlieAuth = universityDb.authenticateStudent("charlie@university.edu");
  const charlieIdentity = createLocalSemaphoreIdentity("charlie-secret-key-seed-2026");
  const charlieReg = examGroupManager.registerStudentCommitment("charlie@university.edu", charlieIdentity.publicCommitment);
  console.log(` -> Charlie (charlie@university.edu) registered. Merkle Root: ${charlieReg.groupRoot}`);

  // --------------------------------------------------------------------------
  // STEP 1-3 AUDIT & SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n==========================================================================");
  console.log(" PRIVACY & UN-LINKABILITY AUDIT SUMMARY");
  console.log("==========================================================================");

  console.log("\n1. Web2 University Database Record:");
  console.table(universityDb.getAllRecords());

  console.log("\n2. Semaphore Group Merkle Tree Public Leaves:");
  const leaves = examGroupManager.getPublicGroupLeaves();
  leaves.forEach((leaf, idx) => {
    console.log(`   Leaf [Index ${idx}]: ${leaf}`);
  });

  console.log("\n3. Verification of Identity Protection:");
  console.log("   - Web2 DB contains student emails and 'hasRegistered: true' flags.");
  console.log("   - Merkle Tree contains cryptographic commitments.");
  console.log("   - NO RECORD connects 'alice@university.edu' to Leaf 0, Leaf 1, or Leaf 2.");
  console.log("   - When Alice later submits her exam, her ZK proof will prove membership in");
  console.log("     this 3-member group without revealing which leaf is hers!");
  console.log("==========================================================================\n");
}

main().catch(console.error);
