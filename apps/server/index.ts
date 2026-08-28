import "dotenv/config";
import express, { Request, Response } from "express";
import { GoogleOAuthAdapter } from "./infrastructure/auth/google-oauth.adapter";
import { createAuthRouter } from "./infrastructure/http/auth.routes";

const app = express();
const PORT = 3030;

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI) {
  app.use("/auth", createAuthRouter(GoogleOAuthAdapter.fromEnv()));
}

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello from Express and pnpm!' });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
