export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white/90 p-8 shadow-2xl backdrop-blur-sm">
                {children}
            </div>
        </div>
    );
}
