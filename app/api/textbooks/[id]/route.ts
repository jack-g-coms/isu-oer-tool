import { auth } from "@/lib/utils/auth";
import { NextRequest } from "next/server";

import withAuth from "@/lib/api/authMiddleware";
import { MAX_TEXTBOOK_DESC_LENGTH, MAX_CLASS_LENGTH, MAX_TEXTBOOK_TITLE_LENGTH, MAX_TEXTBOOK_SOURCES } from "@/lib/constants/sanity";
import { deleteTextbook, getTextbook, updateTextbook } from "@/lib/services/textbooks";
import { TextbookStatus } from "@/prisma/enums";

async function secretPUT(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
    try {
        const id = (await params).id;
        const formData = await req.formData();
        
        let title = formData.get("title") as string;
        let description = formData.get("description") as string;
        let sources = formData.getAll("sources") as string[];
        let className = formData.get("class") as string;

        if (!title || !className || !description || !sources || sources.length == 0) {
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
        if (className.length == 0) {
            className = "None";
        }

        const session = await auth();
        const textbook = await getTextbook(id);
        if (!textbook) {
            return Response.json(
                { error: "Not found" },
                { status: 404 }
            );
        } else if (textbook.authorId != session?.user.id || textbook.status != TextbookStatus.READY) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const updatedTextbook = await updateTextbook(id, {
            title,
            description,
            sources, 
            class: className
        });

        return Response.json(
            { success: true, data: updatedTextbook },
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

async function secretDELETE(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
    try {
        const id = (await params).id;

        const session = await auth();
        const textbook = await getTextbook(id);
        if (!textbook) {
            return Response.json(
                { error: "Not found" },
                { status: 404 }
            );
        } else if (textbook.authorId != session?.user.id || textbook.status != TextbookStatus.READY) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        await deleteTextbook(id);

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

export const PUT = withAuth(secretPUT);
export const DELETE = withAuth(secretDELETE);