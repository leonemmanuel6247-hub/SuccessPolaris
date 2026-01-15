
import { Category, Document, AdminAccount, VisitorActivity } from '../types.ts';
import { URL_COMPTEUR, URL_LISTE_DOCUMENTS, APPS_SCRIPT_WEBHOOK_URL } from '../constants.ts';

const KEYS = {
  CATEGORIES: 'sp_categories',
  DOCUMENTS: 'sp_documents',
  STATS: 'sp_stats',
  LOGS: 'sp_logs',
  VISITOR_ACTIVITY: 'sp_visitor_spy_logs',
  ACCOUNTS: 'sp_admin_accounts',
  USER_EMAIL: 'sp_user_identity',
  BANNED_EMAILS: 'sp_banned_list',
  USER_XP: 'sp_user_xp',
  USER_HISTORY: 'sp_user_doc_history',
  SHEET_ROW_COUNT: 'sp_document_total_count'
};

const parseCSV = (csv: string) => {
  const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length <= 1) return [];
  
  return lines.slice(1).map((line, index) => {
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
    return {
      title: values[0] || '',
      url: values[1] || '',
      category: (values[2] || '').toLowerCase(),
      subCategory: (values[3] || '').toLowerCase(),
      date: values[4] || new Date().toISOString(),
      id: `doc-${index}-${Date.now()}`
    };
  });
};

