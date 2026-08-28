import { RequestHandler, Router } from "express";
import { PrismaClient } from "../generated/prisma/client";

type PostBody = {
    title?: unknown
    slug?: unknown
    content?: unknown
    excerpt?: unknown
    coverImageKey?: unknown
    status?: unknown
}

type PostStatus = "DRAFT" | "PUBLISHED";

function isStatus(value: unknown): value is PostStatus {
    return value === "DRAFT" || value === "PUBLISHED";
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

export function createPostRouter(prisma: PrismaClient, requireAdmin: RequestHandler): Router {
    const router = Router();

    router.get("/posts", async (_req, res) => {
        const posts = await prisma.post.findMany({
            where: { status: "PUBLISHED" },
            orderBy: { publishedAt: "desc" },
        });
        res.json(posts);
    });

    router.get("/posts/:slug", async (req, res) => {
        const post = await prisma.post.findFirst({ where: { slug: req.params.slug, status: "PUBLISHED" } });
        if (!post) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        res.json(post);
    });

    const admin = Router();
    admin.use(requireAdmin);

    admin.get("/posts", async (_req, res) => {
        res.json(await prisma.post.findMany({ orderBy: { updatedAt: "desc" } }));
    });

    admin.post("/posts", async (req, res) => {
        const body = req.body as PostBody;
        if (!isNonEmptyString(body.title) || !isNonEmptyString(body.slug) || !isNonEmptyString(body.content) || (body.status !== undefined && !isStatus(body.status))) {
            res.status(400).json({ message: "title, slug, and content are required; status must be DRAFT or PUBLISHED" });
            return;
        }

        const status = body.status ?? "DRAFT";
        const post = await prisma.post.create({
            data: {
                title: body.title.trim(),
                slug: body.slug.trim(),
                content: body.content,
                excerpt: typeof body.excerpt === "string" ? body.excerpt : null,
                coverImageKey: typeof body.coverImageKey === "string" ? body.coverImageKey : null,
                status,
                publishedAt: status === "PUBLISHED" ? new Date() : null,
                authorId: req.session!.userId,
            },
        });
        res.status(201).json(post);
    });

    admin.patch("/posts/:id", async (req, res) => {
        const body = req.body as PostBody;
        if ((body.title !== undefined && !isNonEmptyString(body.title)) || (body.slug !== undefined && !isNonEmptyString(body.slug)) || (body.content !== undefined && !isNonEmptyString(body.content)) || (body.status !== undefined && !isStatus(body.status))) {
            res.status(400).json({ message: "Invalid post fields" });
            return;
        }

        const status = body.status as PostStatus | undefined;
        const post = await prisma.post.update({
            where: { id: req.params.id },
            data: {
                ...(body.title !== undefined ? { title: body.title.trim() } : {}),
                ...(body.slug !== undefined ? { slug: body.slug.trim() } : {}),
                ...(body.content !== undefined ? { content: body.content } : {}),
                ...(body.excerpt !== undefined ? { excerpt: typeof body.excerpt === "string" ? body.excerpt : null } : {}),
                ...(body.coverImageKey !== undefined ? { coverImageKey: typeof body.coverImageKey === "string" ? body.coverImageKey : null } : {}),
                ...(status ? { status, publishedAt: status === "PUBLISHED" ? new Date() : null } : {}),
            },
        });
        res.json(post);
    });

    admin.delete("/posts/:id", async (req, res) => {
        await prisma.post.delete({ where: { id: req.params.id } });
        res.status(204).send();
    });

    router.use("/admin", admin);
    return router;
}
