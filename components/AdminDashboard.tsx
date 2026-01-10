
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService.ts';
import { Category, Document, VisitorActivity, AdminAccount } from '../types.ts';
import { GOOGLE_SHEET_ID } from '../constants.ts';

interface AdminDashboardProps {
  categories: Category[];
  documents: Document[];
  currentAdmin: AdminAccount | null;
  onRefresh?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ categories, documents, currentAdmin, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'architect' | 'spy' | 'keys' | 'logs'>('status');
  const [activities, setActivities] = useState<VisitorActivity[]>([]);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // For keys management
  const [newKeyName, setNewKeyName] = useState('');

  // Form states
  const [parentSelection, setParentSelection] = useState<string>('root');
  const [mode, setMode] = useState<'category' | 'document'>('category');
  const [newItem, setNewItem] = useState({
    name: '',
    icon: '📁',
    title: '',
    description: '',
    url: '',
    size: '1.0 MB',
    tags: 'Cours|Révision'
  });

  const [generatedRow, setGeneratedRow] = useState<string>('');

  useEffect(() => {
    setActivities(storageService.getVisitorActivities());
    setAccounts(storageService.getAccounts());
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
    storageService.addLog('ACCOUNT', `Nouvelle clé créée pour ${newKeyName}`);
  };

  const handleRemoveKey = (id: string) => {
    if (id === '0') return; // Impossible de supprimer Astarté
    storageService.removeAccount(id);
    setAccounts(storageService.getAccounts());
    storageService.addLog('ACCOUNT', `Clé révoquée (ID: ${id})`);
  };

  const generateDataRow = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const parentId = parentSelection === 'root' ? '' : parentSelection;
    
    if (mode === 'category') {
      setGeneratedRow(`${id},"${newItem.name}","${parentId}","${newItem.icon}"`);
    } else {
      const date = new Date().toISOString();
      setGeneratedRow(`${id},"${newItem.title}","${newItem.description}","${parentId}","${newItem.url.trim()}","pdf","${newItem.tags}",0,"${date}","${newItem.size}"`);
    }
  };