export const storageService = {
  // FONCTION A : Isolation du Compteur (Version Robuste)
  chargerCompteur: async (): Promise<number> => {
    try {
      const response = await fetch(`${URL_COMPTEUR}?t=${Date.now()}`);
      if (!response.ok) throw new Error('Réseau instable');
      
      const textData = await response.text();
      let finalCount = 0;

      try {
        // Tentative 1 : Le script renvoie du JSON { "total": 123 }
        const jsonData = JSON.parse(textData);
        finalCount = parseInt(jsonData.total || jsonData.count || 0);
      } catch (e) {
        // Tentative 2 : Le script renvoie du texte brut "123"
        finalCount = parseInt(textData.trim()) || 0;
      }
      
      localStorage.setItem(KEYS.SHEET_ROW_COUNT, finalCount.toString());
      return finalCount;
    } catch (e) {
      console.warn("Récupération compteur via cache local...");
      return parseInt(localStorage.getItem(KEYS.SHEET_ROW_COUNT) || '0');
    }
  },

  fetchFromSheets: async (): Promise<{ categories: Category[], documents: Document[] }> => {
    try {
      const response = await fetch(`${URL_LISTE_DOCUMENTS}&t=${Date.now()}`);
      if (!response.ok) throw new Error('Source inaccessible');
      
      const csvData = await response.text();
      const rows = parseCSV(csvData);

      const categories: Category[] = [];
      const documents: Document[] = [];
      const categoryMap = new Map<string, string>();

      rows.forEach(row => {
        if (!row.title || !row.url || !row.category) return;

        const mainCatLabel = row.category.toUpperCase();
        const subCatLabel = row.subCategory ? row.subCategory.toUpperCase() : null;

        if (!categoryMap.has(mainCatLabel)) {
          const catId = `cat-${mainCatLabel.replace(/\s+/g, '-')}`;
          categoryMap.set(mainCatLabel, catId);
          categories.push({ id: catId, name: mainCatLabel, parentId: null, icon: '📁' });
        }

        let finalCatId = categoryMap.get(mainCatLabel)!;

        if (subCatLabel) {
          const subKey = `${mainCatLabel}_${subCatLabel}`;
          if (!categoryMap.has(subKey)) {
            const subId = `sub-${subKey.replace(/\s+/g, '-')}`;
            categoryMap.set(subKey, subId);
            categories.push({ id: subId, name: subCatLabel, parentId: finalCatId, icon: '📖' });
          }
          finalCatId = categoryMap.get(subKey)!;
        }

        documents.push({
          id: row.id,
          title: row.title,
          description: `Archive ${mainCatLabel} > ${subCatLabel || 'Général'}`,
          categoryId: finalCatId,
          fileUrl: row.url, 
          fileType: 'pdf',
          tags: [mainCatLabel],
          downloads: 0,
          dateAdded: row.date,
          size: 'PDF'
        });
      });

      localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(documents));
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
      
      return { categories, documents };
    } catch (error) {
      return { 
        categories: JSON.parse(localStorage.getItem(KEYS.CATEGORIES) || '[]'), 
        documents: JSON.parse(localStorage.getItem(KEYS.DOCUMENTS) || '[]')
      };
    }
  },

  getDrivePreviewUrl: (url: string): string => {
    if (!url || !url.includes('drive.google.com')) return url;
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    return idMatch ? `https://drive.google.com/file/d/${idMatch[1]}/preview` : url;
  },

  getUserXP: (): number => parseInt(localStorage.getItem(KEYS.USER_XP) || '0'),
  addXP: (amount: number): number => {
    const newXP = storageService.getUserXP() + amount;
    localStorage.setItem(KEYS.USER_XP, newXP.toString());
    return newXP;
  },
  getGrade: (xp: number): string => {
    if (xp < 200) return 'Apprenti';
    if (xp < 800) return 'Initié';
    if (xp < 2000) return 'Expert';
    if (xp < 5000) return 'Maître';
    return 'Légende Némésis';
  },

  saveUserEmail: (email: string) => localStorage.setItem(KEYS.USER_EMAIL, email),
  getUserEmail: () => localStorage.getItem(KEYS.USER_EMAIL),

  getBannedEmails: (): string[] => JSON.parse(localStorage.getItem(KEYS.BANNED_EMAILS) || '[]'),
  isEmailBanned: (email: string): boolean => storageService.getBannedEmails().includes(email),

  banEmail: (email: string): void => {
    const banned = storageService.getBannedEmails();
    if (!banned.includes(email)) {
      localStorage.setItem(KEYS.BANNED_EMAILS, JSON.stringify([...banned, email]));
    }
  },

  unbanEmail: (email: string): void => {
    const banned = storageService.getBannedEmails();
    const filtered = banned.filter(e => e !== email);
    localStorage.setItem(KEYS.BANNED_EMAILS, JSON.stringify(filtered));
  },

  sendToCloudLog: async (email: string, fileName: string, action: string = 'Téléchargement') => {
    const payload = { email, action, fichier: fileName, timestamp: new Date().toLocaleString('fr-FR') };
    try {
      fetch(APPS_SCRIPT_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {}
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

  addAccount: (username: string, role: 'SUPER_MASTER' | 'MASTER' | 'EDITOR'): void => {
    const accounts = storageService.getAccounts();
    const newAccount: AdminAccount = {
      id: Date.now().toString(),
      username,
      role,
      lastLogin: new Date().toISOString()
    };
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify([...accounts, newAccount]));
  },

  removeAccount: (id: string): void => {
    const accounts = storageService.getAccounts();
    const filtered = accounts.filter(a => a.id !== id);
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(filtered));
  },

  getVisitorActivities: () => JSON.parse(localStorage.getItem(KEYS.VISITOR_ACTIVITY) || '[]'),
  
  getAdvancedStats: () => {
    const activities: VisitorActivity[] = JSON.parse(localStorage.getItem(KEYS.VISITOR_ACTIVITY) || '[]');
    const docs: Document[] = JSON.parse(localStorage.getItem(KEYS.DOCUMENTS) || '[]');
    const topDocs = [...docs].sort((a, b) => b.downloads - a.downloads).slice(0, 5);
    const uniqueEmails = new Set(activities.filter(a => a.email).map(a => a.email));
    
    const dailyStats: { [key: string]: number } = {};
    const now = new Date();
    for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dailyStats[d.toLocaleDateString('fr-FR')] = 0;
    }
    
    activities.forEach(act => {
        const dateStr = act.timestamp.split(' ')[0];
        if (dailyStats.hasOwnProperty(dateStr)) dailyStats[dateStr]++;
    });

    const chartData = Object.keys(dailyStats).map(date => ({ date, downloads: dailyStats[date] })).reverse();
    return { topDocs, totalUniqueUsers: uniqueEmails.size, chartData };
  },

  getLogs: () => JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]'),
  addLog: (action: any, details: string) => {
    const logs = JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
    const newLog = { id: Date.now().toString(), action, details, timestamp: new Date().toLocaleString() };
    localStorage.setItem(KEYS.LOGS, JSON.stringify([newLog, ...logs].slice(0, 100)));
  },

  logVisit: (): void => {
    const activities = JSON.parse(localStorage.getItem(KEYS.VISITOR_ACTIVITY) || '[]');
    const newAct = { id: `v-${Date.now()}`, type: 'VISIT', timestamp: new Date().toLocaleString() };
    localStorage.setItem(KEYS.VISITOR_ACTIVITY, JSON.stringify([newAct, ...activities].slice(0, 500)));
  },

  logDownload: (email: string, fileName: string, docId?: string) => {
    const activities = JSON.parse(localStorage.getItem(KEYS.VISITOR_ACTIVITY) || '[]');
    const newAct = { id: `d-${Date.now()}`, type: 'DOWNLOAD', email, fileName, timestamp: new Date().toLocaleString() };
    localStorage.setItem(KEYS.VISITOR_ACTIVITY, JSON.stringify([newAct, ...activities].slice(0, 500)));
    
    if (docId) {
      const history = JSON.parse(localStorage.getItem(KEYS.USER_HISTORY) || '[]');
      if (!history.includes(docId)) {
        localStorage.setItem(KEYS.USER_HISTORY, JSON.stringify([...history, docId]));
      }
    }
  },

  getUserHistory: (): string[] => JSON.parse(localStorage.getItem(KEYS.USER_HISTORY) || '[]'),

  incrementDownload: (id: string) => {
    const docs = JSON.parse(localStorage.getItem(KEYS.DOCUMENTS) || '[]');
    const idx = docs.findIndex((d: any) => d.id === id);
    if (idx > -1) {
      docs[idx].downloads += 1;
      localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(docs));
    }
  }
};
