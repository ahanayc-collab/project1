import { useState } from 'react';
import { GraduationCap, LogIn, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';
import { DreamyBackground } from './DreamyBackground';

interface Props {
  onLogin: (user: User) => void;
}

export function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: qErr } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('password', password)
        .maybeSingle();
      if (qErr) throw qErr;
      if (!data) {
        setError('Invalid email or password. Try one of the demo accounts below.');
        setLoading(false);
        return;
      }
      onLogin(data as User);
    } catch (err) {
      setError('Could not reach the login service. Please try again.');
      setLoading(false);
    }
  }

  function quickFill(em: string, pw: string) {
    setEmail(em);
    setPassword(pw);
    setError('');
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <DreamyBackground />
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-navy-900/40 backdrop-blur-2xl md:grid md:grid-cols-2"
        style={{ boxShadow: '0 0 60px rgba(99,102,241,0.12), 0 20px 80px rgba(0,0,0,0.4)' }}>
        {/* Hero side */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-950/80 via-navy-900/60 to-blue-950/80 p-10 text-white md:flex">
          <div className="absolute inset-0 opacity-30">
            <div className="orb animate-drift" style={{ top: '10%', left: '20%', width: 200, height: 200, background: 'rgba(99,102,241,0.3)' }} />
            <div className="orb animate-drift-slow" style={{ top: '60%', left: '60%', width: 250, height: 250, background: 'rgba(59,130,246,0.2)' }} />
          </div>
          <div className="relative">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur border border-white/20">
                <GraduationCap className="h-7 w-7 text-indigo-300" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">UniPortal</h1>
                <p className="text-sm text-indigo-300/70">Student Database Management System</p>
              </div>
            </div>
            <h2 className="mb-3 text-3xl font-bold leading-tight">
              Manage students, courses & grades in one place.
            </h2>
            <p className="text-indigo-200/70">
              A complete dashboard for administrators and students — track enrollment, assign grades, and calculate GPA automatically.
            </p>
          </div>
          <div className="relative space-y-3 text-sm text-indigo-200/80">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="mb-1 font-semibold text-white">Admin demo</p>
              <p className="font-mono text-xs">admin@university.edu · admin123</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="mb-1 font-semibold text-white">Student demo</p>
              <p className="font-mono text-xs">rahul.sharma@college.edu · student123</p>
            </div>
          </div>
        </div>

        {/* Form side */}
        <div className="relative p-8 sm:p-10">
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-semibold text-white">UniPortal</h1>
          </div>

          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
          </div>
          <p className="text-sm text-slate-400">Sign in to access your dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="you@college.edu"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="glow-btn flex w-full items-center justify-center gap-2 px-4 py-3 font-semibold disabled:opacity-60"
            >
              <LogIn className="h-5 w-5" />
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Quick demo logins</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => quickFill('admin@university.edu', 'admin123')}
                className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 transition hover:bg-indigo-500/20"
              >
                Admin
              </button>
              <button
                onClick={() => quickFill('rahul.sharma@college.edu', 'student123')}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
              >
                Rahul
              </button>
              <button
                onClick={() => quickFill('priya.nair@college.edu', 'student123')}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
              >
                Priya
              </button>
              <button
                onClick={() => quickFill('amit.verma@college.edu', 'student123')}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
              >
                Amit
              </button>
              <button
                onClick={() => quickFill('sneha.patel@college.edu', 'student123')}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
              >
                Sneha
              </button>
              <button
                onClick={() => quickFill('arjun.rao@college.edu', 'student123')}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
              >
                Arjun
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
