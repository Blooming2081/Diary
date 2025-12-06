"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

interface DiaryActionsProps {
    id: string;
}

export function DiaryActions({ id }: DiaryActionsProps) {
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm("정말로 이 일기를 삭제하시겠습니까?")) return;

        try {
            const res = await fetch(`/api/diaries/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                router.push("/");
                router.refresh();
            }
        } catch (error) {
            alert("삭제 실패");
        }
    };

    return (
        <div className="flex items-center justify-between">
            <Button
                variant="secondary"
                onClick={() => router.back()}
                className="hover:bg-gray-200 transition-transform hover:scale-105 shadow-md"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                뒤로 가기
            </Button>
            <div className="flex gap-2">
                <Link href={`/diary/${id}/edit`}>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="hover:bg-gray-200 transition-transform hover:scale-105 shadow-md"
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        수정
                    </Button>
                </Link>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    className="transition-transform hover:scale-105 shadow-md hover:bg-red-700"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    삭제
                </Button>
            </div>
        </div>
    );
}
