import math
from ..models.location import Location

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two GPS points in meters using Haversine formula.
    """
    R = 6371000.0  # Earth radius in meters

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return R * c

def verify_complaint_location(selected_location_id: str, photo_lat: float | None, photo_lon: float | None) -> dict:
    """
    Verifies reported location against photo EXIF GPS.
    The selected location is ALWAYS the primary reported location.
    Returns:
        {
            "selected_location": Location object or dict,
            "has_gps": bool,
            "photo_latitude": float or None,
            "photo_longitude": float or None,
            "distance_m": float or None,
            "verified": bool,
            "detected_location": Location object or None,
            "detected_location_id": str or None
        }
    """
    selected_loc = Location.query.filter_by(location_id=selected_location_id).first()
    all_locations = Location.query.all()

    if photo_lat is None or photo_lon is None:
        return {
            "selected_location": selected_loc,
            "has_gps": False,
            "photo_latitude": None,
            "photo_longitude": None,
            "distance_m": None,
            "verified": False,
            "detected_location": None,
            "detected_location_id": None
        }

    # Find nearest campus location based on photo GPS
    nearest_loc = None
    min_distance = float('inf')

    for loc in all_locations:
        dist = haversine_distance(photo_lat, photo_lon, loc.latitude, loc.longitude)
        if dist < min_distance:
            min_distance = dist
            nearest_loc = loc

    # Calculate distance to selected location
    if selected_loc:
        distance_to_selected = haversine_distance(photo_lat, photo_lon, selected_loc.latitude, selected_loc.longitude)
        is_verified = distance_to_selected <= selected_loc.radius_m
    else:
        distance_to_selected = min_distance
        is_verified = False

    return {
        "selected_location": selected_loc,
        "has_gps": True,
        "photo_latitude": photo_lat,
        "photo_longitude": photo_lon,
        "distance_m": round(distance_to_selected, 2),
        "verified": is_verified,
        "detected_location": nearest_loc,
        "detected_location_id": nearest_loc.location_id if nearest_loc else None
    }
