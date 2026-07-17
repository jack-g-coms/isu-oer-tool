import { auth } from "@/lib/utils/auth";
import { NextRequest } from "next/server";
import { SectionStatus } from "@/prisma/enums";

import withAuth from "@/lib/api/authMiddleware";
import { getImage, getImageUrl } from "@/lib/services/images";
import { hasTextbookAccess } from "@/lib/services/textbooks";

async function secretGET(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
    try {
        const session = await auth();
        const key = (await params).key;

        const image = await getImage(key);
        if (!image) {
            return Response.json(
                { error: "Not found" },
                { status: 404 }
            );
        } else if (!(await hasTextbookAccess(image.section.chapter.textbookId, session?.user.id as string)) || image.section.status != SectionStatus.READY) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const url = await getImageUrl(key);
        return Response.redirect(
            url,
            302
        );
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export const GET = withAuth(secretGET);