import { createLocalSemaphoreIdentity } from "../src/identity.js";
import { examGroupManager } from "../src/groupManager.js";
import { universityDb } from "../src/studentDb.js";

/**
 * Script demonstrating Step 3: Registration and Group Management
 */
function runStep3Demo() {
  console.log("=================================================");
  console.log("STEP 3: JOINING THE SEMAPHORE GROUP (LINK BREAKING)");
  console.log("=================================================\n");

  // 1. Create client identities locally
  const aliceIdentity = createLocalSemaphoreIdentity("seed-alice");
  const bobIdentity = createLocalSemaphoreIdentity("seed-bob");
  const unauthorizedIdentity = createLocalSemaphoreIdentity("seed-attacker");

  console.log("1. Attempting Registration for Alice (alice@university.edu)...");
  const aliceReg = examGroupManager.registerStudentCommitment("alice@university.edu", aliceIdentity.publicCommitment);
  console.log(`   Result: ${aliceReg.message}`);
  console.log(`   Group Merkle Root: ${aliceReg.groupRoot}`);

  console.log("\n2. Attempting Registration for Bob (bob@university.edu)...");
  const bobReg = examGroupManager.registerStudentCommitment("bob@university.edu", bobIdentity.publicCommitment);
  console.log(`   Result: ${bobReg.message}`);
  console.log(`   Group Merkle Root: ${bobReg.groupRoot}`);

  console.log("\n3. Attempting Double-Registration for Alice (alice@university.edu)...");
  const aliceDoubleReg = examGroupManager.registerStudentCommitment("alice@university.edu", aliceIdentity.publicCommitment);
  console.log(`   Result: ${aliceDoubleReg.message}`);

  console.log("\n4. Attempting Registration for Unauthorized User (eve@unauthorized.com)...");
  const eveReg = examGroupManager.registerStudentCommitment("eve@unauthorized.com", unauthorizedIdentity.publicCommitment);
  console.log(`   Result: ${eveReg.message}`);

  console.log("\n-------------------------------------------------");
  console.log("AUDIT: WEB2 DB vs SEMAPHORE MERKLE TREE");
  console.log("-------------------------------------------------");

  console.log("\n[Web2 University DB State]");
  console.table(universityDb.getAllRecords());

  console.log("\n[Semaphore Public Group Leaves]");
  console.log(examGroupManager.getPublicGroupLeaves());

  console.log("\nPRIVACY AUDIT VERIFICATION:");
  console.log("Notice: The Web2 DB knows Alice registered (hasRegistered = true),");
  console.log("and the Semaphore Group holds two commitment leaves [Leaf 0, Leaf 1].");
  console.log("However, THERE IS NO RECORD ANYWHERE connecting Alice to Leaf 0 vs Leaf 1!");
  console.log("The link is broken forever.\n");
}

runStep3Demo();
