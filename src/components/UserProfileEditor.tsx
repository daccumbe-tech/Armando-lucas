import React, { useState, useEffect } from 'react';
import { db, auth, sanitizeData, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { updatePassword, sendEmailVerification, reauthenticateWithCredential, EmailAuthProvider, GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth';
import { UserProfile, CATEGORIES, PortfolioItem, PortfolioItemType } from '../types';
import { 
  User, 
  Briefcase, 
  Shield, 
  Bell, 
  MessageSquare,
  Image as ImageIcon, 
  Video, 
  FileText, 
  Camera, 
  Plus, 
  X, 
  Check, 
  Trash2, 
  AlertTriangle, 
  Lock, 
  Eye, 
  EyeOff, 
  Globe, 
  MapPin, 
  Smartphone, 
  Mail, 
  Instagram, 
  Linkedin, 
  Twitter, 
  Github, 
  Link as LinkIcon,
  Loader2,
  ChevronRight,
  LogOut,
  UserX,
  CheckCircle2,
  Upload,
  Download,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, translations } from '../i18n';
import DeleteAccountModal from './DeleteAccountModal';

interface UserProfileEditorProps {
  user: UserProfile;
  onUpdate: (user: UserProfile) => void;
  onDeleteAccount: (password?: string) => Promise<void>;
  language: Language;
}

type TabType = 'profile' | 'portfolio' | 'privacy' | 'security' | 'notifications';

export default function UserProfileEditor({ user, onUpdate, onDeleteAccount, language }: UserProfileEditorProps) {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form States
  const [formData, setFormData] = useState<UserProfile>({ ...user });
  const [skillsInput, setSkillsInput] = useState(user.skills?.join(', ') || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Portfolio States
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [editingPortfolioIndex, setEditingPortfolioIndex] = useState<number | null>(null);
  const [portfolioItem, setPortfolioItem] = useState<Partial<PortfolioItem>>({
    title: '',
    type: 'image',
    description: ''
  });

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'portfolio', label: 'Portfólio', icon: ImageIcon },
    { id: 'privacy', label: 'Privacidade', icon: Eye },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'notifications', label: 'Notificações', icon: Bell },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof UserProfile] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleToggleChange = (name: string) => {
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof UserProfile] as any),
          [child]: !(prev[parent as keyof UserProfile] as any)[child]
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: !prev[name as keyof UserProfile] }));
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'photo') {
          setFormData(prev => ({ ...prev, photoURL: reader.result as string }));
        } else {
          setFormData(prev => ({ ...prev, coverURL: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const skillsArray = skillsInput.split(',').map(s => s.trim()).filter(s => s !== '');
      const updatedData = {
        ...formData,
        skills: skillsArray,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(doc(db, 'users', user.uid), sanitizeData(updatedData));
      onUpdate(updatedData);
      setSuccess('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      setError('Erro ao salvar perfil. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError(null);
        setSuccess('Senha alterada com sucesso!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Error updating password:', err);
      if (err.code === 'auth/requires-recent-login') {
        setError('Para sua segurança, você precisa fazer login novamente para alterar a senha.');
      } else {
        setPasswordError('Erro ao alterar senha. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        setSuccess('E-mail de verificação enviado!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        console.error('Error sending verification email:', err);
        setError('Erro ao enviar e-mail de verificação.');
      }
    }
  };

  const handleDeactivateAccount = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { isDeactivated: true });
      setSuccess('Conta desativada com sucesso.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      setError('Erro ao desativar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Feedback Messages */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-[100] bg-red-50 border border-red-100 p-4 rounded-2xl shadow-xl flex items-center gap-3"
          >
            <AlertTriangle className="text-red-600" size={20} />
            <p className="text-sm font-bold text-red-900">{error}</p>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-lg transition-colors">
              <X size={16} className="text-red-400" />
            </button>
          </motion.div>
        )}
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-[100] bg-green-50 border border-green-100 p-4 rounded-2xl shadow-xl flex items-center gap-3"
          >
            <CheckCircle2 className="text-green-600" size={20} />
            <p className="text-sm font-bold text-green-900">{success}</p>
            <button onClick={() => setSuccess(null)} className="p-1 hover:bg-green-100 rounded-lg transition-colors">
              <X size={16} className="text-green-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                  {formData.photoURL ? (
                    <img src={formData.photoURL} alt={formData.name} className="w-full h-full object-cover" />
                  ) : (
                    formData.name.charAt(0)
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-gray-900 truncate">{formData.name}</p>
                  <p className="text-xs text-gray-500 truncate">@{formData.username || 'usuario'}</p>
                </div>
              </div>
            </div>
            <nav className="p-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-50">
              <div className={`p-3 rounded-2xl flex items-center gap-3 ${
                user.status === 'suspended' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {user.status === 'suspended' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                <span className="text-xs font-bold uppercase tracking-wider">
                  Status: {user.status === 'suspended' ? 'Suspenso' : 'Ativo'}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[600px]">
            
            {/* Header */}
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Gerencie suas informações e configurações de conta.
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                {saveSuccess ? 'Salvo!' : 'Salvar Alterações'}
              </button>
            </div>

            <div className="p-8">
              <AnimatePresence mode="wait">
                
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    {/* Photos Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Foto de Perfil</label>
                        <div className="flex items-center gap-6">
                          <div className="relative group">
                            <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400 overflow-hidden border-2 border-dashed border-gray-200 group-hover:border-indigo-300 transition-all">
                              {formData.photoURL ? (
                                <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                <Camera size={32} />
                              )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl shadow-lg cursor-pointer hover:bg-indigo-700 transition-all">
                              <Plus size={16} />
                              <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'photo')} className="hidden" />
                            </label>
                          </div>
                          <div className="text-xs text-gray-500">
                            <p className="font-bold text-gray-700 mb-1">Upload de Foto</p>
                            <p>Recomendado: 400x400px</p>
                            <p>Formatos: JPG, PNG</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Imagem de Capa</label>
                        <div className="relative group h-24 bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 group-hover:border-indigo-300 transition-all">
                          {formData.coverURL ? (
                            <img src={formData.coverURL} alt="Cover" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <ImageIcon size={24} />
                            </div>
                          )}
                          <label className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-md text-gray-700 p-2 rounded-xl shadow-sm cursor-pointer hover:bg-white transition-all">
                            <Camera size={16} />
                            <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'cover')} className="hidden" />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Personal Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Nome Completo</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Nome de Usuário</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                          <input
                            type="text"
                            name="username"
                            value={formData.username || ''}
                            onChange={handleInputChange}
                            placeholder="usuario"
                            className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">Biografia Curta</label>
                      <textarea
                        name="bio"
                        value={formData.bio || ''}
                        onChange={handleInputChange}
                        placeholder="Conte um pouco sobre você..."
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Cidade</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city || ''}
                          onChange={handleInputChange}
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">País</label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country || ''}
                          onChange={handleInputChange}
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Professional Info */}
                    <div className="pt-8 border-t border-gray-50">
                      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Briefcase size={20} className="text-indigo-600" />
                        Informações Profissionais
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700">Categoria de Talento</label>
                          <select
                            name="category"
                            value={formData.category || ''}
                            onChange={handleInputChange}
                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700">Habilidades (separadas por vírgula)</label>
                          <input
                            type="text"
                            value={skillsInput}
                            onChange={(e) => setSkillsInput(e.target.value)}
                            placeholder="Ex: React, Design, Piano"
                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contacts */}
                    <div className="pt-8 border-t border-gray-50">
                      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Smartphone size={20} className="text-indigo-600" />
                        Contatos e Redes Sociais
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700">WhatsApp</label>
                          <input
                            type="text"
                            name="whatsapp"
                            value={formData.whatsapp || ''}
                            onChange={handleInputChange}
                            placeholder="+55 11 99999-9999"
                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700">Instagram</label>
                          <input
                            type="text"
                            name="socialLinks.instagram"
                            value={formData.socialLinks?.instagram || ''}
                            onChange={handleInputChange}
                            placeholder="@usuario"
                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700">LinkedIn</label>
                          <input
                            type="text"
                            name="socialLinks.linkedin"
                            value={formData.socialLinks?.linkedin || ''}
                            onChange={handleInputChange}
                            placeholder="linkedin.com/in/usuario"
                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700">GitHub</label>
                          <input
                            type="text"
                            name="socialLinks.github"
                            value={formData.socialLinks?.github || ''}
                            onChange={handleInputChange}
                            placeholder="github.com/usuario"
                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Portfolio Tab */}
                {activeTab === 'portfolio' && (
                  <motion.div
                    key="portfolio"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900">Seu Portfólio</h3>
                      <button
                        onClick={() => {
                          setPortfolioItem({ title: '', type: 'image', description: '' });
                          setEditingPortfolioIndex(null);
                          setShowPortfolioModal(true);
                        }}
                        className="flex items-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all"
                      >
                        <Plus size={18} />
                        Adicionar Item
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {formData.portfolio?.map((item, index) => (
                        <div key={item.id} className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden group">
                          <div className="aspect-video bg-gray-200 relative">
                            {item.type === 'image' && (
                              <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                            )}
                            {item.type === 'video' && (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Video size={48} />
                              </div>
                            )}
                            {item.type === 'document' && (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <FileText size={48} />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                              <button 
                                onClick={() => {
                                  setPortfolioItem(item);
                                  setEditingPortfolioIndex(index);
                                  setShowPortfolioModal(true);
                                }}
                                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 shadow-lg hover:scale-110 transition-all"
                              >
                                <Pencil size={18} />
                              </button>
                              <button 
                                onClick={() => {
                                  const updated = [...(formData.portfolio || [])];
                                  updated.splice(index, 1);
                                  setFormData(prev => ({ ...prev, portfolio: updated }));
                                }}
                                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-600 shadow-lg hover:scale-110 transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                          <div className="p-4">
                            <p className="font-bold text-gray-900 truncate">{item.title}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.description || 'Sem descrição'}</p>
                          </div>
                        </div>
                      ))}
                      {(!formData.portfolio || formData.portfolio.length === 0) && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                          <ImageIcon size={48} className="text-gray-200 mx-auto mb-4" />
                          <p className="text-gray-400 font-medium">Seu portfólio está vazio.</p>
                          <button 
                            onClick={() => setShowPortfolioModal(true)}
                            className="text-indigo-600 font-bold mt-2 hover:underline"
                          >
                            Comece a adicionar agora
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <motion.div
                    key="privacy"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                            <Globe size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">Perfil Público</p>
                            <p className="text-xs text-gray-500">Permitir que qualquer pessoa veja seu perfil.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleChange('privacy.isPublic')}
                          className={`w-14 h-8 rounded-full transition-all relative ${formData.privacy?.isPublic ? 'bg-indigo-600' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${formData.privacy?.isPublic ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                            <Smartphone size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">Mostrar Contatos</p>
                            <p className="text-xs text-gray-500">Exibir WhatsApp e redes sociais no perfil.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleChange('privacy.showContacts')}
                          className={`w-14 h-8 rounded-full transition-all relative ${formData.privacy?.showContacts ? 'bg-indigo-600' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${formData.privacy?.showContacts ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>

                      <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                            <Mail size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">Permissões de Mensagens</p>
                            <p className="text-xs text-gray-500">Defina quem pode iniciar conversas com você.</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <button
                            onClick={() => setFormData(prev => ({ ...prev, privacy: { ...prev.privacy!, messagePermission: 'all' } }))}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${
                              formData.privacy?.messagePermission === 'all' ? 'border-indigo-600 bg-indigo-50' : 'border-white bg-white hover:border-indigo-100'
                            }`}
                          >
                            <p className="font-bold text-sm mb-1">Todos os Usuários</p>
                            <p className="text-xs text-gray-500">Qualquer usuário logado pode enviar mensagens.</p>
                          </button>
                          <button
                            onClick={() => setFormData(prev => ({ ...prev, privacy: { ...prev.privacy!, messagePermission: 'verified_only' } }))}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${
                              formData.privacy?.messagePermission === 'verified_only' ? 'border-indigo-600 bg-indigo-50' : 'border-white bg-white hover:border-indigo-100'
                            }`}
                          >
                            <p className="font-bold text-sm mb-1">Apenas Verificados</p>
                            <p className="text-xs text-gray-500">Apenas usuários com e-mail e telefone verificados.</p>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    {/* Verification Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className={`p-6 rounded-3xl border ${auth.currentUser?.emailVerified ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${auth.currentUser?.emailVerified ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                            <Mail size={20} />
                          </div>
                          {auth.currentUser?.emailVerified ? (
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Verificado</span>
                          ) : (
                            <button onClick={handleVerifyEmail} className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline">Verificar Agora</button>
                          )}
                        </div>
                        <p className="font-bold text-gray-900">E-mail</p>
                        <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                      </div>

                      <div className={`p-6 rounded-3xl border ${user.isPhoneVerified ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${user.isPhoneVerified ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                            <Smartphone size={20} />
                          </div>
                          {user.isPhoneVerified ? (
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Verificado</span>
                          ) : (
                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Pendente</span>
                          )}
                        </div>
                        <p className="font-bold text-gray-900">Telefone</p>
                        <p className="text-xs text-gray-500 mt-1">{user.phone || 'Não cadastrado'}</p>
                      </div>
                    </div>

                    {/* Change Password */}
                    <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Lock size={20} className="text-indigo-600" />
                        Alterar Senha
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700">Nova Senha</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700">Confirmar Nova Senha</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                        {passwordError && (
                          <p className="text-xs text-red-600 font-bold flex items-center gap-2">
                            <AlertTriangle size={14} />
                            {passwordError}
                          </p>
                        )}
                        <button
                          onClick={handlePasswordChange}
                          disabled={loading || !newPassword}
                          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                        >
                          Atualizar Senha
                        </button>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-8 border-t border-gray-50">
                      <h3 className="text-lg font-bold text-red-600 mb-6 flex items-center gap-2">
                        <AlertTriangle size={20} />
                        Zona de Perigo
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          onClick={handleDeactivateAccount}
                          className="flex items-center justify-between p-6 bg-red-50 rounded-3xl border border-red-100 group hover:bg-red-100 transition-all"
                        >
                          <div>
                            <p className="font-bold text-red-900">Desativar Conta</p>
                            <p className="text-xs text-red-700">Ocultar seu perfil temporariamente.</p>
                          </div>
                          <UserX size={24} className="text-red-600 group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="flex items-center justify-between p-6 bg-red-600 rounded-3xl text-white shadow-lg shadow-red-100 group hover:bg-red-700 transition-all"
                        >
                          <div>
                            <p className="font-bold">Excluir Permanentemente</p>
                            <p className="text-xs text-red-100">Ação irreversível.</p>
                          </div>
                          <Trash2 size={24} className="group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                          <MessageSquare size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Novas Mensagens</p>
                          <p className="text-xs text-gray-500">Receber alertas quando alguém te enviar uma mensagem.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleChange('notificationSettings.messages')}
                        className={`w-14 h-8 rounded-full transition-all relative ${formData.notificationSettings?.messages ? 'bg-indigo-600' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${formData.notificationSettings?.messages ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                          <Bell size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Atualizações da Plataforma</p>
                          <p className="text-xs text-gray-500">Novidades, dicas e atualizações do sistema.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleChange('notificationSettings.updates')}
                        className={`w-14 h-8 rounded-full transition-all relative ${formData.notificationSettings?.updates ? 'bg-indigo-600' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${formData.notificationSettings?.updates ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      {/* Portfolio Modal */}
      <AnimatePresence>
        {showPortfolioModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingPortfolioIndex !== null ? 'Editar Item' : 'Novo Item'}
                </h3>
                <button 
                  onClick={() => setShowPortfolioModal(false)} 
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tipo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'image', icon: ImageIcon, label: 'Imagem' },
                      { id: 'video', icon: Video, label: 'Vídeo' },
                      { id: 'document', icon: FileText, label: 'Doc' }
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setPortfolioItem({ ...portfolioItem, type: type.id as PortfolioItemType })}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                          portfolioItem.type === type.id 
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                            : 'border-gray-100 text-gray-500 hover:border-indigo-200'
                        }`}
                      >
                        <type.icon size={20} />
                        <span className="text-[10px] font-bold uppercase">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Título</label>
                  <input
                    type="text"
                    value={portfolioItem.title}
                    onChange={(e) => setPortfolioItem({ ...portfolioItem, title: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">URL do Arquivo</label>
                  <input
                    type="text"
                    value={portfolioItem.url}
                    onChange={(e) => setPortfolioItem({ ...portfolioItem, url: e.target.value })}
                    placeholder="https://..."
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Descrição</label>
                  <textarea
                    value={portfolioItem.description}
                    onChange={(e) => setPortfolioItem({ ...portfolioItem, description: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none"
                  />
                </div>

                <button
                  onClick={() => {
                    const updated = [...(formData.portfolio || [])];
                    const newItem = {
                      id: portfolioItem.id || Date.now().toString(),
                      createdAt: portfolioItem.createdAt || new Date().toISOString(),
                      ...portfolioItem
                    } as PortfolioItem;

                    if (editingPortfolioIndex !== null) {
                      updated[editingPortfolioIndex] = newItem;
                    } else {
                      updated.push(newItem);
                    }

                    setFormData(prev => ({ ...prev, portfolio: updated }));
                    setShowPortfolioModal(false);
                  }}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteAccountModal 
        isOpen={showDeleteConfirm} 
        onClose={() => setShowDeleteConfirm(false)} 
        onConfirm={onDeleteAccount} 
      />
    </div>
  );
}
