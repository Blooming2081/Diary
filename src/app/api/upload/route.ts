import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { encryptImage } from "@/lib/crypto";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes as any);

        // Validate image magic numbers
        const header = buffer.subarray(0, 4).toString('hex');
        const isImage =
            header.startsWith('89504e47') || // PNG
            header.startsWith('ffd8ff') ||     // JPEG
            header.startsWith('47494638') || // GIF
            header.startsWith('52494646');   // WEBP (RIFF)

        if (!isImage) {
            console.error(`[Upload] Invalid image signature: ${header}`);
            return NextResponse.json({ message: "Invalid image file" }, { status: 400 });
        }

        console.log(`[Upload] Valid image received: ${file.name}, Header: ${header}`);

        console.log(`[Upload] Received file: ${file.name}, Size: ${buffer.length} bytes`);
        console.log(`[Upload] First 4 bytes: ${buffer.subarray(0, 4).toString('hex')}`);

        // Ensure uploads directory exists
        const uploadDir = path.join(process.cwd(), "public/uploads");
        await mkdir(uploadDir, { recursive: true });

        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;
        const filepath = path.join(uploadDir, filename);

        // Encrypt image if user has a key
        let finalBuffer = buffer;
        if (session.user.encryptionKey) {
            try {
                finalBuffer = encryptImage(buffer, session.user.encryptionKey);
                console.log(`[Upload] Image encrypted for user: ${session.user.email}`);
            } catch (error) {
                console.error("[Upload] Encryption failed:", error);
                return NextResponse.json({ message: "Encryption failed" }, { status: 500 });
            }
        } else {
            console.warn(`[Upload] No encryption key found for user: ${session.user.email}. Saving unencrypted.`);
            // Ideally we should enforce encryption, but for now let's allow unencrypted for legacy support or error handling
            // OR enforce it:
            // return NextResponse.json({ message: "Encryption key missing. Please restore your key in settings." }, { status: 400 });
        }

        await writeFile(filepath, finalBuffer);
        console.log(`[Upload] Saved to: ${filepath}`);

        return NextResponse.json({ url: `/api/uploads/${filename}` });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { message: "Failed to upload file" },
            { status: 500 }
        );
    }
}
