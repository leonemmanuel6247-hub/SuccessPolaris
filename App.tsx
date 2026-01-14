
import React, { useState, useEffect, useMemo } from 'react';
import AuroraBackground from './components/AuroraBackground.tsx';
import DocumentCard from './components/DocumentCard.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import PDFViewer from './components/PDFViewer.tsx';
import PolarisBrain from './components/PolarisBrain.tsx';
import ExamCountdown from './components/ExamCountdown.tsx';
import { storageService } from './services/storageService.ts';
import { Category, Document, AdminAccount } from './types.ts';

const App: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [totalCount, setTotalCount] = useState(0);
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

  const syncData = async () => {
    setIsSyncing(true);
    
    // ÉTAPE 0 : Chargement immédiat du cache local pour une réactivité instantanée
    const cachedDocs = localStorage.getItem('sp_documents');
    const cachedCats = localStorage.getItem('sp_categories');
    const cachedCount = localStorage.getItem('sp_document_total_count');
    
    if (cachedDocs && cachedCats) {
      setDocuments(JSON.parse(cachedDocs));
      setCategories(JSON.parse(cachedCats));
      setTotalCount(parseInt(cachedCount || '0'));
    }

    // ÉTAPE 1 : Synchronisation du Compteur (Canal A)
    const fetchCounter = async () => {
      try {
        const count = await storageService.chargerCompteur();
        setTotalCount(count);
      } catch (e) {
        console.warn("Canal Compteur indisponible.");
      }
    };

    // ÉTAPE 2 : Synchronisation des Documents Sheets (Canal B)
    const fetchDocs = async () => {
      try {
        const data = await storageService.fetchFromSheets();
        if (data.documents.length > 0) {
          setCategories(data.categories);
          setDocuments(data.documents);
        }
      } catch (err) {
        console.error("Échec du Canal Documents:", err);
      }
    };

    // Exécution en parallèle
    await Promise.all([fetchCounter(), fetchDocs()]);

    setIsSyncing(false);
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
    return documents.filter(doc => doc.categoryId === lastCatId);
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
      alert("⚠️ ACCÈS RÉVOQUÉ PAR LA MATRICE");
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
    if (pendingDoc && userEmail.includes('@')) {
      storageService.saveUserEmail(userEmail);
      processDownload(userEmail, pendingDoc);
      setShowEmailModal(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const accounts = storageService.getAccounts();
    const user = accounts.find(a => a.username.toLowerCase() === adminUsername.toLowerCase());
    
    let isAuthorized = false;
    if (adminUsername.toLowerCase() === 'astarté' && adminPassword === '2008') isAuthorized = true;
    else if (adminUsername.toLowerCase() === 'léon' && adminPassword === 'mazedxn7') isAuthorized = true;
    
    if (isAuthorized && user) {
      setIsAdminMode(true);
      setCurrentAdmin(user);
      setShowAdminLogin(false);
      setAdminUsername('');
      setAdminPassword('');
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 3000);
    }
  };

  const userGrade = storageService.getGrade(userXP);

  return (
    <div className="min-h-screen text-slate-100 font-['Inter'] relative overflow-x-hidden pb-24">
      <AuroraBackground />
      <ExamCountdown />
      <PolarisBrain count={totalCount} />
      
      {viewerDoc && <PDFViewer doc={viewerDoc} onClose={() => setViewerDoc(null)} />}

      <header className="container mx-auto px-6 py-12 flex flex-col items-center gap-12 relative z-50">
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-8 max-w-6xl">
           <div className="flex flex-col items-center gap-6 cursor-pointer group" onClick={() => navigateTo(null)}>
              <div className="w-16 h-16 bg-slate-900/90 border border-white/10 rounded-[1.5rem] flex items-center justify-center relative shadow-neon group-hover:scale-110 transition-all duration-700">
                 <i className="fas fa-star text-cyan-400 text-xl group-hover:rotate-[360deg] transition-all duration-1000"></i>
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic drop-shadow-neon">
                Success<span className="text-cyan-400">Polaris</span>
              </h1>
           </div>

           <div className="flex items-center gap-4">
              <div id="affichage-stats" className="bg-slate-950/60 backdrop-blur-2xl border border-cyan-500/20 p-4 rounded-[2rem] flex items-center gap-5 shadow-2xl border-l-cyan-500/50">
                 <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-400/20 shadow-neon">
                    <i className="fas fa-folder-open text-cyan-400 text-sm"></i>
                 </div>
                 <div className="flex flex-col">
                    <p className="text-[7px] font-black uppercase text-cyan-400/60 tracking-[0.2em]">Base de données</p>
                    <p className="text-[14px] font-black text-white uppercase tracking-tight">
                       <span id="chiffre-compteur">{totalCount}</span> <span className="text-[9px] text-white/40">Archives</span>
                    </p>
                 </div>
              </div>

              <div className="bg-slate-950/60 backdrop-blur-2xl border border-white/10 p-4 rounded-[2rem] flex items-center gap-6 shadow-xl">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black uppercase text-cyan-400">{userGrade}</p>
                    <p className="text-[8px] text-white/40 uppercase font-black">{userXP} XP ACQUIS</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-neon">
                    <i className="fas fa-user-shield text-slate-950"></i>
                  </div>
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
            <button onClick={() => setIsAdminMode(false)} className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-8 flex items-center gap-3">
              <i className="fas fa-arrow-left"></i> Quitter le Terminal
            </button>
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

            <div id="affichage-liste" className="grid grid-cols-1 lg:grid-cols-12 gap-12">
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
                     <i className="fas fa-box-open text-white/5 text-5xl mb-6"></i>
                     <p className="text-white/10 text-[10px] font-black uppercase tracking-[1em]">
                        {viewMode === 'library' ? "Bibliothèque vide" : "Aucune archive trouvée"}
                     </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 w-full py-4 px-12 bg-slate-950/90 backdrop-blur-3xl border-t border-white/5 flex items-center justify-between z-[1000]">
        <p className="text-[8px] text-white/30 font-black uppercase tracking-[0.4em]">SuccessPolaris — Palais v1.8.0 (Live Sheets Sync)</p>
        <button onClick={() => setShowAdminLogin(true)} className="text-[8px] text-white/20 font-black uppercase tracking-widest hover:text-cyan-400 transition-all">DÉVELOPPÉ PAR ASTARTÉ</button>
      </footer>

      {showEmailModal && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-slate-950/98 backdrop-blur-3xl p-6">
          <div className="max-w-[420px] w-full p-12 bg-slate-900/60 border border-white/15 rounded-[4rem] relative shadow-3xl">
            <h3 className="text-center text-sm font-black text-white uppercase italic tracking-[0.4em] mb-10">Accès Polaris</h3>
            <form onSubmit={handleIdentityConfirm} className="space-y-8">
              <input type="email" required placeholder="votre@gmail.com" value={userEmail} onChange={e => setUserEmail(e.target.value)} className="w-full bg-black/70 border border-white/10 rounded-[1.8rem] px-8 py-6 text-white text-center font-black outline-none focus:border-cyan-400" />
              <button type="submit" className="w-full bg-cyan-500 text-slate-950 font-black py-7 rounded-[1.8rem] uppercase text-[11px] tracking-[0.5em] shadow-neon">S'identifier</button>
            </form>
          </div>
        </div>
      )}

      {showAdminLogin && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-6">
          <div className="max-w-[380px] w-full p-12 bg-slate-900/50 border-2 border-cyan-500/20 rounded-[4rem] relative shadow-neon">
            <button onClick={() => setShowAdminLogin(false)} className="absolute top-10 right-10 text-white/20 hover:text-white text-2xl">×</button>
            <form onSubmit={handleAdminLogin} className="space-y-8 text-center">
              <input type="text" placeholder="Utilisateur" value={adminUsername} onChange={e => setAdminUsername(e.target.value)} className="w-full bg-black/80 border border-white/10 rounded-[1.8rem] px-8 py-6 text-white text-center font-black outline-none focus:border-cyan-400" />
              <input type="password" placeholder="Code" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full bg-black/80 border border-white/10 rounded-[1.8rem] px-8 py-6 text-white text-center font-black outline-none focus:border-cyan-400" />
              {loginError && <p className="text-red-500 text-[9px] font-black uppercase">Échec</p>}
              <button type="submit" className="w-full bg-white text-slate-950 font-black py-7 rounded-[1.8rem] uppercase tracking-[0.4em] shadow-xl">Entrer</button>
            </form>
          </div>
        </div>
      )}

      {isSyncing && (
        <div className="fixed inset-0 z-[20000] flex flex-col items-center justify-center bg-slate-950/98 backdrop-blur-3xl">
           <div className="w-20 h-20 border-2 border-t-cyan-500 rounded-full animate-spin"></div>
           <p className="text-cyan-400 text-[9px] font-black uppercase tracking-[1.5em] mt-10">Synchronisation Matrice...</p>
        </div>
      )}
    </div>
  );
};

export default App;
