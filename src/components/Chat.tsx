import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
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
  getDocs,
  limit
} from 'firebase/firestore';
import { UserProfile, Conversation, Message } from '../types';
import { Send, X, MessageSquare, Plus, Search } from 'lucide-react';

interface ChatProps {
  currentUser: UserProfile;
  recipient?: UserProfile;
  onClose: () => void;
}

export default function Chat({ currentUser, recipient, onClose }: ChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChatSearch, setShowNewChatSearch] = useState(false);
  const [talents, setTalents] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const creatingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load talents for new chat search (only for investors)
  useEffect(() => {
    if (currentUser.role !== 'investor') return;

    const q = query(collection(db, 'users'), where('role', '==', 'talent'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTalents(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    });

    return () => unsubscribe();
  }, [currentUser.role]);

  // Load conversations
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

  // If recipient is provided, find or create conversation
  useEffect(() => {
    if (recipient && !loading && !creatingRef.current) {
      const existingConv = conversations.find(c => 
        c.participants.includes(recipient.uid)
      );

      if (existingConv) {
        setActiveConversation(existingConv);
      } else {
        // Create new conversation
        const createConv = async () => {
          creatingRef.current = true;
          try {
            const newConvData = {
              participants: [currentUser.uid, recipient.uid],
              participantNames: {
                [currentUser.uid]: currentUser.name,
                [recipient.uid]: recipient.name
              },
              updatedAt: serverTimestamp(),
              lastMessage: ''
            };
            const docRef = await addDoc(collection(db, 'conversations'), newConvData);
            setActiveConversation({ id: docRef.id, ...newConvData } as Conversation);
          } catch (err) {
            console.error("Error creating conversation:", err);
          } finally {
            creatingRef.current = false;
          }
        };
        createConv();
      }
    }
  }, [recipient, conversations, loading, currentUser.uid, currentUser.name]);

  // Keep active conversation in sync with conversations list
  useEffect(() => {
    if (activeConversation) {
      const updated = conversations.find(c => c.id === activeConversation.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(activeConversation)) {
        setActiveConversation(updated);
      }
    }
  }, [conversations, activeConversation]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    // Reset unread count when opening conversation
    if (activeConversation.unreadCounts?.[currentUser.uid]) {
      updateDoc(doc(db, 'conversations', activeConversation.id), {
        [`unreadCounts.${currentUser.uid}`]: 0
      });
    }

    const q = query(
      collection(db, 'conversations', activeConversation.id, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [activeConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    const text = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, 'conversations', activeConversation.id, 'messages'), {
        conversationId: activeConversation.id,
        senderId: currentUser.uid,
        senderName: currentUser.name,
        text,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'conversations', activeConversation.id), {
        lastMessage: text,
        updatedAt: serverTimestamp(),
        [`unreadCounts.${activeConversation.participants.find(id => id !== currentUser.uid)}`]: (activeConversation.unreadCounts?.[activeConversation.participants.find(id => id !== currentUser.uid) || ''] || 0) + 1
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const getRecipientName = (conv: Conversation) => {
    const otherId = conv.participants.find(id => id !== currentUser.uid);
    return otherId ? conv.participantNames[otherId] : 'Desconhecido';
  };

  const startChatWith = async (talent: UserProfile) => {
    const existingConv = conversations.find(c => c.participants.includes(talent.uid));
    if (existingConv) {
      setActiveConversation(existingConv);
      setShowNewChatSearch(false);
    } else {
      creatingRef.current = true;
      try {
        const newConvData = {
          participants: [currentUser.uid, talent.uid],
          participantNames: {
            [currentUser.uid]: currentUser.name,
            [talent.uid]: talent.name
          },
          updatedAt: serverTimestamp(),
          lastMessage: ''
        };
        const docRef = await addDoc(collection(db, 'conversations'), newConvData);
        setActiveConversation({ id: docRef.id, ...newConvData } as Conversation);
        setShowNewChatSearch(false);
      } catch (err) {
        console.error("Error starting chat:", err);
      } finally {
        creatingRef.current = false;
      }
    }
  };

  const filteredTalents = talents.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl h-[80vh] rounded-3xl overflow-hidden shadow-2xl flex border border-gray-100">
        {/* Sidebar - Conversations List */}
        <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/50">
          <div className="p-6 border-b border-gray-100 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="text-indigo-600" />
                Mensagens
              </h3>
              {currentUser.role === 'investor' && (
                <button 
                  onClick={() => setShowNewChatSearch(!showNewChatSearch)}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"
                  title="Nova Conversa"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {showNewChatSearch ? (
              <div className="space-y-4 p-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text"
                    placeholder="Buscar talentos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  {filteredTalents.map(talent => (
                    <button
                      key={talent.uid}
                      onClick={() => startChatWith(talent)}
                      className="w-full text-left p-3 rounded-xl hover:bg-white hover:shadow-sm transition-all flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                        {talent.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{talent.name}</p>
                        <p className="text-[10px] text-indigo-600 font-medium uppercase tracking-wider">{talent.category}</p>
                      </div>
                    </button>
                  ))}
                  {filteredTalents.length === 0 && (
                    <p className="text-gray-400 text-center py-4 text-xs">Nenhum talento encontrado.</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {conversations.length === 0 && !loading && (
                  <p className="text-gray-400 text-center py-12 text-sm">Nenhuma conversa ainda.</p>
                )}
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversation(conv)}
                    className={`w-full text-left p-4 rounded-2xl transition-all ${
                      activeConversation?.id === conv.id 
                        ? 'bg-white shadow-md border border-gray-100' 
                        : 'hover:bg-white/50'
                    }`}
                  >
                    <p className="font-bold text-gray-900 truncate">{getRecipientName(conv)}</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-gray-500 truncate flex-1">{conv.lastMessage || 'Inicie uma conversa...'}</p>
                      {conv.unreadCounts?.[currentUser.uid] ? (
                        <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                          {conv.unreadCounts[currentUser.uid]}
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {activeConversation ? (
            <>
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                    {getRecipientName(activeConversation).charAt(0)}
                  </div>
                  <h3 className="font-bold text-gray-900">{getRecipientName(activeConversation)}</h3>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] p-4 rounded-2xl ${
                      msg.senderId === currentUser.uid 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-gray-100 text-gray-900 rounded-tl-none'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-100 flex gap-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escreva sua mensagem..."
                  className="flex-1 p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
                <MessageSquare size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Suas Conversas</h3>
              <p className="max-w-xs">Selecione uma conversa ao lado ou entre em contacto com um talento para começar.</p>
              <button onClick={onClose} className="mt-8 text-indigo-600 font-medium hover:underline">Fechar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
