
import { Category, Document, Stats, ActivityLog, AdminAccount, VisitorActivity } from '../types.ts';
import { INITIAL_CATEGORIES, INITIAL_DOCUMENTS } from '../constants.ts';

const KEYS = {
  CATEGORIES: 'sp_categories',
  DOCUMENTS: 'sp_documents',
  STATS: 'sp_stats',
  LOGS: 'sp_logs',
  VISITOR_ACTIVITY: 'sp_visitor_spy_logs',
  ACCOUNTS: 'sp_admin_accounts'
};

export const storageService = {
  optimizeDriveUrl: (url: string): string => {
    if (url.includes('drive.google.com')) {
      const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      const id = idMatch ? idMatch[1] : null;
      if (id) {
        return `https://drive.google.com/uc?export=download&id=${id}`;
      }
    }
    return url;
  },

  // --- ACCOUNTS ---
  getAccounts: (): AdminAccount[] => {
    const data = localStorage.getItem(KEYS.ACCOUNTS);
    if (!data) {
      const master = [{ id: '1', username: 'Léon', role: 'MASTER', lastLogin: new Date().toLocaleString() }];
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(master));
      return master as AdminAccount[];
    }
    return JSON.parse(data);
  },

  addAccount: (username: string) => {
    const accounts = storageService.getAccounts();
    const newAcc: AdminAccount = {
      id: `acc-${Date.now()}`,
      username,
      role: 'EDITOR',
      lastLogin: 'Jamais'
    };
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify([...accounts, newAcc]));
    storageService.addLog('ACCOUNT', `Nouveau compte créé : ${username}`);
  },

  deleteAccount: (id: string) => {
    const accounts = storageService.getAccounts().filter(a => a.id !== id);
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  // --- CATEGORIES ---
  getCategories: (): Category[] => {
    const data = localStorage.getItem(KEYS.CATEGORIES);
    if (!data) {
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    return JSON.parse(data);
  },

  saveCategory: (name: string, parentId: string | null): Category => {
    const cats = storageService.getCategories();
    const newCat = { 
      id: `cat-${Date.now()}-${Math.floor(Math.random() * 1000000)}`, 
      name: name.trim(), 
      parentId 
    };
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify([...cats, newCat]));
    storageService.addLog('SYSTEM', `Node créé : ${name}`);
    return newCat;
  },

  ensureCategoryPath: (path: string): string => {
    const parts = path.split('>').map(p => p.trim()).filter(p => p !== "");
    let currentParentId: string | null = null;
    let lastId = "";

    for (const part of parts) {
      const cats = storageService.getCategories();
      const existing = cats.find(c => 
        c.name.toLowerCase() === part.toLowerCase() && 
        c.parentId === currentParentId
      );

      if (existing) {
        currentParentId = existing.id;
        lastId = existing.id;
      } else {
        const newCat = storageService.saveCategory(part, currentParentId);
        currentParentId = newCat.id;
        lastId = newCat.id;
      }
    }
    return lastId;
  },

  deleteCategory: (id: string) => {
    // Suppression récursive (simplifiée ici en filtrant tout ce qui a cet ID comme parent)
    const allCats = storageService.getCategories();
    const toDelete = new Set([id]);
    
    // On trouve tous les descendants
    let foundNew = true;
    while(foundNew) {
      foundNew = false;
      allCats.forEach(c => {
        if(c.parentId && toDelete.has(c.parentId) && !toDelete.has(c.id)) {
          toDelete.add(c.id);
          foundNew = true;
        }
      });
    }

    const filteredCats = allCats.filter(c => !toDelete.has(c.id));
    const filteredDocs = storageService.getDocuments().filter(d => !toDelete.has(d.categoryId));
    
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(filteredCats));
    localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(filteredDocs));
    storageService.addLog('DELETE', `Suppression de ${toDelete.size} sections`);
  },

  // --- DOCUMENTS ---
  getDocuments: (): Document[] => {
    const data = localStorage.getItem(KEYS.DOCUMENTS);
    return data ? JSON.parse(data) : INITIAL_DOCUMENTS;
  },

  addDocument: async (docData: Omit<Document, 'id' | 'downloads' | 'dateAdded'>) => {
    const docs = storageService.getDocuments();
    const optimizedUrl = storageService.optimizeDriveUrl(docData.fileUrl);
    
    const newDoc: Document = {
      ...docData,
      fileUrl: optimizedUrl,
      id: `doc-${Date.now()}`,
      downloads: 0,
      dateAdded: new Date().toISOString()
    };
    localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify([newDoc, ...docs]));
    storageService.addLog('UPLOAD', `Publication Drive : ${docData.title}`);
  },

  incrementDownload: (id: string) => {
    const docs = storageService.getDocuments();
    const docIndex = docs.findIndex(d => d.id === id);
    if (docIndex > -1) {
      docs[docIndex].downloads += 1;
      localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(docs));
    }
  },

  // --- LOGS & STATS ---
  logVisit: () => {
    const data = localStorage.getItem(KEYS.STATS);
    const s = data ? JSON.parse(data) : { totalVisits: 0, totalDownloads: 0 };
    localStorage.setItem(KEYS.STATS, JSON.stringify({ ...s, totalVisits: (s.totalVisits || 0) + 1 }));
  },

  logDownload: (email: string, fileName: string) => {
    const activities = JSON.parse(localStorage.getItem(KEYS.VISITOR_ACTIVITY) || '[]');
    const newAct = { id: `d-${Date.now()}`, type: 'DOWNLOAD', email, fileName, timestamp: new Date().toLocaleString() };
    localStorage.setItem(KEYS.VISITOR_ACTIVITY, JSON.stringify([newAct, ...activities].slice(0, 500)));
  },

  getVisitorActivities: () => JSON.parse(localStorage.getItem(KEYS.VISITOR_ACTIVITY) || '[]'),
  getLogs: () => JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]'),
  addLog: (action: any, details: string) => {
    const logs = storageService.getLogs();
    const newLog = { id: Date.now().toString(), action, details, timestamp: new Date().toLocaleString() };
    localStorage.setItem(KEYS.LOGS, JSON.stringify([newLog, ...logs].slice(0, 100)));
  }
};
