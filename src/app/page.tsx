'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, TrendingDown, Users, MessageSquare, Bell, Settings, 
  LogOut, Menu, X, Home, FileText, Mail, UserCog, ClipboardList,
  ChevronLeft, ChevronRight, Search, Plus, Trash2, Edit, Check, XCircle,
  Clock, DollarSign, Target, AlertTriangle, Info, Send, RefreshCw
} from 'lucide-react';

// أنواع البيانات
interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  isMainAdmin: boolean;
  createdAt: string;
}

interface Recommendation {
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

interface Message {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  senderId: string;
  receiverId: string;
  sender?: User;
  receiver?: User;
}

interface RegistrationRequest {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  processedAt?: string | null;
}

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

// الحالات
type ViewType = 'dashboard' | 'users' | 'requests' | 'recommendations' | 'messages' | 'settings' | 'about';

export default function ForexYemeniApp() {
  // حالات المستخدم والمصادقة
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // حالات النموذج
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', phone: '' });
  
  // حالات العرض
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // حالات البيانات
  const [users, setUsers] = useState<User[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // حالات المحادثة
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // حالات الحوار
  const [showAddRecommendation, setShowAddRecommendation] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);
  
  // حالات الإعدادات
  const [settingsForm, setSettingsForm] = useState({ name: '', email: '', phone: '', currentPassword: '', newPassword: '' });
  
  // نموذج التوصية الجديدة
  const [newRecommendation, setNewRecommendation] = useState({
    symbol: '',
    action: 'buy',
    price: '',
    stopLoss: '',
    takeProfit: '',
    timeframe: '',
    notes: ''
  });
  
  const { toast } = useToast();

  // التحقق من المستخدم الحالي
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setSettingsForm({
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone || '',
          currentPassword: '',
          newPassword: ''
        });
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // تحميل البيانات عند تسجيل الدخول
  useEffect(() => {
    if (user) {
      fetchRecommendations();
      fetchMessages();
      fetchNotifications();
      if (user.role === 'admin') {
        fetchUsers();
        fetchRequests();
      }
    }
  }, [user]);

  // التمرير لآخر رسالة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // دوال جلب البيانات
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/api/recommendations');
      const data = await res.json();
      if (data.recommendations) setRecommendations(data.recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const userId = selectedChatUser?.id || '';
      const url = userId ? `/api/messages?userId=${userId}` : '/api/messages';
      const res = await fetch(url);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/requests');
      const data = await res.json();
      if (data.requests) setRequests(data.requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // دوال المصادقة
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setLoginForm({ email: '', password: '' });
        toast({ title: 'مرحباً بك', description: 'تم تسجيل الدخول بنجاح' });
      } else {
        toast({ title: 'خطأ', description: data.error || 'فشل تسجيل الدخول', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء تسجيل الدخول', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });
      const data = await res.json();
      if (data.requestId) {
        setRegisterForm({ name: '', email: '', password: '', phone: '' });
        toast({ title: 'تم إرسال الطلب', description: data.message });
        setAuthMode('login');
      } else {
        toast({ title: 'خطأ', description: data.error || 'فشل التسجيل', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء التسجيل', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setCurrentView('dashboard');
      toast({ title: 'تم تسجيل الخروج', description: 'نتمنى أن نراك مجدداً' });
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء تسجيل الخروج', variant: 'destructive' });
    }
  };

  // دوال المستخدمين
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedUser),
      });
      const data = await res.json();
      if (data.user) {
        setUsers(users.map(u => u.id === data.user.id ? data.user : u));
        setShowEditUser(false);
        setSelectedUser(null);
        toast({ title: 'تم التحديث', description: 'تم تحديث بيانات المستخدم بنجاح' });
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء التحديث', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.message) {
        setUsers(users.filter(u => u.id !== selectedUser.id));
        setShowDeleteConfirm(false);
        setSelectedUser(null);
        toast({ title: 'تم الحذف', description: 'تم حذف المستخدم بنجاح' });
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء الحذف', variant: 'destructive' });
    }
  };

  // دوال طلبات الانضمام
  const handleProcessRequest = async (action: 'approve' | 'reject', notes?: string) => {
    if (!selectedRequest) return;
    try {
      const res = await fetch(`/api/requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });
      const data = await res.json();
      if (data.message) {
        setRequests(requests.filter(r => r.id !== selectedRequest.id));
        if (action === 'approve') {
          fetchUsers();
        }
        setShowRequestDialog(false);
        setSelectedRequest(null);
        toast({ title: action === 'approve' ? 'تم القبول' : 'تم الرفض', description: data.message });
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' });
    }
  };

  // دوال التوصيات
  const handleAddRecommendation = async () => {
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecommendation),
      });
      const data = await res.json();
      if (data.recommendation) {
        setRecommendations([data.recommendation, ...recommendations]);
        setShowAddRecommendation(false);
        setNewRecommendation({
          symbol: '',
          action: 'buy',
          price: '',
          stopLoss: '',
          takeProfit: '',
          timeframe: '',
          notes: ''
        });
        toast({ title: 'تمت الإضافة', description: 'تم إضافة التوصية بنجاح' });
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء إضافة التوصية', variant: 'destructive' });
    }
  };

  const handleDeleteRecommendations = async (ids?: string[]) => {
    try {
      const url = ids ? `/api/recommendations?ids=${ids.join(',')}` : '/api/recommendations';
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (data.message) {
        if (ids) {
          setRecommendations(recommendations.filter(r => !ids.includes(r.id)));
          setSelectedRecommendations([]);
        } else {
          setRecommendations([]);
        }
        toast({ title: 'تم الحذف', description: data.message });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء الحذف', variant: 'destructive' });
    }
  };

  const handleMarkRecommendationRead = async (id: string) => {
    try {
      await fetch(`/api/recommendations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      setRecommendations(recommendations.map(r => 
        r.id === id ? { ...r, isRead: true } : r
      ));
    } catch (error) {
      console.error('Error marking recommendation as read:', error);
    }
  };

  // دوال الرسائل
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatUser) return;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedChatUser.id,
          content: newMessage,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages([...messages, data.message]);
        setNewMessage('');
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء إرسال الرسالة', variant: 'destructive' });
    }
  };

