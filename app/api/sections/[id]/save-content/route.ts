import { auth } from "@/lib/utils/auth";
import { NextRequest } from "next/server";
import { SectionStatus } from "@/prisma/enums";

import { getSection, updateSection, hasTextbookAccess } from "@/lib/services/textbooks";
import { validateTipTapJSON } from "@/lib/utils/tiptap-validation";
import withAuth from "@/lib/api/authMiddleware";

async function secretPATCH(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
    try {
        const sectionId = (await params).id;
        const session = await auth();
        const body = await req.json();
        
        const { content } = body;
        if (!content || !validateTipTapJSON(content)) {
            return Response.json(
                { error: "Invalid content" },
                { status: 400 }
            );
        }

        const section = await getSection(sectionId);
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

        const updatedSection = await updateSection(sectionId, {
            content
        });

        return Response.json(
            { success: true, data: updatedSection },
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

export const PATCH = withAuth(secretPATCH);