import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
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
  runTransaction
} from 'firebase/firestore';
import Auth from './components/Auth';
import ProfileSetup from './components/ProfileSetup';
import ProjectCard from './components/ProjectCard';
import Chat from './components/Chat';
import { UserProfile, Project, CATEGORIES } from './types';
import Navbar from './components/Navbar';
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
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatRecipient, setChatRecipient] = useState<UserProfile | undefined>(undefined);
  const [featuredTalents, setFeaturedTalents] = useState<UserProfile[]>([]);

  // New project form state
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    imageUrl: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'users'), where('isFeatured', '==', true), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFeaturedTalents(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserProfile);
        } else {
          // New user, need setup
          setUser({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Anonymous',
            email: firebaseUser.email || '',
            role: 'talent', // Temporary
            photoURL: firebaseUser.photoURL || ''
          });
          setCurrentPage('setup');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projs);
    });

    return () => unsubscribe();
  }, []);

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

    try {
      await addDoc(collection(db, 'projects'), {
        ...newProject,
        talentId: user.uid,
        talentName: user.name,
        talentEmail: user.email,
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewProject({ title: '', description: '', category: CATEGORIES[0], imageUrl: '' });
    } catch (err) {
      console.error('Error adding project:', err);
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
        setViewingProfile(userDoc.data() as UserProfile);
        setCurrentPage('profile');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleLikeProject = async (projectId: string) => {
    if (!user) return;
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
      } else {
        await updateDoc(projectRef, {
          likedBy: [...likedBy, user.uid],
          likesCount: (project.likesCount || 0) + 1
        });
      }
    } catch (err) {
      console.error('Error liking project:', err);
    }
  };

  const handleRateProject = async (projectId: string, stars: number) => {
    if (!user) {
      alert('Faça login para avaliar este projeto!');
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
      });
    } catch (err: any) {
      console.error('Error rating project:', err);
      alert(err.message || 'Erro ao registrar avaliação');
    }
  };

  const openChatWith = (recipient: UserProfile) => {
    setChatRecipient(recipient);
    setShowChat(true);
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.talentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar 
        user={user} 
        onNavigate={setCurrentPage} 
        onOpenChat={() => setShowChat(true)}
        currentPage={currentPage} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'setup' && user && (
          <ProfileSetup user={user} onComplete={(u) => { setUser(u); setCurrentPage('home'); }} />
        )}

        {currentPage === 'auth' && !user && (
          <div className="flex items-center justify-center py-20">
            <Auth onSuccess={(u) => { setUser(u); setCurrentPage(u.role === 'talent' ? 'dashboard' : 'home'); }} />
          </div>
        )}

        {currentPage === 'profile' && viewingProfile && (
          <div className="space-y-8">
            <button 
              onClick={() => setCurrentPage('home')}
              className="text-indigo-600 font-medium flex items-center gap-2 hover:underline"
            >
              ← Voltar para Explorar
            </button>
            
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-sm">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-32 h-32 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-5xl font-bold shadow-lg shadow-indigo-100 overflow-hidden">
                  {viewingProfile.photoURL ? (
                    <img src={viewingProfile.photoURL} alt={viewingProfile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    viewingProfile.name.charAt(0)
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <h2 className="text-4xl font-extrabold text-gray-900">{viewingProfile.name}</h2>
                    <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {viewingProfile.role === 'talent' ? viewingProfile.category : 'Investidor'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-lg mb-6 leading-relaxed max-w-2xl">
                    {viewingProfile.bio || 'Sem descrição disponível.'}
                  </p>
                  
                  {viewingProfile.skills && viewingProfile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {viewingProfile.skills.map(skill => (
                        <span key={skill} className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-lg">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {user?.role === 'investor' && viewingProfile.role === 'talent' && (
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={() => openChatWith(viewingProfile)}
                        className="inline-flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                      >
                        <MessageSquare size={20} />
                        Enviar Mensagem
                      </button>
                      {viewingProfile.whatsapp && (
                        <a 
                          href={`https://wa.me/${viewingProfile.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-3 bg-green-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-100"
                        >
                          <ExternalLink size={20} />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  )}
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
                    onViewDetails={setSelectedProject} 
                    onViewProfile={handleViewProfile}
                    onLike={handleLikeProject}
                    onRate={handleRateProject}
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
          </div>
        )}

        {currentPage === 'home' && (
          <div className="space-y-12">
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

            <header className="text-center max-w-3xl mx-auto py-12">
              <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-6">
                Descubra o Próximo <span className="text-indigo-600">Grande Talento</span>
              </h1>
              <p className="text-xl text-gray-500 leading-relaxed">
                Uma vitrine para jovens mentes brilhantes e uma oportunidade única para investidores visionários.
              </p>
            </header>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar por título, talento ou descrição..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                <Filter size={18} className="text-gray-400 mr-2 hidden md:block" />
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map(project => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onViewDetails={setSelectedProject} 
                  onViewProfile={handleViewProfile}
                  onLike={handleLikeProject}
                  onRate={handleRateProject}
                  currentUserId={user?.uid}
                />
              ))}
            </div>

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
                    onViewDetails={setSelectedProject} 
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
              className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
            >
              <button 
                onClick={() => setSelectedProject(null)}
                className="absolute top-6 right-6 p-2 bg-white/80 backdrop-blur-sm text-gray-500 rounded-full hover:text-gray-900 transition-colors z-10"
              >
                <X size={24} />
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="aspect-square lg:aspect-auto bg-gray-100">
                  {selectedProject.imageUrl ? (
                    <img 
                      src={selectedProject.imageUrl} 
                      alt={selectedProject.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Tag size={120} strokeWidth={1} />
                    </div>
                  )}
                </div>
                <div className="p-8 sm:p-12">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full">
                      {selectedProject.category}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{selectedProject.title}</h2>
                  <div className="flex items-center gap-3 mb-8 p-4 bg-gray-50 rounded-2xl">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl cursor-pointer" onClick={() => handleViewProfile(selectedProject.talentId)}>
                      {selectedProject.talentName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Publicado por</p>
                      <button 
                        onClick={() => handleViewProfile(selectedProject.talentId)}
                        className="font-bold text-gray-900 hover:text-indigo-600 hover:underline"
                      >
                        {selectedProject.talentName}
                      </button>
                    </div>
                  </div>
                  <div className="prose prose-indigo max-w-none mb-10">
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {selectedProject.description}
                    </p>
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
              className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Novo Projeto</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-900">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddProject} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título do Projeto</label>
                  <input 
                    required
                    type="text" 
                    value={newProject.title}
                    onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                    placeholder="Ex: App de Gestão Financeira"
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                  <select 
                    value={newProject.category}
                    onChange={(e) => setNewProject({...newProject, category: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <textarea 
                    required
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    placeholder="Descreva seu projeto, tecnologias usadas, objetivos..."
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Projeto</label>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <label className="flex-1 flex items-center justify-center gap-2 bg-gray-50 border-2 border-dashed border-gray-200 p-4 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all">
                        <Upload size={20} className="text-gray-400" />
                        <span className="text-sm text-gray-500 font-medium">Upload de Imagem</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">OU</span>
                      <input 
                        type="url" 
                        value={newProject.imageUrl}
                        onChange={(e) => setNewProject({...newProject, imageUrl: e.target.value})}
                        placeholder="URL da imagem..."
                        className="flex-1 p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    {newProject.imageUrl && (
                      <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 group">
                        <img src={newProject.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button 
                          type="button"
                          onClick={() => setNewProject({...newProject, imageUrl: ''})}
                          className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Publicar Projeto
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="bg-white border-t border-gray-100 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-lg font-bold text-gray-900">TalentLink</span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 TalentLink. Conectando o futuro hoje.</p>
        </div>
      </footer>
      {showChat && user && (
        <Chat 
          currentUser={user} 
          recipient={chatRecipient} 
          onClose={() => {
            setShowChat(false);
            setChatRecipient(undefined);
          }} 
        />
      )}
    </div>
  );
}
