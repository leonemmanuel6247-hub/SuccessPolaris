
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
  if (lines.length === 0) return [];
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
  fetchFromSheets: async (): Promise<{ categories: Category[], documents: Document[] }> => {
    try {
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
        parentId: c.parentId === "" || c.parentId === "null" || !c.parentId ? null : c.parentId
      }));

      localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(documents));
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
      localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
      
      return { categories, documents };
    } catch (error) {
      console.error("Erreur Sync:", error);
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
      if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
    }
    return url;
  },

  getAccounts: (): AdminAccount[] => {
    const data = localStorage.getItem(KEYS.ACCOUNTS);
    if (!data) {
      const defaults: AdminAccount[] = [
        { id: '1', username: 'Léon', role: 'MASTER', lastLogin: '' },
        { id: '0', username: 'Astarté', role: 'SUPER_MASTER', lastLogin: '' }
      ];
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(data);
  },

  addAccount: (username: string, role: 'MASTER' | 'EDITOR') => {
    const accounts = storageService.getAccounts();
    const newAcc: AdminAccount = {
      id: Date.now().toString(),
      username,
      role,
      lastLogin: 'Jamais'
    };
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify([...accounts, newAcc]));
  },

  removeAccount: (id: string) => {
    const accounts = storageService.getAccounts().filter(a => a.id !== id);
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  getCategories: () => JSON.parse(localStorage.getItem(KEYS.CATEGORIES) || '[]'),
  getDocuments: () => JSON.parse(localStorage.getItem(KEYS.DOCUMENTS) || '[]'),
  getLastSync: () => localStorage.getItem(KEYS.LAST_SYNC) || 'Jamais',
  
  incrementDownload: (id: string) => {
    const docs = storageService.getDocuments();
    const idx = docs.findIndex(d => d.id === id);
    if (idx > -1) {
      docs[idx].downloads += 1;
      localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(docs));
    }
  },

  logVisit: () => {
    const data = JSON.parse(localStorage.getItem(KEYS.STATS) || '{"totalVisits":0}');
    localStorage.setItem(KEYS.STATS, JSON.stringify({ ...data, totalVisits: data.totalVisits + 1 }));
  },

  logDownload: (email: string, fileName: string) => {
    const activities = JSON.parse(localStorage.getItem(KEYS.VISITOR_ACTIVITY) || '[]');
    const newAct = { id: `d-${Date.now()}`, type: 'DOWNLOAD', email, fileName, timestamp: new Date().toLocaleString() };
    localStorage.setItem(KEYS.VISITOR_ACTIVITY, JSON.stringify([newAct, ...activities].slice(0, 500)));
  },

  getVisitorActivities: () => JSON.parse(localStorage.getItem(KEYS.VISITOR_ACTIVITY) || '[]'),
  getLogs: () => JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]'),
  addLog: (action: any, details: string) => {
    const logs = JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
    const newLog = { id: Date.now().toString(), action, details, timestamp: new Date().toLocaleString() };
    localStorage.setItem(KEYS.LOGS, JSON.stringify([newLog, ...logs].slice(0, 100)));
  }
};
