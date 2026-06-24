/*
  Warnings:

  - The values [FAILED] on the enum `SectionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SectionStatus_new" AS ENUM ('QUEUED', 'WRITING', 'READY', 'FAILED_WRITING', 'FAILED_REFINING');
ALTER TABLE "public"."Section" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Section" ALTER COLUMN "status" TYPE "SectionStatus_new" USING ("status"::text::"SectionStatus_new");
ALTER TYPE "SectionStatus" RENAME TO "SectionStatus_old";
ALTER TYPE "SectionStatus_new" RENAME TO "SectionStatus";
DROP TYPE "public"."SectionStatus_old";
ALTER TABLE "Section" ALTER COLUMN "status" SET DEFAULT 'QUEUED';
COMMIT;
