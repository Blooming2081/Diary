import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import mime from "mime";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { decryptImage } from "@/lib/crypto";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;
    const filePath = path.join(process.cwd(), "public/uploads", filename);

    console.log(`[Image Serve] Request for: ${filename}`);
    console.log(`[Image Serve] Path: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        console.error(`[Image Serve] File not found: ${filePath}`);
        return new NextResponse("File not found", { status: 404 });
    }

    try {
        const fileBuffer = fs.readFileSync(filePath) as unknown as Buffer;
        const mimeType = mime.getType(filePath) || "application/octet-stream";

        let finalBuffer = fileBuffer;

        // Attempt decryption if user is logged in and has a key
        const session = await getServerSession(authOptions);
        if (session?.user?.encryptionKey) {
            try {
                finalBuffer = decryptImage(fileBuffer, session.user.encryptionKey);
                console.log(`[Image Serve] Decrypted image for user: ${session.user.email}`);
            } catch (error) {
                // If decryption fails, it might be an old unencrypted image or wrong key.
                // We'll try to serve it as is, but log the error.
                console.warn(`[Image Serve] Decryption failed (serving raw):`, error);
            }
        }

        console.log(`[Image Serve] Serving with mime: ${mimeType}`);

        return new NextResponse(finalBuffer as any, {
            headers: {
                "Content-Type": mimeType,
                "Cache-Control": "private, no-cache, no-store, must-revalidate",
            },
        });
    } catch (error) {
        console.error(`[Image Serve] Error serving ${filename}:`, error);
        return new NextResponse("Error serving file", { status: 500 });
    }
}
