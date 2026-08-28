import { RequestHandler, Router } from "express";
import { PrismaClient } from "../generated/prisma/client";

type ProfileBody = {
    avatarUrl?: unknown
}

function isSafeHttpUrl(value: unknown): value is string {
    if (typeof value !== "string" || value.trim().length === 0) {
        return false;
    }

    try {
        const url = new URL(value.trim());
        return (url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password;
    } catch {
        return false;
    }
}

export function createProfileRouter(prisma: PrismaClient, requireAdmin: RequestHandler): Router {
    const router = Router();
    router.use(requireAdmin);

    router.patch("/admin/profile", async (req, res) => {
        const body = req.body as ProfileBody | null;
        if (!body || !isSafeHttpUrl(body.avatarUrl)) {
            res.status(400).json({ message: "avatarUrl must be a safe http or https URL" });
            return;
        }

        const user = await prisma.user.update({
            where: { id: req.session!.userId },
            data: { avatarUrl: body.avatarUrl.trim() },
        });

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl,
            role: user.role,
        });
    });

    return router;
}
