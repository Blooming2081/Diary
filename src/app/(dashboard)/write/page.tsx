"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Editor from "@/components/editor";
import { Cloud, CloudRain, CloudSnow, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const diarySchema = z.object({
    title: z.string().min(1, "제목을 입력해주세요."),
    content: z.string(),
    weather: z.enum(["SUNNY", "CLOUDY", "RAINY", "SNOWY"]),
    moodIds: z.array(z.string()).min(1, "최소 하나의 기분을 선택해주세요."),
    date: z.string(),
});

type DiaryFormValues = z.infer<typeof diarySchema>;

type Mood = {
    id: string;
    name: string;
};

const weatherOptions = [
    { value: "SUNNY", label: "맑음", icon: Sun, color: "text-orange-500" },
    { value: "CLOUDY", label: "흐림", icon: Cloud, color: "text-gray-500" },
    { value: "RAINY", label: "비", icon: CloudRain, color: "text-blue-500" },
    { value: "SNOWY", label: "눈", icon: CloudSnow, color: "text-sky-300" },
];

export default function WritePage() {
    const router = useRouter();
    const [moods, setMoods] = useState<Mood[]>([]);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isDirty },
    } = useForm<DiaryFormValues>({
        resolver: zodResolver(diarySchema),
        defaultValues: {
            weather: "SUNNY",
            moodIds: [],
            date: new Date().toISOString().split("T")[0],
        },
    });

    const selectedWeather = watch("weather");
    const selectedMoodIds = watch("moodIds");

    useEffect(() => {
        fetch("/api/moods")
            .then((res) => res.json())
            .then((data) => setMoods(data));
    }, []);

    // Browser back button warning
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty]);

    const handleBack = () => {
        if (isDirty) {
            if (confirm("작성 중인 내용이 저장되지 않습니다. 정말 나가시겠습니까?")) {
                router.push("/");
            }
        } else {
            router.back();
        }
    };

    const onSubmit = async (data: DiaryFormValues) => {
        setLoading(true);
        try {
            const res = await fetch("/api/diaries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                router.push("/");
                router.refresh();
            } else {
                alert("일기 저장에 실패했습니다.");
            }
        } catch (error) {
            console.error(error);
            alert("오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const toggleMood = (id: string) => {
        const current = selectedMoodIds || [];
        if (current.includes(id)) {
            setValue(
                "moodIds",
                current.filter((m) => m !== id),
                { shouldDirty: true }
            );
        } else {
            setValue("moodIds", [...current, id], { shouldDirty: true });
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">일기 쓰기</h1>
                <p className="text-gray-500 mt-2">오늘의 하루를 기록해보세요.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">
                            날짜
                        </label>
                        <Input type="date" {...register("date")} />
                    </div>
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">
                            제목
                        </label>
                        <Input placeholder="제목을 입력하세요" {...register("title")} />
                        {errors.title && (
                            <p className="text-xs text-red-500">{errors.title.message}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                        날씨
                    </label>
                    <div className="flex gap-4">
                        {weatherOptions.map((option) => {
                            const Icon = option.icon;
                            const isSelected = selectedWeather === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setValue("weather", option.value as any, { shouldDirty: true })}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all w-24 h-24",
                                        isSelected
                                            ? "border-indigo-600 bg-indigo-50"
                                            : "border-gray-200 hover:border-gray-300 bg-white"
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            "h-8 w-8 mb-2",
                                            isSelected ? option.color : "text-gray-400"
                                        )}
                                    />
                                    <span
                                        className={cn(
                                            "text-sm font-medium",
                                            isSelected ? "text-indigo-900" : "text-gray-500"
                                        )}
                                    >
                                        {option.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                        기분
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {moods.map((mood) => (
                            <button
                                key={mood.id}
                                type="button"
                                onClick={() => toggleMood(mood.id)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                                    selectedMoodIds?.includes(mood.id)
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                )}
                            >
                                {mood.name}
                            </button>
                        ))}
                    </div>
                    {errors.moodIds && (
                        <p className="text-xs text-red-500">{errors.moodIds.message}</p>
                    )}
                    {moods.length === 0 && (
                        <p className="text-sm text-gray-500">
                            설정 페이지에서 기분을 추가해주세요.
                        </p>
                    )}
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                        내용
                    </label>
                    <Editor
                        content=""
                        onChange={(content) => setValue("content", content, { shouldDirty: true })}
                    />
                </div>

                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                    >
                        취소
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "저장 중..." : "저장하기"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
