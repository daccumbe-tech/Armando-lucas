import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Rocket, Compass, CheckCircle2 } from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: 'complete-profile' | 'explore-talents') => void;
  userRole: UserRole;
}

export default function WelcomeModal({ isOpen, onClose, onAction, userRole }: WelcomeModalProps) {
  const isTalent = userRole === 'talent';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all z-10"
          >
            <X size={20} />
          </button>

          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600 to-violet-600 opacity-10" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl" />

          <div className="relative p-8 sm:p-10 text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-100 mb-8">
              {isTalent ? <Rocket size={40} /> : <Compass size={40} />}
            </div>

            {/* Title */}
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 tracking-tight">
              Bem-vindo ao <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Talentlin!</span>
            </h2>

            {/* Message */}
            <div className="space-y-4 mb-10">
              <p className="text-gray-600 text-lg leading-relaxed">
                Estamos felizes por ter você aqui. {isTalent 
                  ? 'Este é o seu espaço para mostrar ao mundo do que você é capaz.' 
                  : 'Aqui você encontra talentos prontos para crescer e oportunidades reais de investimento.'}
              </p>
              <p className="text-gray-900 font-bold text-xl">
                {isTalent 
                  ? 'Está pronto para mostrar seu talento e crescer?' 
                  : 'Está pronto para descobrir novos talentos e investir no futuro?'}
              </p>
            </div>

            {/* Action Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAction(isTalent ? 'complete-profile' : 'explore-talents')}
              className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-3 group"
            >
              {isTalent ? (
                <>
                  <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
                  Completar Perfil
                </>
              ) : (
                <>
                  <Compass size={24} className="group-hover:rotate-12 transition-transform" />
                  Explorar Talentos
                </>
              )}
            </motion.button>

            {/* Footer Text */}
            <p className="mt-6 text-sm text-gray-400 font-medium">
              {isTalent 
                ? 'Comece agora e destaque-se na plataforma.' 
                : 'Conecte-se com os melhores talentos hoje mesmo.'}
            </p>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
