
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
    const data = await storageService.fetchFromSheets();
    setCategories(data.categories);
    setDocuments(data.documents);
    setTimeout(() => setIsSyncing(false), 1000);
  };

  useEffect(() => {
    syncData();
    storageService.logVisit(); 
    const savedEmail = storageService.getUserEmail();
    if (savedEmail) setUserEmail(savedEmail);
  }, []);

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
      return documents.filter(d => d.title.toLowerCase().includes(q));
    }
    if (navigationPath.length === 0) return [];
    const lastCatId = navigationPath[navigationPath.length - 1].id;
    return documents.filter(doc => doc.categoryId === lastCatId && doc.fileUrl !== '');
  }, [documents, navigationPath, searchQuery]);

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
    storageService.logDownload(email, doc.title);
    storageService.incrementDownload(doc.id);
    storageService.sendToCloudLog(email, doc.title, 'Téléchargement');
    window.open(doc.fileUrl, '_blank');
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
      storageService.addLog('AUTH', `Éveil système pour ${user.username}`);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 3000);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 font-['Inter'] relative overflow-x-hidden pb-24">
      <AuroraBackground />
      <header className="container mx-auto px-6 py-12 flex flex-col items-center gap-12 relative z-50">
        <div className="flex flex-col items-center gap-6 cursor-pointer group" onClick={() => navigateTo(null)}>
          <div className="w-20 md:w-24 h-20 md:h-24 bg-slate-900/90 border border-white/10 rounded-[2rem] flex items-center justify-center relative shadow-neon group-hover:scale-110 transition-all duration-700">
             <i className="fas fa-star text-cyan-400 text-3xl group-hover:rotate-[360deg] transition-all duration-1000"></i>
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-none drop-shadow-neon">
              Success<span className="text-cyan-400">Polaris</span>
            </h1>
            <p className="text-[10px] uppercase font-black mt-4 opacity-30 tracking-[1em] text-cyan-400">Majestueuse Voie du Savoir</p>
          </div>
        </div>
        {!isAdminMode && (
          <div className="w-full max-w-lg px-2">
            <input type="text" placeholder="Explorer les archives..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-950/70 border border-white/10 rounded-[2.5rem] px-10 py-6 text-[14px] outline-none focus:border-cyan-400/60 font-black text-white" />
          </div>
        )}
      </header>

      <main className="container mx-auto px-6 lg:px-24 relative z-10">
        {isAdminMode ? (
          <AdminDashboard categories={categories} documents={documents} currentAdmin={currentAdmin} onRefresh={syncData} />
        ) : (
          <div className="space-y-16">
            <nav className="flex items-center gap-4 overflow-x-auto no-scrollbar py-6 px-10 bg-slate-950/40 rounded-[3rem] border border-white/5 backdrop-blur-3xl">
              <button onClick={() => navigateTo(null)} className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${navigationPath.length === 0 ? 'bg-cyan-500 text-slate-950' : 'text-white/30 hover:text-white'}`}>Racine Polaris</button>
              {navigationPath.map((cat, i) => (
                <button key={cat.id} onClick={() => goBackTo(i)} className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${i === navigationPath.length - 1 ? 'bg-white text-slate-950' : 'text-white/30'}`}>{cat.name}</button>
              ))}
            </nav>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {!searchQuery && currentLevelCategories.length > 0 && (
                <div className="lg:col-span-4 space-y-6">
                  {currentLevelCategories.map(cat => (
                    <button key={cat.id} onClick={() => navigateTo(cat)} className="w-full flex items-center justify-between p-8 bg-slate-900/30 border border-white/5 rounded-[2.5rem] group hover:bg-cyan-500/5 transition-all">
                      <span className="text-[14px] font-black text-white/80 group-hover:text-cyan-400 uppercase">{cat.name}</span>
                      <i className="fas fa-arrow-right text-white/5 group-hover:text-cyan-400 group-hover:translate-x-2 transition-all"></i>
                    </button>
                  ))}
                </div>
              )}
              <div className={`${(searchQuery || currentLevelCategories.length === 0) ? 'lg:col-span-12' : 'lg:col-span-8'} grid grid-cols-1 sm:grid-cols-2 gap-8`}>
                {currentLevelDocuments.map(doc => <DocumentCard key={doc.id} doc={doc} onDownload={initiateDownload} />)}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 w-full py-4 px-12 bg-slate-950/90 backdrop-blur-3xl border-t border-white/5 flex items-center justify-between z-[1000]">
        <p className="text-[8px] text-white/30 font-black uppercase tracking-[0.4em]">SuccessPolaris — Palais v1.3.0</p>
        <p onClick={() => setShowAdminLogin(true)} className="text-[8px] text-white/20 font-black uppercase tracking-widest cursor-pointer hover:text-cyan-400 transition-all">MAÎTRESSE D'OEUVRE : ASTARTÉ</p>
      </footer>

      {showEmailModal && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-slate-950/98 backdrop-blur-3xl p-6">
          <div className="max-w-[420px] w-full p-12 bg-slate-900/60 border border-white/15 rounded-[4rem] relative">
            <h3 className="text-center text-sm font-black text-white uppercase italic tracking-[0.4em] mb-10">Accès Polaris</h3>
            <form onSubmit={handleIdentityConfirm} className="space-y-8">
              <input type="email" required placeholder="votre@gmail.com" value={userEmail} onChange={e => setUserEmail(e.target.value)} className="w-full bg-black/70 border border-white/10 rounded-[1.8rem] px-8 py-6 text-white text-center font-black outline-none focus:border-cyan-400" />
              <button type="submit" className="w-full bg-cyan-500 hover:bg-white text-slate-950 font-black py-7 rounded-[1.8rem] uppercase text-[11px] tracking-[0.5em] transition-all">Valider l'Accès</button>
            </form>
          </div>
        </div>
      )}

      {showAdminLogin && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-6">
          <div className="max-w-[380px] w-full p-12 bg-slate-900/50 border border-white/15 rounded-[4rem] relative shadow-3xl">
            <button onClick={() => setShowAdminLogin(false)} className="absolute top-10 right-10 text-white/20 hover:text-white text-2xl">×</button>
            <form onSubmit={handleAdminLogin} className="space-y-8 text-center">
              <h3 className="text-white font-black uppercase tracking-[0.4em] mb-10 italic">Console Nemesis</h3>
              <input type="text" placeholder="Identité" value={adminUsername} onChange={e => setAdminUsername(e.target.value)} className="w-full bg-black/80 border border-white/10 rounded-[1.8rem] px-8 py-6 text-white text-center font-black outline-none focus:border-cyan-400" />
              <input type="password" placeholder="Clé Stellaire" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full bg-black/80 border border-white/10 rounded-[1.8rem] px-8 py-6 text-white text-center font-black outline-none focus:border-cyan-400" />
              {loginError && <p className="text-red-500 text-[9px] font-black uppercase">Signature Invalide</p>}
              <button type="submit" className="w-full bg-white text-slate-950 font-black py-7 rounded-[1.8rem] uppercase tracking-[0.4em] hover:bg-cyan-500 transition-all">Éveil Système</button>
            </form>
          </div>
        </div>
      )}

      {isSyncing && (
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-950/98 backdrop-blur-3xl">
           <div className="w-20 h-20 border-2 border-t-cyan-500 rounded-full animate-spin"></div>
           <p className="text-cyan-400 text-[9px] font-black uppercase tracking-[1.5em] mt-10 animate-pulse">Chargement Polaris...</p>
        </div>
      )}
    </div>
  );
};

export default App;
