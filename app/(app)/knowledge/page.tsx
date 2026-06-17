import { auth } from "@/lib/utils/auth";
import { getUserKnowledgeBase } from "@/lib/services/rag";
import { KnowledgeDocumentType, KnowledgeDocumentStatus } from "@/prisma/enums";

import Header from "@/components/ui/knowledge/Header";
import Grid from "@/components/ui/knowledge/Grid";
import Pagination from "@/components/ui/input/Pagination";

type KnowledgePageProps = {
    searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function KnowledgePage({ searchParams }: KnowledgePageProps) {
    const params = await searchParams;
    const search = params.q?.toLowerCase();
    const fileType = params.type;
    const docStatus = params.status;
    const page = Number(params.page ?? "1");

    const session = await auth();
    const { data, total } = await getUserKnowledgeBase(
        session?.user.id as string, 
        false, 
        search, 
        fileType as KnowledgeDocumentType | undefined, 
        docStatus as KnowledgeDocumentStatus | undefined,
        page
    );

    return (
        <div className="space-y-4">
            <Header/>

            <Grid 
                data={data} 
                search={search != undefined || fileType != undefined || docStatus != undefined}
            />

            <Pagination
                page={page}
                total={total}
                limit={16}
            />
        </div>
    )
}