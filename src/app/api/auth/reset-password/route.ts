
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { decryptKey } from "@/lib/crypto";
import { z } from "zod";

const resetSchema = z.object({
    email: z.string().email(),
    securityKey: z.string().min(1),
    newPassword: z.string().min(6),
});

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const { email, securityKey, newPassword } = resetSchema.parse(json);

        // 1. Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Return generic error for security
            return NextResponse.json(
                { message: "이메일 또는 보안 키가 올바르지 않습니다." },
                { status: 400 }
            );
        }

        // 2. Verify Security Key
        // User must have an encryption key to use this feature
        if (!user.encryptionKey) {
            return NextResponse.json(
                { message: "계정에 설정된 보안 키가 없습니다." },
                { status: 400 }
            );
        }

        let decryptedKey = "";
        try {
            decryptedKey = decryptKey(user.encryptionKey);
        } catch (e) {
            console.error("Key decryption failed during reset:", e);
            return NextResponse.json(
                { message: "서버 내부 오류: 키 검증 실패" },
                { status: 500 }
            );
        }

        // Compare keys (simple string comparison)
        // Trim whitespace just in case user pasted with spaces
        if (decryptedKey !== securityKey.trim()) {
            return NextResponse.json(
                { message: "이메일 또는 보안 키가 올바르지 않습니다." },
                { status: 400 }
            );
        }

        // 3. Update Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        return NextResponse.json({ message: "비밀번호가 성공적으로 변경되었습니다." });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "입력 값이 올바르지 않습니다." }, { status: 400 });
        }
        console.error("Password reset error:", error);
        return NextResponse.json(
            { message: "알 수 없는 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
