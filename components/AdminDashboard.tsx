
import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService.ts';
import { Category, Document, ActivityLog, VisitorActivity } from '../types.ts';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tree' | 'live' | 'logs'>('tree');
  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [visitorActivity, setVisitorActivity] = useState<VisitorActivity[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  
  // States for forms
  const [newRootName, setNewRootName] = useState('');
  const [showDocModal, setShowDocModal] = useState<{show: boolean, catId: string}>({ show: false, catId: '' });
  const [newDoc, setNewDoc] = useState({ title: '', description: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    setCategories(storageService.getCategories());
    setDocuments(storageService.getDocuments());
    setVisitorActivity(storageService.getVisitorActivities());
    setLogs(storageService.getLogs());
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000); 
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRootName.trim()) return;
    storageService.saveCategory(newRootName, null);
    setNewRootName('');
    refresh();
  };

  const handleAddBranch = (parentId: string) => {
    const name = prompt("Nom de la sous-catégorie :");
    if (name) {
      storageService.saveCategory(name, parentId);
      refresh();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handlePublishDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title || !selectedFile) return;
    
    await storageService.addDocument({
      title: newDoc.title,
      description: newDoc.description,
      categoryId: showDocModal.catId,
      githubUrl: '' // Sera géré par le service pour le stockage local
    }, selectedFile);

    setNewDoc({ title: '', description: '' });
    setSelectedFile(null);
    setShowDocModal({ show: false, catId: '' });
    refresh();
  };

  const renderTree = (parentId: string | null, level: number = 0) => {
    const children = categories.filter(c => c.parentId === parentId);
    return (
      <div className={`space-y-3 ${level > 0 ? 'ml-6 border-l border-white/10 pl-4 mt-2' : ''}`}>
        {children.map(cat => {
          const hasSubCats = categories.some(c => c.parentId === cat.id);
          const hasDocs = documents.some(d => d.categoryId === cat.id);
          
          return (
            <div key={cat.id} className="group bg-white/5 p-3 rounded-xl border border-transparent hover:border-cyan-500/30 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-lg ${level === 0 ? 'opacity-100' : 'opacity-50'}`}>
                    {level === 0 ? '📂' : '📁'}
                  </span>
                  <span className={`font-bold ${level === 0 ? 'text-white text-lg' : 'text-white/70 text-sm'}`}>
                    {cat.name}
                  </span>
                  {hasDocs && <span className="bg-cyan-500/20 text-cyan-400 text-[8px] px-1.5 py-0.5 rounded font-black uppercase">Document</span>}
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleAddBranch(cat.id)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-cyan-400 transition-colors"
                    title="Ajouter une sous-catégorie"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  </button>
                  
                  {!hasSubCats && (
                    <button 
                      onClick={() => setShowDocModal({ show: true, catId: cat.id })}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-yellow-400 transition-colors"
                      title="Uploader un fichier PDF"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </button>
                  )}
                  
                  <button 
                    onClick={() => { if(confirm("Supprimer cette catégorie et ses fichiers ?")) storageService.deleteCategory(cat.id); refresh(); }}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
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
    <div className="bg-slate-900/90 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 duration-500">
      <div className="flex bg-black/40 p-3 gap-2">
        {(['tree', 'live', 'logs'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all ${
              activeTab === tab ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(0,212,255,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab === 'tree' ? '📊 Structure' : tab === 'live' ? '👁️ Suivi Visiteurs' : '📜 Logs Système'}
          </button>
        ))}
      </div>

      <div className="p-10">
        {activeTab === 'tree' && (
          <div className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h3 className="text-3xl font-black text-white tracking-tighter italic uppercase">Gestion de l'Arborescence</h3>
                <p className="text-white/30 text-xs mt-1 uppercase tracking-widest font-bold">Organisation hiérarchique des ressources</p>
              </div>
              
              <form onSubmit={handleCreateRoot} className="flex gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 w-full md:w-auto">
                <input 
                  type="text" 
                  placeholder="Nouvelle catégorie racine..." 
                  value={newRootName}
                  onChange={(e) => setNewRootName(e.target.value)}
                  className="bg-transparent px-4 py-2 text-sm text-white focus:outline-none w-full"
                />
                <button type="submit" className="bg-cyan-500 text-slate-950 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all">Créer</button>
              </form>
            </div>

            <div className="bg-black/20 rounded-3xl p-6 min-h-[400px]">
              {renderTree(null)}
            </div>
          </div>
        )}

        {activeTab === 'live' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <h3 className="text-2xl font-black text-white italic tracking-tight uppercase">Activité en temps réel</h3>
             </div>
             
             <div className="grid grid-cols-1 gap-4">
                {visitorActivity.map(act => (
                  <div key={act.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between group hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-xl">👤</div>
                      <div>
                        <p className="text-cyan-400 font-black uppercase text-[10px] tracking-widest mb-1">Localisation actuelle :</p>
                        <p className="text-white font-bold text-lg leading-none">{act.path}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-white/20 font-mono text-xs">{new Date(act.timestamp).toLocaleTimeString()}</p>
                       <p className="text-green-500/50 text-[10px] font-black uppercase tracking-widest">Connecté</p>
                    </div>
                  </div>
                ))}
                {visitorActivity.length === 0 && (
                  <div className="py-32 text-center">
                    <div className="text-6xl mb-4 opacity-20">📡</div>
                    <p className="text-white/20 italic">Aucune activité de session détectée.</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <h3 className="text-2xl font-black text-white italic uppercase">Journal des Événements</h3>
             <div className="bg-black/40 rounded-3xl p-8 border border-white/5 font-mono text-[11px] leading-relaxed space-y-3">
               {logs.map(log => (
                 <div key={log.id} className="flex gap-4 border-b border-white/5 pb-2 last:border-0">
                   <span className="text-white/20">[{log.timestamp}]</span>
                   <span className="text-cyan-400 font-black uppercase">{log.action}</span>
                   <span className="text-white/50">{log.details}</span>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>

      {showDocModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-3xl">
          <div className="absolute inset-0 bg-black/90" onClick={() => setShowDocModal({ show: false, catId: '' })}></div>
          <form 
            onSubmit={handlePublishDocument}
            className="bg-slate-900 border border-white/20 rounded-[2.5rem] p-12 max-w-md w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <h4 className="text-3xl font-black text-white mb-8 italic tracking-tighter uppercase">📁 Publication de <span className="text-cyan-400">Document</span></h4>
            
            <div className="space-y-6 mb-10">
              <div className="space-y-2">
                <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-2">Titre de la ressource</label>
                <input 
                  required
                  type="text" 
                  placeholder="Ex: Analyse Algébrique" 
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({...newDoc, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-cyan-400 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-2">Description technique</label>
                <input 
                  type="text" 
                  placeholder="Informations complémentaires..." 
                  value={newDoc.description}
                  onChange={(e) => setNewDoc({...newDoc, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-cyan-400 outline-none transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-2">Fichier source (Stockage Local)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                    selectedFile 
                      ? 'bg-cyan-500/10 border-cyan-400/50' 
                      : 'bg-white/5 border-white/10 hover:border-cyan-400/30'
                  }`}
                >
                  <input 
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  {selectedFile ? (
                    <>
                      <svg className="w-10 h-10 text-cyan-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                      <span className="text-white font-bold text-center text-sm">{selectedFile.name}</span>
                      <span className="text-cyan-400/50 text-[10px] font-black uppercase">Changer de fichier</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-10 h-10 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      <span className="text-white/20 text-sm font-medium text-center">Cliquez ici pour accéder à votre stockage</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => { setShowDocModal({ show: false, catId: '' }); setSelectedFile(null); }}
                className="flex-1 bg-white/5 text-white/40 font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all"
              >Annuler</button>
              <button 
                type="submit"
                disabled={!selectedFile}
                className="flex-1 bg-cyan-500 disabled:opacity-30 text-slate-950 font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
              >Publier</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
