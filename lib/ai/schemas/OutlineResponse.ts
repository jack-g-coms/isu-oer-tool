import { z } from "zod";

export const OutlineResponse = z.object({
    title: z.string(),
    description: z.string(),
    chapters: z.array(
        z.object({
            title: z.string(),
            summary: z.string(),
            order: z.number(),
            sections: z.array(
                z.object({
                    title: z.string(),
                    order: z.number()
                })
            )
        })
    )
});