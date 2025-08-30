import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Gift, Settings, LogOut, DollarSign, Target, Zap, Activity, Clock, AlertCircle, CheckCircle, XCircle, Eye, UserX, Trash2, X } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, getDocs, where, doc, updateDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAdminAuth } from '../../hooks/useAdminAuth';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalBalance: number;
  totalReferrals: number;
  totalPayments: number;
  pendingPayments: number;
  withdrawalRequests: number;
  pendingWithdrawals: number;
  tradingReferrals: number;
  pendingTradingReferrals: number;
}

interface FirebaseUser {
  id: string;
  first_name?: string;
  username?: string;
  last_active?: string | { seconds: number };
  created_at?: string | { seconds: number };
  balance?: number;
  is_active?: boolean;
  telegram_id?: number;
  total_referrals?: number;
  level?: number;
  [key: string]: any;
}

interface FirebaseTask {
  id: string;
  reward_amount?: number;
  verified?: boolean;
  [key: string]: any;
}

interface FirebaseWithdrawal {
  id: string;
  status?: string;
  [key: string]: any;
}

export default function AdminDashboard() {
  const { logout } = useAdminAuth();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalBalance: 0,
    totalReferrals: 0,
    totalPayments: 0,
    pendingPayments: 0,
    withdrawalRequests: 0,
    pendingWithdrawals: 0,
    tradingReferrals: 0,
    pendingTradingReferrals: 0
  });
  const [recentUsers, setRecentUsers] = useState<FirebaseUser[]>([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState<any[]>([]);
  const [recentTradingReferrals, setRecentTradingReferrals] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<FirebaseUser | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
    loadRecentUsers();
    loadRecentWithdrawals();
    loadRecentTradingReferrals();
  }, []);

  const loadStats = async () => {
    try {
      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FirebaseUser[];

      // Load referrals
      const referralsSnapshot = await getDocs(collection(db, 'referrals'));
      const referrals = referralsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Load withdrawal requests
      const withdrawalsSnapshot = await getDocs(collection(db, 'withdrawal_requests'));
      const withdrawals = withdrawalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FirebaseWithdrawal[];

      // Load trading platform referrals
      const tradingReferralsSnapshot = await getDocs(collection(db, 'trading_platform_referrals'));
      const tradingReferrals = tradingReferralsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FirebaseWithdrawal[];

      // Load task completions for payment calculations
      const taskCompletionsSnapshot = await getDocs(collection(db, 'task_completions'));
      const taskCompletions = taskCompletionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FirebaseTask[];

      setStats({
        totalUsers: users.length,
        activeUsers: users.filter(u => u.last_active && u.last_active > new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).length,
        totalBalance: users.reduce((sum, user) => sum + (user.balance || 0), 0),
        totalReferrals: referrals.length,
        totalPayments: taskCompletions.reduce((sum, task) => sum + (task.reward_amount || 0), 0),
        pendingPayments: taskCompletions.filter(t => !t.verified).reduce((sum, task) => sum + (task.reward_amount || 0), 0),
        withdrawalRequests: withdrawals.length,
        pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
        tradingReferrals: tradingReferrals.length,
        pendingTradingReferrals: tradingReferrals.filter(t => t.status === 'pending').length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentUsers = async () => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('created_at', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(usersQuery);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentUsers(data);
    } catch (error) {
      console.error('Error loading recent users:', error);
    }
  };

  const loadRecentWithdrawals = async () => {
    try {
      const withdrawalsQuery = query(
        collection(db, 'withdrawal_requests'),
        orderBy('created_at', 'desc'),
        limit(5)
      );
      const withdrawalsSnapshot = await getDocs(withdrawalsQuery);
      const withdrawals = withdrawalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Load user data for each withdrawal
      const withdrawalsWithUsers = await Promise.all(
        withdrawals.map(async (withdrawal: any) => {
          if (withdrawal.user_id) {
            const userDoc = await getDoc(doc(db, 'users', withdrawal.user_id));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                ...withdrawal,
                user: {
                  first_name: userData.first_name,
                  username: userData.username
                }
              };
            }
          }
          return withdrawal;
        })
      );
      
      setRecentWithdrawals(withdrawalsWithUsers);
    } catch (error) {
      console.error('Error loading recent withdrawals:', error);
    }
  };

  const loadRecentTradingReferrals = async () => {
    try {
      const tradingQuery = query(
        collection(db, 'trading_platform_referrals'),
        orderBy('created_at', 'desc'),
        limit(5)
      );
      const tradingSnapshot = await getDocs(tradingQuery);
      const tradingReferrals = tradingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Load user data for each trading referral
      const tradingWithUsers = await Promise.all(
        tradingReferrals.map(async (referral: any) => {
          if (referral.user_id) {
            const userDoc = await getDoc(doc(db, 'users', referral.user_id));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                ...referral,
                user: {
                  first_name: userData.first_name,
                  username: userData.username
                }
              };
            }
          }
          return referral;
        })
      );
      
      setRecentTradingReferrals(tradingWithUsers);
    } catch (error) {
      console.error('Error loading recent trading referrals:', error);
    }
  };

  // User Management Functions
  const handleUserDetails = (user: FirebaseUser) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleBanUser = (user: FirebaseUser) => {
    setSelectedUser(user);
    setShowBanConfirm(true);
  };

  const handleDeleteUser = (user: FirebaseUser) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const confirmBanUser = async () => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(true);
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        is_active: false,
        banned_at: serverTimestamp(),
        banned_reason: 'Banned by admin'
      });
      
      console.log('✅ User banned successfully:', selectedUser.first_name);
      setShowBanConfirm(false);
      setSelectedUser(null);
      loadRecentUsers(); // Reload users
      loadStats(); // Reload stats
    } catch (error) {
      console.error('❌ Error banning user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(true);
      await deleteDoc(doc(db, 'users', selectedUser.id));
      
      console.log('✅ User deleted successfully:', selectedUser.first_name);
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      loadRecentUsers(); // Reload users
      loadStats(); // Reload stats
    } catch (error) {
      console.error('❌ Error deleting user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🔐 Admin logout initiated');
      await logout(); // Call the logout function from useAdminAuth
      console.log('✅ Admin logout successful, redirecting to login');
      navigate('/admin', { replace: true });
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Even if logout fails, redirect to login page
      navigate('/admin', { replace: true });
    }
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-IN')}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy to-gray-900 text-white">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-800/90 backdrop-blur-sm border-r border-white/10 p-4">
        <div className="flex items-center mb-8">
          <div className="w-10 h-10 bg-gradient-to-r from-gold to-yellow-500 rounded-full flex items-center justify-center mr-3">
            <Settings className="w-6 h-6 text-navy" />
          </div>
          <motion.h1 
            className="text-xl font-bold text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            Cash Points
          </motion.h1>
        </div>

        <nav className="space-y-2">
          <button className="w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-gold to-yellow-500 rounded-lg shadow-lg">
            <TrendingUp className="w-5 h-5 mr-3" />
            Dashboard
          </button>
          <button 
            onClick={() => navigate('/admin/users')}
            className="w-full flex items-center px-4 py-3 text-gray-400 hover:bg-gray-700/50 hover:text-white rounded-lg transition-all duration-300"
          >
            <Users className="w-5 h-5 mr-3" />
            Users
          </button>
          <button 
            onClick={() => navigate('/admin/referrals')}
            className="w-full flex items-center px-4 py-3 text-gray-400 hover:bg-gray-700/50 hover:text-white rounded-lg transition-all duration-300"
          >
            <Target className="w-5 h-5 mr-3" />
            Referrals
          </button>
          <button 
            onClick={() => navigate('/admin/tasks')}
            className="w-full flex items-center px-4 py-3 text-gray-400 hover:bg-gray-700/50 hover:text-white rounded-lg transition-all duration-300"
          >
            <Gift className="w-5 h-5 mr-3" />
            Tasks
          </button>
          <button 
            onClick={() => navigate('/admin/withdrawals')}
            className="w-full flex items-center px-4 py-3 text-gray-400 hover:bg-gray-700/50 hover:text-white rounded-lg transition-all duration-300"
          >
            <DollarSign className="w-5 h-5 mr-3" />
            Withdrawals
          </button>
          <button 
            onClick={() => navigate('/admin/trading-referrals')}
            className="w-full flex items-center px-4 py-3 text-gray-400 hover:bg-gray-700/50 hover:text-white rounded-lg transition-all duration-300"
          >
            <TrendingUp className="w-5 h-5 mr-3" />
            Trading Referrals
          </button>
          <button 
            onClick={() => navigate('/admin/settings')}
            className="w-full flex items-center px-4 py-3 text-gray-400 hover:bg-gray-700/50 hover:text-white rounded-lg transition-all duration-300"
          >
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </button>
        </nav>

        <button
          onClick={handleLogout}
          className="absolute bottom-4 left-4 right-4 flex items-center justify-center px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Animated Header */}
        <div className="mb-8">
          <motion.h1 
            className="text-3xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Admin Dashboard
          </motion.h1>
          <motion.p 
            className="text-gray-400 text-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Complete control over BT Community platform and real money earnings
          </motion.p>
        </div>

        {/* Earn Real Money Banner */}
        <motion.div 
          className="glass p-6 mb-8 border border-green-500/30 bg-gradient-to-r from-green-500/10 to-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="text-center">
            <motion.div 
              className="text-4xl mb-3"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5, type: "spring" }}
            >
              💰
            </motion.div>
            <motion.h3 
              className="text-xl font-semibold text-green-400 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              Admin Control Center
            </motion.h3>
            <motion.p 
              className="text-gray-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              Monitor and manage the BT Community platform where users earn real money in BDT
            </motion.p>
          </div>
        </motion.div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div 
            className="glass p-6 border border-white/10 rounded-xl hover:border-gold/30 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-gray-400">Total Users</span>
            </div>
            <div className="text-3xl font-bold text-white">{formatNumber(stats.totalUsers)}</div>
            <div className="mt-2 text-sm text-gray-400">
              {formatNumber(stats.activeUsers)} active today
            </div>
          </motion.div>

          <motion.div 
            className="glass p-6 border border-white/10 rounded-xl hover:border-gold/30 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-gray-400">Total Balance</span>
            </div>
            <div className="text-3xl font-bold text-white">{formatCurrency(stats.totalBalance)}</div>
            <div className="mt-2 text-sm text-gray-400">User Balances</div>
          </motion.div>

          <motion.div 
            className="glass p-6 border border-white/10 rounded-xl hover:border-gold/30 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-gold to-yellow-500 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-navy" />
              </div>
              <span className="text-xs text-gray-400">Total Referrals</span>
            </div>
            <div className="text-3xl font-bold text-white">{formatNumber(stats.totalReferrals)}</div>
            <div className="mt-2 text-sm text-gray-400">Successful Referrals</div>
          </motion.div>

          <motion.div 
            className="glass p-6 border border-white/10 rounded-xl hover:border-gold/30 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-gray-400">System Status</span>
            </div>
            <div className="text-3xl font-bold text-white">Active</div>
            <div className="mt-2 text-sm text-green-500">All systems operational</div>
          </motion.div>
        </div>

        {/* Database Test Section */}
        <motion.div 
          className="glass p-6 border border-white/10 rounded-xl mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <h3 className="text-xl font-bold text-white mb-4">Database Connection Test</h3>
          <div className="flex gap-4">
            <button
              onClick={async () => {
                try {
                  console.log('Testing database connection...');
                  const taskTemplatesSnapshot = await getDocs(collection(db, 'task_templates'));
                  const data = taskTemplatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                  
                  if (data.length > 0) {
                    console.log('Database test successful:', data);
                    alert('Database connection successful!');
                  } else {
                    console.log('Database test successful - no data found');
                    alert('Database connection successful!');
                  }
                } catch (err) {
                  console.error('Database test error:', err);
                  alert('Database test error: ' + (err as Error).message);
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:scale-105 transition-all duration-300"
            >
              Test Database Connection
            </button>
            
            <button
              onClick={async () => {
                try {
                  console.log('Testing task_templates table...');
                  const taskTemplatesSnapshot = await getDocs(collection(db, 'task_templates'));
                  const data = taskTemplatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                  
                  console.log('Task templates test successful:', data);
                  alert(`Task templates test successful! Found ${data?.length || 0} templates.`);
                } catch (err) {
                  console.error('Task templates test error:', err);
                  alert('Task templates test error: ' + (err as Error).message);
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:scale-105 transition-all duration-300"
            >
              Test Task Templates
            </button>
          </div>
        </motion.div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div 
            className="glass p-6 border border-white/10 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-gray-400">Total Payments</span>
            </div>
            <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalPayments)}</div>
            <div className="mt-2 text-sm text-gray-400">All time rewards</div>
          </motion.div>

          <motion.div 
            className="glass p-6 border border-white/10 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-gray-400">Pending Payments</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">{formatCurrency(stats.pendingPayments)}</div>
            <div className="mt-2 text-sm text-gray-400">Awaiting verification</div>
          </motion.div>

          <motion.div 
            className="glass p-6 border border-white/10 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-gray-400">Pending Withdrawals</span>
            </div>
            <div className="text-2xl font-bold text-red-400">{stats.pendingWithdrawals}</div>
            <div className="mt-2 text-sm text-gray-400">Need approval</div>
          </motion.div>
        </div>

        {/* Recent Users Management */}
        <motion.div 
          className="glass p-6 border border-white/10 rounded-xl mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-gold" />
              Recent Users
            </h2>
            <button 
              onClick={() => navigate('/admin/users')}
              className="px-4 py-2 bg-gradient-to-r from-gold to-yellow-500 text-navy rounded-lg font-semibold hover:scale-105 transition-all duration-300"
            >
              View All Users
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">User</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Balance</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Joined</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user, index) => (
                  <motion.tr 
                    key={user.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-gold to-yellow-500 rounded-full flex items-center justify-center text-navy font-bold text-sm">
                          {user.first_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="text-white font-medium">{user.first_name || 'Unknown'}</div>
                          <div className="text-gray-400 text-sm">@{user.username || 'no_username'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gold font-semibold">৳{(user.balance || 0).toLocaleString()}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_active !== false 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {user.is_active !== false ? 'Active' : 'Banned'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-400 text-sm">
                        {user.created_at 
                          ? new Date(typeof user.created_at === 'string' ? user.created_at : user.created_at.seconds * 1000).toLocaleDateString() 
                          : 'Unknown'
                        }
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUserDetails(user)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {user.is_active !== false ? (
                          <button
                            onClick={() => handleBanUser(user)}
                            className="p-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg transition-all duration-200"
                            title="Ban User"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            
            {recentUsers.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No users found
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Withdrawals */}
          <motion.div 
            className="glass p-6 border border-white/10 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-6 h-6 text-gold" />
              <h2 className="text-xl font-bold text-white">Recent Withdrawals</h2>
              <span className="ml-auto text-sm text-gray-400">
                {stats.pendingWithdrawals} pending
              </span>
            </div>
            <div className="space-y-4">
              {recentWithdrawals.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No withdrawal requests</p>
              ) : (
                recentWithdrawals.map((withdrawal, index) => (
                  <div key={withdrawal.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">
                          {withdrawal.user?.first_name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-400">
                          {formatCurrency(withdrawal.amount)} • {withdrawal.method}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(withdrawal.status)}
                        <span className={`text-sm ${getStatusColor(withdrawal.status)}`}>
                          {withdrawal.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={() => navigate('/admin/withdrawals')}
              className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-gold to-yellow-500 text-navy rounded-lg font-semibold hover:scale-105 transition-all duration-300"
            >
              View All Withdrawals
            </button>
          </motion.div>

          {/* Recent Trading Referrals */}
          <motion.div 
            className="glass p-6 border border-white/10 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-gold" />
              <h2 className="text-xl font-bold text-white">Trading Referrals</h2>
              <span className="ml-auto text-sm text-gray-400">
                {stats.pendingTradingReferrals} pending
              </span>
            </div>
            <div className="space-y-4">
              {recentTradingReferrals.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No trading referrals</p>
              ) : (
                recentTradingReferrals.map((referral, index) => (
                  <div key={referral.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">
                          {referral.user?.first_name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-400">
                          UID: {referral.trading_uid} • {referral.platform_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(referral.status)}
                        <span className={`text-sm ${getStatusColor(referral.status)}`}>
                          {referral.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={() => navigate('/admin/trading-referrals')}
              className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-gold to-yellow-500 text-navy rounded-lg font-semibold hover:scale-105 transition-all duration-300"
            >
              View All Trading Referrals
            </button>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div 
          className="glass p-6 border border-white/10 rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.3 }}
        >
          <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => navigate('/admin/settings')}
              className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white font-semibold hover:scale-105 transition-all duration-300"
            >
              <Settings className="w-6 h-6 mx-auto mb-2" />
              Payment Settings
            </button>
            <button 
              onClick={() => navigate('/admin/users')}
              className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white font-semibold hover:scale-105 transition-all duration-300"
            >
              <Users className="w-6 h-6 mx-auto mb-2" />
              Manage Users
            </button>
            <button 
              onClick={() => navigate('/admin/tasks')}
              className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white font-semibold hover:scale-105 transition-all duration-300"
            >
              <Gift className="w-6 h-6 mx-auto mb-2" />
              Task Management
            </button>
          </div>
        </motion.div>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            className="glass border border-white/10 rounded-xl p-6 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">User Details</h3>
              <button
                onClick={() => setShowUserDetails(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-gold to-yellow-500 rounded-full flex items-center justify-center text-navy font-bold text-xl">
                  {selectedUser.first_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">{selectedUser.first_name || 'Unknown'}</h4>
                  <p className="text-gray-400">@{selectedUser.username || 'no_username'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Balance</p>
                  <p className="text-gold font-semibold">৳{(selectedUser.balance || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedUser.is_active !== false 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedUser.is_active !== false ? 'Active' : 'Banned'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Referrals</p>
                  <p className="text-white font-medium">{selectedUser.total_referrals || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Level</p>
                  <p className="text-white font-medium">{selectedUser.level || 1}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">Telegram ID</p>
                <p className="text-white font-mono">{selectedUser.telegram_id || 'N/A'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">Joined</p>
                <p className="text-white">
                  {selectedUser.created_at 
                    ? new Date(typeof selectedUser.created_at === 'string' ? selectedUser.created_at : selectedUser.created_at.seconds * 1000).toLocaleDateString()
                    : 'Unknown'
                  }
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">Last Active</p>
                <p className="text-white">
                  {selectedUser.last_active 
                    ? new Date(typeof selectedUser.last_active === 'string' ? selectedUser.last_active : selectedUser.last_active.seconds * 1000).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Ban User Confirmation Modal */}
      {showBanConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            className="glass border border-orange-500/30 bg-orange-500/10 rounded-xl p-6 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-orange-400">Ban User</h3>
              <button
                onClick={() => setShowBanConfirm(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-2">
                Are you sure you want to ban this user?
              </p>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-r from-gold to-yellow-500 rounded-full flex items-center justify-center text-navy font-bold">
                  {selectedUser.first_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-white font-medium">{selectedUser.first_name || 'Unknown'}</p>
                  <p className="text-gray-400 text-sm">@{selectedUser.username || 'no_username'}</p>
                </div>
              </div>
              <p className="text-orange-300 text-sm mt-3">
                This will prevent the user from accessing the platform.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowBanConfirm(false)}
                className="flex-1 px-4 py-2 glass border border-white/10 text-gray-300 rounded-lg hover:text-white hover:border-white/30 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmBanUser}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Banning...' : 'Ban User'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            className="glass border border-red-500/30 bg-red-500/10 rounded-xl p-6 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-400">Delete User</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-2">
                Are you sure you want to permanently delete this user?
              </p>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-r from-gold to-yellow-500 rounded-full flex items-center justify-center text-navy font-bold">
                  {selectedUser.first_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-white font-medium">{selectedUser.first_name || 'Unknown'}</p>
                  <p className="text-gray-400 text-sm">@{selectedUser.username || 'no_username'}</p>
                </div>
              </div>
              <p className="text-red-300 text-sm mt-3">
                ⚠️ This action cannot be undone. All user data will be permanently deleted.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 glass border border-white/10 text-gray-300 rounded-lg hover:text-white hover:border-white/30 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
