import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const settingsSchema = z.object({
    gridColumns: z.number().min(1).max(6).optional(),
    viewMode: z.enum(["title", "content", "brief"]).optional(),
    searchGridColumns: z.number().min(1).max(6).optional(),
    searchViewMode: z.enum(["title", "content", "brief"]).optional(),
    encryptionKey: z.string().min(32).optional(),
});

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const json = await req.json();
        const body = settingsSchema.parse(json);

        const updateData: any = {};
        if (body.gridColumns) updateData.gridColumns = body.gridColumns;
        if (body.viewMode) updateData.viewMode = body.viewMode;
        if (body.searchGridColumns) updateData.searchGridColumns = body.searchGridColumns;
        if (body.searchViewMode) updateData.searchViewMode = body.searchViewMode;

        if (body.encryptionKey) {
            // Lazy load crypto/fs modules for this heavy operation
            const { encryptKey, decryptKey, decryptImage, encryptImage } = await import("@/lib/crypto");
            const fs = await import("fs");
            const path = await import("path");

            // 1. Get Old Key
            const userRecord = await prisma.user.findUnique({ where: { id: session.user.id } });

            // Only proceed with re-encryption if the user ALREADY has a key and we can decrypt it.
            if (userRecord?.encryptionKey) {
                try {
                    const oldKeyRaw = decryptKey(userRecord.encryptionKey);
                    const newKeyRaw = body.encryptionKey;

                    // 2. Find all diaries to get image paths
                    const diaries = await prisma.diary.findMany({
                        where: { userId: session.user.id },
                        select: { content: true }
                    });

                    // 3. Extract all image filenames
                    const imageFilenames = new Set<string>();
                    // Capture src attributes with single or double quotes
                    const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;

                    for (const diary of diaries) {
                        let match;
                        while ((match = imgRegex.exec(diary.content)) !== null) {
                            const src = match[1];
                            // Only process local upload paths
                            if (src && src.includes("/uploads/")) {
                                const filename = path.basename(src);
                                if (filename) imageFilenames.add(filename);
                            }
                        }
                    }

                    console.log(`[KeyUpdate] Found ${imageFilenames.size} images to re-encrypt for user ${session.user.id}`);

                    // 4. Re-encrypt each file
                    for (const filename of imageFilenames) {
                        const filePath = path.join(process.cwd(), "public/uploads", filename);
                        if (fs.existsSync(filePath)) {
                            try {
                                const fileBuffer = fs.readFileSync(filePath) as unknown as Buffer;
                                // Decrypt with OLD key
                                const decrypted = decryptImage(fileBuffer, oldKeyRaw);
                                // Encrypt with NEW key
                                const reEncrypted = encryptImage(decrypted, newKeyRaw);
                                // Overwrite file
                                fs.writeFileSync(filePath, reEncrypted);
                                console.log(`[KeyUpdate] Successfully re-encrypted: ${filename}`);
                            } catch (err) {
                                console.error(`[KeyUpdate] Failed to re-encrypt ${filename}:`, err);
                            }
                        }
                    }

                } catch (error) {
                    console.error("[KeyUpdate] Critical error during re-encryption process:", error);
                    // We log but continue to update the key in DB so the user isn't stuck state.
                }
            }

            updateData.encryptionKey = encryptKey(body.encryptionKey);
        }

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("Settings update error:", error);
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 });
        }
        return new NextResponse(null, { status: 500 });
    }
}
