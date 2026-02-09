
import React from 'react';
import { Document } from '../types';

interface DocumentCardProps {
  doc: Document;
  onDownload: (doc: Document) => void; 
  onPreview: (doc: Document) => void; 
}

const DocumentCard: React.FC<DocumentCardProps> = ({ doc, onDownload, onPreview }) => {
  return (
    <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 hover:border-cyan-400/40 transition-all duration-700 flex flex-col justify-between overflow-hidden">
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-400/5 rounded-full blur-[50px] group-hover:bg-cyan-400/10 transition-all"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="w-14 h-14 bg-cyan-400/10 rounded-3xl flex items-center justify-center border border-cyan-400/20 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,212,255,0.1)]">
            <span className="text-2xl">📘</span>
          </div>
          <span className="text-[10px] text-cyan-400/30 font-black uppercase tracking-widest">{doc.size || 'PDF'}</span>
        </div>
        
        <h3 className="text-[17px] font-black text-white mb-3 group-hover:text-cyan-400 transition-colors uppercase leading-tight">{doc.title}</h3>
        <p className="text-white/20 text-[11px] mb-8 line-clamp-2 italic">"{doc.description}"</p>
      </div>
      
      <div className="relative z-10 grid grid-cols-2 gap-3 pt-6 border-t border-white/5">
         <button onClick={() => onPreview(doc)} className="bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">Aperçu</button>
         <button onClick={() => onDownload(doc)} className="bg-cyan-500 text-black py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all">Télécharger</button>
      </div>
    </div>
  );
};

export default DocumentCard;
