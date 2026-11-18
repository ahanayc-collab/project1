/*
# Add marks column + expand to 5 students

## Changes
1. Adds `marks` (integer, nullable) column to grades table for storing numeric marks (0-100).
2. Updates existing grade rows with appropriate marks values matching their letter grade.
3. Adds 2 more students (104, 105) to reach the 5-student minimum for the demo.
4. Adds grades and login accounts for the new students.

## Marks mapping used
- O (Outstanding): 90-100 · A+: 80-89 · A: 70-79 · B+: 60-69 · B: 50-59 · C: 40-49 · D: 30-39 · F: <30

## Security
No security changes. Existing RLS policies and grants remain in effect.
*/

ALTER TABLE grades ADD COLUMN IF NOT EXISTS marks integer;

-- Backfill marks for existing grades
UPDATE grades SET marks = 75 WHERE student_id = '101' AND course_id = 'CS301';
UPDATE grades SET marks = 65 WHERE student_id = '101' AND course_id = 'CS302';
UPDATE grades SET marks = 95 WHERE student_id = '102' AND course_id = 'CS301';
UPDATE grades SET marks = 88 WHERE student_id = '103' AND course_id = 'DS303';
UPDATE grades SET marks = 78 WHERE student_id = '103' AND course_id = 'CS301';

-- Add 2 more students
INSERT INTO students (student_id, name, email, department, enrollment_date) VALUES
  ('104', 'Sneha Patel', 'sneha.patel@college.edu', 'Information Technology', '2023-08-15'),
  ('105', 'Arjun Rao', 'arjun.rao@college.edu', 'Data Science', '2024-01-15')
ON CONFLICT (student_id) DO NOTHING;

-- Add grades for new students
INSERT INTO grades (student_id, course_id, grade, marks, semester) VALUES
  ('104', 'CS302', 'A', 72, '2026-2027'),
  ('104', 'DS303', 'B+', 68, '2026-2027'),
  ('104', 'CS301', 'B', 55, '2026-2027'),
  ('105', 'DS303', 'O', 92, '2026-2027'),
  ('105', 'CS301', 'A+', 85, '2026-2027')
ON CONFLICT (student_id, course_id, semester) DO NOTHING;

-- Add login accounts for new students
INSERT INTO users (email, password, role, name, student_id) VALUES
  ('sneha.patel@college.edu', 'student123', 'student', 'Sneha Patel', '104'),
  ('arjun.rao@college.edu', 'student123', 'student', 'Arjun Rao', '105')
ON CONFLICT (email) DO NOTHING;
