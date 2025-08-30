import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AdminUser extends User {
  customClaims?: {
    admin?: boolean;
    role?: string;
    permissions?: string[];
  };
}

export const useAdminAuth = () => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);

  // Admin credentials (these can be changed from admin panel)
  const getAdminCredentials = () => {
    const storedEmail = localStorage.getItem('admin_email');
    const storedPassword = localStorage.getItem('admin_password');
    return {
      email: storedEmail || 'cashpoints@gmail.com',
      password: storedPassword || 'admin123'
    };
  };

  // Check if user is admin
  const isAdmin = (user: User | null): user is AdminUser => {
    const { email: adminEmail } = getAdminCredentials();
    const result = user !== null && user.email === adminEmail;
    console.log('🔐 isAdmin check:', { userEmail: user?.email, adminEmail, result });
    return result;
  };

  // Check session validity
  const isSessionValid = () => {
    const expiry = localStorage.getItem('admin_session_expiry');
    if (!expiry) return false;
    return Date.now() < parseInt(expiry);
  };

  // Create secure session
  const createSession = () => {
    const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    localStorage.setItem('admin_session_expiry', expiryTime.toString());
    localStorage.setItem('admin_session_token', btoa(Date.now().toString()));
    setSessionExpiry(expiryTime);
  };

  // Clear session
  const clearSession = () => {
    localStorage.removeItem('admin_session_expiry');
    localStorage.removeItem('admin_session_token');
    localStorage.removeItem('mockAdminUser');
    setSessionExpiry(null);
  };

  // Admin login with custom credentials
  const adminLogin = async (email?: string, password?: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const { email: adminEmail, password: adminPassword } = getAdminCredentials();
      const loginEmail = email || adminEmail;
      const loginPassword = password || adminPassword;
      
      console.log('🔐 Attempting admin login with:', loginEmail);
      
      // Try Firebase Auth first
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth, 
          loginEmail, 
          loginPassword
        );
        
        const adminUser = userCredential.user as AdminUser;
        console.log('🔐 Firebase login successful:', adminUser.email);
        
        if (adminUser.email === loginEmail) {
          console.log('✅ Setting admin user in state');
          setUser(adminUser);
          createSession(); // Create persistent session
          localStorage.removeItem('mockAdminUser');
          console.log('✅ Admin login successful (Firebase)');
          return true;
        } else {
          throw new Error('Unauthorized access');
        }
      } catch (firebaseErr: any) {
        console.log('Firebase Auth failed, using mock user approach');
        
        // Fallback to mock user for development
        if (loginEmail === adminEmail && loginPassword === adminPassword) {
          const mockAdminUser = {
            uid: 'admin-user',
            email: loginEmail,
            emailVerified: true,
            isAnonymous: false,
            metadata: {},
            providerData: [],
            refreshToken: '',
            tenantId: null,
            delete: () => Promise.resolve(),
            getIdToken: () => Promise.resolve('mock-token'),
            getIdTokenResult: () => Promise.resolve({ claims: { admin: true } }),
            reload: () => Promise.resolve(),
            toJSON: () => ({}),
            displayName: 'Admin User',
            phoneNumber: null,
            photoURL: null,
            providerId: 'password'
          } as unknown as AdminUser;
          
          console.log('✅ Setting mock admin user in state');
          setUser(mockAdminUser);
          createSession(); // Create persistent session
          localStorage.setItem('mockAdminUser', JSON.stringify(mockAdminUser));
          console.log('✅ Admin login successful (mock)');
          return true;
        }
      }
      
      throw new Error('Invalid credentials');
      
    } catch (err: any) {
      console.error('❌ Admin login error details:', err);
      setError('Login failed. Please check your credentials.');
      console.error('❌ Admin login failed:', err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update admin credentials
  const updateAdminCredentials = async (newEmail: string, newPassword: string) => {
    try {
      setError(null);
      setLoading(true);
      
      // Validate inputs
      if (!newEmail || !newPassword) {
        throw new Error('Email and password are required');
      }
      
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      // Store new credentials
      localStorage.setItem('admin_email', newEmail);
      localStorage.setItem('admin_password', newPassword);
      
      // Update current user if logged in
      if (user) {
        const updatedUser = { ...user, email: newEmail };
        setUser(updatedUser);
        localStorage.setItem('mockAdminUser', JSON.stringify(updatedUser));
      }
      
      console.log('✅ Admin credentials updated successfully');
      return true;
      
    } catch (err: any) {
      console.error('❌ Failed to update credentials:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      clearSession(); // Clear persistent session
      setUser(null);
      console.log('✅ Admin logout successful');
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Logout failed:', err.message);
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const { email: adminEmail } = getAdminCredentials();
      console.log('🔐 Auth state changed:', user?.email, 'Admin email:', adminEmail);
      
      if (user && user.email === adminEmail && isSessionValid()) {
        console.log('✅ Setting admin user:', user.email);
        setUser(user as AdminUser);
      } else {
        console.log('❌ Setting user to null:', user?.email);
        if (!isSessionValid()) {
          clearSession();
        }
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []); // Remove user dependency to prevent infinite loop

  // Check for persistent session on mount
  useEffect(() => {
    const checkPersistentLogin = () => {
      if (isSessionValid()) {
        const mockUser = localStorage.getItem('mockAdminUser');
        if (mockUser) {
          try {
            const parsedUser = JSON.parse(mockUser);
            console.log('🔐 Restoring session from localStorage');
            setUser(parsedUser);
            setLoading(false);
            return;
          } catch (error) {
            console.error('Error parsing stored user:', error);
            clearSession();
          }
        }
      } else {
        // Session expired, clear everything
        clearSession();
      }
      setLoading(false);
    };

    checkPersistentLogin();
  }, []); // Run only once on mount

  // Auto-logout when session expires
  useEffect(() => {
    if (!sessionExpiry) return;
    
    const timeUntilExpiry = sessionExpiry - Date.now();
    if (timeUntilExpiry <= 0) {
      logout();
      return;
    }
    
    const timeout = setTimeout(() => {
      console.log('🔐 Session expired, logging out');
      logout();
    }, timeUntilExpiry);
    
    return () => clearTimeout(timeout);
  }, [sessionExpiry]);

  return {
    user,
    loading,
    error,
    isAdmin: isAdmin(user),
    adminLogin,
    logout,
    updateAdminCredentials,
    getAdminCredentials,
    isSessionValid,
    sessionExpiry,
    clearSession
  };
};
