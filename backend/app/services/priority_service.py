import re

# Keyword definitions per priority level
CRITICAL_KEYWORDS = [
    'sparking', 'spark', 'fire', 'smoke', 'electric shock', 'shock',
    'exposed wire', 'exposed wiring', 'short circuit', 'gas leak',
    'major flooding', 'electrical hazard', 'burning smell'
]

HIGH_KEYWORDS = [
    'major leak', 'water leakage', 'broken glass', 'unsafe door',
    'large damage', 'ac failure', 'ceiling leak', 'burst pipe',
    'flooding', 'power outage'
]

MEDIUM_KEYWORDS = [
    'fan not working', 'light not working', 'minor leakage', 'broken chair',
    'broken table', 'flickering', 'not working', 'clogged', 'drainage',
    'socket', 'tap leakage', 'door handle'
]

LOW_KEYWORDS = [
    'paint', 'cosmetic', 'minor scratch', 'small furniture issue',
    'peeling', 'dust', 'stain', 'wall plaster'
]

def detect_priority(category: str, description: str) -> dict:
    """
    Detects priority level, score, detected keywords, and rationale based on category and description.
    Safety-critical keywords ALWAYS override lower priority classifications.
    Returns:
        {
            "priority": "Critical" | "High" | "Medium" | "Low",
            "score": int (0-100),
            "reason": str,
            "detected_keywords": list[str]
        }
    """
    desc_lower = (description or '').lower()
    cat_lower = (category or '').lower()

    # 1. Check for Critical keywords
    matched_critical = [kw for kw in CRITICAL_KEYWORDS if kw in desc_lower]
    if matched_critical:
        return {
            "priority": "Critical",
            "score": 95,
            "reason": f"Safety hazard detected ({', '.join(matched_critical)})",
            "detected_keywords": matched_critical
        }

    # 2. Check for High keywords
    matched_high = [kw for kw in HIGH_KEYWORDS if kw in desc_lower]
    if matched_high:
        return {
            "priority": "High",
            "score": 75,
            "reason": f"High operational impact issue ({', '.join(matched_high)})",
            "detected_keywords": matched_high
        }

    # 3. Check for Medium keywords
    matched_medium = [kw for kw in MEDIUM_KEYWORDS if kw in desc_lower]
    if matched_medium:
        return {
            "priority": "Medium",
            "score": 45,
            "reason": f"Standard maintenance request ({', '.join(matched_medium)})",
            "detected_keywords": matched_medium
        }

    # 4. Check for Low keywords
    matched_low = [kw for kw in LOW_KEYWORDS if kw in desc_lower]
    if matched_low:
        return {
            "priority": "Low",
            "score": 15,
            "reason": f"Minor cosmetic or low priority request ({', '.join(matched_low)})",
            "detected_keywords": matched_low
        }

    # 5. Fallback defaults by category if no specific keywords matched
    if 'electrical' in cat_lower:
        return {
            "priority": "High",
            "score": 65,
            "reason": "Electrical category default triage",
            "detected_keywords": []
        }
    elif 'plumbing' in cat_lower or 'hvac' in cat_lower:
        return {
            "priority": "Medium",
            "score": 50,
            "reason": f"{category} maintenance request",
            "detected_keywords": []
        }
    elif 'civil' in cat_lower or 'furniture' in cat_lower:
        return {
            "priority": "Medium",
            "score": 35,
            "reason": f"{category} facility repair",
            "detected_keywords": []
        }

    return {
        "priority": "Low",
        "score": 25,
        "reason": "General campus maintenance request",
        "detected_keywords": []
    }
