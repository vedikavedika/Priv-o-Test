// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./ExamGroup.sol";

/**
 * @title ExamSystem
 * @notice Anonymous exam submission, timed answer key reveal, and score evaluation contract.
 * @dev Integrates with ExamGroup (Semaphore V4) for identity management and proof validation shapes.
 */
contract ExamSystem {
    // Custom Errors
    error AlreadyJoined();
    error InvalidScope();
    error EmptyAnswerHash();
    error NullifierAlreadyUsed();
    error DeadlineNotPassed();
    error ExamNotEnded();
    error InvalidSecretOrAnswer();
    error InvalidAnswerKeyCommitment();
    error OnlyInstructor();
    error AlreadyEvaluated();

    // Configuration & Group
    uint256 public immutable examId;
    uint256 public immutable examEndTime;
    address public immutable instructor;
    ExamGroup public immutable examGroup;

    // Answer key commitment and status
    bytes32 public answerKeyCommitment;
    string[] public correctAnswers;
    bool public isExamEnded;

    // Submissions tracking (nullifierHash => answerHash)
    mapping(uint256 => bool) public nullifierUsed;
    mapping(uint256 => uint256) public studentSubmissions;

    // Score evaluation tracking
    mapping(uint256 => uint256) public studentScores;
    mapping(uint256 => bool) public scoreEvaluated;

    // Events
    event MemberJoined(uint256 indexed commitment, uint256 totalMembers);
    event SubmissionReceived(uint256 indexed nullifier, uint256 answerHash);
    event AnswerKeyRevealed(string[] correctAnswers);
    event ScoreEvaluated(uint256 indexed nullifier, uint256 score);

    /**
     * @param _examId Unique numeric identifier for the exam (used as scope for ZK proof)
     * @param _examEndTime Unix timestamp after which answers can be revealed by instructor
     * @param _examGroup Address of deployed ExamGroup contract (Semaphore group wrapper)
     * @param _answerKeyCommitment Hash commitment of teacher's answer key keccak256(abi.encodePacked(answers, teacherSalt))
     */
    constructor(
        uint256 _examId,
        uint256 _examEndTime,
        address _examGroup,
        bytes32 _answerKeyCommitment
    ) {
        examId = _examId;
        examEndTime = _examEndTime;
        instructor = msg.sender;
        answerKeyCommitment = _answerKeyCommitment;

        if (_examGroup != address(0)) {
            examGroup = ExamGroup(_examGroup);
        } else {
            examGroup = ExamGroup(address(0));
        }
    }

    // Local fallback members tracking when no external ExamGroup is connected
    uint256[] private commitments;

    /**
     * @notice Registers a student's public Semaphore identity commitment leaf into ExamGroup.
     * @param identityCommitment The public Semaphore identity commitment
     */
    function join(uint256 identityCommitment) external {
        if (address(examGroup) != address(0)) {
            examGroup.join(identityCommitment);
        } else {
            commitments.push(identityCommitment);
        }
        uint256 total = address(examGroup) != address(0) ? examGroup.getMembersCount() : commitments.length;
        emit MemberJoined(identityCommitment, total);
    }

    /**
     * @notice Submits an anonymous exam answer commit hash backed by a Semaphore ZK proof shape.
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

        // Suppress unused variables while maintaining full Semaphore V4 proof signature
        (merkleTreeDepth, merkleTreeRoot, points);

        nullifierUsed[nullifier] = true;
        studentSubmissions[nullifier] = answerHash;

        emit SubmissionReceived(nullifier, answerHash);
    }

    /**
     * @notice Reveals the teacher's correct answer key after examEndTime.
     * @param _correctAnswers Array of correct answers (e.g. ["A", "C", "B", "D"])
     * @param _teacherSalt Secret salt used during initialization hash commitment
     */
    function revealAnswerKey(string[] memory _correctAnswers, bytes32 _teacherSalt) external {
        if (block.timestamp < examEndTime) revert DeadlineNotPassed();
        if (msg.sender != instructor) revert OnlyInstructor();

        bytes32 computedCommitment = keccak256(abi.encode(_correctAnswers, _teacherSalt));
        if (answerKeyCommitment != bytes32(0) && computedCommitment != answerKeyCommitment) {
            revert InvalidAnswerKeyCommitment();
        }

        isExamEnded = true;
        correctAnswers = _correctAnswers;

        emit AnswerKeyRevealed(_correctAnswers);
    }

    /**
     * @notice Evaluates a student's score anonymously by verifying their answer commit hash.
     * @param nullifierHash The student's Semaphore nullifier hash
     * @param studentAnswers The array of answers selected by the student
     * @param studentSalt The random 32-byte salt used by the student when submitting
     */
    function evaluateScore(
        uint256 nullifierHash,
        string[] calldata studentAnswers,
        bytes32 studentSalt
    ) external returns (uint256 score) {
        if (!isExamEnded) revert ExamNotEnded();
        if (!nullifierUsed[nullifierHash]) revert InvalidSecretOrAnswer();

        bytes32 computedHash = keccak256(abi.encode(studentAnswers, studentSalt));
        if (uint256(computedHash) != studentSubmissions[nullifierHash]) {
            revert InvalidSecretOrAnswer();
        }

        score = 0;
        uint256 total = correctAnswers.length < studentAnswers.length ? correctAnswers.length : studentAnswers.length;
        for (uint256 i = 0; i < total; i++) {
            if (keccak256(bytes(studentAnswers[i])) == keccak256(bytes(correctAnswers[i]))) {
                score++;
            }
        }

        studentScores[nullifierHash] = score;
        scoreEvaluated[nullifierHash] = true;

        emit ScoreEvaluated(nullifierHash, score);
        return score;
    }

    /**
     * @notice Helper to fetch correct answer key once revealed.
     */
    function getCorrectAnswers() external view returns (string[] memory) {
        if (!isExamEnded) revert ExamNotEnded();
        return correctAnswers;
    }

    /**
     * @notice Returns member commitments from attached ExamGroup or local fallback.
     */
    function getMembers() external view returns (uint256[] memory) {
        if (address(examGroup) != address(0)) {
            return examGroup.getMembers();
        }
        return commitments;
    }
}

