import { auth } from "@/lib/utils/auth";
import { NextRequest } from "next/server";

import { deleteKnowledgeDocument, getKnowledgeDoc, updateKnowledgeDoc } from "@/lib/services/rag";
import withAuth from "@/lib/api/authMiddleware";
import { MAX_CLASS_LENGTH, MAX_DOC_TITLE_LENGTH } from "@/lib/constants/sanity";
import { getUrl } from "@/lib/services/uploads";
import { KnowledgeDocumentStatus } from "@/prisma/enums";

async function secretPUT(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
    try {
        const id = (await params).id;
        const formData = await req.formData();
        
        let title = formData.get("title") as string;
        let className = formData.get("class") as string;

        if (!className || !title) {
            return Response.json(
                { error: "Missing arguments" },
                { status: 400 }
            );
        }
        if (className.length > MAX_CLASS_LENGTH) {
            return Response.json(
                { error: "Class is too long" },
                { status: 400 }
            );
        }
        if (title.trim().length == 0) {
            return Response.json(
                { error: "Title can't be empty" },
                { status: 400 }
            );
        }
        if (title.length > MAX_DOC_TITLE_LENGTH) {
            return Response.json(
                { error: "Title is too long" },
                { status: 400 }
            );
        }
        if (className.length == 0) {
            className = "None";
        }

        const session = await auth();
        const knowledgeDoc = await getKnowledgeDoc(id);
        if (!knowledgeDoc) {
            return Response.json(
                { error: "Not found" },
                { status: 404 }
            );
        } else if (knowledgeDoc.authorId != session?.user.id || knowledgeDoc.status != KnowledgeDocumentStatus.READY) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const updatedKnowledgeDoc = await updateKnowledgeDoc(id, {
            class: className,
            title
        });

        return Response.json(
            { success: true, data: updatedKnowledgeDoc },
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

        const knowledgeDoc = await getKnowledgeDoc(id);
        if (!knowledgeDoc) {
            return Response.json(
                { error: "Not found" },
                { status: 404 }
            );
        } else if (knowledgeDoc.authorId != session?.user.id || knowledgeDoc.status != KnowledgeDocumentStatus.READY) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        await deleteKnowledgeDocument(id);

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

async function secretGET(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
    try {
        const id = (await params).id;
        const session = await auth();

        const knowledgeDoc = await getKnowledgeDoc(id);
        if (!knowledgeDoc) {
            return Response.json(
                { error: "Not found" },
                { status: 404 }
            );
        } else if (knowledgeDoc.authorId != session?.user.id) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const url = await getUrl(knowledgeDoc.uploadKey);
        return Response.json(
            { success: true, data: url },
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
export const GET = withAuth(secretGET);