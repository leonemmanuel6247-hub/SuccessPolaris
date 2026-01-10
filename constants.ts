
import { Document, Category } from './types.ts';

export const THEME = {
  deepBlue: '#050b18',
  electricCyan: '#00d4ff',
  glacialWhite: '#e6f1ff',
  vividViolet: '#7b4dff',
  glassBorder: 'rgba(255, 255, 255, 0.05)',
  glassBg: 'rgba(15, 23, 42, 0.6)'
};

// --- CONFIGURATION DYNAMIQUE ---
export const GOOGLE_SHEET_ID = '1fg-tStXc8E04WLqkHxDfrEJR7yf6ix0uzL4y52HF0k0'; 

// URL du Webhook Google Apps Script final fournie
export const APPS_SCRIPT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxsxCg3mvJsSFSTDK-2q7yViH0jhCr1TH4yELAGl2j7NUoykvJzVG_hyQRSXUSmfDDf/exec';

export const INITIAL_CATEGORIES: Category[] = [];
export const INITIAL_DOCUMENTS: Document[] = [];
