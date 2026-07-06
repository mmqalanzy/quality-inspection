-- Delete existing photo records (Telegram fileId references will no longer work)
DELETE FROM "EvidencePhoto";

-- DropIndex
DROP INDEX "EvidencePhoto_fileId_key";

-- AlterTable
ALTER TABLE "EvidencePhoto" DROP COLUMN "fileId",
DROP COLUMN "messageId",
ADD COLUMN     "storageKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EvidencePhoto_storageKey_key" ON "EvidencePhoto"("storageKey");
