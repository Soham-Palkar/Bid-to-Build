from datetime import datetime
import re
from ..models.complaint import Complaint

def generate_complaint_id() -> str:
    """
    Generates a unique, sequentially numbered Problem ID in the format COM-YYYY-XXXX.
    Uses the current year dynamically.
    """
    year = datetime.utcnow().year
    prefix = f"COM-{year}-"

    # Find highest sequence number for current year
    recent_complaints = Complaint.query.filter(
        Complaint.complaint_id.like(f"{prefix}%")
    ).all()

    max_seq = 0
    pattern = re.compile(rf"^COM-{year}-(\d+)$")

    for c in recent_complaints:
        match = pattern.match(c.complaint_id)
        if match:
            try:
                seq = int(match.group(1))
                if seq > max_seq:
                    max_seq = seq
            except ValueError:
                pass

    next_seq = max_seq + 1
    return f"{prefix}{next_seq:04d}"
