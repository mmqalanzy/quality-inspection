# المعمارية

المشروع Modular Monolith داخل تطبيق Next.js واحد.

## الطبقات الحالية

- `src/app`: صفحات App Router والأنماط العامة.
- `src/server`: كود الخادم المشترك مثل Prisma client.
- `src/domain`: تعريفات وقيم نطاق العمل التي لا تعتمد على الواجهة.
- `prisma`: schema وseed وmigrations.
- `src/server/auth`: تحقق Telegram والجلسات والصلاحيات.
- `src/server/inspections`: عمليات التفتيش الخادمية، الوصول، الإنشاء، السرد، والتحديث.
- `src/domain/inspections`: حالات التفتيش والبنود، التحقق، وحساب التقدم.
- `src/telegram`: wrapper صغير لـ Telegram WebApp SDK في المتصفح.

## قرارات المرحلة الأولى

- SQLite مناسب للنسخة الأولى وللتشغيل المحلي السريع.
- Prisma يوفر schema واضحا وفهارس وقيودا تمنع تكرار بنود التفتيش.
- الأدوار والحالات تخزن كـ `String` في SQLite، وتضبط قيمها المسموحة في طبقة TypeScript/Zod لتجنب قيود enum في SQLite.
- الصور لن تخزن في SQLite. سيخزن النظام لاحقا مسار الصورة وبياناتها فقط.
- لا توجد خدمات منفصلة أو message queues أو Redis في هذه المرحلة.
- الجلسة Cookie موقعة بخادم التطبيق لتجنب جدول Sessions في هذه المرحلة، مع إعادة التحقق من المستخدم في قاعدة البيانات عند كل قراءة.
- قرارات الصلاحيات الحقيقية تتم على الخادم داخل الصفحات وRoute Handlers، وليس عبر إخفاء عناصر الواجهة فقط.
- إنشاء التفتيش يتم داخل Prisma transaction واحد: Inspection ثم InspectionItems ثم AuditLog.
- تحديث البند يستخدم `version` كـ optimistic concurrency token.

## نموذج التفتيش في هذه المرحلة

- `Inspection`: بيانات أمر العمل وحالة `DRAFT`.
- `InspectionItem`: بند مرتبط بقالب، حالة، ملاحظة، و`version`.
- `AuditLog`: يسجل `INSPECTION_CREATED` و`INSPECTION_ITEM_UPDATED` بدون نص الملاحظة الكامل.

لا توجد صور أو إرسال للمراجعة أو PDF في هذه المرحلة.

## تحقيق Prisma migrations

النتائج الحالية:

- Node.js: v24.14.0.
- Prisma وPrisma Client: 5.22.0.
- `prisma validate`: نجح.
- `prisma generate`: نجح.
- `prisma db execute`: نجح ويطبق SQL.
- `pnpm db:migrate`: يطبق SQL محليا عبر سكربت مؤقت يستخدم SQLite ويضيف migrations الناقصة فقط.
- `prisma migrate status`: يرى migration غير مطبق لأن `db execute` لا يسجل صفا في `_prisma_migrations`.
- `prisma migrate dev` يفشل بخطأ `Schema engine error` حتى على قاعدة جديدة.
- نفس الفشل حدث عند اختبار schema من مسار مؤقت ASCII في `C:\tmp`، لذلك لا توجد قرينة كافية أن OneDrive أو الأحرف العربية هي السبب المباشر.

التوصية: إبقاء `pnpm db:migrate` مؤقتا في التطوير، والتحقق لاحقا من Prisma migrate على Node LTS رسمي أبكر أو جهاز/مسار نظيف قبل الإنتاج.

## الانتقال للمراحل التالية

ستضاف المصادقة والجلسات ومسارات API داخل نفس مشروع Next.js مع فصل منطقي للملفات دون إنشاء backend منفصل.