  // دوال الإعدادات
  const handleUpdateSettings = async () => {
    try {
      const updateData: {
        name?: string;
        email?: string;
        phone?: string;
        password?: string;
        currentPassword?: string;
      } = {
        name: settingsForm.name,
        phone: settingsForm.phone,
      };
      
      if (settingsForm.email !== user?.email) {
        updateData.email = settingsForm.email;
        updateData.currentPassword = settingsForm.currentPassword;
      }
      
      if (settingsForm.newPassword) {
        updateData.password = settingsForm.newPassword;
        updateData.currentPassword = settingsForm.currentPassword;
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setSettingsForm({
          ...settingsForm,
          currentPassword: '',
          newPassword: ''
        });
        toast({ title: 'تم التحديث', description: 'تم تحديث إعداداتك بنجاح' });
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء التحديث', variant: 'destructive' });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.message) {
        setUser(null);
        toast({ title: 'تم حذف الحساب', description: 'نأسف لرؤيتك تغادر' });
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء حذف الحساب', variant: 'destructive' });
    }
  };

  // دوال مساعدة
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-YE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isAdmin = user?.role === 'admin';

  // قائمة التنقل للأدمن
  const adminNavItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: Home },
    { id: 'users', label: 'المستخدمين', icon: Users },
    { id: 'requests', label: 'طلبات الانضمام', icon: ClipboardList },
    { id: 'recommendations', label: 'التوصيات', icon: TrendingUp },
    { id: 'messages', label: 'الرسائل', icon: MessageSquare },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  // قائمة التنقل للمستخدم
  const userNavItems = [
    { id: 'recommendations', label: 'التوصيات', icon: TrendingUp },
    { id: 'messages', label: 'الرسائل', icon: MessageSquare },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
    { id: 'about', label: 'حول التطبيق', icon: Info },
  ];

