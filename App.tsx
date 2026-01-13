
import React, { useState, useEffect, useMemo } from 'react';
import AuroraBackground from './components/AuroraBackground.tsx';
import DocumentCard from './components/DocumentCard.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import PDFViewer from './components/PDFViewer.tsx';
import PolarisBrain from './components/PolarisBrain.tsx';
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
  const [viewMode, setViewMode] = useState<'archives' | 'library'>('archives');

  const [userXP, setUserXP] = useState(0);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [pendingDoc, setPendingDoc] = useState<Document | null>(null);
  const [viewerDoc, setViewerDoc] = useState<Document | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const syncData = async () => {
    const data = await storageService.fetchFromSheets();
    setCategories(data.categories);
    setDocuments(data.documents);
    setTimeout(() => setIsSyncing(false), 1000);
  };

  useEffect(() => {
    syncData();
    storageService.logVisit(); 
    setUserXP(storageService.getUserXP());
    const savedEmail = storageService.getUserEmail();
    if (savedEmail) setUserEmail(savedEmail);
  }, []);

  const navigateTo = (cat: Category | null) => {
    setViewMode('archives');
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

  const displayedDocuments = useMemo(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return documents.filter(d => 
        d.title.toLowerCase().includes(q) || 
        d.description.toLowerCase().includes(q)
      );
    }

    if (viewMode === 'library') {
      const historyIds = storageService.getUserHistory();
      return documents.filter(doc => historyIds.includes(doc.id));
    }

    if (navigationPath.length === 0) return [];
    const lastCatId = navigationPath[navigationPath.length - 1].id;
    return documents.filter(doc => doc.categoryId === lastCatId && doc.fileUrl !== '');
  }, [documents, navigationPath, searchQuery, viewMode]);

  const initiateDownload = (doc: Document) => {
    if (!doc.fileUrl) return;
    setPendingDoc(doc);
    const savedEmail = storageService.getUserEmail();
    if (!savedEmail) setShowEmailModal(true);
    else processDownload(savedEmail, doc);
  };

  const processDownload = (email: string, doc: Document) => {
    if (storageService.isEmailBanned(email)) {
      alert("⚠️ ACCÈS RÉVOQUÉ : Votre identité a été proscrite de la Matrice Polaris.");
      return;
    }
    storageService.logDownload(email, doc.title, doc.id);
    storageService.incrementDownload(doc.id);
    storageService.sendToCloudLog(email, doc.title, 'Téléchargement');
    
    const newXP = storageService.addXP(10);
    setUserXP(newXP);
    
    setViewerDoc(doc);
  };

  const handleIdentityConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.includes('@')) { setEmailError('Email invalide'); return; }
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
    } 
    else if (adminUsername.toLowerCase() === 'léon' && adminPassword === 'mazedxn7') {
      isAuthorized = true;
    }
    
    if (isAuthorized && user) {
      setIsAdminMode(true);
      setCurrentAdmin(user);
      setShowAdminLogin(false);
      setLoginError(false);
      setAdminUsername('');
      setAdminPassword('');
      storageService.addLog('AUTH', `Éveil système pour ${user.username}`);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 3000);
    }
  };

  const userGrade = storageService.getGrade(userXP);

  return (
    <div className="min-h-screen text-slate-100 font-['Inter'] relative overflow-x-hidden pb-24">
      <AuroraBackground />
      <PolarisBrain count={documents.length} />
      
      {viewerDoc && <PDFViewer doc={viewerDoc} onClose={() => setViewerDoc(null)} />}

      <header className="container mx-auto px-6 py-12 flex flex-col items-center gap-12 relative z-50">
        <div className="w-full flex justify-between items-start max-w-6xl">
           <div className="flex flex-col items-center gap-6 cursor-pointer group" onClick={() => navigateTo(null)}>
              <div className="w-16 h-16 bg-slate-900/90 border border-white/10 rounded-[1.5rem] flex items-center justify-center relative shadow-neon group-hover:scale-110 transition-all duration-700">
                 <i className="fas fa-star text-cyan-400 text-xl group-hover:rotate-[360deg] transition-all duration-1000"></i>
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic drop-shadow-neon">
                Success<span className="text-cyan-400">Polaris</span>
              </h1>
           </div>

           <div className="bg-slate-950/60 backdrop-blur-2xl border border-white/10 p-4 rounded-[2rem] flex items-center gap-6 shadow-xl">
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase text-cyan-400">{userGrade}</p>
                 <p className="text-[8px] text-white/40 uppercase font-black">{userXP} XP ACQUIS</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-neon">
                 <i className="fas fa-user-shield text-slate-950"></i>
              </div>
           </div>
        </div>

        <div className="w-full max-w-xl px-2 relative group">
           <div className="relative flex items-center bg-slate-950/70 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-1.5 focus-within:border-cyan-400/40 transition-all shadow-2xl">
              <i className="fas fa-search text-white/20 ml-8"></i>
              <input 
                type="text" 
                placeholder="Scanner les archives de la Matrice..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="flex-1 bg-transparent px-6 py-5 text-[14px] outline-none font-bold text-white placeholder-white/20" 
              />
           </div>
        </div>
      </header>

      <main className="container mx-auto px-6 lg:px-24 relative z-10">
        {isAdminMode ? (
          <div className="animate-in">
            <div className="flex justify-between items-center mb-8">
               <button onClick={() => setIsAdminMode(false)} className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-3">
                  <i className="fas fa-arrow-left"></i> Quitter le Terminal
               </button>
               <span className="text-[10px] font-black uppercase text-white/30 italic tracking-widest">Opérateur Némésis : {currentAdmin?.username}</span>
            </div>
            <AdminDashboard categories={categories} documents={documents} currentAdmin={currentAdmin} onRefresh={syncData} />
          </div>
        ) : (
          <div className="space-y-16 animate-in">
            {!searchQuery && (
              <nav className="flex items-center gap-4 overflow-x-auto no-scrollbar py-6 px-10 bg-slate-950/40 rounded-[3rem] border border-white/5 backdrop-blur-3xl">
                <button onClick={() => { setViewMode('archives'); setNavigationPath([]); }} className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'archives' && navigationPath.length === 0 ? 'bg-cyan-500 text-slate-950 shadow-neon' : 'text-white/30 hover:text-white'}`}>Archives</button>
                <button onClick={() => setViewMode('library')} className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${viewMode === 'library' ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'text-white/30 hover:text-white'}`}>Ma Bibliothèque</button>
                <div className="h-6 w-px bg-white/10 mx-2"></div>
                {navigationPath.map((cat, i) => (
                  <button key={cat.id} onClick={() => goBackTo(i)} className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${i === navigationPath.length - 1 ? 'bg-white text-slate-950' : 'text-white/30'}`}>{cat.name}</button>
                ))}
              </nav>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {viewMode === 'archives' && !searchQuery && currentLevelCategories.length > 0 && (
                <div className="lg:col-span-4 space-y-6">
                  {currentLevelCategories.map(cat => (
                    <button key={cat.id} onClick={() => navigateTo(cat)} className="w-full flex items-center justify-between p-8 bg-slate-900/30 border border-white/5 rounded-[2.5rem] group hover:bg-cyan-500/5 transition-all">
                      <span className="text-[14px] font-black text-white/80 group-hover:text-cyan-400 uppercase">{cat.name}</span>
                      <i className="fas fa-arrow-right text-white/5 group-hover:text-cyan-400 group-hover:translate-x-2 transition-all"></i>
                    </button>
                  ))}
                </div>
              )}
              <div className={`${(searchQuery || viewMode === 'library' || currentLevelCategories.length === 0) ? 'lg:col-span-12' : 'lg:col-span-8'} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8`}>
                {displayedDocuments.length > 0 ? (
                  displayedDocuments.map(doc => <DocumentCard key={doc.id} doc={doc} onDownload={initiateDownload} />)
                ) : (
                  <div className="col-span-full py-24 text-center">
                     <p className="text-white/10 text-[10px] font-black uppercase tracking-[1em]">
                        {viewMode === 'library' ? "Votre bibliothèque est vide" : "Aucune archive matérialisée"}
                     </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 w-full py-4 px-12 bg-slate-950/90 backdrop-blur-3xl border-t border-white/5 flex items-center justify-between z-[1000]">
        <p className="text-[8px] text-white/30 font-black uppercase tracking-[0.4em]">SuccessPolaris — Palais v1.5.0</p>
        <button 
          onClick={() => setShowAdminLogin(true)} 
          className="text-[8px] text-white/20 font-black uppercase tracking-widest hover:text-cyan-400 transition-all cursor-pointer outline-none"
        >
          DÉVELOPPÉ PAR ASTARTÉ MEMBRE DE NÉMÉSIS
        </button>
      </footer>

      {showEmailModal && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-slate-950/98 backdrop-blur-3xl p-6">
          <div className="max-w-[420px] w-full p-12 bg-slate-900/60 border border-white/15 rounded-[4rem] relative shadow-3xl">
            <h3 className="text-center text-sm font-black text-white uppercase italic tracking-[0.4em] mb-10">Accès Polaris</h3>
            <form onSubmit={handleIdentityConfirm} className="space-y-8">
              <input type="email" required placeholder="votre@gmail.com" value={userEmail} onChange={e => setUserEmail(e.target.value)} className="w-full bg-black/70 border border-white/10 rounded-[1.8rem] px-8 py-6 text-white text-center font-black outline-none focus:border-cyan-400 shadow-[0_0_20px_rgba(0,212,255,0.05)]" />
              <button type="submit" className="w-full bg-cyan-500 hover:bg-white text-slate-950 font-black py-7 rounded-[1.8rem] uppercase text-[11px] tracking-[0.5em] transition-all shadow-neon">S'identifier dans la Matrice</button>
            </form>
          </div>
        </div>
      )}

      {showAdminLogin && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-6">
          <div className="max-w-[380px] w-full p-12 bg-slate-900/50 border-2 border-cyan-500/20 rounded-[4rem] relative shadow-[0_0_100px_rgba(0,212,255,0.1)]">
            <button onClick={() => setShowAdminLogin(false)} className="absolute top-10 right-10 text-white/20 hover:text-white text-2xl">×</button>
            <form onSubmit={handleAdminLogin} className="space-y-8 text-center">
              <div className="mb-6">
                 <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
                    <i className="fas fa-terminal text-cyan-400 animate-pulse"></i>
                 </div>
                 <h3 className="text-white font-black uppercase tracking-[0.4em] italic">Terminal Nemesis</h3>
              </div>
              <input type="text" placeholder="Utilisateur" value={adminUsername} onChange={e => setAdminUsername(e.target.value)} className="w-full bg-black/80 border border-white/10 rounded-[1.8rem] px-8 py-6 text-white text-center font-black outline-none focus:border-cyan-400" />
              <input type="password" placeholder="Code d'Accès" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full bg-black/80 border border-white/10 rounded-[1.8rem] px-8 py-6 text-white text-center font-black outline-none focus:border-cyan-400" />
              {loginError && <p className="text-red-500 text-[9px] font-black uppercase animate-bounce">Autorisation refusée</p>}
              <button type="submit" className="w-full bg-white text-slate-950 font-black py-7 rounded-[1.8rem] uppercase tracking-[0.4em] hover:bg-cyan-500 transition-all shadow-xl">Se Connecter</button>
            </form>
          </div>
        </div>
      )}

      {isSyncing && (
        <div className="fixed inset-0 z-[20000] flex flex-col items-center justify-center bg-slate-950/98 backdrop-blur-3xl">
           <div className="w-20 h-20 border-2 border-t-cyan-500 rounded-full animate-spin"></div>
           <p className="text-cyan-400 text-[9px] font-black uppercase tracking-[1.5em] mt-10 animate-pulse">Réception des flux stellaires...</p>
        </div>
      )}
    </div>
  );
};

export default App;
