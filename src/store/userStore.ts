import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '../lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, orderBy, limit, onSnapshot, addDoc, deleteDoc } from 'firebase/firestore';
import type { FirebaseUser, UserActivity, Notification, UserStats } from '../types/firebase';

interface UserState {
  // Basic user info
  telegramId: string | null;
  name: string;
  photoUrl: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Financial & Game stats
  balance: number;
  energy: number;
  maxEnergy: number;
  level: number;
  experiencePoints: number;
  miningPower: number;
  claimStreak: number;
  totalEarnings: number;
  totalReferrals: number;
  
  // Timestamps
  lastClaim: Date | null;
  lastEnergyRefill: Date | null;
  lastActive: Date | null;
  
  // Status
  isVerified: boolean;
  isBanned: boolean;
  banReason: string | null;
  
  // Referral system
  referralCode: string | null;
  referredBy: string | null;
  
  // Task & Activity stats
  stats: {
    referralsCount: number;
    tasksCompleted: number;
    todayReferrals: number;
    thisWeekReferrals: number;
    thisMonthReferrals: number;
    todayEarnings: number;
    thisWeekEarnings: number;
    thisMonthEarnings: number;
    achievementsUnlocked: number;
  };
  
  // Real-time data
  realTimeData: {
    isOnline: boolean;
    lastSeen: Date | null;
    currentActivity: string | null;
    notifications: Array<{
      id: string;
      type: 'success' | 'warning' | 'info' | 'error' | 'reward';
      title: string;
      message: string;
      timestamp: Date;
      read: boolean;
      actionUrl?: string;
    }>;
    intervalId?: NodeJS.Timeout;
  };
  
  // Actions
  setUser: (user: Partial<UserState>) => void;
  updateBalance: (amount: number) => Promise<void>;
  updateEnergy: (amount: number) => Promise<void>;
  updateExperience: (xp: number) => Promise<void>;
  updateLevel: (level: number) => Promise<void>;
  updateMiningPower: (power: number) => Promise<void>;
  updateClaimStreak: (streak: number, lastClaim: Date) => Promise<void>;
  updateLastEnergyRefill: (date: Date | null) => Promise<void>;
  loadUserData: (telegramId: string) => Promise<void>;
  createUser: (userData: Partial<FirebaseUser>) => Promise<void>;
  updateUserProfile: (updates: Partial<FirebaseUser>) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  updateRealTimeStats: () => Promise<void>;
  startRealTimeUpdates: () => void;
  stopRealTimeUpdates: () => void;
  refreshUserData: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      telegramId: null,
      name: '',
      photoUrl: '',
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      balance: 0,
      energy: 100,
      maxEnergy: 100,
      level: 1,
      experiencePoints: 0,
      miningPower: 0,
      claimStreak: 0,
      totalEarnings: 0,
      totalReferrals: 0,
      lastClaim: null,
      lastEnergyRefill: null,
      lastActive: null,
      isVerified: false,
      isBanned: false,
      banReason: null,
      referralCode: null,
      referredBy: null,
      stats: {
        referralsCount: 0,
        tasksCompleted: 0,
        todayReferrals: 0,
        thisWeekReferrals: 0,
        thisMonthReferrals: 0,
        todayEarnings: 0,
        thisWeekEarnings: 0,
        thisMonthEarnings: 0,
        achievementsUnlocked: 0
      },
      realTimeData: {
        isOnline: false,
        lastSeen: null,
        currentActivity: null,
        notifications: []
      },

      setUser: (user) => set((state) => ({ ...state, ...user })),

      updateBalance: async (amount) => {
        const { telegramId } = get();
        if (!telegramId) return;

        const newBalance = get().balance + amount;
        const { error } = await supabase
          .from('users')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('telegram_id', telegramId);

        if (error) throw error;
        set({ balance: newBalance });
      },

