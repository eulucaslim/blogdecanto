import { RequestHandler } from "express";
import { GoogleIdentity, GoogleOAuthService } from "../../application/interfaces/auth";
import { Session, SessionService } from "../../application/interfaces/session";

declare global {
    namespace Express {
        interface Request {
            googleIdentity?: GoogleIdentity
            session?: Session
        }
    }
}

export function requireGoogleIdentity(authService: GoogleOAuthService): RequestHandler {
    return async (req, res, next) => {
        const authorization = req.header("authorization") ?? "";
        const match = /^Bearer\s+(.+)$/i.exec(authorization);

        if (!match) {
            res.status(401).json({ message: "A Google ID token bearer credential is required" });
            return;
        }

        try {
            req.googleIdentity = await authService.verifyIdToken(match[1]);
            next();
        } catch {
            res.status(401).json({ message: "Invalid Google ID token" });
        }
    };
}

function readCookie(header: string | undefined, name: string): string | null {
    const value = header?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
    if (!value) {
        return null;
    }
    try {
        return decodeURIComponent(value.slice(name.length + 1));
    } catch {
        return null;
    }
}

export function requireSession(sessionService: SessionService, cookieName: string): RequestHandler {
    return (req, res, next) => {
        const value = readCookie(req.header("cookie"), cookieName);
        const session = value ? sessionService.verify(value) : null;
        if (!session) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }
        req.session = session;
        next();
    };
}

export function requireAdmin(): RequestHandler {
    return (req, res, next) => {
        if (req.session?.role !== "ADMIN") {
            res.status(403).json({ message: "Administrator access required" });
            return;
        }
        next();
    };
}
