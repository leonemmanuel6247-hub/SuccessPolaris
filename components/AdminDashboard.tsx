
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
  const [activeTab, setActiveTab] = useState<'status' | 'stats' | 'architect' | 'spy' | 'keys' | 'logs'>('status');
  const [activities, setActivities] = useState<VisitorActivity[]>([]);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [bannedList, setBannedList] = useState<string[]>([]);

  // Wizard state
  const [publishStep, setPublishStep] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [parentSelection, setParentSelection] = useState<string>('root');
  const [newItem, setNewItem] = useState({
    title: '',
    url: '',
    subCat: 'Matière'
  });

  const [generatedRow, setGeneratedRow] = useState<string>('');

  useEffect(() => {
    setActivities(storageService.getVisitorActivities());
    setAccounts(storageService.getAccounts());
    setBannedList(storageService.getBannedEmails());
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    if (onRefresh) await onRefresh();
    setIsSyncing(false);
  };

  const handleAddKey = () => {
    if (!newKeyName) return;
    storageService.addAccount(newKeyName, 'MASTER');
    setAccounts(storageService.getAccounts());
    setNewKeyName('');
    storageService.addLog('ACCOUNT', `Nouvelle clé forgée : ${newKeyName}`);
  };

  const handleRemoveKey = (id: string) => {
    if (id === '0') return; 
    storageService.removeAccount(id);
    setAccounts(storageService.getAccounts());
    storageService.addLog('ACCOUNT', `Clé révoquée (ID: ${id})`);
  };

  const handleBan = (email: string) => {
    storageService.banEmail(email);
    setBannedList(storageService.getBannedEmails());
  };

  const handleUnban = (email: string) => {
    storageService.unbanEmail(email);
    setBannedList(storageService.getBannedEmails());
  };

  const handleFinalPublish = () => {
    const targetCat = categories.find(c => c.id === parentSelection);
    const catName = targetCat ? targetCat.name.toLowerCase() : 'terminale';
    setGeneratedRow(`"${newItem.title}","${newItem.url.trim()}","${catName}","${newItem.subCat.toLowerCase()}"`);
    setIsPublished(true);
    storageService.addLog('UPLOAD', `Archive formatée : ${newItem.title}`);
  };

  const resetWizard = () => {
    setPublishStep(0);
    setIsPublished(false);
    setGeneratedRow('');
    setNewItem({ title: '', url: '', subCat: 'Matière' });
  };

  return (
    <div className="bg-slate-950/40 rounded-[2rem] md:rounded-[3rem] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl flex flex-col min-h-[600px]">
      <div className="flex bg-black/60 overflow-x-auto no-scrollbar border-b border-white/10">
        {[
          { id: 'status', label: 'Matrice', icon: '☁️' },
          { id: 'stats', label: 'Analyse', icon: '📊' },
          { id: 'architect', label: 'Architecte', icon: '🏛️' },
          { id: 'spy', label: 'Espionnage', icon: '👁️' },
          ...(currentAdmin?.role === 'SUPER_MASTER' ? [{ id: 'keys', label: 'Clés', icon: '🔑' }] : []),
          { id: 'logs', label: 'Système', icon: '📟' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); resetWizard(); }}
            className={`flex-1 py-6 px-8 text-[9px] font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap flex items-center justify-center gap-3 ${
              activeTab === tab.id ? 'border-cyan-500 bg-cyan-500/5 text-white' : 'border-transparent text-white/30 hover:text-white'
            }`}
          >
            <span className="text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-8 md:p-12 flex-1 flex flex-col overflow-y-auto max-h-[700px] no-scrollbar">
        {activeTab === 'status' && (
          <div className="space-y-8 animate-in">
            <div className="bg-gradient-to-br from-slate-900 to-black p-10 rounded-[2.5rem] border border-white/10 shadow-xl">
               <h3 className="text-xl font-black text-white uppercase italic mb-6">Contrôle Polaris</h3>
               <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.3em] mb-8 leading-loose">
                 Statut : <span className="text-emerald-400">Canal A (Compteur) Actif</span><br/>
                 Statut : <span className="text-amber-400">Documents déconnectés de Sheets</span>
               </p>
               <div className="flex gap-4">
                  <button onClick={handleManualSync} disabled={isSyncing} className="w-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest">{isSyncing ? 'Sync Compteur...' : 'Rafraîchir Compteur'}</button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && <AdminStats />}

        {activeTab === 'architect' && (
          <div className="max-w-4xl mx-auto w-full space-y-12 animate-in py-6">
            <div className="bg-white/[0.03] border border-white/10 rounded-[3.5rem] p-10 relative overflow-hidden backdrop-blur-3xl">
               {isPublished ? (
                 <div className="space-y-10 animate-in text-center">
                    <h3 className="text-white font-black uppercase tracking-[0.3em] text-2xl italic">FORMATAGE ARCHIVE</h3>
                    <p className="text-[10px] text-white/40 uppercase font-black">Copiez cette ligne pour votre index interne</p>
                    <div className="bg-black/90 rounded-[2rem] p-8 border border-cyan-500/30 font-mono text-cyan-400 break-all select-all text-[12px]">
                        {generatedRow}
                    </div>
                    <button onClick={resetWizard} className="w-full bg-white/5 text-white/60 py-5 rounded-2xl text-[10px] font-black uppercase border border-white/10">Nouveau</button>
                 </div>
               ) : (
                 <div className="space-y-10">
                   {publishStep === 0 && <button onClick={() => setPublishStep(1)} className="w-full bg-indigo-500/10 border border-indigo-500/30 p-14 rounded-[3rem] hover:bg-indigo-500 transition-all group font-black uppercase tracking-widest text-[12px] text-white">Préparer une Nouvelle Archive</button>}
                   {publishStep === 1 && <div className="space-y-8 animate-in"><input type="text" placeholder="Lien Drive..." value={newItem.url} onChange={e => setNewItem({...newItem, url: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-center outline-none focus:border-cyan-400" /><button onClick={() => setPublishStep(2)} className="w-full bg-white text-slate-950 py-5 rounded-2xl text-[10px] font-black uppercase">Suivant</button></div>}
                   {publishStep === 2 && <div className="space-y-8 animate-in"><input type="text" placeholder="Titre..." value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-center outline-none focus:border-cyan-400" /><button onClick={() => setPublishStep(3)} className="w-full bg-white text-slate-950 py-5 rounded-2xl text-[10px] font-black uppercase">Suivant</button></div>}
                   {publishStep === 3 && (
                     <div className="space-y-8 animate-in">
                       <select value={parentSelection} onChange={(e) => setParentSelection(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-center outline-none">
                         <option value="root">-- Secteur --</option>
                         {categories.filter(c => !c.parentId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                       <button onClick={() => setPublishStep(4)} className="w-full bg-white text-slate-950 py-5 rounded-2xl text-[10px] font-black uppercase">Suivant</button>
                     </div>
                   )}
                   {publishStep === 4 && <div className="space-y-8 animate-in"><input type="text" placeholder="Matière..." value={newItem.subCat} onChange={e => setNewItem({...newItem, subCat: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-center outline-none focus:border-cyan-400" /><button onClick={handleFinalPublish} className="w-full bg-cyan-500 text-slate-950 py-7 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.5em]">GÉNÉRER</button></div>}
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'spy' && (
          <div className="space-y-12 animate-in">
             <div className="bg-black/40 rounded-[2rem] border border-white/5 p-6 overflow-x-auto shadow-2xl">
                <table className="w-full text-left">
                    <thead><tr className="text-[8px] uppercase font-black text-white/20 tracking-[0.4em] border-b border-white/10"><th className="pb-4">Visiteur</th><th className="pb-4">Action</th><th className="pb-4 text-right">Contrôle</th></tr></thead>
                    <tbody className="divide-y divide-white/[0.04]">
                        {activities.map(act => (
                            <tr key={act.id}>
                                <td className="py-4 text-[10px] text-white/80 font-bold">{act.email || 'Anonyme'}</td>
                                <td className="py-4 text-[9px] text-cyan-400 italic">{act.fileName || 'Archive'}</td>
                                <td className="py-4 text-right">
                                  {currentAdmin?.role === 'SUPER_MASTER' && act.email && (
                                    bannedList.includes(act.email) ? 
                                    <button onClick={() => handleUnban(act.email!)} className="text-[8px] font-black uppercase text-emerald-400 hover:underline">Réactiver</button> :
                                    <button onClick={() => handleBan(act.email!)} className="text-[8px] font-black uppercase text-red-500 hover:underline">Bannir</button>
                                  )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          </div>
        )}
        
        {activeTab === 'keys' && currentAdmin?.role === 'SUPER_MASTER' && (
          <div className="space-y-10 animate-in">
            <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8">
               <h3 className="text-[12px] font-black text-white uppercase italic mb-6 text-cyan-400 tracking-widest">Forger une Clé</h3>
               <div className="flex gap-4">
                  <input type="text" placeholder="Pseudo..." value={newKeyName} onChange={e => setNewKeyName(e.target.value)} className="flex-1 bg-black/60 border border-white/10 rounded-2xl p-5 text-white text-[12px] outline-none" />
                  <button onClick={handleAddKey} className="bg-white text-slate-950 px-10 rounded-2xl text-[10px] font-black uppercase">Forger</button>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {accounts.map(acc => (
                 <div key={acc.id} className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                    <div><p className="text-[13px] font-black text-white">{acc.username}</p><p className="text-[8px] text-white/30 uppercase font-black">{acc.role}</p></div>
                    {acc.id !== '0' && <button onClick={() => handleRemoveKey(acc.id)} className="text-red-500 text-xs font-black uppercase tracking-widest">Révoquer</button>}
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-3 animate-in">
            {storageService.getLogs().map(log => (
              <div key={log.id} className="bg-white/[0.02] p-4 rounded-xl text-[10px] font-mono border border-white/5 flex gap-4">
                   <span className="text-white/10">[{log.timestamp}]</span>
                   <span className="text-cyan-400 font-black uppercase">{log.action}</span>
                   <span className="text-white/60">"{log.details}"</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
