import { auth, db } from '../firebase';
import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, fetchSignInMethodsForEmail, linkWithPopup } from 'firebase/auth';
import { doc, getDoc, collection, getCountFromServer } from 'firebase/firestore';
import { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { Mail, Lock, User, LogIn, UserPlus, Facebook, ShieldAlert, Ban } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

interface AuthProps {
  onSuccess: (user: UserProfile) => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Spam protection

  const handleAuthSuccess = async (firebaseUser: any) => {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      if (userData.isBanned) {
        setError(`Esta conta foi suspensa. Motivo: ${userData.banReason || 'Violação dos termos'}`);
        return;
      }
      onSuccess(userData);
    } else {
      // Initial setup for new user
      // Check if this user should be a founder (first 100 users)
      let isFounder = false;
      try {
        const snapshot = await getCountFromServer(collection(db, 'users'));
        if (snapshot.data().count < 100) {
          isFounder = true;
        }
      } catch (err) {
        console.error('Error checking user count:', err);
      }

      const newUser: UserProfile = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || name || 'Anonymous',
        email: firebaseUser.email || email || '',
        role: 'talent', // Default role
        photoURL: firebaseUser.photoURL || '',
        createdAt: new Date().toISOString(),
        isBanned: false,
        isFounder: isFounder,
        welcomeShown: false
      };
      onSuccess(newUser);
    }
  };

  const handleSocialSignIn = async (providerType: 'google' | 'facebook') => {
    setLoading(true);
    setError(null);
    try {
      const provider = providerType === 'google' ? new GoogleAuthProvider() : new FacebookAuthProvider();
      
      // Force account selection for Google to avoid some common issues
      if (provider instanceof GoogleAuthProvider) {
        provider.setCustomParameters({ prompt: 'select_account' });
      }
      
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await handleAuthSuccess(result.user);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/popup-blocked') {
        setError('O popup foi bloqueado pelo navegador. Por favor, permita popups para este site.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('O login foi cancelado. Tente novamente.');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('Já existe uma conta com este e-mail usando outro método de login. Tente entrar com o método original.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Este domínio não está autorizado para login social. Use e-mail e senha.');
      } else {
        setError(`Falha ao entrar com ${providerType === 'google' ? 'Google' : 'Facebook'}. Tente usar e-mail e senha.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      setError('Muitas tentativas. Tente novamente mais tarde.');
      return;
    }

    if (honeypot) {
      console.warn('Spam detected');
      return;
    }

    if (!captchaToken) {
      setError('Por favor, complete o reCAPTCHA.');
      return;
    }

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
        setLoginAttempts(0);
        await handleAuthSuccess(result.user);
      }
    } catch (err: any) {
      console.error('Email auth error:', err);
      
      if (!isSignUp) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        if (newAttempts >= 5) {
          setIsLocked(true);
          setTimeout(() => setIsLocked(false), 300000); // 5 min lock
        }
      }

      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/invalid-credential') {
        setError(`E-mail ou senha incorretos. Tentativas: ${loginAttempts + 1}/5`);
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Sua conta foi temporariamente bloqueada.');
      } else {
        setError('Ocorreu um erro. Tente novamente.');
      }
      
      // Reset captcha on error
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
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

        {/* Honeypot field - hidden from users */}
        <div className="hidden">
          <input
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="flex justify-center py-2">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // Test key - User should replace with real one
            onChange={(token) => setCaptchaToken(token)}
            size="normal"
          />
        </div>

        <button
          type="submit"
          disabled={loading || isLocked || !captchaToken}
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

      <div className="w-full space-y-3">
        <button
          onClick={() => handleSocialSignIn('google')}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 py-3 px-4 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Entrar com Google
        </button>

        <button
          onClick={() => handleSocialSignIn('facebook')}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white py-3 px-4 rounded-xl font-medium hover:bg-[#166fe5] transition-colors disabled:opacity-50"
        >
          <Facebook size={20} fill="white" />
          Entrar com Facebook
        </button>
      </div>

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
