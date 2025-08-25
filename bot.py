from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

# Bot token (আপনার দেওয়া টোকেন)
TOKEN = "8214925584:AAGzxmpSxFTGmvU-L778DNxUJ35QUR5dDZU"

# /start কমান্ড হ্যান্ডলার
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # ছবির URL
    image_url = "https://i.postimg.cc/44DtvWyZ/43b0363d-525b-425c-bc02-b66f6d214445-1.jpg"

    # বাংলা বিবরণ
    caption = (
        "🏆 <b>রিওয়ার্ড অর্জন এখন আরও সহজ!</b>\n\n"
        "✅ কোনো ইনভেস্টমেন্ট ছাড়াই প্রতিদিন জিতে নিন রিওয়ার্ড।\n"
        "👥 শুধু টেলিগ্রামে মেম্বার অ্যাড করুন,\n"
        "🎯 সহজ কিছু টাস্ক সম্পন্ন করুন আর\n"
        "🚀 লেভেল আপ করুন।\n\n"
        "📈 প্রতিটি লেভেলেই থাকছে বাড়তি বোনাস এবং নতুন সুবিধা।\n"
        "💎 যত বেশি সক্রিয় হবেন, তত বেশি রিওয়ার্ড আপনার হাতে।\n\n"
        "👉 এখনই শুরু করুন এবং আপনার রিওয়ার্ড ক্লেইম করুন!"
    )

    # "Open and Earn" বাটন - মিনি অ্যাপ লিংক
    keyboard = [
        [InlineKeyboardButton("Open and Earn 💰", url="https://super-donut-5e4873.netlify.app/")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    # ছবি, ক্যাপশন এবং বাটন পাঠানো
    await update.message.reply_photo(
        photo=image_url,
        caption=caption,
        reply_markup=reply_markup,
        parse_mode='HTML'  # HTML মোডে বোল্ড, লাইন ব্রেক ইত্যাদি কাজ করবে
    )

def main():
    # অ্যাপ্লিকেশন তৈরি
    app = Application.builder().token(TOKEN).build()

    # কমান্ড হ্যান্ডলার যোগ করুন
    app.add_handler(CommandHandler("start", start))

    print("✅ বট চালু হচ্ছে... টেলিগ্রামে /start লিখুন।")
    # পলিং শুরু করুন
    app.run_polling()

if __name__ == "__main__":
    main()