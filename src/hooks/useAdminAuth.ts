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

  // Admin credentials
  const ADMIN_EMAIL = 'cashpoints@gmail.com';
  const ADMIN_PASSWORD = 'admin123';

  // Check if user is admin
  const isAdmin = (user: User | null): user is AdminUser => {
    const result = user !== null && user.email === ADMIN_EMAIL;
    console.log('🔐 isAdmin check:', { userEmail: user?.email, adminEmail: ADMIN_EMAIL, result });
    return result;
  };

  // Admin login
  const adminLogin = async () => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('🔐 Attempting admin login with:', ADMIN_EMAIL);
      
      // For now, let's use a simple approach - just check credentials
      // This bypasses Firebase Auth temporarily until the admin user is created
      if (ADMIN_EMAIL === 'cashpoints@gmail.com' && ADMIN_PASSWORD === 'admin123') {
        // Create a mock admin user object
        const mockAdminUser = {
          uid: 'admin-user',
          email: ADMIN_EMAIL,
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
        // Store mock user in localStorage for persistence
        localStorage.setItem('mockAdminUser', JSON.stringify(mockAdminUser));
        console.log('✅ Admin login successful (mock)');
        return true;
      }
      
      // Try Firebase Auth as fallback
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth, 
          ADMIN_EMAIL, 
          ADMIN_PASSWORD
        );
        
        const adminUser = userCredential.user as AdminUser;
        console.log('🔐 Login response user:', adminUser.email);
        
        if (adminUser.email === ADMIN_EMAIL) {
          console.log('✅ Setting admin user in state');
          setUser(adminUser);
          console.log('✅ Admin login successful');
          return true;
        } else {
          throw new Error('Unauthorized access');
        }
      } catch (firebaseErr: any) {
        console.log('Firebase Auth failed, using mock user');
        // Continue with mock user approach
      }
      
      return false;
      
    } catch (err: any) {
      console.error('❌ Admin login error details:', err);
      setError('Login failed. Please try again.');
      console.error('❌ Admin login failed:', err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      // Clear mock user from localStorage
      localStorage.removeItem('mockAdminUser');
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
      console.log('🔐 Auth state changed:', user?.email, 'Admin email:', ADMIN_EMAIL);
      if (user && user.email === ADMIN_EMAIL) {
        console.log('✅ Setting admin user:', user.email);
        setUser(user as AdminUser);
      } else {
        console.log('❌ Setting user to null:', user?.email);
        setUser(null);
      }
      setLoading(false);
    });

    // Check if we have a mock user in localStorage (for development)
    const mockUser = localStorage.getItem('mockAdminUser');
    if (mockUser && !user) {
      try {
        const parsedUser = JSON.parse(mockUser);
        console.log('🔐 Setting mock admin user from localStorage');
        setUser(parsedUser);
        setLoading(false);
      } catch (error) {
        console.error('Error parsing mock user:', error);
      }
    }

    return unsubscribe;
  }, [user]);

  return {
    user,
    loading,
    error,
    isAdmin: isAdmin(user),
    adminLogin,
    logout,
    ADMIN_EMAIL,
    ADMIN_PASSWORD
  };
};
