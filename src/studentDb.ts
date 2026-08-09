export interface StudentRecord {
  id: string;
  name: string;
  email: string;
  password: string; // Hardcoded password for Step 1 Web2 authentication gate
  isEnrolled: boolean;
  hasRegistered: boolean; // Flag indicating if commitment was registered
}

/**
 * Step 1: Mock University Web2 Database (10 Students Roster)
 * Stores official student enrollment status & hardcoded credentials.
 * PRIVACY GUARANTEE: Does NOT store any Semaphore commitments or keys.
 */
class UniversityDatabase {
  private students: Map<string, StudentRecord> = new Map();

  constructor() {
    this.seedStudents();
  }

  private seedStudents() {
    const defaultRoster: StudentRecord[] = [
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
    ];

    defaultRoster.forEach((student) => {
      this.students.set(student.email.toLowerCase(), { ...student });
    });
  }

  /**
   * Step 1 Verification: Calls backend server POST /login
   */
  public async authenticateStudent(
    email: string,
    password?: string
  ): Promise<{ success: boolean; student?: Omit<StudentRecord, 'password' | 'hasRegistered'>; message: string }> {
    try {
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('Backend login request error:', err);
      return {
        success: false,
        message: 'Authentication Failed: Unable to connect to backend server at http://localhost:3001',
      };
    }
  }

  public hasStudentRegistered(_email: string): boolean {
    return false;
  }

  public markAsRegistered(_email: string): boolean {
    return true;
  }

  public getAllRecords(): StudentRecord[] {
    return Array.from(this.students.values());
  }
}

export const universityDb = new UniversityDatabase();

