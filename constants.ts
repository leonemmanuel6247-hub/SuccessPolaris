
import { Document, Category } from './types.ts';

export const THEME = {
  deepBlue: '#050b18',
  electricCyan: '#00d4ff',
  glacialWhite: '#e6f1ff',
  vividViolet: '#7b4dff',
  glassBorder: 'rgba(255, 255, 255, 0.05)',
  glassBg: 'rgba(15, 23, 42, 0.6)',
  neonRed: '#FF003C'
};

// --- CONFIGURATION DYNAMIQUE POLARIS ---
// URL A : Canal de comptage (JSON/Text) - URL Mise à jour selon instructions
export const URL_COMPTEUR = 'https://script.google.com/macros/s/AKfycbzCiCf6TonxpoZ7RjacHCEIg6hl0D0ImulJvqsbkF1jMhEA_U5nWTfrdWbl5sWQdT3B/exec';

// URL B : Canal de données (CSV Export)
export const URL_LISTE_DOCUMENTS = 'https://docs.google.com/spreadsheets/d/1fg-tStXc8E04WLqkHxDfrEJR7yf6ix0uzL4y52HF0k0/export?format=csv';

// URL C : Webhook de traçage (Logs)
export const APPS_SCRIPT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxsxCg3mvJsSFSTDK-2q7yViH0jhCr1TH4yELAGl2j7NUoykvJzVG_hyQRSXUSmfDDf/exec';

export const INITIAL_CATEGORIES: Category[] = [];
export const INITIAL_DOCUMENTS: Document[] = [];
