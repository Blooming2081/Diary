import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const settingsSchema = z.object({
    gridColumns: z.number().min(1).max(6).optional(),
    viewMode: z.enum(["title", "content", "brief"]).optional(),
    searchGridColumns: z.number().min(1).max(6).optional(),
    searchViewMode: z.enum(["title", "content", "brief"]).optional(),
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

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
        });

        return NextResponse.json(user);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 });
        }
        return new NextResponse(null, { status: 500 });
    }
}
