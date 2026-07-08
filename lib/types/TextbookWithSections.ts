import { Prisma } from "@/prisma/client";

type TextbookWithSections = Prisma.TextbookGetPayload<{
    include: {
        chapters: {
            include: {
                sections: true;
            }
        },
        sources: true
    }
}>;

export default TextbookWithSections;