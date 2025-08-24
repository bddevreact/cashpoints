# 🤖 টেলিগ্রাম বট সেটআপ গাইড - BT Community

## 📋 **প্রয়োজনীয় স্টেপস**

### **স্টেপ 1: টেলিগ্রাম বট তৈরি**

1. **@BotFather এ যান**
   - টেলিগ্রামে @BotFather খুঁজুন
   - `/start` কমান্ড দিন

2. **নতুন বট তৈরি করুন**
   ```
   /newbot
   ```

3. **বট নাম দিন**
   ```
   BT Community Bot
   ```

4. **বট ইউজারনেম দিন**
   ```
   bt_community_bot
   ```
   *নোট: ইউজারনেম শেষে 'bot' থাকতে হবে*

5. **API টোকেন কপি করুন**
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe
   ```

### **স্টেপ 2: মিনি অ্যাপ কনফিগারেশন**

1. **মেনু বাটন সেট করুন**
   ```
   /setmenubutton
   ```
   - বট সিলেক্ট করুন
   - মেনু টেক্সট: `BT Community`
   - URL: `https://your-domain.com`

2. **ওয়েব অ্যাপ তৈরি করুন**
   ```
   /newapp
   ```
   - বট সিলেক্ট করুন
   - অ্যাপ নাম: `BT Community`
   - শর্ট ডিসক্রিপশন: `Earn money through referrals and tasks`
   - ফটো আপলোড করুন (512x512px)

### **স্টেপ 3: অ্যাপ কনফিগারেশন**

1. **অ্যাপ সেটিংস**
   ```
   /setappname - অ্যাপ নাম পরিবর্তন
   /setappdescription - ডিসক্রিপশন পরিবর্তন
   /setappphoto - ফটো পরিবর্তন
   ```

2. **অ্যাপ ডোমেইন**
   ```
   /setappdomain
   - বট সিলেক্ট করুন
   - ডোমেইন: your-domain.com
   ```

## 🔧 **টেকনিক্যাল কনফিগারেশন**

### **1. CORS সেটিংস**
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opেন-Policy': 'unsafe-none',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Telegram-User-Id'
    }
  }
});
```

### **2. টেলিগ্রাম WebApp স্ক্রিপ্ট**
```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BT Community</title>
    <!-- টেলিগ্রাম WebApp স্ক্রিপ্ট -->
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### **3. এনভায়রনমেন্ট ভেরিয়েবল**
```bash
# .env
VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here
VITE_TELEGRAM_BOT_USERNAME=bt_community_bot
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 **টেস্টিং এবং ভেরিফিকেশন**

### **1. টেলিগ্রামে টেস্ট করুন**
- বটে `/start` কমান্ড দিন
- মেনু বাটনে ক্লিক করুন
- অ্যাপ ওপেন হওয়া চেক করুন

### **2. ডেভেলপার টুলস**
```javascript
// ব্রাউজার কনসোলে টেস্ট
console.log('Telegram WebApp:', window.Telegram?.WebApp);
console.log('User Data:', window.Telegram?.WebApp?.initDataUnsafe?.user);
```

### **3. এরর হ্যান্ডলিং**
```typescript
// টেলিগ্রাম API এরর চেক
if (!window.Telegram?.WebApp) {
  console.warn('Telegram WebApp not available');
  // ফ্যালব্যাক মোড
}
```

## 🚀 **প্রোডাকশন ডেপ্লয়মেন্ট**

### **1. ডোমেইন সেটআপ**
- SSL সার্টিফিকেট ইনস্টল করুন
- CORS হেডার কনফিগার করুন
- CDN সেটআপ করুন

### **2. পারফরম্যান্স অপটিমাইজেশন**
- ইমেজ কম্প্রেশন
- কোড স্প্লিটিং
- লেজি লোডিং

### **3. মনিটরিং**
- ইউজার অ্যাক্টিভিটি ট্র্যাক
- এরর লগিং
- পারফরম্যান্স মেট্রিক্স

## 🔐 **সিকিউরিটি চেকলিস্ট**

### **1. টেলিগ্রাম ভেরিফিকেশন**
- [ ] `initData` হ্যাশ ভেরিফিকেশন
- [ ] ইউজার ID ভ্যালিডেশন
- [ ] সেশন টাইমআউট

### **2. ডেটাবেস সিকিউরিটি**
- [ ] RLS পলিসি সেট
- [ ] SQL ইনজেকশন প্রিভেনশন
- [ ] ইউজার অথরাইজেশন

### **3. API সিকিউরিটি**
- [ ] রেট লিমিটিং
- [ ] CORS কনফিগারেশন
- [ ] হেডার ভ্যালিডেশন

## 📊 **টেস্টিং স্ক্রিপ্ট**

### **1. টেলিগ্রাম API টেস্ট**
```bash
# বট ইনফরমেশন চেক
curl "https://api.telegram.org/bot<BOT_TOKEN>/getMe"

# ওয়েব অ্যাপ ইনফো
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

### **2. ইউজার ইন্টারঅ্যাকশন টেস্ট**
```typescript
// টেস্ট ইউজার ডেটা
const testUser = {
  id: 123456789,
  first_name: 'Test',
  last_name: 'User',
  username: 'testuser',
  photo_url: 'https://example.com/photo.jpg'
};

// টেস্ট টেলিগ্রাম WebApp
window.Telegram = {
  WebApp: {
    ready: () => console.log('Ready'),
    expand: () => console.log('Expanded'),
    initDataUnsafe: { user: testUser }
  }
};
```

## 🆘 **ট্রাবলশুটিং**

### **1. সাধারণ সমস্যা**
- **অ্যাপ ওপেন হয় না**: ডোমেইন চেক করুন
- **ইউজার ডেটা লোড হয় না**: API টোকেন ভেরিফাই করুন
- **CORS এরর**: হেডার কনফিগারেশন চেক করুন

### **2. ডিবাগিং টিপস**
```typescript
// ডিবাগ মোড
const DEBUG_MODE = true;

if (DEBUG_MODE) {
  console.log('Telegram WebApp State:', {
    isReady: window.Telegram?.WebApp?.isExpanded,
    user: window.Telegram?.WebApp?.initDataUnsafe?.user,
    theme: window.Telegram?.WebApp?.colorScheme
  });
}
```

### **3. সাপোর্ট রিসোর্স**
- [টেলিগ্রাম Bot API ডকুমেন্টেশন](https://core.telegram.org/bots/api)
- [টেলিগ্রাম WebApp ডকুমেন্টেশন](https://core.telegram.org/bots/webapps)
- [BotFather কমান্ডস](https://t.me/botfather)

---

## ✅ **চেকলিস্ট**

- [ ] টেলিগ্রাম বট তৈরি
- [ ] API টোকেন সংগ্রহ
- [ ] মিনি অ্যাপ কনফিগার
- [ ] ডোমেইন সেটআপ
- [ ] CORS কনফিগারেশন
- [ ] টেস্টিং সম্পন্ন
- [ ] প্রোডাকশন ডেপ্লয়
- [ ] মনিটরিং সেটআপ

**সব স্টেপ সম্পন্ন হলে আপনার টেলিগ্রাম মিনি অ্যাপ প্রস্তুত! 🎉** 