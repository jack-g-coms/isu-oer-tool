import { auth } from "@/lib/utils/auth";
import { NextRequest } from "next/server";

import { createTextbook } from "@/lib/services/textbooks";
import withAuth from "@/lib/api/authMiddleware";
import { textbookQueue } from "@/lib/queues/textbook";
import { MAX_TEXTBOOK_DESC_LENGTH, MAX_CLASS_LENGTH, MAX_TEXTBOOK_TITLE_LENGTH, MAX_TEXTBOOK_SOURCES } from "@/lib/constants/sanity";

async function secretPOST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const session = await auth();

        const title = formData.get("title") as string;
        const className = formData.get("class") as string;
        const description = formData.get("description") as string;
        const sources = formData.getAll("sources") as string[];

        if (!title || !description || !className || !sources || sources.length == 0) {
            return Response.json(
                { error: "Missing information" },
                { status: 400 }
            );
        }
        if (className.length > MAX_CLASS_LENGTH) {
            return Response.json(
                { error: "Class is too long" },
                { status: 400 }
            );
        }
        if (title.length > MAX_TEXTBOOK_TITLE_LENGTH) {
            return Response.json(
                { error: "Title is too long" },
                { status: 400 }
            );
        }
        if (title.trim().length == 0) {
            return Response.json(
                { error: "Title can't be empty" },
                { status: 400 }
            );
        }
        if (description.length > MAX_TEXTBOOK_DESC_LENGTH) {
            return Response.json(
                { error: "Description is too long" },
                { status: 400 }
            );
        }
        if (description.trim().length == 0) {
            return Response.json(
                { error: "Description can't be empty" },
                { status: 400 }
            );
        }
        if (sources.length > MAX_TEXTBOOK_SOURCES) {
            return Response.json(
                { error: "Too many sources" },
                { status: 400 }
            );
        }

        const textbook = await createTextbook({
            authorId: session?.user.id as string,
            title,
            description,
            sources,
            class: className
        });

        await textbookQueue.add("outline-textbook", {
            textbookId: textbook.id
        });

        return Response.json(
            { success: true, data: textbook },
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