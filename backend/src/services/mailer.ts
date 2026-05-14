import nodemailer from "nodemailer";
import { config } from "../config";
import { AppError } from "../errors";

export async function sendVerificationEmail(email: string, code: string) {
  if (config.smtp.skipSend || !config.smtp.user || !config.smtp.pass || !config.smtp.from) {
    logVerificationCode(email, code);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    requireTLS: config.smtp.port === 587,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    }
  });

  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to: email,
      subject: "Verify your MacroChef account",
      text: `Your MacroChef verification code is ${code}. It expires in 15 minutes.`,
      html: `<p>Your MacroChef verification code is <strong>${code}</strong>.</p><p>It expires in 15 minutes.</p>`
    });
  } catch (error) {
    console.error("[MacroChef] SMTP send failed:", describeSmtpError(error));
    throw new AppError(502, verificationEmailErrorMessage(error));
  }
}

function logVerificationCode(email: string, code: string) {
  console.log(`[MacroChef] Verification code for ${email}: ${code}`);
}

function verificationEmailErrorMessage(error: unknown) {
  if (config.nodeEnv === "production") {
    return "Verification email could not be sent. Please try again later.";
  }

  if (isBadSmtpCredentials(error)) {
    return "Verification email could not be sent because Gmail rejected the SMTP username or app password.";
  }

  return "Verification email could not be sent. Check SMTP settings or set SMTP_SKIP_SEND=true for local development.";
}

function isBadSmtpCredentials(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const responseCode = typeof error === "object" && error !== null && "responseCode" in error
    ? Number(error.responseCode)
    : undefined;

  return responseCode === 535 || /Invalid login|BadCredentials|Username and Password not accepted/i.test(message);
}

function describeSmtpError(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}
