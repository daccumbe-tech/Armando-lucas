import { useState } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { LogOut, User, LayoutDashboard, Search, PlusCircle, MessageSquare, Bell, BarChart2, ChevronDown, Menu, X } from 'lucide-react';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  user: UserProfile | null;
  onNavigate: (page: string) => void;
  onOpenChat: () => void;
  onOpenNotifications: () => void;
  currentPage: string;
  unreadCount?: number;
  notificationCount?: number;
}

export default function Navbar({ 
  user, 
  onNavigate, 
  onOpenChat, 
  onOpenNotifications, 
  currentPage, 
  unreadCount = 0,
  notificationCount = 0
}: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const navigateTo = (page: string) => {
    onNavigate(page);
    setShowUserMenu(false);
    setShowMobileMenu(false);
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 -ml-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl md:hidden transition-all"
              aria-label="Menu"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('home')}>
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight hidden xs:block">TalentLink</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => navigateTo('home')}
              className={`text-sm font-medium transition-colors ${currentPage === 'home' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Explorar
            </button>
            {user?.role === 'talent' && (
              <button 
                onClick={() => navigateTo('dashboard')}
                className={`text-sm font-medium transition-colors ${currentPage === 'dashboard' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Meu Portfólio
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-4">
            {user ? (
              <div className="flex items-center gap-1 sm:gap-4">
                <button 
                  onClick={onOpenNotifications}
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative"
                  title="Notificações"
                >
                  <Bell size={20} />
                  {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>
                <button 
                  onClick={onOpenChat}
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative"
                  title="Mensagens"
                >
                  <MessageSquare size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 pl-2 pr-2 sm:pr-3 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
                  >
                    <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm overflow-hidden shadow-sm">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        user.name.charAt(0)
                      )}
                    </div>
                    <div className="flex flex-col items-start hidden sm:flex">
                      <span className="text-xs font-bold text-gray-900 leading-none">{user.name.split(' ')[0]}</span>
                      <span className="text-[10px] text-gray-400 capitalize">{user.role}</span>
                    </div>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <>
                        <div className="fixed inset-0 z-[-1]" onClick={() => setShowUserMenu(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden"
                        >
                          <div className="px-4 py-3 border-b border-gray-50 mb-1">
                            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                          </div>
                          
                          <button 
                            onClick={() => navigateTo('profile')}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          >
                            <User size={18} />
                            Meu Perfil
                          </button>
                          
                          <button 
                            onClick={() => navigateTo('analytics')}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          >
                            <BarChart2 size={18} />
                            Analytics
                          </button>

                          {user.role === 'talent' && (
                            <button 
                              onClick={() => navigateTo('dashboard')}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                            >
                              <LayoutDashboard size={18} />
                              Meu Portfólio
                            </button>
                          )}

                          <div className="border-t border-gray-50 mt-1 pt-1">
                            <button 
                              onClick={handleSignOut}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <LogOut size={18} />
                              Sair
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => navigateTo('auth')}
                className="bg-indigo-600 text-white px-4 sm:px-6 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Entrar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 md:hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">T</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900 tracking-tight">TalentLink</span>
                </div>
                <button onClick={() => setShowMobileMenu(false)} className="p-2 text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <button 
                  onClick={() => navigateTo('home')}
                  className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-base font-bold transition-all ${currentPage === 'home' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Search size={20} />
                  Explorar
                </button>
                {user?.role === 'talent' && (
                  <button 
                    onClick={() => navigateTo('dashboard')}
                    className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-base font-bold transition-all ${currentPage === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <LayoutDashboard size={20} />
                    Meu Portfólio
                  </button>
                )}
                <button 
                  onClick={() => navigateTo('analytics')}
                  className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-base font-bold transition-all ${currentPage === 'analytics' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <BarChart2 size={20} />
                  Analytics
                </button>
                {user && (
                  <button 
                    onClick={() => navigateTo('profile')}
                    className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-base font-bold transition-all ${currentPage === 'profile' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <User size={20} />
                    Meu Perfil
                  </button>
                )}
              </div>

              {user ? (
                <div className="p-4 border-t border-gray-100">
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-base font-bold text-red-600 hover:bg-red-50 transition-all"
                  >
                    <LogOut size={20} />
                    Sair da Conta
                  </button>
                </div>
              ) : (
                <div className="p-4 border-t border-gray-100">
                  <button 
                    onClick={() => navigateTo('auth')}
                    className="w-full bg-indigo-600 text-white px-4 py-4 rounded-2xl text-base font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Entrar
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
