import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";
import { config } from "../config.js";
import type { AuthPayload } from "../middleware/auth.js";

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = "7d";

export async function registerUser(email: string, password: string, displayName?: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
  if (existing.rows.length > 0) {
    throw new Error("EMAIL_EXISTS");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO users (email, password_hash, display_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, display_name`,
    [normalizedEmail, passwordHash, displayName || null]
  );

  const user = result.rows[0];

  await pool.query(
    `INSERT INTO user_stats (user_id) VALUES ($1)`,
    [user.id]
  );

  const token = generateToken({ userId: user.id, email: user.email });

  return {
    token,
    user: { id: user.id, email: user.email, displayName: user.display_name },
  };
}

export async function loginUser(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await pool.query(
    "SELECT id, email, password_hash, display_name FROM users WHERE email = $1",
    [normalizedEmail]
  );

  if (result.rows.length === 0) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const token = generateToken({ userId: user.id, email: user.email });

  return {
    token,
    user: { id: user.id, email: user.email, displayName: user.display_name },
  };
}

export async function linkGuestToUser(userId: number, guestToken: string) {
  await pool.query(
    `UPDATE game_sessions SET user_id = $1 WHERE guest_token = $2 AND user_id IS NULL`,
    [userId, guestToken]
  );
  await pool.query(
    `UPDATE game_results SET user_id = $1 WHERE user_id IS NULL AND id IN (
       SELECT gr.id FROM game_results gr
       JOIN game_sessions gs ON gs.sequence_id = gr.sequence_id
       WHERE gs.guest_token = $2
     )`,
    [userId, guestToken]
  );
}

export async function getUser(userId: number) {
  const result = await pool.query(
    "SELECT id, email, display_name FROM users WHERE id = $1",
    [userId]
  );
  if (result.rows.length === 0) return null;
  const u = result.rows[0];
  return { id: u.id, email: u.email, displayName: u.display_name };
}

function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: TOKEN_EXPIRY });
}
