import prisma from "../db/prisma";
import { z } from "zod";

import { Textbook, TextbookStatus, Section, SectionStatus, Chapter } from "@/prisma/client";
import TextbookProperties from "../types/TextbookProperties";
import { getRelevantChunks } from "./rag";
import { chat } from "./ai";
import { sectionQueue } from "../queues/section";

import { OUTLINE_PROMPT, OUTLINE_QUERY, OUTLINE_SYSTEM_PROMPT } from "../ai/prompts/TextbookOutline";
import { OutlineResponse } from "../ai/schemas/OutlineResponse";
import { FULL_WRITE_QUERY, FULL_WRITE_SYSTEM_PROMPT, FULL_WRITE_PROMPT } from "../ai/prompts/TextbookFullWrite";
import { SectionContentResponse } from "../ai/schemas/SectionContentResponse";
import TextbookUpdateProperties from "../types/TextbookUpdateProperties";
import { TextbookWhereInput } from "@/prisma/models";
import { SectionUpdateProperties, SectionContentUpdateProperties } from "../types/SectionUpdateProperties";
import ChapterProperties from "../types/ChapterProperties";
import SectionProperties from "../types/SectionProperties";
import ChapterUpdateProperties from "../types/ChapterUpdateProperties";
import TiptapNode from "../types/TiptapNode";
import { deleteImage } from "./images";

// Private
async function updateTextbookStatus(textbookId: string, status: TextbookStatus): Promise<Textbook> {
    return await prisma.textbook.update({
        where: {
            id: textbookId
        },
        data: {
            status: status
        }
    });
}

async function updateSectionStatus(sectionId: string, status: SectionStatus): Promise<Section> {
    return await prisma.section.update({
        where: {
            id: sectionId
        },
        data: {
            status: status
        }
    });
}

function buildPrompt(template: string, fields: Record<string, any>): string {
    let result = template;
    for (const field in fields) {
        result = result.replace(
            `{{${field}}}`,
            String(fields[field])
        )
    }
    return result;
}

// Public
export async function getTextbook(textbookId: string, includeAuthor: boolean=false, includeSources: boolean=false, includeChapters: boolean=false) {
    return await prisma.textbook.findFirst({
        where: {
            id: textbookId
        },
        include: {
            author: includeAuthor,
            sources: includeSources,
            chapters: includeChapters ? {
                orderBy: {
                    order: "asc"
                }
            } : false
        }
    });
}

export async function getTextbookWithSections(textbookId: string, includeAuthor: boolean=false, includeSources: boolean=false) {
    return await prisma.textbook.findFirst({
        where: {
            id: textbookId
        },
        include: {
            author: includeAuthor,
            sources: includeSources,
            chapters: {
                include: {
                    sections: {
                        orderBy: {
                            order: "asc"
                        }
                    }
                },
                orderBy: {
                    order: "asc"
                }
            }
        }
    });
}

export async function createTextbook(properties: TextbookProperties): Promise<Textbook> {
    return await prisma.textbook.create({
        data: {
            title: properties.title,
            authorId: properties.authorId,
            description: properties.description,
            class: properties.class,
            sources: {
                connect: properties.sources.map(sourceId => ({
                    id: sourceId
                }))
            }
        }
    });
}

export async function createChapter(properties: ChapterProperties): Promise<Chapter> {
    const textbook = await getTextbook(properties.textbookId, false, false, true);
    return await prisma.chapter.create({
        data: {
            title: properties.title,
            summary: properties.summary,
            order: textbook!.chapters[textbook!.chapters.length - 1].order + 1,
            textbookId: properties.textbookId
        }
    });
}

export async function createSection(properties: SectionProperties, aiWritten: boolean=true): Promise<Section> {
    const chapter = await getChapter(properties.chapterId, true);
    const section = await prisma.section.create({
        data: {
            title: properties.title,
            summary: properties.summary,
            order: chapter!.sections[chapter!.sections.length - 1].order + 1,
            chapterId: properties.chapterId,
            status: !aiWritten ? SectionStatus.READY : SectionStatus.QUEUED
        }
    });

    if (aiWritten) {
        await sectionQueue.add("write-section", {
            sectionId: section.id
        });
    }

    return section;
}

export async function getUserTextbooks(
    authorId: string,
    includeSources: boolean=true,
    search?: string,
    status?: TextbookStatus,
    page: number=1,
    limit: number=16
) {
    const where: TextbookWhereInput = {
        authorId,
        ...(status && {
            status: status
        }),
        ...(search && {
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { class: { contains: search, mode: "insensitive" } }
            ]
        })
    };

    const [textbooks, total] = await prisma.$transaction([
        prisma.textbook.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                sources: includeSources,
                chapters: {
                    include: {
                        sections: true
                    }
                }
            },
            orderBy: {
                updatedAt: "desc"
            }
        }),

        prisma.textbook.count({
            where
        })
    ]);

    return {
        data: textbooks.sort((a, b) => {
            if (a.status == TextbookStatus.FAILED_OUTLINING && b.status != TextbookStatus.FAILED_OUTLINING) return -1;
            if (a.status != TextbookStatus.FAILED_OUTLINING && b.status == TextbookStatus.FAILED_OUTLINING) return 1;
            return 0;
        }),
        total
    };
}

