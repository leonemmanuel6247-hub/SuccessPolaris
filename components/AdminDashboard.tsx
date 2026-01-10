
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService.ts';
import { Category, Document, VisitorActivity, AdminAccount } from '../types.ts';
import { GOOGLE_SHEET_ID } from '../constants.ts';
import DocumentCard from './DocumentCard.tsx';

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

  // Wizard state (Step-by-step logic)
  const [publishStep, setPublishStep] = useState(0);
  const [mode, setMode] = useState<'category' | 'document'>('document');
  const [isPublished, setIsPublished] = useState(false);
  
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

  const handleFinalPublish = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const parentId = parentSelection === 'root' ? '' : parentSelection;
    
    if (mode === 'category') {
      setGeneratedRow(`${id},"${newItem.name}","${parentId}","${newItem.icon}"`);
    } else {
      const date = new Date().toISOString();
      setGeneratedRow(`${id},"${newItem.title}","${newItem.description}","${parentId}","${newItem.url.trim()}","pdf","${newItem.tags}",0,"${date}","${newItem.size}"`);
    }
    setIsPublished(true);
    storageService.addLog('UPLOAD', `Publication en cours : ${mode === 'category' ? newItem.name : newItem.title}`);
  };

  const resetWizard = () => {
    setPublishStep(0);
    setIsPublished(false);
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

  // Virtual document for preview
  const previewDoc: Document = {
    id: 'preview',
    title: newItem.title || 'Titre Polaris',
    description: newItem.description || 'Description Polaris',
    categoryId: parentSelection,
    fileUrl: newItem.url,
    fileType: 'pdf',
    tags: newItem.tags.split('|'),
    downloads: 0,
    dateAdded: new Date().toISOString(),
    size: newItem.size
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
               <h3 className="text-xl font-black text-white uppercase italic mb-6">Matrice de Données</h3>
               <p className="text-white/40 text-[11px] uppercase font-bold tracking-[0.3em] mb-8 leading-loose">
                 Identifiant Sheets : <span className="text-cyan-400 font-mono break-all">{GOOGLE_SHEET_ID}</span>
               </p>
               <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit`, '_blank')} className="flex-1 bg-white text-slate-950 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-lg">Éditer le Sheets</button>
                  <button onClick={handleManualSync} disabled={isSyncing} className="flex-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-slate-950 transition-all">{isSyncing ? 'Synchronisation...' : 'Synchroniser Maintenant'}</button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'architect' && (
          <div className="max-w-4xl mx-auto w-full space-y-12 animate-in py-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Assistant Architecte</h2>
              {!isPublished && (
                <div className="flex items-center justify-center gap-2">
                  {Array.from({ length: mode === 'document' ? 6 : 4 }).map((_, idx) => (
                    <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${idx <= publishStep ? 'w-8 bg-cyan-500' : 'w-2 bg-white/10'}`}></div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-[3.5rem] p-10 md:p-16 relative overflow-hidden backdrop-blur-3xl">
               {isPublished ? (
                 <div className="space-y-10 animate-in text-center">
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.15)] animate-bounce">
                       <i className="fas fa-check-double text-emerald-400 text-3xl"></i>
                    </div>
                    <div className="space-y-3">
                       <h3 className="text-white font-black uppercase tracking-[0.4em] text-2xl italic">PUBLIÉ AVEC SUCCÈS</h3>
                       <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">
                         La structure a été générée. Copiez et insérez cette ligne dans l'onglet <strong>{mode === 'category' ? 'Categories' : 'Documents'}</strong> de votre Google Sheet pour l'ancrer définitivement.
                       </p>
                    </div>

                    <div className="bg-black/80 rounded-[2rem] p-8 border border-cyan-500/20 font-mono text-cyan-400 break-all select-all text-[12px] shadow-2xl relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 px-6 py-1.5 rounded-full text-[8px] font-black uppercase text-cyan-500/60 border border-cyan-500/10">Ligne de données Polaris</div>
                        {generatedRow}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-8">
                       <button onClick={resetWizard} className="flex-1 bg-white/5 text-white/60 py-5 rounded-2xl text-[10px] font-black uppercase border border-white/10 hover:bg-white/10 transition-all">Nouveau Projet</button>
                       <button onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit`, '_blank')} className="flex-[2] bg-cyan-500 text-slate-950 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl">Ouvrir le Sheets pour coller</button>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-12">
                   {publishStep === 0 && (
                     <div className="space-y-12 animate-in text-center">
                       <p className="text-white/60 font-medium italic text-lg">"Quel pilier du savoir souhaitez-vous ériger ?"</p>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                         <button onClick={() => { setMode('document'); setPublishStep(1); }} className="bg-indigo-500/5 border border-indigo-500/20 p-14 rounded-[3rem] hover:bg-indigo-500/20 transition-all group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="block text-5xl mb-6 group-hover:scale-125 transition-transform duration-500">📄</span>
                            <span className="block text-white font-black uppercase tracking-widest text-[12px]">Nouveau Document</span>
                         </button>
                         <button onClick={() => { setMode('category'); setPublishStep(1); }} className="bg-cyan-500/5 border border-cyan-500/20 p-14 rounded-[3rem] hover:bg-cyan-500/20 transition-all group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="block text-5xl mb-6 group-hover:scale-125 transition-transform duration-500">📁</span>
                            <span className="block text-white font-black uppercase tracking-widest text-[12px]">Nouvelle Catégorie</span>
                         </button>
                       </div>
                     </div>
                   )}

                   {/* FLUX DOCUMENT */}
                   {mode === 'document' && publishStep === 1 && (
                      <div className="space-y-10 animate-in">
                        <h4 className="text-white text-center font-black uppercase tracking-widest text-sm flex items-center justify-center gap-4">
                           <span className="w-8 h-px bg-white/10"></span> Lien Source <span className="w-8 h-px bg-white/10"></span>
                        </h4>
                        <div className="bg-indigo-500/10 p-6 rounded-[2rem] border border-indigo-500/20 text-center space-y-4">
                           <p className="text-[10px] text-indigo-300 font-bold uppercase italic">Étape 1 : Copiez le lien 'Partager' de votre fichier Drive</p>
                           <button onClick={() => window.open('https://drive.google.com', '_blank')} className="bg-indigo-500 text-white px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">Aller sur Google Drive</button>
                        </div>
                        <input type="text" autoFocus placeholder="Collez le lien ici (ex: https://drive.google.com/file/...)" value={newItem.url} onChange={e => setNewItem({...newItem, url: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-[14px] outline-none focus:border-cyan-400 font-medium text-center shadow-inner" />
                        <button onClick={() => newItem.url && setPublishStep(2)} disabled={!newItem.url} className="w-full bg-white text-slate-950 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-cyan-400 disabled:opacity-20 transition-all">OK - Étape Suivante</button>
                        <button onClick={resetWizard} className="w-full text-white/20 text-[9px] uppercase font-black hover:text-white transition-colors">Annuler la procédure</button>
                      </div>
                   )}

                   {mode === 'document' && publishStep === 2 && (
                      <div className="space-y-10 animate-in">
                        <h4 className="text-white text-center font-black uppercase tracking-widest text-sm">Étape 2 : Nom du Document</h4>
                        <input type="text" autoFocus placeholder="Saisissez le titre exact..." value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-[14px] outline-none focus:border-cyan-400 font-medium text-center" />
                        <button onClick={() => newItem.title && setPublishStep(3)} disabled={!newItem.title} className="w-full bg-white text-slate-950 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all">OK - Valider le Titre</button>
                        <button onClick={() => setPublishStep(1)} className="w-full text-white/20 text-[9px] uppercase font-black">Retour</button>
                      </div>
                   )}

                   {mode === 'document' && publishStep === 3 && (
                      <div className="space-y-10 animate-in">
                        <h4 className="text-white text-center font-black uppercase tracking-widest text-sm">Étape 3 : Description / Notes</h4>
                        <textarea autoFocus placeholder="Quelques précisions sur ce cours..." value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full h-32 bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-[14px] outline-none focus:border-cyan-400 font-medium resize-none shadow-inner" />
                        <button onClick={() => newItem.description && setPublishStep(4)} disabled={!newItem.description} className="w-full bg-white text-slate-950 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all">OK - Valider la Description</button>
                        <button onClick={() => setPublishStep(2)} className="w-full text-white/20 text-[9px] uppercase font-black">Retour</button>
                      </div>
                   )}

                   {mode === 'document' && publishStep === 4 && (
                      <div className="space-y-10 animate-in">
                        <h4 className="text-white text-center font-black uppercase tracking-widest text-sm">Étape 4 : Secteur Polaris</h4>
                        <p className="text-center text-[10px] text-white/40 uppercase font-black italic">Où ce document doit-il être rangé ?</p>
                        <select value={parentSelection} onChange={(e) => setParentSelection(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-[14px] outline-none focus:border-cyan-400 text-center appearance-none cursor-pointer">
                          <option value="root">Racine du Palais</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button onClick={() => setPublishStep(5)} className="w-full bg-white text-slate-950 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all">OK - Étape Suivante</button>
                        <button onClick={() => setPublishStep(3)} className="w-full text-white/20 text-[9px] uppercase font-black">Retour</button>
                      </div>
                   )}

                   {mode === 'document' && publishStep === 5 && (
                      <div className="space-y-12 animate-in">
                        <div className="space-y-4">
                           <h4 className="text-white text-center font-black uppercase tracking-widest text-sm italic">Étape Finale : Prévisualisation Astrale</h4>
                           <p className="text-center text-[10px] text-white/20 uppercase font-black tracking-widest">Vérifiez l'apparence avant de publier</p>
                        </div>
                        
                        <div className="max-w-[340px] mx-auto scale-110">
                           <DocumentCard doc={previewDoc} onDownload={() => {}} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-10">
                           <div className="space-y-2">
                              <label className="text-[8px] text-white/30 uppercase font-black pl-2">Taille du fichier</label>
                              <input type="text" value={newItem.size} onChange={e => setNewItem({...newItem, size: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-cyan-400 text-center text-xs outline-none" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[8px] text-white/30 uppercase font-black pl-2">Tags (séparés par |)</label>
                              <input type="text" value={newItem.tags} onChange={e => setNewItem({...newItem, tags: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-cyan-400 text-center text-xs outline-none" />
                           </div>
                        </div>

                        <button onClick={handleFinalPublish} className="w-full bg-cyan-500 text-slate-950 py-7 rounded-[2.5rem] text-[13px] font-black uppercase tracking-[0.5em] hover:bg-white transition-all shadow-[0_0_50px_rgba(0,212,255,0.3)]">PUBLIER SUR POLARIS</button>
                        <button onClick={() => setPublishStep(4)} className="w-full text-white/20 text-[9px] uppercase font-black tracking-widest">Retour</button>
                      </div>
                   )}

                   {/* FLUX CATÉGORIE */}
                   {mode === 'category' && publishStep === 1 && (
                      <div className="space-y-10 animate-in">
                        <h4 className="text-white text-center font-black uppercase tracking-widest text-sm">Nom de la Catégorie</h4>
                        <input type="text" autoFocus placeholder="Titre (ex: Mathématiques, Terminale...)" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-[14px] outline-none focus:border-cyan-400 font-medium text-center" />
                        <button onClick={() => newItem.name && setPublishStep(2)} disabled={!newItem.name} className="w-full bg-white text-slate-950 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all">OK - Suivant</button>
                        <button onClick={resetWizard} className="w-full text-white/20 text-[9px] uppercase font-black">Annuler</button>
                      </div>
                   )}

                   {mode === 'category' && publishStep === 2 && (
                      <div className="space-y-10 animate-in">
                        <h4 className="text-white text-center font-black uppercase tracking-widest text-sm">Icône Représentative</h4>
                        <input type="text" autoFocus placeholder="Emoji (ex: ⚡, 📚, 🎨)..." value={newItem.icon} onChange={e => setNewItem({...newItem, icon: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-6xl outline-none focus:border-cyan-400 text-center" />
                        <button onClick={() => setPublishStep(3)} className="w-full bg-white text-slate-950 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all">OK - Valider l'Icône</button>
                        <button onClick={() => setPublishStep(1)} className="w-full text-white/20 text-[9px] uppercase font-black">Retour</button>
                      </div>
                   )}

                   {mode === 'category' && publishStep === 3 && (
                      <div className="space-y-12 animate-in">
                        <div className="space-y-8 text-center">
                           <h4 className="text-white font-black uppercase tracking-widest text-sm">Positionnement dans la Hiérarchie</h4>
                           <select value={parentSelection} onChange={(e) => setParentSelection(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-[14px] outline-none focus:border-cyan-400 text-center appearance-none shadow-inner cursor-pointer">
                             <option value="root">Niveau Racine</option>
                             {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                           </select>
                        </div>

                        <div className="bg-white/5 p-12 rounded-[4rem] border border-white/10 text-center shadow-2xl">
                           <div className="text-7xl mb-6">{newItem.icon}</div>
                           <h5 className="text-white font-black uppercase tracking-widest text-2xl mb-2">{newItem.name}</h5>
                           <p className="text-cyan-400/40 text-[9px] uppercase font-black">Nouvelle Constellation</p>
                        </div>

                        <button onClick={handleFinalPublish} className="w-full bg-cyan-500 text-slate-950 py-7 rounded-[2.5rem] text-[13px] font-black uppercase tracking-[0.5em] hover:bg-white transition-all shadow-[0_0_50px_rgba(0,212,255,0.3)]">CRÉER LA CATÉGORIE</button>
                        <button onClick={() => setPublishStep(2)} className="w-full text-white/20 text-[9px] uppercase font-black tracking-widest">Retour</button>
                      </div>
                   )}
                 </div>
               )}
            </div>
          </div>
        )}

        {/* Autres onglets inchangés pour la gestion interne */}
        {activeTab === 'keys' && currentAdmin?.role === 'SUPER_MASTER' && (
          <div className="space-y-10 animate-in">
            <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8">
               <h3 className="text-[12px] font-black text-white uppercase italic mb-6 text-cyan-400 tracking-widest">Forge de Clés</h3>
               <div className="flex gap-4">
                  <input type="text" placeholder="Utilisateur..." value={newKeyName} onChange={e => setNewKeyName(e.target.value)} className="flex-1 bg-black/60 border border-white/10 rounded-2xl p-5 text-white text-[12px] outline-none" />
                  <button onClick={handleAddKey} className="bg-white text-slate-950 px-10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all">Générer Clé</button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {accounts.map(acc => (
                 <div key={acc.id} className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                    <div>
                       <p className={`text-[13px] font-black ${acc.role === 'SUPER_MASTER' ? 'text-cyan-400' : 'text-white'}`}>{acc.username}</p>
                       <p className="text-[8px] text-white/30 uppercase font-black">{acc.role}</p>
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
        )}

        {activeTab === 'spy' && (
          <div className="space-y-8 animate-in">
             <div className="bg-black/40 rounded-[2rem] border border-white/5 p-6 overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[8px] uppercase font-black text-white/20 tracking-[0.4em] border-b border-white/10">
                            <th className="pb-4">Utilisateur</th>
                            <th className="pb-4">Objet</th>
                            <th className="pb-4 text-right">Moment</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                        {activities.map(act => (
                            <tr key={act.id}>
                                <td className="py-4 text-[10px] text-white/80 font-bold">{act.email || 'Anonyme'}</td>
                                <td className="py-4 text-[9px] text-cyan-400 italic">{act.fileName || 'Exploration'}</td>
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
