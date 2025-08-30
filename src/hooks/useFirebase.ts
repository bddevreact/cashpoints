import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

import type { FirebaseUser } from '../types/firebase';

export interface User extends FirebaseUser {}

export interface ReferralCode {
  user_id: string;
  referral_code: string;
  is_active: boolean;
  created_at: Date;
  total_uses: number;
  total_earnings: number;
}

export interface TaskCompletion {
  user_id: string;
  task_type: string;
  completed_at: Date;
  reward_amount: number;
  task_data?: any;
}

export const useFirebase = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Get user by Telegram ID
  const getUser = async (telegramId: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', telegramId));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  };

  // Create or update user
  const createOrUpdateUser = async (userData: Partial<User>): Promise<boolean> => {
    try {
      const telegramId = userData.telegram_id;
      if (!telegramId) return false;

      // Check if user already exists
      const userDoc = await getDoc(doc(db, 'users', telegramId));
      
      if (userDoc.exists()) {
        console.log(`User ${telegramId} already exists. Updating existing user.`);
        // Update existing user
        await updateDoc(doc(db, 'users', telegramId), {
          ...userData,
          updated_at: new Date()
        });
      } else {
        console.log(`Creating new user ${telegramId}`);
        // Create new user
        await setDoc(doc(db, 'users', telegramId), {
          ...userData,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error creating/updating user:', error);
      return false;
    }
  };

  // Update user balance
  const updateUserBalance = async (telegramId: string, newBalance: number): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'users', telegramId), {
        balance: newBalance,
        updated_at: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error updating user balance:', error);
      return false;
    }
  };

  // Get referral code
  const getReferralCode = async (code: string): Promise<ReferralCode | null> => {
    try {
      const codeDoc = await getDoc(doc(db, 'referralCodes', code));
      if (codeDoc.exists()) {
        return codeDoc.data() as ReferralCode;
      }
      return null;
    } catch (error) {
      console.error('Error getting referral code:', error);
      return null;
    }
  };

  // Create referral code
  const createReferralCode = async (referralData: ReferralCode): Promise<boolean> => {
    try {
      await setDoc(doc(db, 'referralCodes', referralData.referral_code), {
        ...referralData,
        created_at: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error creating referral code:', error);
      return false;
    }
  };

  // Update referral code usage
  const updateReferralCodeUsage = async (code: string, newUses: number, newEarnings: number): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'referralCodes', code), {
        total_uses: newUses,
        total_earnings: newEarnings
      });
      return true;
    } catch (error) {
      console.error('Error updating referral code usage:', error);
      return false;
    }
  };

  // Add task completion
  const addTaskCompletion = async (taskData: TaskCompletion): Promise<boolean> => {
    try {
      await addDoc(collection(db, 'taskCompletions'), {
        ...taskData,
        completed_at: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error adding task completion:', error);
      return false;
    }
  };

  // Get user's task completions
  const getUserTaskCompletions = async (telegramId: string): Promise<TaskCompletion[]> => {
    try {
      const q = query(
        collection(db, 'taskCompletions'),
        where('user_id', '==', telegramId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as TaskCompletion);
    } catch (error) {
      console.error('Error getting user task completions:', error);
      return [];
    }
  };

  // Real-time user listener
  const subscribeToUser = (telegramId: string, callback: (user: User | null) => void) => {
    return onSnapshot(doc(db, 'users', telegramId), (doc) => {
      if (doc.exists()) {
        callback(doc.data() as User);
      } else {
        callback(null);
      }
    });
  };

  // Get all users (for admin)
  const getAllUsers = async (): Promise<User[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  };

  // Get all referral codes (for admin)
  const getAllReferralCodes = async (): Promise<ReferralCode[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, 'referralCodes'));
      return querySnapshot.docs.map(doc => doc.data() as ReferralCode);
    } catch (error) {
      console.error('Error getting all referral codes:', error);
      return [];
    }
  };

  return {
    user,
    loading,
    getUser,
    createOrUpdateUser,
    updateUserBalance,
    getReferralCode,
    createReferralCode,
    updateReferralCodeUsage,
    addTaskCompletion,
    getUserTaskCompletions,
    subscribeToUser,
    getAllUsers,
    getAllReferralCodes
  };
};
