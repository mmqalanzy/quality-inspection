import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const cities = ["عرعر", "رفحاء", "طريف", "العويقيلة"];
const contractors = ["فصول السنة", "الأداء المتوازن", "بن دلامة", "اكتاف"];

const templateItems: Array<{ title: string; section: string }> = [
  { title: "صورة للساعة", section: "PRE_EXECUTION" },
  { title: "صورة للقاطع توضح العوازل", section: "PRE_EXECUTION" },
  { title: "صورة للنهايات جهة العداد، كيبل المشترك، بدون تلامس الفازات", section: "DURING_EXECUTION" },
  { title: "صورة للنهايات جهة لوحة التوزيع مع التاق", section: "DURING_EXECUTION" },
  { title: "صورة للتأريض", section: "DURING_EXECUTION" },
  { title: "صورة لتغطية الفتحات", section: "POST_EXECUTION" },
  { title: "صورة للماسورة وتثبيتها", section: "DURING_EXECUTION" },
  { title: "صورة Clamp داخل العداد", section: "DURING_EXECUTION" },
  { title: "صورة لأجزاء العداد الداخلية من بعيد", section: "DURING_EXECUTION" },
  { title: "صورة للقفل", section: "DURING_EXECUTION" },
  { title: "صورة للترقيم الخارجي، رقم المشترك والمصدر", section: "DURING_EXECUTION" },
  { title: "صورة للعداد من الخارج", section: "DURING_EXECUTION" },
  { title: "صورة توضح ارتفاع العداد", section: "DURING_EXECUTION" },
  { title: "صورة ميزان من الأعلى", section: "DURING_EXECUTION" },
  { title: "صورة ميزان من الجانب", section: "DURING_EXECUTION" },
  { title: "صور إطلاق التيار", section: "POST_EXECUTION" }
];

async function main() {
  for (const name of cities) {
    await prisma.city.upsert({
      where: { name },
      update: { isActive: true },
      create: { name }
    });
  }

  for (const name of contractors) {
    await prisma.contractor.upsert({
      where: { name },
      update: { isActive: true },
      create: { name }
    });
  }

  await prisma.user.upsert({
    where: { telegramUserId: "dev-quality-admin" },
    update: {
      fullName: "مسؤول جودة تجريبي",
      username: "dev_quality_admin",
      role: "QUALITY_ADMIN",
      isActive: true
    },
    create: {
      telegramUserId: "dev-quality-admin",
      fullName: "مسؤول جودة تجريبي",
      username: "dev_quality_admin",
      role: "QUALITY_ADMIN"
    }
  });

  await prisma.user.upsert({
    where: { telegramUserId: "dev-inspector" },
    update: {
      fullName: "مفتش تجريبي",
      username: "dev_inspector",
      role: "INSPECTOR",
      isActive: true
    },
    create: {
      telegramUserId: "dev-inspector",
      fullName: "مفتش تجريبي",
      username: "dev_inspector",
      role: "INSPECTOR"
    }
  });

  const template = await prisma.inspectionTemplate.upsert({
    where: { name: "تركيب عداد وإطلاق تيار" },
    update: {
      description: "قالب النسخة الأولى لتوثيق تركيب العداد وإطلاق التيار.",
      isActive: true
    },
    create: {
      name: "تركيب عداد وإطلاق تيار",
      description: "قالب النسخة الأولى لتوثيق تركيب العداد وإطلاق التيار."
    }
  });

  for (const [index, item] of templateItems.entries()) {
    await prisma.templateItem.upsert({
      where: {
        templateId_order: {
          templateId: template.id,
          order: index + 1
        }
      },
      update: {
        title: item.title,
        section: item.section,
        isRequired: true,
        minimumPhotos: 1
      },
      create: {
        templateId: template.id,
        order: index + 1,
        title: item.title,
        section: item.section,
        isRequired: true,
        minimumPhotos: 1
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
