
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
  SHEET_ROW_COUNT: 'sp_document_total_count',
  IA_MEMORY: 'sp_ia_core_memory',
  IA_STATS: 'sp_ia_performance_logs',
  IA_HEALTH: 'sp_ia_provider_health'
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
  chargerCompteur: async (): Promise<number> => {
    try {
      const response = await fetch(`${URL_COMPTEUR}?t=${Date.now()}`);
      if (!response.ok) throw new Error('Réseau instable');
      const textData = await response.text();
      let finalCount = 0;
      try {
        const jsonData = JSON.parse(textData);
        finalCount = parseInt(jsonData.total || jsonData.count || 0);
      } catch (e) {
        finalCount = parseInt(textData.trim()) || 0;
      }
      localStorage.setItem(KEYS.SHEET_ROW_COUNT, finalCount.toString());
      return finalCount;
    } catch (e) {
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

  getIAMemory: (): string => localStorage.getItem(KEYS.IA_MEMORY) || "Ton créateur est Astarté Léon. Tu es Polaris Brain.",
  saveIAMemory: (memory: string) => localStorage.setItem(KEYS.IA_MEMORY, memory),

  logAIResponse: (modelName: string, timeTaken: number) => {
    const stats = JSON.parse(localStorage.getItem(KEYS.IA_STATS) || '[]');
    stats.push({ model: modelName, time: timeTaken, timestamp: Date.now() });
    localStorage.setItem(KEYS.IA_STATS, JSON.stringify(stats.slice(-500)));
    
    // Marquer comme opérationnel
    const health = JSON.parse(localStorage.getItem(KEYS.IA_HEALTH) || '{}');
    health[modelName] = { status: 'online', lastUpdate: Date.now() };
    localStorage.setItem(KEYS.IA_HEALTH, JSON.stringify(health));
  },

  logAIError: (modelName: string) => {
    const health = JSON.parse(localStorage.getItem(KEYS.IA_HEALTH) || '{}');
    health[modelName] = { status: 'offline', lastUpdate: Date.now() };
    localStorage.setItem(KEYS.IA_HEALTH, JSON.stringify(health));
    storageService.addLog('SYSTEM', `Erreur critique sur le fournisseur IA : ${modelName}`);
  },

  getAIHealth: () => JSON.parse(localStorage.getItem(KEYS.IA_HEALTH) || '{}'),

  getAIStats: () => {
    const logs = JSON.parse(localStorage.getItem(KEYS.IA_STATS) || '[]');
    const summary: Record<string, { count: number, totalTime: number }> = {};
    
    logs.forEach((log: any) => {
      if (!summary[log.model]) summary[log.model] = { count: 0, totalTime: 0 };
      summary[log.model].count++;
      summary[log.model].totalTime += log.time;
    });

    const health = storageService.getAIHealth();

    return Object.entries(summary)
      .map(([name, data]) => ({
        name,
        count: data.count,
        avgTime: Math.round(data.totalTime / data.count),
        status: health[name]?.status || 'unknown'
      }))
      .sort((a, b) => b.count - a.count);
  },

  getUserXP: (): number => parseInt(localStorage.getItem(KEYS.USER_XP) || '0'),
  addXP: (amount: number): number => {
    const newXP = storageService.getUserXP() + amount;
    localStorage.setItem(KEYS.USER_XP, newXP.toString());
    return newXP;
  },
  saveUserEmail: (email: string) => localStorage.setItem(KEYS.USER_EMAIL, email),
  getUserEmail: () => localStorage.getItem(KEYS.USER_EMAIL),
  getBannedEmails: (): string[] => JSON.parse(localStorage.getItem(KEYS.BANNED_EMAILS) || '[]'),
  isEmailBanned: (email: string): boolean => {
    const userEmail = storageService.getUserEmail();
    const isBanned = storageService.getBannedEmails().includes(email);
    return isBanned || (userEmail ? storageService.getBannedEmails().includes(userEmail) : false);
  },
  banEmail: (email: string): void => {
    const banned = storageService.getBannedEmails();
    if (!banned.includes(email)) {
      localStorage.setItem(KEYS.BANNED_EMAILS, JSON.stringify([...banned, email]));
      storageService.addLog('BAN', `Identité bannie : ${email}`);
    }
  },
  unbanEmail: (email: string): void => {
    const banned = storageService.getBannedEmails();
    const filtered = banned.filter(e => e !== email);
    localStorage.setItem(KEYS.BANNED_EMAILS, JSON.stringify(filtered));
    storageService.addLog('BAN', `Accès rétabli : ${email}`);
  },
  getAccounts: (): AdminAccount[] => {
    const data = localStorage.getItem(KEYS.ACCOUNTS);
    if (!data) {
      const defaults: AdminAccount[] = [{ id: '0', username: 'Astarté', role: 'SUPER_MASTER', lastLogin: '' }];
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(data);
  },
  addAccount: (username: string, role: AdminAccount['role']): void => {
    const accounts = storageService.getAccounts();
    const newAccount: AdminAccount = { id: Date.now().toString(), username, role, lastLogin: '' };
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
    return { topDocs, totalUniqueUsers: uniqueEmails.size, chartData: Object.keys(dailyStats).map(date => ({ date, downloads: dailyStats[date] })).reverse() };
  },
  getLogs: () => JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]'),
  addLog: (action: any, details: string) => {
    const logs = JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
    const newLog = { id: Date.now().toString(), action, details, timestamp: new Date().toLocaleString() };
    localStorage.setItem(KEYS.LOGS, JSON.stringify([newLog, ...logs].slice(0, 100)));
  },
  logVisit: (): void => {
    const email = storageService.getUserEmail();
    const activities = JSON.parse(localStorage.getItem(KEYS.VISITOR_ACTIVITY) || '[]');
    const newAct = { id: `v-${Date.now()}`, type: 'VISIT', email: email || 'Anonyme', timestamp: new Date().toLocaleString() };
    localStorage.setItem(KEYS.VISITOR_ACTIVITY, JSON.stringify([newAct, ...activities].slice(0, 500)));
  },
  logPreview: (email: string | null, fileName: string) => {
    const activities = JSON.parse(localStorage.getItem(KEYS.VISITOR_ACTIVITY) || '[]');
    const newAct = { id: `p-${Date.now()}`, type: 'PREVIEW', email: email || 'Anonyme', fileName, timestamp: new Date().toLocaleString() };
    localStorage.setItem(KEYS.VISITOR_ACTIVITY, JSON.stringify([newAct, ...activities].slice(0, 500)));
  },
  logDownload: (email: string, fileName: string, docId?: string) => {
    const activities = JSON.parse(localStorage.getItem(KEYS.VISITOR_ACTIVITY) || '[]');
    const newAct = { id: `d-${Date.now()}`, type: 'DOWNLOAD', email, fileName, timestamp: new Date().toLocaleString() };
    localStorage.setItem(KEYS.VISITOR_ACTIVITY, JSON.stringify([newAct, ...activities].slice(0, 500)));
    if (docId) {
      const history = JSON.parse(localStorage.getItem(KEYS.USER_HISTORY) || '[]');
      if (!history.includes(docId)) localStorage.setItem(KEYS.USER_HISTORY, JSON.stringify([...history, docId]));
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
