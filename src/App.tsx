import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { config, queryClient } from './lib/wagmi';
import BottomNav from './components/BottomNav';
import LoadingScreen from './components/LoadingScreen';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Referrals from './pages/Referrals';
import Wallet from './pages/Wallet';
import Earnings from './pages/Earnings';
import Leaderboard from './pages/Leaderboard';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminReferrals from './pages/admin/Referrals';
import AdminTasks from './pages/admin/Tasks';
import AdminWithdrawals from './pages/admin/Withdrawals';
import AdminTradingReferrals from './pages/admin/TradingReferrals';
import AdminSettings from './pages/admin/Settings';
import ReferralDebug from './debug/ReferralDebug';
import { useFirebaseUserStore } from './store/firebaseUserStore';

function App() {
  const [loading, setLoading] = useState(true);
  const { loadUserData, setUser } = useFirebaseUserStore();

  // Initialize Telegram Web App and load user data
  useEffect(() => {
    console.log('🚀 App initializing...');
    console.log('📱 Telegram WebApp available:', !!window.Telegram?.WebApp);
    
    // Check if Telegram WebApp API is available
    if (window.Telegram && window.Telegram.WebApp) {
      try {
        console.log('🔧 Initializing Telegram WebApp...');
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        
        // Load user data from Telegram and database
        const user = window.Telegram.WebApp.initDataUnsafe?.user;
        console.log('👤 Telegram user data:', user);
        
        if (user) {
          console.log('✅ User found, loading data for ID:', user.id);
          setUser({
            name: user.first_name,
            photoUrl: user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
          });
          loadUserData(user.id.toString());
        } else {
          // No user data available - redirect to error page or show message
          console.error('❌ No Telegram user data available');
          console.log('🔍 initDataUnsafe:', window.Telegram.WebApp.initDataUnsafe);
          
          // Development mode fallback - use test user data
          if (process.env.NODE_ENV === 'development') {
            console.log('🛠️ Development mode: Using test user data');
            const testUserId = '6873819352'; // Test user from admin dashboard
            setUser({
              name: 'Test User',
              photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${testUserId}`
            });
            loadUserData(testUserId);
          } else {
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('❌ Telegram WebApp API error:', error);
        setLoading(false);
        return;
      }
    } else {
      // Telegram WebApp not available - show error
      console.error('❌ Telegram WebApp API not available');
      console.log('🔍 window.Telegram:', window.Telegram);
      
      // Development mode fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('🛠️ Development mode: Using test user data');
        const testUserId = '6873819352';
        setUser({
          name: 'Test User',
          photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${testUserId}`
        });
        loadUserData(testUserId);
      } else {
        setLoading(false);
        return;
      }
    }
    
    // Set viewport height for mobile
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    // Update on resize
    window.addEventListener('resize', () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    });

    setLoading(false);
  }, [loadUserData, setUser]);

  // Show loading screen while initializing
  if (loading) {
    return <LoadingScreen onComplete={() => {}} />;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="transition-opacity duration-500 opacity-100">
          <Router>
            <Routes>
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/referrals" element={<AdminRoute><AdminReferrals /></AdminRoute>} />
              <Route path="/admin/tasks" element={<AdminRoute><AdminTasks /></AdminRoute>} />
              <Route path="/admin/withdrawals" element={<AdminRoute><AdminWithdrawals /></AdminRoute>} />
              <Route path="/admin/trading-referrals" element={<AdminRoute><AdminTradingReferrals /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

              {/* User Routes */}
              <Route
                path="/*"
                element={
                  <div className="min-h-[calc(var(--vh,1vh)*100)] bg-navy relative overflow-hidden">
                    {/* Background Decorations */}
                    <div className="fixed inset-0 pointer-events-none">
                      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gold/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 w-full h-96 bg-gradient-to-t from-brown/10 to-transparent" />
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCAyMCAwIE0gMCAwIEwgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjE1LCAwLCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/tasks" element={<Tasks />} />
                        <Route path="/referrals" element={<Referrals />} />
                        <Route path="/wallet" element={<Wallet />} />
                        <Route path="/earnings" element={<Earnings />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/debug" element={<ReferralDebug />} />
                      </Routes>
                      <BottomNav />
                    </div>
                  </div>
                }
              />
            </Routes>
          </Router>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
