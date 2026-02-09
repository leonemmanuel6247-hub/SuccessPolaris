
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
  const [secretCode, setSecretCode] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [viewMode, setViewMode] = useState<'archives' | 'library'>('archives');

  const [userXP, setUserXP] = useState(0);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [pendingDoc, setPendingDoc] = useState<Document | null>(null);
  const [viewerDoc, setViewerDoc] = useState<Document | null>(null);
  const [userEmail, setUserEmail] = useState('');

  const syncDocs = async () => {
    setIsSyncing(true);
    try {
      const data = await storageService.fetchFromSheets();
      if (data.documents.length > 0) {
        setCategories(data.categories);
        setDocuments(data.documents);
        setTotalCount(data.documents.length);
      } else {
        const externalCount = await storageService.chargerCompteur();
        setTotalCount(externalCount);
      }
    } catch (err) { 
      console.error("Nexus Sync Error:", err); 
    } 
    finally { 
      setIsSyncing(false); 
    }
  };

  useEffect(() => {
    syncDocs();
    storageService.logVisit(); 
    setUserXP(storageService.getUserXP());
    const savedEmail = storageService.getUserEmail();
    if (savedEmail) setUserEmail(savedEmail);
  }, []);

  const handlePreview = (doc: Document) => {
    storageService.logPreview(storageService.getUserEmail(), doc.title);
    setViewerDoc(doc);
  };

  const handleObtain = (doc: Document) => {
    setPendingDoc(doc);
    const savedEmail = storageService.getUserEmail();
    if (!savedEmail) setShowEmailModal(true);
    else processFullAccess(savedEmail, doc);
  };

  const processFullAccess = (email: string, doc: Document) => {
    if (storageService.isEmailBanned(email)) return alert("Accès Révoqué par le Protocole.");
    storageService.logDownload(email, doc.title, doc.id);
    storageService.incrementDownload(doc.id);
    setUserXP(storageService.addXP(25));
    setViewerDoc(doc);
  };

  const handleIdentityConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingDoc && userEmail.includes('@')) {
      storageService.saveUserEmail(userEmail);
      processFullAccess(userEmail, pendingDoc);
      setShowEmailModal(false);
    }
  };

  const navigateTo = (cat: Category | null) => {
    setViewMode('archives');
    setNavigationPath(cat ? [...navigationPath, cat] : []);
    setSearchQuery('');
  };

  const currentLevelCategories = useMemo(() => {
    const parentId = navigationPath.length > 0 ? navigationPath[navigationPath.length - 1].id : null;
    return categories.filter(c => c.parentId === parentId);
  }, [categories, navigationPath]);

  const displayedDocuments = useMemo(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return documents.filter(d => d.title.toLowerCase().includes(q));
    }
    if (viewMode === 'library') {
      const history = storageService.getUserHistory();
      return documents.filter(doc => history.includes(doc.id));
    }
    if (navigationPath.length === 0) return [];
    const lastCatId = navigationPath[navigationPath.length - 1].id;
    return documents.filter(doc => doc.categoryId === lastCatId);
  }, [documents, navigationPath, searchQuery, viewMode]);

  return (
    <div className="min-h-screen text-slate-200 selection:bg-cyan-500/30">
      <AuroraBackground />
      <ExamCountdown onAdminAccess={() => setShowAdminLogin(true)} />
      <PolarisBrain count={totalCount} documents={documents} categories={categories} />
      
      {/* PORTE DÉROBÉE ASTARTÉ SECONDAIRE */}
      {!isAdminMode && (
        <div className="fixed bottom-6 right-[240px] z-[7000] hidden sm:block">
          <button 
            onClick={() => setShowAdminLogin(true)}
            className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-cyan-500/20 px-4 py-3 rounded-2xl group hover:border-cyan-400 transition-all"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(0,212,255,1)]"></div>
            <span className="text-[10px] font-black text-cyan-400/80 uppercase tracking-[0.2em] group-hover:text-cyan-400 transition-colors">
              ASTARTÉ_ROOT
            </span>
          </button>
        </div>
      )}

      {viewerDoc && <PDFViewer doc={viewerDoc} onClose={() => setViewerDoc(null)} />}

      <style>{`
        @keyframes admin-blink {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; transform: scale(1.02); filter: drop-shadow(0 0 5px cyan); }
        }
        .animate-admin-blink {
          animation: admin-blink 1s ease-in-out infinite;
        }
      `}</style>

      <header className="container mx-auto px-6 py-16 flex flex-col items-center gap-12 relative z-50">
        {!isAdminMode && (
          <>
            <div className="w-full flex flex-col md:flex-row justify-between items-center gap-8 max-w-6xl">
               <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => navigateTo(null)}>
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-400/20 to-blue-600/5 backdrop-blur-2xl border border-cyan-500/20 rounded-[2rem] flex items-center justify-center shadow-[0_0_30px_rgba(0,212,255,0.2)] group-hover:scale-105 transition-all duration-500">
                     <i className="fas fa-atom text-cyan-400 text-2xl group-hover:rotate-180 transition-transform duration-1000"></i>
                  </div>
                  <h1 className="text-2xl font-black tracking-widest text-white uppercase italic">
                    Success<span className="text-cyan-400">Polaris</span>
                  </h1>
               </div>

               <div className="flex items-center gap-4">
                  <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-4 rounded-[1.5rem] flex items-center gap-4 shadow-xl">
                     <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                        <i className="fas fa-database text-cyan-400 text-sm"></i>
                     </div>
                     <div className="flex flex-col">
                        <p className="text-[7px] font-black uppercase text-cyan-400/60 tracking-widest">Flux Archives</p>
                        <p className="text-[14px] font-black text-white">{totalCount} items</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="w-full max-w-xl relative">
               <div className="relative flex items-center bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-1.5 focus-within:border-cyan-400 transition-all shadow-2xl">
                  <i className="fas fa-search text-cyan-400/30 ml-6"></i>
                  <input 
                    type="text" 
                    placeholder="Scanner les archives du savoir..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent px-5 py-4 text-[14px] outline-none font-medium text-white placeholder-white/20" 
                  />
               </div>
            </div>
          </>
        )}
      </header>

      <main className="container mx-auto px-6 lg:px-20 pb-32">
        {isAdminMode ? (
          <div className="relative z-50 animate-in fade-in slide-in-from-bottom-10 duration-700">
             <div className="flex items-center justify-between mb-8">
                <button onClick={() => setIsAdminMode(false)} className="flex items-center gap-3 text-cyan-400 font-black uppercase text-[10px] tracking-widest hover:translate-x-[-5px] transition-all bg-cyan-500/5 px-6 py-3 rounded-xl border border-cyan-500/10">
                   <i className="fas fa-arrow-left"></i> Quitter la Matrice
                </button>
                <div className="flex items-center gap-2 text-white/20 text-[8px] font-black uppercase tracking-widest italic">
                  Connecté au Terminal Maître
                </div>
             </div>
             <AdminDashboard categories={categories} documents={documents} currentAdmin={currentAdmin} onRefresh={syncDocs} />
          </div>
        ) : (
          <div className="space-y-12">
            {!searchQuery && (
              <nav className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
                <button onClick={() => { setViewMode('archives'); setNavigationPath([]); }} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'archives' && navigationPath.length === 0 ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(0,212,255,0.4)]' : 'bg-white/5 text-white/40 hover:text-white'}`}>Secteurs</button>
                <button onClick={() => setViewMode('library')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'library' ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(0,212,255,0.4)]' : 'bg-white/5 text-white/40 hover:text-white'}`}>Mon Index</button>
                {navigationPath.map((cat, i) => (
                  <button key={cat.id} onClick={() => setNavigationPath(navigationPath.slice(0, i + 1))} className="px-6 py-3 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{cat.name}</button>
                ))}
              </nav>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {viewMode === 'archives' && !searchQuery && currentLevelCategories.length > 0 && (
                <div className="lg:col-span-3 grid grid-cols-1 gap-4">
                  {currentLevelCategories.map(cat => (
                    <button key={cat.id} onClick={() => navigateTo(cat)} className="w-full flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-3xl group hover:bg-cyan-500 hover:text-black transition-all duration-500">
                      <span className="text-[11px] font-black uppercase tracking-widest">{cat.name}</span>
                      <i className="fas fa-chevron-right text-[10px] opacity-20 group-hover:opacity-100"></i>
                    </button>
                  ))}
                </div>
              )}
              <div className={`${(searchQuery || viewMode === 'library' || (viewMode === 'archives' && currentLevelCategories.length === 0)) ? 'lg:col-span-12' : 'lg:col-span-9'} grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8`}>
                {displayedDocuments.length > 0 ? (
                  displayedDocuments.map(doc => (
                    <DocumentCard key={doc.id} doc={doc} onPreview={handlePreview} onDownload={handleObtain} />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center">
                     <i className="fas fa-satellite-dish text-white/10 text-4xl mb-6"></i>
                     <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Aucune donnée détectée dans ce secteur</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 w-full py-6 px-12 bg-black/60 backdrop-blur-xl border-t border-white/5 flex items-center justify-between z-[1000]">
        <p className="text-[8px] text-cyan-400/20 font-black uppercase tracking-[0.5em]">POLARIS PROTOCOL // NEXUS V2.6</p>
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setShowAdminLogin(true)}
             className="text-[8px] text-white/20 hover:text-cyan-400 transition-colors font-black uppercase tracking-widest italic"
           >
             Astarté Léon (Admin Control Room)
           </button>
        </div>
      </footer>

      {showEmailModal && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/95 p-6">
          <div className="max-w-md w-full p-12 bg-white/5 border border-cyan-500/20 rounded-[3rem] text-center shadow-2xl backdrop-blur-3xl">
            <h3 className="text-xl font-black text-white uppercase italic mb-4">Initialisation du Canal</h3>
            <p className="text-[10px] text-cyan-100/40 uppercase font-black mb-10 leading-relaxed">Confirmez votre identité pour synchroniser l'archive Polaris.</p>
            <form onSubmit={handleIdentityConfirm} className="space-y-6">
              <input type="email" required placeholder="votre-id@nexus.com" value={userEmail} onChange={e => setUserEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-8 py-5 text-white text-center font-bold outline-none focus:border-cyan-400" />
              <button type="submit" className="w-full bg-cyan-500 text-black font-black py-5 rounded-2xl uppercase text-[11px] tracking-widest shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all">Débloquer le Flux</button>
            </form>
          </div>
        </div>
      )}

      {showAdminLogin && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 p-6 backdrop-blur-2xl">
          <div className="max-w-sm w-full p-12 bg-[#020617] border border-cyan-500/20 rounded-[3rem] text-center shadow-[0_0_100px_rgba(0,212,255,0.1)] relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowAdminLogin(false)} className="absolute top-10 right-10 text-white/20 hover:text-white text-2xl transition-colors">×</button>
            <div className="w-20 h-20 bg-cyan-500/10 border border-cyan-500/20 rounded-3xl flex items-center justify-center mx-auto mb-10">
               <i className="fas fa-key text-cyan-400 text-3xl"></i>
            </div>
            <h3 className="text-lg font-black text-cyan-400 uppercase italic tracking-widest mb-10">Accès Astarté</h3>
            <form onSubmit={(e) => { 
              e.preventDefault(); 
              if(secretCode === 'mazedxn7') {
                setIsAdminMode(true);
                setShowAdminLogin(false);
                setLoginError(false);
                setCurrentAdmin({ id: '0', username: 'Astarté', role: 'SUPER_MASTER', lastLogin: new Date().toISOString() });
              } else {
                setLoginError(true);
              } 
            }} className="space-y-6">
              <input 
                type="password" 
                placeholder="Entrez le code secret..." 
                value={secretCode} 
                onChange={e => setSecretCode(e.target.value)} 
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-8 py-5 text-white text-center font-black outline-none focus:border-cyan-400 transition-all" 
                autoComplete="off" 
                autoFocus
              />
              {loginError && <p className="text-red-500 text-[10px] font-black uppercase animate-pulse">Code Invalide</p>}
              <button type="submit" className="w-full bg-cyan-500 text-black font-black py-5 rounded-2xl uppercase tracking-[0.2em] shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 active:scale-95 transition-all">S'authentifier</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
