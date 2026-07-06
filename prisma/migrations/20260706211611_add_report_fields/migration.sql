-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN     "reportFileId" TEXT,
ADD COLUMN     "reportMessageId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Inspection_reportFileId_key" ON "Inspection"("reportFileId");
