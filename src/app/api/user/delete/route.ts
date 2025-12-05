import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    try {
        // 1. Find all diaries to delete associated images
        const diaries = await prisma.diary.findMany({
            where: { userId },
            select: { content: true },
        });

        // 2. Delete images from filesystem
        const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;

        for (const diary of diaries) {
            let match;
            // Reset regex lastIndex for each content string if reusing regex object, 
            // but here we create logic inside loop or use matchAll if available in target ES version.
            // Safe approach with exec loop:
            while ((match = imgRegex.exec(diary.content)) !== null) {
                const src = match[1];
                if (src && src.includes("/uploads/")) {
                    try {
                        const filename = path.basename(src);
                        const filePath = path.join(process.cwd(), "public/uploads", filename);

                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    } catch (e) {
                        console.error("Failed to delete image file:", e);
                    }
                }
            }
        }

        // 3. Delete DB Records in order (Child -> Parent where Cascade is missing)

        // Delete Diaries (Cascade deletes DiaryMoods)
        await prisma.diary.deleteMany({
            where: { userId },
        });

        // Delete Moods (Cascade deletes DiaryMoods)
        await prisma.mood.deleteMany({
            where: { userId },
        });

        // 4. Finally Delete User
        await prisma.user.delete({
            where: { id: userId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Delete account error:", error);
        return new NextResponse("Failed to delete account", { status: 500 });
    }
}
