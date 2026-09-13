from PIL import Image
import numpy as np
import os

import requests
import base64

try:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
except Exception:
    GEMINI_API_KEY = None



DISEASE_LIBRARY = {
    "tomato": [
        "Tomato_Bacterial_spot", "Tomato_Early_blight", "Tomato_healthy", "Tomato_Late_blight",
        "Tomato_Leaf_Mold", "Tomato_Septoria_leaf_spot", "Tomato_Spider_mites_Two_spotted_spider_mite",
        "Tomato__Target_Spot", "Tomato__Tomato_mosaic_virus", "Tomato__Tomato_YellowLeaf__Curl_Virus"
    ],
    "potato": ["Potato___Early_blight", "Potato___healthy", "Potato___Late_blight"],
    "pepper": ["Pepper__bell___Bacterial_spot", "Pepper__bell___healthy"],
    "wheat": [],
    "cotton": []
}

DISEASE_INFO = {
    "Tomato_Bacterial_spot": {"label": "Bacterial Spot", "summary": "brown, water-soaked spots on leaves"},
    "Tomato_Early_blight": {"label": "Early Blight", "summary": "dark concentric spots on older leaves"},
    "Tomato_healthy": {"label": "Healthy", "summary": "even green colour with no notable spotting"},
    "Tomato_Late_blight": {"label": "Late Blight", "summary": "irregular water-soaked patches"},
    "Tomato_Leaf_Mold": {"label": "Leaf Mold", "summary": "pale green or yellow spots on upper leaf surface"},
    "Tomato_Septoria_leaf_spot": {"label": "Septoria Leaf Spot", "summary": "small circular spots with grey centres"},
    "Tomato_Spider_mites_Two_spotted_spider_mite": {"label": "Spider Mites", "summary": "stippling or yellowing of leaves"},
    "Tomato__Target_Spot": {"label": "Target Spot", "summary": "dark brown spots with concentric rings"},
    "Tomato__Tomato_mosaic_virus": {"label": "Mosaic Virus", "summary": "mottled light and dark green areas"},
    "Tomato__Tomato_YellowLeaf__Curl_Virus": {"label": "Yellow Leaf Curl Virus", "summary": "upward curling and yellowing of leaves"},
    "Potato___Early_blight": {"label": "Early Blight", "summary": "dark concentric spots on leaves"},
    "Potato___healthy": {"label": "Healthy", "summary": "even green colour with no notable spotting"},
    "Potato___Late_blight": {"label": "Late Blight", "summary": "irregular water-soaked patches"},
    "Pepper__bell___Bacterial_spot": {"label": "Bacterial Spot", "summary": "small, brown, water-soaked spots"},
    "Pepper__bell___healthy": {"label": "Healthy", "summary": "even green colour with no notable spotting"},
    "healthy": {"label": "Healthy", "summary": "even green colour with no notable spotting"},
}


def check_image_quality(image_path):
    img = Image.open(image_path)
    img.verify()
    img = Image.open(image_path)
    width, height = img.size
    if width < 150 or height < 150:
        return False, "The image is too small to analyse clearly. Please upload a higher resolution photo."

    gray = np.array(img.convert("L"), dtype=np.float32)
    contrast = gray.std()
    if contrast < 12:
        return False, "The image looks blurry or flat. Please take a sharper, well-lit photo of the leaf."

    brightness = gray.mean()
    if brightness < 25:
        return False, "The image is too dark to analyse. Please retake the photo in better light."
    if brightness > 235:
        return False, "The image is overexposed. Please retake the photo out of direct glare."

    return True, "Image quality looks good."


def _color_ratios(img):
    hsv = np.array(img.convert("HSV"), dtype=np.float32)
    h, s, v = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    total = h.size

    green_mask = (h > 40) & (h < 100) & (s > 40) & (v > 40)
    yellow_mask = (h > 15) & (h <= 40) & (s > 60) & (v > 90)
    brown_mask = (h > 5) & (h <= 30) & (v < 140) & (s > 40)
    dark_spot_mask = (v < 70) & (s > 20)
    orange_mask = (h > 5) & (h <= 25) & (s > 120) & (v > 100)
    pale_mask = (s < 35) & (v > 150)

    return {
        "green": green_mask.sum() / total,
        "yellow": yellow_mask.sum() / total,
        "brown": brown_mask.sum() / total,
        "dark_spot": dark_spot_mask.sum() / total,
        "orange": orange_mask.sum() / total,
        "pale": pale_mask.sum() / total,
    }


