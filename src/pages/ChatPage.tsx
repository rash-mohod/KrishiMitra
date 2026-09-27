import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ChatConversation, ChatMessage, ChatParticipant, Equipment, MessageReport, User } from '../types';
import { authApi, chatApi, equipmentApi } from '../services/api';
import { Avatar } from '../components/common/Avatar';
import { wsClient } from '../services/wsClient';
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  CornerUpLeft,
  Download,
  Edit3,
  FileText,
  Flag,
  HelpCircle,
  Image as ImageIcon,
  Info,
  LifeBuoy,
  MapPin,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smile,
  Sparkles,
  Tractor,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
  X
} from 'lucide-react';

interface ChatPageProps {
  initialConversationId?: string | null;
  onNavigate: (path: string) => void;
  onViewEquipment?: (id: string) => void;
}

const EMOJI_REACTIONS = ['👍', '❤️', '🚜', '🙏', '🌾', '🤝', '⭐'];

export const ChatPage: React.FC<ChatPageProps> = ({
  initialConversationId,
  onNavigate,
  onViewEquipment
}) => {
  const { user, switchUser } = useAuth();
  const { t, translateRole } = useLanguage();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(initialConversationId || null);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'EQUIPMENT' | 'SUPPORT' | 'DISPUTES' | 'ARCHIVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [attachmentPreview, setAttachmentPreview] = useState<{ url: string; name: string; type: 'IMAGE' | 'DOCUMENT' | 'AUDIO'; size?: number } | null>(null);

  // Real-time State
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({}); // userId -> name
  const [wsConnected, setWsConnected] = useState<boolean>(wsClient.isConnected);
  const [inChatSearchOpen, setInChatSearchOpen] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');

  // Reply state
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);

  // Edit state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // Report Modal state
  const [reportModalMessage, setReportModalMessage] = useState<ChatMessage | null>(null);
  const [reportReason, setReportReason] = useState<string>('INAPPROPRIATE');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);

  // Reaction picker state: messageId -> boolean
  const [activeReactionPickerId, setActiveReactionPickerId] = useState<string | null>(null);

  // Options Dropdown state
  const [convMenuOpen, setConvMenuOpen] = useState(false);

  // Compose New Message State (when no conversation is selected)
  const [composeRecipientId, setComposeRecipientId] = useState<string>('');
  const [composeEquipmentId, setComposeEquipmentId] = useState<string>('');
  const [composeText, setComposeText] = useState('');
  const [isSendingCompose, setIsSendingCompose] = useState(false);

  // Admin Reports Tab (For Admin users)
  const [adminReports, setAdminReports] = useState<MessageReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const selectedConvRef = useRef<string | null>(initialConversationId || null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingActiveRef = useRef(false);

  useEffect(() => {
    selectedConvRef.current = selectedConvId;
  }, [selectedConvId]);

  // Initialize WebSocket connection once per authenticated user.
  // Do not recreate all socket listeners whenever the selected conversation changes.
  useEffect(() => {
    if (user) {
      wsClient.connect();
    }

    const unsubConn = wsClient.on('connection_change', (data: { connected: boolean }) => {
      setWsConnected(data.connected);
    });

    const unsubMsgNew = wsClient.on('message:new', (newMsg: ChatMessage) => {
      if (selectedConvRef.current && newMsg.conversationId === selectedConvRef.current) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    });

    const unsubMsgEdited = wsClient.on('message:edited', (updated: ChatMessage) => {
      setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
    });

    const unsubMsgDeleted = wsClient.on('message:deleted', (data: { messageId: string; deletedAt: string }) => {
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, deletedAt: data.deletedAt, content: 'This message was deleted.', attachmentUrl: undefined } : m));
    });

    const unsubMsgReaction = wsClient.on('message:reaction', (data: { messageId: string; reactions: Record<string, string> }) => {
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, reactions: data.reactions } : m));
    });

    const unsubMsgRead = wsClient.on('message:read', (data: { conversationId: string; readByUserId: string }) => {
      if (selectedConvRef.current === data.conversationId) {
        setMessages(prev => prev.map(m => m.senderId === user?.id ? { ...m, isRead: true, status: 'READ' } : m));
      }
    });

    const unsubTypingStart = wsClient.on('typing:start', (data: { conversationId: string; userId: string; userName: string }) => {
      if (selectedConvRef.current === data.conversationId && data.userId !== user?.id) {
        setTypingUsers(prev => ({ ...prev, [data.userId]: data.userName }));
      }
    });

    const unsubTypingStop = wsClient.on('typing:stop', (data: { conversationId: string; userId: string }) => {
      setTypingUsers(prev => {
        const copy = { ...prev };
        delete copy[data.userId];
        return copy;
      });
    });

    const unsubPresence = wsClient.on('presence:update', (data: { userId: string; online: boolean; lastSeen?: string }) => {
      setConversations(prev => prev.map(c => ({
        ...c,
        participants: c.participants.map(p => (p.userId || p.id) === data.userId ? { ...p, isOnline: data.online, lastSeen: data.lastSeen } : p)
      })));
      if (activeConversation) {
        setActiveConversation(prev => prev ? {
          ...prev,
          participants: prev.participants.map(p => (p.userId || p.id) === data.userId ? { ...p, isOnline: data.online, lastSeen: data.lastSeen } : p)
        } : null);
      }
    });

    return () => {
      unsubConn();
      unsubMsgNew();
      unsubMsgEdited();
      unsubMsgDeleted();
      unsubMsgReaction();
      unsubMsgRead();
      unsubTypingStart();
      unsubTypingStop();
      unsubPresence();
    };
  }, [user?.id]);

  // Sync initialConversationId if prop updates
  useEffect(() => {
    if (initialConversationId) {
      setSelectedConvId(initialConversationId);
    }
  }, [initialConversationId]);

  // Join/Leave active conversation room via WebSocket
  useEffect(() => {
    if (selectedConvId) {
      wsClient.joinConversation(selectedConvId);
      setTypingUsers({});
      return () => {
        wsClient.leaveConversation(selectedConvId);
      };
    }
  }, [selectedConvId]);

  // Always stop typing cleanly when leaving a conversation or unmounting.
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        window.clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      if (typingActiveRef.current && selectedConvId) {
        wsClient.stopTyping(selectedConvId);
        typingActiveRef.current = false;
      }
    };
  }, [selectedConvId]);

  // Load conversations on mount & window storage events
  useEffect(() => {
    if (!user) return;
    loadConversations();

    const handleUpdate = () => {
      loadConversations(false);
      if (selectedConvId) {
        loadMessages(selectedConvId, false);
      }
    };

    window.addEventListener('km_chat_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('km_chat_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user?.id, selectedConvId]);

  // Load users and equipment for starting chats
  useEffect(() => {
    authApi.getAllUsers().then(users => {
      if (user) {
        // Enforce allowed messaging pairs
        const allowed = users.filter(u => {
          if (u.id === user.id) return false;
          if (user.role === 'FARMER') return u.role === 'OWNER' || u.role === 'ADMIN';
          if (user.role === 'OWNER') return u.role === 'FARMER' || u.role === 'ADMIN';
          return true; // Admin can message anyone
        });
        setAvailableUsers(allowed);
        if (allowed.length > 0 && !composeRecipientId) {
          setComposeRecipientId(allowed[0].id);
        }
      }
    });

    // Equipment options are loaded only when the new-chat composer is opened.
    // This keeps opening the Messenger page fast.
    if (user?.role === 'ADMIN') {
      loadAdminReports();
    }
  }, [user?.id, user?.role]);

  // Load composer-only data on demand instead of blocking Messenger startup.
  useEffect(() => {
    if (!newChatModalOpen || !user) return;

    let cancelled = false;
    Promise.all([
      authApi.getAllUsers(),
      equipmentApi.getEquipmentList()
    ]).then(([users, equipment]) => {
      if (cancelled) return;

      const allowed = users.filter(u => {
        if (u.id === user.id) return false;
        if (user.role === 'FARMER') return u.role === 'OWNER' || u.role === 'ADMIN';
        if (user.role === 'OWNER') return u.role === 'FARMER' || u.role === 'ADMIN';
        return true;
      });

      setAvailableUsers(allowed);
      if (allowed.length > 0 && !composeRecipientId) {
        setComposeRecipientId(allowed[0].id);
      }
      setAvailableEquipment(equipment.items);
    }).catch(err => {
      console.error('Failed to load new-chat options:', err);
    });

    return () => {
      cancelled = true;
    };
  }, [newChatModalOpen, user?.id, user?.role]);

  // Load selected conversation messages
  useEffect(() => {
    if (selectedConvId && user) {
      loadMessages(selectedConvId);
      chatApi.markConversationAsRead(selectedConvId, user.id);
    }
  }, [selectedConvId, user?.id]);

  // Auto scroll only when the message list changes.
  // Typing/presence events must not trigger repeated smooth-scroll animations.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async (showLoading = true) => {
    if (!user) return;
    if (showLoading) setIsLoadingConvs(true);
    try {
      const convs = await chatApi.getConversations(user.id);
      setConversations(convs);

      if (!selectedConvId && convs.length > 0) {
        setSelectedConvId(convs[0].id);
        setActiveConversation(convs[0]);
      } else if (selectedConvId) {
        const found = convs.find(c => c.id === selectedConvId);
        if (found) {
          setActiveConversation(found);
        }
      }
    } finally {
      if (showLoading) setIsLoadingConvs(false);
    }
  };

  const loadMessages = async (convId: string, showLoading = true) => {
    if (showLoading) setIsLoadingMessages(true);
    try {
      const [msgs, conv] = await Promise.all([
        chatApi.getMessages(convId),
        chatApi.getConversationById(convId)
      ]);
      setMessages(msgs);
      if (conv) setActiveConversation(conv);
    } finally {
      if (showLoading) setIsLoadingMessages(false);
    }
  };

  const loadAdminReports = async () => {
    if (user?.role !== 'ADMIN') return;
    setIsLoadingReports(true);
    try {
      const reports = await chatApi.getMessageReports();
      setAdminReports(reports);
    } catch (err) {
      console.error('Failed to load admin reports:', err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const convId = selectedConvRef.current;
    if (!value.trim() || !convId) return;

    // The input itself is intentionally uncontrolled. This prevents the entire 1,800-line
    // chat page from rerendering on every keypress. WebSocket typing is still debounced.
    if (!typingActiveRef.current) {
      wsClient.sendTyping(convId);
      typingActiveRef.current = true;
    }

    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = window.setTimeout(() => {
      if (selectedConvRef.current && typingActiveRef.current) {
        wsClient.stopTyping(selectedConvRef.current);
        typingActiveRef.current = false;
      }
      typingTimerRef.current = null;
    }, 700);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText !== undefined
      ? customText
      : (messageInputRef.current?.value ?? '');
    if ((!textToSend.trim() && !attachmentPreview) || !selectedConvId || !user) return;

    if (customText === undefined && messageInputRef.current) {
      messageInputRef.current.value = '';
    }

    const currentAttachment = attachmentPreview;
    const replyTarget = replyingToMessage;
    setAttachmentPreview(null);
    setReplyingToMessage(null);

    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (typingActiveRef.current) {
      wsClient.stopTyping(selectedConvId);
      typingActiveRef.current = false;
    }

    try {
      const newMsg = await chatApi.sendMessage({
        conversationId: selectedConvId,
        senderId: user.id,
        content: textToSend.trim(),
        attachmentUrl: currentAttachment?.url,
        attachmentType: currentAttachment?.type,
        attachmentName: currentAttachment?.name,
        attachmentSize: currentAttachment?.size,
        replyToMessageId: replyTarget?.id
      });

      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleSendComposeMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !composeRecipientId || !composeText.trim()) return;

    setIsSendingCompose(true);
    try {
      const targetUser = availableUsers.find(u => u.id === composeRecipientId);
      if (!targetUser) return;

      const selectedEq = availableEquipment.find(eq => eq.id === composeEquipmentId);

      const conv = await chatApi.getOrCreateConversation({
        currentUserId: user.id,
        targetUserId: targetUser.id,
        machineryId: selectedEq?.id,
        equipmentName: selectedEq?.name,
        equipmentImage: selectedEq?.images?.[0],
        equipmentRate: selectedEq?.pricePerDay,
        topic: selectedEq ? `Rental Discussion for ${selectedEq.name}` : `Direct Inquiry with ${targetUser.name}`,
        initialMessage: composeText.trim()
      });

      setComposeText('');
      await loadConversations(false);
      setSelectedConvId(conv.id);
      setActiveConversation(conv);
      await loadMessages(conv.id, false);
    } catch (err) {
      console.error('Failed to send compose message:', err);
    } finally {
      setIsSendingCompose(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size cannot exceed 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const isImage = file.type.startsWith('image/');
      setAttachmentPreview({
        url: reader.result as string,
        name: file.name,
        type: isImage ? 'IMAGE' : 'DOCUMENT',
        size: file.size
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleShareFarmLocation = () => {
    if (!user) return;
    const locationText = `📍 Shared Farm Location:\nVillage: ${user.village || 'Kalmeshwar'}\nDistrict: ${user.district}, ${user.state}\nGPS Coordinates: 21.2330° N, 78.9168° E (Field Gate 2)`;
    handleSendMessage(locationText);
  };

  const handleStartNewChatWithUser = async (targetUser: User, topic?: string, initialText?: string) => {
    if (!user) return;
    const conv = await chatApi.getOrCreateConversation({
      currentUserId: user.id,
      targetUserId: targetUser.id,
      topic: topic || (targetUser.role === 'ADMIN' ? 'Agri Extension Desk Support' : `Direct Inquiry with ${targetUser.name}`),
      initialMessage: initialText || (targetUser.role === 'ADMIN' ? 'Namaste Agri Desk, I have an inquiry regarding equipment subsidy and verification.' : `Namaste ${targetUser.name} ji, connecting regarding farm machinery rental services.`)
    });

    setNewChatModalOpen(false);
    await loadConversations(false);
    setSelectedConvId(conv.id);
    setActiveConversation(conv);
    await loadMessages(conv.id, false);
  };

  const handleToggleArchive = async () => {
    if (!selectedConvId) return;
    try {
      const isArchived = await chatApi.toggleArchive(selectedConvId);
      setConvMenuOpen(false);
      await loadConversations(false);
    } catch (err) {
      console.error('Failed to toggle archive:', err);
    }
  };

  const handleToggleMute = async () => {
    if (!selectedConvId) return;
    try {
      await chatApi.toggleMute(selectedConvId);
      setConvMenuOpen(false);
      await loadConversations(false);
    } catch (err) {
      console.error('Failed to toggle mute:', err);
    }
  };

  const handleSaveEditMessage = async (msgId: string) => {
    if (!editingContent.trim()) return;
    try {
      const updated = await chatApi.editMessage(msgId, editingContent.trim());
      setMessages(prev => prev.map(m => m.id === msgId ? updated : m));
      setEditingMessageId(null);
      setEditingContent('');
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await chatApi.deleteMessage(msgId);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deletedAt: new Date().toISOString(), content: 'This message was deleted.', attachmentUrl: undefined } : m));
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const handleReactToMessage = async (msgId: string, emoji: string) => {
    setActiveReactionPickerId(null);
    try {
      const updated = await chatApi.reactToMessage(msgId, emoji);
      setMessages(prev => prev.map(m => m.id === msgId ? updated : m));
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalMessage) return;

    setIsSubmittingReport(true);
    try {
      await chatApi.reportMessage(reportModalMessage.id, reportReason, reportDescription);
      setReportSuccessMsg('Report submitted to moderation desk.');
      setTimeout(() => {
        setReportModalMessage(null);
        setReportSuccessMsg(null);
        setReportDescription('');
      }, 1500);
    } catch (err) {
      console.error('Failed to submit report:', err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleResolveReport = async (reportId: string, status: string) => {
    try {
      await chatApi.updateMessageReport(reportId, status);
      await loadAdminReports();
    } catch (err) {
      console.error('Failed to update report status:', err);
    }
  };

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      const counterpart = c.participants.find(p => (p.userId || p.id) !== user?.id);
      const matchesSearch = !searchQuery.trim() ||
        (counterpart?.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.equipmentName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.bookingCode?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.disputeCode?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.topic?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      const myParticipant = c.participants.find(p => (p.userId || p.id) === user?.id);
      const isArchived = !!myParticipant?.isArchived;

      if (filterType === 'ARCHIVED') return isArchived;
      if (isArchived) return false; // Hide archived from normal tabs

      if (filterType === 'EQUIPMENT') {
        return c.type === 'RENTER_OWNER' || c.type === 'BOOKING' || !!c.equipmentId;
      }
      if (filterType === 'SUPPORT') {
        return c.type === 'ADMIN_RENTER' || c.type === 'ADMIN_OWNER' || c.type === 'SUPPORT';
      }
      if (filterType === 'DISPUTES') {
        return c.type === 'DISPUTE' || !!c.disputeId;
      }
      return true;
    });
  }, [conversations, searchQuery, filterType, user?.id]);

  // In-chat filtered messages
  const filteredMessages = useMemo(() => {
    if (!inChatSearchQuery.trim()) return messages;
    const q = inChatSearchQuery.toLowerCase().trim();
    return messages.filter(m => m.content.toLowerCase().includes(q));
  }, [messages, inChatSearchQuery]);

  const getCounterpart = (conv: ChatConversation): ChatParticipant => {
    return conv.participants.find(p => (p.userId || p.id) !== user?.id) || conv.participants[0];
  };

  const activeCounterpart = activeConversation ? getCounterpart(activeConversation) : null;
  const myParticipant = activeConversation?.participants.find(p => (p.userId || p.id) === user?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
              {t('chat.title', 'Personal Live Chat')}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{wsConnected ? 'Real-time Connected' : 'Syncing'}</span>
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-stone-900 mt-1">
            {user?.role === 'FARMER'
              ? 'Direct Machinery Owner & Desk Chat'
              : user?.role === 'OWNER'
              ? 'Farmer Inquiries & Fleet Dispatch Chat'
              : 'Agri Support Desk & Moderation Inbox'}
          </h1>
        </div>

        {/* Action Controls & Multi-User Switcher Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {user && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 rounded-xl border border-stone-200 text-xs">
              <span className="text-stone-500 font-medium">Logged in as:</span>
              <span className="font-bold text-stone-900 truncate max-w-[120px]">{user.name}</span>
              <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-bold">
                {user.role}
              </span>
            </div>
          )}

          {user?.role !== 'ADMIN' && (
            <button
              onClick={() => {
                const admin = availableUsers.find(u => u.role === 'ADMIN');
                if (admin) handleStartNewChatWithUser(admin, 'Official Krishi Mitra Helpdesk');
              }}
              className="px-3.5 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <LifeBuoy className="w-4 h-4 text-amber-400" />
              <span>Agri Support Desk</span>
            </button>
          )}

          <button
            onClick={() => {
              setSelectedConvId(null);
              setActiveConversation(null);
            }}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Compose Message</span>
          </button>
        </div>
      </div>

      {/* Main Split Chat Layout */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] h-[calc(100vh-220px)] max-h-[840px]">
        
        {/* =======================================================================
            LEFT SIDEBAR: Conversation List
            ======================================================================= */}
        <div className={`lg:col-span-4 border-r border-stone-200 flex flex-col bg-stone-50/50 ${
          selectedConvId ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {/* Search, Compose Button & Filter Tabs */}
          <div className="p-3.5 border-b border-stone-200 space-y-2.5 bg-white">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search chats, machinery, bookings..."
                  className="w-full pl-9 pr-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setNewChatModalOpen(true)}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition cursor-pointer shrink-0"
                title="Start Direct Chat"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl text-[11px] font-semibold text-stone-600 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                  filterType === 'ALL' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'hover:text-stone-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('EQUIPMENT')}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                  filterType === 'EQUIPMENT' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'hover:text-stone-900'
                }`}
              >
                Rentals
              </button>
              <button
                onClick={() => setFilterType('SUPPORT')}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                  filterType === 'SUPPORT' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'hover:text-stone-900'
                }`}
              >
                Support
              </button>
              <button
                onClick={() => setFilterType('DISPUTES')}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                  filterType === 'DISPUTES' ? 'bg-white text-amber-800 shadow-xs font-bold' : 'hover:text-stone-900'
                }`}
              >
                Disputes
              </button>
              <button
                onClick={() => setFilterType('ARCHIVED')}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                  filterType === 'ARCHIVED' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'hover:text-stone-900'
                }`}
              >
                Archived
              </button>
            </div>
          </div>

          {/* Conversation List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {isLoadingConvs ? (
              <div className="p-8 text-center text-xs text-stone-500 space-y-2">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Loading personal conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-stone-800">
                  {filterType === 'ARCHIVED' ? 'No archived conversations' : 'No conversations found'}
                </p>
                <p className="text-[11px] text-stone-500 max-w-[200px] mx-auto">
                  Message a verified tractor owner or the Krishi Mitra Agri Desk directly.
                </p>
                <button
                  onClick={() => setNewChatModalOpen(true)}
                  className="px-3.5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition cursor-pointer shadow-xs"
                >
                  + New Chat
                </button>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const counterpart = getCounterpart(conv);
                const isSelected = selectedConvId === conv.id;
                const unread = user ? (conv.unreadCountForUser[user.id] || 0) : 0;
                const isAdmin = counterpart.role === 'ADMIN';
                const isOnline = counterpart.isOnline;
                const isTyping = Object.keys(typingUsers).includes(counterpart.userId || counterpart.id);

                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConvId(conv.id);
                      setActiveConversation(conv);
                    }}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/80 border-l-4 border-emerald-700'
                        : 'hover:bg-white bg-transparent'
                    }`}
                  >
                    {/* Avatar with Personal Online Indicator */}
                    <div className="relative shrink-0">
                      <Avatar
                        src={counterpart.avatarUrl}
                        name={counterpart.name}
                        className="w-10 h-10 rounded-2xl border border-stone-200 shadow-xs"
                        iconClassName="w-5 h-5"
                      />
                      {isOnline ? (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-600/30" />
                      ) : (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-stone-300 border-2 border-white" />
                      )}
                    </div>

                    {/* Content preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1 mb-0.5">
                        <h4 className="font-bold text-xs text-stone-900 truncate">
                          {counterpart.name}
                        </h4>
                        <span className="text-[10px] text-stone-400 shrink-0 font-medium">
                          {conv.lastMessageAt || conv.lastMessageTime ? new Date(conv.lastMessageAt || conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      {/* Equipment / Dispute / Admin tag */}
                      <div className="flex items-center gap-1 mb-1">
                        {conv.disputeCode ? (
                          <span className="text-[9px] font-bold text-red-800 bg-red-100 px-1.5 py-0.2 rounded">
                            ⚖️ Dispute #{conv.disputeCode}
                          </span>
                        ) : isAdmin ? (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                            Agri Extension Desk
                          </span>
                        ) : conv.equipmentName ? (
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded truncate max-w-[170px]">
                            🚜 {conv.equipmentName}
                          </span>
                        ) : (
                          <span className="text-[9px] text-stone-500 font-medium">
                            {translateRole(counterpart.role)}
                          </span>
                        )}
                      </div>

                      {isTyping ? (
                        <p className="text-[11px] font-bold text-emerald-700 animate-pulse flex items-center gap-1">
                          <span>typing...</span>
                        </p>
                      ) : (
                        <p className={`text-[11px] truncate leading-tight ${
                          unread > 0 ? 'font-bold text-stone-900' : 'text-stone-500'
                        }`}>
                          {conv.lastMessageSenderId === user?.id && (
                            <span className="text-stone-400 font-normal">You: </span>
                          )}
                          {conv.lastMessage}
                        </p>
                      )}
                    </div>

                    {/* Unread badge */}
                    {unread > 0 && (
                      <div className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
                        {unread}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* =======================================================================
            RIGHT PANE: Active Chat OR Full Compose Pane
            ======================================================================= */}
        <div className={`lg:col-span-8 flex flex-col h-full bg-stone-50/30 ${
          !selectedConvId ? 'flex' : 'flex'
        }`}>
          {activeConversation && activeCounterpart ? (
            <>
              {/* Active Conversation Personal Header */}
              <div className="px-4 sm:px-5 py-3 bg-white border-b border-stone-200 flex items-center justify-between gap-3 shrink-0 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setSelectedConvId(null)}
                    className="lg:hidden p-1.5 -ml-1 text-stone-600 hover:text-stone-900 rounded-lg cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="relative shrink-0">
                    <Avatar
                      src={activeCounterpart.avatarUrl}
                      name={activeCounterpart.name}
                      className="w-10 h-10 rounded-2xl border border-stone-200 shrink-0"
                      iconClassName="w-5 h-5"
                    />
                    {activeCounterpart.isOnline ? (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-600/30" />
                    ) : (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-stone-300 border-2 border-white" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-stone-900 truncate">
                        {activeCounterpart.name}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        activeCounterpart.role === 'ADMIN'
                          ? 'bg-stone-900 text-amber-300'
                          : activeCounterpart.role === 'OWNER'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {activeCounterpart.role === 'ADMIN'
                          ? 'Agri Support Desk'
                          : activeCounterpart.role === 'OWNER'
                          ? 'Fleet Owner'
                          : 'Farmer'}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-500 flex items-center gap-2">
                      {activeCounterpart.isOnline ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online Now
                        </span>
                      ) : (
                        <span className="text-stone-400">
                          {activeCounterpart.lastSeen ? `Last active ${new Date(activeCounterpart.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Offline'}
                        </span>
                      )}
                      {activeCounterpart.location && (
                        <>
                          <span>•</span>
                          <span className="truncate">{activeCounterpart.location}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Direct Personal Communication Channels & Options */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Search in chat button */}
                  <button
                    onClick={() => setInChatSearchOpen(!inChatSearchOpen)}
                    className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                    title="Search messages"
                  >
                    <Search className="w-4 h-4" />
                  </button>

                  {activeCounterpart.phone && (
                    <>
                      <a
                        href={`tel:${activeCounterpart.phone}`}
                        className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl border border-stone-200 transition flex items-center gap-1"
                        title={`Call ${activeCounterpart.name}`}
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="hidden md:inline">{activeCounterpart.phone}</span>
                      </a>
                    </>
                  )}

                  {/* Conversation Options Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setConvMenuOpen(!convMenuOpen)}
                      className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                      title="More Options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {convMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-stone-200 py-1.5 z-30 animate-in fade-in zoom-in-95">
                        <button
                          onClick={handleToggleArchive}
                          className="w-full px-3.5 py-2 text-left text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <Archive className="w-3.5 h-3.5 text-stone-500" />
                          <span>{myParticipant?.isArchived ? 'Unarchive Chat' : 'Archive Chat'}</span>
                        </button>
                        <button
                          onClick={handleToggleMute}
                          className="w-full px-3.5 py-2 text-left text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          {myParticipant?.isMuted ? <Bell className="w-3.5 h-3.5 text-stone-500" /> : <BellOff className="w-3.5 h-3.5 text-stone-500" />}
                          <span>{myParticipant?.isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setConvMenuOpen(false);
                            window.print();
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <Download className="w-3.5 h-3.5 text-stone-500" />
                          <span>Export Transcript</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* In-Chat Message Search Bar */}
              {inChatSearchOpen && (
                <div className="px-4 py-2 bg-stone-100 border-b border-stone-200 flex items-center gap-2">
                  <Search className="w-4 h-4 text-stone-500" />
                  <input
                    type="text"
                    value={inChatSearchQuery}
                    onChange={e => setInChatSearchQuery(e.target.value)}
                    placeholder="Search inside this conversation..."
                    className="flex-1 px-3 py-1 bg-white border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setInChatSearchQuery('');
                      setInChatSearchOpen(false);
                    }}
                    className="p-1 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Contextual Machinery or Dispute Banner */}
              {activeConversation.disputeCode ? (
                <div className="px-5 py-2.5 bg-red-50 border-b border-red-200 flex items-center justify-between gap-3 text-xs shrink-0">
                  <div className="flex items-center gap-2 text-red-900 font-bold">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>Dispute Arbitration Channel #{activeConversation.disputeCode}</span>
                  </div>
                  <span className="text-[11px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-semibold">
                    Admin Mediated
                  </span>
                </div>
              ) : activeConversation.equipmentId && activeConversation.equipmentName ? (
                <div className="px-5 py-2.5 bg-gradient-to-r from-emerald-50 to-stone-50 border-b border-emerald-100 flex items-center justify-between gap-3 text-xs shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {activeConversation.equipmentImage && (
                      <img
                        src={activeConversation.equipmentImage}
                        alt={activeConversation.equipmentName}
                        className="w-10 h-10 rounded-xl object-cover border border-emerald-200 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-stone-900 text-xs truncate">
                        {activeConversation.equipmentName}
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-2">
                        {activeConversation.equipmentRate ? (
                          <span className="text-emerald-800 font-bold">₹{activeConversation.equipmentRate}/day</span>
                        ) : null}
                        {activeConversation.bookingCode ? (
                          <span className="font-mono text-[10px] text-stone-600 bg-stone-200/70 px-1.5 py-0.2 rounded">
                            Booking #{activeConversation.bookingCode}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onViewEquipment && (
                      <button
                        onClick={() => onViewEquipment(activeConversation.equipmentId!)}
                        className="px-3 py-1.5 bg-white border border-stone-300 hover:border-emerald-500 text-stone-700 rounded-lg font-bold text-xs transition cursor-pointer"
                      >
                        View Specs
                      </button>
                    )}
                    {user?.role === 'FARMER' && onViewEquipment && (
                      <button
                        onClick={() => onViewEquipment(activeConversation.equipmentId!)}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs transition shadow-2xs cursor-pointer"
                      >
                        Book Machine
                      </button>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
                
                {/* 1-on-1 Security notice */}
                <div className="text-center my-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200/60 text-stone-600 text-[11px] font-medium">
                    <Shield className="w-3 h-3 text-emerald-600" />
                    Direct communication between {user.name} and {activeCounterpart.name}
                  </span>
                </div>

                {isLoadingMessages ? (
                  <div className="p-12 text-center text-xs text-stone-400 space-y-2">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p>Loading messages...</p>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <Avatar
                      src={activeCounterpart.avatarUrl}
                      name={activeCounterpart.name}
                      className="w-16 h-16 rounded-full mx-auto border-2 border-emerald-600 p-0.5"
                      iconClassName="w-8 h-8"
                    />
                    <h4 className="font-bold text-sm text-stone-800">
                      Direct Personal Chat with {activeCounterpart.name}
                    </h4>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      Discuss field schedule, driver allowance, soil condition, or machinery delivery details.
                    </p>
                  </div>
                ) : (
                  filteredMessages.map((msg, index) => {
                    const isMe = msg.senderId === user?.id;
                    const showAvatar = index === 0 || filteredMessages[index - 1].senderId !== msg.senderId;
                    const isEditing = editingMessageId === msg.id;
                    const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;

                    return (
                      <div
                        key={msg.id}
                        className={`group relative flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && (
                          <div className="w-7 h-7 shrink-0">
                            {showAvatar && (
                              <Avatar
                                src={msg.senderAvatar}
                                name={msg.senderName}
                                className="w-7 h-7 rounded-xl border border-stone-200"
                                iconClassName="w-4 h-4"
                              />
                            )}
                          </div>
                        )}

                        <div className={`max-w-[85%] sm:max-w-[72%] space-y-1`}>
                          {!isMe && showAvatar && (
                            <span className="text-[10px] font-bold text-stone-500 ml-1">
                              {msg.senderName}
                            </span>
                          )}

                          {/* Reply quote banner if replying to a prior message */}
                          {msg.replyToMessageSnippet && (
                            <div className={`text-[10px] p-2 rounded-xl border-l-3 mb-1 truncate ${
                              isMe ? 'bg-emerald-800/60 text-emerald-100 border-emerald-300' : 'bg-stone-100 text-stone-600 border-emerald-600'
                            }`}>
                              <span className="font-bold">{msg.replyToSenderName || 'Replying to'}: </span>
                              <span className="italic">{msg.replyToMessageSnippet}</span>
                            </div>
                          )}

                          <div
                            className={`relative p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                              isMe
                                ? 'bg-emerald-700 text-white rounded-br-xs'
                                : 'bg-white text-stone-900 border border-stone-200 rounded-bl-xs'
                            }`}
                          >
                            {/* Attachment view if present */}
                            {msg.attachmentUrl && !msg.deletedAt && (
                              <div className="mb-2 rounded-xl overflow-hidden border border-black/10">
                                {msg.attachmentType === 'IMAGE' ? (
                                  <img
                                    src={msg.attachmentUrl}
                                    alt="Shared attachment"
                                    className="max-h-48 w-full object-cover"
                                  />
                                ) : (
                                  <a
                                    href={msg.attachmentUrl}
                                    download={msg.attachmentName || 'download'}
                                    className="p-3 bg-stone-100 text-stone-800 flex items-center gap-2 hover:bg-stone-200 transition"
                                  >
                                    <FileText className="w-5 h-5 text-emerald-700 shrink-0" />
                                    <span className="font-bold text-[11px] truncate">{msg.attachmentName || 'Download Document'}</span>
                                  </a>
                                )}
                              </div>
                            )}

                            {isEditing ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editingContent}
                                  onChange={e => setEditingContent(e.target.value)}
                                  className="w-full p-2 text-stone-900 bg-white border border-stone-300 rounded-lg text-xs focus:outline-none"
                                  rows={2}
                                />
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setEditingMessageId(null)}
                                    className="px-2 py-1 text-[10px] bg-stone-200 text-stone-800 rounded font-bold"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveEditMessage(msg.id)}
                                    className="px-2 py-1 text-[10px] bg-emerald-900 text-white rounded font-bold"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className={`whitespace-pre-wrap ${msg.deletedAt ? 'italic text-stone-400' : ''}`}>
                                {msg.content}
                              </p>
                            )}

                            {/* Message footer timestamp & Edited/Read confirmation */}
                            <div className={`flex items-center justify-end gap-1.5 text-[9px] mt-1 ${
                              isMe ? 'text-emerald-200' : 'text-stone-400'
                            }`}>
                              {msg.editedAt && (
                                <span className="italic">(edited)</span>
                              )}
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && (
                                <CheckCheck className={`w-3 h-3 ${msg.isRead ? 'text-emerald-300' : 'text-emerald-400/60'}`} />
                              )}
                            </div>
                          </div>

                          {/* Message Reactions display */}
                          {hasReactions && (
                            <div className={`flex items-center gap-1 flex-wrap ${isMe ? 'justify-end' : 'justify-start'}`}>
                              {Object.entries(msg.reactions!).map(([rUserId, emoji]) => {
                                const emojiStr = String(emoji);
                                return (
                                  <button
                                    key={rUserId}
                                    onClick={() => handleReactToMessage(msg.id, emojiStr)}
                                    className={`px-1.5 py-0.5 rounded-full text-[11px] border transition cursor-pointer flex items-center gap-0.5 ${
                                      rUserId === user?.id
                                        ? 'bg-emerald-100 border-emerald-300 text-emerald-950 font-bold'
                                        : 'bg-white border-stone-200 text-stone-700'
                                    }`}
                                  >
                                    <span>{emojiStr}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Hover Action Bar (Reply, React, Edit, Delete, Report) */}
                        {!msg.deletedAt && (
                          <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-white border border-stone-200 rounded-xl px-1.5 py-0.5 shadow-sm text-stone-500">
                            {/* React button */}
                            <button
                              onClick={() => setActiveReactionPickerId(activeReactionPickerId === msg.id ? null : msg.id)}
                              className="p-1 hover:text-amber-500 hover:bg-stone-100 rounded-lg cursor-pointer"
                              title="Add reaction"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>

                            {/* Reply button */}
                            <button
                              onClick={() => setReplyingToMessage(msg)}
                              className="p-1 hover:text-emerald-700 hover:bg-stone-100 rounded-lg cursor-pointer"
                              title="Reply"
                            >
                              <CornerUpLeft className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit (own only) */}
                            {isMe && (
                              <button
                                onClick={() => {
                                  setEditingMessageId(msg.id);
                                  setEditingContent(msg.content);
                                }}
                                className="p-1 hover:text-emerald-700 hover:bg-stone-100 rounded-lg cursor-pointer"
                                title="Edit message"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete (own or admin) */}
                            {(isMe || user?.role === 'ADMIN') && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-1 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                title="Delete message"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Report (counterpart message only) */}
                            {!isMe && (
                              <button
                                onClick={() => setReportModalMessage(msg)}
                                className="p-1 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                title="Report message"
                              >
                                <Flag className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Emoji reaction popup */}
                            {activeReactionPickerId === msg.id && (
                              <div className="absolute -top-9 right-0 bg-white border border-stone-200 rounded-2xl shadow-xl px-2 py-1 flex items-center gap-1 z-20 animate-in fade-in zoom-in-95">
                                {EMOJI_REACTIONS.map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReactToMessage(msg.id, emoji)}
                                    className="p-1 hover:scale-125 transition text-sm cursor-pointer"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Live Typing Banner */}
                {Object.keys(typingUsers).length > 0 && (
                  <div className="flex items-center gap-2 text-stone-500 text-xs py-1 italic animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    <span>{Object.values(typingUsers).join(', ')} is typing... ✍️</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Field Actions Bar */}
              <div className="px-4 py-2 bg-stone-100/80 border-t border-stone-200 overflow-x-auto flex items-center gap-2 text-xs shrink-0 no-scrollbar">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider shrink-0">
                  Quick Inquiries:
                </span>
                
                <button
                  type="button"
                  onClick={handleShareFarmLocation}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-stone-700 rounded-full border border-stone-200 text-[11px] font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>Share Farm Location</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendMessage('Is the machine operator certified and familiar with local soil conditions?')}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-stone-700 rounded-full border border-stone-200 text-[11px] font-medium whitespace-nowrap transition cursor-pointer shadow-2xs"
                >
                  Operator details?
                </button>

                <button
                  type="button"
                  onClick={() => handleSendMessage('Can we confirm delivery timing and diesel tank fill status?')}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-stone-700 rounded-full border border-stone-200 text-[11px] font-medium whitespace-nowrap transition cursor-pointer shadow-2xs"
                >
                  Delivery & Diesel?
                </button>

                <button
                  type="button"
                  onClick={() => handleSendMessage('What is the best discounted rate for 4+ continuous days of rental?')}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-stone-700 rounded-full border border-stone-200 text-[11px] font-medium whitespace-nowrap transition cursor-pointer shadow-2xs"
                >
                  Discount for multi-day?
                </button>
              </div>

              {/* Reply Quote Banner */}
              {replyingToMessage && (
                <div className="px-4 py-2 bg-emerald-50/90 border-t border-emerald-200 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <CornerUpLeft className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div className="truncate">
                      <span className="font-bold text-emerald-950">Replying to {replyingToMessage.senderName}: </span>
                      <span className="text-emerald-800 truncate">{replyingToMessage.content}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyingToMessage(null)}
                    className="p-1 text-emerald-700 hover:text-emerald-900 rounded-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Attachment Preview if selected */}
              {attachmentPreview && (
                <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    {attachmentPreview.type === 'IMAGE' ? (
                      <ImageIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                    )}
                    <span className="font-bold text-emerald-950 truncate">{attachmentPreview.name}</span>
                  </div>
                  <button
                    onClick={() => setAttachmentPreview(null)}
                    className="p-1 text-emerald-700 hover:text-emerald-900 rounded-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Bottom Message Input Bar */}
              <div className="p-3 sm:p-4 bg-white border-t border-stone-200 shrink-0">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                    title="Attach Farm Photo or Document"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    ref={messageInputRef}
                    type="text"
                    onChange={handleInputChange}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Type your message to ${activeCounterpart.name}...`}
                    className="flex-1 px-4 py-3 bg-stone-100 border border-stone-200 rounded-2xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                  />

                  <button
                    type="submit"
                    className="px-4 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:hover:bg-emerald-700 text-white rounded-2xl shadow-md transition cursor-pointer shrink-0 flex items-center justify-center gap-1.5 text-xs font-bold font-display"
                  >
                    <span>Send</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* =======================================================================
               COMPOSE NEW MESSAGE PANE
               ======================================================================= */
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="max-w-xl w-full mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md">
                    <Edit3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-lg font-display">
                      Compose & Send New Message
                    </h3>
                    <p className="text-xs text-stone-500">
                      Send a direct inquiry to equipment owners, farmers, or official platform support.
                    </p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSendComposeMessage} className="space-y-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                  
                  {/* Select Recipient */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Select Recipient *
                    </label>
                    <select
                      value={composeRecipientId}
                      onChange={e => setComposeRecipientId(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      {availableUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} — {u.role === 'ADMIN' ? 'Agri Extension Desk (Officer)' : u.role === 'OWNER' ? `Fleet Owner (${u.district})` : `Farmer (${u.district})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Optional: Reference Machinery */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Referenced Machinery (Optional)
                    </label>
                    <select
                      value={composeEquipmentId}
                      onChange={e => setComposeEquipmentId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="">-- None / General Inquiries --</option>
                      {availableEquipment.map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name} (₹{eq.pricePerDay}/day - {eq.district})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message Textarea */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Your Message / Farm Inquiry *
                    </label>
                    <textarea
                      rows={4}
                      value={composeText}
                      onChange={e => setComposeText(e.target.value)}
                      placeholder="Namaste, I would like to inquire about machinery availability, driver allowance, and farm delivery for the upcoming cropping cycle..."
                      required
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 leading-relaxed"
                    />
                  </div>

                  {/* Quick Preset Templates */}
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 block mb-1.5">
                      Quick Suggestions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setComposeText('Namaste ji, is this machinery available for 3 days of ploughing next week?')}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 text-stone-700 rounded-lg text-[11px] font-medium border border-stone-200 transition text-left cursor-pointer"
                      >
                        Availability next week?
                      </button>
                      <button
                        type="button"
                        onClick={() => setComposeText('Does the daily rental include a skilled tractor driver and attachments?')}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 text-stone-700 rounded-lg text-[11px] font-medium border border-stone-200 transition text-left cursor-pointer"
                      >
                        Driver & attachments?
                      </button>
                      <button
                        type="button"
                        onClick={() => setComposeText('Can you deliver the machine directly to our field gate in the village?')}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 text-stone-700 rounded-lg text-[11px] font-medium border border-stone-200 transition text-left cursor-pointer"
                      >
                        Field delivery?
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSendingCompose || !composeText.trim() || !composeRecipientId}
                      className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSendingCompose ? 'Sending Message...' : 'Send Message Now'}</span>
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}
        </div>

      </div>

      {/* =======================================================================
          MODAL: Start New Chat
          ======================================================================= */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-base font-display">
                  Start Direct Conversation
                </h3>
                <p className="text-xs text-stone-500">
                  Select a farmer, equipment owner, or support officer
                </p>
              </div>
              <button
                onClick={() => setNewChatModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto divide-y divide-stone-100">
              {availableUsers.map(targetUser => (
                <button
                  key={targetUser.id}
                  onClick={() => handleStartNewChatWithUser(targetUser)}
                  className="w-full py-3 px-2 flex items-center justify-between text-left hover:bg-stone-50 rounded-2xl transition cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={targetUser.avatarUrl}
                      name={targetUser.name}
                      className="w-10 h-10 rounded-2xl border border-stone-200 shrink-0"
                      iconClassName="w-5 h-5"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-stone-900 text-xs truncate">
                        {targetUser.name}
                      </div>
                      <div className="text-[10px] text-stone-500 truncate">
                        {targetUser.village ? targetUser.village + ', ' : ''}{targetUser.district}, {targetUser.state}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    targetUser.role === 'ADMIN'
                      ? 'bg-stone-900 text-amber-300'
                      : targetUser.role === 'OWNER'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {targetUser.role === 'ADMIN' ? 'Agri Support Officer' : translateRole(targetUser.role)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL: Report Message
          ======================================================================= */}
      {reportModalMessage && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base text-stone-900">Report Message</h3>
              </div>
              <button
                onClick={() => setReportModalMessage(null)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSuccessMsg ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold text-center">
                {reportSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-700">
                  <span className="font-bold block text-stone-900 mb-1">Message content:</span>
                  <p className="italic">{reportModalMessage.content}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Reason for report *
                  </label>
                  <select
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="SPAM">Spam or unwanted advertising</option>
                    <option value="HARASSMENT">Harassment or abusive language</option>
                    <option value="FRAUD">Fraud or suspicious identity</option>
                    <option value="SUSPICIOUS_PAYMENT">Suspicious payment / offline bypass</option>
                    <option value="INAPPROPRIATE">Inappropriate agricultural content</option>
                    <option value="OTHER">Other grievance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Additional notes for moderation desk (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={reportDescription}
                    onChange={e => setReportDescription(e.target.value)}
                    placeholder="Provide additional context or details..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalMessage(null)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
