import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const moodSchema = z.object({
    name: z.string().min(1),
});

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const moods = await prisma.mood.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(moods);
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to fetch moods" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name } = moodSchema.parse(body);

        const mood = await prisma.mood.create({
            data: {
                name,
                userId: session.user.id,
            },
        });

        return NextResponse.json(mood, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to create mood" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ message: "Missing id" }, { status: 400 });
        }

        // Verify ownership
        const mood = await prisma.mood.findUnique({
            where: { id },
        });

        if (!mood || mood.userId !== session.user.id) {
            return NextResponse.json({ message: "Not found or unauthorized" }, { status: 404 });
        }

        await prisma.mood.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Mood deleted" });
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to delete mood" },
            { status: 500 }
        );
    }
}
