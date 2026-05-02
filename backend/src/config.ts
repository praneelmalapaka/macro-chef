import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_SCHEMA: z.string().regex(/^[a-z_][a-z0-9_]*$/i).default("public"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("*"),
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SMTP_SKIP_SEND: z.enum(["true", "false"]).default("false")
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
  }
};
