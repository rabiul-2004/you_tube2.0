import nodemailer from "nodemailer";
import crypto from "crypto";

const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const sendOtpEmail = async ({ to, name, otp, city, state }) => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    throw new Error("SMTP config missing in server/.env");
  }

  const location = [city, state].filter(Boolean).join(", ");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#dc2626;padding:20px;text-align:center">
        <span style="color:#fff;font-size:22px;font-weight:bold">YourTube</span>
      </div>
      <div style="padding:24px">
        <h2 style="margin:0 0 8px">New sign-in detected</h2>
        <p style="color:#4b5563">Hi ${name || "there"}, we noticed a login from a new device or location${location ? ` (${location})` : ""}.</p>
        <p style="color:#4b5563">Use the following OTP to complete your login:</p>
        <div style="text-align:center;margin:24px 0">
          <span style="display:inline-block;font-size:32px;font-weight:bold;letter-spacing:8px;color:#dc2626;background:#fef2f2;padding:12px 24px;border-radius:8px">${otp}</span>
        </div>
        <p style="color:#9ca3af;font-size:12px">This OTP expires in 10 minutes. If you did not attempt to log in, please secure your account immediately.</p>
      </div>
    </div>
  `;

  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || "YourTube <noreply@yourtube.dev>",
    to,
    subject: `YourTube — OTP for new device verification`,
    html,
  });
};

export const sendInvoiceEmail = async ({
  to,
  name,
  plan,
  amountPaise,
  paymentId,
  orderId,
  expiresAt,
}) => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    throw new Error("SMTP config missing in server/.env");
  }
  const amountRupees = (amountPaise / 100).toFixed(2);
  const expiryDate = new Date(expiresAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#dc2626;padding:20px;text-align:center">
        <span style="color:#fff;font-size:22px;font-weight:bold">YourTube</span>
      </div>
      <div style="padding:24px">
        <h2 style="margin:0 0 8px">Hi ${name}, your ${plan} plan is active! 🎉</h2>
        <p style="color:#4b5563">Thanks for upgrading. Here is your invoice / confirmation.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px 0;color:#6b7280">Plan</td><td style="text-align:right;font-weight:600">${plan}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Amount</td><td style="text-align:right;font-weight:600">₹${amountRupees}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Payment ID</td><td style="text-align:right">${paymentId}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Order ID</td><td style="text-align:right">${orderId}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Valid until</td><td style="text-align:right">${expiryDate}</td></tr>
        </table>
        <p style="color:#9ca3af;font-size:12px">This is an automated email. Please do not reply.</p>
      </div>
    </div>
  `;

  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || "YourTube <noreply@yourtube.dev>",
    to,
    subject: `YourTube ${plan} plan activated — Invoice`,
    html,
  });
};
