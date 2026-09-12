QUESTION_BANK = {
    "onset": {
        "prompt": "When did you first notice these symptoms?",
        "options": ["Today", "2-3 days ago", "About a week ago", "More than a week ago"],
        "weight": {"Today": 5, "2-3 days ago": 15, "About a week ago": 30, "More than a week ago": 45},
    },
    "spread": {
        "prompt": "Are similar symptoms appearing on other plants nearby?",
        "options": ["Not on any other plant", "A few nearby plants", "Most plants in the field", "Not sure"],
        "weight": {"Not on any other plant": 0, "A few nearby plants": 20, "Most plants in the field": 45, "Not sure": 12},
    },
    "weather": {
        "prompt": "Has the field had heavy rain or high humidity recently?",
        "options": ["Frequent rain", "Occasional rain", "Dry weather", "Not sure"],
        "weight": {"Frequent rain": 20, "Occasional rain": 10, "Dry weather": 0, "Not sure": 8},
    },
    "watering": {
        "prompt": "How often is this crop being watered right now?",
        "options": ["Daily, overhead watering", "Daily, drip/soil watering", "A few times a week", "Not sure"],
        "weight": {"Daily, overhead watering": 15, "Daily, drip/soil watering": 3, "A few times a week": 5, "Not sure": 6},
    },
    "soil_type": {
        "prompt": "What is the soil type of the field?",
        "options": ["Sandy", "Loamy", "Clay", "Silt", "Peaty", "Chalky"],
        "weight": {"Sandy": 5, "Loamy": 10, "Clay": 5, "Silt": 5, "Peaty": 5, "Chalky": 5}
    }
}


def confidence_band(confidence):
    if confidence < 45:
        return "low"
    if confidence < 75:
        return "medium"
    return "high"


def questions_for(confidence):
    band = confidence_band(confidence)
    if band == "low":
        return []
    if band == "medium":
        return ["onset", "spread", "weather", "watering", "soil_type"]
    return ["onset", "spread", "soil_type"]


def score_risk(prediction, answers):
    if "healthy" in prediction["disease"].lower() and prediction["confidence"] >= 60:
        return 8, "LOW"

    score = 0.0
    score += prediction["confidence"] * 0.35
    score += prediction["affected_area"] * 0.4

    for key, chosen in answers.items():
        bank = QUESTION_BANK.get(key)
        if bank and chosen in bank["weight"]:
            factor = 0.15 if key == "soil_type" else 0.25
            score += bank["weight"][chosen] * factor

    score = round(min(100, score), 1)

    if score < 35:
        level = "LOW"
    elif score < 65:
        level = "MEDIUM"
    else:
        level = "HIGH"

    return score, level


def build_explanation(prediction, answers, risk_level):
    evidence = ["Visual symptoms detected in the uploaded image"]
    lines = [
        "The uploaded {crop} leaf shows patterns consistent with {label}: {summary}.".format(
            crop=prediction.get("crop", "crop"),
            label=prediction["label"],
            summary=prediction["summary"],
        )
    ]

    if answers.get("onset"):
        evidence.append("Symptom duration reported by farmer")
        lines.append("You mentioned the symptoms started {onset}, which was factored into how urgent this is.".format(
            onset=answers["onset"].lower()
        ))

    if answers.get("spread"):
        evidence.append("Spread across nearby plants")
        if answers["spread"] in ("A few nearby plants", "Most plants in the field"):
            lines.append("Because the symptoms are also showing up on other plants, the risk of it spreading further in the field is higher.")

    if answers.get("weather"):
        evidence.append("Recent weather and humidity")
        if answers["weather"] in ("Frequent rain", "Occasional rain"):
            lines.append("Recent rain and humidity create favourable conditions for this to keep spreading.")

    if answers.get("soil_type"):
        evidence.append("Soil type reported")
        lines.append(f"The soil type is {answers['soil_type'].lower()}, which can affect disease susceptibility.")

    lines.append("Based on all of this, the current risk level is {level}.".format(level=risk_level))

    return " ".join(lines), evidence


def build_action_plan(prediction, risk_level):
    if "healthy" in prediction["disease"].lower():
        return [
            {"title": "Keep Watching", "detail": "No signs of disease right now. Keep checking the crop every few days."},
            {"title": "Maintain Routine", "detail": "Continue your normal watering and care schedule."},
            {"title": "Re-check Later", "detail": "Upload a new photo in one to two weeks or sooner if anything changes."},
        ]

    plan = [
        {"title": "Inspect", "detail": "Check nearby plants closely for the same spots, curling or discolouration."},
        {"title": "Reduce Spread", "detail": "Where practical, keep affected plants separate and avoid working on wet leaves."},
    ]

    if risk_level in ("MEDIUM", "HIGH"):
        plan.append({
            "title": "Adjust Watering",
            "detail": "Water at the base of the plant rather than over the leaves, and water earlier in the day so leaves dry out faster.",
        })

    plan.append({
        "title": "Soil Management",
        "detail": "Based on the reported soil type, consider appropriate fertilization or drainage improvements."
    })

    if risk_level == "HIGH":
        plan.append({
            "title": "Get Expert Input",
            "detail": "Given the current risk level, it's worth having a local agricultural officer confirm this in person.",
        })

    return plan


def escalation_message():
    return (
        "The evidence so far isn't strong enough for a reliable assessment. "
        "Please upload a clearer, well-lit photo of the affected leaf, or check with a local agricultural expert."
    )
