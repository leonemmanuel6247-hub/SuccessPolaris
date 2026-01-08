
import React from 'react';
import { Document } from '../types';

interface DocumentCardProps {
  doc: Document;
  onDownload: (doc: Document) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ doc, onDownload }) => {
  // Check if document is "new" (added in the last 48 hours)
  const isNew = React.useMemo(() => {
    const addedDate = new Date(doc.dateAdded).getTime();
    const now = new Date().getTime();
    const diffHours = (now - addedDate) / (1000 * 60 * 60);
    return diffHours < 48;
  }, [doc.dateAdded]);

  const formattedDate = new Date(doc.dateAdded).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md hover:border-cyan-400/50 transition-all duration-300 group relative overflow-hidden">
      {isNew && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-cyan-500 to-violet-500 text-[10px] font-black text-slate-900 px-3 py-1 rounded-bl-lg shadow-lg z-10 animate-pulse uppercase tracking-widest">
          Nouveau
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div className="bg-cyan-500/20 p-2 rounded-lg group-hover:bg-cyan-500 transition-colors">
          <svg className="w-6 h-6 text-cyan-400 group-hover:text-slate-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="text-[10px] text-white/30 font-mono uppercase">{formattedDate}</span>
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors leading-tight">{doc.title}</h3>
      <p className="text-white/50 text-sm mb-6 line-clamp-2 h-10">{doc.description || "Aucune description disponible pour ce document."}</p>
      
      <div className="flex items-center justify-between border-t border-white/5 pt-4">
        <div className="flex items-center gap-1.5 text-xs text-white/30">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          <span className="font-mono">{doc.downloads}</span>
        </div>
        <button 
          onClick={() => onDownload(doc)}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/20"
        >
          Télécharger
        </button>
      </div>
    </div>
  );
};

export default DocumentCard;
