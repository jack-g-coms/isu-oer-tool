import { auth } from "@/lib/utils/auth";
import { NextRequest } from "next/server";

import withAuth from "@/lib/api/authMiddleware";
import { getTextbook, getTextbookWithSections, hasTextbookAccess } from "@/lib/services/textbooks";
import { TextbookStatus } from "@/prisma/enums";
import { generateTextbookPDF, getPublishedPDF, unpublishTextbookPDF } from "@/lib/services/publish";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
    try {
        const id = (await params).id;

        const textbook = await getTextbook(id);
        if (!textbook) {
            return Response.json(
                { error: "Not found" },
                { status: 404 }
            );
        } 

        if (!textbook.publishedUploadKey) {
            return Response.json(
                { error: "Textbook has not been published" },
                { status: 404 }
            );
        }

        const pdf = await getPublishedPDF(id);
        const file = new File(
            [Buffer.from(pdf)],
            `${textbook.title}.pdf`,
            { type: "application/pdf "}
        )
        
        return new Response(file, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="${encodeURIComponent(`${textbook.title}.pdf`)}"`,
            }
        });
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

async function secretPOST(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
    try {
        const id = (await params).id;
        const session = await auth();

        const textbook = await getTextbookWithSections(id);
        if (!textbook) {
            return Response.json(
                { error: "Not found" },
                { status: 404 }
            );
        } else if (!(await hasTextbookAccess(textbook.id, session?.user.id as string)) || textbook.status != TextbookStatus.READY) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const canDeleteSections = textbook?.chapters.every(chapter => 
            chapter.sections.every(section => section.status == "READY" || section.status == "FAILED_REFINING" || section.status == "FAILED_WRITING")
        );
        if (!canDeleteSections) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        await generateTextbookPDF(id, false);
        const url = new URL(`/api/textbooks/${id}/publish`, new URL(req.url).origin);

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
        } else if (!(await hasTextbookAccess(textbook.id, session?.user.id as string)) || textbook.status != TextbookStatus.READY) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (!textbook.publishedUploadKey) {
            return Response.json(
                { error: "Textbook has never been published" },
                { status: 400 }
            );
        }

        await unpublishTextbookPDF(id);
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
export const DELETE = withAuth(secretDELETE);