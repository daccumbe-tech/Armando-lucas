import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { SiteSettings } from '../types';
import { 
  Settings, 
  Save, 
  Shield, 
  Globe, 
  AlertTriangle, 
  CheckCircle2,
  X,
  ShieldCheck,
  Loader2,
  Lock,
  Unlock,
  Mail,
  MessageSquare,
  Users,
  DollarSign,
  FileText,
  Bell,
  Monitor,
  Layout,
  Smartphone,
  Image as ImageIcon,
  Languages,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Plus,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type SettingsTab = 'site' | 'language' | 'contact' | 'security' | 'users' | 'monetization' | 'content' | 'notifications';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('site');
  const [settings, setSettings] = useState<SiteSettings>({
    id: 'global',
    siteName: 'TalentLink',
    siteSlogan: 'Conectando talentos e investidores.',
    siteDescription: 'A plataforma definitiva para encontrar talentos e oportunidades de investimento.',
    logoURL: '',
    faviconURL: '',
    defaultLanguage: 'pt',
    supportedLanguages: ['pt', 'en'],
    defaultRegion: 'Brasil',
    officialEmail: 'contato@talentlink.com',
    whatsappNumber: '+5511999999999',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: ''
    },
    autoContactMessage: 'Olá! Recebemos sua mensagem e entraremos em contato em breve.',
    enableEmailVerification: true,
    enablePhoneVerification: false,
    enableReCAPTCHA: false,
    reportLimitForSuspension: 3,
    enableSuspiciousWordDetection: true,
    suspiciousWords: ['fraude', 'golpe', 'dinheiro', 'investimento falso'],
    allowPublicRegistration: true,
    requireManualApproval: false,
    dailyMessageLimit: 50,
    maxUploadsPerDay: 10,
    enablePremiumMode: false,
    freeUserLimits: {
      maxProjects: 3,
      maxMessagesPerDay: 10
    },
    premiumBenefits: ['Projetos ilimitados', 'Destaque no perfil', 'Suporte prioritário'],
    maxUploadSizeMB: 10,
    allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    enableAutoModeration: true,
    enableAutoNotifications: true,
    defaultNotificationMessages: {
      security: 'Aviso de segurança: Nunca compartilhe sua senha.',
      alert: 'Novo alerta do sistema.',
      welcome: 'Bem-vindo ao TalentLink!'
    },
    updatedAt: null,
    updatedBy: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newBenefit, setNewBenefit] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'site_settings', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as SiteSettings;
        setSettings({
          ...settings,
          ...data,
          // Ensure nested objects exist
          socialLinks: { ...settings.socialLinks, ...data.socialLinks },
          freeUserLimits: { ...settings.freeUserLimits, ...data.freeUserLimits },
          defaultNotificationMessages: { ...settings.defaultNotificationMessages, ...data.defaultNotificationMessages }
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setSaving(true);
    try {
      const updatedSettings = {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser.uid
      };
      await setDoc(doc(db, 'site_settings', 'global'), updatedSettings);
      
      // Log action
      await addDoc(collection(db, 'admin_logs'), {
        adminId: auth.currentUser.uid,
        adminName: auth.currentUser.displayName || 'Admin',
        action: 'settings_update',
        details: 'Atualização abrangente das configurações do site',
        createdAt: serverTimestamp()
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'site_settings/global');
    } finally {
      setSaving(false);
    }
  };

  const addSuspiciousWord = () => {
    if (newWord && !settings.suspiciousWords.includes(newWord)) {
      setSettings({
        ...settings,
        suspiciousWords: [...settings.suspiciousWords, newWord]
      });
      setNewWord('');
    }
  };

  const removeSuspiciousWord = (word: string) => {
    setSettings({
      ...settings,
      suspiciousWords: settings.suspiciousWords.filter(w => w !== word)
    });
  };

  const addBenefit = () => {
    if (newBenefit && !settings.premiumBenefits.includes(newBenefit)) {
      setSettings({
        ...settings,
        premiumBenefits: [...settings.premiumBenefits, newBenefit]
      });
      setNewBenefit('');
    }
  };

  const removeBenefit = (benefit: string) => {
    setSettings({
      ...settings,
      premiumBenefits: settings.premiumBenefits.filter(b => b !== benefit)
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const tabs = [
    { id: 'site', label: 'Site', icon: Layout },
    { id: 'language', label: 'Idioma', icon: Languages },
    { id: 'contact', label: 'Contacto', icon: Mail },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'monetization', label: 'Monetização', icon: DollarSign },
    { id: 'content', label: 'Conteúdo', icon: FileText },
    { id: 'notifications', label: 'Notificações', icon: Bell },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="text-indigo-600" size={32} />
            Painel de Configurações
          </h1>
          <p className="text-gray-500 mt-1">Controle total sobre a plataforma e regras do sistema.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100"
              >
                <CheckCircle2 size={18} />
                Salvo!
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Salvar Tudo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'bg-white text-gray-500 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'site' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Layout size={24} className="text-indigo-600" />
                      Informações do Site
                    </h2>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome do Site</label>
                        <input
                          type="text"
                          value={settings.siteName}
                          onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Slogan / Tagline</label>
                        <input
                          type="text"
                          value={settings.siteSlogan}
                          onChange={(e) => setSettings({ ...settings, siteSlogan: e.target.value })}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Descrição Curta</label>
                        <textarea
                          value={settings.siteDescription}
                          onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">URL do Logo</label>
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={settings.logoURL}
                              onChange={(e) => setSettings({ ...settings, logoURL: e.target.value })}
                              placeholder="https://exemplo.com/logo.png"
                              className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100">
                              {settings.logoURL ? <img src={settings.logoURL} alt="Logo" className="max-w-full max-h-full object-contain" /> : <ImageIcon className="text-gray-300" />}
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">URL do Favicon</label>
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={settings.faviconURL}
                              onChange={(e) => setSettings({ ...settings, faviconURL: e.target.value })}
                              placeholder="https://exemplo.com/favicon.ico"
                              className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100">
                              {settings.faviconURL ? <img src={settings.faviconURL} alt="Favicon" className="w-8 h-8 object-contain" /> : <ImageIcon className="text-gray-300" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'language' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Languages size={24} className="text-indigo-600" />
                      Idioma e Região
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Idioma Padrão</label>
                        <select
                          value={settings.defaultLanguage}
                          onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value as 'pt' | 'en' })}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        >
                          <option value="pt">Português</option>
                          <option value="en">Inglês</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Região Padrão</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            value={settings.defaultRegion}
                            onChange={(e) => setSettings({ ...settings, defaultRegion: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-4">Idiomas Suportados</label>
                      <div className="flex flex-wrap gap-3">
                        {['pt', 'en', 'es', 'fr'].map(lang => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => {
                              const supported = settings.supportedLanguages.includes(lang)
                                ? settings.supportedLanguages.filter(l => l !== lang)
                                : [...settings.supportedLanguages, lang];
                              if (supported.length > 0) setSettings({ ...settings, supportedLanguages: supported });
                            }}
                            className={`px-6 py-3 rounded-xl font-bold transition-all border ${
                              settings.supportedLanguages.includes(lang)
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                : 'bg-white border-gray-100 text-gray-400'
                            }`}
                          >
                            {lang.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'contact' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Mail size={24} className="text-indigo-600" />
                      Contacto e Comunicação
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email Oficial</label>
                        <input
                          type="email"
                          value={settings.officialEmail}
                          onChange={(e) => setSettings({ ...settings, officialEmail: e.target.value })}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">WhatsApp</label>
                        <input
                          type="text"
                          value={settings.whatsappNumber}
                          onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-700">Redes Sociais</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                          <Facebook className="text-blue-600" size={20} />
                          <input
                            type="text"
                            placeholder="Facebook URL"
                            value={settings.socialLinks.facebook}
                            onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, facebook: e.target.value } })}
                            className="flex-1 bg-transparent outline-none text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                          <Instagram className="text-pink-600" size={20} />
                          <input
                            type="text"
                            placeholder="Instagram URL"
                            value={settings.socialLinks.instagram}
                            onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, instagram: e.target.value } })}
                            className="flex-1 bg-transparent outline-none text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                          <Twitter className="text-blue-400" size={20} />
                          <input
                            type="text"
                            placeholder="Twitter URL"
                            value={settings.socialLinks.twitter}
                            onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, twitter: e.target.value } })}
                            className="flex-1 bg-transparent outline-none text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                          <Linkedin className="text-blue-700" size={20} />
                          <input
                            type="text"
                            placeholder="LinkedIn URL"
                            value={settings.socialLinks.linkedin}
                            onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, linkedin: e.target.value } })}
                            className="flex-1 bg-transparent outline-none text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Mensagem Automática de Contacto</label>
                      <textarea
                        value={settings.autoContactMessage}
                        onChange={(e) => setSettings({ ...settings, autoContactMessage: e.target.value })}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Shield size={24} className="text-indigo-600" />
                      Segurança
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, enableEmailVerification: !settings.enableEmailVerification })}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${settings.enableEmailVerification ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
                      >
                        <span className="font-bold">Verificação por Email</span>
                        <div className={`w-12 h-6 rounded-full relative transition-all ${settings.enableEmailVerification ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.enableEmailVerification ? 'right-1' : 'left-1'}`} />
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, enablePhoneVerification: !settings.enablePhoneVerification })}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${settings.enablePhoneVerification ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
                      >
                        <span className="font-bold">Verificação por Telefone</span>
                        <div className={`w-12 h-6 rounded-full relative transition-all ${settings.enablePhoneVerification ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.enablePhoneVerification ? 'right-1' : 'left-1'}`} />
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, enableReCAPTCHA: !settings.enableReCAPTCHA })}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${settings.enableReCAPTCHA ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
                      >
                        <span className="font-bold">Ativar reCAPTCHA</span>
                        <div className={`w-12 h-6 rounded-full relative transition-all ${settings.enableReCAPTCHA ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.enableReCAPTCHA ? 'right-1' : 'left-1'}`} />
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, enableSuspiciousWordDetection: !settings.enableSuspiciousWordDetection })}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${settings.enableSuspiciousWordDetection ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
                      >
                        <span className="font-bold">Detecção de Palavras Suspeitas</span>
                        <div className={`w-12 h-6 rounded-full relative transition-all ${settings.enableSuspiciousWordDetection ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.enableSuspiciousWordDetection ? 'right-1' : 'left-1'}`} />
                        </div>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Limite de Denúncias p/ Suspensão</label>
                        <input
                          type="number"
                          value={settings.reportLimitForSuspension || 0}
                          onChange={(e) => setSettings({ ...settings, reportLimitForSuspension: parseInt(e.target.value) || 0 })}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-700">Palavras Suspeitas Monitoradas</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newWord}
                          onChange={(e) => setNewWord(e.target.value)}
                          placeholder="Adicionar palavra..."
                          className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                          onKeyPress={(e) => e.key === 'Enter' && addSuspiciousWord()}
                        />
                        <button
                          type="button"
                          onClick={addSuspiciousWord}
                          className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {settings.suspiciousWords.map(word => (
                          <span key={word} className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                            {word}
                            <button onClick={() => removeSuspiciousWord(word)} className="text-gray-400 hover:text-red-500">
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'users' && (
                  <div className="space-y-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Users size={24} className="text-indigo-600" />
                      Gestão de Usuários
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, allowPublicRegistration: !settings.allowPublicRegistration })}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${settings.allowPublicRegistration ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}
                      >
                        <span className="font-bold">Cadastro Público</span>
                        <div className={`w-12 h-6 rounded-full relative transition-all ${settings.allowPublicRegistration ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.allowPublicRegistration ? 'right-1' : 'left-1'}`} />
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, requireManualApproval: !settings.requireManualApproval })}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${settings.requireManualApproval ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
                      >
                        <span className="font-bold">Aprovação Manual</span>
                        <div className={`w-12 h-6 rounded-full relative transition-all ${settings.requireManualApproval ? 'bg-amber-500' : 'bg-gray-300'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.requireManualApproval ? 'right-1' : 'left-1'}`} />
                        </div>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Limite Diário de Mensagens</label>
                        <input
                          type="number"
                          value={settings.dailyMessageLimit || 0}
                          onChange={(e) => setSettings({ ...settings, dailyMessageLimit: parseInt(e.target.value) || 0 })}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Máximo de Uploads p/ Dia</label>
                        <input
                          type="number"
                          value={settings.maxUploadsPerDay || 0}
                          onChange={(e) => setSettings({ ...settings, maxUploadsPerDay: parseInt(e.target.value) || 0 })}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'monetization' && (
                  <div className="space-y-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <DollarSign size={24} className="text-indigo-600" />
                      Monetização
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, enablePremiumMode: !settings.enablePremiumMode })}
                      className={`w-full flex items-center justify-between p-6 rounded-3xl border transition-all ${settings.enablePremiumMode ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${settings.enablePremiumMode ? 'bg-white/20' : 'bg-gray-200'}`}>
                          <ShieldCheck size={24} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-lg">Modo Premium</p>
                          <p className={`text-sm ${settings.enablePremiumMode ? 'text-indigo-100' : 'text-gray-400'}`}>Ativar assinaturas e benefícios exclusivos.</p>
                        </div>
                      </div>
                      <div className={`w-14 h-7 rounded-full relative transition-all ${settings.enablePremiumMode ? 'bg-white/30' : 'bg-gray-300'}`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.enablePremiumMode ? 'right-1' : 'left-1'}`} />
                      </div>
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h3 className="font-bold text-gray-900">Limites p/ Usuários Gratuitos</h3>
                        <div className="space-y-4 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Máximo de Projetos</label>
                            <input
                              type="number"
                              value={settings.freeUserLimits.maxProjects || 0}
                              onChange={(e) => setSettings({ ...settings, freeUserLimits: { ...settings.freeUserLimits, maxProjects: parseInt(e.target.value) || 0 } })}
                              className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mensagens p/ Dia</label>
                            <input
                              type="number"
                              value={settings.freeUserLimits.maxMessagesPerDay || 0}
                              onChange={(e) => setSettings({ ...settings, freeUserLimits: { ...settings.freeUserLimits, maxMessagesPerDay: parseInt(e.target.value) || 0 } })}
                              className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-bold text-gray-900">Benefícios Premium</h3>
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newBenefit}
                              onChange={(e) => setNewBenefit(e.target.value)}
                              placeholder="Adicionar benefício..."
                              className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                              onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
                            />
                            <button
                              type="button"
                              onClick={addBenefit}
                              className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
                            >
                              <Plus size={20} />
                            </button>
                          </div>
                          <div className="space-y-2">
                            {settings.premiumBenefits.map(benefit => (
                              <div key={benefit} className="flex items-center justify-between p-3 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium border border-indigo-100">
                                {benefit}
                                <button onClick={() => removeBenefit(benefit)} className="text-indigo-300 hover:text-red-500">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'content' && (
                  <div className="space-y-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <FileText size={24} className="text-indigo-600" />
                      Gestão de Conteúdo
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Limite de Upload (MB)</label>
                        <input
                          type="number"
                          value={settings.maxUploadSizeMB || 0}
                          onChange={(e) => setSettings({ ...settings, maxUploadSizeMB: parseInt(e.target.value) || 0 })}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Moderação Automática</label>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, enableAutoModeration: !settings.enableAutoModeration })}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${settings.enableAutoModeration ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
                        >
                          <span className="font-bold">Ativar Moderação</span>
                          <div className={`w-12 h-6 rounded-full relative transition-all ${settings.enableAutoModeration ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.enableAutoModeration ? 'right-1' : 'left-1'}`} />
                          </div>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-4">Tipos de Arquivos Permitidos</label>
                      <div className="flex flex-wrap gap-3">
                        {['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf', 'application/zip'].map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              const allowed = settings.allowedFileTypes.includes(type)
                                ? settings.allowedFileTypes.filter(t => t !== type)
                                : [...settings.allowedFileTypes, type];
                              setSettings({ ...settings, allowedFileTypes: allowed });
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                              settings.allowedFileTypes.includes(type)
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                : 'bg-white border-gray-100 text-gray-400'
                            }`}
                          >
                            {type.split('/')[1].toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Bell size={24} className="text-indigo-600" />
                      Notificações
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, enableAutoNotifications: !settings.enableAutoNotifications })}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${settings.enableAutoNotifications ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
                    >
                      <span className="font-bold">Notificações Automáticas</span>
                      <div className={`w-12 h-6 rounded-full relative transition-all ${settings.enableAutoNotifications ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.enableAutoNotifications ? 'right-1' : 'left-1'}`} />
                      </div>
                    </button>

                    <div className="space-y-6">
                      <h3 className="font-bold text-gray-900">Mensagens Padrão</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mensagem de Segurança</label>
                          <textarea
                            value={settings.defaultNotificationMessages.security}
                            onChange={(e) => setSettings({ ...settings, defaultNotificationMessages: { ...settings.defaultNotificationMessages, security: e.target.value } })}
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-20 resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mensagem de Alerta</label>
                          <textarea
                            value={settings.defaultNotificationMessages.alert}
                            onChange={(e) => setSettings({ ...settings, defaultNotificationMessages: { ...settings.defaultNotificationMessages, alert: e.target.value } })}
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-20 resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mensagem de Boas-vindas</label>
                          <textarea
                            value={settings.defaultNotificationMessages.welcome}
                            onChange={(e) => setSettings({ ...settings, defaultNotificationMessages: { ...settings.defaultNotificationMessages, welcome: e.target.value } })}
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-20 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
