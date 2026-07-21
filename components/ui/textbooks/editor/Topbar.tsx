"use client";

import { useState, useEffect } from "react";
import TextbookWithSections from "@/lib/types/TextbookWithSections";
import type { KnowledgeDocument } from "@/prisma/client";
import { GraduationCap, Lock, FileText, Download, Eye, X, Settings, Trash, Pencil, LogOut, ArrowLeft, SquarePen, Copy } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { deleteTextbook, reOutline } from "@/lib/api/textbooks";
import { useModalStore } from "@/components/stores/Modals";

import Menu from "../../input/Menu";
import Button from "../../input/Button";
import Image from "next/image";
import UpdateTextbookModal from "../../modals/UpdateTextbookModal";
import UpdateTextbookSourcesModal from "../../modals/UpdateTextbookSourcesModal";
import { getPublishedTextbookUrl, getTextbookDraftUrl, publishTextbook, unpublishTextbook } from "@/lib/api/publish";

type TopbarProps = {
    textbook: TextbookWithSections | undefined,
    knowledgeData: KnowledgeDocument[],
    knowledgePage: number,
    knowledgeTotal: number
};

export default function Topbar({ 
    textbook, 
    knowledgeData,
    knowledgePage,
    knowledgeTotal 
}: TopbarProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [reoutlining, setReoutlining] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [loadingPublish, setLoadingPublish] = useState(false);
    const [loadingUnpublish, setLoadingUnpublish] = useState(false);

    const { updateProps, open, current } = useModalStore();

    if (!textbook) return;
    const canDelete = textbook.chapters.every(chapter => 
        chapter.sections.every(section => section.status == "READY" || section.status == "FAILED_REFINING" || section.status == "FAILED_WRITING")
    );

    useEffect(() => {
        const active = current();
        if (active && active.component == UpdateTextbookSourcesModal) {
            updateProps({
                textbookData: textbook,
                data: knowledgeData,
                page: knowledgePage,
                total: knowledgeTotal
            });
        }
    }, [knowledgeData, knowledgePage, knowledgeTotal, textbook]);

    useEffect(() => {
        if (loadingDelete || reoutlining || loadingPreview || loadingPublish || loadingUnpublish) {
            const title = reoutlining
                ? "Saving..." :
                loadingDelete
                ? "Deleting..." :
                loadingPreview ?
                "Generating..." :
                loadingPublish ? 
                "Publishing..."
                : "Unpublishing..."

            const message = reoutlining
                ? "Please wait while we save your changes." :
                loadingDelete ? "Please wait while we delete this textbook." :
                loadingPreview ? "Please wait while we generate this textbook." :
                loadingPublish ? "Please wait while we publish this textbook." :
                "Please wait while we unpublish this textbook."

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
    }, [loadingDelete, loadingPreview, reoutlining, loadingPublish, loadingUnpublish]);

    async function handleDelete() {
        if (loadingDelete || loadingPreview || !textbook || !canDelete) return;

        const result = await Swal.fire({
            title: "Delete textbook?",
            text: "Your textbook will be removed. This action can't be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
            confirmButtonColor: "#C8102E",
        });
        if (!result.isConfirmed) return;

        setLoadingDelete(true);
        try {
            const res = await deleteTextbook(textbook.id);
            router.push("/textbooks");
            toast.success("Success");
        } catch (err) {
            if (err instanceof Error) {
                toast.error(`Failed: ${err.message}`);
            } else {
                toast.error("Failed: Unknown error");
            }
        } finally {
            setLoadingDelete(false);
        } 
    }

    async function handleReoutline() {
        if (loadingDelete || reoutlining || !textbook || !canDelete) return;

        Swal.fire({
            title: "Are you sure?",
            text: "Your current textbook outline and content will be lost. This action cannot be undone.",
            icon: "warning",
            showCancelButton: true
        })
        .then(async (result) => {
            if (result.isConfirmed) {
                setReoutlining(true);
                try {
                    const res = await reOutline(textbook.id);
                    router.push("/textbooks");
                    toast.success("Success");
                    toast("Your textbook is being rewritten from scratch. Check on its status in the Textbooks tab!", {
                        duration: 10000
                    });
                } catch (err) {
                    if (err instanceof Error) {
                        toast.error(`Failed: ${err.message}`);
                    } else {
                        toast.error("Failed: Unknown error");
                    }
                } finally {
                    setReoutlining(false);
                } 
            }
        });
    }

    async function handlePreview() {
        if (loadingPreview) return;
        setLoadingPreview(true);

        try {
            const res = await getTextbookDraftUrl(textbook!.id);
            toast.success("Success");
            window.open(res.data, "_blank", "noopener,noreferrer")
        } catch (err) {
            if (err instanceof Error) {
                toast.error(`Failed: ${err.message}`);
            } else {
                toast.error("Failed: Unknown error");
            }
        } finally {
            setLoadingPreview(false);
        } 
    }

    async function handlePublish() {
        if (loadingPublish) return;

        Swal.fire({
            title: "Are you sure?",
            text: "Any previously published versions will be lost and the textbook will be publicly accessible via a link.",
            icon: "warning",
            showCancelButton: true
        })
        .then(async (result) => {
            if (result.isConfirmed) {
                setLoadingPublish(true);
                try {
                    const res = await publishTextbook(textbook!.id);
                    toast.success("Success");
                    router.refresh();
                    window.open(res.data, "_blank", "noopener,noreferrer")
                } catch (err) {
                    if (err instanceof Error) {
                        toast.error(`Failed: ${err.message}`);
                    } else {
                        toast.error("Failed: Unknown error");
                    }
                } finally {
                    setLoadingPublish(false);
                } 
            }
        });
    }

     async function handleUnpublish() {
        if (loadingUnpublish) return;

        Swal.fire({
            title: "Are you sure?",
            text: "Any previously published versions will be completely lost.",
            icon: "warning",
            showCancelButton: true
        })
        .then(async (result) => {
            if (result.isConfirmed) {
                setLoadingUnpublish(true);
                try {
                    await unpublishTextbook(textbook!.id);
                    toast.success("Success");
                    router.refresh();
                } catch (err) {
                    if (err instanceof Error) {
                        toast.error(`Failed: ${err.message}`);
                    } else {
                        toast.error("Failed: Unknown error");
                    }
                } finally {
                    setLoadingUnpublish(false);
                } 
            }
        });
    }

    function handleCopy() {
        if (!textbook?.publishedUploadKey) return;

        const url = getPublishedTextbookUrl(textbook!.id);
        navigator.clipboard.writeText(url)
            .then(() => {
                toast.success('Published URL successfully copied to clipboard');
            })
            .catch(err => {
                toast.error(`Failed: ${err.message}`);
            });
    }

    return (
        <div className="px-5 py-3 z-50 h-16 top-0 sticky bg-white border-b border-gray-200 flex flex-row items-center gap-3 justify-between">
            <div className="flex flex-row items-center justify-between w-full">
                <div className="flex flex-row items-center gap-3">
                    <ArrowLeft
                        width={30}
                        height={30}
                        className="cursor-pointer"
                        onClick={() => router.push("/textbooks")}
                    />

                    <GraduationCap
                        width={45}
                        height={45}
                        className="text-[var(--isu-cardinal)]"
                    />

                    <h2 className="font-semibold text-xl max-w-3xs md:max-w-sm lg:max-w-xl truncate">{textbook?.title}</h2>
                </div>

                <button
                    type="button"
                    className="cursor-pointer lg:hidden"
                    onClick={() => setMobileMenuOpen((prev) => !prev)}    
                >
                    {mobileMenuOpen ? 
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>    
                    :
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    }  
                </button>
            </div>

            <div className={`${mobileMenuOpen ? "fixed top-14 bg-white left-0 z-50 w-full flex flex-col min-h-screen p-4 gap-3" : "hidden"} lg:flex lg:flex-row lg:items-center lg:gap-5`}>
                <Menu
                    label={{
                        text: "File",
                        icon: FileText
                    }}
                    items={[
                        {
                            label: "Properties",
                            icon: Settings,
                            onClick: () => open(UpdateTextbookModal, {
                                initialData: textbook
                            })
                        },
                        {
                            label: reoutlining ? "Requeuing..." : "Re-Outline",
                            disabled: reoutlining || !canDelete,
                            icon: SquarePen,
                            danger: true,
                            onClick: handleReoutline
                        },
                        {
                            label: loadingDelete ? "Deleting..." : "Delete",
                            disabled: loadingDelete || !canDelete,
                            icon: Trash,
                            danger: true,
                            onClick: handleDelete
                        }
                    ]}
                />

                <Menu
                    label={{
                        text: "Sources",
                        icon: GraduationCap
                    }}
                    items={[
                        {
                            label: "Manage Sources",
                            icon: Pencil,
                            onClick: () => open(UpdateTextbookSourcesModal, {
                                textbookData: textbook,
                                data: knowledgeData,
                                page: knowledgePage,
                                total: knowledgeTotal
                            })
                        }
                    ]}
                />

                 <Menu
                    label={{
                        text: "Publish",
                        icon: Download,
                    }}
                    items={[
                        {
                            label: loadingPreview ? "Generating..." : "Preview Draft",
                            disabled: loadingPreview || !canDelete,
                            icon: Eye,
                            onClick: handlePreview
                        },
                        {
                            label: loadingPublish ? "Publishing..." : "Publish",
                            icon: Download,
                            disabled: loadingPublish || !canDelete,
                            onClick: handlePublish
                        },
                        {
                            label: "Copy Published URL",
                            icon: Copy,
                            disabled: !textbook.publishedUploadKey,
                            onClick: handleCopy
                        },
                        {
                            label: loadingUnpublish ? "Unpublishing..." : "Unpublish",
                            icon: X,
                            danger: true,
                            disabled: textbook.publishedUploadKey == null || loadingUnpublish,
                            onClick: handleUnpublish
                        }
                    ]}
                />

                <Button
                    onClick={() => {
                        
                    }}
                >
                    <Lock width={20} height={20}/> Share
                </Button>

                {session?.user.image &&
                    <Menu
                        align="right"
                        trigger={
                            <div className="hidden lg:block w-12 h-12">
                                <div className="relative rounded-full h-full w-full overflow-hidden">
                                    <Image
                                        src={session?.user.image}
                                        fill
                                        alt="User profile picture"
                                    />
                                </div>
                            </div>
                        }
                        items={[
                            {
                                label: "Sign Out",
                                icon: LogOut,
                                danger: true,
                                onClick: () => signOut({
                                    callbackUrl: "/"
                                })
                            },
                            {
                                label: "Settings",
                                icon: Settings
                            }
                        ]}
                    />
                }
            </div>
        </div>
    );
}