
export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  icon?: string;
}

export interface AdminAccount {
  id: string;
  username: string;
  role: 'SUPER_MASTER' | 'MASTER' | 'EDITOR';
  lastLogin: string;
}

export interface Document {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  fileUrl: string; 
  fileType: 'pdf' | 'docx' | 'image' | 'archive';
  tags: string[];
  downloads: number;
  dateAdded: string;
  size?: string;
}

export interface VisitorActivity {
  id: string;
  type: 'VISIT' | 'DOWNLOAD';
  email?: string;
  fileName?: string;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  action: 'AUTH' | 'SYSTEM' | 'UPLOAD' | 'DELETE' | 'CONFIG' | 'TRAÇAGE' | 'ACCOUNT' | 'BAN';
  timestamp: string;
  details: string;
}

export interface UserProfile {
  xp: number;
  email: string;
  level: string;
}
