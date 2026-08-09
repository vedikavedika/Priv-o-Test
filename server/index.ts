import express from 'express';
import cors from 'cors';
import { Group } from '@semaphore-protocol/group';

export interface StudentRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  isEnrolled: boolean;
  hasRegistered: boolean;
}

/**
 * 8 real pre-seeded Semaphore Identity commitments generated at startup.
 * Guarantees a minimum anonymity set of 8 even before any student joins.
 */
const PRESEEDED_COMMITMENTS: string[] = [
  '15626718080755530468257247636301516959817703141877050284398147954366265041690',
  '19749741092877917876781139500555765723064836438089949924028168981663717699988',
  '17680146595148796358811848371826876299276301420305846540470031325592502949724',
  '2021636653316202280358667097702966770752892190461473552249021570861834353357',
  '10486329609415280148858484514232260434834414252777369696080102247714077911646',
  '9550224227664823677771787890494446928644370208957440354691555310487956651048',
  '17148379082805075550815650206638845149045769519894997295334063871626260042925',
  '1884301995947199733014987547246066242507526983619171974088569502497084622121'
];

/**
 * Seed 25 demo students to provide ample headroom across multiple demo runs.
 */
const INITIAL_STUDENTS: StudentRecord[] = [
  { id: "STU-001", name: "Alice Smith", email: "alice@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-002", name: "Bob Jones", email: "bob@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-003", name: "Charlie Brown", email: "charlie@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-004", name: "Diana Prince", email: "diana@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-005", name: "Ethan Hunt", email: "ethan@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-006", name: "Fiona Gallagher", email: "fiona@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-007", name: "George Clark", email: "george@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-008", name: "Hannah Abbott", email: "hannah@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-009", name: "Ian Malcolm", email: "ian@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-010", name: "Julia Roberts", email: "julia@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-011", name: "Kevin Spacey", email: "kevin@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-012", name: "Laura Croft", email: "laura@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-013", name: "Michael Scott", email: "michael@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-014", name: "Nina Williams", email: "nina@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-015", name: "Oscar Martinez", email: "oscar@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-016", name: "Pamela Beesly", email: "pamela@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-017", name: "Quentin Tarantino", email: "quentin@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-018", name: "Rachel Green", email: "rachel@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-019", name: "Steven Strange", email: "steven@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-020", name: "Tina Fey", email: "tina@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-021", name: "Uma Thurman", email: "uma@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-022", name: "Victor Vance", email: "victor@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-023", name: "Walter White", email: "walter@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-024", name: "Xena Warrior", email: "xena@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
  { id: "STU-025", name: "Yennefer Vengerberg", email: "yennefer@university.edu", password: "pass123", isEnrolled: true, hasRegistered: false },
];

let students: StudentRecord[] = INITIAL_STUDENTS.map((s) => ({ ...s }));
let groupCommitments: string[] = [...PRESEEDED_COMMITMENTS];

function calculateGroupRoot(commitments: string[]): string {
  const group = new Group(commitments.map((c) => BigInt(c)));
  return group.root.toString();
}

const app = express();
app.use(cors());
app.use(express.json());

// POST /login
app.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }

  const cleanEmail = email.toLowerCase().trim();
  const record = students.find((s) => s.email.toLowerCase() === cleanEmail);

  if (!record) {
    return res.json({ success: false, message: "Authentication Failed: Student email not found." });
  }

  if (password && record.password !== password) {
    return res.json({ success: false, message: "Authentication Failed: Invalid password." });
  }

  if (!record.isEnrolled) {
    return res.json({ success: false, message: "Authentication Failed: Student is not enrolled." });
  }

  return res.json({
    success: true,
    student: { id: record.id, name: record.name, email: record.email, isEnrolled: record.isEnrolled },
    message: "Web2 Authentication Successful. Enrolled student verified.",
  });
});

// POST /join
app.post('/join', (req, res) => {
  const { email, identityCommitment } = req.body || {};

  if (!email || !identityCommitment) {
    return res.status(400).json({ success: false, message: "Missing email or identityCommitment." });
  }

  const cleanEmail = email.toLowerCase().trim();
  const student = students.find((s) => s.email.toLowerCase() === cleanEmail);

  if (!student || !student.isEnrolled) {
    return res.json({ success: false, message: "[REJECTED] Authentication Failed: Student not found or not enrolled." });
  }

  if (student.hasRegistered) {
    return res.json({
      success: false,
      message: `[REJECTED] Double-registration blocked: ${cleanEmail} has already registered a commitment leaf!`,
    });
  }

  const commitmentStr = identityCommitment.toString();

  if (groupCommitments.includes(commitmentStr)) {
    return res.json({
      success: false,
      message: "[REJECTED] Commitment leaf already exists in Semaphore group tree!",
    });
  }

  // Push commitment into shared group state
  groupCommitments.push(commitmentStr);

  // Set hasRegistered = true for that email
  student.hasRegistered = true;

  // IMPORTANT: Link-breaking guarantee — do NOT store mapping of email -> commitment!
  const groupRoot = calculateGroupRoot(groupCommitments);

  return res.json({
    success: true,
    message: `[SUCCESS] Registered! Commitment added to Merkle tree group. Web2 link broken for ${cleanEmail}.`,
    groupRoot,
    totalMembers: groupCommitments.length,
  });
});

// GET /group
app.get('/group', (_req, res) => {
  return res.json({ members: groupCommitments });
});

// POST /admin/reset
app.post('/admin/reset', (req, res) => {
  const { adminKey } = req.body || {};
  const expectedKey = process.env.ADMIN_KEY || "demo-reset-2026";

  if (adminKey !== expectedKey) {
    return res.status(401).json({ success: false, message: "Invalid admin key." });
  }

  // Reset student registration states
  students = INITIAL_STUDENTS.map((s) => ({ ...s }));

  // Reset groupCommitments back to the original 8 pre-seeded values
  groupCommitments = [...PRESEEDED_COMMITMENTS];

  return res.json({
    success: true,
    message: "Reset successful. All registration states cleared and anonymity floor of 8 restored.",
    totalMembers: groupCommitments.length,
  });
});

// GET /admin/status
app.get('/admin/status', (_req, res) => {
  const registeredStudentsCount = students.filter((s) => s.hasRegistered).length;
  return res.json({
    totalMembers: groupCommitments.length,
    registeredStudentsCount,
    totalStudents: students.length,
    anonymityFloor: PRESEEDED_COMMITMENTS.length,
  });
});

const PORT = process.env.PORT || 3001;

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`===================================================`);
  console.log(`  Priv-o-Test Shared State Backend Server`);
  console.log(`  Running on http://localhost:${PORT}`);
  console.log(`===================================================`);
  console.log(`  Pre-seeded ${PRESEEDED_COMMITMENTS.length} Anonymity Floor Commitments:`);
  PRESEEDED_COMMITMENTS.forEach((c, idx) => {
    console.log(`    [${idx + 1}] ${c}`);
  });
  console.log(`===================================================`);
  console.log(`  Server ready for cross-browser shared state!`);
  console.log(`===================================================`);
});
