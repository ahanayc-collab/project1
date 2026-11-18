import { useMemo } from 'react';

const STAR_COUNT = 60;

export function Starfield({ className = '' }: { className?: string }) {
  const stars = useMemo(() => {
    return Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() < 0.7 ? 1.5 : 2.5,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
    }));
  }, []);

  return (
    <div className={`stars ${className}`}>
      {stars.map((s) => (
        <div
          key={s.id}
          className="star animate-twinkle"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            boxShadow: s.size > 2 ? '0 0 4px rgba(255,255,255,0.6)' : undefined,
          }}
        />
      ))}
    </div>
  );
}

export function DreamyBackground() {
  return (
    <div className="fixed inset-0 -z-10 dreamy-bg overflow-hidden">
      <div className="orb animate-drift" style={{ top: '10%', left: '5%', width: 300, height: 300, background: 'rgba(99,102,241,0.15)' }} />
      <div className="orb animate-drift-slow" style={{ top: '50%', left: '70%', width: 400, height: 400, background: 'rgba(59,130,246,0.12)' }} />
      <div className="orb animate-drift" style={{ top: '70%', left: '20%', width: 250, height: 250, background: 'rgba(139,92,246,0.10)', animationDelay: '5s' }} />
      <Starfield />
    </div>
  );
}
