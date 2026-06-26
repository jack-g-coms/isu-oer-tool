import { auth } from "@/lib/utils/auth";
import { getUserTextbooks } from "@/lib/services/textbooks";
import { getUserKnowledgeBase } from "@/lib/services/rag";
import { KnowledgeDocumentStatus, TextbookStatus, KnowledgeDocumentType } from "@/prisma/enums";

import Header from "@/components/ui/textbooks/Header";
import Grid from "@/components/ui/textbooks/Grid";
import Pagination from "@/components/ui/input/Pagination";

type TextbooksPageProps = {
    searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function TextbooksPage({ searchParams }: TextbooksPageProps) {
    const params = await searchParams;
    const search = params.q?.toLowerCase();
    const status = params.status;
    const page = Number(params.page ?? "1");

    const knowledgeSearch = params.kq?.toLowerCase();
    const knowledgeType = params.ktype;
    const knowledgePage = Number(params.kpage ?? "1");

    const session = await auth();
    const { data, total } = await getUserTextbooks(
        session?.user.id as string,
        false,
        false,
        false,
        search,
        status as TextbookStatus | undefined,
        page
    );

    const { data: readyData, total: readyTotal } = await getUserKnowledgeBase(
        session?.user.id as string, 
        false, 
        knowledgeSearch, 
        knowledgeType as KnowledgeDocumentType | undefined, 
        KnowledgeDocumentStatus.READY,
        knowledgePage
    );

    return (
        <div className="space-y-4">
            <Header 
                knowledgeData={readyData}
                knowledgePage={knowledgePage}
                knowledgeTotal={readyTotal}
            />

            <Grid 
                data={data} 
                search={search != undefined || status != undefined}
            />

            <Pagination
                page={page}
                total={total}
                limit={16}
                pageName="textbooks"
            />
        </div>
    );
}