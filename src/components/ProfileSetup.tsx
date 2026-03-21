import { useState, useEffect } from 'react';
import { db, auth, googleProvider, facebookProvider } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { UserProfile, UserRole, CATEGORIES } from '../types';
import { User, Briefcase, CheckCircle, Trash2, AlertTriangle, Link as LinkIcon, Globe, Facebook } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { linkWithPopup, fetchSignInMethodsForEmail } from 'firebase/auth';

interface ProfileSetupProps {
  user: UserProfile;
  onComplete: (user: UserProfile) => void;
  onDeleteAccount: () => Promise<void>;
}

export default function ProfileSetup({ user, onComplete, onDeleteAccount }: ProfileSetupProps) {
  const [role, setRole] = useState<UserRole>(user.role || 'talent');
  const [category, setCategory] = useState(user.category || CATEGORIES[0]);
  const [bio, setBio] = useState(user.bio || '');
  const [skills, setSkills] = useState(user.skills?.join(', ') || '');
  const [whatsapp, setWhatsapp] = useState(user.whatsapp || '');
  const [city, setCity] = useState(user.city || '');
  const [country, setCountry] = useState(user.country || '');
  const [isVerified, setIsVerified] = useState(user.isVerified || false);
  const [company, setCompany] = useState(user.company || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user.interests || []);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.currentUser) {
      const providers = auth.currentUser.providerData.map(p => p.providerId);
      setLinkedProviders(providers);
    }
  }, []);

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

  const handleComplete = async () => {
    setLoading(true);
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s !== '');
      const updatedUser: UserProfile = {
        ...user,
        role,
        category: role === 'talent' ? category : undefined,
        skills: role === 'talent' ? skillsArray : undefined,
        company: role === 'investor' ? company.trim() : undefined,
        investmentFocus: role === 'investor' ? selectedInterests : undefined,
        interests: selectedInterests,
        whatsapp: whatsapp.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        isVerified,
        location: `${city.trim()}, ${country.trim()}`,
        bio,
        createdAt: user.createdAt || new Date().toISOString(),
        followers: user.followers || [],
        following: user.following || []
      };
      await setDoc(doc(db, 'users', user.uid), updatedUser);
      onComplete(updatedUser);
    } catch (err) {
      console.error('Profile setup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete seu Perfil</h2>
      <p className="text-gray-500 mb-8">Diga-nos quem você é e o que você faz.</p>

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
          <h3 className="font-bold text-lg mb-1">Sou um Talento</h3>
          <p className="text-sm text-gray-500">Quero mostrar meu trabalho e encontrar oportunidades.</p>
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
          <h3 className="font-bold text-lg mb-1">Sou um Investidor</h3>
          <p className="text-sm text-gray-500">Quero descobrir novos talentos e investir em projetos.</p>
        </button>
      </div>

      {role === 'talent' && (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria Principal</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Habilidades (separadas por vírgula)</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Ex: React, Design, Piano, Vendas"
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </>
      )}

      {role === 'investor' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Empresa / Organização (Opcional)</label>
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
          {role === 'investor' ? 'Áreas de Interesse para Investimento' : 'Seus Interesses'}
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
        <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp (Opcional)</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex: São Paulo"
            className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">País</label>
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
        <label className="block text-sm font-medium text-gray-700 mb-2">Bio / Descrição</label>
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
        disabled={loading || !bio}
        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-8"
      >
        {loading ? 'Salvando...' : (
          <>
            <CheckCircle size={20} />
            Concluir Cadastro
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

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-6 mx-auto">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Tem certeza?</h3>
              <p className="text-gray-500 text-center mb-8">
                Esta ação é <span className="font-bold text-red-600">irreversível</span>. Todos os seus dados serão apagados permanentemente dos nossos servidores.
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await onDeleteAccount();
                    } catch (err) {
                      console.error('Error deleting account:', err);
                      setIsDeleting(false);
                      setShowDeleteConfirm(false);
                    }
                  }}
                  disabled={isDeleting}
                  className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-100"
                >
                  {isDeleting ? 'Eliminando...' : (
                    <>
                      <Trash2 size={20} />
                      Sim, Eliminar Tudo
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="w-full bg-gray-100 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