  // شاشة التحميل
  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ForexYemeni</h1>
          <p className="text-gray-500 mt-2">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // صفحة تسجيل الدخول
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* الخلفية */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/trading-bg.png)' }}
        />
        {/* طبقة تعتيم */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-emerald-900/85" />
        
        {/* الشموع المتحركة */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* شموع خضراء */}
          {[...Array(8)].map((_, i) => (
            <div
              key={`green-${i}`}
              className="absolute animate-pulse"
              style={{
                left: `${10 + i * 12}%`,
                bottom: `${20 + Math.random() * 30}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: '2s'
              }}
            >
              <div className="w-1 h-1 bg-emerald-400/50 rounded-full mx-auto" />
              <div className="w-3 h-16 sm:h-24 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-sm shadow-lg shadow-emerald-500/30" />
              <div className="w-1 h-1 bg-emerald-400/50 rounded-full mx-auto" />
            </div>
          ))}
          {/* شموع حمراء */}
          {[...Array(6)].map((_, i) => (
            <div
              key={`red-${i}`}
              className="absolute animate-pulse"
              style={{
                left: `${5 + i * 15}%`,
                bottom: `${25 + Math.random() * 25}%`,
                animationDelay: `${i * 0.4 + 0.2}s`,
                animationDuration: '2.5s'
              }}
            >
              <div className="w-1 h-1 bg-red-400/50 rounded-full mx-auto" />
              <div className="w-3 h-12 sm:h-20 bg-gradient-to-b from-red-500 to-red-600 rounded-sm shadow-lg shadow-red-500/30" />
              <div className="w-1 h-1 bg-red-400/50 rounded-full mx-auto" />
            </div>
          ))}
        </div>
        
        {/* بطاقة تسجيل الدخول */}
        <Card className="w-full max-w-md relative z-10 mx-4 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-white mb-1">ForexYemeni</CardTitle>
            <CardDescription className="text-emerald-200 text-lg">تداول الفوريكس باحترافية</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/10">
                <TabsTrigger value="login" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-white/70">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-white/70">تسجيل جديد</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/90">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      placeholder="أدخل بريدك الإلكتروني"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-emerald-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white/90">كلمة المرور</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      placeholder="أدخل كلمة المرور"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-emerald-400"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-6 text-lg shadow-lg shadow-emerald-500/30" disabled={isLoading}>
                    {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="mt-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name" className="text-white/90">الاسم الكامل</Label>
                    <Input
                      id="reg-name"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      placeholder="أدخل اسمك الكامل"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-emerald-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-white/90">البريد الإلكتروني</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      placeholder="أدخل بريدك الإلكتروني"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-emerald-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-white/90">كلمة المرور</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      placeholder="أدخل كلمة المرور"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-emerald-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-phone" className="text-white/90">رقم الهاتف (اختياري)</Label>
                    <Input
                      id="reg-phone"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                      placeholder="أدخل رقم هاتفك"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-emerald-400"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-6 text-lg shadow-lg shadow-emerald-500/30" disabled={isLoading}>
                    {isLoading ? 'جاري الإرسال...' : 'إرسال طلب التسجيل'}
                  </Button>
                </form>
                <p className="text-xs text-emerald-200/70 text-center mt-4">
                  سيتم مراجعة طلبك من قبل الإدارة
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  // التطبيق الرئيسي
  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* الشريط الجانبي للجوال */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">ForexYemeni</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={currentView === item.id ? 'default' : 'ghost'}
                  className={`w-full justify-start gap-2 ${currentView === item.id ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                  onClick={() => {
                    setCurrentView(item.id as ViewType);
                    setSidebarOpen(false);
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Button>
              ))}
              <Separator className="my-4" />
              <Button variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
                تسجيل الخروج
              </Button>
            </nav>
          </div>
        </div>
      )}

      {/* الشريط الجانبي للكمبيوتر */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-l shadow-sm">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">ForexYemeni</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentView === item.id ? 'default' : 'ghost'}
              className={`w-full justify-start gap-2 ${currentView === item.id ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
              onClick={() => setCurrentView(item.id as ViewType)}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {item.id === 'messages' && unreadCount > 0 && (
                <Badge className="mr-auto bg-red-500">{unreadCount}</Badge>
              )}
            </Button>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4">
            <Avatar>
              <AvatarFallback className="bg-emerald-500 text-white">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 flex flex-col">
        {/* شريط العنوان للجوال */}
        <header className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">ForexYemeni</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </div>
        </header>

        {/* المحتوى */}
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          {/* لوحة التحكم - الأدمن */}
          {currentView === 'dashboard' && isAdmin && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">لوحة التحكم</h1>
              
              {/* بطاقات الإحصائيات */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">المستخدمين</p>
                        <p className="text-3xl font-bold">{users.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">التوصيات</p>
                        <p className="text-3xl font-bold">{recommendations.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">طلبات معلقة</p>
                        <p className="text-3xl font-bold">{requests.filter(r => r.status === 'pending').length}</p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">رسائل جديدة</p>
                        <p className="text-3xl font-bold">{unreadCount}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* آخر التوصيات */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    آخر التوصيات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recommendations.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">لا توجد توصيات حتى الآن</p>
                  ) : (
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {recommendations.slice(0, 5).map((rec) => (
                          <div key={rec.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${rec.action === 'buy' ? 'bg-green-100' : 'bg-red-100'}`}>
                                {rec.action === 'buy' ? (
                                  <TrendingUp className="w-5 h-5 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-5 h-5 text-red-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{rec.symbol}</p>
                                <p className="text-sm text-gray-500">
                                  {rec.action === 'buy' ? 'شراء' : 'بيع'} @ {rec.price}
                                </p>
                              </div>
                            </div>
                            <Badge variant={rec.source === 'tradingview' ? 'default' : 'secondary'}>
                              {rec.source === 'tradingview' ? 'TradingView' : 'يدوي'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* طلبات الانضمام المعلقة */}
              {requests.filter(r => r.status === 'pending').length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="w-5 h-5" />
                      طلبات الانضمام المعلقة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      <div className="space-y-3">
                        {requests.filter(r => r.status === 'pending').map((req) => (
                          <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{req.name}</p>
                              <p className="text-sm text-gray-500">{req.email}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="bg-emerald-500 hover:bg-emerald-600"
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setShowRequestDialog(true);
                                }}
                              >
                                مراجعة
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* إدارة المستخدمين - الأدمن */}
          {currentView === 'users' && isAdmin && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
              </div>
              
              <Card>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-250px)]">
                    <div className="divide-y">
                      {users.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">لا يوجد مستخدمين</p>
                      ) : (
                        users.map((u) => (
                          <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className={u.role === 'admin' ? 'bg-emerald-500' : 'bg-gray-400'}>
                                  {u.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{u.name}</p>
                                  {u.role === 'admin' && (
                                    <Badge className="bg-emerald-500">أدمن</Badge>
                                  )}
                                  {!u.isActive && (
                                    <Badge variant="destructive">معطل</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{u.email}</p>
                              </div>
                            </div>
                            {!u.isMainAdmin && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setShowEditUser(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setShowDeleteConfirm(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {/* طلبات الانضمام - الأدمن */}
          {currentView === 'requests' && isAdmin && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">طلبات الانضمام</h1>
              
              <Tabs defaultValue="pending">
                <TabsList>
                  <TabsTrigger value="pending">
                    معلقة ({requests.filter(r => r.status === 'pending').length})
                  </TabsTrigger>
                  <TabsTrigger value="approved">
                    مقبولة ({requests.filter(r => r.status === 'approved').length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    مرفوضة ({requests.filter(r => r.status === 'rejected').length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="pending">
                  <Card>
                    <CardContent className="p-0">
                      {requests.filter(r => r.status === 'pending').length === 0 ? (
                        <p className="text-gray-500 text-center py-8">لا توجد طلبات معلقة</p>
                      ) : (
                        <div className="divide-y">
                          {requests.filter(r => r.status === 'pending').map((req) => (
                            <div key={req.id} className="p-4 flex items-center justify-between">
                              <div>
                                <p className="font-medium">{req.name}</p>
                                <p className="text-sm text-gray-500">{req.email}</p>
                                {req.phone && <p className="text-sm text-gray-500">{req.phone}</p>}
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  className="bg-emerald-500 hover:bg-emerald-600"
                                  onClick={() => handleProcessRequest('approve')}
                                >
                                  <Check className="w-4 h-4 ml-1" />
                                  قبول
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleProcessRequest('reject')}
                                >
                                  <XCircle className="w-4 h-4 ml-1" />
                                  رفض
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="approved">
                  <Card>
                    <CardContent className="p-0">
                      {requests.filter(r => r.status === 'approved').length === 0 ? (
                        <p className="text-gray-500 text-center py-8">لا توجد طلبات مقبولة</p>
                      ) : (
                        <div className="divide-y">
                          {requests.filter(r => r.status === 'approved').map((req) => (
                            <div key={req.id} className="p-4">
                              <p className="font-medium">{req.name}</p>
                              <p className="text-sm text-gray-500">{req.email}</p>
                              <Badge className="mt-2 bg-emerald-500">تم القبول</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="rejected">
                  <Card>
                    <CardContent className="p-0">
                      {requests.filter(r => r.status === 'rejected').length === 0 ? (
                        <p className="text-gray-500 text-center py-8">لا توجد طلبات مرفوضة</p>
                      ) : (
                        <div className="divide-y">
                          {requests.filter(r => r.status === 'rejected').map((req) => (
                            <div key={req.id} className="p-4">
                              <p className="font-medium">{req.name}</p>
                              <p className="text-sm text-gray-500">{req.email}</p>
                              <Badge variant="destructive" className="mt-2">تم الرفض</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* التوصيات */}
          {currentView === 'recommendations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">التوصيات</h1>
                {isAdmin && (
                  <div className="flex gap-2">
                    {selectedRecommendations.length > 0 && (
                      <Button 
                        variant="destructive"
                        onClick={() => handleDeleteRecommendations(selectedRecommendations)}
                      >
                        <Trash2 className="w-4 h-4 ml-1" />
                        حذف المحدد ({selectedRecommendations.length})
                      </Button>
                    )}
                    <Button 
                      className="bg-emerald-500 hover:bg-emerald-600"
                      onClick={() => setShowAddRecommendation(true)}
                    >
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة توصية
                    </Button>
                  </div>
                )}
              </div>
              
              <Card>
                <CardContent className="p-0">
                  {recommendations.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">لا توجد توصيات</p>
                  ) : (
                    <ScrollArea className="h-[calc(100vh-250px)]">
                      <div className="divide-y">
                        {recommendations.map((rec) => (
                          <div 
                            key={rec.id} 
                            className={`p-4 ${!rec.isRead ? 'bg-emerald-50' : ''}`}
                            onClick={() => !rec.isRead && handleMarkRecommendationRead(rec.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                {isAdmin && (
                                  <Checkbox
                                    checked={selectedRecommendations.includes(rec.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedRecommendations([...selectedRecommendations, rec.id]);
                                      } else {
                                        setSelectedRecommendations(selectedRecommendations.filter(id => id !== rec.id));
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                )}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${rec.action === 'buy' ? 'bg-green-100' : 'bg-red-100'}`}>
                                  {rec.action === 'buy' ? (
                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                  ) : (
                                    <TrendingDown className="w-6 h-6 text-red-600" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-lg">{rec.symbol}</p>
                                    <Badge className={rec.action === 'buy' ? 'bg-green-500' : 'bg-red-500'}>
                                      {rec.action === 'buy' ? 'شراء' : 'بيع'}
                                    </Badge>
                                    <Badge variant="outline">
                                      {rec.source === 'tradingview' ? 'TradingView' : 'يدوي'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 mt-2 text-sm">
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="w-4 h-4 text-gray-500" />
                                      <span>السعر: {rec.price}</span>
                                    </div>
                                    {rec.stopLoss && (
                                      <div className="flex items-center gap-1">
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                        <span>وقف الخسارة: {rec.stopLoss}</span>
                                      </div>
                                    )}
                                    {rec.takeProfit && (
                                      <div className="flex items-center gap-1">
                                        <Target className="w-4 h-4 text-green-500" />
                                        <span>جني الأرباح: {rec.takeProfit}</span>
                                      </div>
                                    )}
                                  </div>
                                  {rec.notes && (
                                    <p className="text-sm text-gray-600 mt-2">{rec.notes}</p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-2">{formatDate(rec.createdAt)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* الرسائل */}
          {currentView === 'messages' && (
            <div className="space-y-6 h-full">
              <h1 className="text-2xl font-bold">الرسائل</h1>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
                {/* قائمة المحادثات */}
                <Card className="lg:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">المحادثات</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-300px)]">
                      {isAdmin ? (
                        users.filter(u => u.id !== user.id).length === 0 ? (
                          <p className="text-gray-500 text-center py-8">لا يوجد مستخدمين</p>
                        ) : (
                          <div className="divide-y">
                            {users.filter(u => u.id !== user.id).map((u) => (
                              <div 
                                key={u.id}
                                className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedChatUser?.id === u.id ? 'bg-emerald-50' : ''}`}
                                onClick={() => {
                                  setSelectedChatUser(u);
                                  fetchMessages();
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{u.name}</p>
                                    <p className="text-xs text-gray-500">{u.email}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      ) : (
                        <div 
                          className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedChatUser?.role === 'admin' ? 'bg-emerald-50' : ''}`}
                          onClick={() => {
                            // للمستخدم العادي، المحادثة مع الأدمن
                            const adminUser = users.find(u => u.role === 'admin');
                            if (adminUser) {
                              setSelectedChatUser(adminUser);
                              fetchMessages();
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-emerald-500">A</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">الإدارة</p>
                              <p className="text-xs text-gray-500">تواصل مع الإدارة</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* نافذة المحادثة */}
                <Card className="lg:col-span-2 flex flex-col">
                  {selectedChatUser ? (
                    <>
                      <CardHeader className="pb-2 border-b">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className={selectedChatUser.role === 'admin' ? 'bg-emerald-500' : ''}>
                              {selectedChatUser.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{selectedChatUser.name}</p>
                            <p className="text-xs text-gray-500">{selectedChatUser.email}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col p-0">
                        <ScrollArea className="flex-1 p-4">
                          {messages.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">لا توجد رسائل</p>
                          ) : (
                            <div className="space-y-3">
                              {messages.map((msg) => (
                                <div 
                                  key={msg.id}
                                  className={`flex ${msg.senderId === user.id ? 'justify-start' : 'justify-end'}`}
                                >
                                  <div className={`max-w-[70%] p-3 rounded-2xl ${
                                    msg.senderId === user.id 
                                      ? 'bg-emerald-500 text-white rounded-tr-none' 
                                      : 'bg-gray-100 rounded-tl-none'
                                  }`}>
                                    <p>{msg.content}</p>
                                    <p className={`text-xs mt-1 ${msg.senderId === user.id ? 'text-emerald-100' : 'text-gray-500'}`}>
                                      {formatDate(msg.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              <div ref={messagesEndRef} />
                            </div>
                          )}
                        </ScrollArea>
                        <div className="p-4 border-t">
                          <div className="flex gap-2">
                            <Input
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="اكتب رسالتك..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                            />
                            <Button 
                              className="bg-emerald-500 hover:bg-emerald-600"
                              onClick={handleSendMessage}
                              disabled={!newMessage.trim()}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-gray-500">اختر محادثة للبدء</p>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* الإعدادات */}
          {currentView === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <h1 className="text-2xl font-bold">الإعدادات</h1>
              
              <Card>
                <CardHeader>
                  <CardTitle>معلومات الحساب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="settings-name">الاسم</Label>
                    <Input
                      id="settings-name"
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-email">البريد الإلكتروني</Label>
                    <Input
                      id="settings-email"
                      type="email"
                      value={settingsForm.email}
                      onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-phone">رقم الهاتف</Label>
                    <Input
                      id="settings-phone"
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>تغيير كلمة المرور</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">كلمة المرور الحالية</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={settingsForm.currentPassword}
                      onChange={(e) => setSettingsForm({ ...settingsForm, currentPassword: e.target.value })}
                      placeholder="أدخل كلمة المرور الحالية"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={settingsForm.newPassword}
                      onChange={(e) => setSettingsForm({ ...settingsForm, newPassword: e.target.value })}
                      placeholder="أدخل كلمة المرور الجديدة"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button 
                  className="bg-emerald-500 hover:bg-emerald-600"
                  onClick={handleUpdateSettings}
                >
                  حفظ التغييرات
                </Button>
                {!user?.isMainAdmin && (
                  <Button 
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    حذف الحساب
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* حول التطبيق */}
          {currentView === 'about' && (
            <div className="space-y-6 max-w-2xl">
              <h1 className="text-2xl font-bold">حول التطبيق</h1>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">ForexYemeni</h2>
                    <p className="text-gray-500">تداول الفوريكس</p>
                  </div>
                  
                  <div className="space-y-4 text-gray-600">
                    <p>
                      تطبيق ForexYemeni هو نظام متكامل لإدارة توصيات الفوركس، يوفر للمستخدمين توصيات 
                      موثوقة ومحدثة من TradingView والتحليل الفني.
                    </p>
                    <p>
                      يهدف التطبيق إلى مساعدة المتداولين اليمنيين في اتخاذ قرارات استثمارية مدروسة 
                      من خلال توفير توصيات دقيقة ومباشرة.
                    </p>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg">مميزات التطبيق</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-emerald-500" />
                        توصيات فورية من TradingView
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-emerald-500" />
                        محادثة مباشرة مع الإدارة
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-emerald-500" />
                        إشعارات فورية للتوصيات الجديدة
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-emerald-500" />
                        تصميم متجاوب لجميع الأجهزة
                      </li>
                    </ul>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg">معلومات التواصل</h3>
                    <p className="text-gray-600">
                      البريد الإلكتروني: admin@forexyemeni.com
                    </p>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg">سياسة الخصوصية</h3>
                    <p className="text-gray-600 text-sm">
                      نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. جميع المعلومات المقدمة 
                      تستخدم فقط لغرض تقديم خدمة التوصيات ولن يتم مشاركتها مع أي طرف ثالث.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* حوار إضافة توصية */}
      <Dialog open={showAddRecommendation} onOpenChange={setShowAddRecommendation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة توصية جديدة</DialogTitle>
            <DialogDescription>أدخل بيانات التوصية الجديدة</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>زوج العملات</Label>
                <Input
                  value={newRecommendation.symbol}
                  onChange={(e) => setNewRecommendation({ ...newRecommendation, symbol: e.target.value.toUpperCase() })}
                  placeholder="EURUSD"
                />
              </div>
              <div className="space-y-2">
                <Label>نوع العمل</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={newRecommendation.action}
                  onChange={(e) => setNewRecommendation({ ...newRecommendation, action: e.target.value })}
                >
                  <option value="buy">شراء</option>
                  <option value="sell">بيع</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>السعر</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={newRecommendation.price}
                  onChange={(e) => setNewRecommendation({ ...newRecommendation, price: e.target.value })}
                  placeholder="1.0850"
                />
              </div>
              <div className="space-y-2">
                <Label>وقف الخسارة</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={newRecommendation.stopLoss}
                  onChange={(e) => setNewRecommendation({ ...newRecommendation, stopLoss: e.target.value })}
                  placeholder="1.0800"
                />
              </div>
              <div className="space-y-2">
                <Label>جني الأرباح</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={newRecommendation.takeProfit}
                  onChange={(e) => setNewRecommendation({ ...newRecommendation, takeProfit: e.target.value })}
                  placeholder="1.0950"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الإطار الزمني</Label>
              <select
                className="w-full border rounded-md p-2"
                value={newRecommendation.timeframe}
                onChange={(e) => setNewRecommendation({ ...newRecommendation, timeframe: e.target.value })}
              >
                <option value="">اختر الإطار الزمني</option>
                <option value="1M">1 دقيقة</option>
                <option value="5M">5 دقائق</option>
                <option value="15M">15 دقيقة</option>
                <option value="1H">ساعة واحدة</option>
                <option value="4H">4 ساعات</option>
                <option value="1D">يومي</option>
                <option value="1W">أسبوعي</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={newRecommendation.notes}
                onChange={(e) => setNewRecommendation({ ...newRecommendation, notes: e.target.value })}
                placeholder="أضف ملاحظات اختيارية..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRecommendation(false)}>
              إلغاء
            </Button>
            <Button 
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={handleAddRecommendation}
              disabled={!newRecommendation.symbol || !newRecommendation.price}
            >
              إضافة التوصية
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار تعديل المستخدم */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>الاسم</Label>
                <Input
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input
                  value={selectedUser.phone || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>دور الأدمن</Label>
                <Switch
                  checked={selectedUser.role === 'admin'}
                  onCheckedChange={(checked) => setSelectedUser({ ...selectedUser, role: checked ? 'admin' : 'user' })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>حساب مفعل</Label>
                <Switch
                  checked={selectedUser.isActive}
                  onCheckedChange={(checked) => setSelectedUser({ ...selectedUser, isActive: checked })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUser(false)}>
              إلغاء
            </Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={handleUpdateUser}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار تأكيد الحذف */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.id === user?.id 
                ? 'هل أنت متأكد من حذف حسابك؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={selectedUser?.id === user?.id ? handleDeleteAccount : handleDeleteUser}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* حوار مراجعة طلب الانضمام */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>مراجعة طلب الانضمام</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><strong>الاسم:</strong> {selectedRequest.name}</p>
                <p><strong>البريد:</strong> {selectedRequest.email}</p>
                {selectedRequest.phone && <p><strong>الهاتف:</strong> {selectedRequest.phone}</p>}
                <p><strong>تاريخ الطلب:</strong> {formatDate(selectedRequest.createdAt)}</p>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              إلغاء
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleProcessRequest('reject')}
            >
              رفض
            </Button>
            <Button 
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={() => handleProcessRequest('approve')}
            >
              قبول
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
