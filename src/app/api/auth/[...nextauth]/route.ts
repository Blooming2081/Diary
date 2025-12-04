import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    gridColumns: (user as any).gridColumns,
                    viewMode: (user as any).viewMode,
                    searchGridColumns: (user as any).searchGridColumns,
                    searchViewMode: (user as any).searchViewMode,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.gridColumns = (user as any).gridColumns;
                token.viewMode = (user as any).viewMode;
                token.searchGridColumns = (user as any).searchGridColumns;
                token.searchViewMode = (user as any).searchViewMode;
            }
            if (trigger === "update" && session) {
                // Handle both flat and nested structures
                token.gridColumns = session.gridColumns ?? session.user?.gridColumns ?? token.gridColumns;
                token.viewMode = session.viewMode ?? session.user?.viewMode ?? token.viewMode;
                token.searchGridColumns = session.searchGridColumns ?? session.user?.searchGridColumns ?? token.searchGridColumns;
                token.searchViewMode = session.searchViewMode ?? session.user?.searchViewMode ?? token.searchViewMode;
                token.name = session.name ?? session.user?.name ?? token.name;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.sub as string;
                session.user.gridColumns = token.gridColumns as number;
                session.user.viewMode = token.viewMode as string;
                session.user.searchGridColumns = token.searchGridColumns as number;
                session.user.searchViewMode = token.searchViewMode as string;
            }
            return session;
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
