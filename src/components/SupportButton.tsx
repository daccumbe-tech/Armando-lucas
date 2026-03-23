import React, { useState } from 'react';
import { 
  Heart, 
  Share2, 
  Copy, 
  Check, 
  X, 
  Facebook, 
  Instagram, 
  MessageCircle, 
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SUPPORT_NUMBERS = [
  { provider: 'eMola', number: '874597939', owner: 'Armando Lucas Cumbe' },
  { provider: 'M-Pesa', number: '846384175', owner: 'Mariana mutimba' },
  { provider: 'mKesh', number: '833950740', owner: 'Armando Lucas Cumbe' },
  { provider: 'Conta Móvel', number: '874597939', owner: 'Armando Lucas Cumbe' },
];

export default function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const siteUrl = window.location.origin;
  const shareMessage = "Descubra talentos incríveis e oportunidades no Talentlin. Junte-se agora e mostre seu talento ao mundo!";
  const fullShareText = `${shareMessage} ${siteUrl}`;

  const handleCopy = (number: string, index: number) => {
    navigator.clipboard.writeText(number);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(fullShareText)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}&quote=${encodeURIComponent(shareMessage)}`,
    // Instagram and TikTok don't have direct share URLs like these, usually handled via native sharing or copy link
    instagram: `https://www.instagram.com/`,
    tiktok: `https://www.tiktok.com/`,
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all active:scale-95 group"
      >
        <Heart size={20} className="group-hover:fill-white transition-colors" />
        <span className="font-bold text-sm">Apoiar</span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 sm:p-8 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Heart size={20} fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Apoiar o Projeto</h3>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">TalentLink Community</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
                {/* Section 1: Share */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Share2 size={18} className="text-indigo-600" />
                    <h4 className="font-bold text-gray-900">Compartilhar</h4>
                  </div>
                  <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    Ajude-nos a crescer partilhando a plataforma com os seus amigos e redes sociais.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <a 
                      href={shareLinks.whatsapp} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-4 bg-emerald-50 text-emerald-600 rounded-3xl hover:bg-emerald-100 transition-all group"
                    >
                      <MessageCircle size={24} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">WhatsApp</span>
                    </a>
                    <a 
                      href={shareLinks.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-4 bg-blue-50 text-blue-600 rounded-3xl hover:bg-blue-100 transition-all group"
                    >
                      <Facebook size={24} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Facebook</span>
                    </a>
                    <a 
                      href={shareLinks.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-4 bg-pink-50 text-pink-600 rounded-3xl hover:bg-pink-100 transition-all group"
                    >
                      <Instagram size={24} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Instagram</span>
                    </a>
                    <a 
                      href={shareLinks.tiktok} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-4 bg-gray-50 text-gray-900 rounded-3xl hover:bg-gray-100 transition-all group"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.13 3.44-.3 6.88-.45 10.32-.13 2.13-.86 4.26-2.41 5.71-1.59 1.46-3.89 2.08-6 1.87-2.11-.12-4.17-1.14-5.47-2.81-1.3-1.7-1.73-3.96-1.22-6.02.51-2.05 1.93-3.84 3.85-4.65 1.48-.64 3.13-.74 4.69-.32.04-1.08.06-2.15.09-3.23-1.18-.19-2.42-.12-3.54.3-1.77.7-3.18 2.24-3.76 4.03-.58 1.81-.39 3.84.52 5.5 1.1 2.02 3.39 3.3 5.68 3.19 2.54-.14 4.75-2.13 5.08-4.66.42-2.84.06-5.69.06-8.53-.14-.17-.27-.34-.41-.5-.85-.85-1.41-2.02-1.58-3.22z"/>
                      </svg>
                      <span className="text-[10px] font-bold uppercase tracking-wider">TikTok</span>
                    </a>
                  </div>
                </section>

                {/* Section 2: Financial Support */}
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone size={18} className="text-indigo-600" />
                    <h4 className="font-bold text-gray-900">Apoie o projeto (opcional)</h4>
                  </div>
                  <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    Qualquer valor ajuda no crescimento da plataforma. Não é obrigatório.
                  </p>
                  
                  <div className="space-y-3">
                    {SUPPORT_NUMBERS.map((item, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-white hover:border-indigo-100 transition-all"
                      >
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{item.provider}</p>
                          <p className="text-lg font-bold text-gray-900 tracking-tight">{item.number}</p>
                          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Titular: {item.owner}</p>
                        </div>
                        <button
                          onClick={() => handleCopy(item.number, index)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            copiedIndex === index 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-white text-indigo-600 border border-indigo-50 hover:bg-indigo-600 hover:text-white'
                          }`}
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check size={14} />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              Copiar
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Important Disclaimer */}
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                  <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <span className="font-bold">Aviso importante:</span> O apoio financeiro é totalmente opcional e não é necessário para utilizar a plataforma.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Obrigado pelo seu apoio!</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
