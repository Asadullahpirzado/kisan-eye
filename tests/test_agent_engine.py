"""Tests for agent_engine module."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from backend import agent_engine


def test_confidence_band_low():
    assert agent_engine.confidence_band(40.0) == "low"


def test_confidence_band_medium():
    assert agent_engine.confidence_band(65.0) == "medium"


def test_confidence_band_high():
    assert agent_engine.confidence_band(90.0) == "high"


def test_questions_for_low_confidence():
    questions = agent_engine.questions_for(40.0)
    assert len(questions) == 0  # low confidence returns [] in agent_engine.py


def test_score_risk_returns_tuple():
    prediction = {"disease": "Bacterial Blight", "label": "Bacterial Blight", "confidence": 90.0, "affected_area": 40.0}
    answers = {"watering": "daily", "soil_type": "clay"}
    result = agent_engine.score_risk(prediction, answers)
    assert isinstance(result, tuple)
    assert len(result) == 2
    risk_score, risk_level = result
    assert isinstance(risk_score, float)
    assert risk_level in ("LOW", "MEDIUM", "HIGH")


def test_build_action_plan_not_empty():
    prediction = {"disease": "Leaf Rust", "label": "Leaf Rust", "confidence": 85.0, "affected_area": 30.0}
    plan = agent_engine.build_action_plan(prediction, "HIGH")
    assert isinstance(plan, list)
    assert len(plan) > 0


def test_build_explanation_returns_tuple():
    prediction = {"disease": "Leaf Rust", "label": "Leaf Rust", "summary": "Rust summary", "confidence": 85.0, "affected_area": 30.0}
    answers = {"watering": "twice_weekly", "soil_type": "loam"}
    explanation, evidence = agent_engine.build_explanation(prediction, answers, "MEDIUM")
    assert isinstance(explanation, str)
    assert isinstance(evidence, list)
