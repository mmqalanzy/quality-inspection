import { prisma } from "@/server/db";

export async function listSeedOverview() {
  const [cities, contractors, templates, users] = await Promise.all([
    prisma.city.count(),
    prisma.contractor.count(),
    prisma.inspectionTemplate.count(),
    prisma.user.count()
  ]);

  return [
    {
      label: "المدن",
      count: cities,
      description: "مدن قابلة للإدارة وليست قيما ثابتة داخل الواجهة."
    },
    {
      label: "المقاولون",
      count: contractors,
      description: "قائمة أولية يمكن توسيعها لاحقا من لوحة الإدارة."
    },
    {
      label: "قوالب التفتيش",
      count: templates,
      description: "قالب تركيب عداد وإطلاق تيار مع بنوده الإلزامية."
    },
    {
      label: "المستخدمون",
      count: users,
      description: "مستخدم QualityAdmin ومفتش تجريبيان للبيئة المحلية فقط."
    }
  ];
}
