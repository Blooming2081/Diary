
import { getServerSession } from "next-auth";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Plus, Cloud, CloudRain, CloudSnow, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const weatherIcons = {
    SUNNY: { icon: Sun, color: "text-orange-500" },
    CLOUDY: { icon: Cloud, color: "text-gray-500" },
    RAINY: { icon: CloudRain, color: "text-blue-500" },
    SNOWY: { icon: CloudSnow, color: "text-sky-300" },
};

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    // If no session, the layout/middleware should handle it, but safe to check
    if (!session?.user?.id) {
        return <div className="p-8 text-center">로그인이 필요합니다.</div>;
    }

    const diaries = await prisma.diary.findMany({
        where: {
            userId: session.user.id,
        },
        orderBy: { date: "desc" },
        include: {
            moods: {
                include: {
                    mood: true,
                },
            },
        },
    });

    const gridColumns = session?.user?.gridColumns || 3;
    const viewMode = session?.user?.viewMode || "brief";

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="cursor-default">
                    <h1 className="text-3xl font-bold text-gray-900">
                        안녕하세요, {session?.user?.name}님!
                    </h1>
                    <p className="text-gray-500 mt-2">오늘의 이야기를 기록해보세요.</p>
                </div>
                <Link href="/write">
                    <Button variant="secondary" className="rounded-xl transition-transform hover:scale-105 shadow-md hover:bg-gray-200">
                        <Plus className="mr-2 h-4 w-4" />
                        일기 쓰기
                    </Button>
                </Link>
            </div>

            <div
                className="grid gap-6"
                style={{
                    gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                }}
            >
                {diaries.map((diary) => {
                    const WeatherIcon =
                        weatherIcons[diary.weather as keyof typeof weatherIcons]?.icon || Sun;
                    const weatherColor =
                        weatherIcons[diary.weather as keyof typeof weatherIcons]?.color ||
                        "text-gray-500";

                    // Extract first image from content if exists
                    const imgMatch = diary.content.match(/<img[^>]+src="([^">]+)"/);
                    const firstImage = imgMatch ? imgMatch[1] : null;

                    // Remove HTML tags for text preview
                    const textContent = diary.content.replace(/<[^>]+>/g, "");

                    return (
                        <Link
                            key={diary.id}
                            href={`/diary/${diary.id}`}
                            className="group block rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-lg"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1 min-w-0 pr-4">
                                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1 break-all">
                                        {diary.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {format(new Date(diary.date), "yyyy년 M월 d일 EEEE", {
                                            locale: ko,
                                        })}
                                    </p>
                                </div>
                                <WeatherIcon className={cn("h-5 w-5 flex-shrink-0", weatherColor)} />
                            </div>

                            {viewMode !== "title" && (
                                <>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {diary.moods.map(({ mood }, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
                                            >
                                                {mood.name}
                                            </span>
                                        ))}
                                    </div>

                                    {viewMode === "brief" && firstImage && (
                                        <div className="mb-4 aspect-video relative overflow-hidden rounded-lg bg-gray-100">
                                            <img
                                                src={firstImage}
                                                alt="Diary preview"
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                    )}

                                    <div className="text-gray-600 text-sm line-clamp-3">
                                        {textContent || "내용 없음"}
                                    </div>
                                </>
                            )}
                        </Link>
                    );
                })}
            </div>

            {diaries.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed">
                    <p className="text-gray-500 mb-4">아직 작성된 일기가 없습니다.</p>
                    <Link href="/write">
                        <Button variant="secondary" className="transition-transform hover:scale-105 shadow-md hover:bg-gray-200">첫 일기 작성하기</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
