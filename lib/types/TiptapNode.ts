type TiptapNode = {
    type: string,
    attrs?: Record<string, any>,
    content?: TiptapNode[]
}

export default TiptapNode;