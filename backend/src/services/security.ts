import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config";

export type TokenUser = {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signAccessToken(user: TokenUser) {
  return jwt.sign(user, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"]
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, config.jwtSecret) as TokenUser;
}

export function generateVerificationCode() {
  return String(crypto.randomInt(100000, 1000000));
}

export function hashVerificationCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}
