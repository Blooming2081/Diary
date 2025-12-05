"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, LayoutGrid, User, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { debounce } from "lodash";

const moodSchema = z.object({
    name: z.string().min(1, "기분 이름을 입력해주세요."),
});

const profileSchema = z.object({
    name: z.string().min(2, "이름은 2글자 이상이어야 합니다."),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
}).refine((data) => {
    if (data.newPassword && !data.currentPassword) {
        return false;
    }
    return true;
}, {
    message: "새 비밀번호를 설정하려면 현재 비밀번호를 입력해야 합니다.",
    path: ["currentPassword"],
});

type MoodFormValues = z.infer<typeof moodSchema>;
type ProfileFormValues = z.infer<typeof profileSchema>;

type Mood = {
    id: string;
    name: string;
};

export default function SettingsPage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [moods, setMoods] = useState<Mood[]>([]);
    const [loading, setLoading] = useState(false);

    // Home Settings
    const [gridColumns, setGridColumns] = useState(3);
    const [viewMode, setViewMode] = useState("brief");

    const {
        register: registerMood,
        handleSubmit: handleSubmitMood,
        reset: resetMood,
        formState: { errors: moodErrors },
    } = useForm<MoodFormValues>({
        resolver: zodResolver(moodSchema),
    });

    const {
        register: registerProfile,
        handleSubmit: handleSubmitProfile,
        formState: { errors: profileErrors },
        setValue: setProfileValue,
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: session?.user?.name || "",
        },
    });

    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        fetchMoods();
        if (session?.user && !initialized) {
            setGridColumns(session.user.gridColumns || 3);
            setViewMode(session.user.viewMode || "brief");
            setProfileValue("name", session.user.name || "");
            setInitialized(true);
        }
    }, [session, setProfileValue, initialized]);

    const fetchMoods = async () => {
        const res = await fetch("/api/moods");
        const data = await res.json();
        setMoods(data);
    };

    const onAddMood = async (data: MoodFormValues) => {
        setLoading(true);
        try {
            const res = await fetch("/api/moods", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                resetMood();
                fetchMoods();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const onDeleteMood = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;

        try {
            const res = await fetch(`/api/moods?id=${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                fetchMoods();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const saveSettings = async (newGridColumns: number, newViewMode: string) => {
        try {
            const res = await fetch("/api/user/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gridColumns: newGridColumns,
                    viewMode: newViewMode,
                }),
            });

            if (res.ok) {
                await update({
                    gridColumns: newGridColumns,
                    viewMode: newViewMode,
                });
                // router.refresh(); // Removed to prevent state fighting
            }
        } catch (error) {
            console.error("Failed to save settings", error);
        }
    };

    // Debounce save for slider
    const saveSettingsRef = useRef(saveSettings);
    useEffect(() => {
        saveSettingsRef.current = saveSettings;
    });

    const debouncedSave = useCallback(
        debounce((cols: number, mode: string) => saveSettingsRef.current(cols, mode), 500),
        []
    );

    const handleGridChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        setGridColumns(val);
        debouncedSave(val, viewMode);
    };

    const handleViewModeChange = (mode: string) => {
        setViewMode(mode);
        saveSettings(gridColumns, mode);
    };

    const onUpdateProfile = async (data: ProfileFormValues) => {
        setLoading(true);
        try {
            const payload: any = { name: data.name };
            if (data.newPassword) payload.newPassword = data.newPassword;
            if (data.currentPassword) payload.currentPassword = data.currentPassword;

            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                await update({ name: data.name });
                alert("프로필이 업데이트되었습니다.");
                router.refresh();
            } else {
                const error = await res.text();
                alert(error);
            }
        } catch (error) {
            console.error(error);
            alert("프로필 업데이트 실패");
        } finally {
            setLoading(false);
        }
    };

    const onDeleteAccount = async () => {
        if (!confirm("정말 탈퇴하시겠습니까? 모든 데이터가 영구적으로 삭제됩니다.")) return;

        try {
            const res = await fetch("/api/user/delete", {
                method: "DELETE",
            });

            if (res.ok) {
                await signOut({ callbackUrl: "/login" });
            } else {
                alert("회원 탈퇴 실패");
            }
        } catch (error) {
            console.error(error);
            alert("오류가 발생했습니다.");
        }
    };

    const [showKey, setShowKey] = useState(false);
    const [newKey, setNewKey] = useState("");

    const onUpdateKey = async (keyToUpdate: string, action: string) => {
        if (!keyToUpdate) return;
        // Confirmation is handled by caller or here if needed. 
        // For 'Recover', we might want a confirmation too.
        if (action === "복구") {
            if (!confirm("보안 키를 복구하시겠습니까? \n\n이 키로 암호화되었던 과거의 사진들이 다시 보이게 됩니다.")) return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/user/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ encryptionKey: keyToUpdate }),
            });

            if (res.ok) {
                await update({ encryptionKey: keyToUpdate });
                setNewKey("");
                alert(`보안 키가 ${action}되었습니다.`);
                router.refresh();
            } else {
                alert("키 업데이트 실패");
            }
        } catch (error) {
            console.error("Failed to update key", error);
            alert("오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">설정</h1>
                <p className="text-gray-500 mt-2">앱 설정을 관리하세요.</p>
            </div>

            <div className="grid gap-8">
                {/* Mood Settings */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Plus className="h-5 w-5" /> 기분 관리
                    </h2>
                    <form onSubmit={handleSubmitMood(onAddMood)} className="flex gap-4 mb-6">
                        <div className="flex-1">
                            <Input
                                placeholder="새로운 기분 추가 (예: 설렘, 피곤함)"
                                {...registerMood("name")}
                            />
                            {moodErrors.name && (
                                <p className="text-xs text-red-500 mt-1">{moodErrors.name.message}</p>
                            )}
                        </div>
                        <Button
                            type="submit"
                            variant="secondary"
                            disabled={loading}
                            className="transition-transform hover:scale-105 shadow-md hover:bg-gray-200"
                        >
                            추가
                        </Button>
                    </form>

                    <div className="flex flex-wrap gap-2">
                        {moods.map((mood) => (
                            <div
                                key={mood.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm"
                            >
                                <span>{mood.name}</span>
                                <button
                                    onClick={() => onDeleteMood(mood.id)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        보안 키 관리
                    </h2>
                    <div className="space-y-4">
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm text-yellow-800">
                            <p className="font-bold mb-1">⚠️ 중요</p>
                            <p>이 키는 사진을 암호화하는 데 사용됩니다. <strong>이 키를 잃어버리면 사진을 영구적으로 복구할 수 없습니다.</strong> 안전한 곳에 보관하세요.</p>
                            <p className="mt-2">보안 키를 변경하면 기존 사진들도 자동으로 재암호화됩니다.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                현재 보안 키
                            </label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-gray-100 p-3 rounded-lg font-mono text-sm break-all">
                                    {showKey ? (
                                        (session?.user as any)?.encryptionKey || "키 없음"
                                    ) : (
                                        "••••••••••••••••••••••••••••••••"
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setShowKey(!showKey)}
                                    className="hover:bg-gray-200 transition-transform hover:scale-105 shadow-md"
                                >
                                    {showKey ? "숨기기" : "보기"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        if (confirm("보안 키를 새로 발급하시겠습니까? \n\n기존 사진들도 새로운 키로 안전하게 재암호화됩니다. (사진 양에 따라 시간이 소요될 수 있습니다.)")) {
                                            const array = new Uint8Array(32);
                                            window.crypto.getRandomValues(array);
                                            const generatedKey = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
                                            onUpdateKey(generatedKey, "변경");
                                        }
                                    }}
                                    disabled={loading}
                                    className="transition-transform hover:scale-105 shadow-md hover:bg-gray-200 cursor-pointer"
                                >
                                    변경
                                </Button>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                보안 키 복구
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="예전 보안 키 입력 (복구용)"
                                    value={newKey}
                                    onChange={(e) => setNewKey(e.target.value)}
                                    className="font-mono"
                                />
                                <Button
                                    onClick={() => onUpdateKey(newKey, "복구")}
                                    disabled={loading || !newKey}
                                    variant="secondary"
                                    className="transition-transform hover:scale-105 shadow-md cursor-pointer hover:bg-gray-200"
                                >
                                    복구
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                * 기존 키를 입력하면 예전 사진들을 다시 볼 수 있습니다.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Display Settings */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <LayoutGrid className="h-5 w-5" /> 홈 화면 설정
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                가로 표시 개수 ({gridColumns}개)
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="6"
                                value={gridColumns}
                                onChange={handleGridChange}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>1</span>
                                <span>6</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                보기 방식
                            </label>
                            <div className="flex gap-4">
                                {[
                                    { value: "title", label: "제목만" },
                                    { value: "content", label: "내용만" },
                                    { value: "brief", label: "간략하게(기본)" },
                                ].map((mode) => (
                                    <button
                                        key={mode.value}
                                        onClick={() => handleViewModeChange(mode.value)}
                                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${viewMode === mode.value
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-indigo-200"
                                            }`}
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Settings */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <User className="h-5 w-5" /> 프로필 설정
                    </h2>
                    <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                이름
                            </label>
                            <Input {...registerProfile("name")} />
                            {profileErrors.name && (
                                <p className="text-xs text-red-500 mt-1">{profileErrors.name.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                현재 비밀번호 (변경 시 입력)
                            </label>
                            <Input type="password" {...registerProfile("currentPassword")} />
                            {profileErrors.currentPassword && (
                                <p className="text-xs text-red-500 mt-1">
                                    {profileErrors.currentPassword.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                새 비밀번호
                            </label>
                            <Input type="password" {...registerProfile("newPassword")} />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            variant="secondary"
                            className="transition-transform hover:scale-105 shadow-md hover:bg-gray-200"
                        >
                            프로필 업데이트
                        </Button>
                    </form>
                </div>

                {/* Delete Account */}
                <div className="bg-red-50 p-6 rounded-xl border border-red-100 shadow-md">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-700">
                        <Trash2 className="h-5 w-5" /> 회원 탈퇴
                    </h2>
                    <p className="text-sm text-red-600 mb-4">
                        탈퇴 시 작성한 일기와 모든 정보가 영구적으로 삭제되며 복구할 수 없습니다.
                    </p>
                    <Button
                        variant="outline"
                        onClick={onDeleteAccount}
                        disabled={loading}
                        className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-700 transition-transform hover:scale-105 shadow-md"
                    >
                        회원 탈퇴
                    </Button>
                </div>
            </div>
        </div>
    );
}
