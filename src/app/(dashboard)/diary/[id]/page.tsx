
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Cloud, CloudRain, CloudSnow, Sun, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { DiaryActions } from "@/components/diary-actions";
import { Button } from "@/components/ui/button";
import { decryptKey, decryptText } from "@/lib/crypto";

const weatherOptions = [
    { value: "SUNNY", label: "맑음", icon: Sun, color: "text-orange-500" },
    { value: "CLOUDY", label: "흐림", icon: Cloud, color: "text-gray-500" },
    { value: "RAINY", label: "비", icon: CloudRain, color: "text-blue-500" },
    { value: "SNOWY", label: "눈", icon: CloudSnow, color: "text-sky-300" },
];

interface DiaryPageProps {
    params: Promise<{ id: string }>;
}

export default async function DiaryPage({ params }: DiaryPageProps) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        redirect("/login");
    }

    const { id } = await params;

    // Server-side data fetching
    const diary = await prisma.diary.findUnique({
        where: { id },
        include: {
            moods: {
                include: {
                    mood: true,
                },
            },
        },
    });

    // Security Check: Ensure the diary belongs to the current user
    if (!diary || diary.userId !== session.user.id) {
        notFound();
    }
    // Decrypt content if it's a secret diary
    if ((diary as any).isSecret) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { encryptionKey: true }
        });

        if (user?.encryptionKey) {
            try {
                const rawKey = decryptKey(user.encryptionKey);
                diary.content = decryptText(diary.content, rawKey);
            } catch (e) {
                diary.content = "<p class='text-red-500 font-bold'>[암호화 해제 실패]</p>";
            }
        } else {
            diary.content = "<p class='text-gray-400 italic'>[이 일기를 보려면 보안 키가 필요합니다]</p>";
        }
    }

    const getWeatherIcon = (weather: string) => {
        const option = weatherOptions.find((o) => o.value === weather);
        if (!option) return null;
        const Icon = option.icon;
        return <Icon className={cn("h-6 w-6", option.color)} />;
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <DiaryActions id={diary.id} />

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
                    className="prose prose-lg max-w-none break-words"
                    dangerouslySetInnerHTML={{ __html: diary.content }}
                />
            </div>
        </div>
    );
}
