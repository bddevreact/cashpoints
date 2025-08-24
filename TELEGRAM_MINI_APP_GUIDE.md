# 🚀 টেলিগ্রাম মিনি অ্যাপ গাইড - BT Community

## 📱 **টেলিগ্রাম মিনি অ্যাপ কীভাবে কাজ করে**

### **মূল ধারণা**
এই অ্যাপটি টেলিগ্রাম মিনি অ্যাপ হিসেবে কাজ করে, যেখানে:
- ইউজার টেলিগ্রাম থেকে অ্যাপ খোলে
- টেলিগ্রাম ইউজার ডেটা অটোমেটিক লোড হয়
- ডেটাবেসে ইউজার ইনফরমেশন সেভ হয়
- রিয়েল-টাইম আপডেট এবং নোটিফিকেশন

## 🔧 **টেকনিক্যাল সেটআপ**

### **1. টেলিগ্রাম WebApp API ইন্টিগ্রেশন**
```typescript
// src/types/telegram.d.ts
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready(): void;           // অ্যাপ প্রস্তুত
        expand(): void;          // ফুল স্ক্রিন
        close(): void;           // অ্যাপ বন্ধ
        initDataUnsafe: {
          user?: {
            id: number;          // টেলিগ্রাম ইউজার ID
            first_name: string;  // প্রথম নাম
            last_name?: string;  // শেষ নাম
            username?: string;   // ইউজারনেম
            photo_url?: string;  // প্রোফাইল ছবি
          };
        };
        MainButton: {
          text: string;
          show(): void;
          hide(): void;
          onClick(callback: () => void): void;
        };
      };
    };
  }
}
```

### **2. অ্যাপ ইনিশিয়ালাইজেশন**
```typescript
// src/App.tsx
useEffect(() => {
  if (window.Telegram && window.Telegram.WebApp) {
    try {
      // টেলিগ্রাম WebApp প্রস্তুত
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      
      // ইউজার ডেটা লোড
      const user = window.Telegram.WebApp.initDataUnsafe?.user;
      if (user) {
        setUser({
          name: user.first_name,
          photoUrl: user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
        });
        loadUserData(user.id.toString());
      }
    } catch (error) {
      console.warn('Telegram WebApp API error:', error);
      handleDemoMode();
    }
  }
}, []);
```

### **3. টেলিগ্রাম ইউজার ID হেডার**
```typescript
// src/lib/supabase.ts
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'X-Telegram-User-Id': window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || ''
    }
  }
});
```

## 🗄️ **ডেটাবেস ইন্টিগ্রেশন**

