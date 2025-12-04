"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, Image as ImageIcon } from "lucide-react";
import { useCallback } from "react";

interface EditorProps {
    content: string;
    onChange: (content: string) => void;
}

export default function Editor({ content, onChange }: EditorProps) {
    const uploadImage = async (file: File): Promise<string | null> => {
        console.log("[Editor] Uploading file:", file.name);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                const { url } = await res.json();
                console.log("[Editor] Upload success, url:", url);
                return url;
            } else {
                console.error("[Editor] Upload failed:", res.status, res.statusText);
            }
        } catch (err) {
            console.error("[Editor] Upload error", err);
        }
        return null;
    };

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image,
            Link.configure({
                openOnClick: false,
                autolink: true,
            }),
            Placeholder.configure({
                placeholder: "오늘의 이야기를 들려주세요...",
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4",
            },
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                    const file = event.dataTransfer.files[0];
                    if (file.type.startsWith("image/")) {
                        console.log("[Editor] Drop detected:", file.name);
                        event.preventDefault();
                        uploadImage(file).then((url) => {
                            if (url) {
                                const { schema } = view.state;
                                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                                const pos = coordinates ? coordinates.pos : view.state.selection.from;

                                const node = schema.nodes.image.create({ src: url });
                                const transaction = view.state.tr.insert(pos, node);
                                view.dispatch(transaction);
                            } else {
                                alert("이미지 업로드에 실패했습니다.");
                            }
                        });
                        return true;
                    }
                }
                return false;
            },
        },
    });

    const addImage = useCallback(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
            if (input.files?.length) {
                const file = input.files[0];
                const url = await uploadImage(file);
                if (url) {
                    editor?.chain().focus().setImage({ src: url }).run();
                }
            }
        };
        input.click();
    }, [editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="border rounded-md overflow-hidden bg-white">
            <div className="border-b bg-gray-50 p-2 flex gap-2 flex-wrap">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive("bold") ? "bg-gray-200" : ""}
                    type="button"
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive("italic") ? "bg-gray-200" : ""}
                    type="button"
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive("bulletList") ? "bg-gray-200" : ""}
                    type="button"
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive("orderedList") ? "bg-gray-200" : ""}
                    type="button"
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={addImage} type="button">
                    <ImageIcon className="h-4 w-4" />
                </Button>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}
