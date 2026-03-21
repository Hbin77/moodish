import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "") or SMTP_USER


def send_verification_email(to_email: str, name: str, token: str, base_url: str) -> bool:
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP credentials not set — skipping email")
        return False

    verify_url = f"{base_url}/api/auth/verify-email?token={token}"

    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #495867; font-size: 24px; margin: 0;">Moodish</h1>
            <p style="color: #577399; font-size: 14px;">오늘 기분, 어떤 맛?</p>
        </div>
        <div style="background: #F7F7FF; border-radius: 16px; padding: 32px; border: 1px solid #BDD5EA;">
            <p style="color: #495867; font-size: 16px; margin: 0 0 16px;">
                {name}님, 환영합니다!
            </p>
            <p style="color: #577399; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                아래 버튼을 클릭하여 이메일 인증을 완료해주세요.
            </p>
            <div style="text-align: center;">
                <a href="{verify_url}"
                   style="display: inline-block; background: #FE5F55; color: white; padding: 14px 32px;
                          border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 14px;">
                    이메일 인증하기
                </a>
            </div>
            <p style="color: #577399; font-size: 12px; margin: 24px 0 0; text-align: center;">
                버튼이 작동하지 않으면 아래 링크를 복사하세요:<br>
                <a href="{verify_url}" style="color: #FE5F55; word-break: break-all;">{verify_url}</a>
            </p>
        </div>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "[Moodish] 이메일 인증을 완료해주세요"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("Verification email sent to %s", to_email)
        return True
    except Exception:
        logger.exception("Failed to send verification email")
        return False
