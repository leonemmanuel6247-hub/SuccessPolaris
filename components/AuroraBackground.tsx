
import React from 'react';

const AuroraBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#020617]">
      {/* Couches de nébuleuses fluides */}
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-cyan-600/10 blur-[120px] rounded-full animate-flow-1"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full animate-flow-2"></div>
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[100px] rounded-full animate-flow-3"></div>
      </div>

      {/* Grain de film subtil pour texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      
      {/* Vignettage pour focus central */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.8)_100%)]"></div>

      <style>{`
        @keyframes flow-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(10%, 10%) scale(1.1); }
          66% { transform: translate(-5%, 15%) scale(0.9); }
        }
        @keyframes flow-2 {
          0%, 100% { transform: translate(0, 0) scale(1.1); }
          33% { transform: translate(-15%, -10%) scale(0.9); }
          66% { transform: translate(10%, -5%) scale(1); }
        }
        @keyframes flow-3 {
          0%, 100% { transform: translate(0, 0) opacity: 0.3; }
          50% { transform: translate(5%, -15%) opacity: 0.6; }
        }
        .animate-flow-1 { animation: flow-1 20s ease-in-out infinite; }
        .animate-flow-2 { animation: flow-2 25s ease-in-out infinite; }
        .animate-flow-3 { animation: flow-3 15s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default AuroraBackground;
