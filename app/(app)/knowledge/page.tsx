import { auth } from "@/lib/utils/auth";
import { getUserKnowledgeBase } from "@/lib/services/rag";

import Header from "@/components/ui/knowledge/Header";
import Card from "@/components/ui/knowledge/Card";
import Grid from "@/components/ui/knowledge/Grid";

export default async function KnowledgePage() {
    const session = await auth();
    const knowledgeDocs = await getUserKnowledgeBase(session?.user.id as string);

    return (
        <div className="space-y-6">
            <Header/>

            <Grid data={knowledgeDocs}/>
        </div>
    )
}