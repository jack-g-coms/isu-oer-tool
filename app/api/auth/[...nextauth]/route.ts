import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/db/prisma";

import { DevSSOUser } from "@/lib/types/NextAuth";

const handler = NextAuth({
    providers: [
        Credentials({
            name: "Dev Iowa State SSO",
            credentials: {
                email: { label: "Iowa State Email", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.email) return null;

                // Simulate a SSO User
                return {
                    id: `dev-${credentials.email}`,
                    name: "Dr. Professor",
                    email: credentials.email,
                    department: "Computer Science"
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            // SSO User is given by a provider, we now interpret it and set up the token as well as update our personal DB.
            if (user) {
                const ssoUser = user as DevSSOUser;
                const dbUser = await prisma.user.upsert({
                    where: { email: ssoUser.email },
                    update: {
                        image: "/images/jack-img.jpg",
                        name: ssoUser.name,
                        department: ssoUser.department
                    },
                    create: {
                        name: ssoUser.name,
                        email: ssoUser.email,
                        department: ssoUser.department
                    }
                });

                token.id = dbUser.id;
                token.name = dbUser.name;
                token.email = dbUser.email;
                token.department = dbUser.department;
                token.image = dbUser.image;
            }
            return token;
        },

        async session({ session, token }) {
            // Token is set up, what needs to be revealed to the frontend?
            session.user.id = token.id as string;
            session.user.name = token.name as string;
            session.user.email = token.email as string;
            session.user.department = token.department as string;
            session.user.image = token.image as string;
            return session;
        }
    },
    session: { strategy: "jwt" }
});

export { handler as GET, handler as POST }