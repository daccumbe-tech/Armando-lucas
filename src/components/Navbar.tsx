import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { LogOut, User, LayoutDashboard, Search, PlusCircle, MessageSquare } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  onNavigate: (page: string) => void;
  onOpenChat: () => void;
  currentPage: string;
}

export default function Navbar({ user, onNavigate, onOpenChat, currentPage }: NavbarProps) {
  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">TalentLink</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => onNavigate('home')}
              className={`text-sm font-medium transition-colors ${currentPage === 'home' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Explorar
            </button>
            {user?.role === 'talent' && (
              <button 
                onClick={() => onNavigate('dashboard')}
                className={`text-sm font-medium transition-colors ${currentPage === 'dashboard' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Meu Portfólio
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <button 
                  onClick={onOpenChat}
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative"
                  title="Mensagens"
                >
                  <MessageSquare size={20} />
                </button>
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-medium text-gray-900">{user.name}</span>
                  <span className="text-xs text-gray-500 capitalize">{user.role}</span>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Sair"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => onNavigate('auth')}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Entrar
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
