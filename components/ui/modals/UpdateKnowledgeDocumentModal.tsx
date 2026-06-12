"use client";

import { useState } from "react";
import type { KnowledgeDocument } from "@/prisma/client";
import { useModalStore } from "@/components/stores/Modals";
import { updateKnowledgeDocument } from "@/lib/api/knowledge";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { FileText, Upload, CircleX } from "lucide-react";
import Input from "../input/Input";
import Button from "../input/Button";

type UpdateKnowledgeDocumentModalProps = {
    initialData: KnowledgeDocument
}

export default function UpdateKnowledgeDocumentModal({ initialData }: UpdateKnowledgeDocumentModalProps) {
    const router = useRouter();

    const [title, setTitle] = useState(initialData.title);
    const [className, setClassName] = useState(initialData.class);
    const [loading, setLoading] = useState(false);

    const close = useModalStore((state) => state.close);

    async function handleSubmit(e: React.SubmitEvent) {
        e.preventDefault();
        if (loading) return;

        const formData = new FormData();
        formData.append("title", title);
        formData.append("class", className);

        setLoading(true);
        try {
            const knowledgeDoc = await updateKnowledgeDocument(initialData.id, formData);
            close();
            router.refresh();
            toast.success("Success");
        } catch (err) {
            if (err instanceof Error) {
                toast.error(`Failed: ${err.message}`);
            } else {
                toast.error("Failed: Unknown error");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full h-screen md:h-fit md:w-2xl md:rounded-lg border border-gray-200 bg-white py-8 px-8 shadow-lg space-y-6">
            <div className="space-y-2">
                <div className="inline-flex gap-2">
                    <FileText width={30} height={30}/>
                    <h1 className="text-2xl font-bold">Update Document</h1>
                </div>
            </div>

            <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title for your document"
                required
            />

            <Input
                label="Class"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Enter the class this document is for or leave this field blank"
                tip='If you leave this field blank, the class will be listed as "None"'
            />
            
            <div className="inline-flex gap-3 w-full mt-2">
                <Button type="submit" loading={loading} loadingText="Saving..."><Upload width={20} height={20}/> Save</Button>
                <Button onClick={close} disabled={loading} variant="secondary"><CircleX width={20} height={20}/> Cancel</Button>
            </div>
        </form>
    );
}