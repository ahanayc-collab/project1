import { useEffect, useMemo, useState } from 'react';
import {
  Users, BookOpen, TrendingUp, Plus, Search, Download, Pencil, Trash2,
  GraduationCap, LogOut, CheckCircle2, UserPlus, ClipboardList, Award, Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Student, Course, Grade } from '@/types';
import { GRADE_POINTS, gpaFromGrades, ALL_GRADES, GradeLetter, markToGrade } from '@/types';
import { Modal } from './Modal';
import { DreamyBackground } from './DreamyBackground';
import type { User } from '@/types';

interface Props {
  user: User;
  onLogout: () => void;
}

type Tab = 'overview' | 'directory' | 'forms';

export function AdminDashboard({ user, onLogout }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    const [s, c, g] = await Promise.all([
      supabase.from('students').select('*').order('student_id'),
      supabase.from('courses').select('*').order('course_id'),
      supabase.from('grades').select('*'),
    ]);
    setStudents(s.data ?? []);
    setCourses(c.data ?? []);
    setGrades(g.data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2600); }

  const departments = useMemo(() => {
    const set = new Set(students.map((s) => s.department));
    return ['all', ...Array.from(set).sort()];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesDept = deptFilter === 'all' || s.department === deptFilter;
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q);
      return matchesDept && matchesQuery;
    });
  }, [students, deptFilter, query]);

  const avgGpa = useMemo(() => {
    const byStudent = new Map<string, { grade: string; course?: Course }[]>();
    for (const g of grades) {
      const course = courses.find((c) => c.course_id === g.course_id);
      const arr = byStudent.get(g.student_id) ?? [];
      arr.push({ grade: g.grade, course });
      byStudent.set(g.student_id, arr);
    }
    const gpas: number[] = [];
    byStudent.forEach((arr) => gpas.push(gpaFromGrades(arr)));
    if (gpas.length === 0) return 0;
    return Math.round((gpas.reduce((a, b) => a + b, 0) / gpas.length) * 100) / 100;
  }, [grades, courses]);

  function exportCsv() {
    const header = ['StudentID', 'Name', 'Email', 'Department', 'EnrollmentDate'];
    const rows = filteredStudents.map((s) => [s.student_id, s.name, s.email, s.department, s.enrollment_date]);
    const csv = [header, ...rows].map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV report downloaded.');
  }

  async function deleteStudent(student: Student) {
    if (!confirm(`Delete ${student.name}? This also removes their grades and login account.`)) return;
    await supabase.from('grades').delete().eq('student_id', student.student_id);
    await supabase.from('users').delete().eq('student_id', student.student_id);
    const { error } = await supabase.from('students').delete().eq('student_id', student.student_id);
    if (error) { showToast('Could not delete student.'); return; }
    showToast(`${student.name} deleted.`);
    loadAll();
  }

  return (
    <div className="relative min-h-screen">
      <DreamyBackground />
      <Header user={user} onLogout={onLogout} />

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
          {([
            ['overview', 'Overview', TrendingUp],
            ['directory', 'Student Directory', Users],
            ['forms', 'Manage Records', ClipboardList],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                tab === key
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-slate-400">Loading records…</div>
        ) : (
          <>
            {tab === 'overview' && <Overview students={students} courses={courses} avgGpa={avgGpa} grades={grades} />}
            {tab === 'directory' && (
              <Directory
                students={filteredStudents}
                query={query} setQuery={setQuery}
                departments={departments} deptFilter={deptFilter} setDeptFilter={setDeptFilter}
                onExport={exportCsv}
                onEdit={(s) => { setEditStudent(s); setAddStudentOpen(true); }}
                onDelete={deleteStudent}
                onAdd={() => { setEditStudent(null); setAddStudentOpen(true); }}
                grades={grades}
              />
            )}
            {tab === 'forms' && (
              <FormsHub
                students={students} courses={courses}
                onOpenAdd={() => { setEditStudent(null); setAddStudentOpen(true); }}
                onOpenEnroll={() => setEnrollOpen(true)}
                onOpenGrade={() => setGradeOpen(true)}
              />
            )}
          </>
        )}
      </main>

      <AddStudentModal open={addStudentOpen} onClose={() => setAddStudentOpen(false)} editing={editStudent}
        onSaved={() => { setAddStudentOpen(false); loadAll(); showToast(editStudent ? 'Student updated.' : 'Student added.'); }} />
      <EnrollModal open={enrollOpen} onClose={() => setEnrollOpen(false)} students={students} courses={courses} grades={grades}
        onSaved={() => { setEnrollOpen(false); loadAll(); showToast('Student enrolled.'); }} />
      <GradeModal open={gradeOpen} onClose={() => setGradeOpen(false)} students={students} courses={courses} grades={grades}
        onSaved={() => { setGradeOpen(false); loadAll(); showToast('Grade saved.'); }} />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-white/10 bg-navy-800/90 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-xl animate-slide-up"
          style={{ boxShadow: '0 0 30px rgba(99,102,241,0.2)' }}>
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}

function Header({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-obsidian-950/60 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 text-white"
            style={{ boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
              UniPortal · Admin
              <Sparkles className="h-3 w-3 text-indigo-400" />
            </p>
            <p className="text-xs text-slate-400">{user.name}</p>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </header>
  );
}

function Overview({ students, courses, avgGpa, grades }: { students: Student[]; courses: Course[]; avgGpa: number; grades: Grade[]; }) {
  const cards = [
    { label: 'Total Students', value: String(students.length), icon: Users, glow: 'rgba(59,130,246,0.3)', text: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total Courses', value: String(courses.length), icon: BookOpen, glow: 'rgba(16,185,129,0.3)', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Average GPA', value: avgGpa.toFixed(2), icon: TrendingUp, glow: 'rgba(245,158,11,0.3)', text: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Grades Recorded', value: String(grades.length), icon: Award, glow: 'rgba(139,92,246,0.3)', text: 'text-violet-400', bg: 'bg-violet-500/10' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="glass-card glow-card p-5" style={{ '--glow': c.glow } as React.CSSProperties}>
            <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${c.bg} ${c.text}`}
              style={{ boxShadow: `0 0 20px ${c.glow}` }}>
              <c.icon className="h-6 w-6" />
            </div>
            <p className="text-3xl font-bold text-white">{c.value}</p>
            <p className="mt-1 text-sm text-slate-400">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card glow-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Students by Department</h3>
          <DeptBar students={students} />
        </div>
        <div className="glass-card glow-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Recent Students</h3>
          <div className="space-y-2">
            {students.slice(-5).reverse().map((s) => (
              <div key={s.student_id} className="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-white/5">
                <div>
                  <p className="text-sm font-medium text-white">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.student_id} · {s.department}</p>
                </div>
                <span className="text-xs text-slate-500">{s.enrollment_date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeptBar({ students }: { students: Student[] }) {
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    students.forEach((s) => m.set(s.department, (m.get(s.department) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [students]);
  const max = Math.max(1, ...counts.map((c) => c[1]));
  const palette = ['from-indigo-500 to-blue-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500', 'from-violet-500 to-purple-500', 'from-rose-500 to-pink-500'];
  return (
    <div className="space-y-3">
      {counts.map(([dept, n], i) => (
        <div key={dept}>
          <div className="mb-1 flex justify-between text-xs text-slate-400">
            <span className="font-medium text-slate-300">{dept}</span>
            <span>{n}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-white/5">
            <div className={`h-2.5 rounded-full bg-gradient-to-r ${palette[i % palette.length]} transition-all duration-500`} style={{ width: `${(n / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Directory({
  students, query, setQuery, departments, deptFilter, setDeptFilter,
  onExport, onEdit, onDelete, onAdd, grades,
}: {
  students: Student[]; query: string; setQuery: (v: string) => void;
  departments: string[]; deptFilter: string; setDeptFilter: (v: string) => void;
  onExport: () => void; onEdit: (s: Student) => void; onDelete: (s: Student) => void;
  onAdd: () => void; grades: Grade[];
}) {
  const deptClass = (dept: string) => {
    const map: Record<string, string> = {
      'Computer Science': 'bg-blue-500/15 text-blue-300 border border-blue-500/20',
      'Information Technology': 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20',
      'Data Science': 'bg-violet-500/15 text-violet-300 border border-violet-500/20',
    };
    return map[dept] ?? 'bg-white/10 text-slate-300 border border-white/10';
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, email, or ID…"
              className="input pl-10" />
          </div>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="input sm:w-56">
            {departments.map((d) => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={onAdd} className="glow-btn flex items-center gap-1.5 px-4 py-2.5 text-sm">
            <Plus className="h-4 w-4" /> Add Student
          </button>
          <button onClick={onExport} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 backdrop-blur transition hover:bg-white/10">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Enrolled</th>
                <th className="px-4 py-3 font-semibold">Grades</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {students.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">No students match your filters.</td></tr>
              ) : students.map((s) => {
                const count = grades.filter((g) => g.student_id === s.student_id).length;
                return (
                  <tr key={s.student_id} className="transition hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{s.student_id}</td>
                    <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                    <td className="px-4 py-3 text-slate-400">{s.email}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${deptClass(s.department)}`}>{s.department}</span></td>
                    <td className="px-4 py-3 text-slate-500">{s.enrollment_date}</td>
                    <td className="px-4 py-3 text-slate-400">{count}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => onEdit(s)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-indigo-500/10 hover:text-indigo-400" aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => onDelete(s)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400" aria-label="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FormsHub({ students, courses, onOpenAdd, onOpenEnroll, onOpenGrade }: {
  students: Student[]; courses: Course[];
  onOpenAdd: () => void; onOpenEnroll: () => void; onOpenGrade: () => void;
}) {
  const cards = [
    { title: 'Add New Student', desc: 'Create a student record with name, email, department and enrollment date.', icon: UserPlus, action: onOpenAdd, btn: 'Add Student', glow: 'rgba(59,130,246,0.25)', text: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Enroll Student in Course', desc: 'Register a student into a course for the current semester.', icon: BookOpen, action: onOpenEnroll, btn: 'Enroll', glow: 'rgba(16,185,129,0.25)', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Assign / Edit Grades', desc: 'Record or update a letter grade and marks for a student in a specific course.', icon: Award, action: onOpenGrade, btn: 'Manage Grades', glow: 'rgba(139,92,246,0.25)', text: 'text-violet-400', bg: 'bg-violet-500/10' },
  ];
  return (
    <div className="animate-fade-in grid gap-4 md:grid-cols-3">
      {cards.map((c) => (
        <div key={c.title} className="glass-card glow-card flex flex-col p-6">
          <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${c.bg} ${c.text}`}
            style={{ boxShadow: `0 0 20px ${c.glow}` }}>
            <c.icon className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-white">{c.title}</h3>
          <p className="mt-2 flex-1 text-sm text-slate-400">{c.desc}</p>
          <button onClick={c.action} className="glow-btn mt-4 w-full py-2.5 text-sm">{c.btn}</button>
        </div>
      ))}
    </div>
  );
}

function AddStudentModal({ open, onClose, editing, onSaved }: {
  open: boolean; onClose: () => void; editing: Student | null; onSaved: () => void;
}) {
  const [form, setForm] = useState({ student_id: '', name: '', email: '', department: '', enrollment_date: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setError('');
      setForm(editing
        ? { student_id: editing.student_id, name: editing.name, email: editing.email, department: editing.department, enrollment_date: editing.enrollment_date }
        : { student_id: '', name: '', email: '', department: 'Computer Science', enrollment_date: new Date().toISOString().slice(0, 10) });
    }
  }, [open, editing]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    const payload = {
      student_id: form.student_id.trim().toUpperCase(),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      department: form.department.trim(),
      enrollment_date: form.enrollment_date,
    };
    if (editing) {
      const { error } = await supabase.from('students').update(payload).eq('student_id', editing.student_id);
      setSaving(false);
      if (error) { setError(error.message); return; }
      onSaved();
    } else {
      const { error } = await supabase.from('students').insert(payload);
      if (error) { setSaving(false); setError(error.message); return; }
      await supabase.from('users').insert({ email: payload.email, password: 'student123', role: 'student', name: payload.name, student_id: payload.student_id });
      setSaving(false);
      onSaved();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Student' : 'Add New Student'}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Student ID" disabled={!!editing}>
          <input value={form.student_id} disabled={!!editing} onChange={(e) => setForm({ ...form, student_id: e.target.value })} required className="input" placeholder="106" />
        </Field>
        <Field label="Full Name">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input" placeholder="Jane Doe" />
        </Field>
        <Field label="Email">
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="input" placeholder="jane@college.edu" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Department">
            <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required className="input" placeholder="Computer Science" />
          </Field>
          <Field label="Enrollment Date">
            <input type="date" value={form.enrollment_date} onChange={(e) => setForm({ ...form, enrollment_date: e.target.value })} required className="input" />
          </Field>
        </div>
        {!editing && (
          <p className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-300">
            A student login account is auto-created with password <span className="font-mono font-semibold">student123</span>.
          </p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5">Cancel</button>
          <button type="submit" disabled={saving} className="glow-btn px-5 py-2.5 text-sm disabled:opacity-60">
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Student'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EnrollModal({ open, onClose, students, courses, grades, onSaved }: {
  open: boolean; onClose: () => void; students: Student[]; courses: Course[]; grades: Grade[]; onSaved: () => void;
}) {
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [semester, setSemester] = useState('2026-2027');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setError(''); setStudentId(students[0]?.student_id ?? ''); setCourseId(courses[0]?.course_id ?? ''); setSemester('2026-2027'); } }, [open, students, courses]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    const existing = grades.find((g) => g.student_id === studentId && g.course_id === courseId && g.semester === semester);
    if (existing) { setSaving(false); setError('This student is already enrolled in that course for the selected semester.'); return; }
    const { error } = await supabase.from('grades').insert({ student_id: studentId, course_id: courseId, semester, grade: 'F', marks: 0 });
    setSaving(false);
    if (error) { setError(error.message); return; }
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title="Enroll Student in Course">
      <form onSubmit={save} className="space-y-4">
        <Field label="Student">
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="input" required>
            {students.map((s) => <option key={s.student_id} value={s.student_id}>{s.name} ({s.student_id})</option>)}
          </select>
        </Field>
        <Field label="Course">
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="input" required>
            {courses.map((c) => <option key={c.course_id} value={c.course_id}>{c.course_name} — {c.credits} cr</option>)}
          </select>
        </Field>
        <Field label="Semester">
          <input value={semester} onChange={(e) => setSemester(e.target.value)} className="input" required />
        </Field>
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          The student is enrolled with a placeholder grade. Use "Manage Grades" to assign the real letter grade and marks.
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5">Cancel</button>
          <button type="submit" disabled={saving} className="glow-btn px-5 py-2.5 text-sm disabled:opacity-60">{saving ? 'Enrolling…' : 'Enroll'}</button>
        </div>
      </form>
    </Modal>
  );
}

function GradeModal({ open, onClose, students, courses, grades, onSaved }: {
  open: boolean; onClose: () => void; students: Student[]; courses: Course[]; grades: Grade[]; onSaved: () => void;
}) {
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [semester, setSemester] = useState('2026-2027');
  const [gradeVal, setGradeVal] = useState<GradeLetter>('A');
  const [marks, setMarks] = useState<string>('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setError(''); setStudentId(students[0]?.student_id ?? ''); setCourseId(courses[0]?.course_id ?? '');
      setSemester('2026-2027'); setGradeVal('A'); setMarks('');
    }
  }, [open, students, courses]);

  useEffect(() => {
    if (!open) return;
    const existing = grades.find((g) => g.student_id === studentId && g.course_id === courseId && g.semester === semester);
    if (existing) { setGradeVal(existing.grade); setMarks(existing.marks != null ? String(existing.marks) : ''); }
  }, [studentId, courseId, semester, grades, open]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    const marksNum = marks.trim() === '' ? null : Math.max(0, Math.min(100, parseInt(marks, 10)));
    if (marks.trim() !== '' && isNaN(marksNum as number)) { setSaving(false); setError('Marks must be a number between 0 and 100.'); return; }
    const existing = grades.find((g) => g.student_id === studentId && g.course_id === courseId && g.semester === semester);
    if (existing) {
      const { error } = await supabase.from('grades').update({ grade: gradeVal, marks: marksNum }).eq('id', existing.id);
      setSaving(false);
      if (error) { setError(error.message); return; }
      onSaved();
    } else {
      const { error } = await supabase.from('grades').insert({ student_id: studentId, course_id: courseId, semester, grade: gradeVal, marks: marksNum });
      setSaving(false);
      if (error) { setError(error.message); return; }
      onSaved();
    }
  }

  const letterColors: Record<string, string> = {
    'O': 'border-emerald-500 bg-emerald-500/20 text-emerald-300',
    'A+': 'border-green-500 bg-green-500/20 text-green-300',
    'A': 'border-blue-500 bg-blue-500/20 text-blue-300',
    'B+': 'border-cyan-500 bg-cyan-500/20 text-cyan-300',
    'B': 'border-amber-500 bg-amber-500/20 text-amber-300',
    'C': 'border-orange-500 bg-orange-500/20 text-orange-300',
    'D': 'border-rose-500 bg-rose-500/20 text-rose-300',
    'F': 'border-red-500 bg-red-500/20 text-red-300',
  };

  return (
    <Modal open={open} onClose={onClose} title="Assign / Edit Grade">
      <form onSubmit={save} className="space-y-4">
        <Field label="Student">
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="input" required>
            {students.map((s) => <option key={s.student_id} value={s.student_id}>{s.name} ({s.student_id})</option>)}
          </select>
        </Field>
        <Field label="Course">
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="input" required>
            {courses.map((c) => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Semester">
            <input value={semester} onChange={(e) => setSemester(e.target.value)} className="input" required />
          </Field>
          <Field label="Marks (0-100)">
            <input type="number" min={0} max={100} value={marks} onChange={(e) => {
              const v = e.target.value;
              setMarks(v);
              if (v.trim() !== '') setGradeVal(markToGrade(parseInt(v, 10)));
            }} className="input" placeholder="e.g. 85" />
          </Field>
        </div>
        <Field label="Grade">
          <div className="flex flex-wrap gap-2">
            {ALL_GRADES.map((l) => (
              <button type="button" key={l} onClick={() => setGradeVal(l)}
                className={`flex-1 rounded-xl border-2 px-2 py-2.5 text-sm font-bold transition ${gradeVal === l ? letterColors[l] : 'border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-400'}`}>
                {l}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">10-point scale — O: 10, A+: 9, A: 8, B+: 7, B: 6, C: 5, D: 4, F: 0</p>
        </Field>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5">Cancel</button>
          <button type="submit" disabled={saving} className="glow-btn px-5 py-2.5 text-sm disabled:opacity-60">{saving ? 'Saving…' : 'Save Grade'}</button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children, disabled }: { label: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <label className={`block ${disabled ? 'opacity-60' : ''}`}>
      <span className="mb-1.5 block text-sm font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}
