import { useEffect, useState } from 'react';
import type { User } from '@/types';
import { LoginScreen } from '@/components/LoginScreen';
import { AdminDashboard } from '@/components/AdminDashboard';
import { StudentDashboard } from '@/components/StudentDashboard';

const SESSION_KEY = 'dbms-session';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Force dark mode permanently
    document.documentElement.classList.add('dark');
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw) as User);
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  function handleLogin(u: User) {
    setUser(u);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
  }

  function handleLogout() {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  }

  if (!ready) return <div className="min-h-screen bg-obsidian-950" />;

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  if (user.role === 'admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  return <StudentDashboard user={user} onLogout={handleLogout} />;
}
