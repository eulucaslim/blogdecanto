import { Router } from "express";
import { GoogleOAuthService } from "../../application/interfaces/auth";

export function createAuthRouter(authService: GoogleOAuthService): Router {
    const router = Router();

    router.get("/google", (req, res) => {
        const state = typeof req.query.state === "string" ? req.query.state : undefined;
        res.redirect(authService.getAuthorizationUrl(state));
    });

    return router;
}
