import smtplib
import logging
from email.message import EmailMessage
from ..config import Config

logger = logging.getLogger(__name__)

def _send_email(to_email: str, subject: str, body_text: str) -> tuple[bool, str | None]:
    """
    Internal helper to deliver an email via SMTP.
    Returns (success: bool, error_message: str | None).
    """
    if not to_email:
        return False, "Recipient email is missing."

    # If SMTP credentials are not configured, log simulation and return gracefully
    if not Config.SMTP_USERNAME or not Config.SMTP_PASSWORD:
        logger.info(
            f"[EMAIL SIMULATION] SMTP not configured. Simulated dispatch to {to_email}:\n"
            f"Subject: {subject}\n{body_text}"
        )
        return True, "Simulated dispatch (SMTP credentials not provided)."

    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = Config.MAIL_FROM
        msg['To'] = to_email
        msg.set_content(body_text)

        with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
            server.send_message(msg)

        logger.info(f"Email successfully delivered to {to_email}")
        return True, None
    except Exception as e:
        err_msg = str(e)
        logger.warning(f"Failed to deliver email to {to_email}: {err_msg}")
        return False, err_msg

def send_complaint_confirmation_email(complaint, user, location=None) -> tuple[bool, str | None]:
    """
    Dispatches a confirmation email to the student upon successful complaint registration.
    """
    loc_name = location.location_name if location else (complaint.location.location_name if complaint.location else 'Campus Facility')
    loc_str = f"{loc_name} ({location.building if location else 'XIE'}, Floor {location.floor if location else '1'} • {location.room if location else ''})"

    subject = f"SmartFix Complaint Registered — {complaint.complaint_id}"

    body = f"""Hello {user.name},

Your maintenance complaint has been successfully registered.

Problem ID: {complaint.complaint_id}

Category: {complaint.category}
Location: {loc_name}
Priority: {complaint.priority}
Status: {complaint.status}

Description:
{complaint.description}

You can track your complaint using:

Problem ID:
{complaint.complaint_id}

Email:
{user.email}

Thank you,
SmartFix Maintenance System
"""
    return _send_email(user.email, subject, body)

def send_worker_assignment_email(complaint, worker, location=None) -> tuple[bool, str | None]:
    """
    Dispatches assignment notice to the maintenance technician.
    """
    loc_name = location.location_name if location else (complaint.location.location_name if complaint.location else 'Campus Facility')

    subject = f"New Maintenance Complaint Assigned — {complaint.complaint_id}"

    body = f"""You have been assigned a new maintenance complaint.

Problem ID: {complaint.complaint_id}
Category: {complaint.category}
Priority: {complaint.priority}
Location: {loc_name}

Description:
{complaint.description}

Status:
{complaint.status}

SmartFix Maintenance System
"""
    return _send_email(worker.email, subject, body)
