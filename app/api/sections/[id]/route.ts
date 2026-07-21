import { auth } from "@/lib/utils/auth";
import { NextRequest } from "next/server";

import withAuth from "@/lib/api/authMiddleware";
import { getSection, hasTextbookAccess, deleteSection, getChapter, updateSection } from "@/lib/services/textbooks";
import { SectionStatus } from "@/prisma/enums";
import { MAX_SECTION_SUMMARY_LENGTH, MAX_SECTION_TITLE_LENGTH } from "@/lib/constants/sanity";

async function secretDELETE(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
    try {
        const id = (await params).id;
        const session = await auth();

        const section = await getSection(id);
        if (!section) {
            return Response.json(
                { error: "Not found" },
                { status: 404 }
            );
        } else if (!(await hasTextbookAccess(section.chapter.textbookId, session?.user.id as string)) || section.status != SectionStatus.READY) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        await deleteSection(id);

        return Response.json(
            { success: true },
            { status: 200 }
        );
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

async function secretPUT(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
    try {
        const id = (await params).id;
        const formData = await req.formData();

        let chapterId = formData.get("chapterId") as string;
        let title = formData.get("title") as string;
        let summary = formData.get("summary") as string;

        if (!chapterId || !title || !summary) {
            return Response.json(
                { error: "Missing information" },
                { status: 400 }
            );
        }
        if (chapterId.trim().length == 0) {
            return Response.json(
                { error: "Invalid chapter" },
                { status: 400 }
            );
        }
        if (title.length > MAX_SECTION_TITLE_LENGTH) {
            return Response.json(
                { error: "Title is too long" },
                { status: 400 }
            );
        }
        if (summary.length > MAX_SECTION_SUMMARY_LENGTH) {
            return Response.json(
                { error: "Summary is too long" },
                { status: 400 }
            );
        }
        if (title.trim().length == 0) {
            return Response.json(
                { error: "Title can't be empty" },
                { status: 400 }
            );
        }
        if (summary.trim().length == 0) {
            return Response.json(
                { error: "Summary can't be empty" },
                { status: 400 }
            );
        }

        const chapter = getChapter(chapterId);
        if (!chapter) {
            return Response.json(
                { error: "Invalid chapter" },
                { status: 400 }
            );
        }

        const session = await auth();
        const section = await getSection(id);
        if (!section) {
            return Response.json(
                { error: "Not found" },
                { status: 404 }
            );
        } else if (!(await hasTextbookAccess(section.chapter.textbookId, session?.user.id as string)) || section.status != SectionStatus.READY) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const updatedSection = await updateSection(id, {
            chapterId,
            title,
            summary
        });

        return Response.json(
            { success: true, data: updatedSection },
            { status: 200 }
        );
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export const DELETE = withAuth(secretDELETE);
export const PUT = withAuth(secretPUT);