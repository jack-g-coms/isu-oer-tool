"use client";

import { useState } from "react";
import { useModalStore } from "@/components/stores/Modals";
import { updateTextbook } from "@/lib/api/textbooks";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import TextbookWithSections from "@/lib/types/TextbookWithSections";

import { FileText, Upload, CircleX } from "lucide-react";
import Input from "../input/Input";
import TextArea from "../input/TextArea";
import Button from "../input/Button";

type UpdateTextbookModalProps = {
    initialData: TextbookWithSections
}

export default function UpdateTextbookModal({ initialData }: UpdateTextbookModalProps) {
    const router = useRouter();

    const [title, setTitle] = useState(initialData.title ?? "");
    const [description, setDescription] = useState(initialData.description ?? "");
    const [sources, setSources] = useState(initialData.sources.map((source) => source.id));
    const [className, setClassName] = useState(initialData.class);
    const [loading, setLoading] = useState(false);

    const close = useModalStore((state) => state.close);

    async function handleSubmit(e: React.SubmitEvent) {
        e.preventDefault();
        if (loading) return;

        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("class", className.length == 0 ? "None" : className);
        for (const sourceId of sources) {
            formData.append("sources", sourceId);
        }

        setLoading(true);
        try {
            const textbook = await updateTextbook(initialData.id, formData);
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
                        <h1 className="text-2xl font-bold">Update Textbook</h1>
                    </div>
                </div>

                <Input
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a descriptive title for your textbook"
                    required
                    tip='The more descriptive, the better the results.'
                />

                <Input
                    label="Class"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="Enter the class this textbook is for or leave this field blank"
                    tip='If you leave this field blank, the class will be listed as "None"'
                />

                <TextArea
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter a descriptive description for your textbook"
                    tip='The more descriptive, the better the results.'
                    required
                />
                
                <div className="inline-flex gap-3 w-full mt-2">
                    <Button type="submit" loading={loading} loadingText="Saving..."><Upload width={20} height={20}/> Save</Button>
                    <Button onClick={close} disabled={loading} variant="secondary"><CircleX width={20} height={20}/> Cancel</Button>
                </div>
            </form>
        </div>
    );
}