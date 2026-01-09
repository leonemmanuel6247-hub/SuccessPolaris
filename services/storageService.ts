import { Category, Document, AdminAccount, VisitorActivity } from '../types.ts';
import { INITIAL_CATEGORIES, INITIAL_DOCUMENTS } from '../constants.ts';

const KEYS = {
  CATEGORIES: 'sp_categories',
  DOCUMENTS: 'sp_documents',
  STATS: 'sp_stats',
  LOGS: 'sp_logs',
  VISITOR_ACTIVITY: 'sp_visitor_spy_logs',
  ACCOUNTS: 'sp_admin_accounts'
};

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn("LocalStorage access denied or unavailable", e);
    return null;
  }
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error("Failed to save to LocalStorage", e);
  }
};

const parseJson = <T>(data: string | null, fallback: T): T => {
  if (!data) return fallback;
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    return fallback;
  }
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
    const data = safeGetItem(KEYS.ACCOUNTS);
    if (!data) {
      const master: AdminAccount[] = [{ id: '1', username: 'Léon', role: 'MASTER', lastLogin: new Date().toLocaleString() }];
      safeSetItem(KEYS.ACCOUNTS, JSON.stringify(master));
      return master;
    }
    return parseJson<AdminAccount[]>(data, []);
  },

  addAccount: (username: string) => {
    const accounts = storageService.getAccounts();
    const newAcc: AdminAccount = {
      id: `acc-${Date.now()}`,
      username,
      role: 'EDITOR',
      lastLogin: 'Jamais'
    };
    safeSetItem(KEYS.ACCOUNTS, JSON.stringify([...accounts, newAcc]));
    storageService.addLog('ACCOUNT', `Nouveau compte créé : ${username}`);
  },

  deleteAccount: (id: string) => {
    const accounts = storageService.getAccounts().filter(a => a.id !== id);
    safeSetItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  // --- CATEGORIES ---
  getCategories: (): Category[] => {
    const data = safeGetItem(KEYS.CATEGORIES);
    if (!data) {
      safeSetItem(KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    return parseJson<Category[]>(data, INITIAL_CATEGORIES);
  },

  saveCategory: (name: string, parentId: string | null): Category => {
    const cats = storageService.getCategories();
    const newCat: Category = { 
      id: `cat-${Date.now()}-${Math.floor(Math.random() * 1000000)}`, 
      name: name.trim(), 
      parentId 
    };
    safeSetItem(KEYS.CATEGORIES, JSON.stringify([...cats, newCat]));
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
    const allCats = storageService.getCategories();
    const toDelete = new Set([id]);
    
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
    
    safeSetItem(KEYS.CATEGORIES, JSON.stringify(filteredCats));
    safeSetItem(KEYS.DOCUMENTS, JSON.stringify(filteredDocs));
    storageService.addLog('DELETE', `Suppression de ${toDelete.size} sections`);
  },

  // --- DOCUMENTS ---
  getDocuments: (): Document[] => {
    const data = safeGetItem(KEYS.DOCUMENTS);
    return parseJson<Document[]>(data, INITIAL_DOCUMENTS);
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
    safeSetItem(KEYS.DOCUMENTS, JSON.stringify([newDoc, ...docs]));
    storageService.addLog('UPLOAD', `Publication Drive : ${docData.title}`);
  },

  incrementDownload: (id: string) => {
    const docs = storageService.getDocuments();
    const docIndex = docs.findIndex(d => d.id === id);
    if (docIndex > -1) {
      docs[docIndex].downloads += 1;
      safeSetItem(KEYS.DOCUMENTS, JSON.stringify(docs));
    }
  },

  // --- LOGS & STATS ---
  logVisit: () => {
    const data = safeGetItem(KEYS.STATS);
    const s = parseJson<{totalVisits: number, totalDownloads: number}>(data, { totalVisits: 0, totalDownloads: 0 });
    safeSetItem(KEYS.STATS, JSON.stringify({ ...s, totalVisits: (s.totalVisits || 0) + 1 }));
  },

  logDownload: (email: string, fileName: string) => {
    const data = safeGetItem(KEYS.VISITOR_ACTIVITY);
    const activities = parseJson<VisitorActivity[]>(data, []);
    const newAct: VisitorActivity = { id: `d-${Date.now()}`, type: 'DOWNLOAD', email, fileName, timestamp: new Date().toLocaleString() };
    safeSetItem(KEYS.VISITOR_ACTIVITY, JSON.stringify([newAct, ...activities].slice(0, 500)));
  },

  getVisitorActivities: (): VisitorActivity[] => {
    return parseJson<VisitorActivity[]>(safeGetItem(KEYS.VISITOR_ACTIVITY), []);
  },

  getLogs: (): any[] => {
    return parseJson<any[]>(safeGetItem(KEYS.LOGS), []);
  },

  addLog: (action: any, details: string) => {
    const logs = storageService.getLogs();
    const newLog = { id: Date.now().toString(), action, details, timestamp: new Date().toLocaleString() };
    safeSetItem(KEYS.LOGS, JSON.stringify([newLog, ...logs].slice(0, 100)));
  }
};