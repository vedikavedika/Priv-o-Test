import { Identity } from "@semaphore-protocol/identity";

export interface StudentClientIdentity {
  commitment: string;        // Public identity commitment (safe to broadcast / publish to group)
  commitmentHex: string;     // Hex representation (0x...) for readability
  // Private key remains strictly client-side!
  getPrivateKey: () => string;
}

/**
 * Step 2: Client-side Local Identity Generation
 * Runs inside student's browser (or client session).
 * PRIVACY GUARANTEE: Private key never leaves browser/client memory.
 */
export function createLocalSemaphoreIdentity(seedSecret?: string): {
  identity: Identity;
  publicCommitment: string;
  publicCommitmentHex: string;
} {
  // If seed provided, deterministic for testing; otherwise cryptographic random identity
  const identity = seedSecret ? new Identity(seedSecret) : new Identity();

  const publicCommitment = identity.commitment.toString();
  const publicCommitmentHex = "0x" + identity.commitment.toString(16);

  return {
    identity,
    publicCommitment,
    publicCommitmentHex,
  };
}
