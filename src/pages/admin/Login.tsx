import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Shield, Settings, CheckCircle } from 'lucide-react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { motion } from 'framer-motion';

export default function AdminLogin() {
  const { getAdminCredentials, adminLogin, user, isAdmin } = useAdminAuth();
  const [email, setEmail] = useState(() => getAdminCredentials().email);
  const [password, setPassword] = useState(() => getAdminCredentials().password);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Auto-redirect if already admin
  useEffect(() => {
    console.log('🔐 Login useEffect:', { isAdmin, user: user?.email });
    if (isAdmin && user) {
      console.log('✅ Redirecting to dashboard');
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAdmin, user, navigate]);

  // Additional redirect effect for successful login
  useEffect(() => {
    if (success && user && isAdmin) {
      console.log('✅ Success + Admin, redirecting to dashboard');
      navigate('/admin/dashboard', { replace: true });
    }
  }, [success, user, isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Use custom credentials for login
      const success = await adminLogin(email, password);

      if (success) {
        // Show success message
        setSuccess(true);
        console.log('✅ Login successful, showing success message');
        
        // Redirect after 2 seconds to show the success message and ensure state is updated
        setTimeout(() => {
          console.log('🔄 Redirecting to dashboard after timeout');
          navigate('/admin/dashboard', { replace: true });
        }, 2000);
      } else {
        throw new Error('Invalid email or password');
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy to-gray-900 text-white flex items-center justify-center p-4">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gold/10 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-96 bg-gradient-to-t from-brown/10 to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCAyMCAwIE0gMCAwIEwgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjE1LCAwLCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo and Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-20 h-20 bg-gradient-to-r from-gold to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-navy" />
          </div>
          <motion.h2 
            className="text-3xl font-bold text-white mb-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Cash Points
          </motion.h2>
          <motion.p 
            className="text-xl font-semibold text-gold mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Admin Access
          </motion.p>
          <motion.p 
            className="text-gray-400"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Sign in to manage the platform
          </motion.p>
        </motion.div>

        {/* Earn Real Money Banner */}
        <motion.div 
          className="glass p-4 mb-8 border border-green-500/30 bg-gradient-to-r from-green-500/10 to-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="text-center">
            <motion.div 
              className="text-2xl mb-2"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 1.0, type: "spring" }}
            >
              💰
            </motion.div>
            <motion.h3 
              className="text-sm font-semibold text-green-400 mb-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              Admin Control Center
            </motion.h3>
            <motion.p 
              className="text-xs text-gray-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.4 }}
            >
              Manage users, referrals, and real money earnings
            </motion.p>
          </div>
        </motion.div>

        {/* Success Message */}
        {success && (
          <motion.div 
            className="glass p-4 mb-6 border border-green-500/30 bg-gradient-to-r from-green-500/10 to-transparent"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center">
              <motion.div 
                className="text-3xl mb-3"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
              >
                🎉
              </motion.div>
              <motion.h3 
                className="text-lg font-semibold text-green-400 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                Login Successful!
              </motion.h3>
              <motion.p 
                className="text-sm text-gray-300 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                Redirecting to Admin Dashboard...
              </motion.p>
              
              {/* Manual Redirect Button */}
              <motion.button
                onClick={() => navigate('/admin/dashboard')}
                className="bg-gradient-to-r from-gold to-yellow-500 text-navy px-6 py-2 rounded-lg font-semibold hover:scale-105 transition-all duration-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                Go to Dashboard Now
              </motion.button>
              
              <motion.div 
                className="mt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.0 }}
              >
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto animate-pulse" />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Login Form */}
        {!success && (
          <motion.form 
            onSubmit={handleLogin} 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full glass border border-white/10 rounded-lg py-3 px-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-300"
                  placeholder="Enter admin email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass border border-white/10 rounded-lg py-3 px-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-300"
                  placeholder="Enter admin password"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                className="glass border border-red-500/30 bg-red-500/10 rounded-lg p-4 text-red-400 text-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className={`w-full glass border border-gold/30 bg-gradient-to-r from-gold to-yellow-500 text-navy rounded-lg py-3 font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-gold/20 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>Access Admin Panel</span>
                </div>
              )}
            </motion.button>
          </motion.form>
        )}

        {/* Admin Credentials Info */}
        {!success && (
          <motion.div 
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.5 }}
          >
            <div className="glass border border-gold/30 bg-gradient-to-r from-gold/10 to-transparent rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-gold mb-2">🔐 Current Admin Credentials</h3>
              <div className="text-xs text-gray-300 space-y-1">
                <p><strong>Email:</strong> {getAdminCredentials().email}</p>
                <p><strong>Password:</strong> {"*".repeat(getAdminCredentials().password.length)}</p>
              </div>
              <p className="text-xs text-gold mt-2">
                💡 You can change these from Admin Settings
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Shield className="w-4 h-4" />
              <span>Firebase Authentication</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
