import { User } from "@/prisma/client"

declare module "next-auth" {
    interface Session {
        user: User 
    }
}

export type DevSSOUser = {
    id: string,
    name: string,
    email: string,
    department: string
}
