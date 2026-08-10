# Priv-o-Test: Anonymous ZK Exam System

**Built for the IITG.eth (Road to Devcon) Hackathon**

Priv-o-Test is an anonymous online exam system that allows students to prove they are enrolled and submit their test answers without revealing their identity or their answers before the exam deadline.

By leveraging **Zero-Knowledge Proofs (ZKPs)** and a **commit-reveal architecture**, Priv-o-Test separates a student's identity from their exam submission. There are no crypto wallets, MetaMask popups, or any other form of hassle.

---

## The Core Idea

Priv-o-Test addresses two key privacy problems in digital testing:

### 1. Anonymous Submission

Nobody can trace **who submitted an answer**.

Each student creates a temporary, local Semaphore Identity directly in their browser. The identity's private key never leaves the browser, keeping the student's real-world identity separate from their exam submission.

### 2. Hidden Answers Until the Deadline

Nobody can see **what was submitted before the exam ends**.

During the exam, students submit a cryptographic commitment:

```text
hash(answer + salt)
```

The actual answers and salt are only revealed after the server-enforced exam deadline has passed.

---

##  The 8 Privacy Guarantees

### 1. Eligibility Gate

A mock Web2 login determines who is eligible to join the Semaphore group.

This simulates a future integration with privacy-preserving identity verification such as **ZK-Email** or government-issued credentials.

### 2. Local Identity

Private keys never leave the browser.

A temporary Semaphore identity is generated client-side using `new Identity()`, keeping the exam identity completely separate from wallet infrastructure.

### 3. Anonymous ZK Proof

The application uses a real `generateProof()` call to prove that a student is a member of the exam group without revealing which specific member is submitting.

### 4. Relayer Delivery — "Kohaku Layer"

Submissions are sent through a dedicated relayer server.

This prevents the student's IP address from being directly exposed to the submission service and helps separate network-level identity from the anonymous exam submission.

### 5. On-Chain-Style Verification

Before accepting a submission, the relayer verifies:

- The ZK proof
- The proof scope / exam ID
- Message structure and validity
- Submission format

This mirrors the verification logic that could later be moved fully on-chain.

### 6. Nullifier Protection

Semaphore nullifiers prevent the same anonymous identity from submitting multiple times while preserving anonymity.

The system can therefore enforce **one submission per identity** without learning which student submitted it.

### 7. Time-Locked Reveal

Exam answers remain locked until the exam deadline.

The server enforces the deadline and only allows the reveal and grading process after the exam period has ended.

### 8. Anonymity Set Floor

The shared server pre-seeds **8 identity commitments** when it starts.

This provides a minimum anonymity pool even before real students begin joining the exam.

---

## Architecture & Stack

| Layer                | Technology               |
| -------------------- | ------------------------ |
| Frontend             | React / Vite             |
| Backend              | Node.js / Express        |
| ZK Infrastructure    | Semaphore                |
| Smart Contracts      | Solidity / Hardhat       |
| Group State          | Shared backend           |
| Anonymous Submission | Custom Relayer           |
| Identity             | Local Semaphore Identity |

The repository also includes an on-chain reference implementation, `ExamGroup.sol`. The live demo uses a shared backend instead of relying on a live blockchain, making the demonstration more reliable.

---

## How the Pipeline Works

```text
Mock Login
    ↓
Create Local Semaphore Identity
    ↓
Join Shared Group
    ↓
Generate ZK Membership Proof
    ↓
Answer MCQs
    ↓
Hash(Answers + Salt)
    ↓
Submit ZK Proof + Commitment via Relayer
    ↓
Wait for Exam Deadline
    ↓
Reveal Answers + Salt
    ↓
Relayer Verifies Commitment
    ↓
Unlock Score
```

---

##  Running the App Locally

The application uses **three separate terminals**:

- Group State & Login Server
- Relayer Server
- Frontend / Vite Development Server

### 1. Install Dependencies

Before starting the servers, install the project dependencies:

```bash
npm install
```

This only needs to be done once after cloning the repository, or whenever dependencies change.

### 2. Start the Group State & Login Server

Open **Terminal 1**:

```bash
npm run server
```

Runs on:

```text
http://localhost:3001
```

This server handles:

- Mock Web2 authentication
- Shared Semaphore group state
- Student registration

### 3. Start the Relayer Server

Open **Terminal 2**:

```bash
npm run relayer
```

Runs on:

```text
http://localhost:3099
```

The relayer handles:

- Anonymous proof submissions
- Proof verification
- Time-locked reveals
- Submission status
- Commitment verification

### 4. Start the Frontend

Open **Terminal 3**:

```bash
npm run dev
```

Vite will start the frontend development server.

> **Note:** Make sure both backend servers (`3001` and `3099`) are running before opening the frontend in your browser.

---

## Demo Controls & Admin Features

### Admin Reset

The application provides an `/admin/reset` endpoint that clears the registration state while preserving the **8 pre-seeded anonymity-floor accounts**.

This makes it easy to restart the demonstration from a clean state.

### Demo Accounts

The mock database contains **25 seeded students**.

Default password:

```text
pass123
```

### Time-Lock Demo

The default exam duration is set to **4 minutes** so the complete commit → wait → reveal flow can be demonstrated quickly.

A live `MM:SS` countdown is displayed during the exam.

### Admin Demo Controls

An **Admin Demo Controls** panel allows the deadline to be skipped using the secure admin key.

> **Short on time while checking out the demo?**
> You can use the Admin Demo Controls to skip the waiting period and immediately experience the reveal and grading flow. Admin passkey: demo-reset-2026

---

## Future Work & Disclosures

### ZK-Email Integration

The current Web2 mock login is designed to be replaced with **ZK-Email**, allowing students to prove ownership of an institutional `.edu` email without exposing the email itself to the exam system.

### On-Chain Migration

`ExamGroup.sol` is included as an on-chain reference implementation.

The current live demo intentionally uses an off-chain shared server to avoid live blockchain dependencies and provide a smoother, more reliable hackathon presentation.

### Relayer Trust Point

The current relayer hides the student's IP from the wider submission flow, but the relayer itself remains a trust point.

It therefore **reduces network-level linkability rather than eliminating trust completely**.

A future version could replace the centralized relayer with a true **mixnet or decentralized relay architecture**.

---

## Why Priv-o-Test?

Traditional online exams require a centralized system to know:

```text
WHO submitted
        +
WHAT they submitted
        +
WHEN they submitted
```

Priv-o-Test separates these pieces using privacy-preserving cryptography:

```text
Student Identity
       ↓
Semaphore Membership Proof
       ↓
Anonymous Submission
       ↓
Commitment ────────────────┐
                           │
                    Exam Deadline
                           │
                           ↓
                    Answer + Salt
                           ↓
                  Commitment Match
                           ↓
                         Score
```

The result is an exam system where **eligibility can be proven without revealing identity, answers remain hidden until the exam ends, and duplicate submissions can be prevented without deanonymizing students.**

##
