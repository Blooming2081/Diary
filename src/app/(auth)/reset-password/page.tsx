"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import { KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";

// Step 1: Verify Identity
const verifySchema = z.object({
    email: z.string().email("유효한 이메일을 입력해주세요."),
    securityKey: z.string().min(1, "보안 키를 입력해주세요."),
});

// Step 2: Set New Password
const resetSchema = z.object({
    newPassword: z.string().min(6, "비밀번호는 6자 이상이어야 합니다."),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
});

type VerifyFormValues = z.infer<typeof verifySchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Verify, 2: Reset, 3: Success
    const [loading, setLoading] = useState(false);
    const [verifiedData, setVerifiedData] = useState<{ email: string; securityKey: string } | null>(null);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const securityKeyRef = useRef<HTMLTextAreaElement>(null);

    const {
        register: registerVerify,
        handleSubmit: handleSubmitVerify,
        formState: { errors: verifyErrors },
    } = useForm<VerifyFormValues>({
        resolver: zodResolver(verifySchema),
    });

    const {
        register: registerReset,
        handleSubmit: handleSubmitReset,
        formState: { errors: resetErrors },
    } = useForm<ResetFormValues>({
        resolver: zodResolver(resetSchema),
    });

    const onStep1Submit = (data: VerifyFormValues) => {
        setVerifiedData(data);
        setStep(2);
        setGlobalError(null);
    };

    const finalSubmit = async (data: ResetFormValues) => {
        if (!verifiedData) return;
        setLoading(true);
        setGlobalError(null);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: verifiedData.email,
                    securityKey: verifiedData.securityKey,
                    newPassword: data.newPassword,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                setGlobalError(result.message || "오류가 발생했습니다.");
            } else {
                setStep(3);
            }
        } catch (error) {
            console.error(error);
            setGlobalError("서버 연결에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-screen grid lg:grid-cols-2">
            {/* Left: Branding */}
            <div className="hidden lg:flex flex-col justify-center items-center bg-zinc-900 relative overflow-hidden select-none">
                <div className="absolute inset-0 pointer-events-none">
                    <img
                        src="/images/login-bg.png"
                        alt="Diary Background"
                        className="w-full h-full object-cover opacity-50"
                        onDragStart={(e) => e.preventDefault()}
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center justify-center min-h-[500px] p-10 text-center pointer-events-none">
                    <div className="relative p-12">
                        {/* Feathered Blur Background */}
                        <div className="absolute inset-0 backdrop-blur-[2px] bg-black/5 rounded-[3rem] [mask-image:radial-gradient(closest-side,black,transparent)]"></div>

                        {/* Content */}
                        <div className="relative z-10 flex flex-col items-center">
                            <Logo size={64} theme="dark" />
                            <div className="space-y-4 max-w-md mt-6">
                                <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-xl">
                                    계정 복구
                                </h2>
                                <p className="text-zinc-100 text-lg drop-shadow-lg font-medium leading-relaxed">
                                    보안 키를 통해 안전하게<br />
                                    비밀번호를 재설정하세요.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Form */}
            <div className="flex items-center justify-center p-8 bg-gradient-to-br from-indigo-200 via-purple-50 to-pink-200 relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 pointer-events-none"></div>
                <div className="mx-auto w-full max-w-sm space-y-8 relative z-10">
                    <div className="flex flex-col space-y-2 text-center lg:text-left">
                        <Link href="/login" className="inline-flex items-center text-sm text-indigo-700 hover:text-indigo-800 mb-2 font-medium">
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            로그인으로 돌아가기
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            비밀번호 재설정
                        </h1>
                        <p className="text-sm text-gray-500">
                            {step === 1 && "계정 정보를 확인하기 위해 이메일과 보안 키를 입력해주세요."}
                            {step === 2 && "새로운 비밀번호를 설정해주세요."}
                            {step === 3 && "비밀번호가 성공적으로 변경되었습니다."}
                        </p>
                    </div>

                    <div className="mt-8"> {/* Removed white container */}
                        {step === 1 && (
                            <form onSubmit={handleSubmitVerify(onStep1Submit)} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Input
                                            id="email"
                                            placeholder="이메일 주소"
                                            type="email"
                                            autoComplete="email"
                                            disabled={loading}
                                            className="focus:placeholder:text-transparent transition-all"
                                            {...registerVerify("email")}
                                        />
                                        {verifyErrors.email && (
                                            <p className="text-xs text-red-500">{verifyErrors.email.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <textarea
                                            id="securityKey"
                                            rows={3}
                                            className={`flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono text-xs focus:placeholder:text-transparent transition-all ${verifyErrors.securityKey ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                            placeholder="보안 키를 입력해주세요"
                                            onClick={() => {
                                                // If current value is empty, do nothing special (browser handles focus)
                                                // If user wants placeholder to disappear on click (which is essentially on focus), 
                                                // using the class focus:placeholder:text-transparent handles it.
                                            }}
                                            {...registerVerify("securityKey")}
                                        />
                                        {verifyErrors.securityKey && (
                                            <p className="text-xs text-red-500">{verifyErrors.securityKey.message}</p>
                                        )}
                                        <p className="text-xs text-gray-500">
                                            * 설정 {'>'} 보안 키 관리에서 발급받은 키입니다.
                                        </p>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full text-base py-5 shadow-lg hover:shadow-xl transition-all border border-indigo-600/20 hover:border-indigo-600/50" disabled={loading}>
                                    <KeyRound className="w-4 h-4 mr-2" />
                                    다음 단계
                                </Button>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleSubmitReset(finalSubmit)} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="bg-indigo-50/80 p-3 rounded-lg text-sm text-indigo-800 mb-4 border border-indigo-100">
                                    <p className="font-semibold text-xs text-indigo-600 mb-1">확인된 계정</p>
                                    <p className="font-mono">{verifiedData?.email}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Input
                                            id="newPassword"
                                            placeholder="새 비밀번호 (6자 이상)"
                                            type="password"
                                            disabled={loading}
                                            className="focus:placeholder:text-transparent transition-all"
                                            {...registerReset("newPassword")}
                                        />
                                        {resetErrors.newPassword && (
                                            <p className="text-xs text-red-500">{resetErrors.newPassword.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Input
                                            id="confirmPassword"
                                            placeholder="새 비밀번호 확인"
                                            type="password"
                                            disabled={loading}
                                            className="focus:placeholder:text-transparent transition-all"
                                            {...registerReset("confirmPassword")}
                                        />
                                        {resetErrors.confirmPassword && (
                                            <p className="text-xs text-red-500">{resetErrors.confirmPassword.message}</p>
                                        )}
                                    </div>
                                </div>

                                {globalError && (
                                    <div className="rounded-md bg-red-50 p-3 border border-red-100">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-red-800">{globalError}</p>
                                                {globalError.includes("이메일") && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setStep(1)}
                                                        className="mt-1 text-xs font-semibold text-red-700 underline hover:text-red-800"
                                                    >
                                                        처음으로 돌아가기
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                    >
                                        취소
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-[2] py-5 shadow-lg border border-indigo-600/20 hover:border-indigo-600/50"
                                        disabled={loading}
                                    >
                                        {loading ? "변경 중..." : "비밀번호 변경"}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {step === 3 && (
                            <div className="text-center py-8 animate-in zoom-in duration-300">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
                                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">변경 완료!</h3>
                                <p className="text-gray-500 text-sm mb-8">
                                    비밀번호가 안전하게 변경되었습니다.<br />
                                    이제 새 비밀번호로 로그인하세요.
                                </p>
                                <Button
                                    asChild
                                    className="w-full text-base py-5 shadow-lg border border-indigo-600/20 hover:border-indigo-600/50"
                                >
                                    <Link href="/login">
                                        로그인하러 가기
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
