import type { QueryResultRow } from "pg";
import { pool } from "../db";

export type PublicUser = {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  emailVerified?: boolean;
  bio?: string;
  avatarUrl?: string | null;
  dailyCalorieGoal?: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
  profileVisibility: "public" | "private";
  fullProfile: boolean;
};

export function mapUser(row: QueryResultRow, fullProfile: boolean): PublicUser {
  return {
    id: String(row.id),
    username: row.username,
    displayName: row.display_name,
    email: fullProfile ? row.email : undefined,
    emailVerified: fullProfile ? Boolean(row.email_verified) : undefined,
    bio: fullProfile ? row.bio : "",
    avatarUrl: row.avatar_url,
    dailyCalorieGoal: fullProfile ? Number(row.daily_calorie_goal) : undefined,
    proteinGoal: fullProfile ? Number(row.protein_goal) : undefined,
    carbsGoal: fullProfile ? Number(row.carbs_goal) : undefined,
    fatGoal: fullProfile ? Number(row.fat_goal) : undefined,
    profileVisibility: row.profile_visibility,
    fullProfile
  };
}

export async function areFriends(userA: string | number, userB: string | number) {
  const a = Number(userA);
  const b = Number(userB);
  if (a === b) return true;
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  const result = await pool.query(
    "SELECT 1 FROM friendships WHERE user_low_id = $1 AND user_high_id = $2",
    [low, high]
  );
  return (result.rowCount || 0) > 0;
}

export async function canViewFullProfile(viewerId: string | number, targetRow: QueryResultRow) {
  if (String(viewerId) === String(targetRow.id)) return true;
  if (targetRow.profile_visibility === "public") return true;
  return areFriends(viewerId, targetRow.id);
}

export async function findUserByUsername(username: string) {
  const result = await pool.query("SELECT * FROM users WHERE LOWER(username) = LOWER($1)", [username]);
  return result.rows[0] || null;
}
