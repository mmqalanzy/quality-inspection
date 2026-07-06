# إعداد Telegram

هذا الملف يوثق إعداد Telegram Mini App بعد تنفيذ طبقة التحقق من `initData`.

## إنشاء البوت

1. افتح BotFather داخل Telegram.
2. أنشئ بوتا جديدا واحفظ التوكن خارج المستودع.
3. ضع التوكن في `.env` داخل `TELEGRAM_BOT_TOKEN`.

## زر Mini App

العنوان المطلوب للزر:

```text
فتح نظام توثيق الجودة
```

ضع رابط الويب في:

```env
TELEGRAM_WEBAPP_URL="https://your-domain.example"
```

## أوامر البوت المطلوبة لاحقا

- `/start`
- `/help`
- `/myid`

## التحقق من initData

الصفحة الرئيسية تقرأ `window.Telegram.WebApp.initData` وترسله إلى:

```text
POST /api/auth/telegram
```

الخادم فقط يتحقق من التوقيع باستخدام `TELEGRAM_BOT_TOKEN` ويتحقق من `auth_date`. لا تستخدم الواجهة `initDataUnsafe` كمصدر ثقة.

## تسجيل مستخدم Telegram

استخدم أمر `/myid` في البوت لاحقا لمعرفة Telegram User ID. في المرحلة الحالية يمكن تحديث المستخدم مباشرة في قاعدة البيانات بحيث يساوي:

```text
User.telegramUserId = Telegram User ID
```

مع بقاء `isActive=true`.

## التطوير خارج Telegram

عند تفعيل:

```env
DEV_AUTH_ENABLED="true"
NODE_ENV="development"
```

يمكن فتح:

```text
/dev/login
```

هذا المسار مغلق في production.
