import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  sendEmailVerification, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { Mail, Phone, CheckCircle, AlertCircle, Loader2, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';

interface VerificationProps {
  user: UserProfile;
  onUpdate: (updatedUser: UserProfile) => void;
}

export default function Verification({ user, onUpdate }: VerificationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Phone verification state
  const [phoneNumber, setPhoneNumber] = useState(user.phone || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  useEffect(() => {
    // Cleanup recaptcha on unmount
    return () => {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
      }
    };
  }, []);

  const handleSendEmailVerification = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    setError(null);
    try {
      await sendEmailVerification(auth.currentUser);
      setSuccess('E-mail de verificação enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      console.error('Email verification error:', err);
      setError('Erro ao enviar e-mail. Tente novamente em alguns minutos.');
    } finally {
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
  };

  const handleSendOTP = async () => {
    if (!phoneNumber) {
      setError('Por favor, insira um número de telefone válido.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setSuccess('Código enviado para o seu telefone!');
    } catch (err: any) {
      console.error('Phone verification error:', err);
      setError('Erro ao enviar código. Verifique o formato do número (ex: +258841234567).');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!verificationCode || !confirmationResult) return;
    setLoading(true);
    setError(null);
    try {
      await confirmationResult.confirm(verificationCode);
      
      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        isPhoneVerified: true,
        phone: phoneNumber
      });
      
      onUpdate({ ...user, isPhoneVerified: true, phone: phoneNumber });
      setSuccess('Telefone verificado com sucesso!');
      setConfirmationResult(null);
      setShowPhoneInput(false);
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError('Código inválido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const isFullyVerified = auth.currentUser?.emailVerified && user.isPhoneVerified;

  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
          <CheckCircle size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Verificação de Conta</h2>
          <p className="text-gray-500">Garanta a segurança da sua conta e acesse todas as funcionalidades.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl flex items-center gap-3 border border-green-100">
          <CheckCircle size={20} />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Email Verification */}
        <div className={`p-6 rounded-2xl border transition-all ${auth.currentUser?.emailVerified ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className={`p-2 rounded-xl ${auth.currentUser?.emailVerified ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                <Mail size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Verificação de E-mail</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                {auth.currentUser?.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 mt-2 uppercase tracking-wider">
                    <CheckCircle size={12} /> Verificado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 mt-2 uppercase tracking-wider">
                    <AlertCircle size={12} /> Pendente
                  </span>
                )}
              </div>
            </div>
            {!auth.currentUser?.emailVerified && (
              <button
                onClick={handleSendEmailVerification}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Verificar'}
              </button>
            )}
          </div>
        </div>

        {/* Phone Verification */}
        <div className={`p-6 rounded-2xl border transition-all ${user.isPhoneVerified ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className={`p-2 rounded-xl ${user.isPhoneVerified ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Verificação de Telefone</h3>
                <p className="text-sm text-gray-500">{user.phone || 'Nenhum número cadastrado'}</p>
                {user.isPhoneVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 mt-2 uppercase tracking-wider">
                    <CheckCircle size={12} /> Verificado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 mt-2 uppercase tracking-wider">
                    <AlertCircle size={12} /> Pendente
                  </span>
                )}
              </div>
            </div>
            {!user.isPhoneVerified && !showPhoneInput && (
              <button
                onClick={() => setShowPhoneInput(true)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all"
              >
                Configurar
              </button>
            )}
          </div>

          {showPhoneInput && !user.isPhoneVerified && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-6 pt-6 border-t border-gray-100 space-y-4"
            >
              {!confirmationResult ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Número de Telefone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="tel"
                        placeholder="+258 84 123 4567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">Use o formato internacional com o código do país (ex: +258 para Moçambique).</p>
                  </div>
                  <div id="recaptcha-container"></div>
                  <button
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Enviar Código SMS'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Código de Verificação</label>
                    <input
                      type="text"
                      placeholder="Insira o código de 6 dígitos"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center text-2xl tracking-[0.5em] font-bold"
                      maxLength={6}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmationResult(null)}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleVerifyOTP}
                      disabled={loading || verificationCode.length < 6}
                      className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : 'Confirmar Código'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {isFullyVerified && (
        <div className="mt-12 p-6 bg-indigo-600 rounded-3xl text-white text-center">
          <CheckCircle className="mx-auto mb-4" size={48} />
          <h3 className="text-xl font-bold mb-2">Sua conta está verificada!</h3>
          <p className="text-indigo-100 text-sm">Você agora tem acesso total a todas as funcionalidades do TalentLink.</p>
        </div>
      )}
    </div>
  );
}
