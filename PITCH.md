# KISAN EYE — Hackathon demo guide

## The 20-second pitch

KISAN EYE is an early-warning companion for farmers. A farmer takes one leaf photo, KISAN EYE identifies visual warning signs, asks only the field questions that improve confidence, and returns a clear risk-aware action plan. The next photo is not a new, isolated diagnosis: it becomes evidence of whether the crop is recovering or getting worse.

## What makes it different

- **It does not overclaim.** Weak image evidence triggers a retake/escalation flow rather than a false diagnosis.
- **It turns detection into a decision.** Risk is informed by visual symptoms plus onset, spread, weather, and watering conditions.
- **It works over time.** Saved cases form a field record; the monitoring view compares two observations and explains the trend.
- **It is designed for real field use.** Large tap targets, camera-first guidance, plain language, fast steps, and mobile navigation.

## Suggested 3-minute live demo

1. Start on the landing page: “Most plant-disease tools stop at a label. KISAN EYE helps farmers decide what to do next.”
2. Select **Tomato**, upload a clear leaf photo, and point out the scan stages and photo-quality checks.
3. In the investigation, answer the short questions. Emphasize that the questions change risk instead of being decorative.
4. On the result screen, explain the visual match, evidence, urgency banner, and numbered actions. Use **Save / print** to show it can travel beyond the app.
5. Open **Track progress**, select two observations, and show the affected-area change and risk direction.
6. Close with: “This shifts crop care from reacting to damage to catching a trend early.”

## Honest technical framing

The current vision layer is a colour/texture heuristic structured behind a stable predictor interface. For production, replace `ml_predictor.predict()` with a trained, regionally validated model without changing the agent, API, database, or UI. This demonstrates both a functioning prototype today and a credible route to deployment.

## Judge-facing architecture

`Photo upload → image quality gate → visual predictor → confidence-aware field questions → risk engine → actionable plan → SQLite case history → longitudinal comparison`
