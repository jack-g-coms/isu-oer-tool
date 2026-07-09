import { auth } from "@/lib/utils/auth";
import { NextRequest } from "next/server";

import withAuth from "@/lib/api/authMiddleware";
import { sectionQueue } from "@/lib/queues/section";
import { getSection, hasTextbookAccess, requeueSection } from "@/lib/services/textbooks";
import { SectionStatus } from "@/prisma/enums";

async function secretPOST(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
    try {
        const id = (await params).id;
        const session = await auth();

        const section = await getSection(id);
        if (!section) {
            return Response.json(
                { error: "Not found" },
                { status: 404 }
            );
        } else if (!(await hasTextbookAccess(section.chapter.textbookId, session?.user.id as string)) || (section.status != SectionStatus.READY && section.status != SectionStatus.FAILED_WRITING)) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        await sectionQueue.add("write-section", {
            sectionId: section.id
        });

        await requeueSection(section.id);
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