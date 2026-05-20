import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { optionalAuth } from "../middleware/auth.js";
import { startGame, submitGuess, getGameState, getDailyStatus } from "../services/game.service.js";

const router = Router();

const startSchema = z.object({
  mode: z.enum(["daily", "practice"]),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
});

const guessSchema = z.object({
  value: z.number().int(),
});

router.post("/start", optionalAuth, validate(startSchema), async (req, res) => {
  try {
    const { mode, difficulty } = req.body;
    const result = await startGame(
      mode,
      difficulty,
      req.user?.userId || null,
      req.guestToken || null,
    );
    res.status(201).json(result);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "DAILY_ALREADY_PLAYED") {
      res.status(409).json({ error: "You've already played today's daily puzzle" });
      return;
    }
    console.error("Start game error:", err);
    res.status(500).json({ error: "Failed to start game" });
  }
});

router.post("/:sessionId/guess", optionalAuth, validate(guessSchema), async (req, res) => {
  try {
    const result = await submitGuess(
      req.params.sessionId as string,
      req.body.value,
      req.user?.userId || null,
      req.guestToken || null,
    );
    res.json(result);
  } catch (err: unknown) {
    if (err instanceof Error) {
      switch (err.message) {
        case "SESSION_NOT_FOUND":
          res.status(404).json({ error: "Game session not found" });
          return;
        case "GAME_ALREADY_FINISHED":
          res.status(400).json({ error: "This game has already ended" });
          return;
        case "MAX_GUESSES_REACHED":
          res.status(400).json({ error: "Maximum guesses reached" });
          return;
      }
    }
    console.error("Guess error:", err);
    res.status(500).json({ error: "Failed to process guess" });
  }
});

router.get("/daily", optionalAuth, async (req, res) => {
  try {
    const status = await getDailyStatus(
      req.user?.userId || null,
      req.guestToken || null,
    );
    res.json(status);
  } catch (err) {
    console.error("Daily status error:", err);
    res.status(500).json({ error: "Failed to get daily status" });
  }
});

router.get("/:sessionId", optionalAuth, async (req, res) => {
  try {
    const state = await getGameState(
      req.params.sessionId as string,
      req.user?.userId || null,
      req.guestToken || null,
    );
    res.json(state);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "SESSION_NOT_FOUND") {
      res.status(404).json({ error: "Game session not found" });
      return;
    }
    console.error("Get game state error:", err);
    res.status(500).json({ error: "Failed to get game state" });
  }
});

export default router;
