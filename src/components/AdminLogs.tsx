import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { AdminLog } from '../types';
import { 
  History, 
  User, 
  Activity, 
  Clock, 
  Search, 
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Settings,
  AlertTriangle,
  Loader2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminLogs() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  useEffect(() => {
    const q = query(
      collection(db, 'admin_logs'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminLog[];
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'admin_logs');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'suspend': return <ShieldAlert className="text-amber-500" size={18} />;
      case 'ban': return <Ban className="text-red-500" size={18} />;
      case 'reactivate': return <ShieldCheck className="text-emerald-500" size={18} />;
      case 'settings_update': return <Settings className="text-indigo-500" size={18} />;
      case 'kyc_approve': return <ShieldCheck className="text-indigo-500" size={18} />;
      case 'kyc_reject': return <AlertTriangle className="text-amber-500" size={18} />;
      case 'auto_suspend': return <Activity className="text-red-600" size={18} />;
      default: return <Activity className="text-gray-400" size={18} />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.targetName && log.targetName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    
    return matchesSearch && matchesAction;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const actions = [
    { id: 'all', label: 'Todos' },
    { id: 'suspend', label: 'Suspensões' },
    { id: 'ban', label: 'Banimentos' },
    { id: 'reactivate', label: 'Reativações' },
    { id: 'settings_update', label: 'Configurações' },
    { id: 'kyc_approve', label: 'KYC Aprovado' },
    { id: 'kyc_reject', label: 'KYC Rejeitado' },
    { id: 'auto_suspend', label: 'Auto-Suspensão' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <History className="text-indigo-600" size={32} />
          Logs do Sistema
        </h1>
        <p className="text-gray-500 mt-1">Histórico completo de ações administrativas e eventos do sistema.</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/50 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por admin, detalhes ou alvo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {actions.map(action => (
                <button
                  key={action.id}
                  onClick={() => setFilterAction(action.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
                    filterAction === action.id 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                      : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left bg-gray-50/30">
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Data/Hora</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Administrador</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Ação</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Detalhes</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Alvo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {filteredLogs.map((log) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock size={14} className="text-gray-400" />
                        {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString('pt-BR') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {log.adminName.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-gray-900">{log.adminName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {log.action.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.targetName ? (
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-900">{log.targetName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {filteredLogs.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="text-gray-300" size={32} />
              </div>
              <p className="text-gray-500 font-medium">Nenhum log encontrado para os filtros selecionados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
