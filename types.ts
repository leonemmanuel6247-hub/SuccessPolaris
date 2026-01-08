
export interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

export interface Document {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  githubUrl: string; // Utilisé comme URL externe ou ID de référence locale
  downloads: number;
  dateAdded: string;
  isLocal?: boolean; // Flag pour le stockage IndexedDB
}

export interface VisitorActivity {
  id: string;
  path: string;
  timestamp: string;
}

export interface Stats {
  totalVisits: number;
  totalDownloads: number;
}

export interface UserSession {
  email: string;
  country?: string;
  isValidated: boolean;
}

export interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  details: string;
}
