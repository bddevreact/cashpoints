import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Save, 
  Eye, 
  EyeOff,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  LogOut
} from 'lucide-react';
import { useAdminAuth } from '../../hooks/useAdminAuth';

export default function AdminSettings() {
  const navigate = useNavigate();
  const { 
    user, 
    updateAdminCredentials, 
    getAdminCredentials, 
    sessionExpiry,
    loading,
    error,
    logout
  } = useAdminAuth();

  const [email, setEmail] = useState(() => getAdminCredentials().email);
  const [password, setPassword] = useState(() => getAdminCredentials().password);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setSuccess(false);
    setIsUpdating(true);

    // Validation
    if (!email || !password) {
      setValidationError('Email and password are required');
      setIsUpdating(false);
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      setIsUpdating(false);
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      setIsUpdating(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address');
      setIsUpdating(false);
      return;
    }

    try {
      const result = await updateAdminCredentials(email, password);
      if (result) {
        setSuccess(true);
        setConfirmPassword('');
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🔐 Admin logout initiated from Settings');
      await logout();
      console.log('✅ Admin logout successful, redirecting to login');
      navigate('/admin', { replace: true });
    } catch (error) {
      console.error('❌ Logout failed:', error);
      navigate('/admin', { replace: true });
    }
  };

  const formatSessionExpiry = () => {
    if (!sessionExpiry) return 'No active session';
    const expiryDate = new Date(sessionExpiry);
    const now = new Date();
    const hoursLeft = Math.ceil((sessionExpiry - now.getTime()) / (1000 * 60 * 60));
    return `${expiryDate.toLocaleString()} (${hoursLeft}h left)`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy to-gray-900 text-white p-6">
        {/* Header */}
      <motion.div 
        className="max-w-4xl mx-auto mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-gold to-yellow-500 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-navy" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Settings</h1>
              <p className="text-gray-400">Manage your admin account credentials</p>
            </div>
        </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 px-4 py-2 glass border border-white/10 rounded-lg text-gray-300 hover:text-white hover:border-gold/30 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 glass border border-red-500/30 bg-red-500/10 rounded-lg text-red-400 hover:text-red-300 hover:border-red-400/50 transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Form */}
              <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="glass border border-white/10 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-gold" />
              <h2 className="text-2xl font-bold text-white">Security Settings</h2>
                </div>

            {/* Success Message */}
            {success && (
              <motion.div 
                className="glass border border-green-500/30 bg-gradient-to-r from-green-500/10 to-transparent rounded-lg p-4 mb-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <h3 className="font-semibold text-green-400">Credentials Updated!</h3>
                    <p className="text-sm text-gray-300">Your admin credentials have been successfully updated.</p>
                            </div>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {(validationError || error) && (
              <motion.div
                className="glass border border-red-500/30 bg-gradient-to-r from-red-500/10 to-transparent rounded-lg p-4 mb-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <div>
                    <h3 className="font-semibold text-red-400">Error</h3>
                    <p className="text-sm text-gray-300">{validationError || error}</p>
                            </div>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleUpdateCredentials} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Admin Email Address
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
                <p className="text-xs text-gray-400 mt-1">This will be your new login email</p>
              </div>

              {/* Password Field */}
                <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full glass border border-white/10 rounded-lg py-3 px-10 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-300"
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gold transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
                  </div>

              {/* Confirm Password Field */}
                  <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full glass border border-white/10 rounded-lg py-3 px-10 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-300"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gold transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Update Button */}
              <motion.button
                type="submit"
                disabled={isUpdating || loading}
                className={`w-full glass border border-gold/30 bg-gradient-to-r from-gold to-yellow-500 text-navy rounded-lg py-3 font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-gold/20 ${
                  (isUpdating || loading) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                whileHover={!(isUpdating || loading) ? { scale: 1.02 } : {}}
                whileTap={!(isUpdating || loading) ? { scale: 0.98 } : {}}
              >
                {isUpdating ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
                    <span>Updating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" />
                    <span>Update Credentials</span>
                  </div>
                )}
              </motion.button>
            </form>
                </div>
        </motion.div>

        {/* Info Panel */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {/* Current User Info */}
          <div className="glass border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gold" />
              Current Admin
            </h3>
            <div className="space-y-3">
                  <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white font-medium">{user?.email || 'Not logged in'}</p>
                  </div>
                  <div>
                <p className="text-sm text-gray-400">Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <p className="text-green-400 font-medium">Active</p>
                </div>
              </div>
            </div>
                </div>

          {/* Session Info */}
          <div className="glass border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold" />
              Session Info
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Session Expires</p>
                <p className="text-white text-sm">{formatSessionExpiry()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Auto-Logout</p>
                <p className="text-white text-sm">24 hours after login</p>
                </div>
            </div>
          </div>

          {/* Security Tips */}
          <div className="glass border border-gold/30 bg-gradient-to-r from-gold/10 to-transparent rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                <span>Use a strong, unique password</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                <span>Don't share your credentials</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                <span>Log out when finished</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                <span>Sessions expire after 24 hours</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 
