import { NextRequest } from "next/server";
import { auth } from "@/lib/utils/auth";

type Handler = (req: NextRequest, context?: any) => Promise<Response>;

export default function withAuth(handler: Handler): Handler {
    return async (req, context) => {
        const session = await auth();
        if (!session || !session.user) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        return handler(req, context);
    };
}