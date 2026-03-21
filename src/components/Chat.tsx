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
import { Send, X, MessageSquare } from 'lucide-react';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    if (recipient && !loading) {
      const existingConv = conversations.find(c => 
        c.participants.includes(recipient.uid)
      );

      if (existingConv) {
        setActiveConversation(existingConv);
      } else {
        // Create new conversation
        const createConv = async () => {
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
        };
        createConv();
      }
    }
  }, [recipient, conversations, loading, currentUser.uid, currentUser.name]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
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
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const getRecipientName = (conv: Conversation) => {
    const otherId = conv.participants.find(id => id !== currentUser.uid);
    return otherId ? conv.participantNames[otherId] : 'Desconhecido';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl h-[80vh] rounded-3xl overflow-hidden shadow-2xl flex border border-gray-100">
        {/* Sidebar - Conversations List */}
        <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/50">
          <div className="p-6 border-b border-gray-100 bg-white">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="text-indigo-600" />
              Mensagens
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
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
                <p className="text-sm text-gray-500 truncate">{conv.lastMessage || 'Inicie uma conversa...'}</p>
              </button>
            ))}
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
