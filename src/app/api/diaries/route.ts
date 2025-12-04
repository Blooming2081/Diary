import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const diarySchema = z.object({
    title: z.string().min(1),
    content: z.string(),
    weather: z.enum(["SUNNY", "CLOUDY", "RAINY", "SNOWY"]),
    moodIds: z.array(z.string()),
    date: z.string().transform((str) => new Date(str)),
});

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { title, content, weather, moodIds, date } = diarySchema.parse(body);

        const diary = await prisma.diary.create({
            data: {
                title,
                content,
                weather,
                date,
                userId: session.user.id,
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

        return NextResponse.json(diary, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Failed to create diary" },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit");
    const search = searchParams.get("search");
    const weather = searchParams.get("weather");
    const moodId = searchParams.get("moodId");

    try {
        const where: any = {
            userId: session.user.id,
        };

        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
            ];
        }

        if (weather) {
            where.weather = weather;
        }

        if (moodId) {
            where.moods = {
                some: {
                    moodId: moodId,
                },
            };
        }

        const diaries = await prisma.diary.findMany({
            where,
            orderBy: { date: "desc" },
            take: limit ? parseInt(limit) : undefined,
            include: {
                moods: {
                    include: {
                        mood: true,
                    },
                },
            },
        });
        return NextResponse.json(diaries);
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to fetch diaries" },
            { status: 500 }
        );
    }
}
