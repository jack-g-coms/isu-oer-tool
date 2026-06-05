/*
  Warnings:

  - Made the column `embedding` on table `KnowledgeDocumentChunk` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "KnowledgeDocumentChunk" ALTER COLUMN "embedding" SET NOT NULL;
