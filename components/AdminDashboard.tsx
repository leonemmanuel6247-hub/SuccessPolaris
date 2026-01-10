
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

  // Wizard state
  const [publishStep, setPublishStep] = useState(0);
  const [mode, setMode] = useState<'category' | 'document'>('document');
  
  // For keys management
  const [newKeyName, setNewKeyName] = useState('');

  // Form states
  const [parentSelection, setParentSelection] = useState<string>('root');
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
    if (id === '0') return; 
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
    setPublishStep(mode === 'category' ? 4 : 6);
  };

  const resetWizard = () => {
    setPublishStep(0);
    setGeneratedRow('');
    setNewItem({
      name: '',
      icon: '📁',
      title: '',
      description: '',
      url: '',
      size: '1.0 MB',
      tags: 'Cours|Révision'
    });
  };

  return (
    <div className="bg-slate-950/40 rounded-[2rem] md:rounded-[3rem] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl flex flex-col min-h-[600px]">
      {/* Navigation Tabs */}
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
               <h3 className="text-xl font-black text-white uppercase italic mb-6">Noyau de Données</h3>
               <p className="text-white/40 text-[11px] uppercase font-bold tracking-[0.3em] mb-8 leading-loose">
                 La connexion avec la matrice Google Sheets est active. Utilisez le bouton ci-dessous pour modifier directement les constellations de données.
               </p>
               <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit`, '_blank')} className="flex-1 bg-white text-slate-950 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-lg">Ouvrir la Matrice Sheets</button>
                  <button onClick={handleManualSync} disabled={isSyncing} className="flex-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-slate-950 transition-all">{isSyncing ? 'Synchronisation...' : 'Forcer la Mise à Jour'}</button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'architect' && (
          <div className="max-w-3xl mx-auto w-full space-y-12 animate-in py-6">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Assistant de Publication Polaris</h3>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.5em]">Étape {publishStep + 1} sur {mode === 'document' ? 7 : 5}</p>
            </div>

            {/* Wizard Steps Container */}
            <div className="bg-white/[0.03] border border-white/10 rounded-[3rem] p-10 md:p-16 relative overflow-hidden">
               {/* Progress Bar */}
               <div className="absolute top-0 left-0 h-1 bg-cyan-500 transition-all duration-700" style={{ width: `${((publishStep + 1) / (mode === 'document' ? 7 : 5)) * 100}%` }}></div>

               {/* Step 0: Choice */}
               {publishStep === 0 && (
                 <div className="space-y-10 animate-in">
                   <p className="text-center text-white/60 font-medium italic">"Que souhaitez-vous matérialiser dans votre galaxie ?"</p>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <button onClick={() => { setMode('document'); setPublishStep(1); }} className="bg-indigo-500/10 border border-indigo-500/30 p-12 rounded-[2.5rem] hover:bg-indigo-500 transition-all group">
                        <span className="block text-4xl mb-4">📄</span>
                        <span className="block text-white font-black uppercase tracking-widest text-[11px] group-hover:scale-110 transition-transform">Un Nouveau Document</span>
                     </button>
                     <button onClick={() => { setMode('category'); setPublishStep(1); }} className="bg-cyan-500/10 border border-cyan-500/30 p-12 rounded-[2.5rem] hover:bg-cyan-500 transition-all group">
                        <span className="block text-4xl mb-4">📁</span>
                        <span className="block text-white font-black uppercase tracking-widest text-[11px] group-hover:scale-110 transition-transform">Une Sous-Catégorie</span>
                     </button>
                   </div>
                 </div>
               )}

               {/* Document Wizard */}
               {mode === 'document' && publishStep > 0 && (
                 <div className="space-y-10">
                    {publishStep === 1 && (
                      <div className="space-y-8 animate-in">
                        <h4 className="text-white text-center font-black uppercase tracking-widest text-sm">Étape 1 : Source Stellaire</h4>
                        <div className="bg-indigo-500/10 p-6 rounded-3xl border border-indigo-500/20 text-center space-y-4">
                          <p className="text-[10px] text-indigo-300 font-bold uppercase italic">Accédez à votre archive et copiez le lien de partage (Tous avec le lien)</p>
                          <button onClick={() => window.open('https://drive.google.com', '_blank')} className="bg-indigo-500 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Ouvrir Google Drive</button>
                        </div>
                        <input type="text" autoFocus placeholder="Collez le lien Google Drive ici..." value={newItem.url} onChange={e => setNewItem({...newItem, url: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-[13px] outline-none focus:border-cyan-400 font-medium text-center shadow-inner" />
                        <button onClick={() => newItem.url && setPublishStep(2)} disabled={!newItem.url} className="w-full bg-white text-slate-950 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-cyan-400 disabled:opacity-20 transition-all">OK - Étape Suivante</button>
                      </div>
                    )}

                    {publishStep === 2 && (
                      <div className="space-y-8 animate-in">
                        <h4 className="text-white text-center font-black uppercase tracking-widest text-sm">Étape 2 : Identité du Document</h4>
                        <input type="text" autoFocus placeholder="Saisissez le titre du fichier..." value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-[13px] outline-none focus:border-cyan-400 font-medium text-center shadow-inner" />
                        <button onClick={() => newItem.title && setPublishStep(3)} disabled={!newItem.title} className="w-full bg-white text-slate-950 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-cyan-400 disabled:opacity-20 transition-all">OK - Valider le Titre</button>
                        <button onClick={() => setPublishStep(1)} className="w-full text-white/20 text-[9px] uppercase font-black tracking-widest">Retour</button>
                      </div>
                    )}

                    {publishStep === 3 && (
                      <div className="space-y-8 animate-in">
                        <h4 className="text-white text-center font-black uppercase tracking-widest text-sm">Étape 3 : Essence / Description</h4>
                        <textarea autoFocus placeholder="Que contient ce document ? (Ex: Cours de S1, Fiche de révision...)" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full h-32 bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-[13px] outline-none focus:border-cyan-400 font-medium shadow-inner resize-none" />
                        <button onClick={() => newItem.description && setPublishStep(4)} disabled={!newItem.description} className="w-full bg-white text-slate-950 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-cyan-400 disabled:opacity-20 transition-all">OK - Valider la Description</button>
                        <button onClick={() => setPublishStep(2)} className="w-full text-white/20 text-[9px] uppercase font-black tracking-widest">Retour</button>
                      </div>
                    )}

                    {publishStep === 4 && (
                      <div className="space-y-8 animate-in">
                        <h4 className="text-white text-center font-black uppercase tracking-widest text-sm">Étape 4 : Ancrage (Catégorie)</h4>
                        <p className="text-center text-[10px] text-white/40 uppercase font-black italic">"Où ce savoir doit-il se reposer ?"</p>
                        <select value={parentSelection} onChange={(e) => setParentSelection(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-[13px] outline-none focus:border-cyan-400 appearance-none text-center cursor-pointer">
                          <option value="root">Racine (Catégorie Principale)</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button onClick={() => setPublishStep(5)} className="w-full bg-white text-slate-950 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-cyan-400 transition-all">OK - Étape Suivante</button>
                        <button onClick={() => setPublishStep(3)} className="w-full text-white/20 text-[9px] uppercase font-black tracking-widest">Retour</button>
                      </div>
                    )}

                    {publishStep === 5 && (
                      <div className="space-y-8 animate-in">
                        <h4 className="text-white text-center font-black uppercase tracking-widest text-sm">Étape 5 : Magnitude (Taille)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <input type="text" placeholder="Taille (Ex: 1.5 MB)" value={newItem.size} onChange={e => setNewItem({...newItem, size: e.target.value})} className="bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-[13px] outline-none focus:border-cyan-400 text-center" />
                           <input type="text" placeholder="Tags (Ex: Cours|PDF)" value={newItem.tags} onChange={e => setNewItem({...newItem, tags: e.target.value})} className="bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-[13px] outline-none focus:border-cyan-400 text-center" />
                        </div>
                        <button onClick={generateDataRow} className="w-full bg-cyan-500 text-slate-950 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.5em] hover:bg-white transition-all shadow-2xl">PUBLIER DANS LA MATRICE</button>
                        <button onClick={() => setPublishStep(4)} className="w-full text-white/20 text-[9px] uppercase font-black tracking-widest">Retour</button>
                      </div>
                    )}
                 </div>
               )}

               {/* Category Wizard */}
               {mode === 'category' && publishStep > 0 && (
                 <div className="space-y-10">
                    {publishStep === 1 && (
                      <div className="space-y-8 animate-in">
                        <h4 className="text-white text-center font-black uppercase tracking-widest text-sm">Nom de la Constellation</h4>
                        <input type="text" autoFocus placeholder="Saisissez le nom de la catégorie..." value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-[13px] outline-none focus:border-cyan-400 font-medium text-center shadow-inner" />
                        <button onClick={() => newItem.name && setPublishStep(2)} disabled={!newItem.name} className="w-full bg-white text-slate-950 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-cyan-400 transition-all">OK - Étape Suivante</button>
                        <button onClick={() => setPublishStep(0)} className="w-full text-white/20 text-[9px] uppercase font-black tracking-widest">Annuler</button>
                      </div>
                    )}

                    {publishStep === 2 && (
                      <div className="space-y-8 animate-in">
                        <h4 className="text-white text-center font-black uppercase tracking-widest text-sm">Aura Visuelle (Emoji Icône)</h4>
                        <input type="text" autoFocus placeholder="Symbole (Ex: 📘, ⚡, 🧬)" value={newItem.icon} onChange={e => setNewItem({...newItem, icon: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-3xl outline-none focus:border-cyan-400 font-medium text-center shadow-inner" />
                        <button onClick={() => setPublishStep(3)} className="w-full bg-white text-slate-950 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-cyan-400 transition-all">OK - Valider l'icône</button>
                        <button onClick={() => setPublishStep(1)} className="w-full text-white/20 text-[9px] uppercase font-black tracking-widest">Retour</button>
                      </div>
                    )}

                    {publishStep === 3 && (
                      <div className="space-y-8 animate-in">
                        <h4 className="text-white text-center font-black uppercase tracking-widest text-sm">Ancrage Parent</h4>
                        <select value={parentSelection} onChange={(e) => setParentSelection(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-[13px] outline-none focus:border-cyan-400 appearance-none text-center cursor-pointer">
                          <option value="root">Racine (Niveau 1)</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button onClick={generateDataRow} className="w-full bg-cyan-500 text-slate-950 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.5em] hover:bg-white transition-all shadow-2xl">MATÉRIALISER LA CATÉGORIE</button>
                        <button onClick={() => setPublishStep(2)} className="w-full text-white/20 text-[9px] uppercase font-black tracking-widest">Retour</button>
                      </div>
                    )}
                 </div>
               )}

               {/* Final Deployment (The Row) */}
               {((mode === 'document' && publishStep === 6) || (mode === 'category' && publishStep === 4)) && (
                 <div className="space-y-10 animate-in text-center">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 animate-pulse">
                       <i className="fas fa-check text-emerald-400 text-2xl"></i>
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-white font-black uppercase tracking-widest text-lg">Éveil de la Donnée</h4>
                       <p className="text-[10px] text-white/30 font-black uppercase tracking-widest italic">Copiez cette ligne et insérez-la dans Google Sheets</p>
                    </div>

                    <div className="bg-black/60 rounded-2xl p-8 border border-cyan-500/30 font-mono text-cyan-400 break-all select-all text-[11px] shadow-inner relative group">
                        <div className="absolute top-2 right-4 text-[8px] text-white/10 uppercase font-black">Cliquez pour copier tout</div>
                        {generatedRow}
                    </div>

                    <div className="flex gap-4">
                       <button onClick={resetWizard} className="flex-1 bg-white/5 text-white/40 py-5 rounded-2xl text-[10px] font-black uppercase border border-white/5 hover:bg-white/10 transition-all">Nouveau</button>
                       <button onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit`, '_blank')} className="flex-[2] bg-white text-slate-950 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-lg">Ouvrir Sheets pour coller</button>
                    </div>
                 </div>
               )}
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
