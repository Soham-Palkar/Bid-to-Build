import os
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename

from ..extensions import db
from ..config import Config
from ..models import User, Location, Complaint, StatusHistory, Worker
from ..utils.complaint_id import generate_complaint_id
from ..utils.validators import validate_complaint_input
from .exif_service import extract_gps_from_image
from .location_service import verify_complaint_location
from .priority_service import detect_priority
from .recurrence_service import check_recurrence
from .email_service import send_complaint_confirmation_email, send_worker_assignment_email

def create_complaint_pipeline(form_data: dict, photo_file=None) -> tuple[bool, dict, int]:
    """
    Executes the 14-step complaint processing pipeline.
    Commits DB transaction before sending email.
    """
    # 1. Validate request
    is_valid, val_err = validate_complaint_input(form_data)
    if not is_valid:
        return False, {"success": False, "error": val_err}, 400

    user_identifier = str(form_data.get('user_id', '')).strip()
    name = str(form_data.get('name', '')).strip()
    email = str(form_data.get('email', '')).strip().lower()
    category = str(form_data.get('category', '')).strip()
    location_id = str(form_data.get('location_id', '')).strip()
    description = str(form_data.get('description', '')).strip()

    # 2. Validate location_id against database
    location = Location.query.filter_by(location_id=location_id).first()
    if not location:
        # Check if matched by room or name as a flexible fallback
        location = Location.query.filter(
            (Location.room.ilike(f"%{location_id}%")) |
            (Location.location_name.ilike(f"%{location_id}%"))
        ).first()

    if not location:
        return False, {"success": False, "error": f"Invalid campus location ID: {location_id}."}, 400

    # 3. Find or create user
    user = User.query.filter(
        (User.email == email) | (User.user_identifier == user_identifier)
    ).first()

    if not user:
        user = User(
            user_identifier=user_identifier,
            name=name,
            email=email
        )
        db.session.add(user)
        db.session.flush()
    else:
        # Update name or user_identifier if newer provided
        if name and user.name != name:
            user.name = name
        if user_identifier and user.user_identifier != user_identifier:
            user.user_identifier = user_identifier
        db.session.flush()

    # 4. Generate Problem ID
    complaint_id = generate_complaint_id()

    # 5. Save photo persistently to uploads/
    saved_filename = None
    saved_path = None
    photo_size_str = form_data.get('photo_size', '1.5 MB')

    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

    # Handle multipart file upload
    if photo_file and hasattr(photo_file, 'filename') and photo_file.filename:
        orig_filename = secure_filename(photo_file.filename)
        ext = orig_filename.rsplit('.', 1)[-1].lower() if '.' in orig_filename else 'jpg'
        saved_filename = f"{complaint_id}_{uuid.uuid4().hex[:8]}.{ext}"
        saved_path = os.path.join(Config.UPLOAD_FOLDER, saved_filename)
        photo_file.save(saved_path)
    elif form_data.get('photo_data_url') and str(form_data.get('photo_data_url')).startswith('data:image/'):
        # Decode base64 data URL into physical file on disk
        try:
            import base64
            data_url = str(form_data.get('photo_data_url'))
            header, encoded = data_url.split(',', 1)
            ext = 'jpg'
            if 'png' in header:
                ext = 'png'
            elif 'webp' in header:
                ext = 'webp'
            img_bytes = base64.b64decode(encoded)
            saved_filename = f"{complaint_id}_{uuid.uuid4().hex[:8]}.{ext}"
            saved_path = os.path.join(Config.UPLOAD_FOLDER, saved_filename)
            with open(saved_path, 'wb') as f:
                f.write(img_bytes)
        except Exception:
            saved_filename = form_data.get('photo_filename', f"{complaint_id}_evidence.jpg")
            saved_path = None
    elif form_data.get('photo_data_url') and not str(form_data.get('photo_data_url')).startswith('data:'):
        # Copy frontend sample image or referenced asset to persistent uploads folder
        import shutil
        raw_url = str(form_data.get('photo_data_url')).split('?')[0].split('#')[0]
        basename = os.path.basename(raw_url)
        base_backend = os.path.dirname(Config.UPLOAD_FOLDER)
        candidate_sources = [
            os.path.join(Config.UPLOAD_FOLDER, basename),
            os.path.join(base_backend, '..', 'SmartFix', 'src', 'assets', 'images', basename),
            os.path.join(base_backend, '..', 'SmartFix', 'public', 'images', basename),
            os.path.join(base_backend, '..', 'SmartFix', 'public', 'src', 'assets', 'images', basename),
        ]
        
        saved_filename = f"{complaint_id}_{uuid.uuid4().hex[:8]}.jpg"
        saved_path = os.path.join(Config.UPLOAD_FOLDER, saved_filename)
        copied = False
        for csrc in candidate_sources:
            if os.path.exists(csrc) and csrc != saved_path:
                shutil.copyfile(csrc, saved_path)
                copied = True
                break
        if not copied and os.path.exists(os.path.join(Config.UPLOAD_FOLDER, basename)):
            shutil.copyfile(os.path.join(Config.UPLOAD_FOLDER, basename), saved_path)
            copied = True
        if not copied:
            saved_filename = form_data.get('photo_filename', f"{complaint_id}_evidence.jpg")

    # 6. Extract EXIF GPS if available
    gps_data = {"gps_available": False, "latitude": None, "longitude": None, "altitude_m": None}
    if saved_path and os.path.exists(saved_path):
        gps_data = extract_gps_from_image(saved_path)

    # 7. Verify location (Haversine against selected location radius)
    geo_check = verify_complaint_location(
        location.location_id,
        gps_data.get('latitude'),
        gps_data.get('longitude'),
        gps_data.get('altitude_m')
    )

    # 8. Detect priority
    priority_res = detect_priority(category, description)

    # 9. Check recurrence
    recurrence_res = check_recurrence(location.location_id, category)

    # 10. Create complaint record
    complaint = Complaint(
        complaint_id=complaint_id,
        user_id=user.id,
        category=category,
        description=description,
        photo_path=saved_path,
        photo_filename=saved_filename,
        photo_size=photo_size_str,
        location_id=location.location_id,
        detected_location_id=geo_check.get('detected_location_id'),
        latitude=geo_check.get('photo_latitude'),
        longitude=geo_check.get('photo_longitude'),
        altitude_m=geo_check.get('photo_altitude_m') or geo_check.get('altitude_m'),
        location_verified=geo_check.get('verified', False),
        gps_distance_m=geo_check.get('distance_m'),
        gps_radius_m=geo_check.get('allowed_radius_m', 5.0),
        priority=priority_res['priority'],
        priority_score=priority_res['score'],
        priority_reason=priority_res['reason'],
        detected_keywords=','.join(priority_res['detected_keywords']),
        is_recurring=recurrence_res['is_recurring'],
        previous_complaint_count=recurrence_res['previous_complaint_count'],
        status='Reported',
        confirmation_email_sent=False
    )
    db.session.add(complaint)

    # 11. Create initial status history
    initial_history = StatusHistory(
        complaint_id=complaint_id,
        old_status=None,
        new_status='Reported',
        changed_by='System',
        notes='Complaint registered and verified by automated safety rules.'
    )
    db.session.add(initial_history)

    # 12. Commit transaction BEFORE sending email
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return False, {"success": False, "error": f"Database commit failed: {str(e)}"}, 500

    # 13. Send confirmation email
    email_success, email_err = send_complaint_confirmation_email(complaint, user, location)
    complaint.confirmation_email_sent = email_success
    complaint.confirmation_email_error = email_err

    # Safely persist email flag without breaking the complaint
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

    # 14. Return standardized response
    data_payload = complaint.to_dict()

    message = (
        "Complaint registered successfully. Confirmation email sent."
        if email_success
        else "Complaint registered successfully, but confirmation email could not be sent."
    )

    response_body = {
        "success": True,
        "complaint_id": complaint_id,
        "priority": complaint.priority,
        "priority_reason": complaint.priority_reason,
        "detected_keywords": priority_res['detected_keywords'],
        "location": {
            "name": location.location_name,
            "building": location.building,
            "floor": f"Floor {location.floor}",
            "room": location.room,
            "latitude": complaint.latitude,
            "longitude": complaint.longitude,
            "verified": complaint.location_verified,
            "location_id": location.location_id
        },
        "is_recurring": complaint.is_recurring,
        "previous_complaint_count": complaint.previous_complaint_count,
        "status": complaint.status,
        "user_email_sent": email_success,
        "user_email_recipient": user.email,
        "email_sent_at": datetime.utcnow().strftime('%d %b %Y, %I:%M %p'),
        "email_subject": f"SmartFix Complaint Registered — {complaint_id}",
        "data": data_payload,
        "message": message
    }

    return True, response_body, 201

