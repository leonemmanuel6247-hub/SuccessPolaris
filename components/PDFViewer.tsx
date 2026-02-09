
import React, { useState, useEffect } from 'react';
import { Document } from '../types';
import { storageService } from '../services/storageService.ts';

interface PDFViewerProps {
  doc: Document;
  onClose: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ doc, onClose }) => {
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const previewUrl = storageService.getDrivePreviewUrl(doc.fileUrl);

  // Verrouiller le scroll du corps de la page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center bg-black/98 backdrop-blur-2xl p-0 md:p-8 animate-in fade-in duration-500">
      <div className="relative w-full h-full max-w-6xl bg-[#020617] md:border-2 md:border-cyan-500/30 md:rounded-[2.5rem] shadow-[0_0_100px_rgba(0,212,255,0.2)] overflow-hidden flex flex-col transition-all duration-700">
        
        {/* Header Terminal - Design Compact pour Mobile */}
        <div className="bg-black/80 border-b border-white/5 px-6 py-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-500/50"></div>
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 drop-shadow-neon">Nexus_Archive_v2.0</span>
                <span className="text-[11px] font-bold text-white/90 truncate max-w-[200px] sm:max-w-md uppercase">{doc.title}</span>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-red-500/20 text-white transition-all flex items-center justify-center border border-white/10 active:scale-90"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Zone de Contenu avec Loader Polaris Haute Performance */}
        <div className="flex-1 relative bg-black">
          {!isIframeLoaded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#020617]">
               <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                     <i className="fas fa-satellite-dish text-cyan-400 animate-pulse"></i>
                  </div>
               </div>
               <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.5em] animate-pulse">Décodage du Flux Astral...</p>
               <div className="mt-8 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 animate-progress-fast"></div>
               </div>
            </div>
          )}
          
          <iframe 
            src={previewUrl} 
            className={`w-full h-full border-none transition-opacity duration-1000 ${isIframeLoaded ? 'opacity-100' : 'opacity-0'}`}
            allow="autoplay"
            onLoad={() => setIsIframeLoaded(true)}
            loading="eager"
            title={doc.title}
          ></iframe>
          
          {/* Effet de scan holographique optionnel */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(0,212,255,0.02),rgba(0,212,255,0.01),rgba(0,212,255,0.02))] z-10 bg-[length:100%_4px,4px_100%] opacity-30"></div>
        </div>

        {/* Footer Actions - Minimaliste */}
        <div className="bg-black/90 border-t border-white/5 px-6 py-4 flex items-center justify-between z-20">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-[8px] text-white/30 uppercase font-black tracking-widest italic">Canal Sécurisé Polaris</p>
           </div>
           <div className="flex gap-4">
             <button 
               onClick={() => window.open(doc.fileUrl, '_blank')}
               className="bg-cyan-500/10 border border-cyan-500/30 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all"
             >
               Ouvrir Source <i className="fas fa-external-link-alt ml-2"></i>
             </button>
           </div>
        </div>
      </div>
      
      <style>{`
        @keyframes progress-fast {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-progress-fast {
          animation: progress-fast 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PDFViewer;
