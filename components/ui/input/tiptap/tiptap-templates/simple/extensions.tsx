
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"
import { TableKit } from "@tiptap/extension-table";
import { HorizontalRule } from "@/components/ui/input/tiptap/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"

export default [
    StarterKit.configure({
        horizontalRule: false,
        link: {
            openOnClick: false,
            enableClickSelection: true,
        },
    }),
    HorizontalRule,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Highlight.configure({ multicolor: true }),
    Image,
    Typography,
    Superscript,
    Subscript,
    Selection,
    TableKit
];