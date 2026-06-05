/*
  Warnings:

  - Added the required column `text` to the `KnowledgeDocument` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "KnowledgeDocument" ADD COLUMN     "text" TEXT NOT NULL;
