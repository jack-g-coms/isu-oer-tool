"use client";

import { useState } from "react";
import type { Section } from "@/prisma/client";
import { useModalStore } from "@/components/stores/Modals";
import { updateSection } from "@/lib/api/sections";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { FileText, Upload, CircleX } from "lucide-react";
import Input from "../input/Input";
import TextArea from "../input/TextArea";
import Button from "../input/Button";

type UpdateSectionModalProps = {
    initialData: Section
}

export default function UpdateSectionModal({ initialData }: UpdateSectionModalProps) {
    const router = useRouter();

    const [title, setTitle] = useState(initialData.title);
    const [summary, setSummary] = useState(initialData.summary ?? "");
    const [loading, setLoading] = useState(false);

    const close = useModalStore((state) => state.close);

    async function handleSubmit(e: React.SubmitEvent) {
        e.preventDefault();
        if (loading) return;

        const formData = new FormData();
        formData.append("title", title);
        formData.append("summary", summary);
        formData.append("chapterId", initialData.chapterId);
        formData.append("order", String(initialData.order));

        setLoading(true);
        try {
            const section = await updateSection(initialData.id, formData);
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
        <div className="w-full h-screen md:h-fit md:max-h-[calc(100vh-4rem)] md:w-2xl md:rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-full py-6 px-6 space-y-6">
                <div className="space-y-2">
                    <div className="inline-flex gap-2">
                        <FileText width={30} height={30}/>
                        <h1 className="text-2xl font-bold">Update Section</h1>
                    </div>
                </div>

                <Input
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a descriptive title for your section"
                    required
                    tip="The more descriptive the title, the better results."
                />

                <TextArea
                    label="Summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Enter a descriptive summary for your section"
                    tip="The more descriptive the summary, the better results."
                />
                
                <div className="inline-flex gap-3 w-full mt-2">
                    <Button type="submit" loading={loading} loadingText="Saving..."><Upload width={20} height={20}/> Save</Button>
                    <Button onClick={close} disabled={loading} variant="secondary"><CircleX width={20} height={20}/> Cancel</Button>
                </div>
            </form>
        </div>
    );
}