"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Home, PenTool, Search, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
    { name: "홈", href: "/", icon: Home },
    { name: "검색", href: "/search", icon: Search },
    { name: "설정", href: "/settings", icon: Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Sidebar */}
            <div className="hidden w-64 flex-col bg-white shadow-lg md:flex h-full">
                <div className="flex h-16 items-center justify-center border-b">
                    <h1 className="text-xl font-bold text-indigo-600">My Diary</h1>
                </div>
                <div className="flex flex-1 flex-col overflow-y-auto p-4">
                    <nav className="space-y-2">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                                        pathname === item.href
                                            ? "bg-indigo-50 text-indigo-600"
                                            : "text-gray-700 hover:bg-gray-100"
                                    )}
                                >
                                    <Icon className="mr-3 h-5 w-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="border-t p-4 mt-auto">
                    <div className="mb-4 flex items-center px-4">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                            {session?.user?.name?.[0] || "U"}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                                {session?.user?.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate w-32">
                                {session?.user?.email}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="secondary"
                        className="w-full justify-start transition-transform hover:scale-105 shadow-md hover:bg-gray-200"
                        onClick={() => signOut()}
                    >
                        <LogOut className="mr-3 h-4 w-4" />
                        로그아웃
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-8">{children}</main>
            </div>
        </div>
    );
}
