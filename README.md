# نظام توثيق الجودة عبر Telegram Mini App

هذا المستودع يجهز المرحلة الأولى من تطبيق توثيق ميداني لمفتشي الجودة. الهدف الحالي هو تأسيس مشروع واحد منظم باستخدام Next.js وTypeScript وPrisma وSQLite، مع seed أولي لقالب "تركيب عداد وإطلاق تيار".

## المتطلبات

- Node.js LTS، الإصدار 22 أو أحدث.
- pnpm.
- SQLite عبر Prisma.

## التثبيت

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm prisma:generate
pnpm db:seed
```

## التشغيل

```bash
pnpm dev
```

يفتح التطبيق محليا على `http://localhost:3000`.

## المصادقة

يدعم التطبيق مسارين في المرحلة الثانية:

- Telegram Mini App: الصفحة الرئيسية تقرأ `window.Telegram.WebApp.initData` وترسله إلى `POST /api/auth/telegram`. الخادم يتحقق من التوقيع باستخدام `TELEGRAM_BOT_TOKEN` ثم يبحث عن `telegramUserId` في قاعدة البيانات.
- Development Authentication: المسار `/dev/login` يعمل فقط عندما يكون `NODE_ENV` ليس `production` و`DEV_AUTH_ENABLED=true`. يسمح باختيار مستخدمي seed التجريبيين فقط ولا يقبل role من المتصفح.

مسارات المصادقة الحالية:

- `POST /api/auth/telegram`
- `POST /api/auth/dev`
- `POST /api/auth/logout`
- `GET /api/auth/me`

الصفحات المحمية:

- `/app`: متاحة للمفتش ومسؤول الجودة.
- `/admin`: متاحة لدور `QUALITY_ADMIN` فقط.
- `/unauthorized`: صفحة عدم وجود صلاحية.

## التفتيش الأساسي

تم تنفيذ المرحلة الثالثة بدون صور أو إرسال للمراجعة أو PDF. المسارات الحالية:

- `/app`: لوحة مختصرة تعرض المسودات والمرجعات وروابط العمل.
- `/app/inspections`: قائمة أعمال المستخدم في بطاقات مناسبة للجوال.
- `/app/inspections/new`: إنشاء تفتيش جديد.
- `/app/inspections/[inspectionId]`: تفاصيل التفتيش وقائمة البنود.
- `/app/inspections/[inspectionId]/items/[itemId]`: تعديل حالة وملاحظة البند مع حفظ تلقائي.
- `/app/inspections/[inspectionId]/review`: مراجعة أولية للقراءة فقط.

مسارات API:

- `POST /api/inspections`: إنشاء تفتيش وبنوده داخل transaction.
- `PATCH /api/inspection-items/[itemId]`: حفظ حالة وملاحظة البند.

قواعد الوصول:

- المفتش يرى ويفتح أعماله فقط.
- المفتش يعدل فقط تفتيشات `DRAFT` أو `RETURNED`.
- `inspectorId` يؤخذ من الجلسة ولا يقبل من المتصفح.
- مسؤول الجودة يمكنه فتح `/app` لأغراض الاختبار في هذه المرحلة، دون قدرات اعتماد أو إرجاع.

حالات التنفيذ:

- `PLANNED`: مخطط.
- `IN_PROGRESS`: جاري العمل.
- `COMPLETED`: تم التنفيذ.
- `INSPECTED`: تم الفحص.
- `ENERGIZED`: تم إطلاق التيار.
- `ASPHALT_RESTORED`: تمت إعادة الأسفلت.

حالات البند:

- `NOT_STARTED`: لا يحسب مكتملا.
- `COMPLIANT`: يحسب موثقا.
- `NON_COMPLIANT`: يتطلب ملاحظة ويحسب موثقا عند وجودها.
- `NOT_APPLICABLE`: يتطلب ملاحظة ويحسب موثقا عند وجودها.
- `NEEDS_RECAPTURE`: لا يحسب مكتملا في هذه المرحلة.

