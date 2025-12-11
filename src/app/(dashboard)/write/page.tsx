"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Editor from "@/components/editor";
import { Cloud, CloudRain, CloudSnow, Sun, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useSession } from "next-auth/react";

const diarySchema = z.object({
    title: z.string().min(1, "제목을 입력해주세요."),
    content: z.string(),
    weather: z.enum(["SUNNY", "CLOUDY", "RAINY", "SNOWY"]),
    moodIds: z.array(z.string()).min(1, "최소 하나의 기분을 선택해주세요."),
    date: z.string(),
    isSecret: z.boolean().default(false),
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
    const { data: session } = useSession();
    const [moods, setMoods] = useState<Mood[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAddingMood, setIsAddingMood] = useState(false);
    const [newMoodName, setNewMoodName] = useState("");
    const [hasKey, setHasKey] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isDirty },
    } = useForm<DiaryFormValues>({
        resolver: zodResolver(diarySchema) as any,
        defaultValues: {
            weather: "SUNNY",
            moodIds: [],
            date: new Date().toISOString().split("T")[0],
            isSecret: false,
        },
    });

    const selectedWeather = watch("weather");
    const selectedMoodIds = watch("moodIds");
    const isSecret = watch("isSecret");

    useEffect(() => {
        if (session?.user) {
            // Check if user has encryption key (it might be in session or we fetch it)
            // Ideally session.user should have it if we added it to auth options.
            // Let's check session struct. We viewed auth.ts before and it returns encryptionKey.
            // @ts-ignore
            if (session.user.encryptionKey && !session.user.keyError) {
                setHasKey(true);
            }
        }
    }, [session]);

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
                const errorData = await res.json();
                alert(errorData.message || "일기 저장에 실패했습니다.");
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

    const handleAddMood = async () => {
        if (!newMoodName.trim()) return;

        try {
            const res = await fetch("/api/moods", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newMoodName }),
            });

            if (res.ok) {
                const newMood = await res.json();
                setMoods((prev) => [newMood, ...prev]);
                // Automatically select the new mood
                toggleMood(newMood.id);
                setNewMoodName("");
                setIsAddingMood(false);
            } else {
                alert("기분 추가에 실패했습니다.");
            }
        } catch (error) {
            console.error(error);
            alert("오류가 발생했습니다.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">일기 쓰기</h1>
                    <p className="text-gray-500 mt-2">오늘의 하루를 기록해보세요.</p>
                </div>

                {/* Secret Diary Toggle */}
                <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                    {isSecret ? <Lock className="w-4 h-4 text-indigo-600" /> : <Unlock className="w-4 h-4 text-gray-400" />}
                    <label htmlFor="secret-mode" className={cn("text-sm font-medium cursor-pointer", isSecret ? "text-indigo-700" : "text-gray-600")}>
                        비밀 일기
                    </label>
                    <Switch
                        id="secret-mode"
                        checked={isSecret}
                        disabled={!hasKey}
                        onCheckedChange={(checked) => {
                            if (!hasKey && checked) {
                                alert("보안 키가 설정되어 있지 않아 비밀 일기를 쓸 수 없습니다.\n설정 페이지에서 보안 키를 확인해주세요.");
                                return;
                            }
                            setValue("isSecret", checked, { shouldDirty: true });
                        }}
                        className="data-[state=checked]:bg-indigo-600"
                    />
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit) as any} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">
                            날짜
                        </label>
                        <Input
                            type="date"
                            max={new Date().toISOString().split("T")[0]}
                            {...register("date", {
                                onChange: (e) => {
                                    const selected = new Date(e.target.value);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    if (selected > today) {
                                        alert("미래의 날짜는 선택할 수 없습니다.");
                                        setValue("date", today.toISOString().split("T")[0]);
                                    }
                                }
                            })}
                            className="cursor-pointer"
                        />
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
                                        "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all w-24 h-24 cursor-pointer",
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
                                    "px-4 py-2 rounded-full text-sm font-medium transition-colors border cursor-pointer",
                                    selectedMoodIds?.includes(mood.id)
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                )}
                            >
                                {mood.name}
                            </button>
                        ))}

                        {/* Add Mood Button/Input */}
                        {isAddingMood ? (
                            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-full border border-gray-200 pr-2">
                                <Input
                                    ref={(e) => {
                                        if (e) setTimeout(() => e.focus(), 0);
                                    }}
                                    value={newMoodName}
                                    onChange={(e) => setNewMoodName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddMood();
                                        }
                                    }}
                                    className="h-8 w-24 text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-3"
                                    placeholder="새 기분"
                                />
                                <div className="flex items-center gap-1 border-l pl-2 border-gray-300 h-5">
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleAddMood}
                                        disabled={!newMoodName.trim()}
                                        variant="secondary"
                                        className="h-7 px-3 text-xs rounded-full shadow-sm hover:bg-gray-200"
                                    >
                                        추가
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => {
                                            setIsAddingMood(false);
                                            setNewMoodName("");
                                        }}
                                        className="h-7 px-3 text-xs rounded-full shadow-sm hover:bg-gray-200 bg-white"
                                    >
                                        취소
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsAddingMood(true)}
                                className="px-4 py-2 rounded-full text-sm font-medium transition-colors border border-dashed border-gray-300 text-gray-500 hover:border-indigo-500 hover:text-indigo-600 bg-gray-50/50 cursor-pointer"
                            >
                                + 추가
                            </button>
                        )}

                    </div>
                    {errors.moodIds && (
                        <p className="text-xs text-red-500">{errors.moodIds.message}</p>
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
                        variant="secondary"
                        onClick={handleBack}
                        className="hover:bg-gray-200 transition-transform hover:scale-105 shadow-md"
                    >
                        취소
                    </Button>
                    <Button
                        type="submit"
                        variant="secondary"
                        disabled={loading}
                        className="transition-transform hover:scale-105 shadow-md hover:bg-gray-200"
                    >
                        {loading ? "저장 중..." : "저장하기"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
