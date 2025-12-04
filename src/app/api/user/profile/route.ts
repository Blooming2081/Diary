import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const profileSchema = z.object({
    name: z.string().min(2).optional(),
    currentPassword: z.string().min(6).optional(),
    newPassword: z.string().min(6).optional(),
});

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const json = await req.json();
        const body = profileSchema.parse(json);

        const updateData: any = {};

        if (body.name) {
            updateData.name = body.name;
        }

        if (body.newPassword) {
            if (!body.currentPassword) {
                return new NextResponse("Current password is required to set new password", { status: 400 });
            }

            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
            });

            if (!user) {
                return new NextResponse("User not found", { status: 404 });
            }

            const isPasswordValid = await bcrypt.compare(
                body.currentPassword,
                user.password
            );

            if (!isPasswordValid) {
                return new NextResponse("Invalid current password", { status: 400 });
            }

            const hashedPassword = await bcrypt.hash(body.newPassword, 12);
            updateData.password = hashedPassword;
        }

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
        });

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 });
        }
        return new NextResponse(null, { status: 500 });
    }
}
