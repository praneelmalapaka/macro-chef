import nodemailer from "nodemailer";
import { config } from "../config";

export async function sendVerificationEmail(email: string, code: string) {
  if (config.smtp.skipSend || !config.smtp.user || !config.smtp.pass || !config.smtp.from) {
    console.log(`[MacroChef] Verification code for ${email}: ${code}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: false,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    }
  });

  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: "Verify your MacroChef account",
    text: `Your MacroChef verification code is ${code}. It expires in 15 minutes.`,
    html: `<p>Your MacroChef verification code is <strong>${code}</strong>.</p><p>It expires in 15 minutes.</p>`
  });
}
