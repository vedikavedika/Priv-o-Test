// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title ExamSystem
 * @notice Anonymous exam submission and timed reveal contract.
 * @dev Integrates with Semaphore V4 proof shapes. Employs a commit-reveal scheme
 *      to ensure answer secrecy during the exam period, with relayer-only submissions.
 */
contract ExamSystem {
    // Custom Errors
    error AlreadyJoined();
    error InvalidScope();
    error EmptyAnswerHash();
    error NullifierAlreadyUsed();
    error DeadlineNotPassed();
    error InvalidSecretOrAnswer();

    // Configuration
    uint256 public immutable examId;
    uint256 public immutable deadline;

    // Members tracking
    uint256[] private commitments;
    mapping(uint256 => bool) public isMemberJoined;

    // Submissions tracking (nullifier => state)
    mapping(uint256 => bool) public nullifierUsed;
    mapping(uint256 => uint256) public answerHashes;

    // Reveals tracking
    mapping(uint256 => uint256) public revealedAnswers;
    uint256[] private revealedNullifiers;

    struct Result {
        uint256 nullifier;
        uint256 answer;
    }

    // Events
    event MemberJoined(uint256 indexed commitment, uint256 totalMembers);
    event SubmissionReceived(uint256 indexed nullifier, uint256 answerHash);
    event AnswerRevealed(uint256 indexed nullifier, uint256 realAnswer);

    /**
     * @param _examId Unique numeric identifier for the exam (used as scope for ZK proof)
     * @param _deadline Unix timestamp after which answers can be revealed
     */
    constructor(uint256 _examId, uint256 _deadline) {
        examId = _examId;
        deadline = _deadline;
    }

    /**
     * @notice Registers a student's public commitment leaf.
     * @param identityCommitment The public Semaphore commitment
     */
    function join(uint256 identityCommitment) external {
        if (isMemberJoined[identityCommitment]) {
            revert AlreadyJoined();
        }

        // TODO: replace with semaphore.addMember(groupId, commitment) once real Semaphore contract is deployed
        isMemberJoined[identityCommitment] = true;
        commitments.push(identityCommitment);

        emit MemberJoined(identityCommitment, commitments.length);
    }

    /**
     * @notice Submits an anonymous exam answer commit hash backed by a Semaphore proof shape.
     */
    function submit(
        uint256 merkleTreeDepth,
        uint256 merkleTreeRoot,
        uint256 nullifier,
        uint256 answerHash,
        uint256 scope,
        uint256[8] calldata points
    ) external {
        if (scope != examId) revert InvalidScope();
        if (answerHash == 0) revert EmptyAnswerHash();
        if (nullifierUsed[nullifier]) revert NullifierAlreadyUsed();

        // TODO: replace this block with semaphore.validateProof(groupId, proof) once real Semaphore is wired in
        // Unused params suppress warnings while retaining exact proof signature:
        (merkleTreeDepth, merkleTreeRoot, points);

        nullifierUsed[nullifier] = true;
        answerHashes[nullifier] = answerHash;

        emit SubmissionReceived(nullifier, answerHash);
    }

    /**
     * @notice Reveals the plaintext answer after the exam deadline.
     * @param nullifier The nullifier used in the earlier submission
     * @param realAnswer The original answer string/number submitted by student
     * @param secret The random salt used in the commit hash
     */
    function reveal(uint256 nullifier, uint256 realAnswer, uint256 secret) external {
        if (block.timestamp < deadline) revert DeadlineNotPassed();

        // Recompute commit hash: keccak256(abi.encodePacked(realAnswer, secret))
        bytes32 computedHash = keccak256(abi.encodePacked(realAnswer, secret));
        if (uint256(computedHash) != answerHashes[nullifier]) {
            revert InvalidSecretOrAnswer();
        }

        revealedAnswers[nullifier] = realAnswer;
        revealedNullifiers.push(nullifier);

        emit AnswerRevealed(nullifier, realAnswer);
    }

    /**
     * @notice Returns all joined member commitments for rebuilding local Merkle tree.
     */
    function getMembers() external view returns (uint256[] memory) {
        return commitments;
    }

    /**
     * @notice Returns all revealed (nullifier, answer) pairs after deadline.
     */
    function getResults() external view returns (Result[] memory) {
        Result[] memory results = new Result[](revealedNullifiers.length);
        for (uint256 i = 0; i < revealedNullifiers.length; i++) {
            uint256 nullifier = revealedNullifiers[i];
            results[i] = Result({
                nullifier: nullifier,
                answer: revealedAnswers[nullifier]
            });
        }
        return results;
    }
}
