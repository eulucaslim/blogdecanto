import { Router, Response } from "express";
import { GoogleOAuthService } from "../../application/interfaces/auth";
import { SessionService } from "../../application/interfaces/session";
import { PrismaClient } from "../generated/prisma/client";

const DEFAULT_COOKIE_NAME = "blog_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type AuthRouterProps = {
    authService: GoogleOAuthService
    sessionService: SessionService
    prisma: PrismaClient
    cookieName?: string
}

function setSessionCookie(res: Response, name: string, value: string, maxAge: number): void {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader("Set-Cookie", `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax${secure}`);
}

function clearSessionCookie(res: Response, name: string): void {
    setSessionCookie(res, name, "", 0);
}

function readSession(req: { header(name: string): string | undefined }, sessionService: SessionService, cookieName: string) {
    const value = req.header("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`));
    if (!value) {
        return null;
    }
    try {
        return sessionService.verify(decodeURIComponent(value.slice(cookieName.length + 1)));
    } catch {
        return null;
    }
}

function usernameFromEmail(email: string): string {
    const localPart = email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/^-+|-+$/g, "");
    return (localPart || "google-user").slice(0, 40);
}

async function findAvailableUsername(prisma: PrismaClient, email: string): Promise<string> {
    const base = usernameFromEmail(email);
    let username = base;
    for (let suffix = 1; suffix <= 100; suffix += 1) {
        if (!(await prisma.user.findUnique({ where: { username } }))) {
            return username;
        }
        username = `${base.slice(0, 40 - String(suffix).length - 1)}-${suffix}`;
    }
    throw new Error("Unable to allocate a username for the Google account");
}

export function createAuthRouter({ authService, sessionService, prisma, cookieName = process.env.SESSION_COOKIE_NAME ?? DEFAULT_COOKIE_NAME }: AuthRouterProps): Router {
    const router = Router();

    router.get("/google", (req, res) => {
        const state = typeof req.query.state === "string" ? req.query.state : undefined;
        res.redirect(authService.getAuthorizationUrl(state));
    });

    router.get("/google/callback", async (req, res) => {
        const code = typeof req.query.code === "string" ? req.query.code : undefined;
        if (!code) {
            res.status(400).json({ message: "Google authorization code is required" });
            return;
        }

        try {
            const identity = await authService.exchangeAuthorizationCode(code);
            if (!identity.emailVerified) {
                res.status(403).json({ message: "A verified Google email is required" });
                return;
            }

            const existing = await prisma.user.findUnique({ where: { googleSubject: identity.subject } })
                ?? await prisma.user.findUnique({ where: { email: identity.email } });
            const user = existing
                ? await prisma.user.update({
                    where: { id: existing.id },
                    data: { googleSubject: identity.subject, avatarUrl: identity.picture ?? null },
                })
                : await prisma.user.create({
                    data: {
                        username: await findAvailableUsername(prisma, identity.email),
                        email: identity.email,
                        googleSubject: identity.subject,
                        avatarUrl: identity.picture ?? null,
                    },
                });

            const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
            setSessionCookie(res, cookieName, sessionService.sign({ userId: user.id, role: user.role, expiresAt }), SESSION_MAX_AGE_SECONDS);
            res.json({ id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl, role: user.role });
        } catch {
            res.status(401).json({ message: "Google authentication failed" });
        }
    });

    router.get("/session", async (req, res) => {
        const session = readSession(req, sessionService, cookieName);
        if (!session) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: session.userId } });
        if (!user) {
            clearSessionCookie(res, cookieName);
            res.status(401).json({ message: "Session user not found" });
            return;
        }
        res.json({ id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl, role: user.role });
    });

    router.post("/logout", (req, res) => {
        clearSessionCookie(res, cookieName);
        res.status(204).send();
    });

    return router;
}