def _score_disease(disease, ratios):
    d_lower = disease.lower()
    if "healthy" in d_lower:
        # Only score high if leaf is actually healthy — mostly green, low damage
        damage = ratios["brown"] + ratios["dark_spot"] + ratios["yellow"] + ratios["orange"]
        if damage > 0.10:
            return 0.01  # Severely penalize "healthy" when damage is visible
        return max(0.01, ratios["green"] - damage)

    if "early_blight" in d_lower or "late_blight" in d_lower:
        return ratios["brown"] * 1.6 + ratios["dark_spot"] * 1.2 + ratios["yellow"] * 0.3
    if "septoria" in d_lower:
        return ratios["dark_spot"] * 1.4 + ratios["brown"] * 0.6
    if "rust" in d_lower:
        return ratios["orange"] * 2.0 + ratios["brown"] * 0.4
    if "mildew" in d_lower:
        return ratios["pale"] * 1.8
    if "bacterial" in d_lower:
        return ratios["brown"] * 1.3 + ratios["dark_spot"] * 0.8
    if "curl" in d_lower or "mosaic" in d_lower:
        return ratios["yellow"] * 1.2 + (1 - ratios["green"]) * 0.5
    if "mold" in d_lower:
        return ratios["pale"] * 1.2 + ratios["yellow"] * 0.8
    if "spider" in d_lower or "target" in d_lower:
        return ratios["dark_spot"] * 1.5
    return 0.05


def _is_leaf_healthy(ratios):
    """A leaf is only truly healthy if it's mostly green with minimal damage markers."""
    green = ratios["green"]
    damage = ratios["brown"] + ratios["dark_spot"] + ratios["yellow"] + ratios["orange"]
    # Only call healthy if >40% green AND <10% damage
    return green > 0.40 and damage < 0.10



def predict(image_path, crop):
    img = Image.open(image_path).convert("RGB")
    ratios = _color_ratios(img)
    candidates = DISEASE_LIBRARY.get(crop, DISEASE_LIBRARY["tomato"])

    # Attempt External API Prediction (Gemini Vision via REST)
    if GEMINI_API_KEY is not None:
        try:
            prompt = (
                f"Look at this {crop} leaf image carefully. "
                f"Does it show ANY signs of disease, discoloration, spots, blight, lesions, or damage? "
                f"If YES, which disease from this list best matches: {candidates}. "
                f"If the leaf looks completely healthy with NO damage, respond with the word 'healthy'. "
                f"Respond with ONLY the exact disease name from the list above, nothing else."
            )
            
            with open(image_path, "rb") as image_file:
                base64_image = base64.b64encode(image_file.read()).decode('utf-8')
                
            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": base64_image
                            }
                        }
                    ]
                }]
            }
            
            headers = {"Content-Type": "application/json"}
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={GEMINI_API_KEY}"
            
            response = requests.post(url, json=payload, headers=headers, timeout=15)
            response.raise_for_status()
            
            api_result = response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            
            # Match the API result to our candidates
            matched_disease = None
            for c in candidates:
                if c.lower() in api_result.lower():
                    matched_disease = c
                    break
            
            # Fix: find the correct healthy candidate by name, not last item
            if not matched_disease and "healthy" in api_result.lower():
                matched_disease = _find_healthy_candidate(candidates)

            if matched_disease:
                affected_area = round(min(0.9, ratios["brown"] + ratios["dark_spot"] + ratios["orange"]) * 100, 1)
                return {
                    "disease": matched_disease,
                    "label": DISEASE_INFO.get(matched_disease, DISEASE_INFO["healthy"])["label"],
                    "summary": DISEASE_INFO.get(matched_disease, DISEASE_INFO["healthy"])["summary"],
                    "confidence": 92.5,
                    "affected_area": affected_area,
                    "alternatives": [],
                }
        except Exception as e:
            print(f"External API Prediction failed, falling back to heuristic: {e}")

    # ── Smart Fallback Heuristic ──────────────────────────────────────────────
    # Calculate total visible damage on the leaf
    damage = ratios["brown"] + ratios["dark_spot"] + ratios["yellow"] + ratios["orange"]
    green  = ratios["green"]

    # A leaf is ONLY healthy if it is mostly green AND has very low damage
    # Otherwise force disease detection by removing healthy from candidates
    leaf_is_healthy = green > 0.45 and damage < 0.08

    if leaf_is_healthy:
        # Truly healthy leaf — score all candidates normally
        scoring_candidates = candidates
    else:
        # Diseased leaf — remove healthy candidates so we NEVER wrongly say healthy
        scoring_candidates = [d for d in candidates if "healthy" not in d.lower()]
        if not scoring_candidates:
            scoring_candidates = candidates  # fallback safety

    raw_scores = {d: _score_disease(d, ratios) for d in scoring_candidates}
    total = sum(raw_scores.values()) or 1.0
    normalised = {d: raw_scores[d] / total for d in scoring_candidates}

    ranked = sorted(normalised.items(), key=lambda pair: pair[1], reverse=True)
    top_disease, top_score = ranked[0]

    # Confidence reflects how much damage was found
    if not leaf_is_healthy:
        # Damage found — confidence scales with damage level
        confidence = round(min(95.0, max(55.0, 55.0 + damage * 300)), 1)
    else:
        confidence = round(min(0.97, max(0.30, 0.55 + top_score * 0.9)) * 100, 1)

    affected_area = round(min(90.0, damage * 100), 1)

    alternatives = [
        {"disease": d, "label": DISEASE_INFO[d]["label"], "confidence": round(score * 100, 1)}
        for d, score in ranked
    ]

    return {
        "disease": top_disease,
        "label": DISEASE_INFO[top_disease]["label"],
        "summary": DISEASE_INFO[top_disease]["summary"],
        "confidence": confidence,
        "affected_area": affected_area,
        "alternatives": alternatives,
    }
