import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, getDocs, doc, updateDoc, addDoc, serverTimestamp, where, orderBy } from 'firebase/firestore';
import { UserProfile, AdminLog, UserStatus } from '../types';
import { 
  Users, 
  Search, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Ban, 
  RotateCcw, 
  MoreVertical,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended' | 'banned' | 'suspicious'>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus, reason: string) => {
    if (!auth.currentUser) return;
    
    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', userId);
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'banned') {
        updateData.isBanned = true;
        updateData.banReason = reason;
      } else {
        updateData.isBanned = false;
      }

      if (newStatus === 'active') {
        updateData.isSuspicious = false;
      }

      await updateDoc(userRef, updateData);

      // Log action
      await addDoc(collection(db, 'admin_logs'), {
        adminId: auth.currentUser.uid,
        adminName: auth.currentUser.displayName || 'Admin',
        action: newStatus === 'active' ? 'reactivate' : (newStatus === 'banned' ? 'ban' : 'suspend'),
        targetId: userId,
        targetName: users.find(u => u.uid === userId)?.name || 'Unknown',
        details: reason,
        createdAt: serverTimestamp()
      });

      // Notify user
      await addDoc(collection(db, 'notifications'), {
        recipientId: userId,
        senderId: 'system',
        senderName: 'Sistema TalentLink',
        type: newStatus === 'active' ? 'system' : 'suspension',
        message: newStatus === 'active' 
          ? 'Sua conta foi reativada. Bem-vindo de volta!' 
          : `Sua conta foi ${newStatus === 'banned' ? 'banida' : 'suspensa'}. Motivo: ${reason}`,
        read: false,
        createdAt: serverTimestamp()
      });

      await fetchUsers();
      setSelectedUser(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}/status`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'suspicious' ? u.isSuspicious : u.status === filter);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
          <p className="text-gray-500 mt-1">Gerencie permissões e status dos membros da plataforma.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {['all', 'active', 'suspended', 'banned', 'suspicious'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                filter === f 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Pesquisar por nome ou e-mail..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Usuário</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Papel</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Atividade</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-indigo-600" size={32} />
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 flex items-center gap-1">
                            {u.name}
                            {u.isSuspicious && <AlertTriangle size={14} className="text-amber-500" />}
                          </p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${
                        u.role === 'investor' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 text-xs font-bold ${
                        u.status === 'active' ? 'text-emerald-600' : 
                        u.status === 'suspended' ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {u.status === 'active' ? <CheckCircle2 size={14} /> : 
                         u.status === 'suspended' ? <AlertTriangle size={14} /> : <XCircle size={14} />}
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500 space-y-1">
                        <p className="flex items-center gap-1"><Mail size={12} /> {u.messageCount || 0} msgs</p>
                        <p className="flex items-center gap-1"><AlertTriangle size={12} /> {u.reportCount || 0} denúncias</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedUser(u)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <MoreVertical size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Nenhum usuário encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Gerenciar Usuário</h3>
                <button onClick={() => setSelectedUser(null)} className="p-2 text-gray-400 hover:text-gray-600">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                    {selectedUser.photoURL ? (
                      <img src={selectedUser.photoURL} alt={selectedUser.name} className="w-full h-full object-cover" />
                    ) : (
                      selectedUser.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{selectedUser.name}</p>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedUser.status !== 'active' && (
                    <button
                      onClick={() => handleStatusChange(selectedUser.uid, 'active', 'Reativado pelo administrador')}
                      disabled={actionLoading}
                      className="w-full flex items-center gap-3 p-4 bg-emerald-50 text-emerald-600 rounded-2xl font-bold hover:bg-emerald-100 transition-all"
                    >
                      <RotateCcw size={20} />
                      Reativar Conta
                    </button>
                  )}
                  
                  {selectedUser.status !== 'suspended' && (
                    <button
                      onClick={() => {
                        const reason = prompt('Motivo da suspensão:');
                        if (reason) handleStatusChange(selectedUser.uid, 'suspended', reason);
                      }}
                      disabled={actionLoading}
                      className="w-full flex items-center gap-3 p-4 bg-amber-50 text-amber-600 rounded-2xl font-bold hover:bg-amber-100 transition-all"
                    >
                      <ShieldAlert size={20} />
                      Suspender Conta
                    </button>
                  )}

                  {selectedUser.status !== 'banned' && (
                    <button
                      onClick={() => {
                        const reason = prompt('Motivo do banimento:');
                        if (reason) handleStatusChange(selectedUser.uid, 'banned', reason);
                      }}
                      disabled={actionLoading}
                      className="w-full flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all"
                    >
                      <Ban size={20} />
                      Banir Permanentemente
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
