import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({
  override: process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "production"
});

const trimmed = z.string().transform((value) => value.trim());
const optionalTrimmed = z.string().transform((value) => value.trim()).optional();
const gmailAppPassword = z.string().transform((value) => value.replace(/\s+/g, "")).optional();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: trimmed
    .pipe(z.string().min(1, "DATABASE_URL is required"))
    .refine((value) => !/(HOST\.neon\.tech|<|your_|USER:PASSWORD)/i.test(value), {
      message: "DATABASE_URL still contains placeholder values."
    }),
  DATABASE_SCHEMA: trimmed.pipe(z.string().regex(/^[a-z_][a-z0-9_]*$/i)).default("public"),
  JWT_SECRET: trimmed.pipe(z.string().min(32, "JWT_SECRET must be at least 32 characters")),
  JWT_EXPIRES_IN: trimmed.default("7d"),
  CORS_ORIGIN: trimmed.default("*"),
  SMTP_HOST: trimmed.default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: optionalTrimmed,
  SMTP_PASS: gmailAppPassword,
  SMTP_FROM: optionalTrimmed,
  SMTP_SKIP_SEND: trimmed.pipe(z.enum(["true", "false"])).default("false"),
  DEV_LOGIN_ENABLED: trimmed.pipe(z.enum(["true", "false"])).default("false"),
  DEV_LOGIN_USERNAME: optionalTrimmed,
  DEV_LOGIN_DISPLAY_NAME: optionalTrimmed,
  DEV_LOGIN_EMAIL: optionalTrimmed
});

const parsed = envSchema.parse(process.env);

if (parsed.NODE_ENV === "production") {
  const missingSmtp = !parsed.SMTP_USER || !parsed.SMTP_PASS || !parsed.SMTP_FROM;
  if (missingSmtp) {
    throw new Error("SMTP_USER, SMTP_PASS, and SMTP_FROM are required in production.");
  }
}

export const config = {
  nodeEnv: parsed.NODE_ENV,
  port: parsed.PORT,
  databaseUrl: parsed.DATABASE_URL,
  databaseSchema: parsed.DATABASE_SCHEMA.toLowerCase(),
  jwtSecret: parsed.JWT_SECRET,
  jwtExpiresIn: parsed.JWT_EXPIRES_IN,
  corsOrigin: parsed.CORS_ORIGIN,
  smtp: {
    host: parsed.SMTP_HOST,
    port: parsed.SMTP_PORT,
    user: parsed.SMTP_USER,
    pass: parsed.SMTP_PASS,
    from: parsed.SMTP_FROM || parsed.SMTP_USER,
    skipSend: parsed.SMTP_SKIP_SEND === "true"
  },
  devLogin: {
    enabled: parsed.DEV_LOGIN_ENABLED === "true" && parsed.NODE_ENV !== "production",
    username: parsed.DEV_LOGIN_USERNAME,
    displayName: parsed.DEV_LOGIN_DISPLAY_NAME,
    email: parsed.DEV_LOGIN_EMAIL
  }
};
