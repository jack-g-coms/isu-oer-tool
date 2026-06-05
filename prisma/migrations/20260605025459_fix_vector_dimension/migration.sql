ALTER TABLE "KnowledgeDocumentChunk"
DROP COLUMN "embedding";

ALTER TABLE "KnowledgeDocumentChunk"
ADD COLUMN "embedding" vector(768);