
import React, { useState, useEffect } from 'react';

interface ExamCountdownProps {
  onAdminAccess?: () => void;
}

const ExamCountdown: React.FC<ExamCountdownProps> = ({ onAdminAccess }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const targetDate = new Date('2025-06-16T08:00:00'); 

  useEffect(() => {
    const calculate = () => {
      const diff = targetDate.getTime() - new Date().getTime();
      setTimeLeft(Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))));
    };
    
    calculate();
    const timer = setInterval(calculate, 3600000); 
    return () => clearInterval(timer);
  }, []);

  return (
    <div 
      onClick={onAdminAccess}
      className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] bg-black/40 backdrop-blur-md px-8 py-4 rounded-b-3xl border-x border-b border-white/10 shadow-[0_10px_30px_rgba(255,255,255,0.05)] cursor-default active:bg-cyan-500/5 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-white font-mono text-xl font-bold animate-pulse drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">J-{timeLeft}</span>
        <span className="text-[10px] text-white/60 font-black uppercase tracking-widest italic opacity-80">Avant le BAC</span>
      </div>
    </div>
  );
};

export default ExamCountdown;
