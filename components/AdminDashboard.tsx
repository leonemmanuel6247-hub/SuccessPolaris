import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService.ts';
import { Category, Document, VisitorActivity, AdminAccount } from '../types.ts';

interface AdminDashboardProps {
  onRefresh?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'tree' | 'spy' | 'drive' | 'accounts' | 'logs'>('tree');
  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activities, setActivities] = useState<VisitorActivity[]>([]);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  
  const [importForm, setImportForm] = useState({ title: '', url: '', categoryPath: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');

  const refreshAll = () => {
    setCategories(storageService.getCategories());
    setDocuments(storageService.getDocuments());
    setActivities(storageService.getVisitorActivities());
    setAccounts(storageService.getAccounts());
    if (onRefresh) onRefresh();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const handleDeepImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importForm.url || !importForm.categoryPath || !importForm.title) {
      alert("Veuillez remplir les informations de publication.");
      return;
    }

    if (!importForm.url.includes('drive.google.com')) {
      alert("Erreur : Seuls les liens Google Drive sont acceptés pour la publication.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const finalCategoryId = storageService.ensureCategoryPath(importForm.categoryPath);
      await storageService.addDocument({
        title: importForm.title,
        description: importForm.description || "Archive Polaris Cloud",
        categoryId: finalCategoryId,
        fileUrl: importForm.url,
        fileType: 'pdf',
        tags: ['Drive'],
        size: 'Auto-Sync'
      });
      setImportForm({ title: '', url: '', categoryPath: '', description: '' });
      refreshAll();
      alert("Publication Drive réussie !");
    } catch (err) {
      alert("Erreur de synchronisation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newAccountName.trim();
    if(!cleanName) return;
    if(accounts.find(a => a.username.toLowerCase() === cleanName.toLowerCase())) {
        alert("Ce compte existe déjà.");
        return;
    }
    storageService.addAccount(cleanName);
    setNewAccountName('');
    refreshAll();
  };

  const deleteAccount = (id: string) => {
    const acc = accounts.find(a => a.id === id);
    if(acc?.role === 'MASTER') {
        alert("Action impossible : Le compte MASTER est protégé.");
        return;
    }
    if(confirm(`Supprimer définitivement l'accès pour ${acc?.username} ?`)) {
        storageService.deleteAccount(id);
        refreshAll();
    }
  }

  const renderTree = (parentId: string | null, level: number = 0) => {
    const children = categories.filter(c => c.parentId === parentId);
    return (
      <div className={`space-y-3 ${level > 0 ? 'ml-4 md:ml-8 border-l border-white/10 pl-3 md:pl-5 mt-2 md:mt-3' : ''}`}>
        {children.map(cat => {
          const catDocs = documents.filter(d => d.categoryId === cat.id);
          return (
            <div key={cat.id} className="bg-white/[0.03] p-4 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] border border-white/5 group hover:border-cyan-500/30 transition-all backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                   <div className={`w-2 md:w-2.5 h-2 md:h-2.5 rounded-full ${level === 0 ? 'bg-cyan-500 shadow-[0_0_15px_#00d4ff]' : level === 1 ? 'bg-blue-400' : 'bg-indigo-400'} animate-pulse`}></div>
                   <div className="flex flex-col">
                      <span className="font-black text-white text-[10px] md:text-[12px] uppercase tracking-tighter">{cat.name}</span>
                      <span className="text-white/20 text-[7px] font-bold uppercase tracking-widest">{catDocs.length} ELEMENTS</span>
                   </div>
                </div>
                <div className="flex gap-1 md:gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => { const n = prompt(`Ajouter sous-catégorie à "${cat.name}" :`); if(n) { storageService.saveCategory(n, cat.id); refreshAll(); } }}
                    className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center bg-cyan-500/10 text-cyan-400 rounded-lg md:rounded-xl text-xs hover:bg-cyan-500 hover:text-slate-950 transition-all border border-cyan-500/20"
                  >+</button>
                  <button 
                    onClick={() => { if(confirm(`Suppression récursive : Tout sera effacé. Confirmer ?`)) { storageService.deleteCategory(cat.id); refreshAll(); } }}
                    className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center bg-red-500/10 text-red-400 rounded-lg md:rounded-xl text-xs hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                  >×</button>
                </div>
              </div>
              {renderTree(cat.id, level + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-slate-950/40 rounded-[2rem] md:rounded-[3rem] border border-white/5 overflow-hidden backdrop-blur-3xl animate-in shadow-2xl flex flex-col min-h-[600px] md:min-h-[800px]">
      <div className="flex bg-black/60 overflow-x-auto no-scrollbar border-b border-white/10">
        {(['tree', 'spy', 'drive', 'accounts', 'logs'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-5 md:py-7 px-6 md:px-8 text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all min-w-[120px] md:min-w-[140px] border-b-2 whitespace-nowrap ${
              activeTab === tab ? 'border-cyan-500 bg-cyan-500/5 text-white' : 'border-transparent text-white/30 hover:text-white'
            }`}
          >
            {tab === 'tree' ? 'Arborescence' : tab === 'spy' ? "Espionnage" : tab === 'drive' ? 'Publication' : tab === 'accounts' ? 'Comptes' : 'Logs'}
          </button>
        ))}
      </div>

      <div className="p-6 md:p-16 flex-1 flex flex-col overflow-y-auto max-h-[750px] no-scrollbar">
        {activeTab === 'tree' && (
          <div className="space-y-8 md:space-y-12 animate-in">
            <div className="bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent p-6 md:p-10 rounded-[1.8rem] md:rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
               <div className="max-w-md text-center md:text-left">
                  <h3 className="text-md md:text-lg font-black text-white uppercase italic tracking-tighter">Maillage Hiérarchique</h3>
                  <p className="text-[9px] text-white/40 uppercase font-bold tracking-widest mt-2 md:mt-3">Gérez les secteurs et sous-ensembles à l'infini.</p>
               </div>
               <button 
                 onClick={() => { const n = prompt("Nom du nouveau secteur racine :"); if(n) { storageService.saveCategory(n, null); refreshAll(); } }}
                 className="w-full md:w-auto bg-cyan-500 text-slate-950 px-8 md:px-12 py-4 md:py-5 rounded-[1.2rem] md:rounded-[1.5rem] text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl"
               >Nouveau Secteur</button>
            </div>
            <div className="space-y-4 md:space-y-6">
               {categories.length === 0 ? (
                 <div className="text-center py-24 md:py-40 bg-white/[0.02] rounded-[3rem] md:rounded-[4rem] border border-dashed border-white/10">
                    <p className="text-white/10 uppercase font-black text-[11px] md:text-[12px] tracking-[0.8em] md:tracking-[1.2em]">Node Vierge</p>
                 </div>
               ) : renderTree(null)}
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="space-y-10 md:space-y-14 animate-in">
             <div className="bg-slate-900/40 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/10 shadow-inner">
                <h3 className="text-[10px] md:text-[11px] font-black text-cyan-400 uppercase tracking-[0.4em] md:tracking-[0.5em] mb-6 md:mb-10 italic">Enrôler un Administrateur</h3>
                <form onSubmit={addAccount} className="flex flex-col sm:flex-row gap-4 md:gap-6">
                   <div className="flex-1">
                      <input 
                        type="text" 
                        required
                        placeholder="Identifiant..." 
                        value={newAccountName}
                        onChange={e => setNewAccountName(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-[1.2rem] md:rounded-[1.5rem] px-8 md:px-10 py-5 md:py-6 text-[13px] md:text-[15px] text-white outline-none focus:border-cyan-400 transition-all font-bold"
                      />
                   </div>
                   <button type="submit" className="bg-white text-slate-950 px-10 md:px-12 py-5 md:py-6 rounded-[1.2rem] md:rounded-[1.5rem] text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all active:scale-95">Créer Accès</button>
                </form>
             </div>
             
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-8">
                {accounts.map(acc => (
                  <div key={acc.id} className="bg-white/[0.03] p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 flex items-center justify-between group backdrop-blur-md">
                     <div className="flex items-center gap-4 md:gap-8">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-[1.2rem] md:rounded-[1.5rem] flex items-center justify-center border border-white/10">
                           <span className="font-black text-cyan-400 uppercase text-lg md:text-2xl">{acc.username[0]}</span>
                        </div>
                        <div>
                           <div className="flex items-center gap-2 md:gap-3">
                              <p className="text-[14px] md:text-[16px] font-black text-white uppercase">{acc.username}</p>
                              {acc.role === 'MASTER' && <span className="bg-cyan-500/20 text-cyan-400 text-[6px] px-2 py-0.5 rounded-full font-black border border-cyan-500/20 uppercase tracking-widest">Master</span>}
                           </div>
                           <p className="text-[8px] md:text-[9px] text-white/30 uppercase font-black tracking-widest mt-1 italic">Dernier Accès: {acc.lastLogin.split(',')[0]}</p>
                        </div>
                     </div>
                     {acc.role !== 'MASTER' && (
                       <button 
                        onClick={() => deleteAccount(acc.id)}
                        className="w-10 h-10 md:w-12 md:h-12 bg-red-500/10 text-red-500 rounded-xl opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                       >×</button>
                     )}
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'drive' && (
          <div className="animate-in space-y-8 md:space-y-12">
            <div className="bg-gradient-to-br from-slate-900 to-black p-10 md:p-20 rounded-[2.5rem] md:rounded-[4rem] border border-white/10 flex flex-col xl:flex-row items-center justify-between gap-8 md:gap-12 relative overflow-hidden group">
               <div className="max-w-2xl relative z-10 text-center xl:text-left">
                 <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter mb-4 md:mb-6">Publication Drive</h3>
                 <p className="text-[11px] md:text-[13px] text-white/40 uppercase font-bold leading-relaxed tracking-widest md:tracking-[0.25em]">
                   Le canal Google Drive est l'unique vecteur de publication autorisé. <br/>
                   Séparez les catégories par <span className="text-cyan-400">"{'&gt;'}"</span> pour créer l'arborescence récursivement.
                 </p>
               </div>
               <button onClick={() => window.open('https://drive.google.com', '_blank')} className="w-full xl:w-auto bg-white text-slate-950 px-10 md:px-14 py-5 md:py-7 rounded-[1.5rem] md:rounded-[2rem] text-[11px] md:text-[12px] font-black uppercase tracking-widest md:tracking-[0.25em] hover:bg-cyan-400 transition-all shadow-2xl shrink-0">
                 Accéder à Drive
               </button>
            </div>

            <form onSubmit={handleDeepImport} className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 bg-white/[0.02] p-8 md:p-20 rounded-[2.5rem] md:rounded-[4rem] border border-white/5 relative">
                <div className="space-y-6 md:space-y-10">
                    <div className="space-y-3 md:space-y-4">
                        <label className="text-[9px] md:text-[10px] text-white/30 font-black uppercase tracking-widest ml-1">Vecteur Arborescence</label>
                        <input type="text" required placeholder="Section > Sous-Section > Dossier" value={importForm.categoryPath} onChange={e => setImportForm({...importForm, categoryPath: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-[1.2rem] md:rounded-[1.5rem] px-6 md:px-10 py-4 md:py-6 text-[13px] md:text-[14px] text-white outline-none focus:border-cyan-400 transition-all font-bold" />
                    </div>
                    <div className="space-y-3 md:space-y-4">
                        <label className="text-[9px] md:text-[10px] text-white/30 font-black uppercase tracking-widest ml-1">Titre de la Ressource</label>
                        <input type="text" required placeholder="Ex: TD Chimie n°1" value={importForm.title} onChange={e => setImportForm({...importForm, title: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-[1.2rem] md:rounded-[1.5rem] px-6 md:px-10 py-4 md:py-6 text-[13px] md:text-[14px] text-white outline-none focus:border-cyan-400 transition-all font-bold" />
                    </div>
                </div>
                <div className="space-y-6 md:space-y-10">
                    <div className="space-y-3 md:space-y-4">
                        <label className="text-[9px] md:text-[10px] text-white/30 font-black uppercase tracking-widest ml-1">Lien Google Drive</label>
                        <input type="url" required placeholder="https://drive.google.com/..." value={importForm.url} onChange={e => setImportForm({...importForm, url: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-[1.2rem] md:rounded-[1.5rem] px-6 md:px-10 py-4 md:py-6 text-[11px] md:text-[12px] text-cyan-400 font-mono outline-none focus:border-cyan-400 transition-all" />
                    </div>
                    <div className="space-y-3 md:space-y-4">
                        <label className="text-[9px] md:text-[10px] text-white/30 font-black uppercase tracking-widest ml-1">Notes</label>
                        <textarea placeholder="Description rapide..." value={importForm.description} onChange={e => setImportForm({...importForm, description: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-[1.2rem] md:rounded-[1.5rem] px-6 md:px-10 py-4 md:py-6 text-[13px] md:text-[14px] text-white outline-none focus:border-cyan-400 transition-all h-[80px] resize-none italic" />
                    </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="lg:col-span-2 bg-cyan-500 text-slate-950 py-5 md:py-7 rounded-[1.5rem] md:rounded-[2rem] text-[12px] md:text-[13px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] hover:bg-white transition-all shadow-2xl active:scale-95 disabled:opacity-50">
                   {isSubmitting ? 'Synchronisation...' : 'Déployer sur Polaris'}
                </button>
            </form>
          </div>
        )}

        {activeTab === 'spy' && (
          <div className="space-y-8 md:space-y-12 animate-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-10">
               <div className="bg-slate-900/60 p-10 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/5 text-center">
                  <p className="text-[8px] md:text-[10px] text-white/20 uppercase font-black tracking-widest mb-3 md:mb-4">Visites</p>
                  <p className="text-4xl md:text-6xl font-black text-white italic">{activities.filter(a => a.type === 'VISIT').length}</p>
               </div>
               <div className="bg-slate-900/60 p-10 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/5 text-center">
                  <p className="text-[8px] md:text-[10px] text-white/20 uppercase font-black tracking-widest mb-3 md:mb-4">Flux Extraits</p>
                  <p className="text-4xl md:text-6xl font-black text-cyan-400 italic">{activities.filter(a => a.type === 'DOWNLOAD').length}</p>
               </div>
               <div className="bg-slate-900/60 p-10 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/5 text-center">
                  <p className="text-[8px] md:text-[10px] text-white/20 uppercase font-black tracking-widest mb-3 md:mb-4">Identités</p>
                  <p className="text-4xl md:text-6xl font-black text-indigo-400 italic">{new Set(activities.filter(a => a.email).map(a => a.email)).size}</p>
               </div>
            </div>
             
             <div className="bg-black/40 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/5 p-6 md:p-10 overflow-x-auto max-h-[400px] no-scrollbar shadow-inner">
                <table className="w-full text-left">
                    <thead className="sticky top-0 bg-slate-950/90 backdrop-blur-xl z-10">
                        <tr className="text-[8px] md:text-[9px] uppercase font-black text-white/20 tracking-widest md:tracking-[0.6em] border-b border-white/10">
                            <th className="pb-6 md:pb-8 pl-4 md:pl-8">Type</th>
                            <th className="pb-6 md:pb-8">Identité</th>
                            <th className="pb-6 md:pb-8">Archive</th>
                            <th className="pb-6 md:pb-8 text-right pr-4 md:pr-8">Temps</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                        {activities.map(act => (
                            <tr key={act.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-5 md:py-7 pl-4 md:pl-8">
                                    <span className={`px-2 md:px-4 py-1 md:py-2 rounded-lg text-[6px] md:text-[7px] font-black uppercase ${act.type === 'VISIT' ? 'bg-white/5 text-white/40' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>
                                        {act.type}
                                    </span>
                                </td>
                                <td className="py-5 md:py-7 text-[10px] md:text-[12px] text-white/80 font-bold truncate max-w-[120px]">{act.email || 'Anonyme'}</td>
                                <td className="py-5 md:py-7 text-[9px] md:text-[11px] text-white/30 italic font-medium truncate max-w-[150px]">{act.fileName || 'Navigation'}</td>
                                <td className="py-5 md:py-7 text-[8px] md:text-[10px] text-white/10 font-mono text-right pr-4 md:pr-8 whitespace-nowrap uppercase">{act.timestamp.split(',')[1]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-3 md:space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-4 flex-1 animate-in">
            {storageService.getLogs().map(log => (
              <div key={log.id} className="bg-white/[0.02] p-4 md:p-6 rounded-[1.2rem] md:rounded-[1.5rem] flex flex-col sm:flex-row sm:items-center text-[10px] md:text-[11px] font-mono border border-white/5 hover:bg-white/[0.05] transition-all backdrop-blur-sm gap-2 sm:gap-4">
                   <span className="text-white/10 text-[8px] md:text-[9px] uppercase tracking-tighter shrink-0">[{log.timestamp}]</span>
                   <span className={`font-black tracking-widest uppercase text-[8px] md:text-[9px] shrink-0 ${log.action === 'UPLOAD' ? 'text-cyan-400' : log.action === 'DELETE' ? 'text-red-400' : 'text-white/40'}`}>{log.action}</span>
                   <span className="text-white/60 truncate italic opacity-90 sm:pl-4 sm:border-l sm:border-white/10">"{log.details}"</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;