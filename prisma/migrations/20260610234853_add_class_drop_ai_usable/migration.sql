/*
  Warnings:

  - You are about to drop the column `aiUsable` on the `KnowledgeDocument` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "KnowledgeDocument" DROP COLUMN "aiUsable",
ADD COLUMN     "class" TEXT NOT NULL DEFAULT 'None';
