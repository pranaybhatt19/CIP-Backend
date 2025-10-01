import nodemailer from "nodemailer";
import { IMailResponse } from "../interfaces";
import dotenv from "dotenv";

dotenv.config();

export async function sendEmail(
  to: string,
  subject: string,
  html?: string,
  text?: string,
): Promise<IMailResponse> {
  const response: IMailResponse = {
    message: "",
    status: false,
  };

  try {
    const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED === "false";

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_PORT),
      secure: false, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      tls: {
        rejectUnauthorized,
      },
    });

    await transporter.verify();

    const mailOptions = {
      from: process.env.FROM_EMAIL, 
      to,
      subject, 
      text, 
      html, 
    };

    await transporter.sendMail(mailOptions);

    response.message = `Mail successfully sent to: ${to}`;
    response.status = true;
    return response;
  } catch (err: any) {
    console.error("Error sending mail:", err);
    response.message = err.message || "Error sending mail";
    return response;
  }
}


export function otpEmailTemplate(otp: any, otp_expiry_minutes: any) {
  return `<!doctype html>
  <html>
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>IPP — OTP</title>
    <style>
      /* Basic resets for email clients */
      body { margin:0; padding:0; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
      table { border-spacing:0; }
      img { border:0; display:block; }
      a { text-decoration:none; }
      .button { display:inline-block; padding:12px 20px; border-radius:6px; font-weight:600; text-align:center; }
      @media only screen and (max-width:600px){
        .container { width:100% !important; padding:16px !important; }
        .hero-title { font-size:20px !important; }
        .otp-code { font-size:32px !important; letter-spacing:10px !important; }
      }
    </style>
    </head>
    <body style="background:#f4f6f8; font-family:Arial, Helvetica, sans-serif; color:#24314a; margin:0; padding:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center">
            <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 6px 18px rgba(15,23,42,0.08);">
              <!-- Hero / OTP -->
              <tr>
                <td style="padding:28px 24px; text-align:center;">
                  <h1 class="hero-title" style="margin:0 0 12px 0; font-size:24px; line-height:1.2; color:#1976d2;">Your OTP Code</h1>

                  <p style="margin:0 0 18px 0; color:#334155;">Great to see you aboard! Use the following One-Time Password (OTP) to complete your action. Do not share this code with anyone.</p>

                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:18px 0; background:#f8fafc; border-radius:8px; padding:20px;">
                    <tr>
                      <td style="font-size:14px; color:#111827; text-align:center;">
                        <div style="font-size:13px; color:#6b7280; margin-bottom:10px;">OTP is valid for <strong style="color:#111827;">${otp_expiry_minutes} minutes</strong> only</div>

                        <div style="display:inline-block; padding:18px 26px; background:#ffffff; border-radius:8px; border:1px solid #e6eef9;">
                          <div class="otp-code" style="font-size:35px; font-weight:700; letter-spacing:10px; color:#1976d2; margin-right: -10px;">${otp}</div>
                        </div>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
    </body>
  </html>`
}

export function registeredEmailTemplate(userName: string, email: string, password: any) {
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width" />
      <title>Welcome to IPP</title>
      <style>
        body { margin:0; padding:0; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
        table { border-spacing:0; }
        img { border:0; display:block; }
        a { text-decoration:none; }
        .button { display:inline-block; padding:12px 20px; border-radius:6px; font-weight:600; text-align:center; }
        @media only screen and (max-width:600px){
          .container { width:100% !important; padding:16px !important; }
          .stack { display:block !important; width:100% !important; }
          .hero-title { font-size:20px !important; }
        }
      </style>
    </head>
    <body style="background:#f4f6f8; font-family:Arial, Helvetica, sans-serif; color:#24314a; margin:0; padding:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr><td align="center">
          <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 6px 18px rgba(15,23,42,0.08);">
            <tr>
              <td style="padding:28px 24px;">
                <h1 class="hero-title" style="margin:0 0 12px 0; font-size:24px; line-height:1.2; color:#1976d2;">Welcome aboard, ${userName}!</h1>
                <p style="margin:0 0 18px 0; color:#334155;">We're delighted to have you on IPP. Below are your initial login credentials — please update your password and sign in.</p>

                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:18px 0; background:#f8fafc; border-radius:8px; padding:14px;">
                  <tr>
                    <td style="font-size:14px; color:#111827;">
                      <strong>Your IPP email:</strong><br>
                      <span style="display:inline-block; margin-top:6px; padding:8px 10px; background:#ffffff; border-radius:6px; border:1px solid #e6eef9;">${email}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:12px; font-size:14px; color:#111827;">
                      <strong>Your temporary password:</strong><br>
                      <span style="display:inline-block; margin-top:6px; padding:8px 10px; background:#ffffff; border-radius:6px; border:1px solid #e6eef9;">${password}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:12px; font-size:13px; color:#6b7280;">For security, please change this password.</td>
                  </tr>
                </table>

                <p style="margin:18px 0 6px 0;">
                  <a href="http://ipp.anasource.com/" class="button" style="background:#1976d2; color:#ffffff; border-radius:8px;" aria-label="Sign in to IPP">Sign in to IPP</a>
                </p>

                <p style="margin:12px 0 6px 0; font-size:14px; color:#334155;">
                  Change your password here:
                  <a href="http://ipp.anasource.com/forgot-password" style="color:#1976d2; font-weight:600;">Reset password</a>
                </p>

                <hr style="border:none; border-top:1px solid #eef2f7; margin:18px 0;">
                <p style="margin:0 0 8px 0; color:#475569; font-size:14px;">Need help? Reach out to your Reporting Officer or Manager.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
  </html>`;
}
