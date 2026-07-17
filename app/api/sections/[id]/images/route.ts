import { auth } from "@/lib/utils/auth";
import { NextRequest } from "next/server";
import { SectionStatus } from "@/prisma/enums";

import withAuth from "@/lib/api/authMiddleware";

import { MAX_FILE_SIZE } from "@/lib/utils/tiptap-utils";
import { ALLOWED_IMAGE_TYPES } from "@/lib/constants/sanity";
import { getSection, hasTextbookAccess } from "@/lib/services/textbooks";
import { uploadImage } from "@/lib/services/images";

async function secretPOST(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
    try {
        const sectionId = (await params).id;
        const session = await auth();
        const formData = await req.formData();

        const file = formData.get("image");
        if (!(file instanceof File)) {
            return Response.json(
                { error: "Image is required" },
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

        if (file.size > MAX_FILE_SIZE) {
            return Response.json(
                { error: `Image must be smaller than ${MAX_FILE_SIZE / (1024 * 1024)} MB`},
                { status: 400 }
            );
        }
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return Response.json(
                { error: "Unsupported image type" },
                { status: 400 }
            );
        }

        const image = await uploadImage(file, sectionId);
        const url = new URL(`/api/images/${image.uploadKey}`, new URL(req.url).origin);

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

export const POST = withAuth(secretPOST);