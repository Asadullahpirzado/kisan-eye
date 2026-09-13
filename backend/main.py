"""
KISAN EYE API – production-ready backend
FastAPI + async SQLAlchemy + JWT Authentication
"""
import os
import uuid
from datetime import datetime, timedelta

# Load .env file so GEMINI_API_KEY is available
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass  # dotenv not installed, rely on system env vars

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.future import select

from . import database, ml_predictor, agent_engine

# ──────────────────────────────────────────────────────────────
# App Setup
# ──────────────────────────────────────────────────────────────
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="KISAN EYE API",
    description="AI-powered crop disease detection and management system",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.on_event("startup")
async def startup_event():
    await database.init_db()


# ──────────────────────────────────────────────────────────────
# Auth Config
# ──────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "kisan-eye-change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/token")


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=expires_minutes)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc
    async with database.async_session() as session:
        result = await session.execute(
            select(database.User).filter(database.User.username == username)
        )
        user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exc
    return user


# ──────────────────────────────────────────────────────────────
# Pydantic Models
# ──────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    password: str


class AssessRequest(BaseModel):
    crop: str
    image_path: str
    prediction: dict
    answers: dict = {}
    parent_case_id: int | None = None


# ──────────────────────────────────────────────────────────────
# Auth Endpoints (public)
# ──────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}


