import { Avatar } from '../common/Avatar';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ChatConversation, ChatMessage } from '../../types';
import { chatApi } from '../../services/api';
import { wsClient } from '../../services/wsClient';
import {
  ArrowLeft,
  ChevronDown,
  LifeBuoy,
  MapPin,
  Maximize2,
  MessageCircle,
  MessageSquare,
  Minus,
  Paperclip,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Tractor,
  X
} from 'lucide-react';

interface FloatingChatWidgetProps {
  onNavigateToMessages: (convId?: string) => void;
  onViewEquipment?: (id: string) => void;
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({
  onNavigateToMessages,
  onViewEquipment
}) => {
  const { user, unreadMessagesCount, refreshUnreadMessagesCount } = useAuth();
  const { t, translateRole } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadConversations();

    const handleUpdate = () => {
      loadConversations();
      if (selectedConvId) {
        loadMessages(selectedConvId);
      }
    };

    window.addEventListener('km_chat_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    const unsubMsg = wsClient.on('message:new', (newMsg: ChatMessage) => {
      if (selectedConvId && newMsg.conversationId === selectedConvId) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
      loadConversations();
      refreshUnreadMessagesCount();
    });

    return () => {
      window.removeEventListener('km_chat_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      unsubMsg();
    };
  }, [user?.id, selectedConvId]);

  useEffect(() => {
    if (selectedConvId && user) {
      loadMessages(selectedConvId);
      chatApi.markConversationAsRead(selectedConvId, user.id);
      refreshUnreadMessagesCount();
    }
  }, [selectedConvId, user?.id]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const loadConversations = async () => {
    if (!user) return;
    try {
      const convs = await chatApi.getConversations(user.id);
      setConversations(convs);
      if (selectedConvId) {
        const found = convs.find(c => c.id === selectedConvId);
        if (found) setActiveConversation(found);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const msgs = await chatApi.getMessages(convId);
      setMessages(msgs);
      const conv = await chatApi.getConversationById(convId);
      if (conv) setActiveConversation(conv);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (text?: string) => {
    const textToSend = text || inputText;
    if (!textToSend.trim() || !selectedConvId || !user) return;

    if (!text) setInputText('');

    try {
      const newMsg = await chatApi.sendMessage({
        conversationId: selectedConvId,
        senderId: user.id,
        content: textToSend.trim()
      });

      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareLocation = () => {
    if (!user) return;
    const text = `📍 Farm GPS: ${user.village ? user.village + ', ' : ''}${user.district} (Coordinates shared)`;
    handleSendMessage(text);
  };

  if (!user) return null;

  const counterpart = activeConversation?.participants.find(p => (p.userId || p.id) !== user.id) || activeConversation?.participants[0];
  const cleanPhone = counterpart?.phone ? counterpart.phone.replace(/[^0-9]/g, '') : '';
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Namaste ${counterpart?.name || ''}, inquiry from Krishi Mitra.`)}` : '';

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Floating launcher trigger button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            if (!selectedConvId && conversations.length > 0) {
              setSelectedConvId(conversations[0].id);
              setActiveConversation(conversations[0]);
            }
          }}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-stone-900 hover:bg-emerald-700 text-white rounded-full shadow-2xl transition-all duration-200 border-2 border-emerald-500/40 hover:scale-105 cursor-pointer"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-amber-400 group-hover:text-white transition" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                {unreadMessagesCount}
              </span>
            )}
          </div>
          <span className="font-display font-bold text-xs">
            Direct Kisan Chat
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      )}

      {/* Floating expanded chat popup */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-white rounded-3xl border border-stone-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="px-4 py-3 bg-stone-900 text-white flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {selectedConvId && (
                <button
                  onClick={() => setSelectedConvId(null)}
                  className="p-1 -ml-1 text-stone-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              {activeConversation && counterpart ? (
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar src={counterpart.avatarUrl} name={counterpart.name} className="w-8 h-8 rounded-xl border border-stone-700 shrink-0" iconClassName="w-4 h-4" />
                  <div className="min-w-0">
                    <div className="font-bold text-xs truncate leading-tight">
                      {counterpart.name}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-medium truncate flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {counterpart.role === 'ADMIN' ? 'Agri Extension Officer' : translateRole(counterpart.role)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                    KM
                  </div>
                  <span className="font-bold text-xs font-display">1-on-1 Personal Chat</span>
                </div>
              )}
            </div>

            {/* Action icons */}
            <div className="flex items-center gap-1 text-stone-400">
              {counterpart?.phone && (
                <a
                  href={`tel:${counterpart.phone}`}
                  className="p-1.5 hover:text-white hover:bg-stone-800 rounded-lg transition"
                  title="Call Phone"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              )}
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:text-emerald-400 hover:bg-stone-800 rounded-lg transition"
                  title="Open WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToMessages(selectedConvId || undefined);
                }}
                className="p-1.5 hover:text-white hover:bg-stone-800 rounded-lg transition cursor-pointer"
                title="Open Fullscreen Messenger"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-white hover:bg-stone-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation Selector View OR Message List */}
          {!selectedConvId ? (
            <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-2">
              <div className="p-2 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Direct Conversations
              </div>
              {conversations.map(conv => {
                const p = conv.participants.find(part => (part.userId || part.id) !== user.id) || conv.participants[0];
                const unread = conv.unreadCountForUser[user.id] || 0;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className="w-full p-3 flex items-center gap-3 text-left hover:bg-stone-50 rounded-2xl transition cursor-pointer"
                  >
                    <Avatar src={p.avatarUrl} name={p.name} className="w-9 h-9 rounded-xl border border-stone-200 shrink-0" iconClassName="w-4 h-4" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-stone-900 truncate">{p.name}</span>
                        <span className="text-[9px] text-stone-400">
                          {conv.lastMessageAt || conv.lastMessageTime ? new Date(conv.lastMessageAt || conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 truncate">{conv.lastMessage}</p>
                    </div>
                    {unread > 0 && (
                      <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[9px] font-black flex items-center justify-center shrink-0">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="p-3 text-center">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigateToMessages();
                  }}
                  className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Open Full Messenger →
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full bg-stone-50/50 min-h-0">
              
              {/* Contextual Machinery Bar */}
              {activeConversation?.equipmentId && (
                <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-xs shrink-0">
                  <span className="font-bold text-emerald-950 truncate text-[11px]">
                    🚜 {activeConversation.equipmentName}
                  </span>
                  {activeConversation.equipmentId && onViewEquipment && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onViewEquipment(activeConversation.equipmentId!);
                      }}
                      className="text-[10px] text-emerald-700 font-bold hover:underline shrink-0 cursor-pointer"
                    >
                      View Specs
                    </button>
                  )}
                </div>
              )}

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {messages.map(msg => {
                  const isMe = msg.senderId === user.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-2.5 rounded-2xl text-[11px] leading-relaxed shadow-2xs ${
                          isMe
                            ? 'bg-emerald-700 text-white rounded-br-xs'
                            : 'bg-white text-stone-900 border border-stone-200 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <div className={`text-[8px] text-right mt-1 ${isMe ? 'text-emerald-200' : 'text-stone-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Field Prompt Chips */}
              <div className="px-3 py-1.5 bg-white border-t border-stone-100 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
                <button
                  onClick={handleShareLocation}
                  className="px-2 py-0.5 bg-stone-100 hover:bg-emerald-50 text-stone-700 rounded-full text-[10px] whitespace-nowrap transition cursor-pointer flex items-center gap-1"
                >
                  <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                  <span>Share Farm GPS</span>
                </button>
                <button
                  onClick={() => handleSendMessage('Is your tractor available for 3 days next week?')}
                  className="px-2 py-0.5 bg-stone-100 hover:bg-emerald-50 text-stone-700 rounded-full text-[10px] whitespace-nowrap transition cursor-pointer"
                >
                  Availability next week?
                </button>
              </div>

              {/* Input */}
              <div className="p-2.5 bg-white border-t border-stone-200 shrink-0">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder={`Message ${counterpart?.name || ''}...`}
                    className="flex-1 px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-xl transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
