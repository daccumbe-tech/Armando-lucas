import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { 
  AlertCircle, 
  Clock, 
  Search, 
  Trash2, 
  Loader2, 
  User, 
  Globe, 
  Monitor,
  ChevronDown,
  ChevronUp,
  XCircle,
  Bug
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface ErrorLog {
  id: string;
  userId?: string;
  userName?: string;
  errorMessage: string;
  errorStack?: string;
  componentStack?: string;
  url?: string;
  userAgent?: string;
  timestamp: Timestamp;
}

export default function AdminErrorLogs() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'error_logs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ErrorLog[];
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'error_logs');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este log de erro?')) return;
    
    try {
      await deleteDoc(doc(db, 'error_logs', id));
      toast.success('Log excluído com sucesso.');
    } catch (err) {
      console.error('Error deleting log:', err);
      toast.error('Erro ao excluir log.');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Tem certeza que deseja excluir TODOS os logs de erro?')) return;
    
    try {
      // For simplicity in this environment, we'll just delete the ones currently in view
      // In a real app, you'd use a cloud function or batch delete
      const deletePromises = logs.map(log => deleteDoc(doc(db, 'error_logs', log.id)));
      await Promise.all(deletePromises);
      toast.success('Todos os logs visíveis foram excluídos.');
    } catch (err) {
      console.error('Error clearing logs:', err);
      toast.error('Erro ao limpar logs.');
    }
  };

  const filteredLogs = logs.filter(log => 
    log.errorMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.userName && log.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.url && log.url.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bug className="text-red-600" size={32} />
            Logs de Erros Automáticos
          </h1>
          <p className="text-gray-500 mt-1">Detecção automática de falhas e exceções no sistema.</p>
        </div>
        <button
          onClick={handleClearAll}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
        >
          <Trash2 size={16} />
          Limpar Tudo
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por mensagem de erro, usuário ou URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          <AnimatePresence mode="popLayout">
            {filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 hover:bg-gray-50/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                        <Clock size={12} />
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('pt-BR') : 'N/A'}
                      </span>
                      <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-black rounded uppercase tracking-tighter">
                        Erro
                      </span>
                      {log.userName && (
                        <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                          <User size={12} />
                          {log.userName}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2 break-words">
                      {log.errorMessage}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Globe size={12} className="text-gray-400" />
                        <span className="truncate max-w-[200px]" title={log.url}>{log.url}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Monitor size={12} className="text-gray-400" />
                        <span className="truncate max-w-[200px]" title={log.userAgent}>{log.userAgent}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Ver detalhes"
                    >
                      {expandedLog === log.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Excluir log"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedLog === log.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 p-4 bg-gray-900 rounded-2xl text-gray-300 font-mono text-xs overflow-x-auto space-y-4">
                        {log.errorStack && (
                          <div>
                            <p className="text-indigo-400 font-bold mb-1 uppercase tracking-widest text-[10px]">Stack Trace:</p>
                            <pre className="whitespace-pre-wrap">{log.errorStack}</pre>
                          </div>
                        )}
                        {log.componentStack && (
                          <div>
                            <p className="text-emerald-400 font-bold mb-1 uppercase tracking-widest text-[10px]">Component Stack:</p>
                            <pre className="whitespace-pre-wrap">{log.componentStack}</pre>
                          </div>
                        )}
                        {!log.errorStack && !log.componentStack && (
                          <p className="text-gray-500 italic">Nenhum detalhe técnico adicional disponível.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredLogs.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="text-emerald-300" size={32} />
              </div>
              <p className="text-gray-500 font-medium">Nenhum log de erro encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
