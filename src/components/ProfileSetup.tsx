import { useState, useEffect } from 'react';
import { db, auth, googleProvider, facebookProvider, sanitizeData, storage } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { UserProfile, UserRole, CATEGORIES, PortfolioItem, PortfolioItemType } from '../types';
import { User, Briefcase, CheckCircle, Trash2, AlertTriangle, Link as LinkIcon, Globe, Facebook, Camera, Plus, X, ExternalLink, FileText, Video, Image as ImageIcon, Loader2, Upload, Download, Eye, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { linkWithPopup } from 'firebase/auth';
import { Language, translations } from '../i18n';

import DeleteAccountModal from './DeleteAccountModal';

interface ProfileSetupProps {
  user: UserProfile;
  onComplete: (user: UserProfile) => void;
  onDeleteAccount: (password?: string) => Promise<void>;
  language: Language;
}

export default function ProfileSetup({ user, onComplete, onDeleteAccount, language }: ProfileSetupProps) {
  const t = translations[language];
  const [role, setRole] = useState<UserRole>(user.role || 'talent');
  const [category, setCategory] = useState(user.category || CATEGORIES[0]);
  const [bio, setBio] = useState(user.bio || '');
  const [email, setEmail] = useState(user.email || '');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [skills, setSkills] = useState(user.skills?.join(', ') || '');
  const [whatsapp, setWhatsapp] = useState(user.whatsapp || '');
  const [city, setCity] = useState(user.city || '');
  const [country, setCountry] = useState(user.country || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [isVerified, setIsVerified] = useState(user.isVerified || false);
  const [company, setCompany] = useState(user.company || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user.interests || []);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(user.portfolio || []);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [newPortfolioItem, setNewPortfolioItem] = useState<Partial<PortfolioItem>>({ 
    title: '', 
    type: 'image',
    description: '' 
  });
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
  const [linkError, setLinkError] = useState<string | null>(null);
  const isSuspended = user.status === 'suspended' || user.status === 'banned';

  useEffect(() => {
    if (auth.currentUser) {
      const providers = auth.currentUser.providerData.map(p => p.providerId);
      setLinkedProviders(providers);
    }
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = async (file: File, type: PortfolioItemType) => {
    if (!auth.currentUser) return;
    
    // Security: Limit size (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('O arquivo é muito grande. O limite é 10MB.');
      return;
    }

    // Validate types
    const allowedImageTypes = ['image/jpeg', 'image/png'];
    const allowedVideoTypes = ['video/mp4', 'video/webm'];
    const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (type === 'image' && !allowedImageTypes.includes(file.type)) {
      alert('Formato de imagem não suportado. Use JPG ou PNG.');
      return;
    }
    if (type === 'video' && !allowedVideoTypes.includes(file.type)) {
      alert('Formato de vídeo não suportado. Use MP4 ou WebM.');
      return;
    }
    if (type === 'document' && !allowedDocTypes.includes(file.type)) {
      alert('Formato de documento não suportado. Use PDF, DOC ou DOCX.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const storageRef = ref(storage, `portfolios/${auth.currentUser.uid}/${fileName}`);
    
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise<string>((resolve, reject) => {
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = snapshot.totalBytes > 0 ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100 : 0;
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error('Upload error:', error);
          setIsUploading(false);
          alert('Erro ao fazer upload do arquivo.');
          reject(error);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setIsUploading(false);
          resolve(downloadURL);
        }
      );
    });
  };

  const addPortfolioItem = async () => {
    if (!newPortfolioItem.title || (!uploadingFile && !newPortfolioItem.url)) {
      alert('Por favor, preencha o título e selecione um arquivo.');
      return;
    }

    try {
      let finalUrl = newPortfolioItem.url || '';
      let fileInfo = editingIndex !== null ? {
        fileName: portfolio[editingIndex].fileName,
        fileSize: portfolio[editingIndex].fileSize,
        mimeType: portfolio[editingIndex].mimeType
      } : {};

      if (uploadingFile) {
        finalUrl = await handleFileUpload(uploadingFile, newPortfolioItem.type as PortfolioItemType) || '';
        fileInfo = {
          fileName: uploadingFile.name,
          fileSize: uploadingFile.size,
          mimeType: uploadingFile.type
        };
      }

      if (!finalUrl) return;

      const itemData: PortfolioItem = {
        id: editingIndex !== null ? portfolio[editingIndex].id : Date.now().toString(),
        type: newPortfolioItem.type as PortfolioItemType,
        title: newPortfolioItem.title as string,
        url: finalUrl,
        description: newPortfolioItem.description,
        ...fileInfo,
        createdAt: editingIndex !== null ? portfolio[editingIndex].createdAt : new Date().toISOString()
      };

      if (editingIndex !== null) {
        const updatedPortfolio = [...portfolio];
        updatedPortfolio[editingIndex] = itemData;
        setPortfolio(updatedPortfolio);
      } else {
        setPortfolio([...portfolio, itemData]);
      }

      setNewPortfolioItem({ title: '', type: 'image', description: '' });
      setUploadingFile(null);
      setEditingIndex(null);
      setShowPortfolioModal(false);
    } catch (err) {
      console.error('Error adding/editing portfolio item:', err);
    }
  };

  const editPortfolioItem = (index: number) => {
    const item = portfolio[index];
    setNewPortfolioItem({
      title: item.title,
      type: item.type,
      url: item.url,
      description: item.description
    });
    setEditingIndex(index);
    setShowPortfolioModal(true);
  };

  const removePortfolioItem = async (index: number) => {
    const item = portfolio[index];
    if (window.confirm('Tem certeza que deseja remover este item do seu portfólio?')) {
      // If it's a storage file, try to delete it
      if (item.url.includes('firebasestorage.googleapis.com')) {
        try {
          const fileRef = ref(storage, item.url);
          await deleteObject(fileRef);
        } catch (err) {
          console.warn('Could not delete file from storage:', err);
        }
      }
      setPortfolio(portfolio.filter((_, i) => i !== index));
    }
  };

  const handleLinkAccount = async (providerName: 'google' | 'facebook') => {
    if (!auth.currentUser) return;
    setLinkError(null);
    
    const provider = providerName === 'google' ? googleProvider : facebookProvider;
    
    try {
      await linkWithPopup(auth.currentUser, provider);
      const providers = auth.currentUser.providerData.map(p => p.providerId);
      setLinkedProviders(providers);
    } catch (err: any) {
      console.error(`Error linking ${providerName}:`, err);
      if (err.code === 'auth/credential-already-in-use') {
        setLinkError('Esta conta já está associada a outro usuário.');
      } else {
        setLinkError('Ocorreu um erro ao tentar conectar a conta.');
      }
    }
  };

  const toggleInterest = (cat: string) => {
    setSelectedInterests(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError('O e-mail é obrigatório.');
    } else if (!emailRegex.test(value)) {
      setEmailError('Por favor, insira um e-mail válido.');
    } else {
      setEmailError(null);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  const handleComplete = async () => {
    if (!photoURL) {
      alert(t.photoRequired);
      return;
    }
    if (!bio.trim()) {
      alert(t.bioRequired);
      return;
    }
    setLoading(true);
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s !== '');
      const updatedUser: UserProfile = {
        ...user,
        role,
        email: email.trim(),
        photoURL,
        category: role === 'talent' ? category : '',
        skills: role === 'talent' ? skillsArray : [],
        company: role === 'investor' ? company.trim() : '',
        investmentFocus: role === 'investor' ? selectedInterests : [],
        interests: selectedInterests,
        whatsapp: whatsapp.trim() || '',
        city: city.trim() || '',
        country: country.trim() || '',
        phone: phone.trim() || '',
        isVerified,
        location: `${city.trim()}, ${country.trim()}`,
        bio: bio.trim(),
        portfolio,
        createdAt: user.createdAt || new Date().toISOString(),
        followers: user.followers || [],
        following: user.following || []
      };
      await setDoc(doc(db, 'users', user.uid), sanitizeData(updatedUser));
      onComplete(updatedUser);
    } catch (err) {
      console.error('Profile setup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
      {isSuspended && (
        <div className="mb-8 p-6 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 flex-shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-red-900">Perfil Bloqueado</h3>
            <p className="text-sm text-red-700">
              {user.status === 'suspended' 
                ? 'Sua conta foi suspensa por atividade suspeita. Entre em contato com o suporte.' 
                : 'Sua conta foi banida permanentemente por violação dos termos.'}
            </p>
          </div>
        </div>
      )}

      <h2 className="text-3xl font-bold text-gray-900 mb-2">{t.setupProfile}</h2>
      <p className="text-gray-500 mb-8">{t.setupSubtitle}</p>

      <div className="flex flex-col items-center mb-8">
        <div className="relative group">
          <div className="w-32 h-32 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400 overflow-hidden border-2 border-dashed border-gray-200 group-hover:border-indigo-300 transition-all">
            {photoURL ? (
              <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Camera size={40} />
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl shadow-lg cursor-pointer hover:bg-indigo-700 transition-all">
            <Plus size={20} />
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>
        {!photoURL && <p className="mt-3 text-xs text-red-500 font-medium">{t.photoRequired}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => setRole('talent')}
          className={`p-6 rounded-2xl border-2 text-left transition-all ${
            role === 'talent' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
            role === 'talent' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            <User size={24} />
          </div>
          <h3 className="font-bold text-lg mb-1">{t.iAmTalent}</h3>
          <p className="text-sm text-gray-500">{t.talentDesc}</p>
        </button>

        <button
          onClick={() => setRole('investor')}
          className={`p-6 rounded-2xl border-2 text-left transition-all ${
            role === 'investor' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
            role === 'investor' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            <Briefcase size={24} />
          </div>
          <h3 className="font-bold text-lg mb-1">{t.iAmInvestor}</h3>
          <p className="text-sm text-gray-500">{t.investorDesc}</p>
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.email}</label>
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="seu@email.com"
          className={`w-full p-3 rounded-xl border focus:ring-2 outline-none transition-all ${
            emailError ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-500'
          }`}
        />
        {emailError && (
          <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
            <AlertTriangle size={12} />
            {emailError}
          </p>
        )}
      </div>

      {role === 'talent' && (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.category}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.skills}</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Ex: React, Design, Piano, Vendas"
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">{t.portfolio}</label>
              <button 
                onClick={() => setShowPortfolioModal(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus size={14} />
                {t.addPortfolio}
              </button>
            </div>
            
            <div className="space-y-3">
              {portfolio.map((item, index) => (
                <div key={item.id || index} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
                      {item.type === 'image' && <ImageIcon size={20} />}
                      {item.type === 'video' && <Video size={20} />}
                      {item.type === 'document' && <FileText size={20} />}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-gray-900 text-sm truncate">{item.title}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {item.type === 'image' ? 'Imagem' : item.type === 'video' ? 'Vídeo' : 'Documento'}
                        {item.fileSize && ` • ${(item.fileSize / (1024 * 1024)).toFixed(2)} MB`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => editPortfolioItem(index)} className="p-2 text-gray-400 hover:text-indigo-600">
                      <Pencil size={18} />
                    </button>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-indigo-600">
                      <Eye size={18} />
                    </a>
                    <button onClick={() => removePortfolioItem(index)} className="p-2 text-gray-400 hover:text-red-600">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {portfolio.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
                  {t.noPortfolio}
                </p>
              )}
            </div>
          </div>

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
                      {editingIndex !== null ? 'Editar Item' : t.portfolio}
                    </h3>
                    <button 
                      onClick={() => {
                        setShowPortfolioModal(false);
                        setEditingIndex(null);
                        setNewPortfolioItem({ title: '', type: 'image', description: '' });
                        setUploadingFile(null);
                      }} 
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t.portfolioType}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'image', icon: ImageIcon, label: t.image },
                          { id: 'video', icon: Video, label: t.video },
                          { id: 'document', icon: FileText, label: t.document }
                        ].map((type) => (
                          <button
                            key={type.id}
                            onClick={() => {
                              setNewPortfolioItem({ ...newPortfolioItem, type: type.id as PortfolioItemType });
                              setUploadingFile(null);
                            }}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                              newPortfolioItem.type === type.id 
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

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t.portfolioTitle}</label>
                      <input
                        type="text"
                        value={newPortfolioItem.title}
                        onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, title: e.target.value })}
                        placeholder={t.portfolioPlaceholder}
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t.portfolioFile}</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept={
                            newPortfolioItem.type === 'image' ? 'image/*' :
                            newPortfolioItem.type === 'video' ? 'video/mp4,video/webm' :
                            '.pdf,.doc,.docx'
                          }
                          onChange={(e) => setUploadingFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="portfolio-file"
                        />
                        <label
                          htmlFor="portfolio-file"
                          className="w-full p-4 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-300 transition-all"
                        >
                          {uploadingFile ? (
                            <div className="flex items-center gap-2 text-indigo-600 font-medium">
                              <CheckCircle size={20} />
                              <span className="text-sm truncate max-w-[200px]">{uploadingFile.name}</span>
                            </div>
                          ) : (
                            <>
                              <Upload size={24} className="text-gray-400" />
                              <span className="text-sm text-gray-500">{t.clickToSelect}</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t.portfolioDesc}</label>
                      <textarea
                        value={newPortfolioItem.description}
                        onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, description: e.target.value })}
                        placeholder={t.portfolioDescPlaceholder}
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                      />
                    </div>

                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-indigo-600 uppercase">
                          <span>{t.uploading}</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600 transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={addPortfolioItem}
                      disabled={isUploading || !newPortfolioItem.title || (!uploadingFile && !newPortfolioItem.url)}
                      className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          {t.uploading}
                        </>
                      ) : (
                        editingIndex !== null ? 'Salvar Alterações' : t.addPortfolio
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}

      {role === 'investor' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.company}</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Ex: Venture Capital Partners"
            className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {role === 'investor' ? t.investorInterests : t.interests}
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => toggleInterest(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedInterests.includes(cat)
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.phone}</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Ex: +258 84 123 4567"
          className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.whatsapp}</label>
        <input
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="Ex: +351 912 345 678"
          className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.city}</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex: São Paulo"
            className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.country}</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Ex: Brasil"
            className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.bio}</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Conte um pouco sobre você..."
          className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none"
        />
      </div>

      <div className="mb-8 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="font-bold text-blue-900 text-sm">Solicitar Verificação</p>
            <p className="text-xs text-blue-700">Aumente sua credibilidade na plataforma.</p>
          </div>
        </div>
        <button
          onClick={() => setIsVerified(!isVerified)}
          className={`w-12 h-6 rounded-full transition-all relative ${isVerified ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isVerified ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <LinkIcon size={20} className="text-indigo-600" />
          Conectar Redes Sociais
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Conecte suas contas para facilitar o login e aumentar sua visibilidade.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => handleLinkAccount('google')}
            disabled={linkedProviders.includes('google.com')}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
              linkedProviders.includes('google.com')
                ? 'bg-green-50 border-green-100 text-green-700 cursor-default'
                : 'bg-white border-gray-200 hover:border-indigo-300 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Globe size={20} className={linkedProviders.includes('google.com') ? 'text-green-600' : 'text-gray-400'} />
              <span className="font-medium">Google</span>
            </div>
            {linkedProviders.includes('google.com') ? (
              <span className="text-xs font-bold uppercase tracking-wider">Conectado</span>
            ) : (
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Conectar</span>
            )}
          </button>

          <button
            onClick={() => handleLinkAccount('facebook')}
            disabled={linkedProviders.includes('facebook.com')}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
              linkedProviders.includes('facebook.com')
                ? 'bg-green-50 border-green-100 text-green-700 cursor-default'
                : 'bg-white border-gray-200 hover:border-indigo-300 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Facebook size={20} className={linkedProviders.includes('facebook.com') ? 'text-green-600' : 'text-gray-400'} />
              <span className="font-medium">Facebook</span>
            </div>
            {linkedProviders.includes('facebook.com') ? (
              <span className="text-xs font-bold uppercase tracking-wider">Conectado</span>
            ) : (
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Conectar</span>
            )}
          </button>
        </div>
        
        {linkError && (
          <p className="mt-4 text-sm text-red-600 font-medium flex items-center gap-2">
            <AlertTriangle size={16} />
            {linkError}
          </p>
        )}
      </div>

      <button
        onClick={handleComplete}
        disabled={loading || !bio.trim() || !!emailError || isSuspended}
        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-8"
      >
        {loading ? t.saving : (
          <>
            <CheckCircle size={20} />
            {t.finishSignup}
          </>
        )}
      </button>

      <div className="pt-8 border-t border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-amber-500" />
          Zona de Perigo
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          A exclusão da conta é permanente e removerá todos os seus dados, incluindo projetos, mensagens e avaliações.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 text-red-600 font-bold text-sm hover:bg-red-50 px-4 py-2 rounded-xl transition-all border border-red-100"
        >
          <Trash2 size={18} />
          Eliminar Minha Conta
        </button>
      </div>

      <DeleteAccountModal 
        isOpen={showDeleteConfirm} 
        onClose={() => setShowDeleteConfirm(false)} 
        onConfirm={onDeleteAccount} 
      />
    </div>
  );
}
