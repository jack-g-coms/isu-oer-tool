"use client";

import { Upload } from "lucide-react";
import { useOverlayStore } from "@/components/stores/Overlay";

import Button from "@/components/ui/input/Button";
import UploadKnowledgeDocumentModal from "@/components/ui/modals/UploadKnowledgeDocumentModal";

export default function Header() {
    const open = useOverlayStore((state) => state.open);

    return (
        <div className="grid grid-cols-1 md:grid-cols-[5fr_1fr] gap-4">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">Knowledge Base</h1>
                <h4 className="text-lg">All your class documents and AI-ready sources in one place.</h4>
            </div>

            <div>
                <Button
                    onClick={() => {
                        open(<UploadKnowledgeDocumentModal/>)
                    }}
                >
                    <Upload width={20} height={20}/> Upload Document
                </Button>
            </div>
        </div>
    );
}