
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Logo from "@/components/ui/logo";

const loginSchema = z.object({
    email: z.string().email("유효한 이메일을 입력해주세요."),
    password: z.string().min(1, "비밀번호를 입력해주세요."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        setLoading(true);
        setError(null);

        try {
            const result = await signIn("credentials", {
                redirect: false,
                email: data.email,
                password: data.password,
            });

            if (result?.error) {
                setError("이메일 또는 비밀번호가 올바르지 않습니다.");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError("로그인 중 오류가 발생했습니다.");
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
                                    당신의 하루를 기록하세요
                                </h2>
                                <p className="text-zinc-100 text-lg drop-shadow-lg font-medium leading-relaxed">
                                    소중한 기억들을 안전하게 보관하고,<br />
                                    언제든지 꺼내보세요.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="flex items-center justify-center p-8 bg-gradient-to-br from-indigo-200 via-purple-50 to-pink-200 relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 pointer-events-none"></div>
                <div className="mx-auto w-full max-w-sm space-y-8 relative z-10">
                    <div className="flex flex-col space-y-2 text-center lg:text-left">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            로그인
                        </h1>
                        <p className="text-sm text-gray-500">
                            계정에 로그인하여 일기를 작성하세요.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
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
                                    autoComplete="current-password"
                                    disabled={loading}
                                    className="focus:placeholder:text-transparent transition-all"
                                    {...register("password")}
                                />
                                {errors.password && (
                                    <p className="text-xs text-red-500">{errors.password.message}</p>
                                )}
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-500 text-center font-medium bg-red-50 p-2 rounded">{error}</p>}

                        <Button type="submit" className="w-full text-base py-5 shadow-lg hover:shadow-xl transition-all border border-indigo-600/20 hover:border-indigo-600/50" disabled={loading}>
                            {loading ? "로그인 중..." : "로그인"}
                        </Button>
                    </form>

                    <div className="space-y-4 text-center text-sm text-gray-500">
                        <div>
                            계정이 없으신가요?{" "}
                            <Link
                                href="/register"
                                className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
                            >
                                회원가입
                            </Link>
                        </div>
                        <div>
                            비밀번호를 잊으셨나요?{" "}
                            <Link
                                href="/reset-password"
                                className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
                            >
                                비밀번호 찾기
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
