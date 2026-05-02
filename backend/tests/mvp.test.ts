import fs from "fs";
import path from "path";
import crypto from "crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDb = testDatabaseUrl ? describe : describe.skip;

describeWithDb("MacroChef MVP API", () => {
  let app: ReturnType<typeof import("../src/app").createApp>;
  let pool: typeof import("../src/db").pool;
  let closePool: typeof import("../src/db").closePool;
  let hashVerificationCode: typeof import("../src/services/security").hashVerificationCode;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = testDatabaseUrl;
    process.env.DATABASE_SCHEMA = "macrochef_test";
    process.env.JWT_SECRET = crypto.randomBytes(48).toString("hex");
    process.env.SMTP_SKIP_SEND = "true";
    process.env.CORS_ORIGIN = "*";

    ({ pool, closePool } = await import("../src/db"));
    ({ hashVerificationCode } = await import("../src/services/security"));
    const { createApp } = await import("../src/app");
    app = createApp();

    const migration = fs.readFileSync(path.join(__dirname, "../migrations/001_init.sql"), "utf8");
    await pool.query("CREATE SCHEMA IF NOT EXISTS macrochef_test");
    await pool.query("SET search_path TO macrochef_test, public");
    await pool.query(migration);
    await pool.query(
      "TRUNCATE food_logs, friendships, friend_requests, email_verification_tokens, users RESTART IDENTITY CASCADE"
    );
  });

  afterAll(async () => {
    await closePool?.();
  });

  it("signs up, logs in, verifies email, manages food logs, and enforces friend privacy", async () => {
    const alice = await signupAndVerify("alice");
    const bob = await signupAndVerify("bob");

    await request(app)
      .patch("/profile")
      .set("Authorization", `Bearer ${bob.token}`)
      .send({ profileVisibility: "private" })
      .expect(200);

    const today = new Date().toISOString().slice(0, 10);
    const bobLog = await request(app)
      .post("/logs")
      .set("Authorization", `Bearer ${bob.token}`)
      .send({
        foodName: "Chicken bowl",
        calories: 520,
        proteinG: 46,
        carbsG: 29,
        fatG: 19,
        mealType: "lunch",
        consumedAt: `${today}T12:00:00.000Z`
      })
      .expect(201);

    expect(bobLog.body.log.foodName).toBe("Chicken bowl");

    await request(app)
      .get(`/logs?date=${today}&username=bob`)
      .set("Authorization", `Bearer ${alice.token}`)
      .expect(403);

    const requestResult = await request(app)
      .post("/friends/request")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ username: "bob" })
      .expect(201);

    await request(app)
      .post("/friends/accept")
      .set("Authorization", `Bearer ${bob.token}`)
      .send({ requestId: requestResult.body.requestId })
      .expect(200);

    const friendLogs = await request(app)
      .get(`/logs?date=${today}&username=bob`)
      .set("Authorization", `Bearer ${alice.token}`)
      .expect(200);
    expect(friendLogs.body.logs).toHaveLength(1);

    const ownLog = await request(app)
      .post("/logs")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({
        foodName: "Greek yoghurt",
        calories: 180,
        proteinG: 20,
        carbsG: 12,
        fatG: 4,
        mealType: "breakfast",
        consumedAt: `${today}T08:00:00.000Z`
      })
      .expect(201);

    const updatedLog = await request(app)
      .patch(`/logs/${ownLog.body.log.id}`)
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ calories: 210 })
      .expect(200);
    expect(updatedLog.body.log.calories).toBe(210);

    const summary = await request(app)
      .get(`/logs/summary?date=${today}`)
      .set("Authorization", `Bearer ${alice.token}`)
      .expect(200);
    expect(summary.body.totalCalories).toBe(210);

    await request(app)
      .delete(`/logs/${ownLog.body.log.id}`)
      .set("Authorization", `Bearer ${alice.token}`)
      .expect(200);
  });

  async function signupAndVerify(prefix: string) {
    const email = `${prefix}@example.com`;
    const signup = await request(app)
      .post("/auth/signup")
      .send({
        username: prefix,
        displayName: `${prefix} user`,
        email,
        password: "password123"
      })
      .expect(201);

    const login = await request(app)
      .post("/auth/login")
      .send({ email, password: "password123" })
      .expect(200);
    expect(login.body.user.emailVerified).toBe(false);

    await pool.query(
      `UPDATE email_verification_tokens
       SET code_hash = $2
       WHERE user_id = $1 AND used_at IS NULL`,
      [signup.body.user.id, hashVerificationCode("123456")]
    );

    const verified = await request(app)
      .post("/auth/verify-email")
      .set("Authorization", `Bearer ${signup.body.token}`)
      .send({ code: "123456" })
      .expect(200);

    return { token: verified.body.token, user: verified.body.user };
  }
});
