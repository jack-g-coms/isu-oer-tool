import { Upload } from "lucide-react";
import { auth } from "@/lib/utils/auth";
import { getUserKnowledgeBase } from "@/lib/services/rag";

import Button from "@/components/ui/input/Button";
import Card from "@/components/ui/knowledge/Card";

export default async function KnowledgePage() {
    const session = await auth();
    const knowledgeDocs = await getUserKnowledgeBase(session?.user.id as string);

    return (
        <div className="space-y-6">
            <div className="flex flex-row justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">Knowledge Base</h1>
                    <h4 className="text-lg">All your class documents and AI-ready sources in one place.</h4>
                </div>

                <div>
                    <Button>
                        <Upload width={20} height={20}/> Upload Document
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {knowledgeDocs.map((value) => (
                    <Card
                        key={value.id}
                        data={value}
                    />
                ))}
            </div>
        </div>
    )
}