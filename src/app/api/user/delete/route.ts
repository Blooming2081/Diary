import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        await prisma.user.delete({
            where: { id: session.user.id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return new NextResponse(null, { status: 500 });
    }
}
