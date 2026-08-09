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
   * Step 1 Verification: Check email + password & course enrollment
   */
  public authenticateStudent(email: string, password?: string): { success: boolean; student?: Omit<StudentRecord, 'password' | 'hasRegistered'>; message: string } {
    const record = this.students.get(email.toLowerCase().trim());

    if (!record) {
      return { success: false, message: "Authentication Failed: Student email not found." };
    }

    if (password && record.password !== password) {
      return { success: false, message: "Authentication Failed: Invalid password." };
    }

    if (!record.isEnrolled) {
      return { success: false, message: "Authentication Failed: Student is not enrolled." };
    }

    return {
      success: true,
      student: { id: record.id, name: record.name, email: record.email, isEnrolled: record.isEnrolled },
      message: "Web2 Authentication Successful. Enrolled student verified.",
    };
  }

  public hasStudentRegistered(email: string): boolean {
    const record = this.students.get(email.toLowerCase().trim());
    return record ? record.hasRegistered : false;
  }

  public markAsRegistered(email: string): boolean {
    const record = this.students.get(email.toLowerCase().trim());
    if (!record) return false;
    record.hasRegistered = true;
    return true;
  }

  public getAllRecords(): StudentRecord[] {
    return Array.from(this.students.values());
  }
}

export const universityDb = new UniversityDatabase();
