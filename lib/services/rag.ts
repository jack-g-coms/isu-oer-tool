import { KnowledgeDocumentType, KnowledgeDocument, KnowledgeDocumentChunk, KnowledgeDocumentStatus, Prisma } from "@/prisma/client";

import KnowledgeDocumentProperties from "@/shared/types/KnowledgeDocumentProperties";
import KnowledgeChunkWithDoc from "@/shared/types/KnowledgeChunkWithDoc";

import prisma from "@/lib/db/prisma";
import pgvector from "pgvector";
import { generateChunkEmbedding } from "./ai";
import { uploadFile, getFile } from "./uploads";

import { OfficeConverter, OfficeChunk } from "officeparser";

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;

// Private
function getKnowledgeDocumentType(file: File): KnowledgeDocumentType {
    switch (file.type) {
        case "application/pdf":
            return KnowledgeDocumentType.PDF;
        case "text/plain":
            return KnowledgeDocumentType.TEXT;
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            return KnowledgeDocumentType.DOCX;
        case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
            return KnowledgeDocumentType.PPTX;
        default:
            throw new Error(`Unsupported file type: ${file.type}`);
    }
}

async function insertChunk(text: string, document: KnowledgeDocument, index: number): Promise<KnowledgeDocumentChunk> {
    const embedding = await generateChunkEmbedding(text);
    const chunk = await prisma.$queryRaw<KnowledgeDocumentChunk>`
        INSERT INTO "KnowledgeDocumentChunk" ("id", "documentId", "index", "text", "embedding") VALUES (
            ${crypto.randomUUID()},
            ${document.id},
            ${index},
            ${text},
            ${pgvector.toSql(embedding)}::vector
        )
        RETURNING *;
    `;

    return chunk;
}

async function chunkText(document: KnowledgeDocument): Promise<KnowledgeDocumentChunk[]> {
    await prisma.knowledgeDocument.update({
        where: { id: document.id },
        data: {
            status: KnowledgeDocumentStatus.PROCESSING
        }
    });

    const fileBuffer = await getFile(document.uri);
    const chunks: KnowledgeDocumentChunk[] = [];

    if (document.type == KnowledgeDocumentType.TEXT) {
        const text = fileBuffer.toString("utf-8")
            .replace(/\0/g, "")
            .replace(/[\x00-\x08]/g, "")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .trim();

        for (let i = 0; i < text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
            const chunkText = text.slice(i, i + CHUNK_SIZE);
            const chunk = await insertChunk(chunkText, document, i);
            chunks.push(chunk);
        }
    } else {
        const { value: officeChunks } = await OfficeConverter.convert(fileBuffer, "chunks", {
            generatorConfig: {
                chunksConfig: {
                    strategy: "fixed-size",
                    chunkSize: CHUNK_SIZE,
                    chunkOverlap: CHUNK_OVERLAP
                }
            }
        });

        for (let i = 0; i < officeChunks.length; i++) {
            const officeChunk = (officeChunks as OfficeChunk[])[i];
            const text = officeChunk.text
                .replace(/\0/g, "")
                .trim();

            const chunk = await insertChunk(text, document, i);
            chunks.push(chunk);
        }
    }

    await prisma.knowledgeDocument.update({
        where: { id: document.id },
        data: {
            status: KnowledgeDocumentStatus.READY
        }
    });

    return chunks;
}

// Public
export async function createKnowledgeDocument(file: File, properties: KnowledgeDocumentProperties): Promise<KnowledgeDocument> {
    let knowledgeDocType = getKnowledgeDocumentType(file);

    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds the maximum limit of ${MAX_FILE_SIZE} bytes`);
    }

    const filePath = await uploadFile(file);
    const knowledgeDoc = await prisma.knowledgeDocument.create({
        data: {
            title: properties.title,
            authorId: properties.authorId,
            type: knowledgeDocType,
            uri: filePath,
            aiUsable: properties.aiUsable
        }
    });

    return knowledgeDoc;
}

export async function getRelevantChunks(knowledgeDocIds: string[], query: string): Promise<KnowledgeChunkWithDoc[]> {
    const embedding = await generateChunkEmbedding(query);
    const embeddingVector = pgvector.toSql(embedding);

    return await prisma.$queryRaw<KnowledgeChunkWithDoc[]>`
        SELECT c.id AS "chunkId", c.text, d.id as "documentId", d.title, d.type, d.uri as "documentURI"
        FROM "KnowledgeDocumentChunk" c
        JOIN "KnowledgeDocument" d ON c."documentId" = d.id
        WHERE c."documentId" IN (${Prisma.join(knowledgeDocIds)}) AND d."aiUsable" = true AND d.status = ${KnowledgeDocumentStatus.READY} 
        ORDER BY c.embedding <-> ${embeddingVector}::vector
        LIMIT 5;
    `
}

export async function ingestToKnowledgeBase(knowledgeDoc: KnowledgeDocument): Promise<void> {
    await chunkText(knowledgeDoc);
}