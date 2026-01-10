
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

  // 1. INITIALISATION MATRICE
  const syncData = async () => {
    const data = await storageService.fetchFromSheets();
    setCategories(data.categories);
    setDocuments(data.documents);
    // On laisse un petit délai pour l'effet visuel Polaris
    setTimeout(() => setIsSyncing(false), 1000);
  };

  useEffect(() => {
    syncData();
    storageService.logVisit(); 
    // Pré-remplir l'email si déjà connu
    const savedEmail = storageService.getUserEmail();
    if (savedEmail) setUserEmail(savedEmail);
  }, []);

  // 2. LOGIQUE DE NAVIGATION
  const navigateTo = (cat: Category | null) => {
    if (!cat) setNavigationPath([]);
    else setNavigationPath([...navigationPath, cat]);
    setSearchQuery('');
  };

  const goBackTo = (index: number | null) => {
    if (index === null) setNavigationPath([]);
    else setNavigationPath(navigationPath.slice(0, index + 1));
    setSearchQuery('');
  };

  const currentLevelCategories = useMemo(() => {
    const parentId = navigationPath.length > 0 ? navigationPath[navigationPath.length - 1].id : null;
    return categories.filter(c => c.parentId === parentId);
  }, [categories, navigationPath]);

  const currentLevelDocuments = useMemo(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return documents.filter(d => 
        d.title.toLowerCase().includes(q) || 
        d.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (navigationPath.length === 0) return [];
    const lastCatId = navigationPath[navigationPath.length - 1].id;
    return documents.filter(doc => doc.categoryId === lastCatId && doc.fileUrl !== '');
  }, [documents, navigationPath, searchQuery]);

  // 3. LOGIQUE ESPION & TÉLÉCHARGEMENT
  const initiateDownload = (doc: Document) => {
    if (!doc.fileUrl) return;
    setPendingDoc(doc);
    
    const savedEmail = storageService.getUserEmail();
    if (!savedEmail) {
      setShowEmailModal(true);
    } else {
      processDownload(savedEmail, doc);
    }
  };

  const processDownload = (email: string, doc: Document) => {
    // Enregistrement local
    storageService.logDownload(email, doc.title);
    storageService.incrementDownload(doc.id);
    
    // Enregistrement Cloud (Webhook)
    storageService.sendToCloudLog(email, doc.title, 'Téléchargement');

    // Ouverture du fichier
    window.open(doc.fileUrl, '_blank');
  };

  const handleIdentityConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const gmailRegex = /^[a-z0-9](\.?[a-z0-9]){5,}@gmail\.com$/i;
    if (!gmailRegex.test(userEmail)) {
      setEmailError('Format @gmail.com requis');
      return;
    }
    
    if (pendingDoc) {
      storageService.saveUserEmail(userEmail);
      processDownload(userEmail, pendingDoc);
      setShowEmailModal(false);
      setEmailError('');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const accounts = storageService.getAccounts();
    const user = accounts.find(a => a.username.toLowerCase() === adminUsername.toLowerCase());
    
    let isAuthorized = false;
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
      storageService.addLog('AUTH', `Accès autorisé pour ${user.username}`);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 3000);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 selection:bg-cyan-500/30 font-['Inter'] relative overflow-x-hidden pb-16 md:pb-24">
      <AuroraBackground />

      <header className="container mx-auto px-6 py-12 md:py-20 flex flex-col items-center gap-12 relative z-50">
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
            <div className="w-20 md:w-24 h-20 md:h-24 bg-slate-900/90 border border-white/10 rounded-[2rem] flex items-center justify-center relative z-10 group-hover:scale-110 group-hover:border-cyan-500/50 transition-all duration-700 shadow-[0_0_60px_rgba(0,212,255,0.25)]">
               <svg className="w-10 md:w-12 h-10 md:h-12 text-cyan-400 group-hover:rotate-[360deg] transition-transform duration-1000" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
               </svg>
            </div>
          </div>
          <div className="text-center relative">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white uppercase italic leading-none drop-shadow-[0_0_30px_rgba(0,212,255,0.4)]">
              Success<span className="text-cyan-400">Polaris</span>
            </h1>
            <p className="text-[10px] md:text-[12px] uppercase font-black mt-4 md:mt-6 opacity-30 tracking-[1em] md:tracking-[1.5em] group-hover:opacity-100 transition-all duration-1000 text-cyan-400">Majestueuse Voie du Savoir</p>
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
                 <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_15px_#00d4ff] animate-pulse"></div>
                 <h2 className="text-sm md:text-base font-black uppercase italic tracking-[0.4em] text-white">Administration Polaris</h2>
              </div>
              <button onClick={() => { setIsAdminMode(false); setCurrentAdmin(null); }} className="bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-white/40 px-6 py-2 rounded-xl text-[9px] font-black uppercase border border-white/10 transition-all">Quitter</button>
            </div>
            <AdminDashboard categories={categories} documents={documents} currentAdmin={currentAdmin} onRefresh={syncData} />
          </div>
        ) : (
          <div className="space-y-16">
            <nav className="flex items-center gap-4 overflow-x-auto no-scrollbar py-6 px-10 bg-slate-950/40 rounded-[3rem] border border-white/5 backdrop-blur-3xl shadow-lg">
              <button onClick={() => navigateTo(null)} className={`px-8 py-3.5 rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${navigationPath.length === 0 ? 'bg-cyan-500 text-slate-950 shadow-[0_0_30px_rgba(0,212,255,0.2)]' : 'text-white/30 hover:text-white hover:bg-white/5'}`}>Racine Polaris</button>
              {navigationPath.map((cat, i) => (
                <React.Fragment key={cat.id}>
                  <i className="fas fa-chevron-right text-[10px] text-white/10 shrink-0"></i>
                  <button onClick={() => goBackTo(i)} className={`px-8 py-3.5 rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${i === navigationPath.length - 1 ? 'bg-white text-slate-950 shadow-xl' : 'text-white/30 hover:text-white hover:bg-white/5'}`}>{cat.name}</button>
                </React.Fragment>
              ))}
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20">
              {!searchQuery && currentLevelCategories.length > 0 && (
                <div className="lg:col-span-4 space-y-10">
                  <h3 className="text-white/20 text-[10px] font-black uppercase tracking-[1em] flex items-center gap-4 pl-4">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div> Secteurs
                  </h3>
                  <div className="grid grid-cols-1 gap-5">
                    {currentLevelCategories.map(cat => (
                      <button key={cat.id} onClick={() => navigateTo(cat)} className="w-full flex items-center justify-between p-8 md:p-9 bg-slate-900/30 border border-white/5 hover:border-cyan-500/30 rounded-[2.5rem] group transition-all duration-500 hover:bg-cyan-500/5 backdrop-blur-xl shadow-xl">
                        <div className="flex items-center gap-8">
                          <span className="text-4xl filter grayscale group-hover:grayscale-0 transition-all duration-700">{cat.icon || '🪐'}</span>
                          <span className="text-[14px] font-black text-white/80 group-hover:text-cyan-400 transition-colors uppercase block">{cat.name}</span>
                        </div>
                        <i className="fas fa-arrow-right text-white/5 group-hover:text-cyan-400 group-hover:translate-x-2 transition-all"></i>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={`${(searchQuery || currentLevelCategories.length === 0) ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-10`}>
                <h3 className="text-white/20 text-[10px] font-black uppercase tracking-[1em] flex items-center gap-4 pl-4">
                   <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> Archives
                </h3>
                {currentLevelDocuments.length > 0 ? (
                  <div className={`grid grid-cols-1 ${ (searchQuery || currentLevelCategories.length === 0) ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2' } gap-8 md:gap-10`}>
                    {currentLevelDocuments.map(doc => (
                      <DocumentCard key={doc.id} doc={doc} onDownload={initiateDownload} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-40 bg-slate-900/10 rounded-[4rem] border border-dashed border-white/5">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                      <i className="fas fa-box-open text-white/10 text-xl"></i>
                    </div>
                    <p className="text-white/10 text-[10px] font-black uppercase tracking-[1.2em]">Aucun savoir indexé ici</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 w-full py-4 px-6 md:px-12 bg-slate-950/90 backdrop-blur-3xl border-t border-white/5 flex flex-col sm:flex-row items-center justify-between z-[1000] gap-4">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_#00d4ff]"></div>
          <p className="text-[8px] text-white/30 font-black uppercase tracking-[0.4em]">SuccessPolaris — Palais v1.3.0</p>
        </div>
        <div className="flex items-center gap-4 select-none">
          <p className="text-[8px] text-white/20 font-black uppercase tracking-widest">
            MAÎTRESSE D'OEUVRE : <span onClick={() => setShowAdminLogin(true)} className="hover:text-cyan-400 cursor-pointer transition-colors duration-500">ASTARTÉ</span>
          </p>
        </div>
      </footer>

      {showEmailModal && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6 bg-slate-950/98 backdrop-blur-3xl animate-in">
          <div className="max-w-[420px] w-full p-12 bg-slate-900/60 border border-white/15 rounded-[4rem] relative shadow-2xl">
            <button onClick={() => setShowEmailModal(false)} className="absolute top-10 right-10 text-white/20 hover:text-white text-2xl">×</button>
            <div className="text-center mb-10">
              <h3 className="text-sm font-black text-white uppercase italic tracking-[0.4em] mb-4">Accès Polaris</h3>
              <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-cyan-500/20 shadow-neon">
                  <i className="fas fa-fingerprint text-cyan-400 text-2xl"></i>
              </div>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Entre ton email pour accéder aux ressources</p>
            </div>
            <form onSubmit={handleIdentityConfirm} className="space-y-8">
              <input type="email" required placeholder="votre@gmail.com" value={userEmail} onChange={e => { setUserEmail(e.target.value); setEmailError(''); }} className={`w-full bg-black/70 border ${emailError ? 'border-red-500/50' : 'border-white/10'} rounded-[1.8rem] px-8 py-6 text-white outline-none focus:border-cyan-400 font-black text-center transition-all`} />
              {emailError && <p className="text-center text-red-400 text-[9px] font-black uppercase tracking-widest">{emailError}</p>}
              <button type="submit" className="w-full bg-cyan-500 hover:bg-white text-slate-950 font-black py-7 rounded-[1.8rem] uppercase text-[11px] tracking-[0.5em] transition-all shadow-xl active:scale-95">Valider l'Accès</button>
            </form>
          </div>
        </div>
      )}

      {showAdminLogin && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-in">
          <div className="max-w-[380px] w-full p-12 bg-slate-900/50 border border-white/15 rounded-[4rem] relative shadow-3xl">
            <button onClick={() => setShowAdminLogin(false)} className="absolute top-10 right-10 text-white/20 hover:text-white text-2xl">×</button>
            <form onSubmit={handleAdminLogin} className="space-y-8">
              <h3 className="text-white text-center font-black uppercase tracking-[0.4em] mb-10 italic">Console Nemesis</h3>
              <input type="text" placeholder="Identité" value={adminUsername} onChange={e => setAdminUsername(e.target.value)} className="w-full bg-black/80 border border-white/10 rounded-[1.8rem] px-8 py-6 text-white outline-none focus:border-cyan-400 text-center font-black" />
              <input type="password" placeholder="Clé Stellaire" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full bg-black/80 border border-white/10 rounded-[1.8rem] px-8 py-6 text-white outline-none focus:border-cyan-400 text-center font-black" />
              {loginError && <p className="text-center text-red-500 text-[9px] font-black uppercase">Signature Invalide</p>}
              <button type="submit" className="w-full bg-white text-slate-950 font-black py-7 rounded-[1.8rem] uppercase tracking-[0.4em] hover:bg-cyan-500 transition-all">Éveil Système</button>
            </form>
          </div>
        </div>
      )}

      {isSyncing && (
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-950/98 backdrop-blur-3xl animate-in">
           <div className="w-20 h-20 border-2 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_50px_rgba(0,212,255,0.15)]"></div>
           <p className="text-cyan-400 text-[9px] font-black uppercase tracking-[1.5em] mt-10 animate-pulse">Chargement de la Matrice Polaris...</p>
        </div>
      )}
    </div>
  );
};

export default App;
