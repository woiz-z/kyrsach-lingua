import smtplib
import ssl
import socket
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger("linguaai.email")


def send_password_reset_email(to_email: str, reset_url: str, full_name: str) -> None:
    """Send a password-reset email via SMTP (Gmail STARTTLS)."""
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

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Відновлення паролю — LinguaAI"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            "SMTP not configured — skipping email to %s. Reset URL: %s",
            to_email,
            reset_url,
        )
        return

    context = ssl.create_default_context()
    try:
        # Force IPv4 — Railway containers lack IPv6 routing; getaddrinfo(AF_INET)
        # returns an IPv4 address so smtplib never tries the unreachable IPv6 path.
        infos = socket.getaddrinfo(
            settings.SMTP_HOST, settings.SMTP_PORT, socket.AF_INET, socket.SOCK_STREAM
        )
        smtp_ip = infos[0][4][0]
        with smtplib.SMTP(smtp_ip, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, to_email, msg.as_string())
        logger.info("Password-reset email sent to %s", to_email)
    except Exception:
        logger.exception("Failed to send password-reset email to %s", to_email)
