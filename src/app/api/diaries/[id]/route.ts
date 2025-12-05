import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const diarySchema = z.object({
    title: z.string().min(1),
    content: z.string(),
    weather: z.enum(["SUNNY", "CLOUDY", "RAINY", "SNOWY"]),
    moodIds: z.array(z.string()),
    date: z.string().transform((str) => new Date(str)),
});

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const diary = await prisma.diary.findUnique({
            where: { id },
            include: {
                moods: {
                    include: {
                        mood: true,
                    },
                },
            },
        });

        if (!diary || diary.userId !== session.user.id) {
            return NextResponse.json({ message: "Not found" }, { status: 404 });
        }

        return NextResponse.json(diary);
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to fetch diary" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await req.json();
        const { title, content, weather, moodIds, date } = diarySchema.parse(body);

        const diary = await prisma.diary.findUnique({
            where: { id },
        });

        if (!diary || diary.userId !== session.user.id) {
            return NextResponse.json({ message: "Not found" }, { status: 404 });
        }

        // Update diary and moods
        // First delete existing mood connections
        await prisma.diaryMood.deleteMany({
            where: { diaryId: id },
        });

        const updatedDiary = await prisma.diary.update({
            where: { id },
            data: {
                title,
                content,
                weather,
                date,
                moods: {
                    create: moodIds.map((moodId) => ({
                        mood: { connect: { id: moodId } },
                    })),
                },
            },
            include: {
                moods: {
                    include: {
                        mood: true,
                    },
                },
            },
        });

        return NextResponse.json(updatedDiary);
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to update diary" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const diary = await prisma.diary.findUnique({
            where: { id },
        });

        if (!diary || diary.userId !== session.user.id) {
            return NextResponse.json({ message: "Not found" }, { status: 404 });
        }

        // Delete associated images
        try {
            const fs = await import("fs");
            const path = await import("path");

            const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
            let match;
            while ((match = imgRegex.exec(diary.content)) !== null) {
                const src = match[1];
                if (src && src.includes("/uploads/")) {
                    const filename = path.basename(src);
                    const filePath = path.join(process.cwd(), "public/uploads", filename);

                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to delete associated images:", error);
            // Continue to delete diary entry even if image deletion fails
        }

        await prisma.diary.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Diary deleted" });
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to delete diary" },
            { status: 500 }
        );
    }
}
