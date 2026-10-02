from flask import Blueprint, jsonify
from ..models.location import Location

locations_bp = Blueprint('locations', __name__, url_prefix='/api/locations')

@locations_bp.route('', methods=['GET'])
def get_locations():
    """
    Returns the authoritative list of campus locations from SQLite.
    Frontend dynamic location selector consumes this endpoint.
    """
    locations = Location.query.order_by(Location.location_id.asc()).all()
    data = [loc.to_dict() for loc in locations]
    return jsonify({
        "success": True,
        "data": data,
        "count": len(data)
    }), 200
