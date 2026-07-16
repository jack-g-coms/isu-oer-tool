import { Prisma } from "@/prisma/client";

export type SectionUpdateProperties = {
    chapterId?: string,
    title?: string,
    summary?: string
}

export type SectionContentUpdateProperties = {
    content: Prisma.InputJsonValue
}