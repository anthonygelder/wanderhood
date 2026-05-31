import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM ?? "Wanderhood <hello@wanderhood.app>";

export async function sendWelcomeEmail(email: string): Promise<void> {
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Welcome to Wanderhood 🌍",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <h1 style="font-size:24px;margin-bottom:8px">You're in.</h1>
        <p style="color:#555;margin-top:0">Thanks for signing up to Wanderhood. We'll let you know when new cities and neighborhoods land.</p>
        <p style="color:#555">In the meantime, explore our neighborhood guides at <a href="https://wanderhood.app" style="color:#2563eb">wanderhood.app</a>.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="font-size:12px;color:#9ca3af">You're receiving this because you subscribed at wanderhood.app. No spam, ever.</p>
      </div>
    `,
  });
}
