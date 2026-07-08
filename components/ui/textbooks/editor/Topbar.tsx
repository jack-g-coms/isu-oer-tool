"use client";

import { useState } from "react";
import TextbookWithSections from "@/lib/types/TextbookWithSections";
import { GraduationCap, Lock, FileText, Download, Eye, X, Settings, Trash, Pencil, LogOut, ArrowLeft } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { deleteTextbook } from "@/lib/api/textbooks";

import Menu from "../../input/Menu";
import Button from "../../input/Button";
import Image from "next/image";

type TopbarProps = {
    textbook: TextbookWithSections | undefined
};

export default function Topbar({ textbook }: TopbarProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [loadingDelete, setLoadingDelete] = useState(false);

    if (!textbook) return;

    async function handleDelete() {
        if (loadingDelete || !textbook) return;

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

    return (
        <div className="px-5 py-3 h-16 top-0 sticky z-50 bg-white border-b border-gray-200 shadow-lg flex flex-row items-center gap-3 justify-between">
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
                            label: "Settings",
                            icon: Settings
                        },
                        {
                            label: loadingDelete ? "Deleting..." : "Delete",
                            disabled: loadingDelete,
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
                            icon: Pencil
                        }
                    ]}
                />

                 <Menu
                    label={{
                        text: "Publish",
                        icon: Download
                    }}
                    items={[
                        {
                            label: "Preview",
                            icon: Eye
                        },
                        {
                            label: "Publish",
                            icon: Download
                        },
                        {
                            label: "Unpublish",
                            icon: X,
                            danger: true,
                            disabled: textbook.publishedUploadKey == undefined
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