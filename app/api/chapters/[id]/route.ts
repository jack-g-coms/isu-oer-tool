import { auth } from "@/lib/utils/auth";
import { NextRequest } from "next/server";

import withAuth from "@/lib/api/authMiddleware";
import { deleteChapter, getChapter, hasTextbookAccess, updateChapter } from "@/lib/services/textbooks";
import { MAX_CHAPTER_SUMMARY_LENGTH, MAX_CHAPTER_TITLE_LENGTH } from "@/lib/constants/sanity";

async function secretDELETE(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
    try {
        const id = (await params).id;
        const session = await auth();

        const chapter = await getChapter(id);
        if (!chapter) {
            return Response.json(
                { error: "Not found" },
                { status: 404 }
            );
        } else if (!(await hasTextbookAccess(chapter.textbookId, session?.user.id as string))) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        
        await deleteChapter(id);

        return Response.json(
            { success: true },
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

async function secretPUT(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
    try {
        const id = (await params).id;
        const formData = await req.formData();
        
        let title = formData.get("title") as string;
        let summary = formData.get("summary") as string;

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

        const session = await auth();
        const chapter = await getChapter(id);
        if (!chapter) {
            return Response.json(
                { error: "Not found" },
                { status: 404 }
            );
        } else if (!(await hasTextbookAccess(chapter.textbookId, session?.user.id as string))) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const updatedChapter = await updateChapter(id, {
            title,
            summary
        });

        return Response.json(
            { success: true, data: updatedChapter },
            { status: 201 }
        )
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export const PUT = withAuth(secretPUT);
export const DELETE = withAuth(secretDELETE);