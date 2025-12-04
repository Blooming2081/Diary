"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

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
        <div className="flex flex-col space-y-6">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    회원가입
                </h1>
                <p className="text-sm text-gray-500">
                    새로운 계정을 만들어 일기를 작성해보세요.
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
                        {...register("confirmPassword")}
                    />
                    {errors.confirmPassword && (
                        <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
                    )}
                </div>

                {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "가입 중..." : "회원가입"}
                </Button>
            </form>

            <div className="text-center text-sm text-gray-500">
                이미 계정이 있으신가요?{" "}
                <Link
                    href="/login"
                    className="font-semibold text-indigo-600 hover:text-indigo-500"
                >
                    로그인
                </Link>
            </div>
        </div>
    );
}
