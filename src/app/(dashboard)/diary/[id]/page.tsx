"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Cloud, CloudRain, CloudSnow, Sun, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Diary = {
    id: string;
    title: string;
    content: string;
    weather: string;
    date: string;
    moods: { mood: { name: string } }[];
};

const weatherOptions = [
    { value: "SUNNY", label: "맑음", icon: Sun, color: "text-orange-500" },
    { value: "CLOUDY", label: "흐림", icon: Cloud, color: "text-gray-500" },
    { value: "RAINY", label: "비", icon: CloudRain, color: "text-blue-500" },
    { value: "SNOWY", label: "눈", icon: CloudSnow, color: "text-sky-300" },
];

export default function DiaryPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [diary, setDiary] = useState<Diary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/diaries/${id}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            })
            .then((data) => {
                setDiary(data);
                setLoading(false);
            })
            .catch(() => {
                router.push("/");
            });
    }, [id, router]);

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

    const getWeatherIcon = (weather: string) => {
        const option = weatherOptions.find((o) => o.value === weather);
        if (!option) return null;
        const Icon = option.icon;
        return <Icon className={cn("h-6 w-6", option.color)} />;
    };

    if (loading) return <div className="text-center py-12">로딩 중...</div>;
    if (!diary) return null;

    return (
        <div className="max-w-3xl mx-auto space-y-8">
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

            <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
                <div className="flex justify-between items-start border-b pb-6">
                    <div className="flex-1 min-w-0 pr-4">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2 break-words">
                            {diary.title}
                        </h1>
                        <p className="text-gray-500">
                            {format(new Date(diary.date), "yyyy년 M월 d일 EEEE", { locale: ko })}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                            {getWeatherIcon(diary.weather)}
                            <span className="text-sm font-medium text-gray-700">
                                {weatherOptions.find((o) => o.value === diary.weather)?.label}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    {diary.moods.map(({ mood }, idx) => (
                        <span
                            key={idx}
                            className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full font-medium"
                        >
                            {mood.name}
                        </span>
                    ))}
                </div>

                <div
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: diary.content }}
                />
            </div>
        </div>
    );
}
