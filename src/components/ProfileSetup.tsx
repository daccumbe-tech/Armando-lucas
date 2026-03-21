import { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile, UserRole, CATEGORIES } from '../types';
import { User, Briefcase, CheckCircle } from 'lucide-react';

interface ProfileSetupProps {
  user: UserProfile;
  onComplete: (user: UserProfile) => void;
}

export default function ProfileSetup({ user, onComplete }: ProfileSetupProps) {
  const [role, setRole] = useState<UserRole>('talent');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s !== '');
      const updatedUser: UserProfile = {
        ...user,
        role,
        category: role === 'talent' ? category : undefined,
        skills: role === 'talent' ? skillsArray : undefined,
        whatsapp: whatsapp.trim() || undefined,
        bio,
        createdAt: new Date().toISOString()
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

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">Bio / Descrição</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Conte um pouco sobre você..."
          className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none"
        />
      </div>

      <button
        onClick={handleComplete}
        disabled={loading || !bio}
        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? 'Salvando...' : (
          <>
            <CheckCircle size={20} />
            Concluir Cadastro
          </>
        )}
      </button>
    </div>
  );
}
