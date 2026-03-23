export type UserRole = 'talent' | 'investor' | 'admin';

export type UserStatus = 'active' | 'suspended' | 'banned';

export type PortfolioItemType = 'image' | 'video' | 'document';

export interface PortfolioItem {
  id: string;
  type: PortfolioItemType;
  title: string;
  url: string;
  description?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  bio?: string;
  category?: string;
  skills?: string[];
  photoURL?: string;
  whatsapp?: string;
  location?: string;
  city?: string;
  country?: string;
  rating?: {
    average: number;
    count: number;
    total: number;
    ratedBy: string[];
  };
  isFeatured?: boolean;
  isVerified?: boolean; // General verification status
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  phone?: string;
  isInvestorVerified?: boolean;
  kyc?: {
    fullName: string;
    country: string;
    documentURL: string;
    selfieURL: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    submittedAt: any;
  };
  viewsCount?: number;
  contactsCount?: number;
  createdAt?: string;
  followers?: string[];
  following?: string[];
  portfolio?: PortfolioItem[];
  // New fields for investor management and recommendations
  company?: string;
  investmentFocus?: string[];
  interests?: string[];
  viewedProjects?: string[];
  isBanned?: boolean;
  banReason?: string;
}

export type ReportType = 'fraude' | 'pedido_dinheiro' | 'comportamento_suspeito' | 'outro';

export interface UserReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetId: string;
  targetName: string;
  type: ReportType;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: any;
}

export interface Project {
  id: string;
  talentId: string;
  talentName: string;
  talentEmail: string;
  talentLocation?: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  projectLink?: string;
  likesCount?: number;
  commentsCount?: number;
  likedBy?: string[];
  status?: 'published' | 'draft';
  requiredSkills?: string[];
  rating?: {
    average: number;
    count: number;
    total: number;
    ratedBy: string[];
  };
  deadline?: any; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
}

export interface ProjectComment {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  userRole?: string;
  text: string;
  createdAt: any;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: { [uid: string]: string };
  participantPhotos: { [uid: string]: string };
  lastMessage?: string;
  unreadCounts?: { [uid: string]: number };
  acceptedBy: string[]; // UIDs of participants who accepted the chat
  updatedAt: any;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
}

export interface AppNotification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  type: 'rating' | 'like' | 'comment';
  projectTitle: string;
  projectId: string;
  read: boolean;
  createdAt: any;
}

export const CATEGORIES = [
  'Arte',
  'Música',
  'Programação',
  'Negócios',
  'Design',
  'Escrita',
  'Outros'
];
