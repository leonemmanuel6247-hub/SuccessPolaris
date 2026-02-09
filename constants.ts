
import { Document, Category } from './types.ts';

export const THEME = {
  deepSpace: '#020617', // Bleu nuit très profond
  nexusCyan: '#00d4ff', // Cyan électrique
  electricBlue: '#3b82f6', // Bleu vibrant
  matrixGlow: 'rgba(0, 212, 255, 0.15)',
  warmGlass: 'rgba(255, 255, 255, 0.03)',
  vibrantGlow: 'rgba(0, 212, 255, 0.3)'
};

export const URL_COMPTEUR = 'https://script.google.com/macros/s/AKfycbCiCf6TonxpoZ7RjacHCEIg6hl0D0ImulJvqsbkF1jMhEA_U5nWTfrdWbl5sWQdT3B/exec';
export const URL_LISTE_DOCUMENTS = 'https://docs.google.com/spreadsheets/d/1fg-tStXc8E04WLqkHxDfrEJR7yf6ix0uzL4y52HF0k0/export?format=csv';
export const APPS_SCRIPT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxsxCg3mvJsSFSTDK-2q7yViH0jhCr1TH4yELAGl2j7NUoykvJzVG_hyQRSXUSmfDDf/exec';

export const INITIAL_CATEGORIES: Category[] = [];
export const INITIAL_DOCUMENTS: Document[] = [];
