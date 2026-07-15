import { auth } from "@/lib/utils/auth";
import { NextRequest } from "next/server";
import { createSection, getChapter, hasTextbookAccess } from "@/lib/services/textbooks";

import withAuth from "@/lib/api/authMiddleware";
import { MAX_SECTION_TITLE_LENGTH, MAX_SECTION_SUMMARY_LENGTH, MAX_SECTIONS_PER_CHAPTER } from "@/lib/constants/sanity";
import { TextbookStatus } from "@/prisma/enums";

async function secretPOST(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
    try {
        const chapterId = (await params).id;
        const formData = await req.formData();
        const session = await auth();

        let title = formData.get("title") as string;
        let summary = formData.get("summary") as string;
        let aiWritten = formData.get("aiWritten") as string;

        const chapter = await getChapter(chapterId, true, true);
        if (!chapter) {
            return Response.json(
                { error: "Not found" },
                { status: 404 }
            );
        } else if (!(await hasTextbookAccess(chapter.textbookId, session?.user.id as string)) || chapter.textbook.status != TextbookStatus.READY) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (chapter.sections.length >= MAX_SECTIONS_PER_CHAPTER) {
            return Response.json(
                { error: "Maximum sections reached in this chapter" },
                { status: 400 }
            );
        }
        if (!title || !summary) {
            return Response.json(
                { error: "Missing information" },
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
        if (summary.length > MAX_SECTION_SUMMARY_LENGTH) {
            return Response.json(
                { error: "Summary is too long" },
                { status: 400 }
            );
        }
        if (title.length > MAX_SECTION_TITLE_LENGTH) {
            return Response.json(
                { error: "Title is too long" },
                { status: 400 }
            );
        }

        const section = await createSection({
            title,
            summary,
            chapterId
        }, 
            aiWritten == "true" ? true : false
        );

        return Response.json(
            { success: true, data: section },
            { status: 201 }
        );
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export const POST = withAuth(secretPOST);