def assign_worker_to_complaint(complaint_id: str, worker_id: int) -> tuple[bool, dict, int]:
    """
    Assigns a worker to a complaint, changes status to 'Assigned', creates history, sends worker email.
    """
    complaint = Complaint.query.filter_by(complaint_id=complaint_id).first()
    if not complaint:
        return False, {"success": False, "error": f"Complaint {complaint_id} not found."}, 404

    worker = db.session.get(Worker, worker_id)
    if not worker:
        return False, {"success": False, "error": f"Worker with ID {worker_id} not found."}, 404

    old_status = complaint.status
    complaint.assigned_worker_id = worker.id
    complaint.status = 'Assigned'

    history = StatusHistory(
        complaint_id=complaint.complaint_id,
        old_status=old_status,
        new_status='Assigned',
        changed_by='Admin',
        notes=f"Assigned to {worker.name} ({worker.specialization})."
    )
    db.session.add(history)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return False, {"success": False, "error": f"Failed to assign worker: {str(e)}"}, 500

    # Send worker email
    email_success, email_err = send_worker_assignment_email(complaint, worker, complaint.location)

    return True, {
        "success": True,
        "status": "Assigned",
        "worker": worker.to_dict(),
        "email_sent": email_success,
        "email_error": email_err,
        "complaint": complaint.to_dict(),
        "message": f"Assigned to {worker.name}. Email {'dispatched successfully' if email_success else f'notification failed: {email_err}'}."
    }, 200

def update_status_pipeline(complaint_id: str, new_status: str, actor: str = 'Admin', notes: str | None = None) -> tuple[bool, dict, int]:
    """
    Updates status and logs history entry.
    """
    allowed_statuses = {'Reported', 'Assigned', 'In Progress', 'Resolved'}
    if new_status not in allowed_statuses:
        return False, {"success": False, "error": f"Invalid status '{new_status}'. Allowed: {', '.join(allowed_statuses)}"}, 400

    complaint = Complaint.query.filter_by(complaint_id=complaint_id).first()
    if not complaint:
        return False, {"success": False, "error": f"Complaint {complaint_id} not found."}, 404

    old_status = complaint.status
    complaint.status = new_status

    history = StatusHistory(
        complaint_id=complaint.complaint_id,
        old_status=old_status,
        new_status=new_status,
        changed_by=actor,
        notes=notes or f"Status transitioned from {old_status} to {new_status}."
    )
    db.session.add(history)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return False, {"success": False, "error": f"Failed to update status: {str(e)}"}, 500

    return True, {
        "success": True,
        "status": new_status,
        "complaint": complaint.to_dict()
    }, 200
