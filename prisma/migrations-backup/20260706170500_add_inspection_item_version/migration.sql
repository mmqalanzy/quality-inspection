-- Add optimistic concurrency token for inspection item autosave.
ALTER TABLE "InspectionItem" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
