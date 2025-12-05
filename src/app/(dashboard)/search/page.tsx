"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Cloud, CloudRain, CloudSnow, Sun, Search as SearchIcon, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

type Diary = {
    id: string;
    title: string;
    content: string;
    weather: string;
    date: string;
    moods: { mood: { name: string } }[];
};

type Mood = {
    id: string;
    name: string;
};

const weatherIcons = {
    SUNNY: { icon: Sun, color: "text-orange-500", label: "맑음" },
    CLOUDY: { icon: Cloud, color: "text-gray-500", label: "흐림" },
    RAINY: { icon: CloudRain, color: "text-blue-500", label: "비" },
    SNOWY: { icon: CloudSnow, color: "text-sky-300", label: "눈" },
};

function SearchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [diaries, setDiaries] = useState<Diary[]>([]);
    const [loading, setLoading] = useState(false);
    const [moods, setMoods] = useState<Mood[]>([]);

    // Filter states
    const [query, setQuery] = useState(searchParams.get("q") || "");
    const [weather, setWeather] = useState(searchParams.get("weather") || "");
    const [moodIds, setMoodIds] = useState<string[]>(
        searchParams.get("moodId") ? searchParams.get("moodId")!.split(",") : []
    );

    const [debouncedQuery] = useDebounce(query, 500);

    useEffect(() => {
        fetch("/api/moods")
            .then((res) => res.json())
            .then((data) => setMoods(data));
    }, []);

    useEffect(() => {
        const fetchDiaries = async () => {
            setLoading(true);
            const params = new URLSearchParams();
            if (debouncedQuery) params.append("search", debouncedQuery);
            if (weather) params.append("weather", weather);
            if (moodIds.length > 0) params.append("moodId", moodIds.join(","));

            try {
                const res = await fetch(`/api/diaries?${params.toString()}`);
                const data = await res.json();
                setDiaries(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchDiaries();
    }, [debouncedQuery, weather, moodIds]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // The search is already handled by debounce effect, but updating URL is good practice
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (weather) params.set("weather", weather);
        if (moodIds.length > 0) params.set("moodId", moodIds.join(","));
        router.push(`/search?${params.toString()}`);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">검색</h1>
                <p className="text-gray-500 mt-2">지난 일기를 찾아보세요.</p>
            </div>

            <form onSubmit={handleSearch} className="space-y-6 bg-white p-6 rounded-xl border-none shadow-sm">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="제목, 내용으로 검색..."
                            className="pl-10"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Weather Toggle */}
                    <div className="block">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setWeather("")}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium rounded-lg transition-all border",
                                    !weather
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105"
                                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                )}
                            >
                                전체
                            </button>
                            {Object.entries(weatherIcons).map(([key, { label, icon: Icon, color }]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setWeather(key === weather ? "" : key)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all border cursor-pointer",
                                        weather === key
                                            ? "bg-white text-indigo-600 border-indigo-600 shadow-md transform scale-105"
                                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                    )}
                                >
                                    <Icon className={cn("w-4 h-4", weather === key ? color : "text-gray-400")} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mood Multi-select Tags (Box Style) */}
                    <div className="block">
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setMoodIds([])}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium rounded-lg transition-all border cursor-pointer",
                                    moodIds.length === 0
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105"
                                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                )}
                            >
                                전체
                            </button>
                            {moods.map((mood) => (
                                <button
                                    key={mood.id}
                                    type="button"
                                    onClick={() => {
                                        setMoodIds((prev) =>
                                            prev.includes(mood.id)
                                                ? prev.filter((id) => id !== mood.id)
                                                : [...prev, mood.id]
                                        );
                                    }}
                                    className={cn(
                                        "px-4 py-2 text-sm font-medium rounded-lg transition-all border cursor-pointer",
                                        moodIds.includes(mood.id)
                                            ? "bg-white text-indigo-600 border-indigo-600 shadow-md transform scale-105"
                                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                    )}
                                >
                                    {mood.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </form>

            {loading ? (
                <div className="text-center py-20">로딩 중...</div>
            ) : (
                <div className="grid gap-4">
                    {diaries.length > 0 ? diaries.map((diary) => {
                        const WeatherIcon =
                            weatherIcons[diary.weather as keyof typeof weatherIcons]?.icon || Sun;
                        const weatherColor =
                            weatherIcons[diary.weather as keyof typeof weatherIcons]?.color ||
                            "text-gray-500";

                        return (
                            <Link
                                key={diary.id}
                                href={`/diary/${diary.id}`}
                                className="group block rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors break-all line-clamp-2">
                                            {diary.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {format(new Date(diary.date), "yyyy년 M월 d일 EEEE", {
                                                locale: ko,
                                            })}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {diary.moods.map(({ mood }, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center rounded-md bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-100"
                                                >
                                                    {mood.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <WeatherIcon className={cn("h-6 w-6", weatherColor)} />
                                </div>
                            </Link>
                        );
                    }) : (
                        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed">
                            <p className="text-gray-500">검색 결과가 없습니다.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SearchContent />
        </Suspense>
    );
}
