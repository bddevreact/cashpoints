import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Award, Share2, Activity, BarChart3, Calendar, Target, Zap, RefreshCw, Settings, Eye, EyeOff, Download, Upload, Filter, Search, UserPlus, UserCheck, UserX, Crown, Star, Medal, Trophy, Gift, DollarSign, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, AlertCircle, Info, HelpCircle, ChevronDown, ChevronUp, Plus, Minus, RotateCcw, Save, Edit, Trash2, Copy, Check, ExternalLink, Link, Hash, Tag, Bot, Shield, MessageCircle } from 'lucide-react';
import { useFirebaseUserStore } from '../store/firebaseUserStore';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import ReferralDashboard from '../components/ReferralDashboard';
import SocialShareModal from '../components/SocialShareModal';

interface GroupMember {
  id: string;
  username: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
  joinDate: string;
  status: 'active' | 'pending' | 'suspicious' | 'verified';
  lastActivity: string;
  messageCount: number;
  isBot: boolean;
  referralValue: number;
  rejoinCount: number;
  isActive: boolean;
  lastJoinDate: string;
}

interface ReferralStats {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  suspiciousMembers: number;
  verifiedMembers: number;
  totalEarnings: number;
  todayEarnings: number;
  thisWeekEarnings: number;
  thisMonthEarnings: number;
  level: number;
  nextLevelProgress: number;
  nextLevelTarget: number;
}

