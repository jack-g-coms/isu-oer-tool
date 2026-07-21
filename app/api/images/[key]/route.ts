import { NextRequest } from "next/server";

import { getImage, getImageUrl } from "@/lib/services/images";

export async function GET(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
    try {
        const key = (await params).key;

        const image = await getImage(key);
        if (!image) {
            return Response.json(
                { error: "Not found" },
                { status: 404 }
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