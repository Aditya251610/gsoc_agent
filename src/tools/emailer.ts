import nodemailer from "nodemailer";

const user = process.env.GMAIL_USER!;
const pass = process.env.GMAIL_PASS!;
const to   = process.env.ALERT_EMAIL!;

export async function sendInsertionEmail(subject: string, html: string) {
  if (!user || !pass || !to) return { skipped: true };

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass }
  });

  const info = await transporter.sendMail({
    from: `"GSOC Agent" <${user}>`,
    to,
    subject,
    html
  });

  return { messageId: info.messageId };
}

export function buildProjectsEmail(rows: Array<{
  org: string; project: string; repo: string; score?: number; note?: string;
}>) {
  const items = rows.map(r => `
    <li style="margin-bottom:10px">
      <strong>${r.org}/${r.project}</strong> — score ${r.score ?? "?"}
      <br><a href="${r.repo}" target="_blank">${r.repo}</a>
      ${r.note ? `<div style="color:#444;margin-top:4px;">${r.note}</div>` : ""}
    </li>`).join("");

  return `
    <div style="font-family:system-ui,Segoe UI,Arial,sans-serif">
      <h2>New GSOC Projects Added</h2>
      <p>${rows.length} new item(s) inserted into your Notion DB.</p>
      <ul>${items}</ul>
      <hr/>
      <small>Sent by GSOC Agent (Groq)</small>
    </div>
  `;
}
