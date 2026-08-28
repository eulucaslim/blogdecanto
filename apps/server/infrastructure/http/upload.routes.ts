import { RequestHandler, Router } from "express";
import { StorageService } from "../../application/interfaces/storage";

type UploadBody = {
    filename?: unknown
    contentType?: unknown
    size?: unknown
    purpose?: unknown
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function safePathSegment(value: string, fallback: string): string {
    const normalized = value.toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-");
    return normalized.replace(/^-+|-+$/g, "").slice(0, 40) || fallback;
}

function safeFilename(filename: string): string {
    const normalized = filename.toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-");
    return normalized.replace(/^-+|-+$/g, "").slice(0, 100) || "upload";
}

export function createUploadRouter(storage: StorageService | null, requireAdmin: RequestHandler): Router {
    const router = Router();
    router.use(requireAdmin);

    router.post("/admin/uploads/presign", async (req, res) => {
        if (!storage) {
            res.status(503).json({ message: "Google Cloud Storage is not configured" });
            return;
        }

        const body = req.body as UploadBody;
        if (!isNonEmptyString(body.filename)) {
            res.status(400).json({ message: "filename is required" });
            return;
        }
        if (body.contentType !== undefined && !isNonEmptyString(body.contentType)) {
            res.status(400).json({ message: "contentType must be a non-empty string" });
            return;
        }
        if (body.size !== undefined && (typeof body.size !== "number" || !Number.isSafeInteger(body.size) || body.size <= 0 || body.size > 10 * 1024 * 1024)) {
            res.status(400).json({ message: "size must be a positive file size up to 10 MB" });
            return;
        }

        const purpose = isNonEmptyString(body.purpose) ? safePathSegment(body.purpose, "cover") : "cover";
        const key = `uploads/${purpose}/${crypto.randomUUID()}-${safeFilename(body.filename)}`;
        const contentType = isNonEmptyString(body.contentType) ? body.contentType : "application/octet-stream";

        try {
            const uploadUrl = await storage.getSignedUploadUrl(key, contentType);
            res.json({ key, objectKey: key, uploadUrl });
        } catch {
            res.status(503).json({ message: "Google Cloud Storage is unavailable" });
        }
    });

    router.get("/admin/uploads/url", async (req, res) => {
        if (!storage) {
            res.status(503).json({ message: "Google Cloud Storage is not configured" });
            return;
        }

        const key = typeof req.query.key === "string" ? req.query.key : "";
        if (!key || !key.startsWith("uploads/")) {
            res.status(400).json({ message: "A valid upload key is required" });
            return;
        }

        try {
            const url = await storage.getSignedUrl(key);
            res.json({ key, url, publicUrl: url, fileUrl: url });
        } catch {
            res.status(503).json({ message: "Google Cloud Storage is unavailable" });
        }
    });

    return router;
}
