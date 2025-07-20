import React from 'react'
import {Editor} from "@tiptap/react"
import { Bold, Code, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, Italic, List, ListOrdered, Quote, Redo, Strikethrough, Undo } from 'lucide-react'

type Props = {
    editor: Editor
}

const EditorMenuBar = ({editor}: Props) => {
    return (
        <div className='flex flex-wrap gap-2'>
            <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`cursor-pointer ${editor.isActive("bold") ? "is-active dark:!bg-gray-700" : ""}`}
            aria-label="Toggle bold"
            >
                <Bold className="size-4 text-secondary-foreground m-0.5" />
            </button>

            <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`cursor-pointer ${editor.isActive("italic") ? "is-active dark:!bg-gray-700" : ""}`}
            aria-label="Toggle italic"
            >
                <Italic className="size-4 text-secondary-foreground" />
            </button>

            <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={`cursor-pointer ${editor.isActive("strike") ? "is-active dark:!bg-gray-700" : ""}`}
            aria-label="Toggle strikethrough"
            >
                <Strikethrough className="size-4 text-secondary-foreground" />
            </button>

            <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            className={`cursor-pointer ${editor.isActive("code") ? "is-active dark:!bg-gray-700" : ""}`}
            aria-label="Toggle code"
            >
                <Code className="size-4 text-secondary-foreground" />
            </button>

            <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`cursor-pointer ${editor.isActive("heading", { level: 1 }) ? "is-active dark:!bg-gray-700" : ""}`}
            aria-label="Toggle heading level 1"
            >
                <Heading1 className="size-4 text-secondary-foreground" />
            </button>

            <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`cursor-pointer ${editor.isActive("heading", { level: 2 }) ? "is-active dark:!bg-gray-700" : ""}`}
            aria-label="Toggle heading level 2"
            >
                <Heading2 className="size-4 text-secondary-foreground" />
            </button>

            <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`cursor-pointer ${editor.isActive("heading", { level: 3 }) ? "is-active dark:!bg-gray-700" : ""}`}
            aria-label="Toggle heading level 3"
            >
                <Heading3 className="size-4 text-secondary-foreground" />
            </button>

            <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            className={`cursor-pointer ${editor.isActive("heading", { level: 4 }) ? "is-active dark:!bg-gray-700" : ""}`}
            aria-label="Toggle heading level 4"
            >
                <Heading4 className="size-4 text-secondary-foreground" />
            </button>

            <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
            className={`cursor-pointer ${editor.isActive("heading", { level: 5 }) ? "is-active dark:!bg-gray-700" : ""}`}
            aria-label="Toggle heading level 5"
            >
                <Heading5 className="size-4 text-secondary-foreground" />
            </button>

            <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
            className={`cursor-pointer ${editor.isActive("heading", { level: 6 }) ? "is-active dark:!bg-gray-700" : ""}`}
            aria-label="Toggle heading level 6"
            >
                <Heading6 className="size-4 text-secondary-foreground" />
            </button>

            <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`cursor-pointer ${editor.isActive("bulletList") ? "is-active dark:!bg-gray-700" : ""}`}
            aria-label="Toggle bullet list"
            >
                <List className="size-4 text-secondary-foreground" />
            </button>

            <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`cursor-pointer ${editor.isActive("orderedList") ? "is-active dark:!bg-gray-700" : ""}`}
            aria-label="Toggle ordered list"
            >
                <ListOrdered className="size-4 text-secondary-foreground" />
            </button>

            <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`cursor-pointer ${editor.isActive("blockquote") ? "is-active dark:!bg-gray-700" : ""}`}
            aria-label="Toggle blockquote"
            >
                <Quote className="size-4 text-secondary-foreground" />
            </button>

            <button
            onClick={() => editor.chain().focus().undo().run()}
            className="cursor-pointer"
            disabled={!editor.can().chain().focus().undo().run()}
            aria-label="Undo"
            >
                <Undo className="size-4 text-secondary-foreground" />
            </button>

            <button
            onClick={() => editor.chain().focus().redo().run()}
            className="cursor-pointer"
            disabled={!editor.can().chain().focus().redo().run()}
            aria-label="Redo"
            >
                <Redo className="size-4 text-secondary-foreground" />
            </button>
        </div>
    )
}

export default EditorMenuBar