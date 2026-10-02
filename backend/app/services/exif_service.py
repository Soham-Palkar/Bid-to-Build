import logging
from PIL import Image, ExifTags

logger = logging.getLogger(__name__)

def _convert_to_degrees(value) -> float | None:
    """
    Helper function to convert the GPS coordinates stored in the EXIF to decimal degrees.
    Handles int, float, and rational numbers (tuple or IFDRational).
    """
    try:
        def to_float(v):
            if hasattr(v, 'numerator') and hasattr(v, 'denominator'):
                return float(v.numerator) / float(v.denominator) if v.denominator != 0 else 0.0
            if isinstance(v, tuple) and len(v) == 2:
                return float(v[0]) / float(v[1]) if v[1] != 0 else 0.0
            return float(v)

        d = to_float(value[0])
        m = to_float(value[1])
        s = to_float(value[2])

        return d + (m / 60.0) + (s / 3600.0)
    except Exception as e:
        logger.debug(f"Error converting GPS coordinate to degrees: {e}")
        return None

def extract_gps_from_image(image_path: str) -> dict:
    """
    Extracts latitude and longitude from an image file using Pillow EXIF metadata.
    Returns:
        {
            "latitude": float or None,
            "longitude": float or None
        }
    Never raises an unhandled exception or rejects the complaint.
    """
    result = {"latitude": None, "longitude": None}

    if not image_path:
        return result

    try:
        with Image.open(image_path) as img:
            exif_data = img._getexif() if hasattr(img, '_getexif') else None
            if not exif_data:
                # Try new getexif()
                exif = img.getexif()
                if exif:
                    # GPS IFD is tag 34853 (0x8825)
                    gps_ifd = exif.get_ifd(0x8825)
                    if gps_ifd:
                        exif_data = {34853: gps_ifd}

            if not exif_data:
                return result

            # Find GPSInfo key
            gps_info = None
            for key, val in exif_data.items():
                if key == 34853 or ExifTags.TAGS.get(key) == 'GPSInfo':
                    gps_info = val
                    break

            if not gps_info:
                return result

            # Parse GPS Latitude and Longitude
            # Tag 1: LatitudeRef, Tag 2: Latitude, Tag 3: LongitudeRef, Tag 4: Longitude
            lat_ref = gps_info.get(1) or gps_info.get('GPSLatitudeRef')
            lat_val = gps_info.get(2) or gps_info.get('GPSLatitude')
            lon_ref = gps_info.get(3) or gps_info.get('GPSLongitudeRef')
            lon_val = gps_info.get(4) or gps_info.get('GPSLongitude')

            if lat_val and lat_ref:
                lat = _convert_to_degrees(lat_val)
                if lat is not None:
                    if str(lat_ref).upper().startswith('S'):
                        lat = -lat
                    result['latitude'] = round(lat, 6)

            if lon_val and lon_ref:
                lon = _convert_to_degrees(lon_val)
                if lon is not None:
                    if str(lon_ref).upper().startswith('W'):
                        lon = -lon
                    result['longitude'] = round(lon, 6)

    except Exception as e:
        logger.warning(f"Failed to extract EXIF GPS from {image_path}: {e}")

    return result
