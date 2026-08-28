import "dotenv/config";
import express, { Request, Response } from "express";
import { GoogleOAuthAdapter } from "./infrastructure/auth/google-oauth.adapter";
import { SignedSessionService } from "./infrastructure/auth/signed-session.service";
import { DatabaseConnectionPrisma } from "./infrastructure/db/database";
import { createAuthRouter } from "./infrastructure/http/auth.routes";
import { requireAdmin, requireSession } from "./infrastructure/http/auth.middleware";
import { createPostRouter } from "./infrastructure/http/post.routes";
import { createProfileRouter } from "./infrastructure/http/profile.routes";
import { createUploadRouter } from "./infrastructure/http/upload.routes";
import { GoogleCloudStorageService } from "./infrastructure/storage/google-cloud-storage.service";

const app = express();
const PORT = 3030;
app.use(express.json());

const database = process.env.DATABASE_URL
  ? DatabaseConnectionPrisma.create(process.env.DATABASE_URL, null).instance
  : null;
const sessionSecret = process.env.SESSION_SECRET;
const cookieName = process.env.SESSION_COOKIE_NAME ?? "blog_session";
const sessionService = sessionSecret ? new SignedSessionService(sessionSecret) : null;

const adminMiddleware = sessionService
  ? (req: Request, res: Response, next: () => void) => {
      requireSession(sessionService, cookieName)(req, res, () => requireAdmin()(req, res, next));
    }
  : (_req: Request, res: Response) => res.status(503).json({ message: "Sessions are not configured" });
const storage = process.env.GCS_BUCKET_NAME ? GoogleCloudStorageService.fromEnv() : null;
app.use("/api", createUploadRouter(storage, adminMiddleware));

if (database) {
  app.use("/api", createPostRouter(database, adminMiddleware));
  app.use("/api", createProfileRouter(database, adminMiddleware));

  if (sessionService && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI) {
    app.use("/auth", createAuthRouter({
      authService: GoogleOAuthAdapter.fromEnv(),
      sessionService,
      prisma: database,
      cookieName,
    }));
  }
}

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello from Express and pnpm!' });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
