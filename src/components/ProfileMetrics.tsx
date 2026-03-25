import React from 'react';
import { Eye, Users, MousePointer2, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileMetricsProps {
  views: number;
  uniqueVisitors: number;
  interactions: number;
}

export default function ProfileMetrics({ views, uniqueVisitors, interactions }: ProfileMetricsProps) {
  const metrics = [
    {
      label: 'Visualizações',
      value: views,
      icon: Eye,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Visitantes Únicos',
      value: uniqueVisitors,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Interações',
      value: interactions,
      icon: MousePointer2,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${metric.bg} ${metric.color} group-hover:scale-110 transition-transform`}>
              <metric.icon size={20} />
            </div>
            <TrendingUp size={16} className="text-gray-300" />
          </div>
          <div className="space-y-1">
            <span className="block text-2xl font-black text-gray-900">
              {metric.value.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {metric.label}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
