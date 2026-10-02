import re

ALLOWED_CATEGORIES = {
    'Electrical',
    'Plumbing',
    'Furniture',
    'HVAC',
    'Civil / Infrastructure',
    'Civil/Infrastructure',
    'Other'
}

ALLOWED_STATUSES = {
    'Reported',
    'Assigned',
    'In Progress',
    'Resolved'
}

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')

def is_valid_email(email: str) -> bool:
    if not email or not isinstance(email, str):
        return False
    return bool(EMAIL_REGEX.match(email.strip()))

def validate_complaint_input(data: dict) -> tuple[bool, str | None]:
    """
    Validates mandatory fields for complaint submission.
    """
    user_id = str(data.get('user_id', '')).strip()
    name = str(data.get('name', '')).strip()
    email = str(data.get('email', '')).strip()
    category = str(data.get('category', '')).strip()
    location_id = str(data.get('location_id', '')).strip()
    description = str(data.get('description', '')).strip()

    if not user_id:
        return False, "Student / User ID is required."
    if not name:
        return False, "Reporter Name is required."
    if not email:
        return False, "Email address is required."
    if not is_valid_email(email):
        return False, "Please provide a valid email address."
    if not category:
        return False, "Category is required."
    if not location_id:
        return False, "Location selection is required."
    if not description:
        return False, "Complaint description cannot be empty."

    return True, None
