import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { UserProfile } from '../types';
import { Check, X, Eye, Loader2, AlertCircle, User, ShieldCheck, Mail, Globe, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// auth import removed as it is now part of the first line

export default function AdminKYC() {
  const isAdmin = auth.currentUser?.email === 'daccumbe@gmail.com';

  if (!isAdmin) return null;
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingKYC();
  }, []);

  const fetchPendingKYC = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('kyc.status', '==', 'pending')
      );
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => doc.data() as UserProfile);
      setPendingUsers(users);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !rejectionReason) {
      alert('Por favor, insira um motivo para a rejeição.');
      return;
    }

    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'kyc.status': status,
        'kyc.rejectionReason': status === 'rejected' ? rejectionReason : '',
        'isInvestorVerified': status === 'approved'
      });

      setPendingUsers(prev => prev.filter(u => u.uid !== userId));
      setSelectedUser(null);
      setRejectionReason('');
      alert(status === 'approved' ? 'Investidor aprovado com sucesso!' : 'Investidor rejeitado.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-600 text-white rounded-2xl">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Painel de Verificação KYC</h2>
          <p className="text-gray-500">Analise e aprove solicitações de investidores.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List of Pending Requests */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-2">Solicitações Pendentes ({pendingUsers.length})</h3>
          {pendingUsers.length === 0 ? (
            <div className="p-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-center">
              <p className="text-gray-400 text-sm">Nenhuma solicitação pendente.</p>
            </div>
          ) : (
            pendingUsers.map(user => (
              <button
                key={user.uid}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4 ${selectedUser?.uid === user.uid ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-white border-gray-100 hover:border-indigo-200 shadow-sm'}`}
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-bold text-gray-900 truncate">{user.kyc?.fullName || user.name}</h4>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <Eye size={18} className="text-gray-400" />
              </button>
            ))
          )}
        </div>

        {/* Details View */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedUser ? (
              <motion.div
                key={selectedUser.uid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                      {selectedUser.photoURL ? (
                        <img src={selectedUser.photoURL} alt={selectedUser.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <User size={32} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{selectedUser.kyc?.fullName || selectedUser.name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-500"><Mail size={12} /> {selectedUser.email}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-500"><Globe size={12} /> {selectedUser.kyc?.country}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-full">Pendente</span>
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center justify-end gap-1">
                      <Calendar size={10} /> {selectedUser.kyc?.submittedAt ? new Date(selectedUser.kyc.submittedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Documento de Identidade</label>
                    <div className="rounded-2xl overflow-hidden border border-gray-100 aspect-video bg-gray-50">
                      <img 
                        src={selectedUser.kyc?.documentURL} 
                        alt="Documento" 
                        className="w-full h-full object-contain cursor-zoom-in"
                        onClick={() => window.open(selectedUser.kyc?.documentURL, '_blank')}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Selfie de Verificação</label>
                    <div className="rounded-2xl overflow-hidden border border-gray-100 aspect-video bg-gray-50">
                      <img 
                        src={selectedUser.kyc?.selfieURL} 
                        alt="Selfie" 
                        className="w-full h-full object-contain cursor-zoom-in"
                        onClick={() => window.open(selectedUser.kyc?.selfieURL, '_blank')}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-100 space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Motivo da Rejeição (Obrigatório se rejeitar)</label>
                    <textarea
                      placeholder="Explique por que a solicitação foi rejeitada..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-24"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleAction(selectedUser.uid, 'rejected')}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-100 transition-all disabled:opacity-50"
                    >
                      <X size={20} /> Rejeitar
                    </button>
                    <button
                      onClick={() => handleAction(selectedUser.uid, 'approved')}
                      disabled={actionLoading}
                      className="flex-[2] flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200"
                    >
                      {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                      Aprovar Investidor
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-3xl border border-dashed border-gray-200 p-12 text-center">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-gray-300 mb-6">
                  <Eye size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Selecione uma solicitação</h3>
                <p className="text-gray-500 max-w-xs">Clique em um investidor na lista ao lado para revisar seus documentos e informações.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
