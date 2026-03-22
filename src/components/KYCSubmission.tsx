import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';
import { Upload, CheckCircle, AlertCircle, Loader2, FileText, Camera, Globe } from 'lucide-react';
import { motion } from 'motion/react';

interface KYCSubmissionProps {
  user: UserProfile;
  onUpdate: (updatedUser: UserProfile) => void;
}

export default function KYCSubmission({ user, onUpdate }: KYCSubmissionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [fullName, setFullName] = useState(user.kyc?.fullName || '');
  const [country, setCountry] = useState(user.kyc?.country || '');
  const [documentURL, setDocumentURL] = useState(user.kyc?.documentURL || '');
  const [selfieURL, setSelfieURL] = useState(user.kyc?.selfieURL || '');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'document' | 'selfie') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real app, we would upload to Firebase Storage
    // For this demo, we'll use a placeholder URL and simulate upload
    setLoading(true);
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      const fakeURL = `https://picsum.photos/seed/${type}-${Date.now()}/800/600`;
      
      if (type === 'document') setDocumentURL(fakeURL);
      else setSelfieURL(fakeURL);
    } catch (err) {
      setError('Erro ao carregar arquivo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !country || !documentURL || !selfieURL) {
      setError('Por favor, preencha todos os campos e envie os documentos.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const userRef = doc(db, 'users', user.uid);
      const kycData = {
        fullName,
        country,
        documentURL,
        selfieURL,
        status: 'pending' as const,
        submittedAt: serverTimestamp()
      };

      await updateDoc(userRef, {
        kyc: kycData
      });

      onUpdate({ ...user, kyc: { ...kycData, submittedAt: new Date().toISOString() } });
      setSuccess(true);
    } catch (err) {
      console.error('KYC submission error:', err);
      setError('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (user.kyc?.status === 'approved') {
    return (
      <div className="bg-green-50 p-8 rounded-3xl border border-green-100 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-green-900 mb-2">Investidor Verificado</h3>
        <p className="text-green-700">Sua identidade foi confirmada. Você agora pode enviar propostas de investimento.</p>
      </div>
    );
  }

  if (user.kyc?.status === 'pending') {
    return (
      <div className="bg-amber-50 p-8 rounded-3xl border border-amber-100 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="animate-spin" size={32} />
        </div>
        <h3 className="text-xl font-bold text-amber-900 mb-2">Verificação em Andamento</h3>
        <p className="text-amber-700">Seus documentos estão sendo revisados pela nossa equipe. Isso geralmente leva de 24 a 48 horas.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
          <FileText size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Verificação de Investidor (KYC)</h2>
          <p className="text-gray-500">Confirme sua identidade para começar a investir em talentos.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {success ? (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-8"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Solicitação Enviada!</h3>
          <p className="text-gray-500 mb-8">Obrigado por enviar seus documentos. Nossa equipe irá revisá-los em breve.</p>
          <button 
            onClick={() => setSuccess(false)}
            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all"
          >
            Voltar ao Perfil
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nome Completo (como no documento)</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  required
                  type="text"
                  placeholder="Nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">País de Residência</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  required
                  type="text"
                  placeholder="Ex: Moçambique"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Document Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Documento de Identidade (BI/Passaporte)</label>
              <div className={`relative h-48 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-4 text-center ${documentURL ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-indigo-300 bg-gray-50'}`}>
                {documentURL ? (
                  <div className="space-y-2">
                    <img src={documentURL} alt="Documento" className="w-full h-32 object-cover rounded-lg" />
                    <button type="button" onClick={() => setDocumentURL('')} className="text-xs font-bold text-red-500 hover:underline">Remover</button>
                  </div>
                ) : (
                  <>
                    <Upload className="text-gray-400 mb-2" size={32} />
                    <p className="text-xs text-gray-500 font-medium">Clique para enviar foto do documento</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'document')}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Selfie Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Selfie com o Documento</label>
              <div className={`relative h-48 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-4 text-center ${selfieURL ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-indigo-300 bg-gray-50'}`}>
                {selfieURL ? (
                  <div className="space-y-2">
                    <img src={selfieURL} alt="Selfie" className="w-full h-32 object-cover rounded-lg" />
                    <button type="button" onClick={() => setSelfieURL('')} className="text-xs font-bold text-red-500 hover:underline">Remover</button>
                  </div>
                ) : (
                  <>
                    <Camera className="text-gray-400 mb-2" size={32} />
                    <p className="text-xs text-gray-500 font-medium">Clique para enviar sua selfie</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'selfie')}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {user.kyc?.status === 'rejected' && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-600 font-bold mb-1">Motivo da Rejeição:</p>
              <p className="text-sm text-red-500">{user.kyc.rejectionReason}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !documentURL || !selfieURL}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Enviar para Verificação'}
          </button>
        </form>
      )}
    </div>
  );
}
