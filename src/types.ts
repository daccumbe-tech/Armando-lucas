export type UserRole = 'talent' | 'investor' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  bio?: string;
  category?: string;
  skills?: string[];
  photoURL?: string;
  whatsapp?: string;
  isFeatured?: boolean;
  createdAt?: string;
  followers?: string[];
  following?: string[];
}

export interface Project {
  id: string;
  talentId: string;
  talentName: string;
  talentEmail: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  projectLink?: string;
  likesCount?: number;
  commentsCount?: number;
  likedBy?: string[];
  rating?: {
    average: number;
    count: number;
    total: number;
    ratedBy: string[];
  };
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
  lastMessage?: string;
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

export const CATEGORIES = [
  'Arte',
  'Música',
  'Programação',
  'Negócios',
  'Design',
  'Escrita',
  'Outros'
];
