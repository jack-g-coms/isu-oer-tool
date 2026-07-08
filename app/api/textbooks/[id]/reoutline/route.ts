import { auth } from "@/lib/utils/auth";
import { NextRequest } from "next/server";

import withAuth from "@/lib/api/authMiddleware";
import { textbookQueue } from "@/lib/queues/textbook";
import { TextbookStatus } from "@/prisma/enums";
import { getTextbook, requeueTextbook, hasTextbookAccess } from "@/lib/services/textbooks";

async function secretPOST(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
    try {
        const id = (await params).id;
        const session = await auth();

        const textbook = await getTextbook(id);
        if (!textbook) {
            return Response.json(
                { error: "Not found" },
                { status: 404 }
            );
        } else if (!(await hasTextbookAccess(textbook.id, session?.user.id as string)) || (textbook.status != TextbookStatus.FAILED_OUTLINING && textbook.status != TextbookStatus.READY)) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        await textbookQueue.add("outline-textbook", {
            textbookId: textbook.id
        });

        await requeueTextbook(id);
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