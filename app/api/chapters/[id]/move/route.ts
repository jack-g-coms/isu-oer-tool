import { auth } from "@/lib/utils/auth";
import { NextRequest } from "next/server";

import withAuth from "@/lib/api/authMiddleware";
import { getSection, getChapter, hasTextbookAccess, moveSection, moveChapter } from "@/lib/services/textbooks";
import { TextbookStatus } from "@/prisma/enums";

async function secretPOST(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
    try {
        const id = (await params).id;
        const body = await req.json();

        const { targetChapterId, position } = body;

        if (!position || (!targetChapterId && position == "before")) {
            return Response.json(
                { error: "Missing information" },
                { status: 400 }
            );
        }

        const chapter = await getChapter(id, false, true);
        const session = await auth();
        if (!chapter || position != "before" && position != "after") {
            return Response.json(
                { error: "Invalid information" },
                { status: 400 }
            );
        }

        if (targetChapterId) {
            const targetChapter = await getChapter(targetChapterId);
            if (!targetChapter || targetChapter.textbookId != chapter.textbookId) {
                return Response.json(
                    { error: "Invalid information" },
                    { status: 400 }
                );
            }
        }

        if (!(await hasTextbookAccess(chapter.textbookId, session?.user.id as string)) || chapter.textbook.status != TextbookStatus.READY) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        await moveChapter(id, position, targetChapterId);
       
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

export const POST = withAuth(secretPOST);