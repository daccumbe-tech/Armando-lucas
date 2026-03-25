import React from 'react';
import { Sparkles, AlertCircle, Info, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';

interface UserNudgesProps {
  user: UserProfile;
  onAction: (page: string) => void;
}

export default function UserNudges({ user, onAction }: UserNudgesProps) {
  const nudges = [];

  if (!user.bio || user.bio.length < 20) {
    nudges.push({
      id: 'bio',
      title: 'Aumente sua visibilidade!',
      message: 'Complete sua bio para que investidores conheçam melhor sua história.',
      icon: Sparkles,
      color: 'bg-indigo-50 text-indigo-600',
      action: 'my-profile',
      btnText: 'Editar Perfil',
    });
  }

  if (!user.portfolio || user.portfolio.length === 0) {
    nudges.push({
      id: 'portfolio',
      title: 'Atraia investidores!',
      message: 'Adicione itens ao seu portfólio para mostrar seu trabalho na prática.',
      icon: Info,
      color: 'bg-violet-50 text-violet-600',
      action: 'my-profile',
      btnText: 'Adicionar Portfólio',
    });
  }

  if (!user.photoURL) {
    nudges.push({
      id: 'photo',
      title: 'Perfis completos recebem mais destaque',
      message: 'Adicione uma foto de perfil para transmitir mais confiança e profissionalismo.',
      icon: AlertCircle,
      color: 'bg-amber-50 text-amber-600',
      action: 'my-profile',
      btnText: 'Adicionar Foto',
    });
  }

  if (nudges.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      <AnimatePresence>
        {nudges.map((nudge, index) => (
          <motion.div
            key={nudge.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.1 }}
            className={`p-6 rounded-[2rem] ${nudge.color} border border-current/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/50 rounded-2xl shadow-sm">
                <nudge.icon size={24} />
              </div>
              <div>
                <h4 className="font-black text-lg tracking-tight mb-1">{nudge.title}</h4>
                <p className="text-sm opacity-80 font-medium leading-relaxed">{nudge.message}</p>
              </div>
            </div>
            <button
              onClick={() => onAction(nudge.action)}
              className="px-6 py-3 bg-white text-gray-900 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2 group whitespace-nowrap"
            >
              {nudge.btnText}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
