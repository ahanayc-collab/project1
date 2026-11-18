export type Role = 'admin' | 'student';

export type GradeLetter = 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';

export const ALL_GRADES: GradeLetter[] = ['O', 'A+', 'A', 'B+', 'B', 'C', 'D', 'F'];

export interface User {
  id: string;
  email: string;
  password: string;
  role: Role;
  name: string;
  student_id: string | null;
}

export interface Student {
  student_id: string;
  name: string;
  email: string;
  department: string;
  enrollment_date: string;
}

export interface Course {
  course_id: string;
  course_name: string;
  credits: number;
  instructor: string;
}

export interface Grade {
  id: string;
  student_id: string;
  course_id: string;
  grade: GradeLetter;
  semester: string;
  marks: number | null;
}

export interface GradeWithCourse extends Grade {
  course: Course;
}

// 10-point scale: O=10 (Outstanding), A+=9, A=8, B+=7, B=6, C=5, D=4, F=0
export const GRADE_POINTS: Record<string, number> = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'D': 4,
  'F': 0,
};

export const MAX_GPA = 10;

export function gpaFromGrades(grades: { grade: string; course?: { credits: number } }[]): number {
  let totalPoints = 0;
  let totalCredits = 0;
  for (const g of grades) {
    const credits = g.course?.credits ?? 3;
    totalPoints += (GRADE_POINTS[g.grade] ?? 0) * credits;
    totalCredits += credits;
  }
  if (totalCredits === 0) return 0;
  return Math.round((totalPoints / totalCredits) * 100) / 100;
}

// Map a numeric mark (0-100) to a letter grade
export function markToGrade(marks: number): GradeLetter {
  if (marks >= 90) return 'O';
  if (marks >= 80) return 'A+';
  if (marks >= 70) return 'A';
  if (marks >= 60) return 'B+';
  if (marks >= 50) return 'B';
  if (marks >= 40) return 'C';
  if (marks >= 30) return 'D';
  return 'F';
}
