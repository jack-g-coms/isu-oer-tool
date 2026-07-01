"use client";

import TextbookWithSections from "@/lib/types/TextbookWithSections";
import type { Section, Chapter } from "@/prisma/client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { SimpleEditor } from "../../input/tiptap/tiptap-templates/simple/simple-editor";
import type { Content, Editor } from "@tiptap/core";

type TextbookEditorProps = {
    chapterView: Chapter | undefined,
    sectionView: Section | undefined,
    views: Record<string, Chapter & { sections: Record<string, Section> }> | undefined,
    textbook: TextbookWithSections | undefined,
    loadError: boolean
};

export default function TextbookEditor({ loadError, chapterView, sectionView, textbook }: TextbookEditorProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    
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

    async function handleSave(content: Content, editor: Editor) {
        if (saving) return;
        setSaving(true);
        editor.setEditable(false);
    }

    return (
        <>
            {sectionView &&
                <SimpleEditor
                    initialContent={sectionView.content as Content}
                    saving={saving}
                    onSave={handleSave}
                />
            }
        </>
    );
}