
import { Category, Document, AdminAccount, VisitorActivity } from '../types.ts';
import { GOOGLE_SHEET_ID, APPS_SCRIPT_WEBHOOK_URL } from '../constants.ts';

const KEYS = {
  CATEGORIES: 'sp_categories',
  DOCUMENTS: 'sp_documents',
  STATS: 'sp_stats',
  LOGS: 'sp_logs',
  VISITOR_ACTIVITY: 'sp_visitor_spy_logs',
  ACCOUNTS: 'sp_admin_accounts',
  LAST_SYNC: 'sp_last_sync',
  USER_EMAIL: 'sp_user_identity',
  BANNED_EMAILS: 'sp_banned_list'
};

const parseCSV = (csv: string) => {
  const lines = csv.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return [];
  
  return lines.slice(1).map((line, index) => {
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
    return {
      title: values[0] || '',
      url: values[1] || '',
      category: values[2] || '',
      subCategory: values[3] || '',
      id: `doc-${index}`
    };
  });
};

export const storageService = {
  fetchFromSheets: async (): Promise<{ categories: Category[], documents: Document[] }> => {
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=0`;
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error('Matrice Polaris injoignable');
      
      const csvData = await response.text();
      const rawRows = parseCSV(csvData);

      const categories: Category[] = [];
      const documents: Document[] = [];
      const categoryMap = new Map<string, string>();

      rawRows.forEach(row => {
        if (!row.title || !row.url || !row.category) return;

        const mainCatName = row.category.trim().toUpperCase();
        const subCatName = row.subCategory ? row.subCategory.trim().toUpperCase() : null;

        if (!categoryMap.has(mainCatName)) {
          const catId = `cat-${mainCatName.replace(/\s+/g, '-')}`;
          categoryMap.set(mainCatName, catId);
          categories.push({ id: catId, name: mainCatName, parentId: null, icon: '🪐' });
        }

        let currentParentId = categoryMap.get(mainCatName)!;

        if (subCatName) {
          const subKey = `${mainCatName}_${subCatName}`;
          if (!categoryMap.has(subKey)) {
            const subId = `sub-${subKey.replace(/\s+/g, '-')}`;
            categoryMap.set(subKey, subId);
            categories.push({ id: subId, name: subCatName, parentId: currentParentId, icon: '📚' });
          }
          currentParentId = categoryMap.get(subKey)!;
        }

        documents.push({
          id: row.id,
          title: row.title,
          description: `Archive classée en ${mainCatName}${subCatName ? ' &gt; ' + subCatName : ''}`,
          categoryId: currentParentId,
          fileUrl: storageService.optimizeDriveUrl(row.url),
          fileType: 'pdf',
          tags: [mainCatName],
          downloads: 0,
          dateAdded: new Date().toISOString(),
          size: 'Auto'
        });
      });

      localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(documents));
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
      localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
      
      return { categories, documents };
    } catch (error) {
      console.error("ERREUR MATRICE :", error);
      return { 
        categories: JSON.parse(localStorage.getItem(KEYS.CATEGORIES) || '[]'), 
        documents: JSON.parse(localStorage.getItem(KEYS.DOCUMENTS) || '[]') 
      };
    }
  },

  optimizeDriveUrl: (url: string): string => {
    if (!url || url === '' || url === 'undefined') return '';
    if (url.includes('drive.google.com')) {
      const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      const id = idMatch ? idMatch[1] : null;
      if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
    }
    return url;
  },

  saveUserEmail: (email: string) => localStorage.setItem(KEYS.USER_EMAIL, email),
  getUserEmail: () => localStorage.getItem(KEYS.USER_EMAIL),

  banEmail: (email: string) => {
    const list = storageService.getBannedEmails();
    if (!list.includes(email)) {
      localStorage.setItem(KEYS.BANNED_EMAILS, JSON.stringify([...list, email]));
      storageService.addLog('BAN', `Bannissement de ${email}`);
    }
  },

  unbanEmail: (email: string) => {
    const list = storageService.getBannedEmails().filter(e => e !== email);
    localStorage.setItem(KEYS.BANNED_EMAILS, JSON.stringify(list));
    storageService.addLog('BAN', `Réactivation de ${email}`);
  },

  getBannedEmails: (): string[] => JSON.parse(localStorage.getItem(KEYS.BANNED_EMAILS) || '[]'),
  isEmailBanned: (email: string): boolean => storageService.getBannedEmails().includes(email),

  sendToCloudLog: async (email: string, fileName: string, action: string = 'Téléchargement') => {
    const payload = { email, action, fichier: fileName, timestamp: new Date().toLocaleString('fr-FR') };
    try {
      fetch(APPS_SCRIPT_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn("Tracking cloud off");
    }
  },

  getAccounts: (): AdminAccount[] => {
    const data = localStorage.getItem(KEYS.ACCOUNTS);
    if (!data) {
      const defaults: AdminAccount[] = [
        { id: '0', username: 'Astarté', role: 'SUPER_MASTER', lastLogin: '' },
        { id: '1', username: 'Léon', role: 'MASTER', lastLogin: '' }
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
