import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { getStats, mergeStats, getGameHistory, getAnalytics } from "../services/stats.service.js";

const router = Router();

const mergeSchema = z.object({
  localStats: z.object({
    gamesPlayed: z.number().int().min(0),
    gamesWon: z.number().int().min(0),
    currentStreak: z.number().int().min(0),
    maxStreak: z.number().int().min(0),
    guessDistribution: z.array(z.number().int().min(0)).length(6),
    lastPlayedDate: z.string(),
  }),
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const stats = await getStats(req.user!.userId);
    res.json({ stats });
  } catch (err) {
    console.error("Get stats error:", err);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.put("/merge", requireAuth, validate(mergeSchema), async (req, res) => {
  try {
    const stats = await mergeStats(req.user!.userId, req.body.localStats);
    res.json({ stats });
  } catch (err) {
    console.error("Merge stats error:", err);
    res.status(500).json({ error: "Failed to merge stats" });
  }
});

router.get("/history", requireAuth, async (req, res) => {
  try {
    const history = await getGameHistory(req.user!.userId);
    res.json({ history });
  } catch (err) {
    console.error("Get history error:", err);
    res.status(500).json({ error: "Failed to get game history" });
  }
});

router.get("/analytics", requireAuth, async (req, res) => {
  try {
    const analytics = await getAnalytics(req.user!.userId);
    res.json(analytics);
  } catch (err) {
    console.error("Get analytics error:", err);
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

export default router;
