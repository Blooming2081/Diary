import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { encryptText, decryptText, decryptKey } from "@/lib/crypto";

const diarySchema = z.object({
    title: z.string().min(1),
    content: z.string(),
    weather: z.enum(["SUNNY", "CLOUDY", "RAINY", "SNOWY"]),
    moodIds: z.array(z.string()),
    date: z.string().transform((str) => new Date(str)),
    isSecret: z.boolean().optional(),
});

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { title, content, weather, moodIds, date, isSecret } = diarySchema.parse(body);

        let finalContent = content;

        if (isSecret) {
            // Check if user has encryption key
            const user = await prisma.user.findUnique({ where: { id: session.user.id } });
            if (!user?.encryptionKey) {
                return NextResponse.json(
                    { message: "보안 키가 설정되어 있지 않아 비밀 일기를 작성할 수 없습니다." },
                    { status: 400 }
                );
            }

            try {
                const rawKey = decryptKey(user.encryptionKey);
                finalContent = encryptText(content, rawKey);
            } catch (e) {
                return NextResponse.json({ message: "키 검증 실패" }, { status: 500 });
            }
        }

        const diary = await prisma.diary.create({
            data: {
                title,
                content: finalContent,
                weather,
                date,
                // @ts-ignore
                isSecret: isSecret || false,
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
    const type = searchParams.get("type"); // 'all', 'general', 'secret'

    try {
        const where: any = {
            userId: session.user.id,
        };

        if (type === 'secret') {
            where.isSecret = true;
        } else if (type === 'general') {
            where.isSecret = false;
        }
        // if type is 'all' or undefined, we don't filter by isSecret

        if (search) {
            where.AND = [
                ...(where.AND || []),
                {
                    OR: [
                        { title: { contains: search, mode: "insensitive" } },
                        // Content search only applies to NON-secret diaries or we assume secret diaries won't match encrypted text
                        {
                            AND: [
                                { isSecret: false },
                                { content: { contains: search, mode: "insensitive" } }
                            ]
                        }
                    ]
                }
            ];
        }

        if (weather) {
            where.weather = weather;
        }

        if (moodId) {
            const moodIds = moodId.split(",");
            where.AND = [
                ...(where.AND || []),
                ...moodIds.map((id) => ({
                    moods: {
                        some: {
                            moodId: id,
                        },
                    },
                }))
            ];
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

        // Decrypt secret diaries
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { encryptionKey: true }
        });

        let rawKey = "";
        if (user?.encryptionKey) {
            try {
                rawKey = decryptKey(user.encryptionKey);
            } catch (e) {
                console.error("Failed to decrypt user key for diary fetching");
            }
        }

        const decryptedDiaries = diaries.map(d => {
            if ((d as any).isSecret && rawKey) {
                try {
                    return { ...d, content: decryptText(d.content, rawKey) };
                } catch (e) {
                    return { ...d, content: "(암호화 해제 실패)" };
                }
            }
            return d;
        });

        return NextResponse.json(decryptedDiaries);
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to fetch diaries" },
            { status: 500 }
        );
    }
}
