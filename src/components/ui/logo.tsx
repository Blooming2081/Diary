import { BookOpen } from "lucide-react";

export default function Logo({ className = "", size = 32, theme = "light" }: { className?: string; size?: number, theme?: "dark" | "light" }) {
    const textColor = theme === "dark"
        ? "bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent"
        : "bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent";

    return (
        <div className={`flex items-center gap-2 font-bold ${className}`}>
            <div className="relative flex items-center justify-center">
                <div className={`absolute inset-0 bg-indigo-500 blur-lg opacity-50 rounded-full`} />
                <BookOpen size={size} className="relative z-10 text-indigo-500" />
            </div>
            <span className={`tracking-tight ${textColor}`} style={{ fontSize: size }}>
                Diary
            </span>
        </div>
    );
}
