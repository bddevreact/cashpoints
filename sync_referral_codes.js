// Utility script to sync all existing users' referral codes with referralCodes collection
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, setDoc, getDocs, serverTimestamp } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function syncAllReferralCodes() {
  try {
    console.log('🔄 Starting referral code sync...');
    
    // Get all users from users collection
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let syncedCount = 0;
    let createdCount = 0;
    let errorCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      try {
        const userData = userDoc.data();
        const telegramId = userData.telegram_id;
        const referralCode = userData.referral_code;
        const firstName = userData.first_name || 'Unknown';
        
        if (referralCode) {
          // Check if referral code exists in referralCodes collection
          const referralCodeRef = doc(db, 'referralCodes', referralCode);
          const referralCodeSnap = await getDoc(referralCodeRef);
          
          if (!referralCodeSnap.exists()) {
            // Create missing referral code document
            await setDoc(referralCodeRef, {
              user_id: telegramId,
              referral_code: referralCode,
              is_active: true,
              created_at: serverTimestamp(),
              total_uses: 0,
              total_earnings: 0
            });
            console.log(`✅ Created referral code: ${referralCode} for ${firstName}`);
            createdCount++;
          } else {
            console.log(`⏭️ Referral code already exists: ${referralCode} for ${firstName}`);
            syncedCount++;
          }
        } else {
          console.log(`⚠️ No referral code found for user: ${firstName} (${telegramId})`);
        }
      } catch (error) {
        console.error(`❌ Error processing user ${userDoc.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Referral code sync complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Already synced: ${syncedCount}`);
    console.log(`   - Newly created: ${createdCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`   - Total processed: ${usersSnapshot.docs.length}`);
    
  } catch (error) {
    console.error('❌ Error syncing referral codes:', error);
  }
}

// Run the sync
syncAllReferralCodes();
