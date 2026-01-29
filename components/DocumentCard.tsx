
import React from 'react';
import { Document } from '../types';

interface DocumentCardProps {
  doc: Document;
  onDownload: (doc: Document) => void; // Correspond à "Obtenir"
  onPreview: (doc: Document) => void; // Correspond à "Consulter"
}

const DocumentCard: React.FC<DocumentCardProps> = ({ doc, onDownload, onPreview }) => {
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
      return diffHours <= 48;
    } catch (e) { return false; }
  };

  return (
    <div className="group relative bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 hover:border-cyan-500/40 transition-all duration-500 overflow-hidden flex flex-col justify-between shadow-xl">
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-cyan-500/5 rounded-full blur-[40px] group-hover:bg-cyan-500/10 transition-all duration-700"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-5">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-cyan-500 transition-all duration-500 shadow-inner">
            <span className="text-xl">{getFileIcon(doc.fileType)}</span>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[8px] text-cyan-400 font-black uppercase tracking-widest">{doc.size || 'DOC'}</span>
             {isNew() && (
               <span className="mt-2 bg-[#FF003C] text-white text-[7px] font-black px-3 py-1 rounded-full animate-pulse shadow-[0_0_15px_rgba(255,0,60,0.6)] uppercase tracking-wider">NOUVEAU</span>
             )}
          </div>
        </div>
        
        <h3 className="text-[15px] font-black text-white mb-2 group-hover:text-cyan-400 transition-colors leading-tight line-clamp-1 uppercase tracking-tight">{doc.title}</h3>
        <p className="text-white/30 text-[10px] mb-6 line-clamp-2 italic leading-relaxed">"{doc.description}"</p>
      </div>
      
      <div className="relative z-10 flex flex-col gap-3 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between mb-1">
           <span className="text-[7px] text-white/20 font-black uppercase tracking-widest">{doc.downloads} INDEXÉS</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
           <button 
             onClick={() => onPreview(doc)}
             className="bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/30 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
           >
             <i className="fas fa-eye text-[10px]"></i> Consulter
           </button>
           <button 
             onClick={() => onDownload(doc)}
             className="bg-cyan-500 text-slate-950 hover:bg-white py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all shadow-neon flex items-center justify-center gap-2"
           >
             <i className="fas fa-unlock-alt text-[10px]"></i> Obtenir
           </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
