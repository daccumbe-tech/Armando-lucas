import React, { useState, useEffect } from 'react';
import { auth, db, sanitizeData, handleFirestoreError, OperationType } from './firebase';
import { 
  onAuthStateChanged, 
  deleteUser, 
  reauthenticateWithPopup, 
  reauthenticateWithCredential,
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  EmailAuthProvider,
  signOut
} from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc, 
  addDoc, 
  serverTimestamp, 
  deleteDoc, 
  getDocFromServer,
  where,
  limit,
  updateDoc,
  runTransaction,
  Timestamp,
  getDocs,
  startAfter,
  writeBatch,
  collectionGroup
} from 'firebase/firestore';
import Auth from './components/Auth';
import ProfileSetup from './components/ProfileSetup';
import UserProfileEditor from './components/UserProfileEditor';
import ProjectCard from './components/ProjectCard';
import Chat from './components/Chat';
import ConversationsList from './components/ConversationsList';
import Verification from './components/Verification';
import KYCSubmission from './components/KYCSubmission';
import AdminKYC from './components/AdminKYC';
import AdminReports from './components/AdminReports';
import AdminDashboard from './components/AdminDashboard';
import AdminUserManagement from './components/AdminUserManagement';
import AdminSettings from './components/AdminSettings';
import AdminLogs from './components/AdminLogs';
import ReportModal from './components/ReportModal';
import TermsOfUse from './components/TermsOfUse';
import PrivacyPolicy from './components/PrivacyPolicy';
import SupportButton from './components/SupportButton';
import WelcomeModal from './components/WelcomeModal';
import ProfileMetrics from './components/ProfileMetrics';
import ShareProfile from './components/ShareProfile';
import UserNudges from './components/UserNudges';
import { Toaster, toast } from 'sonner';
import { UserProfile, Project, CATEGORIES, ProjectComment, AppNotification, SiteSettings } from './types';
import { translations, Language } from './i18n';
import Navbar from './components/Navbar';
import DeleteAccountModal from './components/DeleteAccountModal';
import Analytics from './components/Analytics';
import About from './components/About';
import StarRating from './components/StarRating';
import { 
  Plus, 
  X, 
  Search, 
  Filter, 
  Briefcase, 
  User, 
  Mail, 
  Trash2, 
  Tag, 
  MessageSquare, 
  Upload,
  Heart,
  ExternalLink,
  Star,
  UserPlus,
  UserMinus,
  AlertCircle,
  Bell,
  Check,
  ChevronDown,
  MapPin,
  Award,
  CheckCircle2,
  Eye,
  Phone,
  ShieldCheck,
  Ban,
  Shield,
  AlertTriangle,
  FileText,
  Video,
  Image as ImageIcon,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showGlobalDeleteConfirm, setShowGlobalDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ uid: string; name: string } | null>(null);
  const [showSecurityAlert, setShowSecurityAlert] = useState(true);
  const [chatRecipient, setChatRecipient] = useState<UserProfile | undefined>(undefined);
  const [featuredTalents, setFeaturedTalents] = useState<UserProfile[]>([]);
  const [talentOfTheWeek, setTalentOfTheWeek] = useState<UserProfile | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [lastProjectDoc, setLastProjectDoc] = useState<any>(null);
  const [hasMoreProjects, setHasMoreProjects] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'rating'>('newest');
  const [minRating, setMinRating] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recommendedProjects, setRecommendedProjects] = useState<Project[]>([]);
  const [viewedProjects, setViewedProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [filterDeadlineStart, setFilterDeadlineStart] = useState('');
  const [filterDeadlineEnd, setFilterDeadlineEnd] = useState('');
  const [filterSkills, setFilterSkills] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [useInvestmentFocusFilter, setUseInvestmentFocusFilter] = useState(true);
  const [language, setLanguage] = useState<Language>('pt');
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const t = translations[language];

  // New project form state
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    imageUrl: '',
    projectLink: '',
    deadline: '',
    requiredSkills: '',
    status: 'published' as 'published' | 'draft'
  });

  useEffect(() => {
    // Handle profile query param
    const params = new URLSearchParams(window.location.search);
    const profileId = params.get('profile');
    if (profileId) {
      const fetchProfile = async () => {
        try {
          const docSnap = await getDoc(doc(db, 'users', profileId));
          if (docSnap.exists()) {
            setViewingProfile({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
            setCurrentPage('profile-view');
          }
        } catch (err) {
          console.error('Error fetching profile from URL:', err);
        }
      };
      fetchProfile();
    }
  }, []);

  useEffect(() => {
    // Security check for admin routes
    const adminRoutes = ['admin-dashboard', 'admin-kyc', 'admin-reports', 'admin-users', 'admin-settings'];
    if (adminRoutes.includes(currentPage)) {
      if (!user || user.email !== 'daccumbe@gmail.com') {
        setCurrentPage('home');
      }
    }
  }, [currentPage, user]);

  useEffect(() => {
    // Fetch site settings
    const fetchSettings = async () => {
      const docRef = doc(db, 'site_settings', 'global');
      const unsub = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setSiteSettings(docSnap.data() as SiteSettings);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'site_settings/global');
      });
      return unsub;
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('isFeatured', '==', true), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFeaturedTalents(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    }, (error) => {
      console.error("Error fetching featured talents:", error);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('isTalentOfTheWeek', '==', true), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setTalentOfTheWeek({ uid: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UserProfile);
      } else {
        setTalentOfTheWeek(null);
      }
    }, (error) => {
      console.error("Error fetching talent of the week:", error);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("Conexão com Firestore estabelecida com sucesso.");
      } catch (error) {
        if(error instanceof Error) {
          if (error.message.includes('the client is offline')) {
            console.error("Erro de conexão com Firestore: O cliente está offline ou o backend não respondeu.");
          } else {
            console.error("Erro ao testar conexão com Firestore:", error.message);
          }
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught in App:', event.error);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection caught in App:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  useEffect(() => {
    let unsubscribeUser: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        unsubscribeUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUser({ uid: firebaseUser.uid, ...docSnap.data() } as UserProfile);
          } else {
            setUser({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Anonymous',
              email: firebaseUser.email || '',
              role: 'talent',
              photoURL: firebaseUser.photoURL || ''
            });
            setCurrentPage('my-profile');
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUser();
    };
  }, []);

  useEffect(() => {
    if (!viewingProfile) return;

    // Increment profile views
    const incrementViews = async () => {
      if (!viewingProfile?.uid) return;
      const profileId = viewingProfile.uid;
      const sessionKey = `viewed_${profileId}`;
      const isUnique = !sessionStorage.getItem(sessionKey);

      try {
        const updateData: any = {
          viewsCount: (viewingProfile?.viewsCount || 0) + 1
        };

        if (isUnique) {
          updateData.uniqueViewsCount = (viewingProfile?.uniqueViewsCount || 0) + 1;
          sessionStorage.setItem(sessionKey, 'true');
        }

        await updateDoc(doc(db, 'users', profileId), updateData);
      } catch (err) {
        console.error('Error incrementing profile views:', err);
      }
    };

    incrementViews();

    const unsubscribe = onSnapshot(doc(db, 'users', viewingProfile.uid), (docSnap) => {
      if (docSnap.exists()) {
        setViewingProfile({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${viewingProfile.uid}`);
    });

    return () => unsubscribe();
  }, [viewingProfile?.uid]);

  useEffect(() => {
    if (!user) {
      setUnreadMessagesCount(0);
      return;
    }

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user?.uid || '')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const total = snapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        if (!user?.uid) return acc;
        return acc + (data.unreadCounts?.[user.uid] || 0);
      }, 0);
      setUnreadMessagesCount(total);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'conversations');
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (user && user.welcomeShown === false) {
      setShowWelcomeModal(true);
    }
  }, [user?.uid, user?.welcomeShown]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user?.uid || ''),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notifications');
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user) {
      setRecommendedProjects([]);
      return;
    }

    const fetchRecommendations = async () => {
      if (!user) return;
      try {
        // Simple recommendation: projects in user's interests or investor's focus
        const interests = user.role === 'investor' ? user.investmentFocus : user.interests;
        
        if (!interests || interests.length === 0) {
          // Fallback: featured or highly rated projects
          const q = query(collection(db, 'projects'), where('status', '==', 'published'), orderBy('rating.average', 'desc'), limit(4));
          const snap = await getDocs(q);
          setRecommendedProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
          return;
        }

        // Query projects in user's interest categories
        const q = query(
          collection(db, 'projects'), 
          where('status', '==', 'published'),
          where('category', 'in', interests.slice(0, 10)), // Firestore 'in' limit is 10
          limit(4)
        );
        const snap = await getDocs(q);
        setRecommendedProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      }
    };

    fetchRecommendations();
  }, [user?.uid, user?.interests, user?.investmentFocus]);

  useEffect(() => {
    if (!viewingProfile?.viewedProjects || viewingProfile.viewedProjects.length === 0) {
      setViewedProjects([]);
      return;
    }

    const fetchHistory = async () => {
      try {
        const historyIds = viewingProfile.viewedProjects.slice(0, 10);
        const q = query(collection(db, 'projects'), where('id', 'in', historyIds));
        const snap = await getDocs(q);
        setViewedProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };

    fetchHistory();
  }, [viewingProfile?.viewedProjects]);

  const addToHistory = async (projectId: string) => {
    if (!user?.uid) return;
    
    const currentHistory = user.viewedProjects || [];
    if (currentHistory.includes(projectId)) return;

    const newHistory = [projectId, ...currentHistory.filter(id => id !== projectId)].slice(0, 20);
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        viewedProjects: newHistory
      });
    } catch (error) {
      console.error("Error updating history:", error);
    }
  };

  const handleSelectProject = (project: Project | null) => {
    setSelectedProject(project);
    if (project) {
      addToHistory(project.id);
    }
  };

  const createNotification = async (recipientId: string, type: AppNotification['type'], projectTitle: string, projectId: string) => {
    if (!user?.uid || user.uid === recipientId) return;

    try {
      await addDoc(collection(db, 'notifications'), {
        recipientId,
        senderId: user.uid,
        senderName: user.name || 'Anonymous',
        senderPhotoURL: user.photoURL || '',
        type,
        projectTitle,
        projectId,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  const fetchProjects = async (isInitial = false) => {
    try {
      let q = query(
        collection(db, 'projects'),
        orderBy(sortBy === 'newest' ? 'createdAt' : 'rating.average', 'desc'),
        limit(6)
      );

      if (!isInitial && lastProjectDoc) {
        q = query(
          collection(db, 'projects'),
          orderBy(sortBy === 'newest' ? 'createdAt' : 'rating.average', 'desc'),
          startAfter(lastProjectDoc),
          limit(6)
        );
      }

      const snapshot = await getDocs(q);
      const newProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      
      if (isInitial) {
        setProjects(newProjects);
      } else {
        setProjects(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = newProjects.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
      }

      setLastProjectDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMoreProjects(snapshot.docs.length === 6);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  useEffect(() => {
    fetchProjects(true);
  }, [sortBy]);

  useEffect(() => {
    if (!selectedProject) {
      setComments([]);
      return;
    }

    const q = query(
      collection(db, 'projects', selectedProject.id, 'comments'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectComment)));
    }, (error) => {
      console.error("Error fetching comments:", error);
    });

    return () => unsubscribe();
  }, [selectedProject]);

  useEffect(() => {
    if (currentPage === 'analytics') {
      const fetchAllProjects = async () => {
        try {
          const q = query(collection(db, 'projects'), where('status', '==', 'published'));
          const snapshot = await getDocs(q);
          setAllProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
        } catch (error) {
          console.error("Error fetching all projects for analytics:", error);
        }
      };
      fetchAllProjects();
    }
  }, [currentPage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProject({ ...newProject, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const projectData = {
        ...newProject,
        requiredSkills: newProject.requiredSkills.split(',').map(s => s.trim()).filter(s => s !== ''),
        deadline: newProject.deadline ? Timestamp.fromDate(new Date(newProject.deadline)) : null,
        talentId: user.uid,
        talentName: user.name,
        talentEmail: user.email,
        talentLocation: user.location || '',
        talentIsFounder: user.isFounder || false,
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        likedBy: [],
        rating: { average: 0, count: 0, total: 0, ratedBy: [] }
      };

      await addDoc(collection(db, 'projects'), sanitizeData(projectData));
      setShowAddModal(false);
      setNewProject({ 
        title: '', 
        description: '', 
        category: CATEGORIES[0], 
        imageUrl: '', 
        projectLink: '', 
        deadline: '',
        requiredSkills: '',
        status: 'published'
      });
    } catch (err) {
      console.error('Error adding project:', err);
      toast.error('Erro ao publicar projeto. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleProjectStatus = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project || project.talentId !== user?.uid) return;

    const newStatus = project.status === 'published' ? 'draft' : 'published';
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        status: newStatus
      });
    } catch (err) {
      console.error('Error toggling project status:', err);
    }
  };

  const handleFollowUser = async (targetUserId: string) => {
    if (!user) return;

    const currentUserRef = doc(db, 'users', user.uid);
    const targetUserRef = doc(db, 'users', targetUserId);

    const isFollowing = user.following?.includes(targetUserId);

    try {
      await runTransaction(db, async (transaction) => {
        const currentUserDoc = await transaction.get(currentUserRef);
        const targetUserDoc = await transaction.get(targetUserRef);

        if (!currentUserDoc.exists() || !targetUserDoc.exists()) return;

        const currentUserData = currentUserDoc.data() as UserProfile;
        const targetUserData = targetUserDoc.data() as UserProfile;

        const currentFollowing = currentUserData.following || [];
        const targetFollowers = targetUserData.followers || [];

        if (isFollowing) {
          // Unfollow
          transaction.update(currentUserRef, {
            following: currentFollowing.filter(id => id !== targetUserId)
          });
          transaction.update(targetUserRef, {
            followers: targetFollowers.filter(id => id !== user.uid)
          });
        } else {
          // Follow
          transaction.update(currentUserRef, {
            following: [...currentFollowing, targetUserId]
          });
          transaction.update(targetUserRef, {
            followers: [...targetFollowers, user.uid],
            interactionsCount: (targetUserData.interactionsCount || 0) + 1
          });
        }
      });
    } catch (err) {
      console.error('Error following/unfollowing user:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProject || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      await addDoc(collection(db, 'projects', selectedProject.id, 'comments'), {
        projectId: selectedProject.id,
        userId: user.uid,
        userName: user.name,
        userPhotoURL: user.photoURL || '',
        userRole: user.role,
        text: newComment.trim(),
        createdAt: serverTimestamp()
      });
      
      // Update comments count
      const projectRef = doc(db, 'projects', selectedProject.id);
      await updateDoc(projectRef, {
        commentsCount: (selectedProject.commentsCount || 0) + 1
      });

      await createNotification(selectedProject.talentId, 'comment', selectedProject.title, selectedProject.id);

      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedProject) return;
    try {
      await deleteDoc(doc(db, 'projects', selectedProject.id, 'comments', commentId));
      
      // Update comments count
      const projectRef = doc(db, 'projects', selectedProject.id);
      await updateDoc(projectRef, {
        commentsCount: Math.max(0, (selectedProject.commentsCount || 1) - 1)
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este projeto?')) return;
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      if (selectedProject?.id === projectId) setSelectedProject(null);
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const handleViewProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile;
        setViewingProfile(profileData);
        setCurrentPage('profile');

        // Increment views count if it's not the user's own profile
        if (user?.uid !== uid) {
          await updateDoc(doc(db, 'users', uid), {
            viewsCount: (profileData.viewsCount || 0) + 1
          });
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleLikeProject = async (projectId: string) => {
    if (!user?.uid) return;
    const projectRef = doc(db, 'projects', projectId);
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const likedBy = project.likedBy || [];
    const isLiked = likedBy.includes(user.uid);

    try {
      if (isLiked) {
        await updateDoc(projectRef, {
          likedBy: likedBy.filter(id => id !== user.uid),
          likesCount: (project.likesCount || 1) - 1
        });
        toast.success('Removido dos favoritos');
      } else {
        await updateDoc(projectRef, {
          likedBy: [...likedBy, user.uid],
          likesCount: (project.likesCount || 0) + 1
        });
        await createNotification(project.talentId, 'like', project.title, project.id);
        toast.success('Adicionado aos favoritos!');
      }
    } catch (err) {
      console.error('Error liking project:', err);
      toast.error('Erro ao curtir projeto');
    }
  };

  const handleRateTalent = async (talentId: string, stars: number) => {
    if (!user?.uid) {
      toast.error('Faça login para avaliar este talento!');
      return;
    }

    if (user.role !== 'investor') {
      toast.error('Apenas investidores podem avaliar talentos!');
      return;
    }

    const talentRef = doc(db, 'users', talentId);

    try {
      await runTransaction(db, async (transaction) => {
        const talentDoc = await transaction.get(talentRef);
        if (!talentDoc.exists()) throw new Error('Talento não encontrado');

        const talentData = talentDoc.data() as UserProfile;
        const rating = talentData.rating || { average: 0, count: 0, total: 0, ratedBy: [] };

        if (rating.ratedBy?.includes(user.uid)) {
          throw new Error('Você já avaliou este talento!');
        }

        if (talentId === user.uid) {
          throw new Error('Você não pode avaliar a si mesmo!');
        }

        const newCount = (rating.count || 0) + 1;
        const newTotal = (rating.total || 0) + stars;
        const newAverage = newTotal / newCount;

        transaction.update(talentRef, {
          rating: {
            average: newAverage,
            count: newCount,
            total: newTotal,
            ratedBy: [...(rating.ratedBy || []), user.uid]
          }
        });
      });
      
      // Update local viewingProfile if we are on their profile page
      if (viewingProfile?.uid === talentId) {
        const updatedDoc = await getDoc(talentRef);
        if (updatedDoc.exists()) {
          setViewingProfile(updatedDoc.data() as UserProfile);
        }
      }
      
      await createNotification(talentId, 'rating', 'seu perfil', talentId);
      toast.success('Avaliação enviada com sucesso!');
    } catch (err: any) {
      console.error('Error rating talent:', err);
      toast.error(err.message || 'Erro ao avaliar talento.');
    }
  };

  const handleRateProject = async (projectId: string, stars: number) => {
    if (!user?.uid) {
      toast.error('Faça login para avaliar este projeto!');
      return;
    }

    const projectRef = doc(db, 'projects', projectId);

    try {
      await runTransaction(db, async (transaction) => {
        const projectDoc = await transaction.get(projectRef);
        if (!projectDoc.exists()) throw new Error('Projeto não encontrado');

        const projectData = projectDoc.data() as Project;
        const rating = projectData.rating || { average: 0, count: 0, total: 0, ratedBy: [] };

        // Validation: Check if user already rated
        if (rating.ratedBy.includes(user.uid)) {
          throw new Error('Você já avaliou este projeto!');
        }

        // Validation: Prevent self-rating
        if (projectData.talentId === user.uid) {
          throw new Error('Você não pode avaliar seu próprio projeto!');
        }

        // Calculate new rating
        const newCount = rating.count + 1;
        const newTotal = rating.total + stars;
        const newAverage = newTotal / newCount;

        // Update document
        transaction.update(projectRef, {
          rating: {
            average: newAverage,
            count: newCount,
            total: newTotal,
            ratedBy: [...rating.ratedBy, user.uid]
          }
        });
        
        // Create notification
        const notificationRef = doc(collection(db, 'notifications'));
        transaction.set(notificationRef, {
          recipientId: projectData.talentId,
          senderId: user.uid,
          senderName: user.name,
          senderPhotoURL: user.photoURL || '',
          type: 'rating',
          projectTitle: projectData.title,
          projectId: projectId,
          read: false,
          createdAt: serverTimestamp()
        });
      });
      toast.success('Projeto avaliado com sucesso!');
    } catch (err: any) {
      console.error('Error rating project:', err);
      toast.error(err.message || 'Erro ao registrar avaliação');
    }
  };

  const openChatWith = async (recipient: UserProfile) => {
    if (!user?.uid) {
      setCurrentPage('auth');
      return;
    }

    // Check verification
    if (!auth.currentUser?.emailVerified || !user.isPhoneVerified) {
      toast.error('Por favor, verifique seu e-mail e telefone para iniciar conversas.');
      setCurrentPage('verification');
      return;
    }

    setChatRecipient(recipient);
    
    try {
      // Increment interactions count
      await updateDoc(doc(db, 'users', recipient.uid), {
        interactionsCount: (recipient.interactionsCount || 0) + 1
      });

      // Find existing conversation
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', user.uid)
      );
      const querySnapshot = await getDocs(q);
      let existingConv = querySnapshot.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(recipient.uid);
      });

      if (existingConv) {
        setCurrentConversationId(existingConv.id);
      } else {
        // Create new conversation
        const newConvRef = await addDoc(collection(db, 'conversations'), {
          participants: [user.uid, recipient.uid],
          participantNames: {
            [user.uid]: user.name || 'Anonymous',
            [recipient.uid]: recipient.name
          },
          participantPhotos: {
            [user.uid]: user.photoURL || '',
            [recipient.uid]: recipient.photoURL || ''
          },
          lastMessage: '',
          acceptedBy: [],
          updatedAt: serverTimestamp()
        });
        setCurrentConversationId(newConvRef.id);
      }
      
      setShowChat(true);

      // Increment contacts count
      if (user.uid !== recipient.uid) {
        await updateDoc(doc(db, 'users', recipient.uid), {
          contactsCount: (recipient.contactsCount || 0) + 1
        });
      }
    } catch (err) {
      console.error('Error opening chat:', err);
      toast.error('Erro ao abrir chat.');
    }
  };

  const handleContactWhatsApp = async (recipient: UserProfile) => {
    if (!user?.uid) {
      setCurrentPage('auth');
      return;
    }

    // Check verification
    if (!auth.currentUser?.emailVerified || !user.isPhoneVerified) {
      toast.error('Por favor, verifique seu e-mail e telefone para acessar contatos externos.');
      setCurrentPage('verification');
      return;
    }

    if (!recipient.whatsapp) return;

    // Increment contacts count
    if (user.uid !== recipient.uid) {
      try {
        await updateDoc(doc(db, 'users', recipient.uid), {
          contactsCount: (recipient.contactsCount || 0) + 1,
          interactionsCount: (recipient.interactionsCount || 0) + 1
        });
      } catch (err) {
        console.error('Error updating contacts count:', err);
      }
    }

    window.open(`https://wa.me/${recipient.whatsapp.replace(/\D/g, '')}`, '_blank');
  };

  const handleWelcomeAction = async (action: 'complete-profile' | 'explore-talents') => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { welcomeShown: true });
      setShowWelcomeModal(false);
      if (action === 'complete-profile') {
        setCurrentPage('my-profile');
      } else {
        setCurrentPage('home');
      }
    } catch (err) {
      console.error('Error updating welcomeShown:', err);
    }
  };

  const handleCloseWelcome = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { welcomeShown: true });
      setShowWelcomeModal(false);
    } catch (err) {
      console.error('Error updating welcomeShown:', err);
    }
  };

  const handleDeleteAccount = async (password?: string) => {
    if (!auth.currentUser || !user) return;

    try {
      // 1. Re-authenticate user (required for sensitive operations like deleteUser)
      const currentUser = auth.currentUser;
      const providerId = currentUser.providerData[0]?.providerId;

      if (providerId === 'password') {
        if (!password) {
          throw new Error('PASSWORD_REQUIRED');
        }
        const credential = EmailAuthProvider.credential(currentUser.email!, password);
        await reauthenticateWithCredential(currentUser, credential);
      } else if (providerId === 'google.com') {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(currentUser, provider);
      } else if (providerId === 'facebook.com') {
        const provider = new FacebookAuthProvider();
        await reauthenticateWithPopup(currentUser, provider);
      }

      const uid = currentUser.uid;
      const batch = writeBatch(db);

      // 2. Delete user's projects and their comments
      const projectsQuery = query(collection(db, 'projects'), where('talentId', '==', uid));
      const projectsSnapshot = await getDocs(projectsQuery);
      
      for (const projectDoc of projectsSnapshot.docs) {
        // Delete comments subcollection for each project
        const commentsSnapshot = await getDocs(collection(db, 'projects', projectDoc.id, 'comments'));
        commentsSnapshot.forEach((commentDoc) => {
          batch.delete(commentDoc.ref);
        });
        // Delete the project itself
        batch.delete(projectDoc.ref);
      }

      // 3. Delete user's comments on other projects
      try {
        const userCommentsQuery = query(collectionGroup(db, 'comments'), where('userId', '==', uid));
        const userCommentsSnapshot = await getDocs(userCommentsQuery);
        userCommentsSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
      } catch (err: any) {
        console.warn('Could not delete comments on other projects (possibly missing index):', err);
        // Continue anyway, as this is not critical for account deletion
      }

      // 4. Delete user's notifications (received and sent)
      const receivedNotificationsQuery = query(collection(db, 'notifications'), where('recipientId', '==', uid));
      const receivedNotificationsSnapshot = await getDocs(receivedNotificationsQuery);
      receivedNotificationsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      const sentNotificationsQuery = query(collection(db, 'notifications'), where('senderId', '==', uid));
      const sentNotificationsSnapshot = await getDocs(sentNotificationsQuery);
      sentNotificationsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 5. Delete user's conversations and messages
      const conversationsQuery = query(collection(db, 'conversations'), where('participants', 'array-contains', uid));
      const conversationsSnapshot = await getDocs(conversationsQuery);
      
      for (const convDoc of conversationsSnapshot.docs) {
        // Delete messages subcollection
        const messagesSnapshot = await getDocs(collection(db, 'conversations', convDoc.id, 'messages'));
        messagesSnapshot.forEach((msgDoc) => {
          batch.delete(msgDoc.ref);
        });
        // Delete the conversation itself
        batch.delete(convDoc.ref);
      }

      // 6. Delete user profile
      batch.delete(doc(db, 'users', uid));

      // Commit all Firestore deletions
      await batch.commit();

      // 7. Delete Firebase Auth user
      await deleteUser(currentUser);

      // 8. Show success message and redirect
      setShowDeleteSuccess(true);
      setTimeout(() => {
        setShowDeleteSuccess(false);
        setUser(null);
        setCurrentPage('home');
      }, 3000);

    } catch (error: any) {
      console.error('Error deleting account:', error);
      if (error.message === 'PASSWORD_REQUIRED') {
        throw error;
      } else if (error.code === 'auth/requires-recent-login' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('AUTH_FAILED');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('AUTH_CANCELLED');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('NETWORK_ERROR');
      } else {
        // Pass the original error message if it's not a known code
        throw new Error(error.message || 'DELETE_FAILED');
      }
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.talentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesLocation = !locationSearchQuery || (p.talentLocation?.toLowerCase().includes(locationSearchQuery.toLowerCase()));
    const matchesRating = (p.rating?.average || 0) >= minRating;
    
    // Advanced Filters
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    
    const projectDeadline = p.deadline?.toDate ? p.deadline.toDate() : (p.deadline ? new Date(p.deadline) : null);
    const matchesDeadlineStart = !filterDeadlineStart || (projectDeadline && projectDeadline >= new Date(filterDeadlineStart));
    const matchesDeadlineEnd = !filterDeadlineEnd || (projectDeadline && projectDeadline <= new Date(filterDeadlineEnd));
    
    const matchesSkills = !filterSkills || (p.requiredSkills?.some(skill => 
      skill.toLowerCase().includes(filterSkills.toLowerCase())
    ) || false);

    const matchesInvestmentFocus = (user?.role === 'investor' && useInvestmentFocusFilter && user.investmentFocus && user.investmentFocus.length > 0)
      ? user.investmentFocus.includes(p.category)
      : true;

    const isVisible = p.status === 'published' || p.talentId === user?.uid;
    
    return matchesSearch && matchesCategory && matchesLocation && matchesRating && isVisible && 
           matchesStatus && matchesDeadlineStart && matchesDeadlineEnd && matchesSkills && matchesInvestmentFocus;
  });

  const isProfileIncomplete = (profile: UserProfile) => {
    const hasBio = !!profile.bio;
    const hasLocation = !!profile.city && !!profile.country;
    const hasSkills = profile.role === 'talent' ? (profile.skills && profile.skills.length > 0) : true;
    const hasInterests = profile.interests && profile.interests.length > 0;
    return !hasBio || !hasLocation || !hasSkills || !hasInterests;
  };

  const getProfileTips = (profile: UserProfile) => {
    const tips = [];
    if (!profile.bio) tips.push("Adicione uma bio para contar sua história.");
    if (!profile.location) tips.push("Sua localização ajuda a encontrar oportunidades locais.");
    if (profile.role === 'talent' && (!profile.skills || profile.skills.length < 3)) tips.push("Liste pelo menos 3 habilidades para se destacar.");
    if (!profile.interests || profile.interests.length === 0) tips.push("Selecione seus interesses para receber melhores recomendações.");
    if (profile.role === 'investor' && !profile.company) tips.push("Adicione o nome da sua empresa para passar mais credibilidade.");
    return tips;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user?.status === 'suspended' || user?.status === 'banned' || user?.isBanned) {
    const isBanned = user.status === 'banned' || user.isBanned;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-md w-full text-center border border-red-100">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-6 mx-auto">
            <Ban size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {isBanned ? 'Conta Banida' : 'Conta Suspensa'}
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {isBanned 
              ? 'Sua conta foi banida permanentemente por violação dos termos de uso.' 
              : 'Sua conta foi suspensa por atividade suspeita.'}
            {user.banReason && (
              <span className="block mt-4 p-4 bg-red-50 rounded-xl text-red-700 text-sm font-medium">
                Motivo: {user.banReason}
              </span>
            )}
          </p>
          <button
            onClick={() => signOut(auth)}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all"
          >
            Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Toaster position="top-center" richColors />
      <Navbar 
        user={user} 
        onNavigate={setCurrentPage} 
        onOpenChat={() => setCurrentPage('conversations')}
        onOpenNotifications={() => setShowNotifications(!showNotifications)}
        onDeleteAccount={() => setShowGlobalDeleteConfirm(true)}
        currentPage={currentPage} 
        unreadCount={unreadMessagesCount}
        notificationCount={notifications.filter(n => !n.read).length}
      />

      {showSecurityAlert && (
        <div className="bg-amber-50 border-b border-amber-100 py-2 px-4 relative">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 text-xs sm:text-sm font-medium text-amber-800">
            <span className="flex items-center gap-1">
              <AlertTriangle size={14} />
              ⚠️ Nunca envie dinheiro para desconhecidos
            </span>
            <span className="hidden sm:inline text-amber-300">|</span>
            <span className="flex items-center gap-1">
              <Shield size={14} />
              ⚠️ Use apenas o chat da plataforma para sua segurança
            </span>
            <button 
              onClick={() => setShowSecurityAlert(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-amber-100 rounded-full transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <DeleteAccountModal 
        isOpen={showGlobalDeleteConfirm} 
        onClose={() => setShowGlobalDeleteConfirm(false)} 
        onConfirm={handleDeleteAccount} 
      />

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {showNotifications && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-start justify-center sm:justify-end p-0 sm:p-4 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm sm:bg-black/5 sm:backdrop-blur-none pointer-events-auto"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 1 }}
              className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden sm:mt-16 h-[80vh] sm:h-fit sm:max-h-[80vh] flex flex-col pointer-events-auto"
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <h3 className="text-lg font-bold text-gray-900">Notificações</h3>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <button
                      key={notification.id}
                      onClick={async () => {
                        if (!notification.read) {
                          await updateDoc(doc(db, 'notifications', notification.id), { read: true });
                        }
                        const projDoc = await getDoc(doc(db, 'projects', notification.projectId));
                        if (projDoc.exists()) {
                          handleSelectProject({ id: projDoc.id, ...projDoc.data() } as Project);
                        }
                        setShowNotifications(false);
                      }}
                      className={`w-full p-4 rounded-2xl text-left transition-all flex gap-4 items-start hover:bg-gray-50 ${!notification.read ? 'bg-indigo-50/50' : ''}`}
                    >
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex-shrink-0 overflow-hidden">
                        {notification.senderPhotoURL ? (
                          <img src={notification.senderPhotoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold">
                            {notification.senderName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 leading-snug">
                          <span className="font-bold">{notification.senderName}</span>
                          {notification.type === 'like' && ' curtiu seu projeto '}
                          {notification.type === 'comment' && ' comentou no seu projeto '}
                          {notification.type === 'rating' && ' avaliou seu projeto '}
                          <span className="font-bold">"{notification.projectTitle}"</span>
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium uppercase tracking-wider">
                          {notification.createdAt?.toDate?.() 
                            ? notification.createdAt.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) 
                            : 'Agora mesmo'}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <Bell size={24} />
                    </div>
                    <p className="text-gray-500 font-medium">Nenhuma notificação por aqui.</p>
                  </div>
                )}
              </div>

              {notifications.some(n => !n.read) && (
                <div className="p-4 border-t border-gray-50 bg-gray-50/50">
                  <button 
                    onClick={async () => {
                      const unread = notifications.filter(n => !n.read);
                      await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
                    }}
                    className="w-full py-3 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    Marcar todas como lidas
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'my-profile' && user && (
          <UserProfileEditor 
            user={user} 
            onUpdate={(u) => { setUser(u); setCurrentPage('home'); }} 
            onDeleteAccount={handleDeleteAccount}
            language={language}
          />
        )}

        {currentPage === 'auth' && !user && (
          <div className="flex items-center justify-center py-20">
            <Auth onSuccess={(u) => { setUser(u); setCurrentPage(u.role === 'talent' ? 'dashboard' : 'home'); }} />
          </div>
        )}

        {currentPage === 'profile' && viewingProfile && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setCurrentPage('home')}
                className="text-indigo-600 font-medium flex items-center gap-2 hover:underline"
              >
                ← Voltar para Explorar
              </button>
              {user?.uid === viewingProfile.uid && (
                <button 
                  onClick={() => setCurrentPage('my-profile')}
                  className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-all"
                >
                  Editar Perfil
                </button>
              )}
            </div>

            {user?.uid === viewingProfile.uid && isProfileIncomplete(viewingProfile) && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-900">Seu perfil pode ser melhorado!</h4>
                    <div className="space-y-1">
                      {getProfileTips(viewingProfile).map((tip, i) => (
                        <p key={i} className="text-sm text-amber-700 flex items-center gap-2">
                          <span className="w-1 h-1 bg-amber-400 rounded-full" />
                          {tip}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setCurrentPage('my-profile')}
                  className="bg-amber-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-amber-700 transition-all shadow-lg shadow-amber-100 whitespace-nowrap"
                >
                  Completar Agora
                </button>
              </motion.div>
            )}
            
            {user?.uid === viewingProfile?.uid && (
              <UserNudges user={user} onAction={setCurrentPage} />
            )}

            <ProfileMetrics 
              views={viewingProfile?.viewsCount || 0}
              uniqueVisitors={viewingProfile?.uniqueViewsCount || 0}
              interactions={viewingProfile?.interactionsCount || 0}
            />
            
            <div className="bg-white rounded-3xl p-6 sm:p-12 border border-gray-100 shadow-sm">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl sm:text-5xl font-bold shadow-lg shadow-indigo-100 overflow-hidden flex-shrink-0">
                  {viewingProfile?.photoURL ? (
                    <img src={viewingProfile.photoURL} alt={viewingProfile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    viewingProfile?.name?.charAt(0) || '?'
                  )}
                </div>
                <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row items-center md:items-start gap-2 sm:gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900">{viewingProfile?.name}</h2>
                        {viewingProfile?.email === 'daccumbe@gmail.com' && user?.email === 'daccumbe@gmail.com' && (
                          <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-tighter">Admin</span>
                        )}
                        {viewingProfile?.isFounder && (
                          <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-[10px] font-bold" title="Usuário Fundador">
                            <ShieldCheck size={14} />
                            <span>FUNDADOR</span>
                          </div>
                        )}
                      </div>
                      {(viewingProfile?.isVerified || (viewingProfile?.isEmailVerified && viewingProfile?.isPhoneVerified)) && (
                        <div title="Perfil Verificado">
                          <CheckCircle2 size={24} className="text-blue-500 fill-blue-50" />
                        </div>
                      )}
                      {viewingProfile?.isInvestorVerified && (
                        <div title="Investidor Verificado" className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-lg text-[10px] font-bold">
                          <Check size={14} />
                          <span>INVESTIDOR VERIFICADO</span>
                        </div>
                      )}
                      {viewingProfile?.role === 'talent' && (viewingProfile.rating?.average || 0) >= 4.5 && (viewingProfile.rating?.count || 0) >= 5 && (
                        <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-[10px] font-bold" title="Top Talento">
                          <Award size={14} />
                          <span>TOP TALENTO</span>
                        </div>
                      )}
                    </div>
                    <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {viewingProfile?.role === 'talent' ? viewingProfile.category : 'Investidor'}
                    </span>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mb-4">
                    {(viewingProfile?.city || viewingProfile?.country) && (
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <MapPin size={16} className="text-indigo-600" />
                        <span>{viewingProfile.city}{viewingProfile.city && viewingProfile.country && ', '}{viewingProfile.country}</span>
                      </div>
                    )}
                    {viewingProfile?.role === 'talent' && (
                      <StarRating 
                        rating={viewingProfile.rating?.average || 0} 
                        count={viewingProfile.rating?.count || 0}
                        onRate={(stars) => handleRateTalent(viewingProfile.uid, stars)}
                        readOnly={user?.role !== 'investor' || viewingProfile.rating?.ratedBy?.includes(user?.uid || '') || user?.uid === viewingProfile.uid}
                      />
                    )}
                  </div>

                  {viewingProfile?.role === 'investor' && viewingProfile.company && (
                    <p className="text-indigo-600 font-bold mb-2 flex items-center justify-center md:justify-start gap-2">
                      <Briefcase size={18} />
                      {viewingProfile.company}
                    </p>
                  )}

                  <p className="text-gray-600 text-base sm:text-lg mb-6 leading-relaxed max-w-2xl mx-auto md:mx-0">
                    {viewingProfile?.bio || 'Sem descrição disponível.'}
                  </p>

                  <div className="mb-8">
                    <ShareProfile uid={viewingProfile?.uid || ''} name={viewingProfile?.name || ''} />
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start gap-6 sm:gap-10 mb-8 border-y border-gray-50 py-6">
                    <div className="text-center md:text-left">
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{viewingProfile?.followers?.length || 0}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Seguidores</p>
                    </div>
                    <div className="text-center md:text-left">
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{viewingProfile?.following?.length || 0}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Seguindo</p>
                    </div>
                    {viewingProfile?.role === 'talent' && (
                      <div className="text-center md:text-left">
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                          {projects.filter(p => p.talentId === viewingProfile?.uid).length}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Trabalhos</p>
                      </div>
                    )}
                    <div className="text-center md:text-left">
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center justify-center md:justify-start gap-1">
                        <Eye size={16} className="text-gray-400" />
                        {viewingProfile?.viewsCount || 0}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Visualizações</p>
                    </div>
                    <div className="text-center md:text-left">
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center justify-center md:justify-start gap-1">
                        <MessageSquare size={16} className="text-gray-400" />
                        {viewingProfile?.contactsCount || 0}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Contatos</p>
                    </div>
                  </div>
                  
                  {viewingProfile.role === 'talent' && viewingProfile.skills && viewingProfile.skills.length > 0 && (
                    <div className="mb-8">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Habilidades</p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-2">
                        {viewingProfile.skills.map(skill => (
                          <span key={skill} className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-lg">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingProfile.role === 'investor' && viewingProfile.investmentFocus && viewingProfile.investmentFocus.length > 0 && (
                    <div className="mb-8">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Foco de Investimento</p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-2">
                        {viewingProfile.investmentFocus.map(focus => (
                          <span key={focus} className="bg-indigo-50 text-indigo-600 text-xs font-medium px-3 py-1 rounded-lg">
                            {focus}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingProfile.interests && viewingProfile.interests.length > 0 && (
                    <div className="mb-8">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Interesses</p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-2">
                        {viewingProfile.interests.map(interest => (
                          <span key={interest} className="bg-amber-50 text-amber-600 text-xs font-medium px-3 py-1 rounded-lg">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingProfile.portfolio && viewingProfile.portfolio.length > 0 && (
                    <div className="mb-12">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">Portfólio</h3>
                          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mt-1">Trabalhos e Projetos</p>
                        </div>
                        <div className="h-px flex-grow bg-gray-100 mx-6 hidden sm:block"></div>
                      </div>
                      
                      {/* Images Grid */}
                      {viewingProfile.portfolio.some(item => item.type === 'image') && (
                        <div className="mb-12">
                          <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                              <ImageIcon size={16} />
                            </div>
                            <p className="text-sm font-bold text-gray-700 uppercase tracking-tight">Imagens</p>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {viewingProfile.portfolio.filter(item => item.type === 'image').map(item => (
                              <motion.div
                                key={item.id}
                                whileHover={{ scale: 1.02 }}
                                className="aspect-square rounded-2xl overflow-hidden bg-gray-100 relative group cursor-pointer shadow-sm"
                                onClick={() => window.open(item.url, '_blank')}
                              >
                                <img 
                                  src={item.url} 
                                  alt={item.title} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-4 text-center backdrop-blur-[2px]">
                                  <p className="text-white text-sm font-bold truncate w-full mb-1">{item.title}</p>
                                  {item.description && <p className="text-white/70 text-[10px] line-clamp-2 mb-3">{item.description}</p>}
                                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                                    <Eye size={16} />
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Videos Section */}
                      {viewingProfile.portfolio.some(item => item.type === 'video') && (
                        <div className="mb-12">
                          <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                              <Video size={16} />
                            </div>
                            <p className="text-sm font-bold text-gray-700 uppercase tracking-tight">Vídeos</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {viewingProfile.portfolio.filter(item => item.type === 'video').map(item => (
                              <div key={item.id} className="group">
                                <div className="aspect-video rounded-3xl overflow-hidden bg-black shadow-xl mb-4 relative">
                                  <video 
                                    src={item.url} 
                                    controls 
                                    className="w-full h-full"
                                  />
                                </div>
                                <div className="px-2">
                                  <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                                  {item.description && <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{item.description}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Documents Section */}
                      {viewingProfile.portfolio.some(item => item.type === 'document') && (
                        <div>
                          <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                              <FileText size={16} />
                            </div>
                            <p className="text-sm font-bold text-gray-700 uppercase tracking-tight">Documentos</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {viewingProfile.portfolio.filter(item => item.type === 'document').map(item => (
                              <div key={item.id} className="p-5 bg-white border border-gray-100 rounded-3xl flex items-center justify-between hover:shadow-xl hover:border-indigo-100 transition-all group">
                                <div className="flex items-center gap-4 overflow-hidden">
                                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors flex-shrink-0">
                                    <FileText size={24} />
                                  </div>
                                  <div className="overflow-hidden">
                                    <p className="text-base font-bold text-gray-900 truncate mb-0.5">{item.title}</p>
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                                      {item.fileSize ? `${(item.fileSize / (1024 * 1024)).toFixed(2)} MB` : 'DOCUMENTO'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <a 
                                    href={item.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                    title="Visualizar"
                                  >
                                    <Eye size={20} />
                                  </a>
                                  <a 
                                    href={item.url} 
                                    download={item.fileName || item.title}
                                    className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                    title="Baixar"
                                  >
                                    <Download size={20} />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row flex-wrap justify-center md:justify-start gap-4">
                    {user?.uid === viewingProfile.uid && (!auth.currentUser?.emailVerified || !viewingProfile.isPhoneVerified) && (
                      <button 
                        onClick={() => setCurrentPage('verification')}
                        className="inline-flex items-center justify-center gap-3 bg-amber-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-100 w-full sm:w-auto"
                      >
                        <AlertCircle size={20} />
                        Verificar Conta
                      </button>
                    )}

                    {user?.uid === viewingProfile.uid && viewingProfile.role === 'investor' && viewingProfile.kyc?.status !== 'approved' && (
                      <button 
                        onClick={() => setCurrentPage('kyc')}
                        className="inline-flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 w-full sm:w-auto"
                      >
                        <ShieldCheck size={20} />
                        Verificação KYC
                      </button>
                    )}

                    {user && user.uid !== viewingProfile.uid && (
                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button 
                          onClick={() => handleFollowUser(viewingProfile.uid)}
                          className={`inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg w-full sm:w-auto ${
                            user.following?.includes(viewingProfile.uid)
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-gray-100'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                          }`}
                        >
                          {user.following?.includes(viewingProfile.uid) ? (
                            <>
                              <UserMinus size={20} />
                              Deixar de Seguir
                            </>
                          ) : (
                            <>
                              <UserPlus size={20} />
                              Seguir
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => {
                            setReportTarget({ uid: viewingProfile.uid, name: viewingProfile.name });
                            setShowReportModal(true);
                          }}
                          className="inline-flex items-center justify-center gap-3 bg-white border-2 border-red-100 text-red-600 px-8 py-4 rounded-2xl font-bold hover:bg-red-50 transition-all shadow-lg shadow-red-50 w-full sm:w-auto"
                        >
                          <AlertTriangle size={20} />
                          Denunciar
                        </button>
                      </div>
                    )}

                    {user?.role === 'investor' && viewingProfile.role === 'talent' && (
                      <>
                        <button 
                          onClick={() => openChatWith(viewingProfile)}
                          className="inline-flex items-center justify-center gap-3 bg-white border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-2xl font-bold hover:bg-indigo-50 transition-all shadow-lg shadow-indigo-50 w-full sm:w-auto"
                        >
                          <MessageSquare size={20} />
                          Enviar Mensagem
                        </button>
                        {viewingProfile.whatsapp && (
                          <button 
                            onClick={() => handleContactWhatsApp(viewingProfile)}
                            className="inline-flex items-center justify-center gap-3 bg-green-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-100 w-full sm:w-auto"
                          >
                            <Phone size={20} />
                            WhatsApp
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">Trabalhos Publicados</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.filter(p => p.talentId === viewingProfile.uid).map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onViewDetails={handleSelectProject} 
                    onViewProfile={handleViewProfile}
                    onLike={handleLikeProject}
                    onRate={handleRateProject}
                    onToggleStatus={handleToggleProjectStatus}
                    currentUserId={user?.uid}
                  />
                ))}
              </div>
              {projects.filter(p => p.talentId === viewingProfile.uid).length === 0 && (
                <p className="text-gray-500 text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                  Este talento ainda não publicou nenhum trabalho.
                </p>
              )}
            </div>

            {viewedProjects.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Histórico de Projetos Visualizados</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {viewedProjects.map(project => (
                    <ProjectCard 
                      key={project.id} 
                      project={project} 
                      onViewDetails={handleSelectProject} 
                      onViewProfile={handleViewProfile}
                      onLike={handleLikeProject}
                      onRate={handleRateProject}
                      onToggleStatus={handleToggleProjectStatus}
                      currentUserId={user?.uid}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentPage === 'analytics' && (
          <Analytics projects={allProjects} />
        )}
        
        {currentPage === 'about' && (
          <About />
        )}

        {currentPage === 'verification' && user && (
          <Verification user={user} onUpdate={(u) => setUser(u)} />
        )}

        {currentPage === 'kyc' && user && user.role === 'investor' && (
          <KYCSubmission user={user} onUpdate={(u) => setUser(u)} />
        )}

        {currentPage === 'admin-kyc' && user && user.email === 'daccumbe@gmail.com' && (
          <AdminKYC />
        )}

        {currentPage === 'admin-reports' && user && user.email === 'daccumbe@gmail.com' && (
          <AdminReports />
        )}

        {currentPage === 'admin-users' && user && user.email === 'daccumbe@gmail.com' && (
          <AdminUserManagement />
        )}

        {currentPage === 'admin-settings' && user && user.email === 'daccumbe@gmail.com' && (
          <AdminSettings />
        )}

        {currentPage === 'admin-logs' && user && user.email === 'daccumbe@gmail.com' && (
          <AdminLogs />
        )}

        {currentPage === 'admin-dashboard' && user && user.email === 'daccumbe@gmail.com' && (
          <AdminDashboard onNavigate={setCurrentPage} />
        )}

        {currentPage === 'terms' && (
          <TermsOfUse />
        )}

        {currentPage === 'privacy' && (
          <PrivacyPolicy />
        )}

        {currentPage === 'chat' && user && currentConversationId && (
          <div className="max-w-4xl mx-auto">
            <Chat 
              conversationId={currentConversationId} 
              currentUser={user} 
              onReport={(target) => {
                setReportTarget(target);
                setShowReportModal(true);
              }}
            />
          </div>
        )}

        {currentPage === 'conversations' && user && (
          <ConversationsList 
            currentUser={user} 
            onSelectConversation={(id) => {
              setCurrentConversationId(id);
              setCurrentPage('chat');
            }} 
          />
        )}

        {currentPage === 'home' && (
          <div className="space-y-12">
            {recommendedProjects.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Heart className="text-rose-500 fill-rose-500" size={24} />
                    Recomendados para Você
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recommendedProjects.map(project => (
                    <ProjectCard 
                      key={project.id} 
                      project={project} 
                      onViewDetails={handleSelectProject} 
                      onViewProfile={handleViewProfile}
                      onLike={handleLikeProject}
                      onRate={handleRateProject}
                      currentUserId={user?.uid}
                      compact
                    />
                  ))}
                </div>
              </section>
            )}

            {featuredTalents.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Star className="text-yellow-500 fill-yellow-500" size={24} />
                    Talentos em Destaque
                  </h3>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                  {featuredTalents.map(talent => (
                    <button 
                      key={talent.uid}
                      onClick={() => handleViewProfile(talent.uid)}
                      className="flex-shrink-0 w-48 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-center group"
                    >
                      <div className="w-20 h-20 bg-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-100 overflow-hidden">
                        {talent.photoURL ? (
                          <img src={talent.photoURL} alt={talent.name} className="w-full h-full object-cover" />
                        ) : (
                          talent.name.charAt(0)
                        )}
                      </div>
                      <h4 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{talent.name}</h4>
                      <p className="text-xs text-indigo-600 font-medium uppercase tracking-wider mt-1">{talent.category}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <header className="text-center max-w-4xl mx-auto py-12 sm:py-20 px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 sm:mb-8 leading-tight">
                  {siteSettings?.siteName || t.heroTitle.split(' ').map((word, i) => (
                    <span key={i} className={word === 'africanos' || word === 'investidores' ? 'text-indigo-600' : ''}>
                      {word}{' '}
                    </span>
                  ))}
                </h1>
                <p className="text-xl sm:text-2xl text-gray-500 leading-relaxed mb-10 max-w-3xl mx-auto">
                  {siteSettings?.siteDescription || t.heroSubtitle}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={() => user ? setCurrentPage('my-profile') : setCurrentPage('auth')}
                    className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:-translate-y-1"
                  >
                    {t.createProfile}
                  </button>
                  <button 
                    onClick={() => user ? setCurrentPage('home') : setCurrentPage('auth')}
                    className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-600 border-2 border-indigo-50 rounded-2xl font-bold text-lg hover:border-indigo-200 transition-all transform hover:-translate-y-1"
                  >
                    {t.imInvestor}
                  </button>
                </div>
              </motion.div>
            </header>

            <div className="flex flex-col gap-6 bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative flex-[2] w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Buscar por título, talento ou descrição..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm sm:text-base"
                  />
                </div>
                <div className="relative flex-1 w-full">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Localização (ex: São Paulo)"
                    value={locationSearchQuery}
                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm sm:text-base"
                  />
                </div>
                <button 
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all border ${
                    showAdvancedFilters 
                      ? 'bg-indigo-600 text-white border-indigo-600' 
                      : 'bg-white text-gray-600 border-gray-100 hover:border-indigo-200'
                  }`}
                >
                  <ChevronDown size={18} className={`transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                  Filtros Avançados
                </button>
              </div>

              <AnimatePresence>
                {showAdvancedFilters && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-50">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Status do Projeto</label>
                        <select 
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value as any)}
                          className="w-full p-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-gray-50"
                        >
                          <option value="all">Todos os Status</option>
                          <option value="published">Publicados</option>
                          <option value="draft">Rascunhos</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Habilidades Necessárias</label>
                        <input 
                          type="text" 
                          placeholder="Ex: React, Design..."
                          value={filterSkills}
                          onChange={(e) => setFilterSkills(e.target.value)}
                          className="w-full p-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-gray-50"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Prazo (Início)</label>
                          <input 
                            type="date" 
                            value={filterDeadlineStart}
                            onChange={(e) => setFilterDeadlineStart(e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Prazo (Fim)</label>
                          <input 
                            type="date" 
                            value={filterDeadlineEnd}
                            onChange={(e) => setFilterDeadlineEnd(e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-gray-50"
                          />
                        </div>
                      </div>
                      {user?.role === 'investor' && user.investmentFocus && user.investmentFocus.length > 0 && (
                        <div className="md:col-span-3 flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                          <input 
                            type="checkbox" 
                            id="investmentFocusToggle"
                            checked={useInvestmentFocusFilter}
                            onChange={(e) => setUseInvestmentFocusFilter(e.target.checked)}
                            className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label htmlFor="investmentFocusToggle" className="text-sm font-medium text-indigo-900">
                            Filtrar por meu Foco de Investimento ({user.investmentFocus.join(', ')})
                          </label>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide flex-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                  {['Todos', ...CATEGORIES].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        selectedCategory === cat 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ordenar:</span>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="text-xs sm:text-sm font-medium text-gray-600 bg-gray-50 border-none rounded-lg px-2 sm:px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="newest">Mais Recentes</option>
                      <option value="rating">Melhor Avaliados</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avaliação:</span>
                    <select 
                      value={minRating}
                      onChange={(e) => setMinRating(Number(e.target.value) || 0)}
                      className="text-xs sm:text-sm font-medium text-gray-600 bg-gray-50 border-none rounded-lg px-2 sm:px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={0}>Todas</option>
                      <option value={4}>4+ Estrelas</option>
                      <option value={4.5}>4.5+ Estrelas</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm mb-12">
              <div className="flex flex-col lg:flex-row gap-12">
                {/* Talent of the Week */}
                <div className="lg:w-1/3">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                      <Star size={18} fill="currentColor" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Talento da Semana</h3>
                  </div>
                  
                  {talentOfTheWeek ? (
                    <motion.div 
                      whileHover={{ y: -4 }}
                      onClick={() => handleViewProfile(talentOfTheWeek.uid)}
                      className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white cursor-pointer shadow-xl shadow-indigo-100 relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 overflow-hidden">
                            {talentOfTheWeek.photoURL ? (
                              <img src={talentOfTheWeek.photoURL} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl font-bold">
                                {talentOfTheWeek.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-lg leading-tight">{talentOfTheWeek.name}</h4>
                            <p className="text-indigo-100 text-xs font-medium uppercase tracking-wider mt-1">{talentOfTheWeek.category}</p>
                          </div>
                        </div>
                        <p className="text-indigo-50 text-sm line-clamp-3 mb-4 italic">
                          "{talentOfTheWeek.bio || 'Inspirando o mundo com talento e dedicação.'}"
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star size={14} className="text-amber-300 fill-amber-300" />
                            <span className="text-sm font-bold">{talentOfTheWeek.rating?.average?.toFixed(1) || '5.0'}</span>
                          </div>
                          <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-lg uppercase tracking-tighter">Ver Perfil</span>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="bg-gray-50 rounded-3xl p-8 border-2 border-dashed border-gray-200 text-center">
                      <p className="text-gray-400 text-sm font-medium">Aguardando o próximo destaque...</p>
                    </div>
                  )}
                </div>

                {/* Featured Talents */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                        <Award size={18} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Talentos em Destaque</h3>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Crescimento Acelerado</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {featuredTalents.length > 0 ? (
                      featuredTalents.map(talent => (
                        <motion.div
                          key={talent.uid}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => handleViewProfile(talent.uid)}
                          className="bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:bg-white hover:shadow-md transition-all cursor-pointer group"
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className="w-14 h-14 rounded-xl bg-indigo-600 mb-3 overflow-hidden shadow-sm group-hover:shadow-indigo-100 transition-all">
                              {talent.photoURL ? (
                                <img src={talent.photoURL} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                  {talent.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 truncate w-full">{talent.name}</h4>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-1">{talent.category}</p>
                            {talent.isFounder && (
                              <div className="mt-2 flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter">
                                <ShieldCheck size={10} />
                                <span>Fundador</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm">Novos talentos em destaque em breve!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map(project => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onViewDetails={handleSelectProject} 
                  onViewProfile={handleViewProfile}
                  onLike={handleLikeProject}
                  onRate={handleRateProject}
                  onToggleStatus={handleToggleProjectStatus}
                  currentUserId={user?.uid}
                />
              ))}
            </div>

            {hasMoreProjects && filteredProjects.length > 0 && (
              <div className="flex justify-center py-12">
                <button 
                  onClick={() => fetchProjects()}
                  className="px-8 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
                >
                  Carregar Mais Projetos
                </button>
              </div>
            )}

            {filteredProjects.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <Search size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Nenhum projeto encontrado</h3>
                <p className="text-gray-500">Tente ajustar seus filtros ou busca.</p>
              </div>
            )}
          </div>
        )}

        {currentPage === 'dashboard' && user?.role === 'talent' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Meu Portfólio</h2>
                <p className="text-gray-500">Gerencie seus projetos e mostre seu talento ao mundo.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                <Plus size={20} />
                Novo Projeto
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.filter(p => p.talentId === user.uid).map(project => (
                <div key={project.id} className="relative group">
                  <ProjectCard 
                    project={project} 
                    onViewDetails={handleSelectProject} 
                    onViewProfile={handleViewProfile}
                    onLike={handleLikeProject}
                    onRate={handleRateProject}
                    currentUserId={user?.uid}
                  />
                  <button 
                    onClick={() => handleDeleteProject(project.id)}
                    className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {projects.filter(p => p.talentId === user.uid).length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                  <Plus size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Comece seu portfólio</h3>
                <p className="text-gray-500 mb-6">Você ainda não publicou nenhum projeto.</p>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                  Adicionar Primeiro Projeto
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Project Details Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-4xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-3xl shadow-2xl"
            >
              <button 
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-white/80 backdrop-blur-sm text-gray-500 rounded-full hover:text-gray-900 transition-colors z-10 shadow-sm"
              >
                <X size={24} />
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="aspect-video sm:aspect-square lg:aspect-auto bg-gray-100">
                  {selectedProject.imageUrl ? (
                    <img 
                      src={selectedProject.imageUrl} 
                      alt={selectedProject.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Tag size={100} strokeWidth={1} className="sm:w-[120px] sm:h-[120px]" />
                    </div>
                  )}
                </div>
                <div className="p-6 sm:p-12">
                  <div className="flex items-center gap-2 mb-4 sm:mb-6">
                    <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {selectedProject.category}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{selectedProject.title}</h2>
                  
                  {selectedProject.projectLink && (
                    <a 
                      href={selectedProject.projectLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-3 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all mb-6 w-full sm:w-auto"
                    >
                      <ExternalLink size={16} />
                      Ver Projeto Ao Vivo
                    </a>
                  )}

                  <div className="flex items-center gap-3 mb-6 sm:mb-8 p-4 bg-gray-50 rounded-2xl">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl cursor-pointer" onClick={() => handleViewProfile(selectedProject.talentId)}>
                      {selectedProject.talentName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Publicado por</p>
                      <button 
                        onClick={() => handleViewProfile(selectedProject.talentId)}
                        className="font-bold text-gray-900 hover:text-indigo-600 hover:underline text-sm sm:text-base"
                      >
                        {selectedProject.talentName}
                      </button>
                    </div>
                  </div>
                  <div className="prose prose-indigo max-w-none mb-8 sm:mb-10">
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {selectedProject.description}
                    </p>
                  </div>

                  {/* Comments Section */}
                  <div className="border-t border-gray-100 pt-8 mt-8">
                    <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <MessageSquare size={20} className="text-indigo-600" />
                      Comentários ({comments.length})
                    </h4>

                    {user ? (
                      <form onSubmit={handleAddComment} className="mb-8">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-indigo-600 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              user.name.charAt(0)
                            )}
                          </div>
                          <div className="flex-1 space-y-3">
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Adicione um comentário..."
                              className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none transition-all text-sm"
                            />
                            <div className="flex justify-end">
                              <button
                                type="submit"
                                disabled={isSubmittingComment || !newComment.trim()}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-100"
                              >
                                {isSubmittingComment ? 'Enviando...' : 'Comentar'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-2xl text-center mb-8">
                        <p className="text-sm text-gray-500">
                          Faça login para deixar um comentário.
                        </p>
                      </div>
                    )}

                    <div className="space-y-6">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4 group">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-gray-500 font-bold text-sm overflow-hidden">
                            {comment.userPhotoURL ? (
                              <img src={comment.userPhotoURL} alt={comment.userName} className="w-full h-full object-cover" />
                            ) : (
                              comment.userName.charAt(0)
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-50 p-4 rounded-2xl relative">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-gray-900">{comment.userName}</span>
                                  {comment.userRole && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                      comment.userRole === 'talent' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                                    }`}>
                                      {comment.userRole === 'talent' ? 'Talento' : 'Investidor'}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-400">
                                  {comment.createdAt?.toDate?.() 
                                    ? comment.createdAt.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) 
                                    : 'Agora mesmo'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {comment.text}
                              </p>
                              {(user?.uid === comment.userId || user?.uid === selectedProject.talentId) && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                  title="Excluir comentário"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {comments.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <p className="text-sm italic">Nenhum comentário ainda. Seja o primeiro!</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {user?.role === 'investor' && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-900">Interessado neste talento?</h4>
                      <button 
                        onClick={async () => {
                          const userDoc = await getDoc(doc(db, 'users', selectedProject.talentId));
                          if (userDoc.exists()) {
                            openChatWith(userDoc.data() as UserProfile);
                            setSelectedProject(null);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                      >
                        <MessageSquare size={20} />
                        Enviar Mensagem
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Project Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-3xl shadow-2xl p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Publicar Novo Trabalho</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Mostre seu talento para o mundo</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleAddProject} className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Título do Projeto</label>
                  <input 
                    required
                    type="text" 
                    value={newProject.title}
                    onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                    placeholder="Ex: App de Gestão Financeira"
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm sm:text-base"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Categoria</label>
                    <div className="relative">
                      <select 
                        value={newProject.category}
                        onChange={(e) => setNewProject({...newProject, category: e.target.value})}
                        className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none text-sm sm:text-base"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Descrição Detalhada</label>
                  <textarea 
                    required
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    placeholder="Descreva seu projeto, tecnologias usadas, objetivos..."
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none transition-all text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Link do Projeto (Opcional)</label>
                  <input 
                    type="url" 
                    value={newProject.projectLink}
                    onChange={(e) => setNewProject({...newProject, projectLink: e.target.value})}
                    placeholder="Ex: https://meuprojeto.com"
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Prazo do Projeto (Opcional)</label>
                  <input 
                    type="datetime-local" 
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Habilidades Necessárias (Separadas por vírgula)</label>
                  <input 
                    type="text" 
                    value={newProject.requiredSkills}
                    onChange={(e) => setNewProject({...newProject, requiredSkills: e.target.value})}
                    placeholder="Ex: React, Tailwind, Firebase"
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Status</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setNewProject({...newProject, status: 'published'})}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${
                        newProject.status === 'published' 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-white text-gray-600 border-gray-100 hover:border-indigo-200'
                      }`}
                    >
                      Publicar
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewProject({...newProject, status: 'draft'})}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${
                        newProject.status === 'draft' 
                          ? 'bg-amber-500 text-white border-amber-500' 
                          : 'bg-white text-gray-600 border-gray-100 hover:border-amber-200'
                      }`}
                    >
                      Rascunho
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Imagem de Capa</label>
                  <div className="space-y-4">
                    {!newProject.imageUrl ? (
                      <div className="grid grid-cols-1 gap-3">
                        <label className="flex flex-col items-center justify-center gap-3 bg-gray-50 border-2 border-dashed border-gray-200 p-6 sm:p-8 rounded-2xl cursor-pointer hover:bg-gray-100 hover:border-indigo-300 transition-all group">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 group-hover:text-indigo-600 transition-colors">
                            <Upload size={20} />
                          </div>
                          <div className="text-center">
                            <span className="block text-xs sm:text-sm font-bold text-gray-700">Upload de Imagem</span>
                            <span className="text-[10px] text-gray-400">PNG, JPG até 5MB</span>
                          </div>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                        <div className="relative flex items-center justify-center">
                          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                          <span className="relative px-4 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">OU</span>
                        </div>
                        <input 
                          type="url" 
                          value={newProject.imageUrl}
                          onChange={(e) => setNewProject({...newProject, imageUrl: e.target.value})}
                          placeholder="Cole o link de uma imagem aqui..."
                          className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm sm:text-base"
                        />
                      </div>
                    ) : (
                      <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 group shadow-sm">
                        <img src={newProject.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button"
                            onClick={() => setNewProject({...newProject, imageUrl: ''})}
                            className="p-3 bg-white text-red-600 rounded-2xl font-bold flex items-center gap-2 hover:bg-red-50 transition-colors text-sm"
                          >
                            <Trash2 size={18} />
                            Remover
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all text-sm sm:text-base order-2 sm:order-1"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Publicando...
                      </>
                    ) : (
                      <>
                        <Plus size={20} />
                        Publicar Projeto
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleCloseWelcome}
        onAction={handleWelcomeAction}
        userRole={user?.role || 'talent'}
      />

      <footer className="bg-white border-t border-gray-100 py-12 mt-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-lg font-bold text-gray-900">TalentLink</span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 TalentLink. Conectando o futuro hoje.</p>
          <div className="flex justify-center gap-6 mt-4">
            <button onClick={() => setCurrentPage('home')} className="text-gray-400 hover:text-indigo-600 text-sm transition-colors">Explorar</button>
            <button onClick={() => setCurrentPage('about')} className="text-gray-400 hover:text-indigo-600 text-sm transition-colors">Sobre</button>
            <button onClick={() => setCurrentPage('terms')} className="text-gray-400 hover:text-indigo-600 text-sm transition-colors">Termos de Uso</button>
            <button onClick={() => setCurrentPage('privacy')} className="text-gray-400 hover:text-indigo-600 text-sm transition-colors">Privacidade</button>
          </div>
        </div>
        <div className="absolute bottom-4 right-6 md:right-12">
          <span className="text-[10px] font-medium text-gray-300 tracking-widest uppercase opacity-60">D@C</span>
        </div>
      </footer>
      {/* Delete Success Modal */}
      <AnimatePresence>
        {showDeleteSuccess && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 mx-auto">
                <Check size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Conta Eliminada</h3>
              <p className="text-gray-500">
                Sua conta e todos os seus dados foram removidos com sucesso. Sentiremos sua falta!
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {reportTarget && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setReportTarget(null);
          }}
          targetUser={reportTarget}
          currentUser={user!}
        />
      )}
      <SupportButton />
    </div>
  );
}
