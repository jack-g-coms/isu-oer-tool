import { auth } from "@/lib/utils/auth";
import { NextRequest } from "next/server";
import { createChapter, getTextbook, hasTextbookAccess } from "@/lib/services/textbooks";

import withAuth from "@/lib/api/authMiddleware";
import { MAX_CHAPTER_SUMMARY_LENGTH, MAX_CHAPTER_TITLE_LENGTH, MAX_CHAPTERS } from "@/lib/constants/sanity";
import { TextbookStatus } from "@/prisma/enums";

async function secretPOST(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
    try {
        const textbookId = (await params).id;
        const formData = await req.formData();
        const session = await auth();

        let title = formData.get("title") as string;
        let summary = formData.get("summary") as string;

        const textbook = await getTextbook(textbookId, false, false, true);
        if (!textbook) {
            return Response.json(
                { error: "Not found" },
                { status: 404 }
            );
        } else if (!(await hasTextbookAccess(textbookId, session?.user.id as string)) || textbook.status != TextbookStatus.READY) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (textbook.chapters.length >= MAX_CHAPTERS) {
            return Response.json(
                { error: "Maximum chapters reached" },
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
        if (summary.length > MAX_CHAPTER_SUMMARY_LENGTH) {
            return Response.json(
                { error: "Summary is too long" },
                { status: 400 }
            );
        }
        if (title.length > MAX_CHAPTER_TITLE_LENGTH) {
            return Response.json(
                { error: "Title is too long" },
                { status: 400 }
            );
        }

        const chapter = await createChapter({
            title,
            summary,
            textbookId
        });

        return Response.json(
            { success: true, data: chapter },
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