### **ইউজার টেবিল স্ট্রাকচার**
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id text UNIQUE NOT NULL,        -- টেলিগ্রাম ইউজার ID
  username text,
  first_name text,
  last_name text,
  photo_url text,
  balance numeric DEFAULT 0,
  energy integer DEFAULT 100,
  level integer DEFAULT 1,
  experience_points integer DEFAULT 0,
  referral_code text UNIQUE,
  referred_by text REFERENCES users(telegram_id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### **রোল-বেসড সিকিউরিটি (RLS)**
```sql
-- ইউজার শুধু নিজের ডেটা দেখতে পারবে
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (telegram_id = get_telegram_user_id());

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (telegram_id = get_telegram_user_id());
```

## 📊 **মূল ফিচারগুলো**

### **1. হোম পেজ**
- ইউজার ব্যালেন্স এবং স্ট্যাটস
- রিয়েল-টাইম আপডেট
- টেলিগ্রাম প্রোফাইল ইনফরমেশন

### **2. টাস্ক সিস্টেম**
- ডেইলি চেক-ইন
- রেফারেল টাস্ক
- এক্সপেরিয়েন্স পয়েন্ট

### **3. রেফারেল সিস্টেম**
- মাল্টি-লেভেল রেফারেল
- রেফারেল কোড জেনারেশন
- কমিশন ক্যালকুলেশন

### **4. ওয়ালেট সিস্টেম**
- ব্যালেন্স ট্র্যাকিং
- উইথড্রল রিকোয়েস্ট
- ট্রানজেকশন হিস্টরি

## 🚀 **ডেপ্লয়মেন্ট স্টেপস**

### **1. টেলিগ্রাম বট সেটআপ**
```bash
# @BotFather এ নতুন বট তৈরি করুন
# /newbot কমান্ড ব্যবহার করুন
# বট নাম এবং ইউজারনেম দিন
# API টোকেন কপি করুন
```

### **2. মিনি অ্যাপ কনফিগারেশন**
```bash
# @BotFather এ /setmenubutton কমান্ড
# বট সিলেক্ট করুন
# মেনু টেক্সট দিন: "BT Community"
# URL দিন: আপনার অ্যাপের URL
```

### **3. ওয়েব অ্যাপ সেটআপ**
```bash
# @BotFather এ /newapp কমান্ড
# বট সিলেক্ট করুন
# অ্যাপ নাম দিন: "BT Community"
# শর্ট ডিসক্রিপশন দিন
# ফটো আপলোড করুন
```

### **4. ডোমেইন কনফিগারেশন**
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none'
    }
  }
});
```

## 🔐 **সিকিউরিটি ফিচার**

### **1. টেলিগ্রাম ভেরিফিকেশন**
- `initData` হ্যাশ ভেরিফিকেশন
- ইউজার ID ভ্যালিডেশন
- সেশন ম্যানেজমেন্ট

### **2. ডেটাবেস সিকিউরিটি**
- Row Level Security (RLS)
- ইউজার-বেসড ডেটা অ্যাক্সেস
- SQL ইনজেকশন প্রিভেনশন

### **3. API সিকিউরিটি**
- টেলিগ্রাম ইউজার ID হেডার
- রেট লিমিটিং
- CORS কনফিগারেশন

## 📱 **ইউজার এক্সপেরিয়েন্স**

### **1. স্মুথ ইন্টিগ্রেশন**
- টেলিগ্রাম থেকে সিম্পল লগইন
- প্রোফাইল অটো-লোড
- সেশন পারসিস্টেন্স

### **2. রিয়েল-টাইম ফিচার**
- লাইভ ব্যালেন্স আপডেট
- ইনস্ট্যান্ট নোটিফিকেশন
- অ্যাক্টিভিটি ফিড

### **3. মোবাইল অপটিমাইজেশন**
- রেসপনসিভ ডিজাইন
- টাচ-ফ্রেন্ডলি UI
- ফাস্ট লোডিং

## 🛠️ **ডেভেলপমেন্ট টিপস**

### **1. টেস্টিং**
```typescript
// ডেমো মোড ফর ডেভেলপমেন্ট
const handleDemoMode = () => {
  setIsDemoMode(true);
  setUser({
    name: 'Demo User',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo'
  });
  loadUserData('demo_user_123');
};
```

### **2. এরর হ্যান্ডলিং**
```typescript
try {
  // টেলিগ্রাম API কল
} catch (error) {
  console.warn('Telegram WebApp API error:', error);
  // ফ্যালব্যাক মোড
  handleDemoMode();
}
```

### **3. পারফরম্যান্স অপটিমাইজেশন**
- লেজি লোডিং
- ইমেজ অপটিমাইজেশন
- ক্যাশিং স্ট্র্যাটেজি

## 📈 **মনিটরিং এবং অ্যানালিটিক্স**

### **1. ইউজার অ্যাক্টিভিটি**
- লগইন টাইম
- ফিচার ব্যবহার
- সেশন ডুরেশন

### **2. পারফরম্যান্স মেট্রিক্স**
- লোডিং টাইম
- API রেসপন্স টাইম
- এরর রেট

### **3. বিজনেস মেট্রিক্স**
- ইউজার রিটেনশন
- রেফারেল কনভার্শন
- রেভিনিউ ট্র্যাকিং

## 🔮 **ভবিষ্যত আপডেট**

### **1. নতুন ফিচার**
- গ্রুপ চ্যালেঞ্জ
- লিডারবোর্ড
- অ্যাচিভমেন্ট সিস্টেম

### **2. ইন্টিগ্রেশন**
- ক্রিপ্টো ওয়ালেট
- সোশ্যাল ফিচার
- পেমেন্ট গেটওয়ে

### **3. স্কেলেবিলিটি**
- মাইক্রোসার্ভিস আর্কিটেকচার
- লোড ব্যালেন্সিং
- CDN অপটিমাইজেশন

---

## 📞 **সাপোর্ট**

যদি কোন সমস্যা হয় বা সাহায্য লাগে:
- টেকনিক্যাল ইস্যু: GitHub Issues
- জেনারেল প্রশ্ন: টেলিগ্রাম গ্রুপ
- এমারজেন্সি: অ্যাডমিন কন্টাক্ট

**টেলিগ্রাম মিনি অ্যাপ সাকসেসফুলি ডেপ্লয় করুন! 🎉** 