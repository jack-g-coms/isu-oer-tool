import { KnowledgeDocumentType, KnowledgeDocument, KnowledgeDocumentChunk, KnowledgeDocumentStatus, Prisma } from "@/prisma/client";
import { KnowledgeDocumentWhereInput } from "@/prisma/models";
import { OfficeConverter, OfficeChunk } from "officeparser";

import KnowledgeDocumentProperties from "@/lib/types/KnowledgeDocumentProperties";

import prisma from "@/lib/db/prisma";
import pgvector from "pgvector";
import { generateChunkEmbedding } from "./ai";
import { uploadFile, getFile, deleteFile } from "./uploads";
import KnowledgeDocumentUpdateProperties from "../types/KnowledgeDocumentUpdateProperties";

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;
const MAX_TOTAL_CHUNKS_PER_QUERY = 15;

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

    const fileBuffer = await getFile(document.uploadKey);
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
                .replace(/[\x00-\x08]/g, "")
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n")
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

export function getOutlineSampleCount(chunkCount: number): number {
    if (chunkCount <= 0) {
        return 0;
    }

    if (chunkCount <= 5) {
        return chunkCount;
    }

    const samples = Math.ceil(3 * Math.log2(chunkCount));

    return Math.min(chunkCount, samples);
}

// Public
export async function createKnowledgeDocument(file: File, properties: KnowledgeDocumentProperties): Promise<KnowledgeDocument> {
    let knowledgeDocType = getKnowledgeDocumentType(file);

    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds the maximum limit of ${MAX_FILE_SIZE} bytes`);
    }

    const uploadKey = await uploadFile(file);
    const knowledgeDoc = await prisma.knowledgeDocument.create({
        data: {
            title: properties.title,
            authorId: properties.authorId,
            type: knowledgeDocType,
            uploadKey: uploadKey,
            class: properties.class
        }
    });

    return knowledgeDoc;
}

export async function getRelevantChunks(knowledgeDocIds: string[], query: string, limit: number=MAX_TOTAL_CHUNKS_PER_QUERY): Promise<KnowledgeDocumentChunk[]> {
    const embedding = await generateChunkEmbedding(query);
    const embeddingVector = pgvector.toSql(embedding);

    return await prisma.$queryRaw<KnowledgeDocumentChunk[]>`
        SELECT c.id AS "chunkId", c.text, d.id as "documentId", d.title, d.type, d."uploadKey"
        FROM "KnowledgeDocumentChunk" c
        JOIN "KnowledgeDocument" d ON c."documentId" = d.id
        WHERE c."documentId" IN (${Prisma.join(knowledgeDocIds)}) AND d.status = ${KnowledgeDocumentStatus.READY} 
        ORDER BY c.embedding <-> ${embeddingVector}::vector
        LIMIT ${Math.min(limit, MAX_TOTAL_CHUNKS_PER_QUERY)};
    `
}

export async function getRepresentativeSample(knowledgeDocIds: string[]): Promise<KnowledgeDocumentChunk[]> {
    const representativeSample: KnowledgeDocumentChunk[] = [];

    for (const knowledgeDocId of knowledgeDocIds) {
        const chunks = await prisma.knowledgeDocumentChunk.findMany({
            where: {
                documentId: knowledgeDocId
            },
            orderBy: {
                index: "asc"
            }
        });
        const chunkCount = chunks.length;
        const samples = getOutlineSampleCount(chunkCount);

        if (samples >= chunkCount) {
            representativeSample.push(...chunks);
            continue;
        }

        const step = (chunks.length - 1) / (samples - 1);
        const used = new Set<number>();
        
        for (let i = 0; i < samples; i++) {
            const index = Math.round(i * step);
            if (!used.has(index)) {
                representativeSample.push(chunks[index]);
                used.add(index);
            }
        }
        
    }

    return representativeSample;
}

export async function getKnowledgeDoc(knowledgeDocId: string, includeChunks: boolean=false) {
    return await prisma.knowledgeDocument.findFirstOrThrow({
        where: { id: knowledgeDocId },
        include: {
            chunks: includeChunks,
            author: true
        }
    });
}

export async function getUserKnowledgeBase(
    userId: string, 
    includeChunks: boolean=false, 
    search?: string, 
    fileType?: KnowledgeDocumentType, 
    status?: KnowledgeDocumentStatus,
    page: number=1,
    limit: number=16
): Promise<{ data: KnowledgeDocument[], total: number }> {
    const where: KnowledgeDocumentWhereInput = { 
        authorId: userId,
        ...(fileType && {
            type: fileType
        }),
        ...(status && {
            status: status
        }),
        ...(search && {
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                { class: { contains: search, mode: "insensitive" } },
            ]
        })
    };

    const [docs, total] = await prisma.$transaction([
        prisma.knowledgeDocument.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                chunks: includeChunks,
                author: true
            },
            orderBy: {
                updatedAt: "desc"
            }
        }),

        prisma.knowledgeDocument.count({
            where
        })
    ]);

    return {
        data: docs.sort((a, b) => {
            if (a.status == KnowledgeDocumentStatus.FAILED && b.status != KnowledgeDocumentStatus.FAILED) return -1;
            if (a.status != KnowledgeDocumentStatus.FAILED && b.status == KnowledgeDocumentStatus.FAILED) return 1;
            return 0;
        }),
        total: total
    }
}

export async function requeueKnowledgeDoc(knowledgeDocId: string): Promise<KnowledgeDocument> {
    return await prisma.knowledgeDocument.update({
        where: { id: knowledgeDocId },
        data: {
            status: KnowledgeDocumentStatus.QUEUED
        }
    });
}

export async function updateKnowledgeDoc(knowledgeDocId: string, properties: KnowledgeDocumentUpdateProperties): Promise<KnowledgeDocument> {
    return await prisma.knowledgeDocument.update({
        where: { id: knowledgeDocId },
        data: properties
    });
}

export async function getFullDocumentText(knowledgeDocId: string): Promise<string> {
    const knowledgeDoc = await getKnowledgeDoc(knowledgeDocId);
    knowledgeDoc.chunks.sort((a, b) => a.index - b.index);

    let result = knowledgeDoc.chunks[0].text;
    for (let i = 1; i < knowledgeDoc.chunks.length; i++) {
        result += knowledgeDoc.chunks[i].text.slice(CHUNK_OVERLAP);
    }
    return result;
}

export async function ingestToKnowledgeBase(knowledgeDoc: KnowledgeDocument): Promise<void> {
    await chunkText(knowledgeDoc);
}

export async function markIngestionFailure(knowledgeDocId: string): Promise<void> {
    await prisma.knowledgeDocument.update({
        where: {
            id: knowledgeDocId 
        },
        data: {
            status: KnowledgeDocumentStatus.FAILED
        }
    });

    await prisma.knowledgeDocumentChunk.deleteMany({
        where: {
            documentId: knowledgeDocId
        }
    });
}

export async function deleteKnowledgeDocument(knowledgeDocId: string): Promise<void> {
    const knowledgeDoc = await getKnowledgeDoc(knowledgeDocId);
    await prisma.knowledgeDocument.delete({
        where: {
            id: knowledgeDocId
        }
    });
    await deleteFile(knowledgeDoc.uploadKey);
}