      updateEnergy: async (amount) => {
        const { telegramId, maxEnergy } = get();
        if (!telegramId) return;

        const newEnergy = Math.max(0, Math.min(maxEnergy, amount));
        const { error } = await supabase
          .from('users')
          .update({ 
            energy: newEnergy,
            last_energy_refill: newEnergy === 0 ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('telegram_id', telegramId);

        if (error) throw error;
        set({ energy: newEnergy });
      },

      updateExperience: async (xp) => {
        const { telegramId } = get();
        if (!telegramId) return;

        const newXP = get().experiencePoints + xp;
        const newLevel = Math.floor(newXP / 100) + 1;
        
        const { error } = await supabase
          .from('users')
          .update({ 
            experience_points: newXP,
            level: newLevel,
            updated_at: new Date().toISOString()
          })
          .eq('telegram_id', telegramId);

        if (error) throw error;
        set({ experiencePoints: newXP, level: newLevel });
      },

      updateLevel: async (level) => {
        const { telegramId } = get();
        if (!telegramId) return;

        const { error } = await supabase
          .from('users')
          .update({ 
            level,
            updated_at: new Date().toISOString()
          })
          .eq('telegram_id', telegramId);

        if (error) throw error;
        set({ level });
      },

      updateMiningPower: async (power) => {
        const { telegramId } = get();
        if (!telegramId) return;

        const { error } = await supabase
          .from('users')
          .update({ 
            mining_power: power,
            updated_at: new Date().toISOString()
          })
          .eq('telegram_id', telegramId);

        if (error) throw error;
        set({ miningPower: power });
      },

      updateClaimStreak: async (streak, lastClaim) => {
        const { telegramId } = get();
        if (!telegramId) return;

        const { error } = await supabase
          .from('users')
          .update({
            claim_streak: streak,
            last_claim: lastClaim.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('telegram_id', telegramId);

        if (error) throw error;
        set({ claimStreak: streak, lastClaim });
      },

      updateLastEnergyRefill: async (date) => {
        const { telegramId } = get();
        if (!telegramId) return;

        const { error } = await supabase
          .from('users')
          .update({ 
            last_energy_refill: date?.toISOString() || null,
            updated_at: new Date().toISOString()
          })
          .eq('telegram_id', telegramId);

        if (error) throw error;
        set({ lastEnergyRefill: date });
      },

      createUser: async (userData) => {
        try {
          // Check if user already exists
          const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('telegram_id')
            .eq('telegram_id', userData.telegram_id)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
          }

          if (existingUser) {
            console.log(`User ${userData.telegram_id} already exists. Skipping creation.`);
            // Load existing user data instead
            await get().loadUserData(userData.telegram_id);
            return;
          }

          // Create new user only if doesn't exist
          const { error } = await supabase
            .from('users')
            .insert([userData]);

          if (error) throw error;
          
          // Set local state
          set({
            telegramId: userData.telegram_id,
            name: userData.first_name || userData.username || 'User',
            photoUrl: userData.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.telegram_id}`,
            username: userData.username || '',
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            balance: userData.balance || 0,
            energy: userData.energy || 100,
            maxEnergy: userData.max_energy || 100,
            level: userData.level || 1,
            experiencePoints: userData.experience_points || 0,
            miningPower: userData.mining_power || 0,
            claimStreak: userData.claim_streak || 0,
            totalEarnings: userData.total_earnings || 0,
            totalReferrals: userData.total_referrals || 0,
            referralCode: userData.referral_code || null,
            referredBy: userData.referred_by || null,
            isVerified: userData.is_verified || false,
            isBanned: userData.is_banned || false,
            banReason: userData.ban_reason || null,
            lastActive: new Date()
          });
        } catch (error) {
          console.error('Error creating user:', error);
          throw error;
        }
      },

      updateUserProfile: async (updates) => {
        const { telegramId } = get();
        if (!telegramId) return;

        try {
          const { error } = await supabase
            .from('users')
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('telegram_id', telegramId);

          if (error) throw error;
          
          // Update local state
          set((state) => ({
            ...state,
            ...updates,
            lastActive: new Date()
          }));
        } catch (error) {
          console.error('Error updating user profile:', error);
          throw error;
        }
      },

      loadUserData: async (telegramId) => {
        try {
          // Load user profile
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', telegramId)
            .single();

          if (userError && userError.code !== 'PGRST116') {
            throw userError;
          }

          if (!user) {
            // Create new user if not exists
            const newUser = {
              telegram_id: telegramId,
              username: `user_${telegramId}`,
              first_name: 'New',
              last_name: 'User',
              balance: 0,
              energy: 100,
              max_energy: 100,
              level: 1,
              experience_points: 0,
              mining_power: 0,
              claim_streak: 0,
              total_earnings: 0,
              total_referrals: 0,
              referral_code: `BT${telegramId.slice(-6).toUpperCase()}`,
              is_verified: false,
              is_banned: false
            };

            await get().createUser(newUser);
          } else {
            // Load existing user data
            set({
              telegramId: user.telegram_id,
              name: user.first_name || user.username || 'User',
              photoUrl: user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.telegram_id}`,
              username: user.username || '',
              firstName: user.first_name || '',
              lastName: user.last_name || '',
              email: user.email || '',
              phone: user.phone || '',
              balance: user.balance || 0,
              energy: user.energy || 100,
              maxEnergy: user.max_energy || 100,
              level: user.level || 1,
              experiencePoints: user.experience_points || 0,
              miningPower: user.mining_power || 0,
              claimStreak: user.claim_streak || 0,
              totalEarnings: user.total_earnings || 0,
              totalReferrals: user.total_referrals || 0,
              lastClaim: user.last_claim ? new Date(user.last_claim) : null,
              lastEnergyRefill: user.last_energy_refill ? new Date(user.last_energy_refill) : null,
              lastActive: user.last_active ? new Date(user.last_active) : new Date(),
              referralCode: user.referral_code || null,
              referredBy: user.referred_by || null,
              isVerified: user.is_verified || false,
              isBanned: user.is_banned || false,
              banReason: user.ban_reason || null
            });

            // Load additional stats
            await get().updateRealTimeStats();
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          
          // If it's a duplicate key error, try to load the existing user
          if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
            console.log('User already exists, attempting to load existing data...');
            try {
              const { data: existingUser } = await supabase
                .from('users')
                .select('*')
                .eq('telegram_id', telegramId)
                .single();
              
              if (existingUser) {
                set({
                  telegramId: existingUser.telegram_id,
                  name: existingUser.first_name || existingUser.username || 'User',
                  photoUrl: existingUser.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${existingUser.telegram_id}`,
                  username: existingUser.username || '',
                  firstName: existingUser.first_name || '',
                  lastName: existingUser.last_name || '',
                  email: existingUser.email || '',
                  phone: existingUser.phone || '',
                  balance: existingUser.balance || 0,
                  energy: existingUser.energy || 100,
                  maxEnergy: existingUser.max_energy || 100,
                  level: existingUser.level || 1,
                  experiencePoints: existingUser.experience_points || 0,
                  miningPower: existingUser.mining_power || 0,
                  claimStreak: existingUser.claim_streak || 0,
                  totalEarnings: existingUser.total_earnings || 0,
                  totalReferrals: existingUser.total_referrals || 0,
                  lastClaim: existingUser.last_claim ? new Date(existingUser.last_claim) : null,
                  lastEnergyRefill: existingUser.last_energy_refill ? new Date(existingUser.last_energy_refill) : null,
                  lastActive: existingUser.last_active ? new Date(existingUser.last_active) : new Date(),
                  referralCode: existingUser.referral_code || null,
                  referredBy: existingUser.referred_by || null,
                  isVerified: existingUser.is_verified || false,
                  isBanned: existingUser.is_banned || false,
                  banReason: existingUser.ban_reason || null
                });
                
                // Load additional stats
                await get().updateRealTimeStats();
                return; // Successfully loaded existing user
              }
            } catch (loadError) {
              console.error('Failed to load existing user:', loadError);
            }
          }
          
          // If all else fails, throw the original error
          throw error;
        }
      },

      refreshUserData: async () => {
        const { telegramId } = get();
        if (telegramId) {
          await get().loadUserData(telegramId);
        }
      },

      addNotification: (notification) => {
        set(state => ({
          realTimeData: {
            ...state.realTimeData,
            notifications: [
              ...state.realTimeData.notifications,
              {
                ...notification,
                id: Date.now().toString(),
                timestamp: new Date(),
                read: false
              }
            ]
          }
        }));
      },

      markNotificationAsRead: (id) => {
        set(state => ({
          realTimeData: {
            ...state.realTimeData,
            notifications: state.realTimeData.notifications.map(n =>
              n.id === id ? { ...n, read: true } : n
            )
          }
        }));
      },

      clearNotifications: () => {
        set(state => ({
          realTimeData: {
            ...state.realTimeData,
            notifications: []
          }
        }));
      },

      updateRealTimeStats: async () => {
        const { telegramId } = get();
        if (!telegramId) return;

        try {
          // Count referrals
          const { count: referralsCount } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', telegramId);

          // Count completed tasks
          const { count: tasksCompleted } = await supabase
            .from('task_completions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', telegramId);

          // Count achievements
          const { count: achievementsUnlocked } = await supabase
            .from('achievements')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', telegramId)
            .eq('is_completed', true);

          // Calculate time-based stats
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

          // Today's referrals
          const { count: todayReferrals } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', telegramId)
            .gte('created_at', today.toISOString());

          // This week's referrals
          const { count: thisWeekReferrals } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', telegramId)
            .gte('created_at', weekStart.toISOString());

          // This month's referrals
          const { count: thisMonthReferrals } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', telegramId)
            .gte('created_at', monthStart.toISOString());

          // Earnings calculations
          const { data: earningsData } = await supabase
            .from('earnings')
            .select('amount, created_at')
            .eq('user_id', telegramId);

          const totalEarnings = earningsData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
          
          const todayEarnings = earningsData
            ?.filter(item => new Date(item.created_at) >= today)
            ?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

          const thisWeekEarnings = earningsData
            ?.filter(item => new Date(item.created_at) >= weekStart)
            ?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

          const thisMonthEarnings = earningsData
            ?.filter(item => new Date(item.created_at) >= monthStart)
            ?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

          set(state => ({
            stats: {
              ...state.stats,
              referralsCount: referralsCount || 0,
              tasksCompleted: tasksCompleted || 0,
              todayReferrals: todayReferrals || 0,
              thisWeekReferrals: thisWeekReferrals || 0,
              thisMonthReferrals: thisMonthReferrals || 0,
              todayEarnings: todayEarnings,
              thisWeekEarnings: thisWeekEarnings,
              thisMonthEarnings: thisMonthEarnings,
              achievementsUnlocked: achievementsUnlocked || 0
            },
            totalEarnings,
            totalReferrals: referralsCount || 0
          }));
        } catch (error) {
          console.error('Error updating real-time stats:', error);
          get().addNotification({
            type: 'error',
            title: 'Stats Update Failed',
            message: 'Failed to update real-time statistics.'
          });
        }
      },

      startRealTimeUpdates: () => {
        // Update stats every minute
        const interval = setInterval(get().updateRealTimeStats, 60000);
        
        // Store interval ID for cleanup
        set({ realTimeData: { ...get().realTimeData, intervalId: interval } });
      },

      stopRealTimeUpdates: () => {
        const { realTimeData } = get();
        if (realTimeData.intervalId) {
          clearInterval(realTimeData.intervalId);
        }
      }
    }),
    {
      name: 'bt-community-user-storage',
      partialize: (state) => ({
        telegramId: state.telegramId,
        name: state.name,
        photoUrl: state.photoUrl,
        username: state.username,
        level: state.level,
        balance: state.balance,
        energy: state.energy
      })
    }
  )
);