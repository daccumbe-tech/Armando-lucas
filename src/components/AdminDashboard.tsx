import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { UserProfile, Project } from '../types';
import { 
  Users, 
  Briefcase, 
  ShieldCheck, 
  Ban, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Bug
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInvestors: 0,
    totalProjects: 0,
    pendingKYC: 0,
    activeReports: 0,
    suspiciousUsers: 0,
    errorLogs: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const projectsSnap = await getDocs(collection(db, 'projects'));
      const reportsSnap = await getDocs(collection(db, 'reports'));
      const errorsSnap = await getDocs(collection(db, 'error_logs'));

      const users = usersSnap.docs.map(doc => doc.data() as UserProfile);
      
      setStats({
        totalUsers: users.length,
        totalInvestors: users.filter(u => u.role === 'investor').length,
        totalProjects: projectsSnap.size,
        pendingKYC: users.filter(u => u.kyc?.status === 'pending').length,
        activeReports: reportsSnap.docs.filter(doc => doc.data().status === 'pending').length,
        suspiciousUsers: users.filter(u => u.isSuspicious).length,
        errorLogs: errorsSnap.size
      });

      // Fetch recent users
      const recentUsersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5));
      const recentUsersSnap = await getDocs(recentUsersQuery);
      setRecentUsers(recentUsersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));

    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'admin_stats');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      label: 'Total Usuários', 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      action: () => onNavigate('admin-users')
    },
    { 
      label: 'Investidores', 
      value: stats.totalInvestors, 
      icon: ShieldCheck, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50',
      action: () => onNavigate('admin-users')
    },
    { 
      label: 'Projetos Ativos', 
      value: stats.totalProjects, 
      icon: Briefcase, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50' 
    },
    { 
      label: 'KYC Pendentes', 
      value: stats.pendingKYC, 
      icon: ShieldCheck, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      action: () => onNavigate('admin-kyc')
    },
    { 
      label: 'Denúncias Ativas', 
      value: stats.activeReports, 
      icon: Ban, 
      color: 'text-red-600', 
      bg: 'bg-red-50',
      action: () => onNavigate('admin-reports')
    },
    { 
      label: 'Usuários Suspeitos', 
      value: stats.suspiciousUsers, 
      icon: AlertTriangle, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50',
      action: () => onNavigate('admin-users')
    },
    { 
      label: 'Erros do Sistema', 
      value: stats.errorLogs, 
      icon: Bug, 
      color: 'text-red-700', 
      bg: 'bg-red-100',
      action: () => onNavigate('admin-error-logs')
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Painel de Administração</h1>
        <p className="text-gray-500 mt-1">Bem-vindo de volta, Administrador.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group`}
            onClick={stat.action}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              {stat.action && <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-600 transition-colors" />}
            </div>
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {loading ? '...' : stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Users */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-600" />
              Usuários Recentes
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : recentUsers.length > 0 ? (
              recentUsers.map((u) => (
                <div key={u.uid} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        u.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${
                      u.role === 'investor' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {u.role}
                    </span>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500">
                Nenhum usuário encontrado.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Ações Rápidas</h2>
            <div className="space-y-3">
              <button 
                onClick={() => onNavigate('admin-kyc')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck size={20} />
                  <span className="text-sm font-bold">Validar KYC</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-600" />
              </button>
              <button 
                onClick={() => onNavigate('admin-reports')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle size={20} />
                  <span className="text-sm font-bold">Ver Denúncias</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-red-600" />
              </button>
              <button 
                onClick={() => onNavigate('admin-logs')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Clock size={20} />
                  <span className="text-sm font-bold">Ver Logs do Sistema</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-600" />
              </button>
              <button 
                onClick={() => onNavigate('admin-error-logs')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Bug size={20} />
                  <span className="text-sm font-bold">Ver Logs de Erros</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-red-600" />
              </button>
              <button 
                onClick={() => onNavigate('admin-settings')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp size={20} />
                  <span className="text-sm font-bold">Configurações Gerais</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-600" />
              </button>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Sistema Seguro</h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              O painel de administração é restrito e monitorado. Todas as ações são registradas para segurança da plataforma.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
