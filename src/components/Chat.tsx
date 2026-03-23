import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  arrayUnion,
  getDoc
} from 'firebase/firestore';
import { Conversation, Message, UserProfile } from '../types';
import { Send, Phone, Link as LinkIcon, Shield, CheckCircle, AlertCircle, Loader2, User, MessageSquare, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatProps {
  conversationId: string;
  currentUser: UserProfile;
  onReport?: (target: { uid: string; name: string }) => void;
}

export default function Chat({ conversationId, currentUser, onReport }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) return;

    // Fetch conversation details
    const convRef = doc(db, 'conversations', conversationId);
    const unsubConv = onSnapshot(convRef, (doc) => {
      if (doc.exists()) {
        setConversation({ id: doc.id, ...doc.data() } as Conversation);
      }
    });

    // Fetch messages
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    const unsubMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setLoading(false);
      scrollToBottom();
    });

    return () => {
      unsubConv();
      unsubMessages();
    };
  }, [conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const maskPhoneNumbers = (text: string) => {
    // Basic regex for phone numbers (matches various formats)
    const phoneRegex = /(\+?\d{1,4}[\s.-]?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4,}/g;
    return text.replace(phoneRegex, '[NÚMERO PROTEGIDO]');
  };

  const containsExternalLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return urlRegex.test(text);
  };

  const isChatAccepted = conversation?.acceptedBy?.includes(currentUser.uid);
  const isMutuallyAccepted = conversation?.acceptedBy?.length === 2;
  const isSuspended = currentUser.status === 'suspended' || currentUser.status === 'banned';

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || isSuspended) return;

    setError(null);
    
    // Check for links in initial contact
    if (!isMutuallyAccepted && containsExternalLinks(newMessage)) {
      setError('O envio de links externos é bloqueado até que ambos aceitem o contato.');
      return;
    }

    setSending(true);
    try {
      const maskedText = maskPhoneNumbers(newMessage);
      
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        text: maskedText,
        createdAt: serverTimestamp()
      });

      // Update last message in conversation
      const convRef = doc(db, 'conversations', conversationId);
      await updateDoc(convRef, {
        lastMessage: maskedText,
        updatedAt: serverTimestamp()
      });

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Erro ao enviar mensagem.');
    } finally {
      setSending(false);
    }
  };

  const handleAcceptChat = async () => {
    if (!conversation) return;
    setSending(true);
    try {
      const convRef = doc(db, 'conversations', conversationId);
      await updateDoc(convRef, {
        acceptedBy: arrayUnion(currentUser.uid)
      });
    } catch (err) {
      console.error('Error accepting chat:', err);
      setError('Erro ao aceitar contato.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-gray-50 rounded-3xl border border-gray-100">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-gray-500 font-medium">Carregando conversa...</p>
      </div>
    );
  }

  const otherParticipantId = conversation?.participants.find(id => id !== currentUser.uid);
  const otherParticipantName = otherParticipantId ? conversation?.participantNames[otherParticipantId] : 'Usuário';
  const otherParticipantPhoto = otherParticipantId ? conversation?.participantPhotos?.[otherParticipantId] : null;

  return (
    <div className="flex flex-col h-[700px] bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            {otherParticipantPhoto ? (
              <img src={otherParticipantPhoto} alt={otherParticipantName} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <User size={20} />
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{otherParticipantName}</h3>
            <div className="flex items-center gap-1">
              {isMutuallyAccepted ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-wider">
                  <Unlock size={10} /> Contato Desbloqueado
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  <Lock size={10} /> Contato Protegido
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onReport?.({ uid: otherParticipantId!, name: otherParticipantName })}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Denunciar Usuário"
          >
            <AlertTriangle size={20} />
          </button>
          <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
            <Phone size={20} />
          </button>
          <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
            <Shield size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-300">
              <MessageSquare size={32} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Inicie uma conversa</h4>
              <p className="text-xs text-gray-500 max-w-[200px] mx-auto">
                Lembre-se: números de telefone são protegidos e links são bloqueados até a aceitação mútua.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          const isMine = msg.senderId === currentUser.uid;
          return (
            <motion.div
              key={msg.id || index}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${isMine ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <div className={`text-[10px] mt-2 ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Enviando...'}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Actions / Input */}
      <div className="p-4 border-t border-gray-100 bg-white">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2 border border-red-100">
            <AlertCircle size={14} />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {!isChatAccepted ? (
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col items-center text-center space-y-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm">
              <Unlock size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-indigo-900">Aceitar este contato?</h4>
              <p className="text-[10px] text-indigo-700 max-w-[250px]">
                Ao aceitar, você permite que ambos compartilhem links e informações de contato livremente após a aceitação mútua.
              </p>
            </div>
            <button
              onClick={handleAcceptChat}
              disabled={sending}
              className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {sending ? 'Processando...' : 'Aceitar Contato'}
            </button>
          </div>
        ) : !isMutuallyAccepted ? (
          <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg text-amber-600 shadow-sm">
              <Loader2 className="animate-spin" size={16} />
            </div>
            <p className="text-[10px] text-amber-700 font-medium">
              Aguardando que <strong>{otherParticipantName}</strong> também aceite o contato para desbloqueio total.
            </p>
          </div>
        ) : null}
 
        {isSuspended ? (
          <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={20} />
            <p className="text-sm font-bold text-red-900">
              {currentUser.status === 'suspended' 
                ? 'Sua conta foi suspensa por atividade suspeita' 
                : 'Sua conta foi banida permanentemente'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button type="button" className="p-1 text-gray-400 hover:text-indigo-600 transition-colors">
                  <LinkIcon size={18} />
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100"
            >
              {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
