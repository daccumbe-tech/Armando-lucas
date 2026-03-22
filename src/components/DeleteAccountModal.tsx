import { useState } from 'react';
import { auth } from '../firebase';
import { Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password?: string) => Promise<void>;
}

export default function DeleteAccountModal({ isOpen, onClose, onConfirm }: DeleteAccountModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isEmailUser = auth.currentUser?.providerData[0]?.providerId === 'password';

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onConfirm(reauthPassword);
      onClose();
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setIsDeleting(false);
      if (err.message === 'PASSWORD_REQUIRED') {
        setDeleteError('Por favor, insira sua senha para confirmar.');
      } else if (err.message === 'AUTH_FAILED') {
        setDeleteError('Falha na autenticação. Verifique sua senha.');
      } else if (err.message === 'AUTH_CANCELLED') {
        setDeleteError('A autenticação foi cancelada. Tente novamente.');
      } else if (err.message === 'NETWORK_ERROR') {
        setDeleteError('Erro de rede. Verifique sua conexão.');
      } else {
        setDeleteError(err.message || 'Ocorreu um erro ao excluir sua conta.');
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-6 mx-auto">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Tem certeza?</h3>
            <p className="text-gray-500 text-center mb-8">
              Esta ação é <span className="font-bold text-red-600">irreversível</span>. Todos os seus dados serão apagados permanentemente dos nossos servidores.
              {!isEmailUser && <span className="block mt-2 text-xs">Uma janela de autenticação será aberta. Certifique-se de permitir pop-ups.</span>}
            </p>

            {isEmailUser && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Confirme sua senha</label>
                <input
                  type="password"
                  value={reauthPassword}
                  onChange={(e) => setReauthPassword(e.target.value)}
                  placeholder="Sua senha atual"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
            )}
            
            {deleteError && (
              <p className="mb-4 text-sm text-red-600 font-medium flex items-center gap-2 justify-center">
                <AlertTriangle size={16} />
                {deleteError}
              </p>
            )}
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDelete}
                disabled={isDeleting || (isEmailUser && !reauthPassword)}
                className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-100"
              >
                {isDeleting ? 'Eliminando...' : (
                  <>
                    <Trash2 size={20} />
                    Sim, Eliminar Tudo
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="w-full bg-gray-100 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
