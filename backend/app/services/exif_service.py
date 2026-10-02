import logging
from PIL import Image, ExifTags

logger = logging.getLogger(__name__)

def _to_float(v) -> float | None:
    """
    Safely converts int, float, IFDRational, or (numerator, denominator) tuple to float.
    """
    if v is None:
        return None
    try:
        if hasattr(v, 'numerator') and hasattr(v, 'denominator'):
            return float(v.numerator) / float(v.denominator) if v.denominator != 0 else 0.0
        if isinstance(v, (tuple, list)) and len(v) == 2:
            return float(v[0]) / float(v[1]) if v[1] != 0 else 0.0
        return float(v)
    except Exception:
        return None

def _convert_to_degrees(value) -> float | None:
    """
    Converts EXIF GPS coordinate tuple (degrees, minutes, seconds) to decimal degrees.
    """
    try:
        if not isinstance(value, (tuple, list)) or len(value) < 3:
            return _to_float(value)

        d = _to_float(value[0])
        m = _to_float(value[1])
        s = _to_float(value[2])

        if d is None or m is None or s is None:
            return None

        return d + (m / 60.0) + (s / 3600.0)
    except Exception as e:
        logger.debug(f"Error converting GPS coordinate to degrees: {e}")
        return None

def extract_gps_from_image(image_path: str) -> dict:
    """
    Extracts latitude, longitude, and altitude from an image file using Pillow EXIF metadata.
    Returns:
        {
            "gps_available": bool,
            "latitude": float or None,
            "longitude": float or None,
            "altitude_m": float or None
        }
    Never raises an unhandled exception.
    """
    result = {
        "gps_available": False,
        "latitude": None,
        "longitude": None,
        "altitude_m": None
    }

    if not image_path:
        return result

    try:
        with Image.open(image_path) as img:
            exif_data = img._getexif() if hasattr(img, '_getexif') else None
            if not exif_data:
                exif = img.getexif()
                if exif:
                    # GPS IFD is tag 34853 (0x8825)
                    gps_ifd = exif.get_ifd(0x8825)
                    if gps_ifd:
                        exif_data = {34853: gps_ifd}

            if not exif_data:
                return result

            # Find GPSInfo dictionary
            gps_info = None
            for key, val in exif_data.items():
                if key == 34853 or ExifTags.TAGS.get(key) == 'GPSInfo':
                    gps_info = val
                    break

            if not gps_info or not isinstance(gps_info, dict):
                return result

            # Tag 1: LatitudeRef, Tag 2: Latitude
            # Tag 3: LongitudeRef, Tag 4: Longitude
            # Tag 5: AltitudeRef (0 = Above Sea Level, 1 = Below Sea Level), Tag 6: Altitude
            lat_ref = gps_info.get(1) or gps_info.get('GPSLatitudeRef')
            lat_val = gps_info.get(2) or gps_info.get('GPSLatitude')
            lon_ref = gps_info.get(3) or gps_info.get('GPSLongitudeRef')
            lon_val = gps_info.get(4) or gps_info.get('GPSLongitude')
            alt_ref = gps_info.get(5) or gps_info.get('GPSAltitudeRef')
            alt_val = gps_info.get(6) or gps_info.get('GPSAltitude')

            lat = None
            lon = None
            alt = None

            if lat_val is not None and lat_ref is not None:
                deg = _convert_to_degrees(lat_val)
                if deg is not None:
                    if str(lat_ref).upper().startswith('S'):
                        deg = -deg
                    lat = round(deg, 6)

            if lon_val is not None and lon_ref is not None:
                deg = _convert_to_degrees(lon_val)
                if deg is not None:
                    if str(lon_ref).upper().startswith('W'):
                        deg = -deg
                    lon = round(deg, 6)

            if alt_val is not None:
                raw_alt = _to_float(alt_val)
                if raw_alt is not None:
                    # Check below sea level ref (1 or b'\x01')
                    is_below = str(alt_ref) in ('1', "b'\\x01'", 'Below Sea Level')
                    if is_below:
                        raw_alt = -abs(raw_alt)
                    alt = round(raw_alt, 2)

            if lat is not None and lon is not None:
                result['gps_available'] = True
                result['latitude'] = lat
                result['longitude'] = lon
                result['altitude_m'] = alt

    except Exception as e:
        logger.warning(f"Failed to extract EXIF GPS from {image_path}: {e}")

    return result
