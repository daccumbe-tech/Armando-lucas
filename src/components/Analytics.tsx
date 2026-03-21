import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Legend,
  Cell
} from 'recharts';
import { Project, CATEGORIES } from '../types';
import { TrendingUp, BarChart2, Star, Heart, Layers } from 'lucide-react';

interface AnalyticsProps {
  projects: Project[];
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function Analytics({ projects }: AnalyticsProps) {
  const stats = useMemo(() => {
    const totalLikes = projects.reduce((acc, p) => acc + (p.likesCount || 0), 0);
    const totalComments = projects.reduce((acc, p) => acc + (p.commentsCount || 0), 0);
    const avgRating = projects.length > 0 
      ? projects.reduce((acc, p) => acc + (p.rating?.average || 0), 0) / projects.length 
      : 0;

    // Projects by category
    const categoryData = CATEGORIES.map(cat => ({
      name: cat,
      count: projects.filter(p => p.category === cat).length
    })).filter(d => d.count > 0);

    // Timeline data (grouped by month)
    const timelineMap = new Map<string, { date: string, likes: number, rating: number, count: number }>();
    
    projects.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date();
      const dateB = b.createdAt?.toDate?.() || new Date();
      return dateA.getTime() - dateB.getTime();
    }).forEach(p => {
      const date = p.createdAt?.toDate?.() || new Date();
      const monthYear = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      const existing = timelineMap.get(monthYear) || { date: monthYear, likes: 0, rating: 0, count: 0 };
      existing.likes += (p.likesCount || 0);
      existing.rating += (p.rating?.average || 0);
      existing.count += 1;
      timelineMap.set(monthYear, existing);
    });

    const timelineData = Array.from(timelineMap.values()).map(d => ({
      ...d,
      avgRating: d.count > 0 ? Number((d.rating / d.count).toFixed(1)) : 0
    }));

    return {
      totalLikes,
      totalComments,
      avgRating: avgRating.toFixed(1),
      categoryData,
      timelineData
    };
  }, [projects]);

  return (
    <div className="space-y-8 pb-12">
      <header className="px-4 sm:px-0">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics</h2>
        <p className="text-sm sm:text-base text-gray-500">Visão geral do desempenho e tendências da plataforma.</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-0">
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <Layers size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Total Projetos</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{projects.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
            <Heart size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Total Likes</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalLikes}</p>
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
            <Star size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Avaliação Média</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.avgRating}</p>
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <TrendingUp size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Engajamento</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalComments}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 px-4 sm:px-0">
        {/* Projects by Category */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 mb-6 sm:mb-8">
            <BarChart2 size={20} className="text-indigo-600" />
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Projetos por Categoria</h3>
          </div>
          <div className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 500, fill: '#6b7280' }}
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Likes Over Time */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 mb-6 sm:mb-8">
            <Heart size={20} className="text-rose-600" />
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Likes ao Longo do Tempo</h3>
          </div>
          <div className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.timelineData} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#6b7280' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#6b7280' }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="likes" 
                  stroke="#f43f5e" 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: '#f43f5e', strokeWidth: 1, stroke: '#fff' }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Rating Over Time */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm lg:col-span-2 overflow-hidden">
          <div className="flex items-center gap-2 mb-6 sm:mb-8">
            <Star size={20} className="text-amber-600" />
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Avaliação Média Mensal</h3>
          </div>
          <div className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.timelineData} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#6b7280' }} 
                />
                <YAxis 
                  domain={[0, 5]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#6b7280' }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgRating" 
                  name="Avaliação Média"
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: '#f59e0b', strokeWidth: 1, stroke: '#fff' }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
