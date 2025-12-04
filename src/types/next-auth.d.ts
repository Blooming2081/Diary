import NextAuth from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            gridColumns?: number;
            viewMode?: string;
            searchGridColumns?: number;
            searchViewMode?: string;
        };
    }
}
