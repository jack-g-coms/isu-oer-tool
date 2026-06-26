"use client";

import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { useModalStore } from "@/components/stores/Modals";
import { useRouter, useSearchParams } from "next/navigation";

import Button from "@/components/ui/input/Button";
import UploadKnowledgeDocumentModal from "@/components/ui/modals/UploadKnowledgeDocumentModal";
import SearchHeader from "./SearchHeader";

export default function Header() {
    const searchParams = useSearchParams();
    const params = new URLSearchParams(searchParams);

    const router = useRouter();
    const open = useModalStore((state) => state.open);
    const [search, setSearch] = useState("");
    const [fileType, setFileType] = useState("");
    const [docStatus, setDocStatus] = useState("");

    useEffect(() => {
        const trimmed = search.trim();
        const timeout = setTimeout(() => {
            if (trimmed.length != 0) {
                params.set("q", trimmed);
            } else {
                params.delete("q");
            }
            router.push(`/knowledge?${params.toString()}`);
        }, 300);

        return () => clearTimeout(timeout);
    }, [search]);

    useEffect(() => {
        if (fileType != "") {
            params.set("type", fileType);
        } else {
            params.delete("type");
        }
        if (docStatus != "") {
            params.set("status", docStatus);
        } else {
            params.delete("status");
        }

        router.push(`/knowledge?${params.toString()}`);
    }, [fileType, docStatus])

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-[5fr_1fr] gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">Knowledge Base</h1>
                    <h4 className="text-lg">All your class documents and AI-ready sources in one place.</h4>
                </div>

                <div>
                    <Button
                        onClick={() => {
                            open(UploadKnowledgeDocumentModal)
                        }}
                    >
                        <Upload width={20} height={20}/> Upload Document
                    </Button>
                </div>
            </div>

            <SearchHeader
                search={search}
                setSearch={setSearch}
                fileType={fileType}
                setFileType={setFileType}
                docStatus={docStatus}
                setDocStatus={setDocStatus}
            />
        </div>
    );
}