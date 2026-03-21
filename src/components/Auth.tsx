import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import { UserProfile } from '../types';
import { Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';

interface AuthProps {
  onSuccess: (user: UserProfile) => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuthSuccess = async (firebaseUser: any) => {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      onSuccess(userDoc.data() as UserProfile);
    } else {
      // Initial setup for new user
      const newUser: UserProfile = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || name || 'Anonymous',
        email: firebaseUser.email || email || '',
        role: 'talent', // Default role
        photoURL: firebaseUser.photoURL || '',
        createdAt: new Date().toISOString()
      };
      onSuccess(newUser);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await handleAuthSuccess(result.user);
    } catch (err: any) {
      console.error('Auth error:', err);
      setError('Falha ao entrar com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(result.user, { displayName: name });
        }
        await handleAuthSuccess(result.user);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await handleAuthSuccess(result.user);
      }
    } catch (err: any) {
      console.error('Email auth error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError('Ocorreu um erro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md w-full mx-auto">
      <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6">
        <span className="text-white font-bold text-3xl">T</span>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {isSignUp ? 'Criar sua conta' : 'Bem-vindo ao TalentLink'}
      </h2>
      <p className="text-gray-500 text-center mb-8">
        Conectando jovens talentos a investidores visionários.
      </p>

      {error && (
        <div className="w-full p-4 mb-6 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleEmailAuth} className="w-full space-y-4 mb-6">
        {isSignUp && (
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              required
              type="text"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        )}
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            required
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            required
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'Aguarde...' : (isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />)}
          {loading ? 'Processando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
        </button>
      </form>

      <div className="w-full flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-gray-100"></div>
        <span className="text-xs text-gray-400 font-medium">OU</span>
        <div className="flex-1 h-px bg-gray-100"></div>
      </div>

      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 py-3 px-4 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
        Entrar com Google
      </button>

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        className="mt-6 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
      >
        {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem uma conta? Cadastre-se'}
      </button>

      <p className="mt-8 text-xs text-gray-400 text-center">
        Ao entrar, você concorda com nossos Termos de Serviço e Política de Privacidade.
      </p>
    </div>
  );
}
