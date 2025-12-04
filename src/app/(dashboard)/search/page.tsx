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
    const [moodId, setMoodId] = useState(searchParams.get("moodId") || "");

    useEffect(() => {
        fetch("/api/moods")
            .then((res) => res.json())
            .then((data) => setMoods(data));
    }, []);

    const fetchDiaries = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (query) params.append("search", query); // API expects 'search', not 'q'
            if (weather) params.append("weather", weather);
            if (moodId) params.append("moodId", moodId);

            const res = await fetch(`/api/diaries?${params.toString()}`);
            const data = await res.json();
            setDiaries(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Sync state with URL params on load/change
        setQuery(searchParams.get("q") || "");
        setWeather(searchParams.get("weather") || "");
        setMoodId(searchParams.get("moodId") || "");

        // Fetch immediately based on URL params
        const params = new URLSearchParams(searchParams.toString());
        // Map 'q' to 'search' for the API call if needed, but fetchDiaries handles state
        // Actually, let's just call fetchDiaries with current state, but state might not be updated yet.
        // Better to parse params directly for the initial fetch.

        const searchQuery = searchParams.get("q") || "";
        const weatherQuery = searchParams.get("weather") || "";
        const moodIdQuery = searchParams.get("moodId") || "";

        const apiParams = new URLSearchParams();
        if (searchQuery) apiParams.append("search", searchQuery);
        if (weatherQuery) apiParams.append("weather", weatherQuery);
        if (moodIdQuery) apiParams.append("moodId", moodIdQuery);

        setLoading(true);
        fetch(`/api/diaries?${apiParams.toString()}`)
            .then((res) => res.json())
            .then((data) => setDiaries(data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));

    }, [searchParams]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (weather) params.set("weather", weather);
        if (moodId) params.set("moodId", moodId);
        router.push(`/search?${params.toString()}`);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">검색</h1>
                <p className="text-gray-500 mt-2">지난 일기를 찾아보세요.</p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4 bg-white p-6 rounded-xl border shadow-sm">
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
                    <Button
                        type="submit"
                        disabled={loading}
                        className="transition-transform hover:scale-105"
                    >
                        검색
                    </Button>
                </div>

                <div className="flex flex-wrap gap-4 items-center pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Filter className="h-4 w-4" />
                        <span>필터:</span>
                    </div>

                    <select
                        value={weather}
                        onChange={(e) => setWeather(e.target.value)}
                        className="text-sm border-gray-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">날씨 전체</option>
                        {Object.entries(weatherIcons).map(([key, { label }]) => (
                            <option key={key} value={key}>
                                {label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={moodId}
                        onChange={(e) => setMoodId(e.target.value)}
                        className="text-sm border-gray-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">기분 전체</option>
                        {moods.map((mood) => (
                            <option key={mood.id} value={mood.id}>
                                {mood.name}
                            </option>
                        ))}
                    </select>
                </div>
            </form>

            {loading ? (
                <div className="text-center py-20">로딩 중...</div>
            ) : (
                <div className="grid gap-4">
                    {diaries.map((diary) => {
                        const WeatherIcon =
                            weatherIcons[diary.weather as keyof typeof weatherIcons]?.icon || Sun;
                        const weatherColor =
                            weatherIcons[diary.weather as keyof typeof weatherIcons]?.color ||
                            "text-gray-500";

                        return (
                            <Link
                                key={diary.id}
                                href={`/diary/${diary.id}`}
                                className="group block rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-indigo-200 hover:scale-[1.01]"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">
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
                                                    className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
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
                    })}
                </div>
            )}

            {!loading && diaries.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed">
                    <p className="text-gray-500">검색 결과가 없습니다.</p>
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
