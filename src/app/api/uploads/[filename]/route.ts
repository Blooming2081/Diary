import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import mime from "mime";

export async function GET(
    request: Request,
    { params }: { params: { filename: string } }
) {
    const filename = params.filename;
    const filePath = path.join(process.cwd(), "public/uploads", filename);

    console.log(`[Image Serve] Request for: ${filename}`);
    console.log(`[Image Serve] Path: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        console.error(`[Image Serve] File not found: ${filePath}`);
        return new NextResponse("File not found", { status: 404 });
    }

    try {
        const fileBuffer = fs.readFileSync(filePath);
        const mimeType = mime.getType(filePath) || "application/octet-stream";

        console.log(`[Image Serve] Serving with mime: ${mimeType}`);

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": mimeType,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error(`[Image Serve] Error serving ${filename}:`, error);
        return new NextResponse("Error serving file", { status: 500 });
    }
}
