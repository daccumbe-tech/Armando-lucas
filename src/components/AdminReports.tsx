import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { UserReport, UserProfile } from '../types';
import { AlertTriangle, CheckCircle, XCircle, Trash2, Shield, User, Clock, Loader2, Ban, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// auth import removed as it is now part of the first line

export default function AdminReports() {
  const isAdmin = auth.currentUser?.email === 'daccumbe@gmail.com';

  if (!isAdmin) return null;
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserReport));
      setReports(reportsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reports');
    });

    return () => unsubscribe();
  }, []);

  const handleSuspendUser = async (userId: string) => {
    if (!window.confirm('Suspender este usuário temporariamente?')) return;
    
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'suspended',
        updatedAt: serverTimestamp()
      });
      alert('Usuário suspenso com sucesso.');
      setSelectedReport(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanUser = async (userId: string, reason: string) => {
    if (!window.confirm('Tem certeza que deseja banir este usuário permanentemente?')) return;
    
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'banned',
        banReason: reason,
        updatedAt: serverTimestamp()
      });

      if (selectedReport) {
        await updateDoc(doc(db, 'reports', selectedReport.id), {
          status: 'resolved'
        });
      }
      
      alert('Usuário banido permanentemente.');
      setSelectedReport(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    if (!window.confirm('Reativar a conta deste usuário?')) return;
    
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'active',
        banReason: null,
        updatedAt: serverTimestamp()
      });
      alert('Conta reativada com sucesso.');
      setSelectedReport(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'dismissed'
      });
      setSelectedReport(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm('Excluir esta denúncia permanentemente?')) return;
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      setSelectedReport(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `reports/${reportId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="text-red-600" size={32} />
            Central de Denúncias
          </h2>
          <p className="text-gray-500">Gerencie denúncias e mantenha a comunidade segura.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-sm font-bold text-gray-700">{reports.filter(r => r.status === 'pending').length} Pendentes</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {reports.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="font-bold text-gray-900">Tudo limpo!</h3>
              <p className="text-sm text-gray-500">Nenhuma denúncia registrada no momento.</p>
            </div>
          ) : (
            reports.map(report => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`w-full p-6 rounded-3xl border text-left transition-all hover:shadow-md flex items-start gap-4 ${
                  selectedReport?.id === report.id
                    ? 'border-indigo-600 bg-indigo-50/30'
                    : 'bg-white border-gray-100'
                }`}
              >
                <div className={`p-3 rounded-2xl flex-shrink-0 ${
                  report.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                  report.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      report.type === 'fraude' ? 'bg-red-100 text-red-700' :
                      report.type === 'pedido_dinheiro' ? 'bg-orange-100 text-orange-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                      {report.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      {report.createdAt?.toDate?.() ? report.createdAt.toDate().toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1 truncate">Denúncia contra {report.targetName}</h4>
                  <p className="text-sm text-gray-500 line-clamp-2">{report.description}</p>
                  <div className="mt-4 flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      Por: {report.reporterName}
                    </span>
                    <span className={`flex items-center gap-1 ${
                      report.status === 'pending' ? 'text-amber-600' :
                      report.status === 'resolved' ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      Status: {report.status}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedReport ? (
              <motion.div
                key={selectedReport.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm sticky top-24"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-xl text-gray-900">Detalhes da Denúncia</h3>
                  <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-gray-50 rounded-full">
                    <XCircle size={20} className="text-gray-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Alvo da Denúncia</label>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {selectedReport.targetName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{selectedReport.targetName}</p>
                        <p className="text-xs text-gray-500">ID: {selectedReport.targetId}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Descrição do Incidente</label>
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                      <p className="text-sm text-red-900 leading-relaxed whitespace-pre-wrap">
                        {selectedReport.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Ações Administrativas</label>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={() => handleSuspendUser(selectedReport.targetId)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 disabled:opacity-50"
                      >
                        <Ban size={18} />
                        Suspender Usuário
                      </button>

                      <button
                        onClick={() => handleBanUser(selectedReport.targetId, selectedReport.description)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50"
                      >
                        <Trash2 size={18} />
                        Banir Permanentemente
                      </button>

                      <button
                        onClick={() => handleReactivateUser(selectedReport.targetId)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 disabled:opacity-50"
                      >
                        <ShieldCheck size={18} />
                        Reativar Conta
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <button
                        onClick={() => handleDismissReport(selectedReport.id)}
                        disabled={actionLoading}
                        className="flex items-center justify-center gap-2 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                      >
                        Descartar
                      </button>
                      <button
                        onClick={() => handleDeleteReport(selectedReport.id)}
                        className="flex items-center justify-center gap-2 bg-white border border-red-100 text-red-600 py-3 rounded-xl font-bold hover:bg-red-50 transition-all"
                      >
                        <XCircle size={18} />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-gray-50 p-12 rounded-3xl border border-dashed border-gray-200 text-center h-full flex flex-col items-center justify-center">
                <ShieldCheck size={48} className="text-gray-300 mb-4" />
                <p className="text-sm text-gray-500">Selecione uma denúncia para ver os detalhes e tomar ações.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
