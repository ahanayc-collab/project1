/*
# Update to real college data + 10-point grade scale

## Changes
1. Grade constraint expanded from (A,B,C,D,F) to (O, A+, A, B+, B, C, D, F)
   to support the Indian 10-point grading system used by the college.
2. Old demo seed data removed (grades, student login accounts, students, courses).
   The admin login account is preserved.
3. New real data inserted: 3 courses, 3 students, 5 grade records, 3 student logins.

## Grade Points (10-point scale)
- O = 10 (Outstanding) · A+ = 9 · A = 8 · B+ = 7 · B = 6 · C = 5 · D = 4 · F = 0

## New Courses
- CS301: Database Management Systems (4 credits)
- CS302: Computer Networks (3 credits)
- DS303: Data Structures (4 credits)

## New Students
- 101: Rahul Sharma, Computer Science  — CS301 (A), CS302 (B+)
- 102: Priya Nair, Information Technology — CS301 (O)
- 103: Amit Verma, Data Science — DS303 (A+), CS301 (A)

## Security
No security changes. RLS policies and grants from the initial migration remain in effect.
*/

-- 1. Expand grade constraint to support 10-point scale
ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_grade_check;
ALTER TABLE grades ADD CONSTRAINT grades_grade_check
  CHECK (grade IN ('O','A+','A','B+','B','C','D','F'));

-- 2. Remove old demo data (admin account preserved — role = 'admin')
DELETE FROM grades;
DELETE FROM users WHERE role = 'student';
DELETE FROM students;
DELETE FROM courses;

-- 3. Insert new courses
INSERT INTO courses (course_id, course_name, credits, instructor) VALUES
  ('CS301', 'Database Management Systems', 4, 'Dr. Rajesh Kumar'),
  ('CS302', 'Computer Networks', 3, 'Dr. Sunita Reddy'),
  ('DS303', 'Data Structures', 4, 'Dr. Vikram Singh');

-- 4. Insert new students
INSERT INTO students (student_id, name, email, department, enrollment_date) VALUES
  ('101', 'Rahul Sharma', 'rahul.sharma@college.edu', 'Computer Science', '2024-08-15'),
  ('102', 'Priya Nair', 'priya.nair@college.edu', 'Information Technology', '2024-08-15'),
  ('103', 'Amit Verma', 'amit.verma@college.edu', 'Data Science', '2024-08-15');

-- 5. Insert grades
INSERT INTO grades (student_id, course_id, grade, semester) VALUES
  ('101', 'CS301', 'A', '2026-2027'),
  ('101', 'CS302', 'B+', '2026-2027'),
  ('102', 'CS301', 'O', '2026-2027'),
  ('103', 'DS303', 'A+', '2026-2027'),
  ('103', 'CS301', 'A', '2026-2027');

-- 6. Insert student login accounts
INSERT INTO users (email, password, role, name, student_id) VALUES
  ('rahul.sharma@college.edu', 'student123', 'student', 'Rahul Sharma', '101'),
  ('priya.nair@college.edu', 'student123', 'student', 'Priya Nair', '102'),
  ('amit.verma@college.edu', 'student123', 'student', 'Amit Verma', '103');
