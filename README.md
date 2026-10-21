# Parsa Saberi - سامانه تبدیل متن به گفتار (Text-to-Speech)

یک وب‌اپلیکیشن حرفه‌ای، مدرن، بدون نیاز به ثبت‌نام و فول‌استک برای تبدیل متن فارسی به صدای طبیعی با ۳۰ صدای متنوع و دانلود MP3.

## ویژگی‌ها
- ۳۰ صدای واقعی (۱۵ مرد و ۱۵ زن)
- اتصال دوگانه به Google Speech و ElevenLabs
- سیستم جایگزینی خودکار (Failover) در صورت قطعی یا اتمام سهمیه
- اینکودر استاندارد MP3 (MPEG Audio Layer III)
- رابط کاربری فارسی و راست‌چین (RTL) با فونت وزیرمتن
- ضد اسپم و Rate Limiting سمت سرور

## متغیرهای محیطی مورد نیاز (Environment Variables)
- `GEMINI_API_KEY`: کلید گوگل Gemini
- `ELEVENLABS_API_KEY`: کلید اختصاصی ElevenLabs (شروع با `sk_`)

## راه‌اندازی محلی یا روی VPS
```bash
# ۱. نصب پیش‌نیازها
npm install

# ۲. بیلد فرانت‌اند
npm run build

# ۳. اجرای سرور
npm start
```
سرور به طور پیش‌فرض روی پورت ۳۰۰۰ بالا می‌آید: `http://localhost:3000`

## راه‌اندازی رایگان روی Vercel یا Render
1. فایل زیپ را در یک مخزن GitHub آپلود کنید.
2. در Vercel یا Render گزینه New Project را انتخاب کنید.
3. در بخش Environment Variables کلیدهای `GEMINI_API_KEY` و `ELEVENLABS_API_KEY` را وارد کنید.
4. دکمه Deploy را بزنید تا آدرس اختصاصی بدون پسوند به شما داده شود.
