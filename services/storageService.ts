
import { Category, Document, AdminAccount, VisitorActivity, ActivityLog } from '../types.ts';
import { INITIAL_CATEGORIES, INITIAL_DOCUMENTS, GOOGLE_SHEET_ID } from '../constants.ts';

const KEYS = {
  CATEGORIES: 'sp_categories',
  DOCUMENTS: 'sp_documents',
  STATS: 'sp_stats',
  LOGS: 'sp_logs',
  VISITOR_ACTIVITY: 'sp_visitor_spy_logs',
  ACCOUNTS: 'sp_admin_accounts',
  LAST_SYNC: 'sp_last_sync'
};

const parseCSV = (csv: string) => {
  const lines = csv.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/"/g, ''));
    const obj: any = {};
    headers.forEach((header, i) => {
      obj[header] = values[i];
    });
    return obj;
  });
};

export const storageService = {
  // --- GOOGLE SHEETS SYNC ---
  fetchFromSheets: async (): Promise<{ categories: Category[], documents: Document[] }> => {
    try {
      // On récupère les deux onglets (Documents par défaut, on peut spécifier gid pour les autres)
      // Note: Pour faire simple, on utilise un seul onglet "Documents" pour l'instant 
      // ou on peut faire deux appels fetch si l'utilisateur a plusieurs onglets.
      const docResponse = await fetch(`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Documents`);
      const catResponse = await fetch(`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Categories`);
      
      const docCsv = await docResponse.text();
      const catCsv = await catResponse.text();

      const documents = parseCSV(docCsv).filter(d => d.id).map(d => ({
        ...d,
        downloads: parseInt(d.downloads) || 0,
        tags: d.tags ? d.tags.split('|') : [],
        fileUrl: storageService.optimizeDriveUrl(d.fileUrl)
      }));

      const categories = parseCSV(catCsv).filter(c => c.id).map(c => ({
        ...c,
        parentId: c.parentId === "" || c.parentId === "null" ? null : c.parentId
      }));

      // Sauvegarde locale pour le mode offline / cache
      localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(documents));
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
      localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
      
      return { categories, documents };
    } catch (error) {
      console.error("Erreur de synchronisation Google Sheets:", error);
      return { 
        categories: JSON.parse(localStorage.getItem(KEYS.CATEGORIES) || '[]'), 
        documents: JSON.parse(localStorage.getItem(KEYS.DOCUMENTS) || '[]') 
      };
    }
  },

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
      const master: AdminAccount[] = [{ id: '1', username: 'Léon', role: 'MASTER', lastLogin: new Date().toLocaleString() }];
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(master));
      return master;
    }
    return JSON.parse(data);
  },

  // --- GETTERS ---
  getCategories: (): Category[] => {
    const data = localStorage.getItem(KEYS.CATEGORIES);
    return data ? JSON.parse(data) : INITIAL_CATEGORIES;
  },

  getDocuments: (): Document[] => {
    const data = localStorage.getItem(KEYS.DOCUMENTS);
    return data ? JSON.parse(data) : INITIAL_DOCUMENTS;
  },

  getLastSync: (): string => {
    return localStorage.getItem(KEYS.LAST_SYNC) || 'Jamais';
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
    const s = data ? JSON.parse(data) : { totalVisits: 0 };
    localStorage.setItem(KEYS.STATS, JSON.stringify({ ...s, totalVisits: (s.totalVisits || 0) + 1 }));
  },

  logDownload: (email: string, fileName: string) => {
    const data = localStorage.getItem(KEYS.VISITOR_ACTIVITY);
    const activities = data ? JSON.parse(data) : [];
    const newAct: VisitorActivity = { id: `d-${Date.now()}`, type: 'DOWNLOAD', email, fileName, timestamp: new Date().toLocaleString() };
    localStorage.setItem(KEYS.VISITOR_ACTIVITY, JSON.stringify([newAct, ...activities].slice(0, 500)));
  },

  getVisitorActivities: (): VisitorActivity[] => {
    const data = localStorage.getItem(KEYS.VISITOR_ACTIVITY);
    return data ? JSON.parse(data) : [];
  },

  // Fix: Added missing getLogs method to storageService
  getLogs: (): ActivityLog[] => {
    const data = localStorage.getItem(KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  },

  addLog: (action: any, details: string) => {
    const data = localStorage.getItem(KEYS.LOGS);
    const logs = data ? JSON.parse(data) : [];
    const newLog = { id: Date.now().toString(), action, details, timestamp: new Date().toLocaleString() };
    localStorage.setItem(KEYS.LOGS, JSON.stringify([newLog, ...logs].slice(0, 100)));
  }
};
