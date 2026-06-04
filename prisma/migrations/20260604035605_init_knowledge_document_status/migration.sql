/*
  Warnings:

  - Added the required column `status` to the `KnowledgeDocument` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "KnowledgeDocumentStatus" AS ENUM ('PROCESSING', 'PROCESSED');

-- AlterTable
ALTER TABLE "KnowledgeDocument" ADD COLUMN     "status" "KnowledgeDocumentStatus" NOT NULL;
