from flask import Blueprint, request, jsonify
from datetime import datetime
from ..models import Complaint, Location
from ..services.complaint_service import create_complaint_pipeline
from ..services.email_service import send_complaint_confirmation_email
from ..services.location_service import verify_complaint_location

complaints_bp = Blueprint('complaints', __name__, url_prefix='/api/complaints')

@complaints_bp.route('', methods=['POST'])
def submit_complaint():
    """
    Submits a new maintenance complaint.
    Accepts multipart/form-data with file or application/json.
    """
    if request.is_json:
        form_data = request.get_json() or {}
        photo_file = None
    else:
        form_data = request.form.to_dict()
        photo_file = request.files.get('photo')

    # If frontend sends building/floor/room instead of location_id, resolve location_id
    if not form_data.get('location_id') and form_data.get('room'):
        room_name = form_data.get('room')
        matched_loc = Location.query.filter(
            (Location.room.ilike(f"%{room_name}%")) |
            (Location.location_name.ilike(f"%{room_name}%"))
        ).first()
        if matched_loc:
            form_data['location_id'] = matched_loc.location_id

    success, result, status_code = create_complaint_pipeline(form_data, photo_file)
    return jsonify(result), status_code

@complaints_bp.route('/detect-location', methods=['POST'])
def detect_location_preview():
    """
    Instant preview endpoint used by the frontend photo uploader to check location verification.
    """
    data = request.get_json(silent=True) or request.form.to_dict()
    location_id = data.get('location_id')
    room = data.get('room')
    gps_mode = data.get('gps_mode', 'verified')

    loc = None
    if location_id:
        loc = Location.query.filter_by(location_id=location_id).first()
    if not loc and room:
        loc = Location.query.filter(
            (Location.room.ilike(f"%{room}%")) |
            (Location.location_name.ilike(f"%{room}%"))
        ).first()
    if not loc:
        loc = Location.query.first()

    if gps_mode == 'none':
        return jsonify({
            "has_gps": False,
            "latitude": None,
            "longitude": None,
            "user_selected": loc.location_name if loc else "Campus Location",
            "detected_building": None,
            "detected_floor": None,
            "detected_room": None,
            "detected_name": None,
            "verified": False
        }), 200

    # Default to DB Lab coordinates for verified mode
    lat = loc.latitude if loc and gps_mode == 'verified' else 19.045009
    lon = loc.longitude if loc and gps_mode == 'verified' else 72.842012

    geo = verify_complaint_location(loc.location_id if loc else "LOC001", lat, lon)
    det_loc = geo['detected_location']

    return jsonify({
        "has_gps": True,
        "latitude": lat,
        "longitude": lon,
        "user_selected": loc.location_name if loc else "Campus Location",
        "detected_building": det_loc.building if det_loc else loc.building,
        "detected_floor": f"Floor {det_loc.floor}" if det_loc else f"Floor {loc.floor}",
        "detected_room": det_loc.room if det_loc else loc.room,
        "detected_name": det_loc.location_name if det_loc else loc.location_name,
        "verified": geo['verified']
    }), 200

@complaints_bp.route('/<complaint_id>/resend-email', methods=['POST'])
def resend_email(complaint_id: str):
    """
    Resends complaint registration confirmation email.
    """
    complaint = Complaint.query.filter_by(complaint_id=complaint_id).first()
    if not complaint:
        return jsonify({"success": False, "error": f"Complaint {complaint_id} not found."}), 404

    user = complaint.user
    if not user:
        return jsonify({"success": False, "error": "User record not found for complaint."}), 404

    success, error_msg = send_complaint_confirmation_email(complaint, user, complaint.location)
    return jsonify({
        "success": success,
        "complaint_id": complaint_id,
        "user_email_sent": success,
        "user_email_recipient": user.email,
        "email_sent_at": datetime.utcnow().strftime('%d %b %Y, %I:%M %p'),
        "email_subject": f"SmartFix Complaint Registered — {complaint_id}",
        "error": error_msg
    }), 200
