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
    Instant preview endpoint used by the frontend photo uploader to extract EXIF GPS and check location verification.
    """
    import os
    import base64
    import tempfile
    from ..services.exif_service import extract_gps_from_image

    photo_file = request.files.get('photo')
    data = request.get_json(silent=True) or request.form.to_dict()
    location_id = data.get('location_id')
    room = data.get('room')
    photo_data_url = data.get('photo_data_url')

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

    gps_data = {"gps_available": False, "latitude": None, "longitude": None, "altitude_m": None}

    # Extract EXIF GPS from file if uploaded
    if photo_file and hasattr(photo_file, 'filename') and photo_file.filename:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            photo_file.save(tmp.name)
            tmp_path = tmp.name
        try:
            gps_data = extract_gps_from_image(tmp_path)
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    elif photo_data_url and str(photo_data_url).startswith('data:image/'):
        try:
            _, encoded = str(photo_data_url).split(',', 1)
            img_bytes = base64.b64decode(encoded)
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
                tmp.write(img_bytes)
                tmp_path = tmp.name
            try:
                gps_data = extract_gps_from_image(tmp_path)
            finally:
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
        except Exception:
            pass

    # If GPS not yet found and a URL/filename was provided, search local asset & upload directories
    if not gps_data.get('gps_available') and photo_data_url and not str(photo_data_url).startswith('data:'):
        raw_url = str(photo_data_url).split('?')[0].split('#')[0]
        basename = os.path.basename(raw_url)
        base_dir = os.path.dirname(__file__)
        candidate_paths = [
            os.path.join(base_dir, '..', '..', 'uploads', basename),
            os.path.join(base_dir, '..', '..', '..', 'SmartFix', 'src', 'assets', 'images', basename),
            os.path.join(base_dir, '..', '..', '..', 'SmartFix', 'public', 'images', basename),
            os.path.join(base_dir, '..', '..', '..', 'SmartFix', 'public', 'src', 'assets', 'images', basename),
        ]
        for cp in candidate_paths:
            if os.path.exists(cp):
                try_gps = extract_gps_from_image(cp)
                if try_gps.get('gps_available'):
                    gps_data = try_gps
                    break

    # Check if explicit latitude/longitude were passed
    if not gps_data.get('gps_available') and data.get('latitude') is not None and data.get('longitude') is not None:
        try:
            gps_data = {
                "gps_available": True,
                "latitude": float(data['latitude']),
                "longitude": float(data['longitude']),
                "altitude_m": float(data['altitude_m']) if data.get('altitude_m') is not None else None
            }
        except (ValueError, TypeError):
            pass

    # Verify against selected location
    lat = gps_data.get('latitude')
    lon = gps_data.get('longitude')
    alt = gps_data.get('altitude_m')
    has_gps = gps_data.get('gps_available', False) and (lat is not None and lon is not None)

    geo = verify_complaint_location(loc.location_id if loc else "LOC001", lat, lon, alt)
    det_loc = geo['detected_location']

    return jsonify({
        "gps_available": has_gps,
        "has_gps": has_gps,
        "latitude": lat,
        "longitude": lon,
        "altitude_m": alt,
        "distance_m": geo['distance_m'],
        "allowed_radius_m": geo['allowed_radius_m'],
        "verified": geo['verified'],
        "user_selected": loc.location_name if loc else "Campus Location",
        "location_id": loc.location_id if loc else None,
        "detected_location_id": geo['detected_location_id'],
        "detected_building": det_loc.building if det_loc else (loc.building if loc else None),
        "detected_floor": f"Floor {det_loc.floor}" if det_loc else (f"Floor {loc.floor}" if loc else None),
        "detected_room": det_loc.room if det_loc else (loc.room if loc else None),
        "detected_name": det_loc.location_name if det_loc else (loc.location_name if loc else None)
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
