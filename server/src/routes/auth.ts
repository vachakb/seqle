import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { registerUser, loginUser, linkGuestToUser, getUser } from "../services/auth.service.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().max(100).optional(),
  guestToken: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/register", validate(registerSchema), async (req, res) => {
  try {
    const { email, password, displayName, guestToken } = req.body;
    const result = await registerUser(email, password, displayName);

    if (guestToken) {
      await linkGuestToUser(result.user.id, guestToken);
    }

    res.status(201).json(result);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "EMAIL_EXISTS") {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    res.json(result);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "INVALID_CREDENTIALS") {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await getUser(req.user!.userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});

export default router;
