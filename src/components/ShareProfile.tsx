import React from 'react';
import { Share2, MessageCircle, Facebook, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface ShareProfileProps {
  uid: string;
  name: string;
}

export default function ShareProfile({ uid, name }: ShareProfileProps) {
  const [copied, setCopied] = React.useState(false);
  const profileUrl = `${window.location.origin}?profile=${uid}`;
  const shareMessage = `Confira meu talento no Talentlin e descubra o que sou capaz de fazer! ${profileUrl}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${name} no Talentlin`,
          text: shareMessage,
          url: profileUrl,
        });
        toast.success('Compartilhado com sucesso!');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast.success('Link copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-[#25D366]',
      url: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-[#1877F2]',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleShare}
        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
      >
        <Share2 size={18} />
        Compartilhar Perfil
      </motion.button>

      <div className="flex items-center gap-2">
        {shareLinks.map((link) => (
          <motion.a
            key={link.name}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-3 ${link.color} text-white rounded-xl shadow-sm hover:shadow-md transition-all`}
            title={`Compartilhar no ${link.name}`}
          >
            <link.icon size={18} />
          </motion.a>
        ))}

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleCopy}
          className="p-3 bg-white border border-gray-100 text-gray-500 rounded-xl shadow-sm hover:shadow-md transition-all"
          title="Copiar Link"
        >
          {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
        </motion.button>
      </div>
    </div>
  );
}
