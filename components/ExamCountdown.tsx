
import React, { useState, useEffect } from 'react';

const ExamCountdown: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const targetDate = new Date('2025-06-16T08:00:00'); // Date estimée du BAC 2025

  useEffect(() => {
    const calculate = () => {
      const diff = targetDate.getTime() - new Date().getTime();
      setTimeLeft(Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))));
    };
    
    calculate();
    const timer = setInterval(calculate, 3600000); // Mise à jour toutes les heures
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] bg-black/40 backdrop-blur-md px-8 py-2 rounded-b-3xl border-x border-b border-cyan-500/20 shadow-[0_10px_30px_rgba(0,212,255,0.1)]">
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-1 text-center">Protocoles Terminaux</p>
      <div className="flex items-center gap-3">
        <span className="text-cyan-400 font-mono text-xl font-bold animate-pulse drop-shadow-neon">J-{timeLeft}</span>
        <span className="text-[10px] text-white font-black uppercase tracking-widest italic opacity-80">Avant le BAC</span>
      </div>
    </div>
  );
};

export default ExamCountdown;
