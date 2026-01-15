
import React from 'react';

interface PolarisVaultCounterProps {
  count: number;
}

const PolarisBrain: React.FC<PolarisVaultCounterProps> = ({ count }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[7000] animate-in slide-in-from-bottom-10 duration-1000 flex flex-col items-end">
      <div className="group relative">
        <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        <div className="relative bg-slate-950/60 backdrop-blur-3xl border border-white/10 px-4 py-2.5 rounded-[1.2rem] shadow-2xl flex items-center gap-3 border-r-cyan-500/50">
           <div className="w-7 h-7 bg-cyan-500/10 border border-cyan-400/30 rounded-lg flex items-center justify-center">
              <i className="fas fa-database text-cyan-400 text-[10px]"></i>
           </div>
           <div className="flex flex-col">
              <span className="text-[7px] font-black uppercase text-cyan-400/60 tracking-widest leading-none">Index Polaris</span>
              <span className="text-[13px] font-black text-white flex items-baseline gap-1">
                <span>{count}</span> 
                <span className="text-[8px] text-white/30 uppercase tracking-tighter">ressources</span>
              </span>
           </div>
           <div className="flex items-center ml-1">
              <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse shadow-neon"></span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PolarisBrain;
