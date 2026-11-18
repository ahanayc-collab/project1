import { useEffect, useMemo, useState } from 'react';
import {
  GraduationCap, LogOut, Mail, Building2, CalendarDays, IdCard,
  BookOpen, Award, TrendingUp, Trash2, CheckCircle2, Sparkles, Star,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User, Student, Course, Grade, GradeWithCourse } from '@/types';
import { GRADE_POINTS, gpaFromGrades, MAX_GPA } from '@/types';
import { DreamyBackground, Starfield } from './DreamyBackground';

interface Props {
  user: User;
  onLogout: () => void;
}

export function StudentDashboard({ user, onLogout }: Props) {
  const [student, setStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<GradeWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    if (!user.student_id) { setLoading(false); return; }
    const [s, g] = await Promise.all([
      supabase.from('students').select('*').eq('student_id', user.student_id).maybeSingle(),
      supabase.from('grades').select('*, course:courses(*)').eq('student_id', user.student_id),
    ]);
    setStudent(s.data as Student | null);
    setGrades((g.data as unknown as GradeWithCourse[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2600); }

  const currentSemester = useMemo(() => {
    const counts = new Map<string, number>();
    grades.forEach((g) => counts.set(g.semester, (counts.get(g.semester) ?? 0) + 1));
    if (counts.size === 0) return '2026-2027';
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0];
  }, [grades]);

  const semesterGrades = useMemo(() => grades.filter((g) => g.semester === currentSemester), [grades, currentSemester]);
  const cumGpa = useMemo(() => gpaFromGrades(grades), [grades]);
  const semesterGpa = useMemo(() => gpaFromGrades(semesterGrades), [semesterGrades]);
  const totalCredits = useMemo(() => grades.reduce((sum, g) => sum + (g.course?.credits ?? 0), 0), [grades]);

  async function dropCourse(grade: GradeWithCourse) {
    if (!confirm(`Drop ${grade.course.course_name} for ${currentSemester}?`)) return;
    const { error } = await supabase.from('grades').delete().eq('id', grade.id);
    if (error) { showToast('Could not drop course.'); return; }
    showToast(`${grade.course.course_name} dropped.`);
    load();
  }

  if (loading) return (
    <div className="relative min-h-screen">
      <DreamyBackground />
      <div className="flex min-h-screen items-center justify-center text-slate-400">Loading…</div>
    </div>
  );

  return (
    <div className="relative min-h-screen">
      <DreamyBackground />
      <Header user={user} studentName={student?.name ?? user.name} onLogout={onLogout} />

      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-fade-in space-y-6">
          {/* Profile + GPA */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Profile card with starry backdrop */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl lg:col-span-2"
              style={{ boxShadow: '0 0 30px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
              <Starfield className="absolute inset-0 opacity-40" />
              <div className="relative flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-xl font-bold text-white"
                  style={{ boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>
                  {student?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('') ?? '?'}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">{student?.name}</h2>
                  <p className="text-sm text-indigo-300/70">{student?.department}</p>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoRow icon={IdCard} label="Student ID" value={student?.student_id ?? '—'} />
                    <InfoRow icon={Mail} label="Email" value={student?.email ?? '—'} />
                    <InfoRow icon={Building2} label="Department" value={student?.department ?? '—'} />
                    <InfoRow icon={CalendarDays} label="Enrolled" value={student?.enrollment_date ?? '—'} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <GpaCard label="Cumulative GPA" value={cumGpa} />
              <div className="grid grid-cols-2 gap-4">
                <MiniStat label="Credits" value={String(totalCredits)} icon={BookOpen} />
                <MiniStat label="Courses" value={String(grades.length)} icon={Award} />
              </div>
            </div>
          </div>

          {/* Semester GPA banner */}
          <div className="relative overflow-hidden flex flex-col gap-3 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 to-blue-950/40 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"
            style={{ boxShadow: '0 0 30px rgba(99,102,241,0.1)' }}>
            <div className="relative">
              <p className="flex items-center gap-1.5 text-sm font-medium text-indigo-300">
                <Star className="h-4 w-4 text-indigo-400" />
                Current Semester — {currentSemester}
              </p>
              <p className="mt-0.5 text-xs text-indigo-400/60">Semester GPA based on {semesterGrades.length} course(s)</p>
            </div>
            <div className="relative flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{semesterGpa.toFixed(2)}</span>
              <span className="text-sm text-slate-500">/ {MAX_GPA.toFixed(2)}</span>
            </div>
          </div>

          {/* Courses table */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h3 className="text-sm font-semibold text-white">Registered Courses — {currentSemester}</h3>
              <span className="text-xs text-slate-500">{semesterGrades.length} course(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.02] text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Course ID</th>
                    <th className="px-5 py-3 font-semibold">Course Name</th>
                    <th className="px-5 py-3 font-semibold">Instructor</th>
                    <th className="px-5 py-3 font-semibold">Credits</th>
                    <th className="px-5 py-3 font-semibold">Marks</th>
                    <th className="px-5 py-3 font-semibold">Grade</th>
                    <th className="px-5 py-3 font-semibold">Points</th>
                    <th className="px-5 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {semesterGrades.length === 0 ? (
                    <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-500">No courses registered for {currentSemester}.</td></tr>
                  ) : semesterGrades.map((g) => (
                    <tr key={g.id} className="transition hover:bg-white/[0.03]">
                      <td className="px-5 py-3 font-mono text-xs text-slate-400">{g.course_id}</td>
                      <td className="px-5 py-3 font-medium text-white">{g.course.course_name}</td>
                      <td className="px-5 py-3 text-slate-400">{g.course.instructor}</td>
                      <td className="px-5 py-3 text-slate-400">{g.course.credits}</td>
                      <td className="px-5 py-3 text-slate-400">{g.marks ?? '—'}</td>
                      <td className="px-5 py-3"><GradeBadge grade={g.grade} /></td>
                      <td className="px-5 py-3 text-slate-400">{GRADE_POINTS[g.grade].toFixed(1)}</td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => dropCourse(g)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400" aria-label="Drop course">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GPA breakdown */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <h3 className="mb-4 text-sm font-semibold text-white">GPA Calculation Breakdown</h3>
            <div className="space-y-2">
              {grades.length === 0 ? (
                <p className="text-sm text-slate-500">No grades recorded yet.</p>
              ) : grades.map((g) => (
                <div key={g.id} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-white/5">
                  <span className="text-slate-300">{g.course.course_name} <span className="text-slate-600">({g.semester})</span></span>
                  <span className="font-medium text-slate-400">
                    {GRADE_POINTS[g.grade].toFixed(1)} × {g.course.credits} cr = <span className="font-semibold text-white">{(GRADE_POINTS[g.grade] * g.course.credits).toFixed(1)}</span>
                  </span>
                </div>
              ))}
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="font-semibold text-white">Cumulative GPA</span>
                <span className="text-lg font-bold text-indigo-400" style={{ textShadow: '0 0 20px rgba(99,102,241,0.5)' }}>{cumGpa.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

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

function Header({ user, studentName, onLogout }: { user: User; studentName: string; onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-obsidian-950/60 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 text-white"
            style={{ boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
              UniPortal · Student
              <Sparkles className="h-3 w-3 text-indigo-400" />
            </p>
            <p className="text-xs text-slate-400">{studentName}</p>
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

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-indigo-400">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}

function GpaCard({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, (value / MAX_GPA) * 100);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl glow-card"
      style={{ boxShadow: '0 0 30px rgba(99,102,241,0.1)' }}>
      <div className="mb-2 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-indigo-400" />
        <p className="text-sm font-medium text-slate-300">{label}</p>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold text-white" style={{ textShadow: '0 0 30px rgba(99,102,241,0.3)' }}>{value.toFixed(2)}</span>
        <span className="text-sm text-slate-500">/ {MAX_GPA.toFixed(2)}</span>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-white/5">
        <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500" style={{ width: `${pct}%`, boxShadow: '0 0 10px rgba(99,102,241,0.4)' }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
      <Icon className="mb-2 h-5 w-5 text-slate-400" />
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const map: Record<string, string> = {
    'O': 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    'A+': 'bg-green-500/20 text-green-300 border border-green-500/30',
    'A': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    'B+': 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    'B': 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    'C': 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    'D': 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    'F': 'bg-red-500/20 text-red-300 border border-red-500/30',
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${map[grade] ?? 'bg-white/10 text-slate-300 border border-white/10'}`}>{grade}</span>;
}
