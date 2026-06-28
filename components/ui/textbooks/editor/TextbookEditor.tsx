"use client";

import TextbookWithSections from "@/lib/types/TextbookWithSections";
import type { Section, Chapter, Textbook } from "@/prisma/client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Swal from "sweetalert2";

type TextbookEditorProps = {
    chapterView: Chapter | undefined,
    sectionView: Section | undefined,
    views: Record<string, Chapter & { sections: Record<string, Section> }> | undefined,
    textbook: Textbook | undefined,
    loadError: boolean
};

export default function TextbookEditor({ loadError, chapterView, sectionView, textbook }: TextbookEditorProps) {
    const router = useRouter();
    
    useEffect(() => {
        if (loadError) {
            Swal.fire({
                title: "Error",
                text: "Textbook doesn't exist or you don't have permissions to edit it.",
                icon: "error",
                showCancelButton: false
            }).then(() => {
                router.push("/textbooks");
            });
        }
    }, [loadError]);

    if (!textbook || loadError) return;

    return (
        <></>
    );
}