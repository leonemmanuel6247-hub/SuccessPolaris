
import React, { useState, useEffect, useMemo } from 'react';
import AuroraBackground from './components/AuroraBackground.tsx';
import DocumentCard from './components/DocumentCard.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import { storageService } from './services/storageService.ts';
import { Category, Document } from './types.ts';

const App: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Navigation State
  const [navigationPath, setNavigationPath] = useState<Category[]>([]);
  
  // Auth & UI States
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Notification Alert
  const [showNewAlert, setShowNewAlert] = useState(false);

  const refreshData = () => {
    setCategories(storageService.getCategories());
    setDocuments(storageService.getDocuments());
    if (storageService.getNewPostFlag()) {
      setShowNewAlert(true);
    }
  };

  useEffect(() => {
    refreshData();
    storageService.updateStats(1, 0);
    
    const interval = setInterval(() => {
      const docs = storageService.getDocuments();
      const lastCount = Number(localStorage.getItem('sp_last_count') || docs.length);
      if (docs.length > lastCount) {
        setShowNewAlert(true);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isAdminMode]);

  const navigateTo = (cat: Category | null) => {
    if (!cat) {
      setNavigationPath([]);
      storageService.trackMovement("Accueil");
    } else {
      const newPath = [...navigationPath, cat];
      setNavigationPath(newPath);
      storageService.trackMovement(newPath.map(c => c.name).join(" > "));
    }
  };

  const goBackTo = (index: number | null) => {
    if (index === null) {
      setNavigationPath([]);
      storageService.trackMovement("Retour Index");
    } else {
      const newPath = navigationPath.slice(0, index + 1);
      setNavigationPath(newPath);
      storageService.trackMovement("Navigation vers " + newPath.map(c => c.name).join(" > "));
    }
  };

  const currentLevelCategories = useMemo(() => {
    const parentId = navigationPath.length > 0 ? navigationPath[navigationPath.length - 1].id : null;
    return categories.filter(c => c.parentId === parentId);
  }, [categories, navigationPath]);

  const currentLevelDocuments = useMemo(() => {
    if (navigationPath.length === 0) return [];
    const lastCatId = navigationPath[navigationPath.length - 1].id;
    return documents.filter(doc => doc.categoryId === lastCatId);
  }, [documents, navigationPath]);

  const handleDownload = async (doc: Document) => {
    if (doc.isLocal) {
      const blob = await storageService.getFileBinary(doc.githubUrl);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `${doc.title}.pdf`;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert("Fichier non trouvé sur cet appareil.");
      }
    } else {
      window.open(doc.githubUrl, '_blank');
    }
    storageService.incrementDownload(doc.id);
    refreshData();
  };

  const dismissAlert = () => {
    setShowNewAlert(false);
    storageService.acknowledgeNewPosts();
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername === 'Léon' && adminPassword === 'mazedxn7') {
      setIsAdminMode(true);
      setShowAdminLogin(false);
      setLoginError(false);
      setAdminUsername('');
      setAdminPassword('');
      storageService.addLog('Authentification', 'Accès administrateur validé pour Léon.');
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen relative pb-40 text-slate-100 selection:bg-cyan-500/30">
      <AuroraBackground />
      
      {showNewAlert && !isAdminMode && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] bg-gradient-to-r from-cyan-600 to-violet-600 text-white px-10 py-5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center gap-6 animate-in slide-in-from-top-20 duration-700 border border-white/20">
          <div className="bg-white/20 p-2 rounded-full animate-bounce">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
          </div>
          <div className="flex flex-col">
             <span className="font-black uppercase text-[10px] tracking-[0.3em]">Mise à jour</span>
             <span className="font-bold text-sm">De nouveaux documents ont été publiés.</span>
          </div>
          <button onClick={dismissAlert} className="ml-4 bg-black/10 hover:bg-black/20 p-2 rounded-full transition-all active:scale-90">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      <header className="container mx-auto px-8 py-16 flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="flex items-center gap-6 cursor-pointer group" onClick={() => navigateTo(null)}>
          <div className="w-16 h-16 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-12 group-hover:scale-110 transition-all duration-500">
            <svg className="w-10 h-10 text-slate-950" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-white">SUCCESS<span className="text-cyan-400">POLARIS</span></h1>
            <p className="text-[10px] uppercase tracking-[0.5em] text-white/30 font-black mt-1">Système de Gestion Documentaire</p>
          </div>
        </div>

        {!isAdminMode && (
          <div className="relative w-full max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-white/20 group-focus-within:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
              type="text" 
              placeholder="Rechercher un document..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full pl-14 pr-8 py-4 text-sm focus:border-cyan-400/50 outline-none backdrop-blur-3xl transition-all focus:ring-4 ring-cyan-500/10"
            />
          </div>
        )}
      </header>

      <main className="container mx-auto px-8">
        {isAdminMode ? (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-black text-white italic tracking-tight">CONSOLE D'ADMINISTRATION</h2>
               <button 
                  onClick={() => setIsAdminMode(false)}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
               >Déconnexion</button>
            </div>
            <AdminDashboard />
          </div>
        ) : (
          <div className="space-y-16">
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-2xl">
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => goBackTo(null)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${navigationPath.length === 0 ? 'bg-cyan-500 text-slate-950' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >📂 Index</button>
                {navigationPath.map((cat, i) => (
                  <React.Fragment key={cat.id}>
                    <span className="text-white/10">❯</span>
                    <button 
                      onClick={() => goBackTo(i)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${i === navigationPath.length - 1 ? 'bg-cyan-500 text-slate-950' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                      {cat.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-4 space-y-10">
                <div>
                   <h3 className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
                     <span className="w-12 h-[1px] bg-white/10"></span> NAVIGATION
                   </h3>
                   <div className="grid grid-cols-1 gap-3">
                     {currentLevelCategories.map(cat => (
                       <button 
                         key={cat.id}
                         onClick={() => navigateTo(cat)}
                         className="w-full flex items-center justify-between p-7 bg-white/5 border border-transparent hover:border-cyan-500/30 hover:bg-white/10 rounded-3xl transition-all group active:scale-[0.98]"
                       >
                         <div className="flex items-center gap-5">
                            <span className="text-2xl group-hover:scale-125 transition-transform duration-300">
                              {navigationPath.length === 0 ? '📁' : '📂'}
                            </span>
                            <span className="text-lg font-bold text-white/60 group-hover:text-white">{cat.name}</span>
                         </div>
                         <svg className="w-6 h-6 text-white/10 group-hover:text-cyan-400 transition-all group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                       </button>
                     ))}
                     {currentLevelCategories.length === 0 && navigationPath.length > 0 && (
                       <div className="p-10 border border-dashed border-white/10 rounded-3xl text-center">
                          <p className="text-white/20 italic text-sm">Fin de l'arborescence actuelle.</p>
                       </div>
                     )}
                   </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-10">
                 <h3 className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
                  <span className="w-12 h-[1px] bg-white/10"></span> FICHIERS DISPONIBLES
                </h3>
                
                {currentLevelDocuments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-10 duration-700">
                    {currentLevelDocuments.map(doc => (
                      <DocumentCard key={doc.id} doc={doc} onDownload={handleDownload} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-40 bg-white/5 rounded-[3.5rem] border border-dashed border-white/10 group">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                      <svg className="w-12 h-12 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <p className="text-white/30 text-lg font-medium text-center max-w-xs leading-relaxed">
                      {navigationPath.length === 0 
                        ? "Veuillez sélectionner une catégorie pour afficher les documents."
                        : "Cette catégorie ne contient aucun document pour le moment."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-0 w-full p-10 bg-slate-950/80 backdrop-blur-3xl border-t border-white/5 flex flex-col md:flex-row items-center justify-between z-50">
        <div className="flex items-center gap-6">
          <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.6em]">Polaris Core v3.2</p>
          <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_#00d4ff] animate-pulse"></div>
        </div>
        
        <button 
          onClick={() => setShowAdminLogin(true)}
          className="group relative px-8 py-3 overflow-hidden rounded-xl"
        >
          <span className="relative z-10 text-[10px] text-cyan-400/50 group-hover:text-cyan-400 uppercase tracking-[0.4em] font-black transition-all">
            Développé par <span className="underline decoration-cyan-400/20 underline-offset-8">Astarté</span> (Némésis)
          </span>
          <div className="absolute inset-0 bg-cyan-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
        </button>
      </footer>

      {/* LOGIN ADMIN MODAL */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 backdrop-blur-[50px]">
          <div className="absolute inset-0 bg-black/95" onClick={() => setShowAdminLogin(false)}></div>
          <div className="bg-slate-900 border border-white/10 rounded-[3.5rem] p-14 max-w-md w-full relative z-10 shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-20 duration-500">
            <div className="text-center mb-12">
               <div className="inline-block px-5 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-[9px] font-black uppercase tracking-[0.5em] mb-6">Nexus Administratif</div>
               <h3 className="text-4xl font-black text-white italic tracking-tighter">AUTHENTIFICATION</h3>
            </div>
            
            <form onSubmit={handleAdminLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-4">Utilisateur</label>
                <input 
                  type="text" 
                  required
                  placeholder="Identifiant" 
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className={`w-full bg-black/40 border ${loginError ? 'border-red-500' : 'border-white/5'} rounded-2xl px-8 py-5 text-white outline-none focus:border-cyan-400/50 transition-all`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-4">Mot de Passe</label>
                <input 
                  type="password" 
                  required
                  placeholder="Code de sécurité" 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className={`w-full bg-black/40 border ${loginError ? 'border-red-500' : 'border-white/5'} rounded-2xl px-8 py-5 text-white outline-none focus:border-cyan-400/50 transition-all`}
                />
              </div>
              
              {loginError && (
                <p className="text-red-500 text-[10px] font-black uppercase text-center animate-bounce">Identifiants incorrects. Accès refusé.</p>
              )}
              
              <button 
                type="submit"
                className="w-full bg-white text-slate-950 font-black py-6 mt-6 rounded-[2rem] uppercase tracking-[0.2em] shadow-2xl hover:bg-cyan-400 transition-all active:scale-95 transform"
              >Accéder à la console</button>
            </form>
            
            <p className="text-center text-white/20 text-[8px] uppercase font-black tracking-[0.3em] mt-10">Polaris Secure Access Protocol</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
