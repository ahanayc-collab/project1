/*
# Student DBMS schema + seed data

## Overview
Creates four tables backing a Student Database Management System demo:
users (mock login), students, courses, grades. Pre-populated with
5 students, 5 courses, and sample grades for an immediately usable demo.

## Tables
### users — mock login accounts. role is 'admin' or 'student'. student_id links a student account to its student row. Passwords are plaintext because this is a MOCK login demo (no real Supabase auth).
### students — student_id (text PK), name, email, department, enrollment_date
### courses — course_id (text PK), course_name, credits, instructor
### grades — id (uuid PK), student_id, course_id, grade (A-F), semester; unique(student_id, course_id, semester)

## Security
Single-tenant demo with mock login — frontend uses the anon key. RLS on every table; CRUD granted to anon + authenticated; policies use USING (true) because data is intentionally shared/public for the demo.
*/

CREATE TABLE IF NOT EXISTS students (
  student_id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  department text NOT NULL,
  enrollment_date date NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS courses (
  course_id text PRIMARY KEY,
  course_name text NOT NULL,
  credits integer NOT NULL CHECK (credits > 0),
  instructor text NOT NULL
);

CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  course_id text NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  grade text NOT NULL CHECK (grade IN ('A','B','C','D','F')),
  semester text NOT NULL,
  UNIQUE (student_id, course_id, semester)
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','student')),
  name text NOT NULL,
  student_id text REFERENCES students(student_id) ON DELETE SET NULL
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON students TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON courses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON grades TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon, authenticated;

DROP POLICY IF EXISTS "anon_sel_students" ON students;
CREATE POLICY "anon_sel_students" ON students FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_ins_students" ON students;
CREATE POLICY "anon_ins_students" ON students FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_upd_students" ON students;
CREATE POLICY "anon_upd_students" ON students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_del_students" ON students;
CREATE POLICY "anon_del_students" ON students FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_sel_courses" ON courses;
CREATE POLICY "anon_sel_courses" ON courses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_ins_courses" ON courses;
CREATE POLICY "anon_ins_courses" ON courses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_upd_courses" ON courses;
CREATE POLICY "anon_upd_courses" ON courses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_del_courses" ON courses;
CREATE POLICY "anon_del_courses" ON courses FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_sel_grades" ON grades;
CREATE POLICY "anon_sel_grades" ON grades FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_ins_grades" ON grades;
CREATE POLICY "anon_ins_grades" ON grades FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_upd_grades" ON grades;
CREATE POLICY "anon_upd_grades" ON grades FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_del_grades" ON grades;
CREATE POLICY "anon_del_grades" ON grades FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_sel_users" ON users;
CREATE POLICY "anon_sel_users" ON users FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_ins_users" ON users;
CREATE POLICY "anon_ins_users" ON users FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_upd_users" ON users;
CREATE POLICY "anon_upd_users" ON users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_del_users" ON users;
CREATE POLICY "anon_del_users" ON users FOR DELETE TO anon, authenticated USING (true);

INSERT INTO courses (course_id, course_name, credits, instructor) VALUES
  ('C101', 'Introduction to Computer Science', 4, 'Dr. Alan Turing'),
  ('C102', 'Data Structures & Algorithms', 3, 'Dr. Grace Hopper'),
  ('C103', 'Database Systems', 3, 'Dr. Edgar Codd'),
  ('M201', 'Linear Algebra', 4, 'Dr. Emmy Noether'),
  ('E301', 'Engineering Economics', 2, 'Dr. John Nash')
ON CONFLICT (course_id) DO NOTHING;

INSERT INTO students (student_id, name, email, department, enrollment_date) VALUES
  ('S1001', 'Alice Johnson', 'alice.johnson@university.edu', 'Computer Science', '2024-08-15'),
  ('S1002', 'Brian Lee', 'brian.lee@university.edu', 'Computer Science', '2024-08-15'),
  ('S1003', 'Clara Martinez', 'clara.martinez@university.edu', 'Mathematics', '2023-01-10'),
  ('S1004', 'David Kim', 'david.kim@university.edu', 'Electrical Engineering', '2024-01-10'),
  ('S1005', 'Eva Thompson', 'eva.thompson@university.edu', 'Computer Science', '2023-08-15')
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO grades (student_id, course_id, grade, semester) VALUES
  ('S1001','C101','A','Fall 2026'),
  ('S1001','C102','B','Fall 2026'),
  ('S1001','C103','A','Fall 2026'),
  ('S1002','C101','B','Fall 2026'),
  ('S1002','C102','C','Fall 2026'),
  ('S1002','M201','A','Fall 2026'),
  ('S1003','M201','A','Fall 2026'),
  ('S1003','E301','B','Fall 2026'),
  ('S1003','C103','A','Fall 2026'),
  ('S1004','E301','B','Fall 2026'),
  ('S1004','C103','C','Fall 2026'),
  ('S1005','C101','A','Fall 2026'),
  ('S1005','C102','A','Fall 2026'),
  ('S1005','E301','B','Fall 2026')
ON CONFLICT (student_id, course_id, semester) DO NOTHING;

INSERT INTO users (email, password, role, name, student_id) VALUES
  ('admin@university.edu', 'admin123', 'admin', 'System Administrator', NULL),
  ('alice.johnson@university.edu', 'student123', 'student', 'Alice Johnson', 'S1001'),
  ('brian.lee@university.edu', 'student123', 'student', 'Brian Lee', 'S1002'),
  ('clara.martinez@university.edu', 'student123', 'student', 'Clara Martinez', 'S1003'),
  ('david.kim@university.edu', 'student123', 'student', 'David Kim', 'S1004'),
  ('eva.thompson@university.edu', 'student123', 'student', 'Eva Thompson', 'S1005')
ON CONFLICT (email) DO NOTHING;
