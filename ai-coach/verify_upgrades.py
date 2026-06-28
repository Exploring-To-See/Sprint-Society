import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from engine.pace_calculator import calculate_pace_zones
from engine.guardrails import check_guardrails
from knowledge.retriever import retriever
from personalization.extractor import extract_signals_rule_based

def verify_paces():
    print("Testing Jack Daniels VDOT Paces Calculator...")
    profile = {
        "age": 30,
        "gender": "male",
        "weight_kg": 70,
        "height_cm": 175,
        "fitness_level": "active",
        "tier": "pace",
        "recent_5k_time": 20.0  # 20 minutes 5K
    }
    
    zones = calculate_pace_zones(profile)
    print(f"Calculated Zones: {json.dumps(zones, indent=2)}")
    assert "formatted" in zones, "Formatted paces missing"
    assert "vdot" in zones, "VDOT score missing"
    assert zones["vdot"] > 45, f"VDOT too low: {zones['vdot']}"
    
    print("[PASS] Pace zones calculated successfully with Daniels VDOT solver.")

def verify_guardrails():
    print("\nTesting Structured Guardrails Check...")
    
    # Test 1: Prohibited intensity type for Spark
    res = check_guardrails(
        tier="spark", 
        recommendation_type="intensity_session", 
        details="Try doing some track repeats",
        intensity_type="intervals"
    )
    print(f"Spark Intervals Check: {res}")
    assert not res["passed"], "Prohibited intensity not blocked"
    assert res["blocked"], "Prohibited intensity not blocked"
    
    # Test 2: Safe volume under cap
    res2 = check_guardrails(
        tier="pace",
        recommendation_type="volume_increase",
        details="Increase weekly volume",
        weekly_km=35.0
    )
    print(f"Pace safe volume check: {res2}")
    assert res2["passed"], "Safe volume blocked incorrectly"
    
    # Test 3: Volume exceeding cap
    res3 = check_guardrails(
        tier="pace",
        recommendation_type="volume_increase",
        details="Double the volume",
        weekly_km=55.0  # limit is 40
    )
    print(f"Pace exceeding volume check: {res3}")
    assert not res3["passed"], "Exceeding volume cap not blocked"
    assert res3["blocked"], "Exceeding volume cap not blocked"

    print("[PASS] Structured guardrails validated successfully.")

def verify_rrf_rag():
    print("\nTesting Hybrid RRF RAG Retrieval...")
    # BM25 should work even without FAISS index
    results = retriever.retrieve("polarized training 80/20", tier="pace", top_k=2)
    print(f"Retrieved {len(results)} chunks.")
    for idx, r in enumerate(results):
        print(f"Match {idx+1}: {r['chunk']['title']} (Score: {r['score']:.4f})")
    
    assert len(results) > 0, "No chunks retrieved"
    print("[PASS] Hybrid search retrieval verified.")

def verify_extractor():
    print("\nTesting Rule-Based Extractor Fallback...")
    signals = extract_signals_rule_based("I want to run a half marathon and my knee hurts when running fast intervals")
    print(f"Extracted signals: {json.dumps(signals, indent=2)}")
    assert len(signals["goals"]) > 0, "Goal not extracted"
    assert len(signals["injuries"]) > 0, "Injury not extracted"
    print("[PASS] Extractor fallback verified.")

if __name__ == "__main__":
    print("=== STARTING UPGRADE VERIFICATION SUITE ===")
    verify_paces()
    verify_guardrails()
    verify_rrf_rag()
    verify_extractor()
    print("=== ALL UPGRADES VERIFIED SUCCESSFULLY ===")
