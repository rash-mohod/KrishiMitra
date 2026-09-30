import { Booking, Category, ChatConversation, ChatMessage, Dispute, Equipment, EquipmentFilterParams, MessageReport, Notification, PaymentTransaction, Review, User, UserRole } from '../types';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const TOKEN_KEY = 'km_auth_token';
const REFRESH_TOKEN_KEY = 'km_refresh_token';

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || '';
}

export function getRefreshToken(): string {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY) || '';
}

export function saveTokens(accessToken?: string, refreshToken?: string) {
  if (accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const t = getToken();
  if (t && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${t}`);
  }

  let res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // If access token expired (401), attempt silent token refresh once
  if (res.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/refresh') && !path.startsWith('/auth/register')) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        const refreshData = await refreshRes.json();
        if (refreshRes.ok && refreshData.success && refreshData.data?.session?.access_token) {
          saveTokens(refreshData.data.session.access_token, refreshData.data.session.refresh_token);
          headers.set('Authorization', `Bearer ${refreshData.data.session.access_token}`);
          res = await fetch(`${API_URL}${path}`, { ...options, headers });
        } else {
          clearTokens();
        }
      } catch {
        clearTokens();
      }
    } else {
      clearTokens();
    }
  }

  let body: any = {};
  try {
    body = await res.json();
  } catch {}

  if (!res.ok || body.success === false) {
    const err: any = new Error(body.message || body.error?.message || `Request failed (${res.status})`);
    if (body.code) err.code = body.code;
    throw err;
  }
  return body.data as T;
}
const enc = (v: string) => encodeURIComponent(v);

export function initDatabase() { /* Supabase is the source of truth. No local demo database is initialized. */ }
export function resetDatabaseToDefaults() { throw new Error('Demo data is managed by the Supabase seed script, not browser storage.'); }

export const authApi = {
  async getCurrentUser(): Promise<User | null> {
    if (!getToken()) return null;
    try {
      const data = await request<{ user: User }>('/auth/me');
      return data.user;
    } catch {
      clearTokens();
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      clearTokens();
    }
  },

  async login(email: string, password = ''): Promise<User> {
    const d = await request<{
      user: User;
      session?: { access_token: string; refresh_token: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password })
    });
    if (d.session?.access_token) {
      saveTokens(d.session.access_token, d.session.refresh_token);
    }
    return d.user;
  },

  async register(params: {
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
  }): Promise<{ user: User; requiresEmailConfirmation: boolean; message?: string }> {
    const d = await request<{
      user: User;
      requiresEmailConfirmation?: boolean;
      session?: { access_token: string; refresh_token: string };
      message?: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...params,
        email: params.email.trim().toLowerCase()
      })
    });
    if (d.session?.access_token && !d.requiresEmailConfirmation) {
      saveTokens(d.session.access_token, d.session.refresh_token);
    }
    return {
      user: d.user,
      requiresEmailConfirmation: !!d.requiresEmailConfirmation,
      message: d.message
    };
  },

  async resendConfirmation(email: string): Promise<{ message: string }> {
    return await request<{ message: string }>('/auth/resend-confirmation', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    });
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return await request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    });
  },

  async resetPassword(password: string, token?: string): Promise<{ message: string }> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return await request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      headers,
      body: JSON.stringify({ password })
    });
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const current = await this.getCurrentUser();
    if (!current || userId !== current.id) {
      throw new Error('You can only update your own profile.');
    }
    return (await request<{ user: User }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        name: updates.name,
        phone: updates.phone,
        state: updates.state,
        district: updates.district,
        village: updates.village,
        bio: updates.bio,
        avatarUrl: updates.avatarUrl
      })
    })).user;
  },

  async uploadProfileImage(dataUrl: string, fileName = 'profile-picture.jpg'): Promise<User> {
    return (await request<{ user: User }>('/auth/profile/avatar', {
      method: 'POST',
      body: JSON.stringify({ dataUrl, fileName })
    })).user;
  },

  async getAllUsers(): Promise<User[]> {
    return (await request<{ users: User[] }>('/auth/users')).users;
  }
};

function query(params:Record<string,unknown>){const q=new URLSearchParams();Object.entries(params).forEach(([k,v])=>v!==undefined&&v!==''&&v!==null&&q.set(k,String(v)));const s=q.toString();return s?`?${s}`:''}
export const equipmentApi={
 async getCategories(){return (await request<{categories:Category[]}>('/equipment/categories')).categories},
 async getEquipmentList(params:EquipmentFilterParams={}){return await request<{items:Equipment[];total:number}>(`/equipment${query(params as any)}`)},
 async getEquipmentById(id:string){try{return (await request<{equipment:Equipment}>(`/equipment/${enc(id)}`)).equipment}catch{return null}},
 async getOwnerEquipment(ownerId:string){return (await request<{items:Equipment[]}>(`/equipment/owner/${enc(ownerId)}`)).items},
 async getAllEquipmentForAdmin(){return (await request<{items:Equipment[]}>('/equipment/admin')).items},
 async createEquipment(_user:User,equipment:Partial<Equipment>){return (await request<{equipment:Equipment}>('/equipment',{method:'POST',body:JSON.stringify(equipment)})).equipment},
 async updateEquipment(id:string,_ownerId:string,updates:Partial<Equipment>){if(Object.keys(updates).length===1&&updates.status){return (await request<{equipment:Equipment}>(`/equipment/${enc(id)}/status`,{method:'PATCH',body:JSON.stringify({status:updates.status})})).equipment;}return (await request<{equipment:Equipment}>(`/equipment/${enc(id)}`,{method:'PUT',body:JSON.stringify(updates)})).equipment},
 async deleteEquipment(id:string,_ownerId:string){await request(`/equipment/${enc(id)}`,{method:'DELETE'})},
 async checkAvailability(equipmentId:string,startDate:string,endDate:string){
  const available = (await request<{available:boolean}>(
    `/equipment/${enc(equipmentId)}/availability${query({startDate,endDate})}`
  )).available;

  return {
    isAvailable: available,
    reason: available ? undefined : 'Not available for selected dates.'
  };
},
 async uploadImage(dataUrl:string,fileName:string){return (await request<{url:string;path:string}>('/equipment/images',{method:'POST',body:JSON.stringify({dataUrl,fileName})})).url}
};

export const bookingApi={
 calculatePrice(eq:Equipment,startDate:string,endDate:string,operatorIncluded=false){const start=new Date(`${startDate}T00:00:00`),end=new Date(`${endDate}T00:00:00`);const duration=Math.max(0,Math.floor((end.getTime()-start.getTime())/86400000)+1);const operatorAmount=operatorIncluded?Number(eq.operatorCostPerDay||0)*duration:0;const baseAmount=Number(eq.pricePerDay||0)*duration;const totalRentalAmount=baseAmount+operatorAmount;const maximumBookingAmount=Math.floor(totalRentalAmount*0.2);const bookingAmount=Math.min(Number(eq.bookingAmount||0),maximumBookingAmount);let platformFee=0;if(totalRentalAmount>0&&totalRentalAmount<=499)platformFee=5;else if(totalRentalAmount<=999)platformFee=10;else if(totalRentalAmount<=1499)platformFee=15;else if(totalRentalAmount<=1999)platformFee=20;else if(totalRentalAmount<=2499)platformFee=25;else if(totalRentalAmount<=2999)platformFee=30;else if(totalRentalAmount<=3499)platformFee=35;else if(totalRentalAmount<=3999)platformFee=40;else if(totalRentalAmount<=4499)platformFee=45;else if(totalRentalAmount>=4500)platformFee=50;return {durationDays:duration,pricePerDay:Number(eq.pricePerDay||0),baseAmount,platformFee,bookingAmount,maximumBookingAmount,remainingRentalAmount:totalRentalAmount-bookingAmount,onlinePaymentAmount:bookingAmount+platformFee,operatorAmount,securityDeposit:Number(eq.securityDeposit||0),totalAmount:totalRentalAmount};},
 async createBooking(params:any){const body={equipmentId:params.equipmentId,startDate:params.startDate,endDate:params.endDate,pickupAddress:params.pickupAddress,notes:params.notes,farmerNote:params.farmerNote??params.notes,operatorIncluded:!!params.operatorIncluded};return (await request<{booking:Booking}>('/bookings',{method:'POST',body:JSON.stringify(body)})).booking},
 async getFarmerBookings(_farmerId:string){return (await request<{bookings:Booking[]}>('/bookings/my')).bookings},
 async getOwnerBookings(_ownerId:string){return (await request<{bookings:Booking[]}>('/bookings/owner')).bookings},
 async getAllBookings(){return (await request<{bookings:Booking[]}>('/bookings/admin')).bookings},
 async getBookingById(id:string){try{return (await request<{booking:Booking}>(`/bookings/${enc(id)}`)).booking}catch{return null}},
 async acceptBooking(id:string,_ownerId:string,ownerNotes?:string){return (await request<{booking:Booking}>(`/bookings/${enc(id)}/accept`,{method:'PATCH',body:JSON.stringify({ownerNotes})})).booking},
 async rejectBooking(id:string,_ownerId:string,reason:string){return (await request<{booking:Booking}>(`/bookings/${enc(id)}/reject`,{method:'PATCH',body:JSON.stringify({reason})})).booking},
 async cancelBooking(id:string,_userId:string,reason:string){return (await request<{booking:Booking}>(`/bookings/${enc(id)}/cancel`,{method:'PATCH',body:JSON.stringify({reason})})).booking},
 async startRental(id:string,_ownerId:string){return (await request<{booking:Booking}>(`/bookings/${enc(id)}/start`,{method:'PATCH'})).booking},
 async rentalCompleted(id:string,_farmerId:string){return (await request<{booking:Booking}>(`/bookings/${enc(id)}/rental-completed`,{method:'POST'})).booking},
 async completeRental(id:string,_ownerId:string){return (await request<{booking:Booking}>(`/bookings/${enc(id)}/complete`,{method:'PATCH'})).booking}
};

export const paymentApi={
 async createRazorpayOrder(bookingId:string){return await request<any>('/payments/create-order',{method:'POST',body:JSON.stringify({bookingId})})},
 async verifyAndConfirmPayment(params:{bookingId:string;razorpay_order_id:string;razorpay_payment_id:string;razorpay_signature:string}){return await request<any>('/payments/verify',{method:'POST',body:JSON.stringify(params)})},
 async getPayment(bookingId:string){return (await request<{payment:PaymentTransaction}>(`/payments/${enc(bookingId)}`)).payment},
 async confirmRemainingPayment(bookingId:string,method:'CASH'|'UPI',note?:string){return (await request<{payment:PaymentTransaction}>(`/payments/${enc(bookingId)}/remaining-payment`,{method:'PATCH',body:JSON.stringify({method,note})})).payment},
 async requestRemainingCashPayment(bookingId:string){return (await request<{payment:PaymentTransaction}>(`/payments/${enc(bookingId)}/remaining-payment/request-cash`,{method:'POST'})).payment},
 async createRemainingRazorpayOrder(bookingId:string){return await request<any>(`/payments/${enc(bookingId)}/remaining-payment/create-order`,{method:'POST'})},
 async verifyRemainingRazorpayPayment(params:{bookingId:string;razorpay_order_id:string;razorpay_payment_id:string;razorpay_signature:string}){return await request<any>(`/payments/${enc(params.bookingId)}/remaining-payment/verify`,{method:'POST',body:JSON.stringify({razorpay_order_id:params.razorpay_order_id,razorpay_payment_id:params.razorpay_payment_id,razorpay_signature:params.razorpay_signature})})},
 async getFarmerTransactions(_id:string){return (await request<{payments:PaymentTransaction[]}>('/payments/my-payments')).payments},
 async getOwnerTransactions(_id:string){return (await request<{payments:PaymentTransaction[]}>('/payments/owner')).payments},
 async getAllTransactions(){return (await request<{payments:PaymentTransaction[]}>('/payments/admin')).payments}
};

export const reviewApi={
 async getEquipmentReviews(id:string){return (await request<{reviews:Review[]}>(`/reviews/equipment/${enc(id)}`)).reviews},
 async getUserReviews(id:string){return (await request<{reviews:Review[]}>(`/reviews/user/${enc(id)}`)).reviews},
 async createReview(params:any){return (await request<{review:Review}>('/reviews',{method:'POST',body:JSON.stringify(params)})).review}
};
export const notificationApi={
 async getUserNotifications(_id:string){return (await request<{notifications:Notification[]}>('/notifications')).notifications},
 async markAsRead(id:string){await request(`/notifications/${enc(id)}/read`,{method:'PATCH'})},
 async markAllAsRead(_id:string){await request('/notifications/read-all',{method:'PATCH'})},
 async createNotification(_n:any){return null}
};
export const favoritesApi={
 async getFavorites(){return (await request<{favorites:string[]}>('/favorites')).favorites},
 async toggleFavorite(id:string){return (await request<{isFavorite:boolean}>(`/favorites/${enc(id)}/toggle`,{method:'POST'})).isFavorite}
};
export const adminApi={
 async approveEquipment(id:string){return (await request<{equipment:Equipment}>(`/admin/equipment/${enc(id)}/approve`,{method:'PATCH'})).equipment},
 async rejectEquipment(id:string,reason:string){return (await request<{equipment:Equipment}>(`/admin/equipment/${enc(id)}/reject`,{method:'PATCH',body:JSON.stringify({reason})})).equipment},
 async setUserStatus(id:string,isActive:boolean){return (await request<{user:User}>(`/admin/users/${enc(id)}/status`,{method:'PATCH',body:JSON.stringify({isActive})})).user},
 async getPlatformStats(){return await request<any>('/admin/stats')},
 async getDisputes(){return (await request<{disputes:Dispute[]}>('/disputes')).disputes},
 async resolveDispute(id:string,resolutionNotes:string){return (await request<{dispute:Dispute}>(`/disputes/${enc(id)}/resolve`,{method:'PATCH',body:JSON.stringify({resolutionNotes})})).dispute}
};
export const disputeApi={
 async getDisputes(){return (await request<{disputes:Dispute[]}>('/disputes')).disputes},
 async createDispute(params:any){return (await request<{dispute:Dispute}>('/disputes',{method:'POST',body:JSON.stringify(params)})).dispute}
};



export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const chatApi={
 async getConversations(_userId?:string,options?:{type?:string;archived?:boolean;search?:string}){return (await request<{conversations:ChatConversation[]}>(`/chat/conversations${query(options??{})}`)).conversations},
 async getConversationById(id:string){try{return (await request<{conversation:ChatConversation}>(`/chat/conversations/${enc(id)}`)).conversation}catch{return null}},
 async getMessages(id:string,limit=50,before?:string){return (await request<{messages:ChatMessage[]}>(`/chat/conversations/${enc(id)}/messages${query({limit,before})}`)).messages},
 async sendMessage(params:any){return (await request<{message:ChatMessage}>(`/chat/conversations/${enc(params.conversationId)}/messages`,{method:'POST',body:JSON.stringify(params)})).message},
 async getOrCreateConversation(params:any){return (await request<{conversation:ChatConversation}>('/chat/conversations',{method:'POST',body:JSON.stringify(params)})).conversation},
 async markConversationAsRead(id:string,_userId?:string){await request(`/chat/conversations/${enc(id)}/read`,{method:'PATCH'})},
 async editMessage(id:string,content:string){return (await request<{message:ChatMessage}>(`/chat/messages/${enc(id)}`,{method:'PATCH',body:JSON.stringify({content})})).message},
 async deleteMessage(id:string){return (await request<{message:ChatMessage}>(`/chat/messages/${enc(id)}`,{method:'DELETE'})).message},
 async reactToMessage(id:string,reaction:string){return (await request<{message:ChatMessage}>(`/chat/messages/${enc(id)}/reaction`,{method:'POST',body:JSON.stringify({reaction})})).message},
 async reportMessage(id:string,reason:string,description?:string){return await request<any>(`/chat/messages/${enc(id)}/report`,{method:'POST',body:JSON.stringify({reason,description})})},
 async toggleArchive(id:string){const c=await this.getConversationById(id);const current=!!c?.participants.find((p:any)=>p.id===undefined)?.isArchived;return (await request<any>(`/chat/conversations/${enc(id)}/archive`,{method:'PATCH',body:JSON.stringify({archived:!current})})).archived},
 async toggleMute(id:string){return (await request<any>(`/chat/conversations/${enc(id)}/mute`,{method:'PATCH',body:JSON.stringify({muted:true})})).muted},
 async searchMessages(q:string,conversationId?:string){const convs=conversationId?[conversationId]:(await this.getConversations()).map(c=>c.id);const out:ChatMessage[]=[];for(const id of convs){const msgs=await this.getMessages(id,100);out.push(...msgs.filter(m=>m.content.toLowerCase().includes(q.toLowerCase())))}return out},
 async getAdminInbox(){return await this.getConversations()},
 async getMessageReports(){return (await request<{reports:MessageReport[]}>('/chat/reports')).reports},
 async updateMessageReport(id:string,status:string){return (await request<any>(`/chat/reports/${enc(id)}`,{method:'PATCH',body:JSON.stringify({status})})).report},
 async getUnreadMessagesCount(_userId:string){return (await request<{count:number}>('/chat/unread-count')).count},
 async deleteConversation(_id:string){throw new Error('Conversation deletion is not enabled in the current version.')}
};
