import { RequestHandler } from "express";
import { GoogleIdentity, GoogleOAuthService } from "../../application/interfaces/auth";

declare global {
    namespace Express {
        interface Request {
            googleIdentity?: GoogleIdentity
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
