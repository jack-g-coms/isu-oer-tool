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
import { Brain, RotateCcw, Rocket, Settings, Trash, SquarePen, FileText, BookOpen, GraduationCap } from "lucide-react";
import Button from "../../input/Button";
import UpdateSectionModal from "../../modals/UpdateSectionModal";
import Link from "next/link";
import Menu from "../../input/Menu";
import { deleteChapter } from "@/lib/api/chapters";
import UpdateChapterModal from "../../modals/UpdateChapterModal";
import { handleImageUpload } from "@/lib/utils/tiptap-utils";

type TextbookEditorProps = {
    chapterView: Chapter | undefined,
    sectionView: Section | undefined,
    views: Record<string, Chapter & { sections: Record<string, Section> }> | undefined,
    textbook: TextbookWithSections | undefined,
    loadError: boolean
};

export default function TextbookEditor({ loadError, chapterView, sectionView, textbook, views }: TextbookEditorProps) {
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
            }).then((res) => {
                if (res.isConfirmed) {
                    router.push("/textbooks");
                }
            });
        }
    }, [loadError]);

    if (!textbook || loadError || !views) return;

    useEffect(() => {
        if (saving || deleting || rewriting) {
            const title = saving
                ? "Saving..."
                : deleting
                ? "Deleting..."
                : "Saving...";

            const message = saving
                ? "Please wait while we save your changes."
                : deleting
                ? "Please wait while we delete this item."
                : "Please wait while we save your changes.";

            Swal.fire({
                title: title,
                text: message,
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });
        } else if (Swal.isVisible()) {
            Swal.close();
        }
        
        return () => {
            if (Swal.isVisible()) {
                Swal.close();
            }
        };
    }, [saving, deleting, rewriting]);

    useEffect(() => {
        if (!sectionView || sectionView.status == "READY" || sectionView.status == "FAILED_WRITING" || sectionView.status == "FAILED_REFINING") return;

        const interval = setInterval(() => {
            router.refresh();
        }, 10000);

        return () => clearInterval(interval);
    }, [sectionView]);

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
                    } else if (chapterView) {
                        res = await deleteChapter(chapterView.id);
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
        if (saving || deleting || rewriting || (!sectionView && !chapterView)) return;

        if (sectionView) {
            open(UpdateSectionModal, {
                initialData: sectionView
            });
        } else if (chapterView) {
            open(UpdateChapterModal, {
                initialData: chapterView
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

    async function handleUpload(file: File, onProgress?: (event: { progress: number }) => void, abortSignal?: AbortSignal) {
        return await handleImageUpload(sectionView?.id as string, file, onProgress, abortSignal);
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
                    onImageUpload={handleUpload}
                />
            }

            {sectionView && (sectionView.status == "WRITING" || sectionView.status == "QUEUED") &&
                <div className="flex flex-col gap-6 items-center justify-center p-8 h-[calc(100vh-64px-64px)] grow">
                    <Brain height={175} width={175} className="text-[var(--isu-gold)] animate-shake"/>
                    <h2 className="text-xl md:text-2xl font-semibold text-center">
                        This section is actively being written or refined by AI, check back soon!
                    </h2>
                </div>
            }

            {sectionView && sectionView.status == "FAILED_WRITING" &&
                <div className="flex flex-col gap-6 items-center justify-center p-8 h-[calc(100vh-64px-64px)] grow">
                    <Brain height={175} width={175} className="text-[var(--isu-gold)]"/>
                    <h2 className="text-xl md:text-2xl font-semibold text-center">
                        We ran into a problem while trying to write this section.
                    </h2>
                    <Button onClick={confirmRewrite} loading={rewriting} width="w-fit" loadingText="Requeueing...">
                        <RotateCcw width={20} height={20}/> Retry
                    </Button>
                </div>
            }

            {chapterView && !sectionView &&
                <div className="flex flex-col gap-4 grow">
                    <div className="flex flex-col gap-2 bg-white p-3 border border-gray-200 rounded-xl">
                        <div className="flex flex-col gap-2 p-3">
                            <h1 className="inline-flex gap-4 text-3xl font-bold"><BookOpen className="shrink-0" width={35} height={35}/> {chapterView.title}</h1>
                            <p className="text-lg">{chapterView.summary}</p>
                        </div>

                        <div className="flex flex-row items-center gap-2">
                            <Menu
                                label={{
                                    text: "File",
                                    icon: FileText
                                }}
                                items={[
                                    {
                                        label: deleting ? "Deleting..." : "Delete",
                                        disabled: deleting,
                                        icon: Trash,
                                        danger: true,
                                        onClick: handleDelete
                                    }
                                ]}
                            />
            
                            <Menu
                                label={{
                                    text: "Properties",
                                    icon: Settings,
                                }}
                                items={[
                                    {
                                        label: "Title & Summary",
                                        icon: SquarePen,
                                        onClick: handleEdit
                                    }
                                ]}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 rounded-lg bg-white p-6 border border-gray-200 rounded-xl">
                        <h1 className="text-3xl font-bold">Table of Contents</h1>

                        <div className="flex flex-col gap-4 grow">
                            {Object.keys(views[chapterView.id].sections).length == 0 ?
                                <div className="flex flex-col gap-6 items-center grow justify-center pb-5">
                                    <Rocket height={175} width={175} className="text-[var(--isu-gold)]"/>
                                    <h2 className="text-xl md:text-2xl font-semibold text-center">
                                        Start writing sections for this chapter and they will show up here.
                                    </h2>
                                </div>
                            :
                                Object.entries(views[chapterView.id].sections).map(([sectionId, section], posSection) => (
                                    <Link key={sectionId} className="flex items-baseline gap-2 hover:text-blue-600" href={`/textbooks/${textbook.id}?chapter=${chapterView.id}&section=${sectionId}`}>
                                        <span className="max-w-7xl truncate">{section.title}</span>
                                        <span
                                            className="flex-1 h-px self-end mb-1 bg-[radial-gradient(circle,currentColor_1px,transparent_1px)] bg-[length:8px_2px] text-gray-400"
                                        />
                                        <span className="shrink-0">{Object.keys(views).indexOf(chapterView.id) + 1}.{posSection + 1}</span>
                                    </Link>
                                ))
                            }
                        </div>
                    </div>
                </div>
            }

            {!chapterView && !sectionView &&
                <div className="flex flex-col gap-4 grow">
                    <div className="flex flex-col gap-2 bg-white p-6 border border-gray-200 rounded-xl">
                        <div className="flex flex-col gap-2">
                            <h1 className="inline-flex items-center gap-4 text-3xl font-bold"><GraduationCap className="shrink-0" width={45} height={45}/> {textbook.title}</h1>
                            <p className="text-lg">{textbook.description}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 rounded-lg bg-white p-6 border border-gray-200 rounded-xl">
                        <h1 className="text-3xl font-bold">Table of Contents</h1>

                        {Object.keys(views).length == 0 ?
                            <div className="flex flex-col gap-6 items-center grow justify-center pb-5">
                                <Rocket height={175} width={175} className="text-[var(--isu-gold)]"/>
                                <h2 className="text-xl md:text-2xl font-semibold text-center">
                                    Start creating chapters for this textbook and they will show up here.
                                </h2>
                            </div>
                        :
                            <div className="flex flex-col gap-4">
                                {Object.entries(views).map(([chapterId, chapter], chapterPos) => (
                                    <div key={chapterId} className="flex flex-col gap-4">
                                        <Link className="flex items-baseline gap-2 hover:text-blue-600" href={`/textbooks/${textbook.id}?chapter=${chapterId}`}>
                                            <span className="max-w-7xl truncate">{chapter.title}</span>
                                            <span
                                                className="flex-1 h-px self-end mb-1 bg-[radial-gradient(circle,currentColor_1px,transparent_1px)] bg-[length:8px_2px] text-gray-400"
                                            />
                                            <span className="shrink-0">{chapterPos + 1}</span>
                                        </Link>

                                        <div className={`${Object.entries(views[chapterId].sections).length == 0 ? "hidden" : "flex"} flex-col gap-4 ml-5`}>
                                            {Object.entries(views[chapterId].sections).map(([sectionId, section], sectionPos) => (
                                                <Link key={sectionId} className="flex items-baseline gap-2 hover:text-blue-600" href={`/textbooks/${textbook.id}?chapter=${chapterId}&section=${sectionId}`}>
                                                    <span className="max-w-7xl truncate">{section.title}</span>
                                                    <span
                                                        className="flex-1 h-px self-end mb-1 bg-[radial-gradient(circle,currentColor_1px,transparent_1px)] bg-[length:8px_2px] text-gray-400"
                                                    />
                                                    <span className="shrink-0">{chapterPos + 1}.{sectionPos + 1}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        }
                    </div>
                </div>
            }
        </>
    );
}