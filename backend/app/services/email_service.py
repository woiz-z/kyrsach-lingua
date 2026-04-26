import logging
import urllib.request
import urllib.parse
import json

from app.config import settings

logger = logging.getLogger("linguaai.email")

# Google Apps Script relay URL — handles SMTP on behalf of the backend
# (Railway blocks outbound SMTP, so we delegate to GAS which runs on Google infra)
_GAS_URL = (
    "https://script.google.com/macros/s/"
    "AKfycbwl7zn7gRHTFS2eNFCP08b3iRMSFMYOyYIzGpRBi8kBVfQyTl4zIprbZqYxuzHQUWmQ/exec"
)


def send_password_reset_email(to_email: str, reset_url: str, full_name: str) -> None:
    """Send a password-reset email via Google Apps Script relay."""
    display_name = full_name.strip() if full_name.strip() else to_email

    html_body = f"""<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Відновлення паролю — LinguaAI</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#fff;border-radius:16px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(99,102,241,.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);
                       padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;
                         letter-spacing:-0.5px;">🌐 LinguaAI</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,.75);font-size:14px;">
                Система вивчення іноземних мов
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 12px;font-size:16px;color:#1e1b4b;font-weight:600;">
                Привіт, {display_name}!
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
                Ми отримали запит на скидання паролю для вашого акаунту.
                Натисніть кнопку нижче, щоб встановити новий пароль.
                Посилання діє <strong>30 хвилин</strong>.
              </p>
              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding:8px 0 28px;">
                    <a href="{reset_url}"
                       style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);
                              color:#fff;text-decoration:none;font-size:16px;font-weight:600;
                              padding:14px 36px;border-radius:12px;
                              box-shadow:0 4px 14px rgba(99,102,241,.35);">
                      Скинути пароль
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">
                Якщо кнопка не спрацьовує, скопіюйте це посилання у браузер:
              </p>
              <p style="margin:0 0 24px;font-size:12px;word-break:break-all;">
                <a href="{reset_url}" style="color:#6366f1;">{reset_url}</a>
              </p>
              <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
                Якщо ви не надсилали цей запит — просто проігноруйте цей лист.
                Ваш пароль залишиться без змін.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;
                       border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © 2026 LinguaAI · Автоматичний лист, будь ласка не відповідайте на нього.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    payload = json.dumps({
        "to": to_email,
        "subject": "Відновлення паролю — LinguaAI",
        "html": html_body,
    }).encode("utf-8")

    try:
        req = urllib.request.Request(
            _GAS_URL,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read().decode("utf-8", errors="replace")
        logger.info("Password-reset email sent to %s via GAS. Response: %s", to_email, body[:200])
    except Exception:
        logger.exception("Failed to send password-reset email to %s via GAS", to_email)
