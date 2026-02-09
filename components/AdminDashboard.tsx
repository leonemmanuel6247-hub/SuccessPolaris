
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService.ts';
import { Category, Document, VisitorActivity, AdminAccount } from '../types.ts';
import AdminStats from './AdminStats.tsx';

interface AdminDashboardProps {
  categories: Category[];
  documents: Document[];
  currentAdmin: AdminAccount | null;
  onRefresh?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ categories, documents, currentAdmin, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'nexus_ai' | 'analysis' | 'architect' | 'logs'>('status');
  const [queryAnalysis, setQueryAnalysis] = useState<any[]>([]);
  const [iaDirectives, setIaDirectives] = useState('');
  const [iaNotes, setIaNotes] = useState('');
  const [aiHealth, setAiHealth] = useState<any>({});

  useEffect(() => {
    setQueryAnalysis(storageService.getQueryAnalysis());
    setIaDirectives(storageService.getIADirectives());
    setIaNotes(storageService.getIANotes());
    setAiHealth(storageService.getAIHealth());
  }, []);

  const handleSaveNexus = () => {
    storageService.saveIADirectives(iaDirectives);
    storageService.saveIANotes(iaNotes);
    alert("🧠 Nexus mis à jour. Polaris Brain a synchronisé vos nouvelles directives.");
  };

  return (
    <div className="bg-slate-950/40 rounded-[2.5rem] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl flex flex-col min-h-[600px]">
      <div className="flex bg-black/40 overflow-x-auto no-scrollbar border-b border-white/10">
        {[
          { id: 'status', label: 'Matrice', icon: '📡' },
          { id: 'nexus_ai', label: 'Nexus AI', icon: '🧠' },
          { id: 'analysis', label: 'Analyse Flux', icon: '👁️' },
          { id: 'architect', label: 'Architecte', icon: '🏛️' },
          { id: 'logs', label: 'Logs', icon: '📟' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-6 px-8 text-[9px] font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap flex items-center justify-center gap-3 ${
              activeTab === tab.id ? 'border-cyan-500 bg-cyan-500/5 text-white' : 'border-transparent text-white/30 hover:text-white'
            }`}
          >
            <span className="text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-8 md:p-12 flex-1 overflow-y-auto no-scrollbar">
        {activeTab === 'status' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900/60 p-8 rounded-[2rem] border border-white/5">
               <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-6">Santé du Nexus IA</h4>
               {Object.entries(aiHealth).map(([name, data]: [string, any]) => (
                 <div key={name} className="flex items-center justify-between p-4 bg-black/40 rounded-xl mb-3">
                    <span className="text-[10px] font-bold text-white uppercase">{name}</span>
                    <span className={`text-[9px] px-3 py-1 rounded-full font-black ${data.status === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {data.status.toUpperCase()}
                    </span>
                 </div>
               ))}
            </div>
            <AdminStats />
          </div>
        )}

        {activeTab === 'nexus_ai' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in">
             <div className="space-y-6">
                <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest italic">Directives de Conscience</h4>
                <textarea 
                  value={iaDirectives} 
                  onChange={(e) => setIaDirectives(e.target.value)}
                  className="w-full h-48 bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-[11px] font-mono outline-none focus:border-cyan-400"
                  placeholder="Ex: Tu es Polaris Brain, agis avec politesse..."
                />
                <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">Notes de Bord (Connaissances)</h4>
                <textarea 
                  value={iaNotes} 
                  onChange={(e) => setIaNotes(e.target.value)}
                  className="w-full h-48 bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-[11px] font-mono outline-none focus:border-cyan-400"
                  placeholder="Ajoute ici des détails sur les cours ou des rappels importants..."
                />
                <button onClick={handleSaveNexus} className="w-full bg-cyan-500 text-black py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-neon">
                  Synchroniser le Nexus
                </button>
             </div>
             <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10">
                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6">Aperçu du Nexus</h4>
                <div className="p-6 bg-black/40 rounded-2xl border border-white/5 italic text-white/60 text-[11px] leading-relaxed">
                   "Ma conscience est actuellement régie par vos directives. Je suis prêt à guider les élèves vers le BAC 2025 avec les {documents.length} archives PDF à ma disposition."
                </div>
             </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6 animate-in">
             <h3 className="text-xl font-black text-white uppercase italic">Analyse des Échanges</h3>
             <div className="space-y-4">
                {queryAnalysis.length === 0 && <p className="text-white/20 text-[10px] italic">Aucune donnée de flux pour le moment.</p>}
                {queryAnalysis.map((q, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-cyan-500/40 transition-all">
                     <div className="flex justify-between items-center mb-4">
                        <span className="text-[8px] bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full font-black">{q.email}</span>
                        <span className="text-[7px] text-white/20 uppercase font-black">{q.timestamp}</span>
                     </div>
                     <p className="text-[12px] text-white font-bold mb-3 italic">"{q.query}"</p>
                     <div className="pl-4 border-l-2 border-white/10 text-[10px] text-white/40">
                        {q.responseSummary}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}
        
        {activeTab === 'architect' && <div className="p-20 text-center text-white/10 font-black uppercase tracking-[1em]">Module Architecte Actif</div>}
        {activeTab === 'logs' && (
          <div className="space-y-2">
             {storageService.getLogs().map(log => (
               <div key={log.id} className="text-[9px] font-mono text-white/40"><span className="text-cyan-400">[{log.timestamp}]</span> {log.action}: {log.details}</div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
