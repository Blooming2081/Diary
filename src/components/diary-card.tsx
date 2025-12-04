import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Cloud, CloudRain, CloudSnow, Sun } from "lucide-react";
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

export default function DiaryCard({ diary }: { diary: Diary }) {
    const getWeatherIcon = (weather: string) => {
        const option = weatherOptions.find((o) => o.value === weather);
        if (!option) return null;
        const Icon = option.icon;
        return <Icon className={cn("h-5 w-5", option.color)} />;
    };

    return (
        <Link
            href={`/diary/${diary.id}`}
            className="block bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {diary.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {format(new Date(diary.date), "yyyy년 M월 d일 EEEE", { locale: ko })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {getWeatherIcon(diary.weather)}
                </div>
            </div>
            <div className="flex gap-2 mb-4">
                {diary.moods.map(({ mood }, idx) => (
                    <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                        {mood.name}
                    </span>
                ))}
            </div>
            <div
                className="text-gray-600 line-clamp-3 prose prose-sm"
                dangerouslySetInnerHTML={{ __html: diary.content }}
            />
        </Link>
    );
}
