"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Logo from "@/components/ui/logo";

const registerSchema = z.object({
    name: z.string().min(2, "이름은 2글자 이상이어야 합니다."),
    email: z.string().email("유효한 이메일을 입력해주세요."),
    password: z.string().min(6, "비밀번호는 6글자 이상이어야 합니다."),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormValues) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "회원가입 실패");
            }

            router.push("/login");
        } catch (err: any) {
            setError(err.message);
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
                        src="/images/register-bg-analog.png"
                        alt="Analog Secure Diary"
                        className="w-full h-full object-cover opacity-60"
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
                                    추억을 안전하게 암호화
                                </h2>
                                <p className="text-zinc-100 text-lg drop-shadow-lg font-medium leading-relaxed">
                                    당신의 모든 기록은 강력한 암호화 기술로<br />
                                    철통같이 보호됩니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Register Form */}
            <div className="flex items-center justify-center p-8 bg-gradient-to-br from-indigo-200 via-purple-50 to-pink-200 relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 pointer-events-none"></div>
                <div className="mx-auto w-full max-w-sm space-y-8 relative z-10">
                    <div className="flex flex-col space-y-2 text-center lg:text-left">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            회원가입
                        </h1>
                        <p className="text-sm text-gray-500">
                            새 계정을 만드세요.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                id="name"
                                placeholder="이름"
                                type="text"
                                autoCapitalize="none"
                                autoCorrect="off"
                                disabled={loading}
                                className="focus:placeholder:text-transparent transition-all"
                                {...register("name")}
                            />
                            {errors.name && (
                                <p className="text-xs text-red-500">{errors.name.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Input
                                id="email"
                                placeholder="name@example.com"
                                type="email"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                disabled={loading}
                                className="focus:placeholder:text-transparent transition-all"
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="text-xs text-red-500">{errors.email.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Input
                                id="password"
                                placeholder="비밀번호"
                                type="password"
                                autoComplete="new-password"
                                disabled={loading}
                                className="focus:placeholder:text-transparent transition-all"
                                {...register("password")}
                            />
                            {errors.password && (
                                <p className="text-xs text-red-500">{errors.password.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Input
                                id="confirmPassword"
                                placeholder="비밀번호 확인"
                                type="password"
                                autoComplete="new-password"
                                disabled={loading}
                                className="focus:placeholder:text-transparent transition-all"
                                {...register("confirmPassword")}
                            />
                            {errors.confirmPassword && (
                                <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {error && <p className="text-sm text-red-500 text-center font-medium bg-red-50 p-2 rounded">{error}</p>}

                        <Button type="submit" className="w-full text-base py-5 shadow-lg hover:shadow-xl transition-all border border-indigo-600/20 hover:border-indigo-600/50" disabled={loading}>
                            {loading ? "가입 중..." : "회원가입"}
                        </Button>
                    </form>

                    <div className="text-center text-sm text-gray-500">
                        이미 계정이 있으신가요?{" "}
                        <Link
                            href="/login"
                            className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
                        >
                            로그인
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
