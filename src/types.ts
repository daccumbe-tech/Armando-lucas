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
  isSuspicious?: boolean;
  suspicionReason?: string;
  reportCount?: number;
  messageCount?: number;
  lastMessageAt?: any;
  dailyMessageCount?: number;
  // New fields for comprehensive profile
  username?: string;
  coverURL?: string;
  socialLinks?: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    github?: string;
    website?: string;
  };
  privacy?: {
    isPublic: boolean;
    showContacts: boolean;
    messagePermission: 'all' | 'verified_only';
  };
  notificationSettings?: {
    messages: boolean;
    updates: boolean;
  };
  isDeactivated?: boolean;
  deactivationReason?: string;
}

export type AdminAction = 'suspend' | 'ban' | 'reactivate' | 'kyc_approve' | 'kyc_reject' | 'delete_project' | 'delete_comment' | 'settings_update' | 'auto_suspend' | 'auto_suspicious';

export interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  action: AdminAction;
  targetId?: string;
  targetName?: string;
  details: string;
  createdAt: any;
}

export interface SiteSettings {
  id: string;
  // 1. Site Info
  siteName: string;
  siteSlogan: string;
  siteDescription: string;
  logoURL?: string;
  faviconURL?: string;

  // 2. Language & Region
  defaultLanguage: 'pt' | 'en';
  supportedLanguages: string[];
  defaultRegion: string;

  // 3. Contact & Communication
  officialEmail: string;
  whatsappNumber: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  autoContactMessage: string;

  // 4. Security
  enableEmailVerification: boolean;
  enablePhoneVerification: boolean;
  enableReCAPTCHA: boolean;
  reportLimitForSuspension: number;
  enableSuspiciousWordDetection: boolean;
  suspiciousWords: string[];

  // 5. Users
  allowPublicRegistration: boolean;
  requireManualApproval: boolean;
  dailyMessageLimit: number;
  maxUploadsPerDay: number;

  // 6. Monetization
  enablePremiumMode: boolean;
  freeUserLimits: {
    maxProjects: number;
    maxMessagesPerDay: number;
  };
  premiumBenefits: string[];

  // 7. Content
  maxUploadSizeMB: number;
  allowedFileTypes: string[];
  enableAutoModeration: boolean;

  // 8. Notifications
  enableAutoNotifications: boolean;
  defaultNotificationMessages: {
    security: string;
    alert: string;
    welcome: string;
  };

  // Metadata
  updatedAt: any;
  updatedBy: string;
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
  type: 'rating' | 'like' | 'comment' | 'system' | 'warning' | 'suspension';
  projectTitle?: string;
  projectId?: string;
  message?: string;
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
