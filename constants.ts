
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
// REMPLACE CET ID PAR CELUI DE TA FEUILLE GOOGLE SHEETS PUBLIÉE
export const GOOGLE_SHEET_ID = '1XpY_vOTRE_ID_ICI'; 

export const INITIAL_CATEGORIES: Category[] = [];
export const INITIAL_DOCUMENTS: Document[] = [];