export async function requeueSection(sectionId: string): Promise<Section> {
    return await prisma.section.update({
        where: { id: sectionId },
        data: {
            status: SectionStatus.QUEUED
        }
    });
}

export async function requeueTextbook(textbookId: string): Promise<Textbook> {
    await prisma.chapter.deleteMany({
        where: {
            textbookId
        }
    });

    return await prisma.textbook.update({
        where: { id: textbookId },
        data: {
            status: TextbookStatus.QUEUED
        }
    });
}

export async function outlineTextbook(textbookId: string): Promise<void> {
    const textbook = await getTextbook(textbookId, false, true, false);
    await updateTextbookStatus(textbookId, TextbookStatus.OUTLINING);

    const sourceIds = textbook!.sources.map(source => source.id);
    const chunks = await getRelevantChunks(sourceIds, OUTLINE_QUERY);
    
    const prompt = buildPrompt(OUTLINE_PROMPT, {
        "chunks": chunks.map(c => c.text).join("\n\n")
    });
    const response = await chat(OUTLINE_SYSTEM_PROMPT, prompt, z.toJSONSchema(OutlineResponse));
    const formattedResponse = OutlineResponse.parse(JSON.parse(response));

    for (const chapter of formattedResponse.chapters) {
        const dataChapter = await prisma.chapter.create({
            data: {
                textbookId,
                title: chapter.title,
                summary: chapter.summary,
                order: chapter.order
            }
        });

        await prisma.section.createMany({
            data: chapter.sections.map((section) => ({
                chapterId: dataChapter.id,
                title: section.title,
                summary: section.summary,
                order: section.order
            }))
        });
    }
    await updateTextbookStatus(textbookId, TextbookStatus.READY);
}

export async function writeFullTextbook(textbookId: string): Promise<void> {
    const textbook = await getTextbookWithSections(textbookId, false, true);
    if (textbook!.status != TextbookStatus.READY) {
        throw new Error("Textbook must be outlined before it can be written.");
    }

    for (const chapter of textbook!.chapters) {
        for (const section of chapter.sections) {
            await sectionQueue.add("write-section", {
                sectionId: section.id
            });
        }
    }
}

export async function getSection(sectionId: string) {
    return await prisma.section.findFirst({
        where: {
            id: sectionId
        },
        include: {
            chapter: {
                include: {
                    textbook: {
                        include: {
                            sources: true
                        }
                    }
                }
            }
        }
    });
}

export async function writeSection(sectionId: string): Promise<void> {
    const section = await getSection(sectionId);

    await updateSectionStatus(sectionId, SectionStatus.WRITING);
    const sourceIds = section?.chapter.textbook.sources.map(source => source.id);

    const query = buildPrompt(FULL_WRITE_QUERY, {
        "topic": section?.chapter.textbook.title,
        "chapter": section?.chapter.title,
        "chapterSummary": section?.chapter.summary,
        "section": section?.title,
        "sectionSummary": section?.summary
    });
    const chunks = await getRelevantChunks(sourceIds!, query, 5);
    const prompt = buildPrompt(FULL_WRITE_PROMPT, {
        "textbookTitle": section?.chapter.textbook.title,
        "chapterTitle": section?.chapter.title,
        "sectionTitle": section?.title,
        "sectionSummary": section?.summary,
        "chunks": chunks.map(c => c.text).join("\n\n")
    });
    console.log(prompt);

    const response = await chat(FULL_WRITE_SYSTEM_PROMPT, prompt, z.toJSONSchema(SectionContentResponse));
    console.log(response);
    const formattedResponse = SectionContentResponse.parse(JSON.parse(response));

    console.log(JSON.stringify(formattedResponse, null, 2));

    await prisma.section.update({
        where: {
            id: sectionId
        },
        data: {
            content: formattedResponse,
            status: SectionStatus.READY
        }
    });
}

export async function updateTextbook(textbookId: string, properties: TextbookUpdateProperties): Promise<Textbook> {
    return await prisma.textbook.update({
        where: { id: textbookId },
        data: {
            sources: {
                set: properties.sources.map(sourceId => ({
                    id: sourceId
                }))
            },
            title: properties.title,
            description: properties.description,
            class: properties.class
        }
    });
}

export async function updateSection(sectionId: string, properties: SectionUpdateProperties | SectionContentUpdateProperties): Promise<Section> {
    return await prisma.section.update({
        where: {
            id: sectionId
        },
        data: properties
    });
}

