import { Group } from "@semaphore-protocol/group";
import { universityDb } from "./studentDb.js";

export interface RegistrationResult {
  success: boolean;
  message: string;
  groupRoot?: string;
  memberIndex?: number;
  totalGroupMembers?: number;
}

/**
 * Step 3: Semaphore Merkle Tree Group Manager & Privacy-Preserving Link-Breaker
 * Manages adding public identity commitments to the exam group while breaking
 * the connection between the student's Web2 identity and their Web3 commitment.
 */
export class ExamGroupManager {
  private group: Group;
  private groupId: string;

  constructor(groupId: string = "CS101-FINAL-EXAM-2026") {
    this.groupId = groupId;
    // Instantiate Semaphore Merkle Tree group
    this.group = new Group();
  }

  /**
   * Step 3 Core Endpoint Handler:
   * 1. Verifies Web2 enrollment and registration status.
   * 2. Adds identity.commitment to the Semaphore Merkle Tree group.
   * 3. Sets hasRegistered = true in Web2 DB.
   * 4. DISCARDS the relationship between email and commitment (Link Broken!).
   */
  public registerStudentCommitment(email: string, identityCommitment: string | bigint): RegistrationResult {
    const cleanEmail = email.toLowerCase().trim();

    // 1. Verify Web2 Authentication & Course Enrollment
    const authResult = universityDb.authenticateStudent(cleanEmail);
    if (!authResult.success) {
      return {
        success: false,
        message: `[REJECTED] ${authResult.message}`,
      };
    }

    // 2. Check if student has already registered a commitment
    if (universityDb.hasStudentRegistered(cleanEmail)) {
      return {
        success: false,
        message: `[REJECTED] Double-registration blocked: ${cleanEmail} has already registered a commitment leaf!`,
      };
    }

    // 3. Convert commitment to BigInt leaf for Semaphore group
    const commitmentLeaf = BigInt(identityCommitment);

    // Check if commitment is already in the Merkle Tree (prevent identical leaf collision)
    if (this.group.indexOf(commitmentLeaf) !== -1) {
      return {
        success: false,
        message: `[REJECTED] Commitment leaf already exists in Semaphore group tree!`,
      };
    }

    // 4. Add identity.commitment leaf into the Semaphore Merkle Tree Group
    this.group.addMember(commitmentLeaf);
    const memberIndex = this.group.indexOf(commitmentLeaf);

    // 5. Update Web2 University DB: mark hasRegistered = true
    universityDb.markAsRegistered(cleanEmail);

    // 6. LINK BREAKING GUARANTEE:
    // The server does NOT store `(cleanEmail -> commitmentLeaf)`.
    // The Web2 DB only stores `hasRegistered: true`.
    // The Semaphore Group only holds `commitmentLeaf` as an un-owned node in the Merkle Tree.

    return {
      success: true,
      message: `[SUCCESS] Registered! Commitment added to Merkle tree group. Web2 link broken for ${cleanEmail}.`,
      groupRoot: this.group.root.toString(),
      memberIndex,
      totalGroupMembers: this.group.members.length,
    };
  }

  /**
   * Get public group Merkle root
   */
  public getGroupRoot(): string {
    return this.group.root.toString();
  }

  /**
   * Get full Semaphore Group instance (used for generating client ZK proofs)
   */
  public getGroup(): Group {
    return this.group;
  }

  /**
   * List all commitment leaves in the tree (WITHOUT any student names/emails attached)
   */
  public getPublicGroupLeaves(): string[] {
    return this.group.members.map((member) => member.toString());
  }
}

export const examGroupManager = new ExamGroupManager();
