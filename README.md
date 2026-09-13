# 🌾 Kisan Eye

**Kisan Eye** is an AI-powered agricultural assistant designed to instantly detect crop diseases, assess risk levels, and provide actionable treatment plans. Built to empower farmers with quick, accurate visual diagnostics using advanced Generative AI and deep learning.

### 🎥 Demo Video
Watch the full project demo here:  
[KISAN EYE Demo Video (Google Drive)](https://drive.google.com/file/d/1jFFAPt_0n9HuLaz-yVWPAkkuK0k9hRU_/view?usp=sharing)

---

### ⚠️ Copyright & License Notice
**Copyright (c) 2026 Kisan Eye. All Rights Reserved.**  
**This project is PROPRIETARY and CLOSED SOURCE.** You may not copy, reproduce, distribute, publish, display, or modify this code without explicit written permission from the owner. Unauthorized use, copying, or distribution is strictly prohibited.

---

## Project structure

```
kisan-eye/
  backend/     FastAPI service - image handling, vision heuristic, agent logic, sqlite storage
  frontend/    React + Vite + Tailwind interface
```

## Running the backend

```
From the project root, run:

```
python -m venv backend/venv
# Windows Command Prompt: backend\venv\Scripts\activate
# Windows PowerShell: .\backend\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

If the virtual environment already exists, activate it and run the last two commands.
```

The API comes up at `http://localhost:8000`. A sqlite file (`kisan.db`) and an
`uploads/` folder are created automatically on first run.

## Running the frontend

```
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173` and talks to the backend using the
`VITE_API_URL` value in `.env`.

## How the pieces fit together

- **`ml_predictor.py`** looks at colour and texture ratios in the uploaded
  photo (green cover, browning, dark spotting, orange rust-like patches, pale
  powdery patches) and scores them against a small library of diseases per
  crop. It's written as a drop-in placeholder: swap the body of `predict()`
  for a call to a trained MobileNet/EfficientNet classifier and nothing else
  in the app needs to change.
- **`agent_engine.py`** decides what to do with that prediction: how
  confident it is, which follow-up questions actually matter, how to turn the
  answers into a risk score, and what the action plan should say.
- **`main.py`** is the thin FastAPI layer connecting uploads, the predictor,
  the agent, and the sqlite case history.
- The frontend walks a farmer through the same four stages the PRD describes:
  upload → AI investigation (chat) → result dashboard → ongoing monitoring.

## Notes on the ML model

This submission ships a heuristic, colour-based vision model rather than a
trained CNN, since assembling and training on a labelled leaf dataset wasn't
practical in the hackathon's time box. It's built so the interface, agent
logic and everything downstream already work the way they would with a real
trained model - retraining and swapping in a proper classifier is the natural
next step, not a rebuild.

## Demo and judging notes

See [PITCH.md](PITCH.md) for a concise live-demo script, product differentiators,
and an honest technical framing for judges.

## Disclaimer

KISAN EYE gives AI-based early-warning and decision support. It is not a
substitute for a professional agricultural diagnosis.
