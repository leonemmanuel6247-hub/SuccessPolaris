
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService.ts';
import { Category, Document, AdminAccount } from '../types.ts';
import AdminStats from './AdminStats.tsx';

interface AdminDashboardProps {
  categories: Category[];
  documents: Document[];
  currentAdmin: AdminAccount | null;
  onRefresh?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ categories, documents, currentAdmin, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'architect' | 'logs'>('status');

  return (
    <div className="bg-slate-950/40 rounded-[2.5rem] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl flex flex-col min-h-[600px]">
      <div className="flex bg-black/40 overflow-x-auto no-scrollbar border-b border-white/10">
        {[
          { id: 'status', label: 'Matrice', icon: '📡' },
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
          <div className="grid grid-cols-1 gap-8">
            <AdminStats />
          </div>
        )}

        {activeTab === 'architect' && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in">
             <i className="fas fa-tools text-cyan-400 text-5xl mb-8 opacity-20"></i>
             <h3 className="text-xl font-black text-white uppercase tracking-[0.5em] mb-4">Module Architecte</h3>
             <p className="text-white/20 text-[10px] font-black uppercase tracking-widest italic">
               Configuration des secteurs et de la structure du Palais Astral.
             </p>
             <div className="mt-12 p-8 border border-white/5 bg-white/[0.02] rounded-3xl max-w-md">
                <p className="text-[11px] text-white/40 leading-relaxed italic">
                   "La structure est actuellement synchronisée avec la source de données externe (Google Sheets). {documents.length} archives sont actives sur {categories.length} secteurs."
                </p>
             </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-2 animate-in">
             <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-6 italic">Flux de Systèmes</h4>
             <div className="bg-black/40 rounded-2xl p-6 border border-white/5 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {storageService.getLogs().length === 0 && <p className="text-white/10 text-[9px] italic">Aucun log système disponible.</p>}
                {storageService.getLogs().map(log => (
                  <div key={log.id} className="text-[9px] font-mono text-white/40 border-b border-white/5 pb-2 last:border-0">
                    <span className="text-cyan-400">[{log.timestamp}]</span> <span className="text-white/60 font-bold uppercase">{log.action}</span>: {log.details}
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
