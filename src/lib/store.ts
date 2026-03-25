import { create } from 'zustand';

// نوع المستخدم
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  isMainAdmin: boolean;
  createdAt: string;
}

// نوع التوصية
export interface Recommendation {
  id: string;
  symbol: string;
  action: string;
  price: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
  timeframe?: string | null;
  notes?: string | null;
  source: string;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string | null;
}

// نوع الرسالة
export interface Message {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  senderId: string;
  receiverId: string;
  sender?: User;
  receiver?: User;
}

// نوع طلب الانضمام
export interface RegistrationRequest {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  processedAt?: string | null;
}

// نوع الإشعار
export interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

// حالة التطبيق
interface AppState {
  // المستخدم الحالي
  user: User | null;
  setUser: (user: User | null) => void;

  // التوصيات
  recommendations: Recommendation[];
  setRecommendations: (recommendations: Recommendation[]) => void;

  // الرسائل
  messages: Message[];
  setMessages: (messages: Message[]) => void;

  // طلبات الانضمام
  registrationRequests: RegistrationRequest[];
  setRegistrationRequests: (requests: RegistrationRequest[]) => void;

  // المستخدمين (للأدمن)
  users: User[];
  setUsers: (users: User[]) => void;

  // الإشعارات
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;

  // حالة التحميل
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // حالة القائمة الجانبية
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // المستخدم المحدد للمحادثة
  selectedChatUser: User | null;
  setSelectedChatUser: (user: User | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // المستخدم الحالي
  user: null,
  setUser: (user) => set({ user }),

  // التوصيات
  recommendations: [],
  setRecommendations: (recommendations) => set({ recommendations }),

  // الرسائل
  messages: [],
  setMessages: (messages) => set({ messages }),

  // طلبات الانضمام
  registrationRequests: [],
  setRegistrationRequests: (registrationRequests) => set({ registrationRequests }),

  // المستخدمين
  users: [],
  setUsers: (users) => set({ users }),

  // الإشعارات
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),

  // حالة التحميل
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),

  // حالة القائمة الجانبية
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  // المستخدم المحدد للمحادثة
  selectedChatUser: null,
  setSelectedChatUser: (selectedChatUser) => set({ selectedChatUser }),
}));
