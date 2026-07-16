import { auth } from "@/lib/utils/auth";
import { NextRequest } from "next/server";

import withAuth from "@/lib/api/authMiddleware";
import { getSection, getChapter, hasTextbookAccess, moveSection } from "@/lib/services/textbooks";
import { TextbookStatus } from "@/prisma/enums";

async function secretPOST(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
    try {
        const id = (await params).id;
        const body = await req.json();

        const { chapterId, targetSectionId, position } = body;

        if (!chapterId || !position || (!targetSectionId && position == "before")) {
            return Response.json(
                { error: "Missing information" },
                { status: 400 }
            );
        }

        const section = await getSection(id);
        const chapter = await getChapter(chapterId, false, true);
        const session = await auth();
        if (
            !chapter || 
            !section || 
            (position != "before" && position != "after") || 
            section.chapter.textbookId != chapter.textbookId
        ) {
            return Response.json(
                { error: "Invalid information" },
                { status: 400 }
            );
        }

        if (targetSectionId) {
            const targetSection = await getSection(targetSectionId);
            if (!targetSection || targetSection.chapterId != chapter.id || section.id == targetSection.id) {
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

        await moveSection(id, chapterId, position, targetSectionId);
       
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

export const POST = withAuth(secretPOST);