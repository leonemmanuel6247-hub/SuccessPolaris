
import React from 'react';
import { Document } from '../types';
import { storageService } from '../services/storageService.ts';

interface PDFViewerProps {
  doc: Document;
  onClose: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ doc, onClose }) => {
  const previewUrl = storageService.getDrivePreviewUrl(doc.fileUrl);

  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-8 animate-in fade-in zoom-in duration-300">
      <div className="relative w-full h-full max-w-6xl bg-slate-900 border-2 border-cyan-500/30 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,212,255,0.15)] overflow-hidden flex flex-col">
        {/* Header Terminal */}
        <div className="bg-black/40 border-b border-white/5 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 opacity-80">Archive.Polaris_v1.3 // {doc.title}</span>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 text-white transition-all flex items-center justify-center">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Iframe Content */}
        <div className="flex-1 relative bg-black">
          <iframe 
            src={previewUrl} 
            className="w-full h-full border-none"
            allow="autoplay"
          ></iframe>
          
          {/* Overlay scanning effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-10 bg-[length:100%_2px,3px_100%]"></div>
        </div>

        {/* Footer Actions */}
        <div className="bg-black/60 border-t border-white/5 px-8 py-4 flex items-center justify-end gap-6">
           <p className="text-[8px] text-white/20 uppercase font-black tracking-widest mr-auto italic">Lecture sécurisée par Protocole Némésis</p>
           <button 
             onClick={() => window.open(doc.fileUrl, '_blank')}
             className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-cyan-400 transition-colors"
           >
             Source Externe <i className="fas fa-external-link-alt ml-2"></i>
           </button>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
