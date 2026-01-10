
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService.ts';
import { Category, Document, VisitorActivity, AdminAccount } from '../types.ts';
import { GOOGLE_SHEET_ID } from '../constants.ts';

interface AdminDashboardProps {
  categories: Category[];
  documents: Document[];
  onRefresh?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ categories, documents, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'architect' | 'spy' | 'logs'>('status');
  const [activities, setActivities] = useState<VisitorActivity[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

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
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    if (onRefresh) await onRefresh();
    setIsSyncing(false);
  };

  const generateDataRow = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const parentId = parentSelection === 'root' ? '' : parentSelection;
    
    if (mode === 'category') {
      // id, name, parentId, icon
      setGeneratedRow(`${id},"${newItem.name}","${parentId}","${newItem.icon}"`);
    } else {
      // id, title, description, categoryId, fileUrl, fileType, tags, downloads, dateAdded, size
      const date = new Date().toISOString();
      setGeneratedRow(`${id},"${newItem.title}","${newItem.description}","${parentId}","${newItem.url}","pdf","${newItem.tags}",0,"${date}","${newItem.size}"`);
    }
  };

  return (
    <div className="bg-slate-950/40 rounded-[2rem] md:rounded-[3rem] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl flex flex-col min-h-[600px]">
      <div className="flex bg-black/60 overflow-x-auto no-scrollbar border-b border-white/10">
        {[
          { id: 'status', label: 'État Cloud', icon: '☁️' },
          { id: 'architect', label: 'Architecte', icon: '🏛️' },
          { id: 'spy', label: 'Espionnage', icon: '👁️' },
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
            <div className="bg-gradient-to-br from-slate-900 to-black p-10 rounded-[2.5rem] border border-white/10 shadow-inner">
               <h3 className="text-xl font-black text-white uppercase italic mb-6">Noyau de Données</h3>
               <p className="text-white/40 text-[11px] uppercase font-bold leading-relaxed tracking-widest mb-8">
                  Connecté à la nappe Google Sheets. Chaque ligne ajoutée dans le tableau devient une étoile dans votre galaxie.
               </p>
               <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit`, '_blank')}
                    className="flex-1 bg-white text-slate-950 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-lg"
                  >Ouvrir la Matrice Sheets</button>
                  <button onClick={handleManualSync} disabled={isSyncing}
                    className="flex-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-slate-950 transition-all"
                  >{isSyncing ? 'Synchronisation...' : 'Forcer la Mise à Jour'}</button>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: 'Catégories', val: categories.length, color: 'text-cyan-400' },
                  { label: 'Documents', val: documents.length, color: 'text-indigo-400' },
                  { label: 'Dernière Sync', val: storageService.getLastSync().split('T')[1]?.slice(0,5) || 'OK', color: 'text-emerald-400' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 p-6 rounded-3xl border border-white/5 text-center">
                    <p className="text-[8px] text-white/20 uppercase font-black mb-1">{stat.label}</p>
                    <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'architect' && (
          <div className="space-y-10 animate-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Formulaire de création */}
              <div className="space-y-6">
                <div className="flex p-1 bg-black/40 rounded-2xl border border-white/10">
                  <button onClick={() => setMode('category')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'category' ? 'bg-cyan-500 text-slate-950' : 'text-white/40'}`}>+ Catégorie</button>
                  <button onClick={() => setMode('document')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'document' ? 'bg-indigo-500 text-slate-950' : 'text-white/40'}`}>+ Document</button>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] text-white/40 font-black uppercase pl-2">Parent (Emplacement)</label>
                  <select 
                    value={parentSelection}
                    onChange={(e) => setParentSelection(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white text-[12px] outline-none focus:border-cyan-500 transition-all"
                  >
                    <option value="root">Racine du site (Haut niveau)</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  {mode === 'category' ? (
                    <>
                      <input type="text" placeholder="Nom de la catégorie" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white text-[12px] outline-none focus:border-cyan-500" />
                      <input type="text" placeholder="Icône (Emoji)" value={newItem.icon} onChange={e => setNewItem({...newItem, icon: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white text-[12px] outline-none focus:border-cyan-500" />
                    </>
                  ) : (
                    <>
                      <input type="text" placeholder="Titre du document" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white text-[12px] outline-none focus:border-cyan-500" />
                      <input type="text" placeholder="Description courte" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white text-[12px] outline-none focus:border-cyan-500" />
                      <input type="text" placeholder="Lien Google Drive" value={newItem.url} onChange={e => setNewItem({...newItem, url: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white text-[12px] outline-none focus:border-cyan-500" />
                    </>
                  )}

                  <button 
                    onClick={generateDataRow}
                    className="w-full bg-white text-slate-950 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all shadow-xl"
                  >Générer la Ligne de Données</button>
                </div>
              </div>

              {/* Résultat et Instruction */}
              <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-10 flex flex-col gap-6">
                <h4 className="text-[11px] font-black text-white/40 uppercase tracking-widest">Instruction de Déploiement</h4>
                <div className="flex-1 bg-black/60 rounded-2xl p-6 font-mono text-[11px] text-cyan-400 break-all select-all border border-cyan-500/20 shadow-inner min-h-[100px] flex items-center justify-center text-center">
                  {generatedRow || "Remplissez le formulaire et cliquez sur générer pour obtenir la ligne à copier dans Google Sheets."}
                </div>
                <div className="bg-cyan-500/5 p-6 rounded-2xl border border-cyan-500/20">
                  <p className="text-[9px] text-cyan-400/60 font-black uppercase leading-relaxed">
                    Copiez cette ligne et collez-la à la fin de votre onglet <span className="underline">{mode === 'category' ? 'Categories' : 'Documents'}</span> dans Google Sheets, puis rafraîchissez le site.
                  </p>
                </div>
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