@app.post("/api/v1/register", tags=["auth"])
async def register(req: RegisterRequest):
    username = req.username.strip()
    if len(username) < 3 or len(username) > 50:
        raise HTTPException(status_code=422, detail="Username must be 3 to 50 characters.")
    if not username.replace("_", "").replace("-", "").isalnum():
        raise HTTPException(status_code=422, detail="Username may contain only letters, numbers, hyphens, and underscores.")
    if len(req.password) < 8:
        raise HTTPException(status_code=422, detail="Password must have at least 8 characters.")
    async with database.async_session() as session:
        existing = await session.execute(
            select(database.User).filter(database.User.username == username)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already registered")
        user = database.User(
            username=username,
            hashed_password=hash_password(req.password),
        )
        session.add(user)
        await session.commit()
    return {"message": "User registered successfully"}


@app.post("/api/v1/token", tags=["auth"])
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    async with database.async_session() as session:
        result = await session.execute(
            select(database.User).filter(database.User.username == form_data.username)
        )
        user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


# ──────────────────────────────────────────────────────────────
# Protected Endpoints
# ──────────────────────────────────────────────────────────────
@app.post("/api/v1/analyze", tags=["analysis"])
async def analyze(
    crop: str = Form(...),
    image: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    crop = crop.lower().strip()
    if crop not in ml_predictor.DISEASE_LIBRARY:
        raise HTTPException(status_code=400, detail="Please select a supported crop.")
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    extension = os.path.splitext(image.filename)[1] or ".jpg"
    stored_name = f"{uuid.uuid4().hex}{extension}"
    stored_path = os.path.join(UPLOAD_DIR, stored_name)

    contents = await image.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image is too large (max 10 MB).")
    with open(stored_path, "wb") as f:
        f.write(contents)

    try:
        is_ok, message = ml_predictor.check_image_quality(stored_path)
    except Exception:
        os.remove(stored_path)
        raise HTTPException(status_code=400, detail="That file could not be read as an image.")

    if not is_ok:
        return {
            "quality_ok": False,
            "quality_message": message,
            "image_path": f"/uploads/{stored_name}",
        }

    prediction = ml_predictor.predict(stored_path, crop)
    prediction["crop"] = crop

    band = agent_engine.confidence_band(prediction["confidence"])
    question_ids = agent_engine.questions_for(prediction["confidence"])
    questions = [{"id": q, **agent_engine.QUESTION_BANK[q]} for q in question_ids]

    return {
        "quality_ok": True,
        "image_path": f"/uploads/{stored_name}",
        "prediction": prediction,
        "confidence_band": band,
        "questions": questions,
        "needs_escalation": band == "low",
        "escalation_message": agent_engine.escalation_message() if band == "low" else None,
    }


@app.post("/api/v1/assess", tags=["analysis"])
async def assess(payload: AssessRequest, current_user=Depends(get_current_user)):
    risk_score, risk_level = agent_engine.score_risk(payload.prediction, payload.answers)
    explanation, evidence = agent_engine.build_explanation(payload.prediction, payload.answers, risk_level)
    action_plan = agent_engine.build_action_plan(payload.prediction, risk_level)

    import random
    # Generate mock coordinates around a central agricultural hub for the demo map
    base_lat, base_lng = 23.0, 79.0 # Central India
    lat = base_lat + random.uniform(-2.0, 2.0)
    lng = base_lng + random.uniform(-2.0, 2.0)

    case_id = await database.create_case(
        crop=payload.crop,
        image_path=payload.image_path,
        prediction=payload.prediction["label"],
        confidence=payload.prediction["confidence"],
        alternatives=payload.prediction.get("alternatives", []),
        answers=payload.answers,
        risk_level=risk_level,
        risk_score=risk_score,
        affected_area=payload.prediction.get("affected_area", 0),
        explanation=explanation,
        evidence=evidence,
        action_plan=action_plan,
        lat=lat,
        lng=lng,
        parent_case_id=payload.parent_case_id,
    )
    return await database.get_case(case_id)


@app.get("/api/v1/cases", tags=["cases"])
async def list_cases(current_user=Depends(get_current_user)):
    return await database.list_cases()


@app.get("/api/v1/cases/{case_id}", tags=["cases"])
async def get_case(case_id: int, current_user=Depends(get_current_user)):
    case = await database.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@app.get("/api/v1/crops/{crop}/cases", tags=["cases"])
async def cases_for_crop(crop: str, current_user=Depends(get_current_user)):
    return await database.list_cases_for_crop(crop)


@app.get("/api/v1/monitor", tags=["monitoring"])
async def monitor(previous_id: int, current_id: int, current_user=Depends(get_current_user)):
    previous = await database.get_case(previous_id)
    current = await database.get_case(current_id)
    if not previous or not current:
        raise HTTPException(status_code=404, detail="One of the cases could not be found")
    if previous["crop"] != current["crop"]:
        raise HTTPException(status_code=400, detail="Choose two observations of the same crop.")

    area_change = round(current["affected_area"] - previous["affected_area"], 1)
    risk_order = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}
    risk_direction = risk_order.get(current["risk_level"], 0) - risk_order.get(previous["risk_level"], 0)

    if risk_direction > 0:
        summary = f"Risk increased ({previous['risk_level']} → {current['risk_level']})."
    elif risk_direction < 0:
        summary = f"Conditions improved ({previous['risk_level']} → {current['risk_level']})."
    else:
        summary = f"Risk holding steady at {current['risk_level']}."

    return {
        "previous": previous,
        "current": current,
        "area_change": area_change,
        "risk_direction": risk_direction,
        "summary": summary,
    }


@app.get("/api/v1/dashboard", tags=["dashboard"])
async def dashboard(current_user=Depends(get_current_user)):
    all_cases = await database.list_cases()
    total = len(all_cases)
    healthy = sum(1 for c in all_cases if c["risk_level"] == "LOW")
    monitoring = sum(1 for c in all_cases if c["risk_level"] == "MEDIUM")
    high_risk = sum(1 for c in all_cases if c["risk_level"] == "HIGH")

    crops: dict = {}
    for c in all_cases:
        crops.setdefault(c["crop"], []).append(c)

    crop_summary = [
        {
            "crop": name,
            "latest_prediction": items[0]["prediction"],
            "latest_risk": items[0]["risk_level"],
            "case_count": len(items),
        }
        for name, items in crops.items()
    ]

    return {
        "total": total,
        "healthy": healthy,
        "monitoring": monitoring,
        "high_risk": high_risk,
        "recent_cases": all_cases[:6],
        "crops": crop_summary,
    }
