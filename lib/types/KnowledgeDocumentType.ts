const KnowledgeDocumentType = {
    PDF: "PDF",
    DOCX: "DOCX",
    PPTX: "PPTX",
    TEXT: "TEXT"
} as const

type KnowledgeDocumentType = (typeof KnowledgeDocumentType)[keyof typeof KnowledgeDocumentType]

export default KnowledgeDocumentType;