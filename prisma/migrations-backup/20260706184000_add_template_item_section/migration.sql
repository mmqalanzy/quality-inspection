-- AddSectionToTemplateItem
ALTER TABLE "TemplateItem" ADD COLUMN "section" TEXT NOT NULL DEFAULT 'DURING_EXECUTION';

-- CreateIndex
CREATE INDEX "TemplateItem_templateId_section_idx" ON "TemplateItem"("templateId", "section");
