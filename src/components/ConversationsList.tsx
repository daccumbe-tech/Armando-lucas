import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Conversation, UserProfile } from '../types';
import { MessageSquare, User, Loader2, Search, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface ConversationsListProps {
  currentUser: UserProfile;
  onSelectConversation: (id: string) => void;
}

export default function ConversationsList({ currentUser, onSelectConversation }: ConversationsListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      setConversations(convs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser.uid]);

  const filteredConversations = conversations.filter(conv => {
    const otherId = conv.participants.find(id => id !== currentUser.uid);
    const otherName = otherId ? conv.participantNames[otherId] : '';
    return otherName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden max-w-2xl mx-auto">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Suas Conversas</h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {filteredConversations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mx-auto mb-4">
              <MessageSquare size={32} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Nenhuma conversa encontrada</h3>
            <p className="text-sm text-gray-500">Inicie um chat visitando o perfil de um talento ou investidor.</p>
          </div>
        ) : (
          filteredConversations.map(conv => {
            const otherId = conv.participants.find(id => id !== currentUser.uid);
            const otherName = otherId ? conv.participantNames[otherId] : 'Usuário';
            const otherPhoto = otherId ? conv.participantPhotos?.[otherId] : null;
            
            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className="w-full p-4 flex items-center gap-4 hover:bg-indigo-50/50 transition-all text-left group"
              >
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 flex-shrink-0 overflow-hidden shadow-sm">
                  {otherPhoto ? (
                    <img src={otherPhoto} alt={otherName} className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{otherName}</h4>
                    {conv.updatedAt && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(conv.updatedAt.seconds * 1000).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {conv.lastMessage || 'Inicie a conversa...'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
