import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { AppError, asyncHandler } from "../errors";
import { requireAuth, requireVerified } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { areFriends, findUserByUsername, mapUser } from "../services/users";

export const friendsRouter = Router();

const usernameBody = z.object({ username: z.string().trim().min(1).max(80) });
const requestIdBody = z.object({ requestId: z.union([z.string(), z.number()]) });

friendsRouter.get("/", requireAuth, requireVerified, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT u.*
     FROM friendships f
     JOIN users u ON u.id = CASE WHEN f.user_low_id = $1 THEN f.user_high_id ELSE f.user_low_id END
     WHERE f.user_low_id = $1 OR f.user_high_id = $1
     ORDER BY u.username`,
    [req.user!.id]
  );
  res.json({ friends: result.rows.map((row) => mapUser(row, true)) });
}));

friendsRouter.get("/requests", requireAuth, requireVerified, asyncHandler(async (req, res) => {
  const incoming = await pool.query(
    `SELECT fr.id AS request_id, fr.created_at, u.*
     FROM friend_requests fr
     JOIN users u ON u.id = fr.requester_id
     WHERE fr.addressee_id = $1 AND fr.status = 'pending'
     ORDER BY fr.created_at DESC`,
    [req.user!.id]
  );
  const outgoing = await pool.query(
    `SELECT fr.id AS request_id, fr.created_at, u.*
     FROM friend_requests fr
     JOIN users u ON u.id = fr.addressee_id
     WHERE fr.requester_id = $1 AND fr.status = 'pending'
     ORDER BY fr.created_at DESC`,
    [req.user!.id]
  );
  res.json({
    incoming: incoming.rows.map((row) => ({ requestId: String(row.request_id), user: mapUser(row, false), createdAt: row.created_at })),
    outgoing: outgoing.rows.map((row) => ({ requestId: String(row.request_id), user: mapUser(row, false), createdAt: row.created_at }))
  });
}));

friendsRouter.post("/request", requireAuth, requireVerified, validateBody(usernameBody), asyncHandler(async (req, res) => {
  const target = await findUserByUsername(req.body.username);
  if (!target || !target.email_verified) throw new AppError(404, "User not found.");
  if (String(target.id) === req.user!.id) throw new AppError(400, "You cannot friend yourself.");
  if (await areFriends(req.user!.id, target.id)) throw new AppError(409, "You are already friends.");

  const reverse = await pool.query(
    `SELECT id FROM friend_requests
     WHERE requester_id = $1 AND addressee_id = $2 AND status = 'pending'`,
    [target.id, req.user!.id]
  );
  if (reverse.rows.length) throw new AppError(409, "This user has already requested you.");

  const result = await pool.query(
    `INSERT INTO friend_requests (requester_id, addressee_id, status)
     VALUES ($1, $2, 'pending')
     ON CONFLICT (requester_id, addressee_id)
     DO UPDATE SET status = 'pending', updated_at = NOW()
     RETURNING id`,
    [req.user!.id, target.id]
  );
  res.status(201).json({ requestId: String(result.rows[0].id) });
}));

friendsRouter.post("/accept", requireAuth, requireVerified, validateBody(requestIdBody), asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const request = await client.query(
      `UPDATE friend_requests
       SET status = 'accepted', updated_at = NOW()
       WHERE id = $1 AND addressee_id = $2 AND status = 'pending'
       RETURNING requester_id, addressee_id`,
      [req.body.requestId, req.user!.id]
    );
    if (!request.rows.length) throw new AppError(404, "Friend request not found.");
    const a = Number(request.rows[0].requester_id);
    const b = Number(request.rows[0].addressee_id);
    await client.query(
      `INSERT INTO friendships (user_low_id, user_high_id)
       VALUES ($1, $2)
       ON CONFLICT (user_low_id, user_high_id) DO NOTHING`,
      [Math.min(a, b), Math.max(a, b)]
    );
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}));

friendsRouter.post("/reject", requireAuth, requireVerified, validateBody(requestIdBody), asyncHandler(async (req, res) => {
  const result = await pool.query(
    `UPDATE friend_requests
     SET status = 'rejected', updated_at = NOW()
     WHERE id = $1 AND addressee_id = $2 AND status = 'pending'
     RETURNING id`,
    [req.body.requestId, req.user!.id]
  );
  if (!result.rows.length) throw new AppError(404, "Friend request not found.");
  res.json({ ok: true });
}));

friendsRouter.delete("/:friendId", requireAuth, requireVerified, asyncHandler(async (req, res) => {
  const friendId = Number(req.params.friendId);
  const myId = Number(req.user!.id);
  if (!friendId || friendId === myId) throw new AppError(400, "Invalid friend id.");
  await pool.query(
    "DELETE FROM friendships WHERE user_low_id = $1 AND user_high_id = $2",
    [Math.min(myId, friendId), Math.max(myId, friendId)]
  );
  await pool.query(
    `DELETE FROM friend_requests
     WHERE (requester_id = $1 AND addressee_id = $2)
        OR (requester_id = $2 AND addressee_id = $1)`,
    [myId, friendId]
  );
  res.json({ ok: true });
}));
