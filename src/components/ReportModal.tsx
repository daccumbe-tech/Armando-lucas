import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile, UserReport, ReportType } from '../types';
import { AlertTriangle, X, Shield, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: { uid: string; name: string };
  currentUser: UserProfile;
}

export default function ReportModal({ isOpen, onClose, targetUser, currentUser }: ReportModalProps) {
  const [type, setType] = useState<ReportType>('fraude');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    try {
      const reportData: Omit<UserReport, 'id'> = {
        reporterId: currentUser.uid,
        reporterName: currentUser.name,
        targetId: targetUser.uid,
        targetName: targetUser.name,
        type,
        description: description.trim(),
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'reports'), reportData);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setDescription('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Erro ao enviar denúncia. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
          >
            {success ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Denúncia Enviada</h3>
                <p className="text-gray-500">
                  Nossa equipe de moderação analisará sua denúncia em breve. Obrigado por ajudar a manter a comunidade segura.
                </p>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-red-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Denunciar Usuário</h3>
                      <p className="text-xs text-red-700 font-medium">{targetUser.name}</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-red-100 rounded-full transition-colors">
                    <X size={20} className="text-red-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tipo de Denúncia</label>
                    <div className="grid grid-cols-1 gap-2">
                      {(['fraude', 'pedido_dinheiro', 'comportamento_suspeito', 'outro'] as ReportType[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setType(t)}
                          className={`p-3 rounded-xl border text-left text-sm font-medium transition-all ${
                            type === t
                              ? 'border-red-600 bg-red-50 text-red-700'
                              : 'border-gray-100 hover:border-red-200 text-gray-600'
                          }`}
                        >
                          {t === 'fraude' && 'Fraude ou Golpe'}
                          {t === 'pedido_dinheiro' && 'Pedido Indevido de Dinheiro'}
                          {t === 'comportamento_suspeito' && 'Comportamento Suspeito'}
                          {t === 'outro' && 'Outro Motivo'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Detalhes</label>
                    <textarea
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descreva o que aconteceu com o máximo de detalhes possível..."
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-red-500 outline-none h-32 resize-none transition-all text-sm"
                    />
                  </div>

                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                    <Shield className="text-amber-600 flex-shrink-0" size={20} />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Denúncias falsas podem resultar em suspensão da sua própria conta. Use este recurso com responsabilidade.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !description.trim()}
                    className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Enviando...' : 'Enviar Denúncia'}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
