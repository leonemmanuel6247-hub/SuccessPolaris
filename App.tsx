
import React, { useState, useEffect, useMemo } from 'react';
import AuroraBackground from './components/AuroraBackground.tsx';
import DocumentCard from './components/DocumentCard.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import { storageService } from './services/storageService.ts';
import { Category, Document, AdminAccount } from './types.ts';

const App: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [navigationPath, setNavigationPath] = useState<Category[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminAccount | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [pendingDoc, setPendingDoc] = useState<Document | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const syncData = async () => {
    setIsSyncing(true);
    const data = await storageService.fetchFromSheets();
    setCategories(data.categories);
    setDocuments(data.documents);
    setIsSyncing(false);
  };

  useEffect(() => {
    syncData();
    storageService.logVisit(); 
  }, []);

  const navigateTo = (cat: Category | null) => {
    if (!cat) setNavigationPath([]);
    else setNavigationPath([...navigationPath, cat]);
  };

  const goBackTo = (index: number | null) => {
    if (index === null) setNavigationPath([]);
    else setNavigationPath(navigationPath.slice(0, index + 1));
  };

  const currentLevelCategories = useMemo(() => {
    const parentId = navigationPath.length > 0 ? navigationPath[navigationPath.length - 1].id : null;
    return searchQuery ? [] : categories.filter(c => c.parentId === parentId);
  }, [categories, navigationPath, searchQuery]);

  const currentLevelDocuments = useMemo(() => {
    if (searchQuery) {
      return documents.filter(d => 
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        d.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (navigationPath.length === 0) return [];
    const lastCatId = navigationPath[navigationPath.length - 1].id;
    return documents.filter(doc => doc.categoryId === lastCatId);
  }, [documents, navigationPath, searchQuery]);

  const initiateDownload = (doc: Document) => {
    setPendingDoc(doc);
    setShowEmailModal(true);
  };

  const handleIdentityConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      setEmailError('Format d\'email invalide');
      return;
    }
    if (pendingDoc) {
      storageService.logDownload(userEmail, pendingDoc.title);
      storageService.incrementDownload(pendingDoc.id);
      window.open(pendingDoc.fileUrl, '_blank');
      setShowEmailModal(false);
      setUserEmail('');
      setEmailError('');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const accounts = storageService.getAccounts();
    const user = accounts.find(a => a.username.toLowerCase() === adminUsername.toLowerCase());
    
    let isAuthorized = false;
    // Clé Léon: mazedxn7, Clé Astarté: 2008
    if (adminUsername.toLowerCase() === 'astarté' && adminPassword === '2008') {
      isAuthorized = true;
    } else if (user && adminPassword === 'mazedxn7') {
      isAuthorized = true;
    }
    
    if (isAuthorized && user) {
      setIsAdminMode(true);
      setCurrentAdmin(user);
      setShowAdminLogin(false);
      setLoginError(false);
      setAdminUsername('');
      setAdminPassword('');
      storageService.addLog('AUTH', `Éveil du système par ${user.username}`);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 3000);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 selection:bg-cyan-500/30 font-['Inter'] relative overflow-x-hidden pb-16 md:pb-24">
      <AuroraBackground />

      <header className="container mx-auto px-6 py-12 md:py-24 flex flex-col items-center gap-12 relative z-50">
        <div className="flex flex-col items-center gap-6 cursor-pointer group" onClick={() => navigateTo(null)}>
          <div className="relative">
            <div className="absolute -inset-24 md:-inset-32 w-64 md:w-80 h-64 md:h-80 pointer-events-none opacity-40 group-hover:opacity-100 transition-all duration-1000 scale-110 group-hover:scale-125 animate-float">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-none overflow-visible">
                    <circle cx="50" cy="50" r="1" fill="cyan" />
                    <circle cx="15" cy="15" r="0.8" fill="white" />
                    <circle cx="85" cy="15" r="0.8" fill="white" />
                    <circle cx="95" cy="80" r="1" fill="cyan" />
                    <circle cx="5" cy="80" r="0.8" fill="white" />
                    <circle cx="50" cy="5" r="0.8" fill="white" />
                    <circle cx="50" cy="95" r="0.8" fill="white" />
                    <g className="opacity-30" stroke="cyan" strokeWidth="0.2" strokeDasharray="3 2">
                        <path d="M15 15 L50 50 L85 15 M50 50 L95 80 M50 50 L5 80 M50 5 L50 95" />
                    </g>
                </svg>
            </div>
            
            <div className="w-20 md:w-24 h-20 md:h-24 bg-slate-900/90 border border-white/10 rounded-[2rem] flex items-center justify-center relative z-10 group-hover:scale-110 group-hover:border-cyan-500/50 transition-all duration-700 shadow-[0_0_60px_rgba(0,212,255,0.2)]">
               <svg className="w-10 md:w-12 h-10 md:h-12 text-cyan-400 group-hover:rotate-[360deg] transition-transform duration-1000" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
               </svg>
            </div>
          </div>
          <div className="text-center relative">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white uppercase italic leading-none drop-shadow-[0_0_30px_rgba(0,212,255,0.5)]">
              Success<span className="text-cyan-400">Polaris</span>
            </h1>
            <p className="text-[10px] md:text-[12px] uppercase font-black mt-4 md:mt-6 opacity-40 tracking-[0.8em] md:tracking-[1.2em] group-hover:opacity-100 transition-all duration-1000 text-cyan-400">Majestueuse Voie du Savoir</p>
          </div>
        </div>

        {!isAdminMode && (
          <div className="w-full max-w-lg relative group px-2">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500/30 to-indigo-500/30 rounded-[2.5rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
            <input 
              type="text" 
              placeholder="Explorer les archives de SuccessPolaris..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/70 border border-white/10 rounded-[2rem] md:rounded-[2.5rem] pl-16 md:pl-20 pr-8 md:pr-10 py-5 md:py-7 text-[13px] md:text-[15px] focus:border-cyan-400/60 outline-none backdrop-blur-3xl transition-all placeholder:text-white/10 text-white font-black relative z-10 shadow-2xl"
            />
          </div>
        )}
      </header>

      <main className="container mx-auto px-6 md:px-12 lg:px-24 relative z-10">
        {isAdminMode ? (
          <div className="space-y-12 animate-in">
            <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-8">
              <div className="flex items-center gap-6">
                 <div className="w-4 h-4 bg-cyan-400 rounded-full shadow-[0_0_25px_#00d4ff] animate-pulse"></div>
                 <h2 className="text-lg md:text-xl font-black uppercase italic tracking-[0.4em] text-white">Console Polaris — {currentAdmin?.username}</h2>
              </div>
              <button 
                onClick={() => { setIsAdminMode(false); setCurrentAdmin(null); }}
                className="bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/40 px-8 py-3 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all"
              >Mettre en Veille</button>
            </div>
            <AdminDashboard 
              categories={categories} 
              documents={documents} 
              currentAdmin={currentAdmin}
              onRefresh={syncData} 
            />
          </div>
        ) : (
          <div className="space-y-16 md:space-y-24">
            <nav className="flex items-center gap-3 md:gap-5 overflow-x-auto no-scrollbar py-4 md:py-6 px-6 md:px-10 bg-slate-950/60 rounded-[2.5rem] md:rounded-[3rem] border border-white/5 backdrop-blur-3xl">
              <button onClick={() => navigateTo(null)} className={`px-8 md:px-12 py-3 md:py-4 rounded-[1.2rem] md:rounded-[1.5rem] text-[10px] md:text-[12px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${navigationPath.length === 0 ? 'bg-cyan-400 text-slate-950' : 'text-white/20 hover:text-white'}`}>Racine Polaris</button>
              {navigationPath.map((cat, i) => (
                <React.Fragment key={cat.id}>
                  <div className="w-1.5 h-1.5 bg-cyan-400/20 rounded-full shrink-0"></div>
                  <button onClick={() => goBackTo(i)} className={`px-8 md:px-12 py-3 md:py-4 rounded-[1.2rem] md:rounded-[1.5rem] text-[10px] md:text-[12px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${i === navigationPath.length - 1 ? 'bg-white text-slate-950' : 'text-white/20 hover:text-white'}`}>{cat.name}</button>
                </React.Fragment>
              ))}
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20">
              {!searchQuery && (
                <div className="lg:col-span-4 space-y-6 md:space-y-10">
                  <h3 className="text-white/20 text-[9px] md:text-[11px] font-black uppercase tracking-[1em] mb-10 flex items-center gap-4 pl-3">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div> Secteurs
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:gap-6">
                    {currentLevelCategories.map(cat => (
                      <button key={cat.id} onClick={() => navigateTo(cat)} className="w-full flex items-center justify-between p-8 md:p-10 bg-slate-900/40 border border-white/5 hover:border-cyan-500/40 rounded-[2.5rem] group transition-all duration-700 hover:bg-cyan-500/5 backdrop-blur-md">
                        <div className="flex items-center gap-6 md:gap-8">
                          <span className="text-3xl opacity-50 group-hover:opacity-100 transition-all">{cat.icon || '🪐'}</span>
                          <span className="text-[15px] font-black text-white/90 group-hover:text-cyan-400 transition-colors uppercase tracking-tighter block leading-none">{cat.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={`${searchQuery ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-12`}>
                <h3 className="text-white/20 text-[9px] md:text-[11px] font-black uppercase tracking-[1em] mb-10 flex items-center gap-4 pl-3">
                   <div className="w-2 h-2 bg-indigo-500 rounded-full"></div> Archives
                </h3>
                {currentLevelDocuments.length > 0 ? (
                  <div className={`grid grid-cols-1 ${searchQuery ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'} gap-8 md:gap-12`}>
                    {currentLevelDocuments.map(doc => (
                      <DocumentCard key={doc.id} doc={doc} onDownload={initiateDownload} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-32 md:py-48 bg-slate-900/10 rounded-[4rem] border border-dashed border-white/5">
                    <p className="text-white/10 text-[13px] font-black uppercase tracking-[1.5em]">Horizon vide</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 w-full py-4 px-6 md:px-12 bg-slate-950/90 backdrop-blur-3xl border-t border-white/5 flex flex-col sm:flex-row items-center justify-between z-[1000] gap-4">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
          <p className="text-[8px] md:text-[9px] text-white/30 font-black uppercase tracking-[0.4em]">SuccessPolaris — Palace v1.0.2</p>
        </div>
        <div className="flex items-center gap-4 select-none">
          <p className="text-[8px] text-white/20 font-black uppercase tracking-widest">
            CRÉÉ PAR <span onClick={() => setShowAdminLogin(true)} className="hover:text-cyan-400 cursor-pointer transition-colors duration-500">ASTARTÉ</span> — MEMBRE DE NEMESIS
          </p>
        </div>
      </footer>

      {showEmailModal && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6 bg-slate-950/98 backdrop-blur-3xl animate-in">
          <div className="max-w-[420px] w-full p-12 md:p-16 bg-slate-900/60 border border-white/15 rounded-[4rem] relative shadow-3xl">
            <button onClick={() => setShowEmailModal(false)} className="absolute top-10 right-10 text-white/20 hover:text-white text-2xl">×</button>
            <div className="text-center mb-10">
              <h3 className="text-md font-black text-white uppercase italic tracking-[0.5em] mb-3">Identification Requise</h3>
              <p className="text-[9px] text-white/30 font-bold uppercase">Format d'email vérifié par Polaris</p>
            </div>
            <form onSubmit={handleIdentityConfirm} className="space-y-10">
              <div className="bg-cyan-500/5 p-6 rounded-[2.5rem] border border-cyan-500/20 text-center font-black text-cyan-400">{pendingDoc?.title}</div>
              <input type="email" required placeholder="votre@email.com" value={userEmail} onChange={e => { setUserEmail(e.target.value); setEmailError(''); }} className={`w-full bg-black/70 border ${emailError ? 'border-red-500' : 'border-white/10'} rounded-[1.5rem] px-8 py-5 text-white outline-none focus:border-cyan-400 font-black text-center`} />
              {emailError && <p className="text-center text-red-500 text-[9px] font-black uppercase">{emailError}</p>}
              <button type="submit" className="w-full bg-cyan-400 hover:bg-white text-slate-950 font-black py-6 rounded-[1.5rem] uppercase text-[11px] tracking-[0.5em] transition-all">Télécharger l'Archive</button>
            </form>
          </div>
        </div>
      )}

      {showAdminLogin && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-in">
          <div className="max-w-[380px] w-full p-12 md:p-16 bg-slate-900/50 border border-white/15 rounded-[4rem] relative">
            <button onClick={() => setShowAdminLogin(false)} className="absolute top-10 right-10 text-white/20 hover:text-white text-2xl">×</button>
            <form onSubmit={handleAdminLogin} className="space-y-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-cyan-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-cyan-500/20">
                  <i className="fas fa-fingerprint text-cyan-400 text-2xl"></i>
                </div>
                <h3 className="text-white font-black uppercase tracking-[0.4em] mb-10 italic">Console Nemesis</h3>
              </div>
              <input type="text" placeholder="Utilisateur" value={adminUsername} onChange={e => setAdminUsername(e.target.value)} className="w-full bg-black/80 border border-white/10 rounded-[1.5rem] px-8 py-6 text-white outline-none focus:border-cyan-400 text-center font-black" />
              <input type="password" placeholder="Clé Stellaire" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full bg-black/80 border border-white/10 rounded-[1.5rem] px-8 py-6 text-white outline-none focus:border-cyan-400 text-center font-black" />
              {loginError && <p className="text-center text-red-500 text-[9px] font-black uppercase animate-pulse">Clé Invalide</p>}
              <button type="submit" className="w-full bg-white text-slate-950 font-black py-6 rounded-[1.5rem] uppercase tracking-widest hover:bg-cyan-400 transition-all">Éveil du Système</button>
            </form>
          </div>
        </div>
      )}

      {isSyncing && (
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-950/98 backdrop-blur-3xl">
           <div className="w-20 h-20 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin"></div>
           <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[1em] mt-10 animate-pulse">Synchronisation Cloud...</p>
        </div>
      )}
    </div>
  );
};

export default App;
