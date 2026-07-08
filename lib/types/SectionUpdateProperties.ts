import { Prisma } from "@/prisma/client";

export type SectionUpdateProperties = {
    chapterId: string,
    title: string,
    summary: string,
    order: number,
}

export type SectionContentUpdateProperties = {
    content: Prisma.InputJsonValue
}