  return (
    <div className="bg-slate-950/40 rounded-[2rem] md:rounded-[3rem] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl flex flex-col min-h-[600px]">
      <div className="flex bg-black/60 overflow-x-auto no-scrollbar border-b border-white/10">
        {[
          { id: 'status', label: 'État Cloud', icon: '☁️' },
          { id: 'architect', label: 'Architecte', icon: '🏛️' },
          { id: 'spy', label: 'Espionnage', icon: '👁️' },
          ...(currentAdmin?.role === 'SUPER_MASTER' ? [{ id: 'keys', label: 'Clés Stellaires', icon: '🔑' }] : []),
          { id: 'logs', label: 'Système', icon: '📟' }
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

      <div className="p-8 md:p-12 flex-1 flex flex-col overflow-y-auto max-h-[700px] no-scrollbar">
        {activeTab === 'status' && (
          <div className="space-y-8 animate-in">
            <div className="bg-gradient-to-br from-slate-900 to-black p-10 rounded-[2.5rem] border border-white/10">
               <h3 className="text-xl font-black text-white uppercase italic mb-6">Noyau de Données</h3>
               <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit`, '_blank')} className="flex-1 bg-white text-slate-950 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all">Ouvrir la Matrice Sheets</button>
                  <button onClick={handleManualSync} disabled={isSyncing} className="flex-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-slate-950 transition-all">{isSyncing ? 'Synchronisation...' : 'Forcer la Mise à Jour'}</button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'architect' && (
          <div className="space-y-10 animate-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="flex p-1 bg-black/40 rounded-2xl border border-white/10">
                  <button onClick={() => setMode('category')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'category' ? 'bg-cyan-500 text-slate-950' : 'text-white/40'}`}>+ Sous-Sous Catégorie</button>
                  <button onClick={() => setMode('document')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'document' ? 'bg-indigo-500 text-slate-950' : 'text-white/40'}`}>+ Document</button>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] text-white/40 font-black uppercase pl-2">Emplacement de destination</label>
                  <select value={parentSelection} onChange={(e) => setParentSelection(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white text-[12px] outline-none">
                    <option value="root">Racine Polaris</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {mode === 'category' ? (
                    <>
                      <input type="text" placeholder="Nom de la sous-catégorie" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white text-[12px] outline-none" />
                      <input type="text" placeholder="Icône (Emoji)" value={newItem.icon} onChange={e => setNewItem({...newItem, icon: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white text-[12px] outline-none" />
                    </>
                  ) : (
                    <>
                      <button onClick={() => window.open('https://drive.google.com', '_blank')} className="w-full bg-indigo-500/10 text-indigo-400 py-3 rounded-xl text-[9px] font-black uppercase border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all">Accéder à Google Drive</button>
                      <input type="text" placeholder="Titre du document" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white text-[12px] outline-none" />
                      <input type="text" placeholder="Lien de téléchargement (Copié de Drive)" value={newItem.url} onChange={e => setNewItem({...newItem, url: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white text-[12px] outline-none" />
                      <input type="text" placeholder="Taille (ex: 1.5 MB)" value={newItem.size} onChange={e => setNewItem({...newItem, size: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white text-[12px] outline-none" />
                    </>
                  )}
                  <button onClick={generateDataRow} className="w-full bg-white text-slate-950 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all">Générer la ligne</button>
                </div>
              </div>
              <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-10 flex flex-col gap-6">
                <h4 className="text-[11px] font-black text-white/40 uppercase tracking-widest text-center">Donnée prête pour Google Sheets</h4>
                <div className="flex-1 bg-black/60 rounded-2xl p-6 font-mono text-[11px] text-cyan-400 break-all select-all border border-cyan-500/20 flex items-center justify-center text-center">
                  {generatedRow || "En attente de génération..."}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'keys' && currentAdmin?.role === 'SUPER_MASTER' && (
          <div className="space-y-10 animate-in">
            <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8">
               <h3 className="text-[12px] font-black text-white uppercase italic mb-6 text-cyan-400 tracking-widest">Forge de Nouvelles Clés</h3>
               <div className="flex gap-4">
                  <input type="text" placeholder="Nom de la nouvelle clé" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} className="flex-1 bg-black/60 border border-white/10 rounded-2xl p-5 text-white text-[12px] outline-none" />
                  <button onClick={handleAddKey} className="bg-white text-slate-950 px-10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all">Forger</button>
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-4">Réseau de Clés Actives</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {accounts.map(acc => (
                    <div key={acc.id} className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 flex items-center justify-between group">
                       <div>
                          <p className={`text-[13px] font-black ${acc.role === 'SUPER_MASTER' ? 'text-cyan-400' : 'text-white'}`}>{acc.username}</p>
                          <p className="text-[8px] text-white/30 uppercase font-black tracking-widest">{acc.role}</p>
                       </div>
                       {acc.role !== 'SUPER_MASTER' && (
                         <button onClick={() => handleRemoveKey(acc.id)} className="bg-red-500/10 text-red-500 p-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                            <i className="fas fa-trash-alt text-[10px]"></i>
                         </button>
                       )}
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'spy' && (
          <div className="space-y-8 animate-in">
             <div className="bg-black/40 rounded-[2rem] border border-white/5 p-6 overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[8px] uppercase font-black text-white/20 tracking-[0.4em] border-b border-white/10">
                            <th className="pb-4">Identité</th>
                            <th className="pb-4">Action</th>
                            <th className="pb-4 text-right">Instant</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                        {activities.map(act => (
                            <tr key={act.id}>
                                <td className="py-4 text-[10px] text-white/80 font-bold">{act.email || 'Explorateur'}</td>
                                <td className="py-4 text-[9px] text-cyan-400 italic">{act.fileName || 'Navigation'}</td>
                                <td className="py-4 text-[8px] text-white/10 font-mono text-right">{act.timestamp}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
