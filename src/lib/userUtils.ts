import { supabase } from './supabase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Check if user exists in Supabase
export const checkUserExists = async (telegramId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('telegram_id')
      .eq('telegram_id', telegramId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking user existence:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
};

// Check if user exists in Firebase
export const checkFirebaseUserExists = async (telegramId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', telegramId));
    return userDoc.exists();
  } catch (error) {
    console.error('Error checking Firebase user existence:', error);
    return false;
  }
};

// Safe user creation with duplicate check
export const safeCreateUser = async (userData: any, useFirebase: boolean = false): Promise<boolean> => {
  try {
    const telegramId = userData.telegram_id;
    if (!telegramId) {
      console.error('No telegram_id provided for user creation');
      return false;
    }

    // Check if user already exists
    const userExists = useFirebase 
      ? await checkFirebaseUserExists(telegramId)
      : await checkUserExists(telegramId);

    if (userExists) {
      console.log(`User ${telegramId} already exists. Skipping creation.`);
      return true; // User exists, consider it successful
    }

    // Create new user
    if (useFirebase) {
      // Firebase creation logic would be handled by the store
      console.log(`Creating new Firebase user ${telegramId}`);
    } else {
      // Supabase creation
      const { error } = await supabase
        .from('users')
        .insert([userData]);

      if (error) {
        console.error('Error creating user in Supabase:', error);
        return false;
      }
    }

    console.log(`Successfully created user ${telegramId}`);
    return true;
  } catch (error) {
    console.error('Error in safeCreateUser:', error);
    return false;
  }
};

// Get user by telegram ID with error handling
export const getUserByTelegramId = async (telegramId: string, useFirebase: boolean = false): Promise<any | null> => {
  try {
    if (useFirebase) {
      const userDoc = await getDoc(doc(db, 'users', telegramId));
      return userDoc.exists() ? userDoc.data() : null;
    } else {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();

      if (error) {
        console.error('Error getting user from Supabase:', error);
        return null;
      }

      return data;
    }
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};