export async function cleanupContentImages(content: TiptapNode, sectionId: string): Promise<void> {
    let uploadKeys: string[] = [];

    function walk(node: TiptapNode) {
        if (node.type == "image") {
            let splitSrc = (node.attrs?.src as string).split("/api/images/");
            let uploadKey = splitSrc[1];
            uploadKeys.push(uploadKey);
        }

        if (node.content) {
            for (const child of node.content) {
                walk(child);
            }
        }
    }
    walk(content);

    const images = await prisma.image.findMany({
        where: {
            sectionId
        }
    });
    for (const image of images) {
        if (!uploadKeys.includes(image.uploadKey)) {
            await deleteImage(image.uploadKey);
        }
    }
}

export async function moveSection(
    sectionId: string,
    chapterId: string,
    position: "before" | "after",
    targetSectionId?: string
) {
    return prisma.$transaction(async (tx) => {
        const section = await tx.section.findUniqueOrThrow({
            where: {
                id: sectionId
            }
        });

        const oldChapterId = section.chapterId;
        let sections = await tx.section.findMany({
            where: {
                chapterId
            },
            orderBy: {
                order: "asc"
            }
        });

        sections = sections.filter(
            s => s.id != sectionId
        );
        let insertIndex = sections.length;

        if (targetSectionId) {
            const targetIndex = sections.findIndex(
                s => s.id == targetSectionId
            );

            insertIndex = position == "before"
                ? targetIndex
                : targetIndex + 1;
        }

        sections.splice(insertIndex, 0, {
            ...section,
            chapterId
        });

        await Promise.all(
            sections.map((section, index) =>
                tx.section.update({
                    where: {
                        id: section.id
                    },
                    data: {
                        chapterId,
                        order: index
                    }
                })
            )
        );

        if (oldChapterId != chapterId) {
            const oldSections = await tx.section.findMany({
                where: {
                    chapterId: oldChapterId
                },
                orderBy: {
                    order: "asc"
                }
            });

            await Promise.all(
                oldSections.map((section, index) =>
                    tx.section.update({
                        where: {
                            id: section.id
                        },
                        data: {
                            order: index
                        }
                    })
                )
            );
        }
    });
}

export async function moveChapter(
    chapterId: string,
    position: "before" | "after",
    targetChapterId?: string
) {
    return prisma.$transaction(async (tx) => {
        const chapter = await tx.chapter.findUniqueOrThrow({
            where: {
                id: chapterId
            }
        });
        let chapters = await tx.chapter.findMany({
            where: {
                textbookId: chapter.textbookId
            },
            orderBy: {
                order: "asc"
            }
        });

        chapters = chapters.filter(
            c => c.id != chapter.id
        );
        let insertIndex = chapters.length;

        if (targetChapterId) {
            const targetIndex = chapters.findIndex(
                c => c.id == targetChapterId
            );

            insertIndex = position == "before"
                ? targetIndex
                : targetIndex + 1;
        }
        chapters.splice(insertIndex, 0, chapter);

        await Promise.all(
            chapters.map((chapter, index) =>
                tx.chapter.update({
                    where: {
                        id: chapter.id
                    },
                    data: {
                        order: index
                    }
                })
            )
        );
    });
}

export async function updateChapter(chapterId: string, properties: ChapterUpdateProperties): Promise<Chapter> {
    return await prisma.chapter.update({
        where: {
            id: chapterId
        },
        data: properties
    });
}

export async function getChapter(chapterId: string, includeSections: boolean=false, includeTextbook: boolean=false) {
    return await prisma.chapter.findFirst({
        where: {
            id: chapterId
        },
        include: {
            sections: includeSections ? {
                orderBy: {
                    order: "asc"
                }
            } : false,
            textbook: includeTextbook
        }
    });
}

export async function deleteSection(sectionId: string) {
    return await prisma.section.delete({
        where: {
            id: sectionId
        }
    });
}

export async function deleteChapter(chapterId: string) {
    return await prisma.chapter.delete({
        where: {
            id: chapterId
        }
    });
}

export async function markOutlineFailure(textbookId: string): Promise<void> {
    await prisma.textbook.update({
        where: {
            id: textbookId 
        },
        data: {
            status: TextbookStatus.FAILED_OUTLINING
        }
    });

    await prisma.chapter.deleteMany({
        where: {
            textbookId: textbookId
        }
    });
}

export async function markSectionFailure(sectionId: string, failureType: SectionStatus): Promise<void> {
    await prisma.section.update({
        where: {
            id: sectionId 
        },
        data: {
            status: failureType
        }
    });
}

export async function deleteTextbook(textbookId: string): Promise<void> {
    await prisma.textbook.delete({
        where: {
            id: textbookId
        }
    });
}

export async function hasTextbookAccess(textbookId: string, userId: string): Promise<boolean> {
    const textbook = await getTextbook(textbookId, false, false, false);
    return textbook!.authorId == userId;
}