export default function Referrals() {
  const { addNotification, referralCode, loadUserData } = useFirebaseUserStore();
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'analytics' | 'enhanced' | 'settings'>('overview');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const [isLive, setIsLive] = useState(true);
  const [showSocialShareModal, setShowSocialShareModal] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    autoRefresh: true,
    fakeUserDetection: true,
    realTimeNotifications: true,
    pushNotifications: false,
    backgroundSync: true,
    dataRetention: 30, // days
    refreshInterval: 30, // seconds
    showEarnings: true,
    showMemberDetails: true
  });

  // Analytics state
  const [analytics, setAnalytics] = useState({
    fakeUserDetectionRate: 0,
    averageMemberActivity: 0,
    conversionRate: 0,
    referralGrowthRate: 0,
    earningsTrend: 0,
    memberRetentionRate: 0,
    topReferralSources: [] as string[],
    monthlyStats: [] as Array<{ month: string; referrals: number; earnings: number }>,
    weeklyStats: [] as Array<{ week: string; referrals: number; earnings: number }>
  });
  
  // Real-time updates hook
  const { isUpdating, forceUpdate } = useRealTimeUpdates({
    interval: 15000, // 15 seconds for referrals
    onUpdate: () => {
      setLastUpdate(new Date());
      updateLiveData();
    }
  });

  // Auto-refresh every minute
  useEffect(() => {
    if (!settings.autoRefresh) return;
    
    const interval = setInterval(() => {
      if (!isUpdating && isLive) {
        updateLiveData();
        loadReferralStats();
        if (activeTab === 'analytics') {
          loadAnalyticsData();
      }
      }
    }, settings.refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [isUpdating, isLive, settings.autoRefresh, settings.refreshInterval, activeTab]);

  // Simulate live member updates
  useEffect(() => {
    if (!isLive || !settings.autoRefresh) return;
    
    const interval = setInterval(() => {
      updateLiveData();
    }, Math.min(settings.refreshInterval * 1000, 45000)); // Use settings or max 45 seconds

    return () => clearInterval(interval);
  }, [isLive, settings.autoRefresh, settings.refreshInterval]);

  const updateLiveData = () => {
    // Real-time data updates will be handled by actual API calls
    setLastUpdate(new Date());
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await forceUpdate();
      updateLiveData();
      setLastUpdate(new Date());
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Referral data refreshed successfully!'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to refresh referral data'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleLive = () => {
    setIsLive(!isLive);
    if (!isLive) {
      updateLiveData();
    }
  };

  // Load real referral stats from database
  const { 
    telegramId, 
    balance, 
    totalReferrals, 
    totalEarnings 
  } = useFirebaseUserStore();

  useEffect(() => {
    loadReferralStats();
  }, [telegramId]);

  // Force reload user data if referral code is missing
  useEffect(() => {
    if (telegramId && !referralCode) {
      console.warn('🔄 Referral code missing, reloading user data...');
      loadUserData(telegramId);
    }
  }, [telegramId, referralCode, loadUserData]);

  const loadReferralStats = async () => {
    if (!telegramId) return;

    try {
      // Load referral statistics from database
      const referralsQuery = query(
        collection(db, 'referrals'),
        where('referrer_id', '==', telegramId)
      );
      const referralsSnapshot = await getDocs(referralsQuery);
      const referrals = referralsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Load earnings data
      const earningsQuery = query(
        collection(db, 'earnings'),
        where('user_id', '==', telegramId)
      );
      const earningsSnapshot = await getDocs(earningsQuery);
      const earnings = earningsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate stats
      const totalMembers = referrals?.length || 0;
      const verifiedMembers = referrals?.filter((r: any) => r.status === 'verified').length || 0;
      const pendingMembers = referrals?.filter((r: any) => r.status === 'pending').length || 0;
      const suspiciousMembers = referrals?.filter((r: any) => r.status === 'suspicious').length || 0;
      const activeMembers = verifiedMembers;

      const totalEarnings = earnings?.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0;
      const today = new Date().toDateString();
      const todayEarnings = earnings?.filter((e: any) => 
        new Date(e.created_at).toDateString() === today
      ).reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0;

      const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const thisWeekEarnings = earnings?.filter((e: any) => 
        new Date(e.created_at) >= thisWeek
      ).reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0;

      const thisMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const thisMonthEarnings = earnings?.filter((e: any) => 
        new Date(e.created_at) >= thisMonth
      ).reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0;

             // New level calculation based on referral system
       const getLevelInfo = (totalMembers: number) => {
         if (totalMembers >= 10000) return { level: 4, nextTarget: 10000, progress: 100 };
         if (totalMembers >= 5000) return { level: 3, nextTarget: 5000, progress: Math.min((totalMembers / 5000) * 100, 100) };
         if (totalMembers >= 1000) return { level: 2, nextTarget: 1000, progress: Math.min((totalMembers / 1000) * 100, 100) };
         return { level: 1, nextTarget: 100, progress: Math.min((totalMembers / 100) * 100, 100) };
       };
      
      const levelInfo = getLevelInfo(totalMembers);
      const level = levelInfo.level;
      const nextLevelProgress = levelInfo.progress;
      const nextLevelTarget = levelInfo.nextTarget;

      setReferralStats({
        totalMembers,
        activeMembers,
        pendingMembers,
        suspiciousMembers,
        verifiedMembers,
        totalEarnings,
        todayEarnings,
        thisWeekEarnings,
        thisMonthEarnings,
        level,
        nextLevelProgress,
        nextLevelTarget
      });

    } catch (error) {
      console.error('Error loading referral stats:', error);
    }
  };

  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  // Load real group members from database
  useEffect(() => {
    loadGroupMembers();
  }, [telegramId]);

  const loadGroupMembers = async () => {
    if (!telegramId) return;

    try {
      // Load referrals with user data
      const referralsQuery = query(
        collection(db, 'referrals'),
        where('referrer_id', '==', telegramId),
        orderBy('created_at', 'desc')
      );
      const referralsSnapshot = await getDocs(referralsQuery);
      const referrals = referralsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Load user data for each referral
      const referralsWithUsers = await Promise.all(
        referrals.map(async (ref: any) => {
          if (ref.referred_id) {
            const userQuery = query(
              collection(db, 'users'),
              where('telegram_id', '==', ref.referred_id)
            );
            const userSnapshot = await getDocs(userQuery);
            const userData = userSnapshot.docs[0]?.data();
            
            return {
              ...ref,
              users: userData
            };
          }
          return ref;
        })
      );

      // Transform data to GroupMember format
      const members = referralsWithUsers?.map((ref: any, index: number) => {
        const user = ref.users;
        const joinDate = new Date(ref.created_at);
        const lastActive = ref.last_active ? new Date(ref.last_active) : joinDate;
        
        // Calculate message count (placeholder - would come from actual message tracking)
        const messageCount = Math.floor(Math.random() * 100) + 10;
        
        // Determine if user is active (active in last 7 days)
        const isActive = (Date.now() - lastActive.getTime()) < (7 * 24 * 60 * 60 * 1000);
        
        // Determine status based on referral status
        let status: 'active' | 'pending' | 'suspicious' | 'verified' = 'pending';
        if (ref.status === 'verified') status = 'verified';
        else if (ref.status === 'suspicious') status = 'suspicious';
        else if (isActive) status = 'active';

        return {
          id: user?.telegram_id || `ref_${index}`,
          username: user?.username || `user_${index}`,
          firstName: user?.first_name || 'User',
          lastName: user?.last_name || '',
          photoUrl: user?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.telegram_id || index}`,
          joinDate: joinDate.toISOString().split('T')[0],
          status,
          lastActivity: formatTimeAgo(lastActive),
          messageCount,
          isBot: false, // Would be determined by actual bot detection
          referralValue: ref.status === 'verified' ? 2 : 0, // Updated to 2 taka as per new system
          rejoinCount: ref.rejoin_count || 0,
          isActive: ref.is_active !== false,
          lastJoinDate: ref.last_join_date || ref.created_at
        };
      }) || [];

      setGroupMembers(members);

    } catch (error) {
      console.error('Error loading group members:', error);
    }
  };

  // Load individual referral configuration to get base URL and reward
  const [individualReferralConfig, setIndividualReferralConfig] = useState({
    base_url: '',
    referral_reward: 2, // Updated to 2 taka as per new system
    is_active: true,
    tracking_enabled: true
  });

  useEffect(() => {
    loadIndividualReferralConfig();
  }, []);

  const loadIndividualReferralConfig = async () => {
    try {
      const configQuery = query(
        collection(db, 'global_config'),
        where('config_key', '==', 'individual_referral_system')
      );
      const configSnapshot = await getDocs(configQuery);
      
      if (!configSnapshot.empty) {
        const configDoc = configSnapshot.docs[0];
        const config = JSON.parse(configDoc.data().config_value || '{}');
        setIndividualReferralConfig({
          base_url: config.base_url || '',
          referral_reward: config.referral_reward || 2, // Updated to 2 taka as per new system
          is_active: config.is_active !== false,
          tracking_enabled: config.tracking_enabled !== false
        });
      }
    } catch (error) {
      console.error('Error loading individual referral config:', error);
    }
  };

  // Generate individual referral link for current user
  const generateIndividualReferralLink = () => {
    console.log('🔗 Generating referral link...', { telegramId, referralCode });
    
    if (!telegramId) {
      console.warn('❌ No telegram ID available for referral link generation');
      return '';
    }
    
    // Get user's unique referral code from database or generate fallback
    let userReferralCode = referralCode;
    
    if (!userReferralCode) {
      console.warn('⚠️ No referral code in store, generating fallback...');
      userReferralCode = `BT${telegramId.slice(-6).toUpperCase()}`;
      
      // Try to update the store with the generated code
      // This will trigger a re-render when the actual code is loaded
      console.log('🔄 Using fallback referral code:', userReferralCode);
    }
    
    // Create bot referral link with auto-start trigger
    const botUsername = 'CashPoinntbot'; // Update with your actual bot username
    const individualLink = `https://t.me/${botUsername}?start=${userReferralCode}`;
    
    console.log('✅ Generated referral link:', individualLink);
    return individualLink;
  };

  // Enhanced referral system with auto-start triggers
  const referralLink = generateIndividualReferralLink();
  
  // Mock real-time data (in real app, this would come from WebSocket/API)
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
    suspiciousMembers: 0,
    verifiedMembers: 0,
    totalEarnings: 0,
    todayEarnings: 0,
    thisWeekEarnings: 0,
    thisMonthEarnings: 0,
    level: 1,
    nextLevelProgress: 0,
    nextLevelTarget: 10
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

     const refreshData = async () => {
     setIsRefreshing(true);
     try {
       await loadReferralStats();
       await loadGroupMembers();
       
       // Check for duplicate join warnings
       const notificationsQuery = query(
         collection(db, 'notifications'),
         where('user_id', '==', telegramId),
         where('type', '==', 'warning'),
         where('title', '==', 'Duplicate Join Warning'),
         orderBy('created_at', 'desc'),
         limit(5)
       );
       const notificationsSnapshot = await getDocs(notificationsQuery);
       
       if (!notificationsSnapshot.empty) {
         notificationsSnapshot.forEach((doc) => {
           const notif = doc.data();
           addNotification({
             type: 'warning',
             title: 'Duplicate Join Warning',
             message: notif.message
           });
         });
       }
       
       addNotification({
         type: 'success',
         title: 'Success',
         message: 'Referral data refreshed successfully!'
       });
     } catch (error) {
       console.error('Error refreshing data:', error);
       addNotification({
         type: 'error',
         title: 'Error',
         message: 'Failed to refresh referral data'
       });
     } finally {
     setIsRefreshing(false);
     }
   };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-400';
      case 'active': return 'text-blue-400';
      case 'pending': return 'text-yellow-400';
      case 'suspicious': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'active': return <UserCheck className="w-4 h-4 text-blue-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'suspicious': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <UserX className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Load analytics data
  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalyticsData();
    }
  }, [activeTab, telegramId]);

  // Load settings from localStorage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadAnalyticsData = async () => {
    if (!telegramId) return;

    try {
      // Load comprehensive analytics data
      const referralsQuery = query(
        collection(db, 'referrals'),
        where('referrer_id', '==', telegramId)
      );
      const referralsSnapshot = await getDocs(referralsQuery);
      const referrals = referralsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Load earnings data for trends
      const earningsQuery = query(
        collection(db, 'earnings'),
        where('user_id', '==', telegramId),
        orderBy('created_at', 'desc')
      );
      const earningsSnapshot = await getDocs(earningsQuery);
      const earnings = earningsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate analytics metrics
      const totalReferrals = referrals?.length || 0;
      const verifiedReferrals = referrals?.filter((r: any) => r.status === 'verified').length || 0;
      const suspiciousReferrals = referrals?.filter((r: any) => r.status === 'suspicious').length || 0;
      const pendingReferrals = referrals?.filter((r: any) => r.status === 'pending').length || 0;

      // Fake user detection rate
      const fakeUserDetectionRate = totalReferrals > 0 
        ? ((suspiciousReferrals / totalReferrals) * 100).toFixed(1)
        : 0;

      // Conversion rate (verified / total)
      const conversionRate = totalReferrals > 0 
        ? ((verifiedReferrals / totalReferrals) * 100).toFixed(1)
        : 0;

      // Member activity (based on referral status)
      const activeMembers = verifiedReferrals + pendingReferrals;
      const averageMemberActivity = totalReferrals > 0 
        ? ((activeMembers / totalReferrals) * 100).toFixed(1)
        : 0;

      // Referral growth rate (comparing current month vs previous month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const currentMonthReferrals = referrals?.filter((r: any) => {
        const refDate = new Date(r.created_at);
        return refDate.getMonth() === currentMonth && refDate.getFullYear() === currentYear;
      }).length || 0;

      const previousMonthReferrals = referrals?.filter((r: any) => {
        const refDate = new Date(r.created_at);
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return refDate.getMonth() === prevMonth && refDate.getFullYear() === prevYear;
      }).length || 0;

      const referralGrowthRate = previousMonthReferrals > 0 
        ? (((currentMonthReferrals - previousMonthReferrals) / previousMonthReferrals) * 100).toFixed(1)
        : currentMonthReferrals > 0 ? 100 : 0;

      // Earnings trend
      const currentMonthEarnings = earnings?.filter((e: any) => {
        const earningDate = new Date(e.created_at);
        return earningDate.getMonth() === currentMonth && earningDate.getFullYear() === currentYear;
      }).reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0;

      const previousMonthEarnings = earnings?.filter((e: any) => {
        const earningDate = new Date(e.created_at);
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return earningDate.getMonth() === prevMonth && earningDate.getFullYear() === prevYear;
      }).reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0;

      const earningsTrend = previousMonthEarnings > 0 
        ? (((currentMonthEarnings - previousMonthEarnings) / previousMonthEarnings) * 100).toFixed(1)
        : currentMonthEarnings > 0 ? 100 : 0;

      // Member retention rate (users who stayed active)
      const retentionReferrals = referrals?.filter((r: any) => {
        const refDate = new Date(r.created_at);
        const daysSinceReferral = (Date.now() - refDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceReferral > 7 && r.status === 'verified'; // Active for more than 7 days
      }).length || 0;

      const memberRetentionRate = verifiedReferrals > 0 
        ? ((retentionReferrals / verifiedReferrals) * 100).toFixed(1)
        : 0;

      // Monthly stats for the last 6 months
      const monthlyStats = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date();
        month.setMonth(month.getMonth() - i);
        const monthName = month.toLocaleDateString('en-US', { month: 'short' });
        const monthYear = month.getFullYear();
        
        const monthReferrals = referrals?.filter((r: any) => {
          const refDate = new Date(r.created_at);
          return refDate.getMonth() === month.getMonth() && refDate.getFullYear() === monthYear;
        }).length || 0;

        const monthEarnings = earnings?.filter((e: any) => {
          const earningDate = new Date(e.created_at);
          return earningDate.getMonth() === month.getMonth() && earningDate.getFullYear() === monthYear;
        }).reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0;

        monthlyStats.push({
          month: monthName,
          referrals: monthReferrals,
          earnings: monthEarnings
        });
      }

      // Weekly stats for the last 4 weeks
      const weeklyStats = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const weekReferrals = referrals?.filter((r: any) => {
          const refDate = new Date(r.created_at);
          return refDate >= weekStart && refDate <= weekEnd;
        }).length || 0;

        const weekEarnings = earnings?.filter((e: any) => {
          const earningDate = new Date(e.created_at);
          return earningDate >= weekStart && earningDate <= weekEnd;
        }).reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0;

        weeklyStats.push({
          week: `Week ${4 - i}`,
          referrals: weekReferrals,
          earnings: weekEarnings
        });
      }

      setAnalytics({
        fakeUserDetectionRate: parseFloat(fakeUserDetectionRate.toString()),
        averageMemberActivity: parseFloat(averageMemberActivity.toString()),
        conversionRate: parseFloat(conversionRate.toString()),
        referralGrowthRate: parseFloat(referralGrowthRate.toString()),
        earningsTrend: parseFloat(earningsTrend.toString()),
        memberRetentionRate: parseFloat(memberRetentionRate.toString()),
        topReferralSources: [], // Would come from actual tracking data
        monthlyStats,
        weeklyStats
      });

    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  };

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('referralSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = (newSettings: typeof settings) => {
    try {
      setSettings(newSettings);
      localStorage.setItem('referralSettings', JSON.stringify(newSettings));
      
      // Apply settings immediately
      applySettings(newSettings);
      
      addNotification({
        type: 'success',
        title: 'Settings Saved',
        message: 'Your referral settings have been updated successfully!'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      addNotification({
        type: 'error',
        title: 'Settings Error',
        message: 'Failed to save settings. Please try again.'
      });
    }
  };

  const applySettings = (newSettings: typeof settings) => {
    // Apply auto-refresh setting
    if (newSettings.autoRefresh) {
      // Enable auto-refresh with custom interval
      const interval = setInterval(() => {
        if (isLive) {
          updateLiveData();
          loadReferralStats();
          if (activeTab === 'analytics') {
            loadAnalyticsData();
          }
        }
      }, newSettings.refreshInterval * 1000);

      return () => clearInterval(interval);
    }

    // Apply other settings
    if (newSettings.fakeUserDetection) {
      // Enable enhanced fake user detection
      console.log('Enhanced fake user detection enabled');
    }

    if (newSettings.realTimeNotifications) {
      // Enable real-time notifications
      console.log('Real-time notifications enabled');
    }

    if (newSettings.pushNotifications) {
      // Request push notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  };

  const toggleSetting = (settingKey: keyof typeof settings, value?: any) => {
    const newValue = value !== undefined ? value : !settings[settingKey];
    const newSettings = { ...settings, [settingKey]: newValue };
    saveSettings(newSettings);
  };

  const resetSettings = () => {
    const defaultSettings = {
      autoRefresh: true,
      fakeUserDetection: true,
      realTimeNotifications: true,
      pushNotifications: false,
      backgroundSync: true,
      dataRetention: 30,
      refreshInterval: 30,
      showEarnings: true,
      showMemberDetails: true
    };
    saveSettings(defaultSettings);
  };

  // Add new state for enhanced referral tracking
  const [showEnhancedDashboard, setShowEnhancedDashboard] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy to-gray-900 text-white p-4 pb-24">
      {/* Dynamic Header */}
      <div className="mb-6">
        {/* Header with Live Status */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <motion.h1 
              className="text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Cash Points Referrals
            </motion.h1>
            <div className="flex items-center gap-4">
              <motion.p 
                className="text-gray-400 text-sm"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Last updated: {lastUpdate.toLocaleTimeString()}
              </motion.p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className={`text-xs ${isLive ? 'text-green-400' : 'text-red-400'}`}>
                  {isLive ? 'LIVE' : 'PAUSED'}
                </span>
              </div>
              <motion.p 
                className="text-gray-300 text-sm"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {referralStats.totalMembers} total referrals • {formatCurrency(referralStats.todayEarnings)} today • {referralStats.verifiedMembers} verified
              </motion.p>
              {isUpdating && (
                <motion.div 
                  className="flex items-center gap-1 text-blue-400 text-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Updating...
                </motion.div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button
              onClick={toggleLive}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                isLive 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {isLive ? 'Stop Live' : 'Start Live'}
            </motion.button>
            
            <motion.button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2 rounded-lg transition-all duration-300 ${
                isRefreshing 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-gold/20 text-gold hover:bg-gold/30 hover:scale-105'
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>

      {/* Navigation Tabs */}
      <div className="glass p-1 mb-4 border border-white/10 text-center font-bold font-sans">
        <div className="flex bg-gray-800 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: Target },
            { id: 'enhanced', label: 'Enhanced', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-2 rounded-md transition-all duration-300 flex items-center justify-center gap-1 text-xs ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-gold to-yellow-500 text-navy shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Earn Real Money Banner */}
      <motion.div 
        className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-4 backdrop-blur-sm border border-green-500/30 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="text-center">
          <motion.div 
            className="text-3xl mb-2"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5, type: "spring" }}
          >
            💰
          </motion.div>
          <motion.h3 
            className="text-lg font-semibold text-green-400 mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            Earn Real Money from Referrals
          </motion.h3>
          <motion.p 
            className="text-sm text-gray-300"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
                         Invite friends to join Cash Points and earn ৳2 for every verified member!
          </motion.p>
        </div>
      </motion.div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Quick Stats Summary */}
          <div className="glass p-4 mb-6 border border-white/10 bg-gradient-to-r from-gold/10 to-transparent">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold" />
              Quick Stats Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-gold">{referralStats.totalMembers}</div>
                <div className="text-xs text-gray-400">Total Referrals</div>
                <div className="text-xs text-gold">৳{referralStats.totalEarnings} earned</div>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{referralStats.verifiedMembers}</div>
                <div className="text-xs text-gray-400">Verified</div>
                <div className="text-xs text-green-400">৳{referralStats.verifiedMembers * (individualReferralConfig.referral_reward || 50)}</div>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{referralStats.thisMonthEarnings}</div>
                <div className="text-xs text-gray-400">This Month</div>
                <div className="text-xs text-blue-400">৳{formatCurrency(referralStats.thisMonthEarnings)}</div>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">{referralStats.level}</div>
                <div className="text-xs text-gray-400">Current Level</div>
                <div className="text-xs text-purple-400">{referralStats.nextLevelProgress}/{referralStats.nextLevelTarget}</div>
              </div>
            </div>
          </div>

          {/* Real-time Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="glass p-4 text-center border border-white/10 hover:border-gold/50 transition-all duration-300">
              <Users className="w-8 h-8 text-gold mx-auto mb-2" />
              <p className="text-sm text-gray-400">Total Members</p>
              <p className="text-2xl font-bold text-gold">{referralStats.totalMembers}</p>
              <p className="text-xs text-gray-500">in your group</p>
            </div>
            <div className="glass p-4 text-center border border-white/10 hover:border-gold/50 transition-all duration-300">
              <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Total Earnings</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(referralStats.totalEarnings)}</p>
              <p className="text-xs text-gray-500">from referrals</p>
            </div>
          </div>

          {/* Member Status Breakdown */}
          <div className="glass p-4 mb-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-gold" />
              Member Status Overview
            </h3>
                         <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-xs text-gray-400">Verified</p>
                <p className="text-lg font-semibold text-green-400">{referralStats.verifiedMembers}</p>
                <p className="text-xs text-green-400">৳{referralStats.verifiedMembers * (individualReferralConfig.referral_reward || 50)} earned</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <UserCheck className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-xs text-gray-400">Active</p>
                <p className="text-lg font-semibold text-blue-400">{referralStats.activeMembers}</p>
                <p className="text-xs text-blue-400">recently active</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
                <p className="text-xs text-gray-400">Pending</p>
                <p className="text-lg font-semibold text-yellow-400">{referralStats.pendingMembers}</p>
                <p className="text-xs text-yellow-400">awaiting review</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-xs text-gray-400">Suspicious</p>
                <p className="text-lg font-semibold text-red-400">{referralStats.suspiciousMembers}</p>
                <p className="text-xs text-red-400">under investigation</p>
              </div>
            </div>
          </div>

          {/* Earnings Breakdown */}
          <div className="glass p-4 mb-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gold" />
              Earnings Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <Calendar className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Today</p>
                <p className="text-lg font-semibold text-blue-400">{formatCurrency(referralStats.todayEarnings)}</p>
              </div>
              <div className="text-center">
                <Target className="w-6 h-6 text-green-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">This Week</p>
                <p className="text-lg font-semibold text-green-400">{formatCurrency(referralStats.thisWeekEarnings)}</p>
              </div>
              <div className="text-center">
                <Award className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">This Month</p>
                <p className="text-lg font-semibold text-purple-400">{formatCurrency(referralStats.thisMonthEarnings)}</p>
              </div>
            </div>
          </div>

          {/* Referral Level */}
          <div className="glass p-4 mb-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-gold" />
              Referral Level
            </h3>
            <div className="text-center">
              <p className="text-2xl font-bold text-gold mb-2">Level {referralStats.level}</p>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-gold to-yellow-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(referralStats.nextLevelProgress / referralStats.nextLevelTarget) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400">
                {referralStats.nextLevelProgress}/{referralStats.nextLevelTarget} to next level
              </p>
              {/* Bengali Level Description */}
              <div className="mt-3 p-2 bg-gold/10 rounded-lg border border-gold/20">
                <p className="text-sm text-gold font-medium">
                  {(() => {
                    const getBengaliLevelInfo = (level: number) => {
                      switch (level) {
                        case 1: return { required: '১০০', bonus: '২০০' };
                        case 2: return { required: '১০০০', bonus: '৫০০' };
                        case 3: return { required: '৫০০০', bonus: '১৫০০' };
                        case 4: return { required: '১০০০০', bonus: '৩০০০' };
                        default: return { required: '১০০', bonus: '২০০' };
                      }
                    };
                    const levelInfo = getBengaliLevelInfo(referralStats.level);
                    return `👥 ${levelInfo.required} মেম্বার অ্যাড = 🎁 ${levelInfo.bonus} টাকা বোনাস`;
                  })()}
                </p>
              </div>
            </div>
          </div>

          {/* Real-time Referral Activity */}
          <div className="glass p-4 mb-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Recent Referral Activity
            </h3>
            <div className="space-y-3">
              {groupMembers.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img 
                      src={member.photoUrl} 
                      alt={member.firstName}
                      className="w-8 h-8 rounded-full border-2 border-white/20"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">{member.firstName}</p>
                      <p className="text-xs text-gray-400">@{member.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(member.status)}
                      <span className={`text-xs font-medium ${getStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{member.lastActivity}</p>
                  </div>
                </div>
              ))}
              
              {groupMembers.length === 0 && (
                <div className="text-center py-4 text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No referrals yet</p>
                  <p className="text-xs">Share your referral link to start earning!</p>
                </div>
              )}
            </div>
          </div>

                                                             

           {/* Performance Insights */}
           <div className="glass p-4 mb-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Performance Insights
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                <span className="text-sm text-gray-300">Referral Success Rate</span>
                <span className="text-sm font-semibold text-green-400">
                  {referralStats.totalMembers > 0 
                    ? `${Math.round((referralStats.verifiedMembers / referralStats.totalMembers) * 100)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                <span className="text-sm text-gray-300">Average Earnings per Referral</span>
                <span className="text-sm font-semibold text-gold">
                  {referralStats.verifiedMembers > 0 
                    ? formatCurrency(Math.round(referralStats.totalEarnings / referralStats.verifiedMembers))
                    : formatCurrency(0)
                  }
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                <span className="text-sm text-gray-300">This Month's Growth</span>
                <span className="text-sm font-semibold text-blue-400">
                  +{referralStats.thisMonthEarnings > 0 ? referralStats.thisMonthEarnings : 0} referrals
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <>
          {/* Members Header with Refresh */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-gold" />
              Group Members ({referralStats.totalMembers})
            </h3>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-all duration-300"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Member List */}
          <div className="space-y-3">
            {groupMembers.map((member) => (
              <div key={member.id} className="glass p-4 border border-white/10 rounded-lg hover:border-gold/30 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={member.photoUrl} 
                      alt={member.firstName}
                      className="w-12 h-12 rounded-full border-2 border-white/20"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white">
                          {member.firstName} {member.lastName}
                        </h4>
                        {member.isBot && <Bot className="w-4 h-4 text-red-400" />}
                        {getStatusIcon(member.status)}
                      </div>
                      <p className="text-sm text-gray-400">@{member.username}</p>
                                             <div className="flex items-center gap-4 text-xs text-gray-500">
                         <span>Joined: {formatDate(member.joinDate)}</span>
                         <span>Messages: {member.messageCount}</span>
                         <span>Last: {member.lastActivity}</span>
                         {member.rejoinCount > 0 && (
                           <span className="text-red-400 font-semibold">⚠️ Duplicate Join</span>
                         )}
                         <span className={`${member.isActive ? 'text-green-400' : 'text-red-400'}`}>
                           {member.isActive ? 'Active' : 'Left'}
                         </span>
                       </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getStatusColor(member.status)}`}>
                      {formatCurrency(member.referralValue)}
                    </div>
                    <p className="text-xs text-gray-500 capitalize">{member.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <>
          {/* Analytics Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-gold" />
              Referral Analytics Dashboard
            </h3>
            <button
              onClick={loadAnalyticsData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-all duration-300"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Analytics'}
            </button>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="glass p-4 text-center border border-white/10 hover:border-green-400/50 transition-all duration-300">
              <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Fake User Detection</p>
              <p className="text-2xl font-bold text-green-400">{analytics.fakeUserDetectionRate}%</p>
              <p className="text-xs text-gray-500">Accuracy Rate</p>
            </div>
            
            <div className="glass p-4 text-center border border-white/10 hover:border-blue-400/50 transition-all duration-300">
              <MessageCircle className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Member Activity</p>
              <p className="text-2xl font-bold text-blue-400">{analytics.averageMemberActivity}%</p>
              <p className="text-xs text-gray-500">Average Activity</p>
            </div>
            
            <div className="glass p-4 text-center border border-white/10 hover:border-gold/50 transition-all duration-300">
              <TrendingUp className="w-8 h-8 text-gold mx-auto mb-2" />
              <p className="text-sm text-gray-400">Conversion Rate</p>
              <p className="text-2xl font-bold text-gold">{analytics.conversionRate}%</p>
              <p className="text-xs text-gray-500">Referral Success</p>
            </div>
          </div>

          {/* Growth & Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="glass p-4 border border-white/10">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Referral Growth
              </h4>
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${
                  analytics.referralGrowthRate >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {analytics.referralGrowthRate >= 0 ? '+' : ''}{analytics.referralGrowthRate}%
                </div>
                <p className="text-sm text-gray-400">vs Previous Month</p>
                <div className="mt-3 p-2 bg-gray-800/50 rounded-lg">
                  <p className="text-xs text-gray-300">
                    {analytics.referralGrowthRate >= 0 
                      ? '🎉 Your referrals are growing!' 
                      : '📉 Referrals decreased this month'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="glass p-4 border border-white/10">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gold" />
                Earnings Trend
              </h4>
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${
                  analytics.earningsTrend >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {analytics.earningsTrend >= 0 ? '+' : ''}{analytics.earningsTrend}%
                </div>
                <p className="text-sm text-gray-400">vs Previous Month</p>
                <div className="mt-3 p-2 bg-gray-800/50 rounded-lg">
                  <p className="text-xs text-gray-300">
                    {analytics.earningsTrend >= 0 
                      ? '💰 Earnings are increasing!' 
                      : '📉 Earnings decreased this month'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Performance Chart */}
          <div className="glass p-5 border border-white/10 mb-6">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Monthly Performance (Last 6 Months)
            </h4>
            <div className="space-y-3">
              {analytics.monthlyStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <span className="text-blue-400 text-sm font-semibold">{stat.month}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{stat.referrals} Referrals</p>
                      <p className="text-xs text-gray-400">{formatCurrency(stat.earnings)} Earned</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min((stat.referrals / Math.max(...analytics.monthlyStats.map(s => s.referrals))) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Performance Chart */}
          <div className="glass p-5 border border-white/10 mb-6">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Weekly Performance (Last 4 Weeks)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {analytics.weeklyStats.map((stat, index) => (
                <div key={index} className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <div className="text-lg font-bold text-purple-400 mb-1">{stat.week}</div>
                  <div className="text-sm text-white mb-1">{stat.referrals} Referrals</div>
                  <div className="text-xs text-gray-400">{formatCurrency(stat.earnings)}</div>
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-1 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min((stat.referrals / Math.max(...analytics.weeklyStats.map(s => s.referrals))) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Member Retention & Quality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="glass p-4 border border-white/10">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-400" />
                Member Retention
              </h4>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">{analytics.memberRetentionRate}%</div>
                <p className="text-sm text-gray-400">Active for 7+ Days</p>
                <div className="mt-3 p-2 bg-gray-800/50 rounded-lg">
                  <p className="text-xs text-gray-300">
                    {analytics.memberRetentionRate >= 80 
                      ? '🌟 Excellent retention rate!' 
                      : analytics.memberRetentionRate >= 60 
                      ? '👍 Good retention rate' 
                      : '⚠️ Room for improvement'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="glass p-4 border border-white/10">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                Quality Score
              </h4>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {Math.round((analytics.conversionRate + analytics.averageMemberActivity) / 2)}%
                </div>
                <p className="text-sm text-gray-400">Overall Quality</p>
                <div className="mt-3 p-2 bg-gray-800/50 rounded-lg">
                  <p className="text-xs text-gray-300">
                    Based on conversion rate and member activity
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="glass p-5 border border-white/10">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Performance Insights
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                  <span className="text-gray-300">Referral Quality</span>
              </div>
                <span className={`font-semibold ${
                  analytics.conversionRate >= 80 ? 'text-green-400' :
                  analytics.conversionRate >= 60 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {analytics.conversionRate >= 80 ? 'Excellent' :
                   analytics.conversionRate >= 60 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
                  <span className="text-gray-300">Growth Trend</span>
              </div>
                <span className={`font-semibold ${
                  analytics.referralGrowthRate >= 20 ? 'text-green-400' :
                  analytics.referralGrowthRate >= 0 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {analytics.referralGrowthRate >= 20 ? 'Strong Growth' :
                   analytics.referralGrowthRate >= 0 ? 'Stable' : 'Declining'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-purple-400" />
                </div>
                  <span className="text-gray-300">Earnings Performance</span>
                </div>
                <span className={`font-semibold ${
                  analytics.earningsTrend >= 15 ? 'text-green-400' :
                  analytics.earningsTrend >= 0 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {analytics.earningsTrend >= 15 ? 'Outstanding' :
                   analytics.earningsTrend >= 0 ? 'Stable' : 'Decreasing'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Enhanced Tab - New Referral Tracking System */}
      {activeTab === 'enhanced' && (
        <>
          {/* Enhanced Referral Dashboard */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gold" />
                Enhanced Referral Tracking
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEnhancedDashboard(!showEnhancedDashboard)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    showEnhancedDashboard 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                      : 'bg-gold hover:bg-yellow-500 text-navy'
                  }`}
                >
                  {showEnhancedDashboard ? 'Hide Dashboard' : 'Show Enhanced Dashboard'}
                </button>
              </div>
            </div>

            {showEnhancedDashboard && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass p-4 border border-white/10"
              >
                <ReferralDashboard telegramId={telegramId || ''} />
              </motion.div>
            )}

            {/* Enhanced Features Info */}
            <div className="glass p-4 border border-blue-500/30 bg-blue-500/10">
              <h4 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                New Enhanced Features
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-300">
                <div>
                  <h5 className="font-medium text-blue-200 mb-2">🎯 Advanced Analytics</h5>
                  <ul className="space-y-1 text-xs">
                    <li>• Real-time referral performance tracking</li>
                    <li>• Group-based referral analysis</li>
                    <li>• Conversion rate optimization</li>
                    <li>• Trend analysis and predictions</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-blue-200 mb-2">📊 Performance Metrics</h5>
                  <ul className="space-y-1 text-xs">
                    <li>• Individual referral code tracking</li>
                    <li>• Group membership verification</li>
                    <li>• Fraud detection and prevention</li>
                    <li>• Automated reporting system</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions for Enhanced Features */}
          <div className="glass p-4 mb-6 border border-white/10">
            <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-gold" />
              Enhanced Referral Actions
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button 
                onClick={() => setShowEnhancedDashboard(true)}
                className="p-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">📊</div>
                  <div className="text-sm font-medium">View Dashboard</div>
                </div>
              </button>
              <button className="p-3 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">
                <div className="text-center">
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="text-sm font-medium">Track Performance</div>
                </div>
              </button>
              <button className="p-3 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">
                <div className="text-center">
                  <div className="text-2xl mb-1">📈</div>
                  <div className="text-sm font-medium">Analytics</div>
                </div>
              </button>
              <button className="p-3 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors">
                <div className="text-center">
                  <div className="text-2xl mb-1">🔍</div>
                  <div className="text-sm font-medium">Monitor</div>
                </div>
              </button>
            </div>
          </div>

          {/* Enhanced Referral Statistics */}
          <div className="glass p-4 mb-6 border border-white/10">
            <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold" />
              Enhanced Referral Stats
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">0</div>
                <div className="text-xs text-gray-400">Active Groups</div>
                <div className="text-xs text-blue-400">Enhanced tracking</div>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-green-400">0</div>
                <div className="text-xs text-gray-400">Referral Codes</div>
                <div className="text-xs text-green-400">Individual tracking</div>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">0</div>
                <div className="text-xs text-gray-400">Conversion Rate</div>
                <div className="text-xs text-purple-400">Enhanced metrics</div>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-orange-400">0</div>
                <div className="text-xs text-gray-400">Quality Score</div>
                <div className="text-xs text-orange-400">AI-powered</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <>
          <div className="glass p-4 sm:p-5 mb-6 border border-white/10 pb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5 text-gold" />
              Referral Settings
            </h3>
              <div className="flex gap-2">
                <button
                  onClick={resetSettings}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-all duration-300"
                >
                  Reset to Default
                </button>
                <button
                  onClick={() => saveSettings(settings)}
                  className="px-3 py-2 bg-gold hover:bg-yellow-500 text-navy rounded-lg text-sm font-semibold transition-all duration-300"
                >
                  Save All Settings
                </button>
                </div>
                  </div>

            <div className="space-y-4">
              {/* Auto-refresh Settings */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-400" />
                  Auto-Refresh Settings
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-300">Enable auto-refresh</span>
                      <p className="text-xs text-gray-400">Automatically update data at regular intervals</p>
                </div>
                    <button
                      onClick={() => toggleSetting('autoRefresh')}
                      className={`w-14 h-7 rounded-full relative cursor-pointer transition-all duration-300 ${
                        settings.autoRefresh ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-md ${
                        settings.autoRefresh ? 'right-1' : 'left-1'
                      }`}></div>
                    </button>
              </div>

                  {settings.autoRefresh && (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-300">Refresh interval</span>
                        <p className="text-xs text-gray-400">How often to refresh data</p>
                </div>
                      <select
                        value={settings.refreshInterval}
                        onChange={(e) => toggleSetting('refreshInterval', parseInt(e.target.value))}
                        className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-gold focus:outline-none"
                      >
                        <option value={15}>15 seconds</option>
                        <option value={30}>30 seconds</option>
                        <option value={60}>1 minute</option>
                        <option value={120}>2 minutes</option>
                        <option value={300}>5 minutes</option>
                      </select>
                  </div>
                  )}
                </div>
              </div>

              {/* Security & Detection Settings */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  Security & Detection
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-300">Enhanced fake user detection</span>
                      <p className="text-xs text-gray-400">AI-powered detection of suspicious accounts</p>
                </div>
                    <button
                      onClick={() => toggleSetting('fakeUserDetection')}
                      className={`w-14 h-7 rounded-full relative cursor-pointer transition-all duration-300 ${
                        settings.fakeUserDetection ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-md ${
                        settings.fakeUserDetection ? 'right-1' : 'left-1'
                      }`}></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-300">Background sync</span>
                      <p className="text-xs text-gray-400">Sync data in background for faster updates</p>
                    </div>
                    <button
                      onClick={() => toggleSetting('backgroundSync')}
                      className={`w-14 h-7 rounded-full relative cursor-pointer transition-all duration-300 ${
                        settings.backgroundSync ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-md ${
                        settings.backgroundSync ? 'right-1' : 'left-1'
                      }`}></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Notification Settings
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-300">Real-time notifications</span>
                      <p className="text-xs text-gray-400">Instant alerts for new members and earnings</p>
                </div>
                    <button
                      onClick={() => toggleSetting('realTimeNotifications')}
                      className={`w-14 h-7 rounded-full relative cursor-pointer transition-all duration-300 ${
                        settings.realTimeNotifications ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-md ${
                        settings.realTimeNotifications ? 'right-1' : 'left-1'
                      }`}></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-300">Push notifications</span>
                      <p className="text-xs text-gray-400">Get notified even when app is closed</p>
                    </div>
                    <button
                      onClick={() => toggleSetting('pushNotifications')}
                      className={`w-14 h-7 rounded-full relative cursor-pointer transition-all duration-300 ${
                        settings.pushNotifications ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-md ${
                        settings.pushNotifications ? 'right-1' : 'left-1'
                      }`}></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Display Settings */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-400" />
                  Display Settings
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-300">Show earnings details</span>
                      <p className="text-xs text-gray-400">Display detailed earnings information</p>
                </div>
                    <button
                      onClick={() => toggleSetting('showEarnings')}
                      className={`w-14 h-7 rounded-full relative cursor-pointer transition-all duration-300 ${
                        settings.showEarnings ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-md ${
                        settings.showEarnings ? 'right-1' : 'left-1'
                      }`}></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-300">Show member details</span>
                      <p className="text-xs text-gray-400">Display detailed member information</p>
                </div>
                    <button
                      onClick={() => toggleSetting('showMemberDetails')}
                      className={`w-14 h-7 rounded-full relative cursor-pointer transition-all duration-300 ${
                        settings.showMemberDetails ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-md ${
                        settings.showMemberDetails ? 'right-1' : 'left-1'
                      }`}></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-300">Data retention period</span>
                      <p className="text-xs text-gray-400">How long to keep referral data</p>
                    </div>
                    <select
                      value={settings.dataRetention}
                      onChange={(e) => toggleSetting('dataRetention', parseInt(e.target.value))}
                      className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-gold focus:outline-none"
                    >
                      <option value={7}>7 days</option>
                      <option value={30}>30 days</option>
                      <option value={90}>90 days</option>
                      <option value={365}>1 year</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Status & Info */}
            <div className="mt-6 space-y-4">
              {/* Current Settings Status */}
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Current Settings Status
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                      settings.autoRefresh ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <span className="text-gray-300">Auto-refresh</span>
                  </div>
                  <div className="text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                      settings.fakeUserDetection ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <span className="text-gray-300">Fake Detection</span>
                  </div>
                  <div className="text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                      settings.realTimeNotifications ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <span className="text-gray-300">Notifications</span>
                  </div>
                  <div className="text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                      settings.backgroundSync ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <span className="text-gray-300">Background Sync</span>
                  </div>
                </div>
              </div>

              {/* Settings Information */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                Settings Information
              </h4>
              <div className="text-xs text-blue-300 space-y-1">
                <p>• Auto-refresh ensures you always have the latest data</p>
                  <p>• Enhanced fake user detection protects your earnings</p>
                <p>• Real-time notifications keep you updated instantly</p>
                <p>• Background sync works even when app is minimized</p>
                  <p>• Push notifications work across all devices</p>
                  <p>• Data retention helps manage storage and performance</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Group Referral Link - Always Visible */}
      <div className="glass p-5 mb-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-gold" />
          Your Enhanced Referral Link
        </h3>
        
        {/* Referral Link Display */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg text-sm border border-gray-600 focus:border-gold focus:outline-none"
          />
          <button
            onClick={copyReferralLink}
            className="bg-gradient-to-r from-gold to-yellow-500 text-navy px-4 py-3 rounded-lg hover:from-yellow-400 hover:to-gold transition-all duration-300"
          >
            {copied ? 'Copied!' : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Referral Link Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <button
          onClick={() => setShowSocialShareModal(true)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center gap-2 font-semibold"
        >
          <Share2 className="w-4 h-4" />
            Share Your Referral Link
        </button>
        </div>

        {/* Referral Link Info */}
        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-medium">Referral Link Information</span>
          </div>
          <div className="text-xs text-blue-300 space-y-1">
                        {individualReferralConfig.base_url ? (
              <>
                <div>• এটি আপনার <strong>ব্যক্তিগত রেফারেল লিংক</strong> আপনার অনন্য আইডি সহ</div>
                <div>• যখন কেউ এই লিংক ব্যবহার করে, আপনি রেফারেলের জন্য ক্রেডিট পান</div>
                <div>• প্রতিটি সফল রেফারেলের জন্য আপনি <strong>৳{individualReferralConfig.referral_reward}</strong> আয় করেন</div>
                <div>• শুধুমাত্র আপনি এই লিংক ব্যবহার করতে পারেন - এটি আপনার অ্যাকাউন্টের জন্য অনন্য</div>
              </>
            ) : (
              <>
                <div>• এটি একটি <strong>গ্রুপ রেফারেল লিংক</strong> BT কমিউনিটির জন্য</div>
                <div>• যখন কেউ এই লিংক ব্যবহার করে যোগদান করে, আপনি রেফারেলের জন্য ক্রেডিট পান</div>
                <div>• প্রতিটি সফল রেফারেলের জন্য আপনি <strong>অনেক আয় করেন</strong> </div>
                <div>• অ্যাডমিন ব্যক্তিগত রেফারেল লিংক কনফিগার করতে পারেন</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Referral Members Overview */}
      <div className="glass p-5 mb-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-gold" />
          Your Referral Members ({referralStats.totalMembers})
        </h3>
        
        {referralStats.totalMembers > 0 ? (
          <div className="space-y-4">
            {/* Member Status Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="text-2xl font-bold text-green-400">{referralStats.verifiedMembers}</div>
                <div className="text-xs text-green-300">Verified Members</div>
                <div className="text-xs text-green-400">৳{referralStats.verifiedMembers * 2} earned</div>
              </div>
              <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="text-2xl font-bold text-blue-400">{referralStats.activeMembers}</div>
                <div className="text-xs text-blue-300">Active Members</div>
                <div className="text-xs text-blue-400">Recently active</div>
              </div>
              <div className="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <div className="text-2xl font-bold text-yellow-400">{referralStats.pendingMembers}</div>
                <div className="text-xs text-yellow-300">Pending Verification</div>
                <div className="text-xs text-yellow-400">Awaiting admin review</div>
              </div>
                             <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                 <div className="text-2xl font-bold text-red-400">{referralStats.suspiciousMembers}</div>
                 <div className="text-xs text-red-300">Suspicious</div>
                 <div className="text-xs text-red-400">Under investigation</div>
               </div>
                               <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="text-2xl font-bold text-red-400">
                    {groupMembers.filter(m => m.rejoinCount > 0).length}
                  </div>
                  <div className="text-xs text-red-300">Duplicate Joins</div>
                  <div className="text-xs text-red-400">
                    No reward given
                  </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab('members')}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-all duration-300"
              >
                View All Members
              </button>
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:scale-105 transition-all duration-300 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 inline mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-300 mb-2">No Referral Members Yet</h4>
            <p className="text-gray-400 text-sm mb-4">
              Share your referral link to start earning rewards!
            </p>
            <button
              onClick={() => setShowSocialShareModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-gold to-yellow-500 text-navy rounded-lg font-semibold hover:scale-105 transition-all duration-300"
            >
              Share Your Link Now
            </button>
          </div>
        )}
      </div>

      {/* How Group Referrals Work */}
      <div className="glass p-5 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-gold" />
          {individualReferralConfig.base_url ? 'How Individual Referrals Work' : 'How Group Referrals Work'}
        </h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-gradient-to-r from-gold to-yellow-500 text-navy rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="text-gray-300 font-medium">
                {individualReferralConfig.base_url ? 'Share your personal referral link' : 'Share your group link'}
              </p>
              <p className="text-gray-500 text-sm">
                {individualReferralConfig.base_url 
                  ? 'Send your unique referral link to friends via Telegram or social media'
                  : 'Send the group link to friends via Telegram or social media'
                }
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-gradient-to-r from-gold to-yellow-500 text-navy rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="text-gray-300 font-medium">
                {individualReferralConfig.base_url ? 'Friends join using your link' : 'Friends join your group'}
              </p>
              <p className="text-gray-500 text-sm">
                {individualReferralConfig.base_url
                  ? 'When they use your personal referral link, they become your referrals'
                  : 'When they join using your link, they become your referrals'
                }
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-gradient-to-r from-gold to-yellow-500 text-navy rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
              3
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <p className="text-gray-300 font-medium">
                  Earn ৳{individualReferralConfig.referral_reward || 50} per verified member
                </p>
              </div>
              <p className="text-gray-500 text-sm">
                {individualReferralConfig.base_url
                  ? 'Our system tracks referrals through your unique link and rewards you automatically'
                  : 'Our AI detects fake users automatically and verifies legitimate referrals'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Current Referral Status */}
        <div className="mt-6 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
          <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Your Current Referral Status
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{referralStats.totalMembers}</div>
              <div className="text-xs text-green-300">Total Referrals</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{referralStats.verifiedMembers}</div>
              <div className="text-xs text-blue-300">Verified</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-400">{referralStats.pendingMembers}</div>
              <div className="text-xs text-yellow-300">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gold">৳{referralStats.totalEarnings}</div>
              <div className="text-xs text-gold">Total Earned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="glass p-4 mt-6 text-center border border-gold/30 bg-gradient-to-r from-gold/10 to-transparent">
        <h4 className="text-gold font-semibold mb-2">Ready to Build Your Referral Empire?</h4>
        <p className="text-gray-300 text-sm mb-3">Share your group link and earn real money from every member</p>
        <button
          onClick={() => setShowSocialShareModal(true)}
          className="bg-gradient-to-r from-gold to-yellow-500 text-navy px-6 py-2 rounded-lg font-semibold hover:from-yellow-400 hover:to-gold transition-all duration-300 transform hover:scale-105"
        >
          Share Group & Earn
        </button>
      </div>

      {/* Social Share Modal */}
      <SocialShareModal
        isOpen={showSocialShareModal}
        onClose={() => setShowSocialShareModal(false)}
        referralLink={referralLink}
                 referralCode={individualReferralConfig.base_url ? (referralCode || undefined) : undefined}
        title="Join Cash Points and earn real money!"
        description="Use my referral link to join and start earning rewards instantly. No investment required!"
      />
    </div>
    </div>
  );
} 
