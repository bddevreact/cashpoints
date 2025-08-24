# 🔐 টেলিগ্রাম বট টোকেন সেটআপ গাইড

## 🤖 **বট টোকেন কী এবং কীভাবে কাজ করে**

### **বট টোকেন কী**
টেলিগ্রাম বট টোকেন হল একটি **গোপন কী** যা আপনার বটকে টেলিগ্রাম API এর সাথে যোগাযোগ করতে দেয়।

**উদাহরণ:**
```
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

### **বট টোকেনের কাজ**
1. **API অথরাইজেশন** - টেলিগ্রাম API এর সাথে যোগাযোগ
2. **বট কন্ট্রোল** - মেসেজ পাঠানো, আপডেট পাওয়া
3. **মিনি অ্যাপ কন্ট্রোল** - ওয়েব অ্যাপ সেটিংস
4. **ইউজার ইন্টারঅ্যাকশন** - কমান্ড হ্যান্ডলিং

## 📍 **বট টোকেন কোথায় রাখতে হবে**

### **1. এনভায়রনমেন্ট ফাইলে (.env)**

প্রজেক্টের রুট ডিরেক্টরিতে `.env` ফাইল তৈরি করুন:

```bash
# .env ফাইল
VITE_TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
VITE_TELEGRAM_BOT_USERNAME=bt_community_bot
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### **2. কোডে ব্যবহার**

```typescript
// src/lib/telegram.ts
const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;

// বট API কল
export const sendTelegramMessage = async (chatId: string, message: string) => {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    }
  );
  
  return response.json();
};
```

### **3. সিকিউরিটি টিপস**

```bash
# .gitignore ফাইলে যোগ করুন
.env
.env.local
.env.production
.env.staging

# কখনও বট টোকেন GitHub এ আপলোড করবেন না!
# টোকেন লিক হলে অবিলম্বে নতুন টোকেন জেনারেট করুন
```

## 🚀 **বট টোকেন পাওয়ার স্টেপস**

### **স্টেপ 1: @BotFather এ যান**
1. টেলিগ্রামে @BotFather খুঁজুন
2. `/start` কমান্ড দিন

### **স্টেপ 2: নতুন বট তৈরি করুন**
```
/newbot
```

### **স্টেপ 3: বট নাম দিন**
```
BT Community Bot
```

### **স্টেপ 4: বট ইউজারনেম দিন**
```
bt_community_bot
```
*নোট: ইউজারনেম শেষে 'bot' থাকতে হবে*

### **স্টেপ 5: API টোকেন কপি করুন**
```
Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

Keep your token secure and store it safely, it can be used by anyone to control your bot.
```

## 🔧 **বট টোকেন ভেরিফিকেশন**

### **1. API টেস্ট**
```bash
# বট ইনফরমেশন চেক
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"

# প্রত্যাশিত আউটপুট
{
  "ok": true,
  "result": {
    "id": 1234567890,
    "is_bot": true,
    "first_name": "BT Community Bot",
    "username": "bt_community_bot",
    "can_join_groups": true,
    "can_read_all_group_messages": false,
    "supports_inline_queries": false
  }
}
```

### **2. ওয়েব অ্যাপ ইনফো**
```bash
# ওয়েব অ্যাপ ইনফরমেশন
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

## 📱 **মিনি অ্যাপ কনফিগারেশন**

### **1. মেনু বাটন সেট**
```
/setmenubutton
```
- বট সিলেক্ট করুন
- মেনু টেক্সট: `BT Community`
- URL: `https://your-domain.com`

### **2. ওয়েব অ্যাপ তৈরি**
```
/newapp
```
- বট সিলেক্ট করুন
- অ্যাপ নাম: `BT Community`
- শর্ট ডিসক্রিপশন: `Earn money through referrals and tasks`
- ফটো আপলোড করুন

## 🛡️ **সিকিউরিটি চেকলিস্ট**

### **✅ সুরক্ষা ব্যবস্থা**
- [ ] `.env` ফাইল `.gitignore` এ যোগ করা হয়েছে
- [ ] বট টোকেন GitHub এ আপলোড করা হয়নি
- [ ] প্রোডাকশন সার্ভারে `.env` ফাইল সুরক্ষিত
- [ ] বট টোকেন নিয়মিত আপডেট করা হয়

### **🚨 সতর্কতা**
- **কখনও বট টোকেন পাবলিক করে দেবেন না**
- **টোকেন লিক হলে অবিলম্বে নতুন টোকেন জেনারেট করুন**
- **প্রোডাকশন সার্ভারে `.env` ফাইল সুরক্ষিত রাখুন**

## 🔄 **টোকেন আপডেট প্রসিডিউর**

### **1. নতুন টোকেন জেনারেট**
```
/mybots
```
- আপনার বট সিলেক্ট করুন
- API Token → Revoke Current Token
- নতুন টোকেন জেনারেট করুন

### **2. কোড আপডেট**
```bash
# .env ফাইলে নতুন টোকেন সেট করুন
VITE_TELEGRAM_BOT_TOKEN=new_token_here

# অ্যাপ রিস্টার্ট করুন
npm run build
```

## 📊 **টোকেন মনিটরিং**

### **1. API ব্যবহার ট্র্যাক**
```bash
# API কল কাউন্ট
curl "https://api.telegram.org/bot<TOKEN>/getMyCommands"
```

### **2. এরর লগিং**
```typescript
// বট API এরর হ্যান্ডলিং
try {
  const response = await sendTelegramMessage(chatId, message);
  if (!response.ok) {
    console.error('Telegram API error:', response);
  }
} catch (error) {
  console.error('Failed to send Telegram message:', error);
}
```

---

## 📞 **সাপোর্ট**

যদি কোন সমস্যা হয়:
- **টেকনিক্যাল ইস্যু**: GitHub Issues
- **বট সেটআপ**: @BotFather
- **API ডকুমেন্টেশন**: [core.telegram.org/bots/api](https://core.telegram.org/bots/api)

**🔐 আপনার বট টোকেন সুরক্ষিত রাখুন এবং সফলভাবে মিনি অ্যাপ ডেপ্লয় করুন!** 