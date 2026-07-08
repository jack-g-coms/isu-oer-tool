"use client";

import TextbookWithSections from "@/lib/types/TextbookWithSections";
import type { Section, Chapter } from "@/prisma/client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { useModalStore } from "@/components/stores/Modals";

import { SimpleEditor } from "../../input/tiptap/tiptap-templates/simple/simple-editor";
import type { Content, Editor } from "@tiptap/core";
import { saveContent, deleteSection, rewrite } from "@/lib/api/sections";
import { Brain, RotateCcw } from "lucide-react";
import Button from "../../input/Button";
import UpdateSectionModal from "../../modals/UpdateSectionModal";


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
    const [deleting, setDeleting] = useState(false);
    const [rewriting, setRewriting] = useState(false);

    const open = useModalStore((state) => state.open);
    
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

    useEffect(() => {
        if (!sectionView || sectionView.status == "READY" || sectionView.status == "FAILED_WRITING" || sectionView.status == "FAILED_REFINING") return;

        const interval = setInterval(() => {
            router.refresh();
        }, 10000);

        return () => clearInterval(interval);
    }, [sectionView])

    if (!textbook || loadError) return;

    async function handleSave(content: Content, editor: Editor) {
        if (saving || deleting || rewriting || !sectionView) return;
        setSaving(true);
        editor.setEditable(false);

        try {
            const res = await saveContent(sectionView.id, editor.getJSON());
            router.refresh();
            toast.success("Success");
        } catch (err) {
            if (err instanceof Error) {
                toast.error(`Failed: ${err.message}`);
            } else {
                toast.error("Failed: Unknown error");
            }
        } finally {
            setSaving(false);
            editor.setEditable(true);
        }
    }

    async function handleDelete() {
        if (saving || deleting || rewriting || (!sectionView && !chapterView)) return;
        
        Swal.fire({
            title: "Are you sure?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true
        })
        .then(async (result) => {
            if (result.isConfirmed) {
                setDeleting(true);

                try {
                    let res;
                    if (sectionView) {
                        res = await deleteSection(sectionView.id);
                    } else {
                        // Delete chapter
                    }

                    router.refresh();
                    toast.success("Success");
                } catch (err) {
                    if (err instanceof Error) {
                        toast.error(`Failed: ${err.message}`);
                    } else {
                        toast.error("Failed: Unknown error");
                    }
                } finally {
                    setDeleting(false);
                }
            }
        });
    }

    async function handleRewrite() {
        if (saving || deleting || rewriting || !sectionView) return;
        
        Swal.fire({
            title: "Are you sure?",
            text: "All of your current writing will be lost. This action cannot be undone.",
            icon: "warning",
            showCancelButton: true
        })
        .then(async (result) => {
            if (result.isConfirmed) {
                confirmRewrite();
            }
        });
    }

    async function handleEdit() {
        if (saving || deleting || rewriting) return;

        if (sectionView) {
            open(UpdateSectionModal, {
                initialData: sectionView
            });
        }
    }

    async function confirmRewrite() {
        if (saving || deleting || rewriting || !sectionView) return;
        setRewriting(true);

        try {
            const res = await rewrite(sectionView.id);
            router.refresh();
            toast.success("Success");
            toast("Your section is being rewritten from scratch. Check on its status in the Textbook Editor!", {
                duration: 10000
            });
        } catch (err) {
            if (err instanceof Error) {
                toast.error(`Failed: ${err.message}`);
            } else {
                toast.error("Failed: Unknown error");
            }
        } finally {
            setRewriting(false);
        }
    }

    return (
        <>
            {sectionView && sectionView.status == "READY" &&
                <SimpleEditor
                    initialContent={sectionView.content as Content}
                    saving={saving}
                    onSave={handleSave}

                    deleting={deleting}
                    onDelete={handleDelete}

                    rewriting={rewriting}
                    onRewrite={handleRewrite}

                    onEdit={handleEdit}
                />
            }

            {sectionView && (sectionView.status == "WRITING" || sectionView.status == "QUEUED") &&
                <div className="flex flex-col gap-6 items-center justify-center p-8 h-[calc(100vh-64px-64px)]">
                    <Brain height={175} width={175} className="text-[var(--isu-gold)] animate-shake"/>
                    <h2 className="text-xl md:text-2xl font-semibold text-center">
                        This section is actively being written or refined by AI, check back soon!
                    </h2>
                </div>
            }

            {sectionView && sectionView.status == "FAILED_WRITING" &&
                <div className="flex flex-col gap-6 items-center justify-center p-8 h-[calc(100vh-64px-64px)]">
                    <Brain height={175} width={175} className="text-[var(--isu-gold)]"/>
                    <h2 className="text-xl md:text-2xl font-semibold text-center">
                        We ran into a problem while trying to write this section.
                    </h2>
                    <Button onClick={confirmRewrite} loading={rewriting} width="w-fit" loadingText="Requeueing...">
                        <RotateCcw width={20} height={20}/> Retry
                    </Button>
                </div>
            }
        </>
    );
}