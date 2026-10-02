import smtplib
import logging
from email.message import EmailMessage
from ..config import Config

logger = logging.getLogger(__name__)

def _send_email(to_email: str, subject: str, body_text: str) -> tuple[bool, str | None]:
    """
    Internal helper to deliver an email via SMTP.
    Returns (success: bool, error_message: str | None).
    Never reports success if SMTP delivery did not actually succeed.
    """
    if not to_email:
        logger.warning("[EMAIL ERROR] Recipient email is missing.")
        return False, "Recipient email is missing."

    # If SMTP credentials are not configured, return False with a clear error
    if not Config.SMTP_USERNAME or not Config.SMTP_PASSWORD:
        logger.warning(f"[EMAIL ERROR] SMTP credentials not configured. Cannot send email to {to_email}.")
        return False, "SMTP credentials are not configured on the server."

    logger.info(f"[EMAIL] Preparing SMTP delivery")
    logger.info(f"[EMAIL] SMTP host: {Config.SMTP_HOST}:{Config.SMTP_PORT}")
    logger.info(f"[EMAIL] SMTP username: {Config.SMTP_USERNAME}")
    logger.info(f"[EMAIL] Recipient: {to_email}")

    server = None
    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = Config.MAIL_FROM
        msg['To'] = to_email
        msg.set_content(body_text)

        logger.info("[EMAIL] Connecting to SMTP server...")
        server = smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=10)
        server.ehlo()
        logger.info("[EMAIL] STARTTLS...")
        server.starttls()
        server.ehlo()
        logger.info("[EMAIL] Authenticating...")
        server.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
        logger.info("[EMAIL] Sending message...")
        server.send_message(msg)
        logger.info(f"[EMAIL] Message accepted by SMTP server for {to_email}.")
        return True, None
    except Exception as e:
        err_msg = str(e)
        logger.error(f"[EMAIL ERROR] SMTP delivery failed for {to_email}: {err_msg}")
        return False, err_msg
    finally:
        if server is not None:
            try:
                server.quit()
            except Exception:
                pass

def send_complaint_confirmation_email(complaint, user, location=None) -> tuple[bool, str | None]:
    """
    Dispatches a confirmation email to the student upon successful complaint registration.
    """
    loc_name = location.location_name if location else (complaint.location.location_name if complaint.location else 'Campus Facility')

    subject = f"SmartFix Complaint Confirmation — {complaint.complaint_id}"

    body = f"""SmartFix Complaint Confirmation

Problem ID: {complaint.complaint_id}

Category: {complaint.category}
Location: {loc_name}
Priority: {complaint.priority}
Status: {complaint.status}

Description:
{complaint.description}

You can track your complaint using:
Problem ID + registered email.

Problem ID: {complaint.complaint_id}
Email: {user.email}

Thank you,
SmartFix Maintenance System
"""
    return _send_email(user.email, subject, body)

def send_worker_assignment_email(complaint, worker, location=None) -> tuple[bool, str | None]:
    """
    Dispatches assignment notice to the maintenance technician.
    """
    loc_name = location.location_name if location else (complaint.location.location_name if complaint.location else 'Campus Facility')

    subject = f"SmartFix Maintenance Assignment — {complaint.complaint_id}"

    body = f"""SmartFix Maintenance Assignment

Problem ID: {complaint.complaint_id}

Category: {complaint.category}
Priority: {complaint.priority}

Location:
{loc_name}

Description:
{complaint.description}

Current Status:
{complaint.status}

Please inspect and resolve the reported issue.

SmartFix Maintenance System
"""
    return _send_email(worker.email, subject, body)
