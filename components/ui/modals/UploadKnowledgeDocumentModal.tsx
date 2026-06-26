"use client";

import { useState } from "react";
import KnowledgeDocumentType from "@/lib/types/KnowledgeDocumentType";
import knowledgeDocFileInputAccept from "@/lib/constants/knowledgeDocFileInputAccept";
import { useModalStore } from "@/components/stores/Modals";
import { createKnowledgeDocument } from "@/lib/api/knowledge";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { FileText, Upload, CircleX } from "lucide-react";
import Input from "../input/Input";
import FileUpload from "../input/FileUpload";
import Checkbox from "../input/Checkbox";
import Button from "../input/Button";

export default function UploadKnowledgeDocumentModal() {
    const router = useRouter();

    const [file, setFile] = useState<File | null>(null);
    const [agreed, setAgreed] = useState(false);
    const [title, setTitle] = useState("");
    const [className, setClassName] = useState("");
    const [loading, setLoading] = useState(false);

    const close = useModalStore((state) => state.close);

    async function handleSubmit(e: React.SubmitEvent) {
        e.preventDefault();
        if (loading) return;

        const formData = new FormData();
        formData.append("title", title);
        formData.append("class", className);
        formData.append("file", file as File);

        setLoading(true);
        try {
            const knowledgeDoc = await createKnowledgeDocument(formData);
            close();
            router.refresh();
            toast.success("Success");
            toast("Your document is being processed by our system. Check on its status in the Knowledge Base!", {
                duration: 10000
            });
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
        <div className="w-full h-screen md:h-fit md:max-h-[calc(100vh-4rem)] md:w-2xl md:rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-full py-6 px-6 space-y-6">
                <div className="space-y-2">
                    <div className="inline-flex gap-2">
                        <FileText width={30} height={30}/>
                        <h1 className="text-2xl font-bold">Upload Document</h1>
                    </div>
                    <h3 className="text-md">Upload documents to make them available as AI-ready sources for drafting and content generation.</h3>
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

                <FileUpload
                    file={file}
                    onChange={(file) => {
                        setFile(file);
                    }}
                    required={true}
                    
                    acceptMsg={Object.values(KnowledgeDocumentType).join(", ")}
                    accept={knowledgeDocFileInputAccept.join(",")}
                />

                <Checkbox
                    checked={agreed}
                    required
                    onChange={(e) => setAgreed(e.target.checked)}
                    label="I acknowledge that this document will be processed by AI. I acknowledge that AI will use content from this document at my choosing during the drafting of OER materials."
                />
                
                <div className="inline-flex gap-3 w-full mt-2">
                    <Button type="submit" loading={loading} loadingText="Uploading..."><Upload width={20} height={20}/> Upload</Button>
                    <Button onClick={close} disabled={loading} variant="secondary"><CircleX width={20} height={20}/> Cancel</Button>
                </div>
            </form>
        </div>
    );
}