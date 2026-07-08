import { Node } from "prosemirror-model";
import { getSchema } from "@tiptap/core";
import extensions from "@/components/ui/input/tiptap/tiptap-templates/simple/extensions";

const schema = getSchema(extensions);

export function validateTipTapJSON(content: unknown) {
    try {
        Node.fromJSON(schema, content);
        return true;
    } catch {
        return false;
    }
}