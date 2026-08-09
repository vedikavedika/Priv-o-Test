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
   * Delegates registration to backend server at http://localhost:3001/join
   */
  public async registerStudentCommitment(email: string, identityCommitment: string | bigint): Promise<RegistrationResult> {
    try {
      const response = await fetch('http://localhost:3001/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          identityCommitment: identityCommitment.toString(),
        }),
      });
      const data = await response.json();
      return {
        success: data.success,
        message: data.message,
        groupRoot: data.groupRoot,
        totalGroupMembers: data.totalMembers,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `[ERROR] Failed to connect to server: ${err?.message || err}`,
      };
    }
  }

  /**
   * List all commitment leaves from the backend server http://localhost:3001/group
   */
  public async getPublicGroupLeaves(): Promise<string[]> {
    try {
      const res = await fetch('http://localhost:3001/group');
      const data = await res.json();
      return data.members || [];
    } catch (err) {
      console.error('Failed to fetch group members from server:', err);
      return [];
    }
  }
}

export const examGroupManager = new ExamGroupManager();

