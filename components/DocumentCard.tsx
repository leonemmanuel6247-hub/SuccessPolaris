
import React from 'react';
import { Document } from '../types';

interface DocumentCardProps {
  doc: Document;
  onDownload: (doc: Document) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ doc, onDownload }) => {
  const getFileIcon = (type: string) => {
    switch(type) {
      case 'pdf': return '📕';
      case 'docx': return '📘';
      default: return '📄';
    }
  };

  const isNew = () => {
    try {
      const docDate = new Date(doc.dateAdded);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - docDate.getTime());
      const diffHours = diffTime / (1000 * 60 * 60);
      return diffHours <= 48; // Badge actif pendant 48 heures (Règle Commandant)
    } catch (e) { return false; }
  };

  return (
    <div className="group relative bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 hover:border-cyan-500/40 transition-all duration-500 overflow-hidden flex flex-col justify-between shadow-xl">
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-cyan-500/5 rounded-full blur-[40px] group-hover:bg-cyan-500/10 transition-all duration-700"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:bg-cyan-500 transition-all duration-500">
            <span className="text-xl">{getFileIcon(doc.fileType)}</span>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[8px] text-cyan-400 font-black uppercase tracking-widest">{doc.size || 'N/A'}</span>
             {isNew() && (
               <span className="mt-2 bg-[#FF003C] text-white text-[7px] font-black px-3 py-1 rounded-full animate-pulse shadow-[0_0_15px_rgba(255,0,60,0.6)] uppercase tracking-wider">NOUVEAU</span>
             )}
          </div>
        </div>
        
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors leading-tight line-clamp-1">{doc.title}</h3>
        <p className="text-white/40 text-[11px] mb-4 line-clamp-2 italic leading-relaxed">"{doc.description}"</p>
      </div>
      
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/5">
        <span className="text-[8px] text-white/20 font-black uppercase tracking-widest">{doc.downloads} INDEXÉS</span>
        <button 
          onClick={() => onDownload(doc)}
          className="bg-white text-slate-950 px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:bg-cyan-400 active:scale-95"
        >
          Accéder
        </button>
      </div>
    </div>
  );
};

export default DocumentCard;
