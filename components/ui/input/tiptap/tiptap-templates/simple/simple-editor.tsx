"use client"

import { useEffect, useRef, useState } from "react"
import { Content, Editor, EditorContent, EditorContext, useEditor } from "@tiptap/react"
import Swal from "sweetalert2"

// --- UI Primitives ---
import { Button } from "@/components/ui/input/tiptap/tiptap-ui-primitive/button"
import { Spacer } from "@/components/ui/input/tiptap/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/ui/input/tiptap/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import "@/components/ui/input/tiptap/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/ui/input/tiptap/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/ui/input/tiptap/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/ui/input/tiptap/tiptap-node/list-node/list-node.scss"
import "@/components/ui/input/tiptap/tiptap-node/image-node/image-node.scss"
import "@/components/ui/input/tiptap/tiptap-node/heading-node/heading-node.scss"
import "@/components/ui/input/tiptap/tiptap-node/paragraph-node/paragraph-node.scss"
import { ImageUploadNode, UploadFunction } from "@/components/ui/input/tiptap/tiptap-node/image-upload-node/image-upload-node-extension"
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/utils/tiptap-utils"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/ui/input/tiptap/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/ui/input/tiptap/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/ui/input/tiptap/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/ui/input/tiptap/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/ui/input/tiptap/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/ui/input/tiptap/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/ui/input/tiptap/tiptap-ui/link-popover"
import { MarkButton } from "@/components/ui/input/tiptap/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/ui/input/tiptap/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/ui/input/tiptap/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/ui/input/tiptap/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/ui/input/tiptap/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/ui/input/tiptap/tiptap-icons/link-icon"

// --- Hooks ---
import { useIsBreakpoint } from "@/components/ui/input/tiptap/hooks/use-is-breakpoint"
import { useWindowSize } from "@/components/ui/input/tiptap/hooks/use-window-size"
import { useCursorVisibility } from "@/components/ui/input/tiptap/hooks/use-cursor-visibility"

// --- Components ---
import { ThemeToggle } from "@/components/ui/input/tiptap/tiptap-templates/simple/theme-toggle"
import MyBtn from "@/components/ui/input/Button";

// --- Lib ---
import { cn } from "@/lib/utils/tiptap-utils"
import toast from "react-hot-toast"

// --- Styles ---
import "@/components/ui/input/tiptap/tiptap-templates/simple/simple-editor.scss"
import { Brain, SquarePen, UserRound, Loader2, Settings, FileText, Trash } from "lucide-react"
import Menu from "../../../Menu"
import extensions from "./extensions"
import { ALLOWED_IMAGE_TYPES } from "@/lib/constants/sanity"

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
        <ListDropdownMenu
          modal={false}
          types={["bulletList", "orderedList", "taskList"]}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

type SimpleEditorProps = {
  initialContent: Content,
  onSave: (content: Content, editor: Editor) => void,
  saving: boolean,
  deleting: boolean,
  onDelete: () => void,
  rewriting: boolean,
  onRewrite: () => void,
  onEdit: () => void,
  onImageUpload: UploadFunction
};

export function SimpleEditor({ initialContent, onSave, saving, deleting, onDelete, rewriting, onRewrite, onEdit, onImageUpload }: SimpleEditorProps) {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  )
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [editorContentUpdated, setEditorContentUpdated] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      }
    },
    onUpdate: ({ editor }) => {
      if (!editor.isDestroyed) {
        setEditorContentUpdated(true);
      }
    },
    extensions: [
      ...extensions,
      ImageUploadNode.configure({
          accept: ALLOWED_IMAGE_TYPES.join(","),
          maxSize: MAX_FILE_SIZE,
          limit: 3,
          upload: onImageUpload,
          onError: (error) => {
            if (error instanceof Error) {
                toast.error(`Failed: ${error.message}`);
            } else {
                toast.error("Failed: Unknown error");
            }
          },
      }),
    ],
    content: initialContent,
  })

  useEffect(() => {
    if (!editor) return

    editor.commands.setContent(initialContent);
    setEditorContentUpdated(false);
  }, [editor, initialContent]);

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!editorContentUpdated) return;

      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [editorContentUpdated]);

  return (
    <div className="simple-editor-wrapper shadow-lg">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />

        <div
          role="footer"
          aria-label="footer"
          className={cn("tiptap-footer", "rounded-b-[8px]")}
        >
          <div className="flex flex-row items-center justify-between gap-5 w-full">
            <div className="flex flex-row items-center gap-2">
              <Menu
                  align="top-left"
                  label={{
                      text: "File",
                      icon: FileText
                  }}
                  items={[
                      {
                          label: deleting ? "Deleting..." : "Delete",
                          disabled: deleting,
                          icon: Trash,
                          danger: true,
                          onClick: onDelete
                      }
                  ]}
              />
              <Menu
                align="top-left"
                label={{
                  text: "AI",
                  icon: Brain,
                }}
                items={[
                  {
                    label: rewriting ? "Requeuing..." : "Rewrite",
                    disabled: rewriting,
                    icon: SquarePen,
                    danger: true,
                    onClick: onRewrite
                  },
                  {
                    label: "Assistant",
                    icon: UserRound
                  }
                ]}
              />

              <Menu
                align="top-left"
                label={{
                  text: "Properties",
                  icon: Settings,
                }}
                items={[
                  {
                    label: "Title & Summary",
                    icon: SquarePen,
                    onClick: onEdit
                  }
                ]}
              />
            </div>
            
            <div className="flex flex-row items-center gap-2">
              {saving ?
                <div className="flex flex-row items-center gap-2 mr-5 text-[var(--isu-cardinal)]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-md">Saving...</span>
                </div>
              :
                <>
                  <MyBtn
                    width="w-fit"
                    disabled={editorContentUpdated == false}
                    onClick={() => {
                      if (!editor || editorContentUpdated == false) return;

                      Swal.fire({
                        title: "Are you sure?",
                        text: "The previous content cannot be recovered after saving. This action cannot be undone.",
                        icon: "warning",
                        showCancelButton: true
                      })
                      .then((result) => {
                        if (result.isConfirmed) {
                          const content = editor.getJSON();
                          onSave(content, editor);
                          setEditorContentUpdated(false);
                        }
                      });
                    }}
                  >Save</MyBtn>

                  <MyBtn
                    variant="secondary"
                    width="w-fit"
                    disabled={editorContentUpdated == false}
                    onClick={() => {
                      if (!editor) return;

                      Swal.fire({
                        title: "Are you sure?",
                        text: "This will revert all changes made to the content and cannot be undone.",
                        icon: "warning",
                        showCancelButton: true
                      })
                      .then((result) => {
                        if (result.isConfirmed) {
                          editor.commands.setContent(initialContent);
                          setEditorContentUpdated(false);
                        }
                      });
                    }}
                  >Revert to Last Save</MyBtn>
                </>
              }
            </div>
          </div>
        </div>
      </EditorContext.Provider>
    </div>
  )
}
