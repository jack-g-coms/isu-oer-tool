"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import LoadingOverlay from "../overlays/LoadingOverlay";

type AuthLoaderProps = {
    children: React.ReactNode,
    requiredStatus: "authenticated" | "unauthenticated",
    fallbackRoute: string
};

export default function AuthLoader({ children, requiredStatus, fallbackRoute }: AuthLoaderProps) {
    const router = useRouter();
    const { status } = useSession();

    useEffect(() => {
        if (status != requiredStatus && status != "loading") {
            if (status == "unauthenticated") {
                toast.error("Please sign in to view this page");
            }
            router.replace(fallbackRoute);
        }
    }, [status]);

    return (
        <>
            {status == "loading" &&
                <LoadingOverlay message="Loading Session..."/>
            }

            {status == requiredStatus &&
                children
            }
        </>  
    );
}