
import { Category, Document, Stats, ActivityLog, VisitorActivity, UserSession } from '../types';
import { INITIAL_CATEGORIES, INITIAL_DOCUMENTS } from '../constants';

const KEYS = {
  CATEGORIES: 'sp_categories',
  DOCUMENTS: 'sp_documents',
  STATS: 'sp_stats',
  LOGS: 'sp_logs',
  USER: 'sp_user_session',
  LAST_DOC_COUNT: 'sp_last_count',
  ACTIVITY: 'sp_visitor_activity'
};

// Initialisation de IndexedDB pour les fichiers volumineux
const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open('SuccessPolarisDB', 1);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains('files')) {
      request.result.createObjectStore('files');
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

export const storageService = {
  // Gestion des fichiers binaires (IndexedDB)
  saveFileBinary: async (id: string, file: File): Promise<void> => {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').put(file, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  getFileBinary: async (id: string): Promise<Blob | null> => {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readonly');
      const request = tx.objectStore('files').get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  deleteFileBinary: async (id: string): Promise<void> => {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  // Categories
  getCategories: (): Category[] => {
    const data = localStorage.getItem(KEYS.CATEGORIES);
    return data ? JSON.parse(data) : INITIAL_CATEGORIES;
  },
  saveCategory: (name: string, parentId: string | null) => {
    const cats = storageService.getCategories();
    const newCat = { id: `cat-${Date.now()}`, name, parentId };
    storageService.saveCategories([...cats, newCat]);
    storageService.addLog('Architecture', `Nouvelle catégorie créée : ${name}`);
    return newCat;
  },
  saveCategories: (cats: Category[]) => {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(cats));
  },
  deleteCategory: (id: string) => {
    const cats = storageService.getCategories().filter(c => c.id !== id);
    const docs = storageService.getDocuments().filter(d => d.categoryId === id);
    
    docs.forEach(doc => {
      if (doc.isLocal) storageService.deleteFileBinary(doc.githubUrl);
    });

    const remainingDocs = storageService.getDocuments().filter(d => d.categoryId !== id);
    storageService.saveCategories(cats);
    storageService.saveDocuments(remainingDocs);
    storageService.addLog('Architecture', `Suppression de l'entrée d'index ${id}`);
  },

  // Documents
  getDocuments: (): Document[] => {
    const data = localStorage.getItem(KEYS.DOCUMENTS);
    return data ? JSON.parse(data) : INITIAL_DOCUMENTS;
  },
  saveDocuments: (docs: Document[]) => {
    localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(docs));
  },
  addDocument: async (docData: Omit<Document, 'id' | 'downloads' | 'dateAdded'>, file?: File) => {
    const docs = storageService.getDocuments();
    const id = `doc-${Date.now()}`;
    let githubUrl = docData.githubUrl;
    let isLocal = false;

    if (file) {
      const fileId = `file-${Date.now()}`;
      await storageService.saveFileBinary(fileId, file);
      githubUrl = fileId;
      isLocal = true;
    }

    const newDoc: Document = {
      ...docData,
      id,
      githubUrl,
      isLocal,
      downloads: 0,
      dateAdded: new Date().toISOString()
    };
    storageService.saveDocuments([newDoc, ...docs]);
    storageService.addLog('Publication', `Indexation du document : ${docData.title}`);
  },

  incrementDownload: (id: string) => {
    const docs = storageService.getDocuments();
    const docIndex = docs.findIndex(d => d.id === id);
    if (docIndex > -1) {
      docs[docIndex].downloads += 1;
      storageService.saveDocuments(docs);
      storageService.updateStats(0, 1);
      storageService.addLog('Transfert', `Téléchargement validé pour : ${docs[docIndex].title}`);
    }
  },

  // Visitor Tracking
  trackMovement: (path: string) => {
    const activities = storageService.getVisitorActivities();
    const newAct = {
      id: Math.random().toString(36).substr(2, 9),
      path,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(KEYS.ACTIVITY, JSON.stringify([newAct, ...activities].slice(0, 20)));
  },
  getVisitorActivities: (): VisitorActivity[] => {
    const data = localStorage.getItem(KEYS.ACTIVITY);
    return data ? JSON.parse(data) : [];
  },

  // Stats & Logs
  getStats: (): Stats => {
    const data = localStorage.getItem(KEYS.STATS);
    return data ? JSON.parse(data) : { totalVisits: 0, totalDownloads: 0 };
  },
  updateStats: (v: number, d: number) => {
    const s = storageService.getStats();
    localStorage.setItem(KEYS.STATS, JSON.stringify({ totalVisits: s.totalVisits + v, totalDownloads: s.totalDownloads + d }));
  },
  getLogs: (): ActivityLog[] => {
    const data = localStorage.getItem(KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  },
  addLog: (action: string, details: string) => {
    const logs = storageService.getLogs();
    const newLog = { id: Date.now().toString(), action, details, timestamp: new Date().toLocaleString() };
    localStorage.setItem(KEYS.LOGS, JSON.stringify([newLog, ...logs].slice(0, 50)));
  },

  // User Session Management
  getUser: (): UserSession | null => {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  setUser: (email: string, country: string) => {
    const session: UserSession = { email, country, isValidated: true };
    localStorage.setItem(KEYS.USER, JSON.stringify(session));
    storageService.addLog('Utilisateur', `Nouveau profil validé : ${email} (${country})`);
  },
  getNewPostFlag: () => {
    const count = storageService.getDocuments().length;
    const lastCount = Number(localStorage.getItem(KEYS.LAST_DOC_COUNT) || count);
    return count > lastCount;
  },
  acknowledgeNewPosts: () => {
    localStorage.setItem(KEYS.LAST_DOC_COUNT, storageService.getDocuments().length.toString());
  }
};