الحفظ التلقائي:

- تغيير الحالة يحفظ فوراً.
- الملاحظات تحفظ بعد debounce قصير.
- يرسل العميل `version` الحالي، والخادم يعيد `409 Conflict` عند تعارض النسخ.
- لا يتم حفظ حالة تتطلب ملاحظة مع ملاحظة فارغة.

## SESSION_SECRET

في التطوير يمكن استخدام قيمة placeholder محلية. في الإنتاج يجب توليد قيمة قوية، مثال:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

لا تحفظ قيمة الإنتاج في المستودع.

## أوامر الجودة

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

ملاحظة Prisma: توجد migrations SQL موثقة داخل `prisma/migrations`. في هذه البيئة فشل `prisma migrate dev` و`prisma migrate deploy` بخطأ `Schema engine error` بلا تفاصيل، بينما نجح `prisma validate` و`prisma generate` وتطبيق SQL. لذلك يستخدم سكربت `pnpm db:migrate` مؤقتا لتجهيز SQLite محليا، ولا يعتبر بديلا دائما عن Prisma migrations.

## متغيرات البيئة

- `DATABASE_URL`: مسار SQLite، مثال `file:./dev.db`.
- `TELEGRAM_BOT_TOKEN`: توكن البوت، لا يوضع داخل المستودع.
- `TELEGRAM_WEBAPP_URL`: رابط Mini App المستخدم في BotFather.
- `SESSION_SECRET`: سر قوي للجلسات.
- `STORAGE_ROOT`: مسار تخزين الصور محليا في التطوير.
- `MAX_IMAGE_SIZE_MB`: حد حجم الصورة.
- `DEV_AUTH_ENABLED`: تفعيل دخول التطوير محليا فقط.
- `NODE_ENV`: بيئة التشغيل.

## محتوى seed

- المدن: عرعر، رفحاء، طريف، العويقيلة.
- المقاولون: فصول السنة، الأداء المتوازن، بن دلامة، اكتاف.
- قالب واحد: تركيب عداد وإطلاق تيار.
- 16 بندا إلزاميا، وكل بند يتطلب صورة واحدة على الأقل.
- مستخدم QualityAdmin تجريبي ومستخدم Inspector تجريبي بمعرفات غير حقيقية.

## Development Authentication

تم تنفيذه في المرحلة الثانية عبر `/dev/login`. لتفعيله محليا:

```env
DEV_AUTH_ENABLED="true"
NODE_ENV="development"
```

المسار يعيد 404 تلقائيا عند تعطيله أو عند تشغيل production.

## BotFather وTelegram

تم تنفيذ تحقق `initData` في الخادم. الإعداد المتوقع:

1. إنشاء بوت من BotFather.
2. ضبط زر Web App بعنوان "فتح نظام توثيق الجودة".
3. وضع رابط التطبيق في `TELEGRAM_WEBAPP_URL`.
4. حفظ توكن البوت في `TELEGRAM_BOT_TOKEN` خارج المستودع.
5. إضافة Telegram User ID للمستخدم في قاعدة البيانات داخل حقل `telegramUserId`.

## النسخ الاحتياطي

في التطوير تكفي نسخة من ملف SQLite ومسار الصور:

```bash
copy prisma\dev.db backups\dev.db
xcopy storage backups\storage /E /I
```

## القيود الحالية

- هذه المرحلة لا تحتوي على رفع صور أو حذف صور أو إرسال `SUBMITTED` أو PDF أو بوت Telegram worker أو مراجعة إدارية.
- لا يزال سكربت `db:migrate` يستخدم `prisma db execute` مؤقتا بسبب مشكلة محرك Prisma migration في البيئة الحالية.
- لا توجد أسرار داخل المستودع.

## الخطوة التالية

تنفيذ المرحلة الرابعة: رفع الصور، التخزين الآمن، عرض الصور، حذف الصور، وصلاحيات الوصول للصور.
