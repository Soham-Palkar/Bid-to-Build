from ..models.complaint import Complaint

RECURRENCE_THRESHOLD = 3

def check_recurrence(location_id: str, category: str, exclude_complaint_id: str | None = None) -> dict:
    """
    Checks for recurring issues based on location_id + category.
    Threshold: 3 previous complaints.
    Returns:
        {
            "is_recurring": bool,
            "previous_complaint_count": int,
            "threshold": int
        }
    """
    query = Complaint.query.filter(
        Complaint.location_id == location_id,
        Complaint.category == category
    )

    if exclude_complaint_id:
        query = query.filter(Complaint.complaint_id != exclude_complaint_id)

    count = query.count()
    is_recurring = count >= RECURRENCE_THRESHOLD

    return {
        "is_recurring": is_recurring,
        "previous_complaint_count": count,
        "threshold": RECURRENCE_THRESHOLD
    }
