import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { pool } from "../db";
import { AppError, asyncHandler } from "../errors";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { sendVerificationEmail } from "../services/mailer";
import {
  generateVerificationCode,
  hashPassword,
  hashVerificationCode,
  signAccessToken,
  verifyPassword
} from "../services/security";
import { mapUser } from "../services/users";

export const authRouter = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 });
const verificationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 });

const signupSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/, "Username can use letters, numbers, and underscores."),
  displayName: z.string().trim().min(1).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200)
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

const verifySchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit verification code.")
});

authRouter.post("/signup", authLimiter, validateBody(signupSchema), asyncHandler(async (req, res) => {
  const { username, displayName, email, password } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const userResult = await client.query(
      `INSERT INTO users (username, display_name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [username.toLowerCase(), displayName, email.toLowerCase(), await hashPassword(password)]
    );
    await createAndSendVerification(client, userResult.rows[0].id, userResult.rows[0].email, false);
    await client.query("COMMIT");

    const user = mapUser(userResult.rows[0], true);
    res.status(201).json({
      token: signAccessToken({
        id: user.id,
        username: user.username,
        email: user.email || "",
        emailVerified: false
      }),
      user
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}));

authRouter.post("/login", authLimiter, validateBody(loginSchema), asyncHandler(async (req, res) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [req.body.email.toLowerCase()]);
  const userRow = result.rows[0];
  if (!userRow || !(await verifyPassword(req.body.password, userRow.password_hash))) {
    throw new AppError(401, "Invalid email or password.");
  }

  const user = mapUser(userRow, true);
  res.json({
    token: signAccessToken({
      id: user.id,
      username: user.username,
      email: user.email || "",
      emailVerified: Boolean(user.emailVerified)
    }),
    user
  });
}));

authRouter.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.user!.id]);
  res.json({ user: mapUser(result.rows[0], true) });
}));

authRouter.post("/send-verification", verificationLimiter, requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query("SELECT id, email, email_verified FROM users WHERE id = $1", [req.user!.id]);
  const user = result.rows[0];
  if (!user) throw new AppError(404, "User not found.");
  if (user.email_verified) throw new AppError(400, "Email is already verified.");

  await createAndSendVerification(pool, user.id, user.email, true);
  res.json({ ok: true });
}));

authRouter.post("/verify-email", verificationLimiter, requireAuth, validateBody(verifySchema), asyncHandler(async (req, res) => {
  const tokenResult = await pool.query(
    `SELECT id, code_hash, expires_at
     FROM email_verification_tokens
     WHERE user_id = $1 AND used_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [req.user!.id]
  );

  const token = tokenResult.rows[0];
  if (!token) throw new AppError(400, "No verification code is active.");
  if (new Date(token.expires_at).getTime() < Date.now()) throw new AppError(400, "Verification code expired.");
  if (hashVerificationCode(req.body.code) !== token.code_hash) throw new AppError(400, "Incorrect verification code.");

  await pool.query("UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1", [token.id]);
  const userResult = await pool.query(
    "UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *",
    [req.user!.id]
  );
  const user = mapUser(userResult.rows[0], true);
  res.json({
    token: signAccessToken({
      id: user.id,
      username: user.username,
      email: user.email || "",
      emailVerified: true
    }),
    user
  });
}));

authRouter.post("/forgot-password", authLimiter, asyncHandler(async (_req, res) => {
  res.status(202).json({ ok: true, message: "Password reset email flow is reserved for the next release." });
}));

async function createAndSendVerification(
  db: Pick<typeof pool, "query">,
  userId: string | number,
  email: string,
  enforceCooldown: boolean
) {
  if (enforceCooldown) {
    const latest = await db.query(
      "SELECT created_at FROM email_verification_tokens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    const createdAt = latest.rows[0]?.created_at;
    if (createdAt && new Date(createdAt).getTime() > Date.now() - 60_000) {
      throw new AppError(429, "Please wait a minute before requesting another code.");
    }
  }

  const code = generateVerificationCode();
  await db.query("UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL", [userId]);
  await db.query(
    `INSERT INTO email_verification_tokens (user_id, code_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
    [userId, hashVerificationCode(code)]
  );
  await sendVerificationEmail(email, code);
}
