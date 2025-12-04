import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    matcher: [
        "/",
        "/write",
        "/search",
        "/settings",
        "/diary/:path*",
        "/api/diaries",
        "/api/upload",
        "/api/user/:path*",
        "/api/moods",
    ],
};
