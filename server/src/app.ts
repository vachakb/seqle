import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRouter from "./routes/auth.js";
import gamesRouter from "./routes/games.js";
import statsRouter from "./routes/stats.js";
import { config } from "./config.js";

const app = express();

app.use(cors({
  origin: config.corsOrigin || "*",
  credentials: true,
}));
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests, please try again later" },
});

const gameLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many requests, slow down" },
});

const guessLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many guesses, slow down" },
});

app.use("/api/auth", authLimiter, authRouter);
app.use("/api/games/:sessionId/guess", guessLimiter);
app.use("/api/games", gameLimiter, gamesRouter);
app.use("/api/stats", statsRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
