from flask import Blueprint, request, jsonify
from ..models import Complaint, User

tracking_bp = Blueprint('tracking', __name__, url_prefix='/api/complaints')

@tracking_bp.route('/track', methods=['POST'])
def track_complaint():
    """
    Public tracking endpoint requiring both Problem ID (complaint_id) and reporter email.
    """
    data = request.get_json(silent=True) or request.form.to_dict()
    complaint_id = str(data.get('complaint_id', '')).strip()
    email = str(data.get('email', '')).strip().lower()

    if not complaint_id or not email:
        return jsonify({
            "success": False,
            "error": "Both Problem ID and registered student email are required.",
            "message": "Both Problem ID and registered student email are required."
        }), 400

    complaint = Complaint.query.filter_by(complaint_id=complaint_id).first()
    if not complaint:
        return jsonify({
            "success": False,
            "error": f"No complaint found matching ID {complaint_id}.",
            "message": f"No complaint found matching ID {complaint_id}."
        }), 404

    # Verify user email matches complaint owner
    if not complaint.user or complaint.user.email.lower() != email:
        return jsonify({
            "success": False,
            "error": "Email address does not match the registered record for this Problem ID.",
            "message": "Email address does not match the registered record for this Problem ID."
        }), 403

    # Format tracking response
    loc = complaint.location
    worker = complaint.assigned_worker

    loc_str = f"{loc.location_name} — {loc.building}, Floor {loc.floor} • {loc.room}" if loc else "Campus Facility"

    timeline = [entry.to_dict() for entry in complaint.timeline_entries] if complaint.timeline_entries else [{
        'status': complaint.status,
        'timestamp': complaint.created_at.strftime('%d %b %Y, %I:%M %p') if complaint.created_at else 'Just now',
        'note': 'Complaint submitted and verified by automated safety rules.',
        'actor': 'System'
    }]

    response_payload = {
        "success": True,
        "complaint_id": complaint.complaint_id,
        "category": complaint.category,
        "description": complaint.description,
        "photo_url": complaint.to_dict().get('photo_url'),
        "location": loc_str,
        "location_details": complaint.to_dict().get('location'),
        "priority": complaint.priority,
        "priority_reason": complaint.priority_reason,
        "status": complaint.status,
        "is_recurring": complaint.is_recurring,
        "previous_complaint_count": complaint.previous_complaint_count,
        "assigned_worker": worker.to_dict() if worker else None,
        "timeline": timeline,
        "created_at": complaint.created_at.strftime('%d %b %Y, %I:%M %p') if complaint.created_at else 'Just now',
        "data": complaint.to_dict()
    }

    return jsonify(response_payload), 200
