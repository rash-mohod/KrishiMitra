import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole, Notification } from '../types';
import { authApi, chatApi, favoritesApi, notificationApi } from '../services/api';

export interface RegisterParams {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  state: string;
  district: string;
  village?: string;
  bio?: string;
  avatarDataUrl?: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  role: UserRole | null;
  notifications: Notification[];
  unreadCount: number;
  unreadMessagesCount: number;
  favorites: string[];
  login: (email: string, password: string) => Promise<User>;
  register: (params: RegisterParams) => Promise<{ user: User; requiresEmailConfirmation: boolean; message?: string }>;
  logout: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<{ message: string }>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (password: string, token?: string) => Promise<{ message: string }>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  toggleFavorite: (equipmentId: string) => void;
  refreshNotifications: () => Promise<void>;
  refreshUnreadMessagesCount: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      favoritesApi.getFavorites().then(setFavorites).catch(() => setFavorites([]));
      refreshNotifications();
      refreshUnreadMessagesCount();

      const handleChatUpdate = () => {
        chatApi.getUnreadMessagesCount(user.id).then(count => setUnreadMessagesCount(count));
      };

      window.addEventListener('km_chat_updated', handleChatUpdate);
      return () => window.removeEventListener('km_chat_updated', handleChatUpdate);
    } else {
      setFavorites([]);
      setNotifications([]);
      setUnreadMessagesCount(0);
    }
  }, [user?.id]);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        const notifs = await notificationApi.getUserNotifications(currentUser.id).catch(() => []);
        setNotifications(notifs);
        const unreadMsgs = await chatApi.getUnreadMessagesCount(currentUser.id).catch(() => 0);
        setUnreadMessagesCount(unreadMsgs);
      }
    } catch (err) {
      console.error('Failed to load current session:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshNotifications = async () => {
    if (!user) return;
    try {
      const notifs = await notificationApi.getUserNotifications(user.id);
      setNotifications(notifs);
    } catch {}
  };

  const refreshUnreadMessagesCount = async () => {
    if (!user) return;
    try {
      const count = await chatApi.getUnreadMessagesCount(user.id);
      setUnreadMessagesCount(count);
    } catch {}
  };

  const login = async (email: string, password = ''): Promise<User> => {
    const loggedUser = await authApi.login(email, password);
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (params: RegisterParams): Promise<{ user: User; requiresEmailConfirmation: boolean; message?: string }> => {
    const result = await authApi.register(params);
    // If confirmation is NOT required (immediate session), set user; otherwise keep user unauthenticated until confirmed
    if (!result.requiresEmailConfirmation) {
      setUser(result.user);
    }
    return result;
  };

  const resendConfirmation = async (email: string): Promise<{ message: string }> => {
    return await authApi.resendConfirmation(email);
  };

  const forgotPassword = async (email: string): Promise<{ message: string }> => {
    return await authApi.forgotPassword(email);
  };

  const resetPassword = async (password: string, token?: string): Promise<{ message: string }> => {
    return await authApi.resetPassword(password, token);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setNotifications([]);
    setUnreadMessagesCount(0);
    setFavorites([]);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    const updated = await authApi.updateProfile(user.id, updates);
    setUser(updated);
  };

  const toggleFavorite = (equipmentId: string) => {
    if (!user) return;
    favoritesApi.toggleFavorite(equipmentId)
      .then(() => favoritesApi.getFavorites())
      .then(setFavorites)
      .catch(console.error);
  };

  const markNotificationAsRead = async (id: string) => {
    await notificationApi.markAsRead(id);
    await refreshNotifications();
  };

  const markAllNotificationsAsRead = async () => {
    if (!user) return;
    await notificationApi.markAllAsRead(user.id);
    await refreshNotifications();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        role: user ? user.role : null,
        notifications,
        unreadCount,
        unreadMessagesCount,
        favorites,
        login,
        register,
        logout,
        resendConfirmation,
        forgotPassword,
        resetPassword,
        updateProfile,
        toggleFavorite,
        refreshNotifications,
        refreshUnreadMessagesCount,
        markNotificationAsRead,
        markAllNotificationsAsRead
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
