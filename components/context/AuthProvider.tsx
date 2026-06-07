"use client";

import { SessionProvider } from "next-auth/react";

type AuthProviderType = {
    children: React.ReactNode
}

export default function AuthProvider({ children }: AuthProviderType) {
    return (
        <SessionProvider>
            {children}
        </SessionProvider>
    );
}