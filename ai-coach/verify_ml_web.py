import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.models import init_db
from engine.ml_models import ml_dl_engine
from knowledge.web_scraper import scrape_web
from personalization.store import store as personalization_store
from database.auth import signup, get_profile

def test_web_scraper():
    print("Testing live web scraper...")
    # Test a general running search
    results = scrape_web("marathon training tips")
    print(f"Web Scraping Results Count: {len(results)}")
    for i, r in enumerate(results[:2]):
        print(f"Result {i+1}: {r['title']} -> {r['url']}")
        print(f"Snippet: {r['snippet']}")
    assert len(results) > 0, "No web results found"
    print("[PASS] web scraper verified.")

def test_ml_dl_engine():
    print("\nTesting ML + DL Physiological Predictor Engine...")
    
    # 1. Initialize SQLite Database Schema
    init_db()
    
    user_id = 999
    # Clean profile & personalization if exists
    try:
        from database.models import get_connection
        conn = get_connection()
        conn.execute("DELETE FROM users WHERE id = 999")
        conn.execute("DELETE FROM profiles WHERE user_id = 999")
        conn.commit()
        conn.close()
    except Exception:
        pass
        
    signup("Test User", "test_ml@example.com", "password123")
    
    # Retrieve user ID
    from database.models import get_connection
    conn = get_connection()
    user = conn.execute("SELECT id FROM users WHERE email = 'test_ml@example.com'").fetchone()
    uid = user['id']
    
    # Complete profiling
    conn.execute("""
        INSERT OR REPLACE INTO profiles (user_id, age, gender, weight_kg, height_cm, fitness_level, running_experience, recent_5k_time, tier, profiling_complete)
        VALUES (?, 30, 'male', 75.0, 180.0, 'active', 'intermediate', 22.5, 'pace', 1)
    """, (uid,))
    conn.commit()
    conn.close()

    # 2. Run analysis
    analysis = ml_dl_engine.analyze_runner(uid)
    print(f"ML/DL Predictions: {json.dumps(analysis, indent=2)}")
    
    assert "injury_risk_percent" in analysis, "injury_risk_percent missing"
    assert "readiness_zone" in analysis, "readiness_zone missing"
    assert "predicted_future_vdot" in analysis, "predicted_future_vdot missing"
    
    # 3. Add run log to verify pipeline trigger
    print("\nLogging a training run to verify pipeline integration...")
    entry = {"distance_km": 10.0, "duration_minutes": 50, "type": "easy", "feel": "strong"}
    personalization_store.add_training_log(uid, entry)
    
    # Read personalization data to verify it has been updated
    p_data = personalization_store.get_personalization(uid)
    print(f"Personalization Summary block: {p_data.get('summary')}")
    print(f"Personalization ML block: {json.dumps(p_data.get('ml_dl_performance_analysis'), indent=2)}")
    
    assert "ml_dl_performance_analysis" in p_data, "ML/DL analysis was not written to personalization.json"
    
    # 4. Check prompt block output
    prompt_block = personalization_store.build_prompt_block(uid)
    print(f"\nGenerated System Prompt Block:\n{prompt_block}")
    assert "ML/DL Predictions" in prompt_block, "ML/DL predictions not present in system prompt block"
    
    print("[PASS] ML + DL model predictions and pipeline integration verified successfully.")

def test_existing_user_autotrigger():
    print("\nTesting Existing User Account Login autotrigger...")
    
    init_db()
    
    # Clean database entries
    try:
        from database.models import get_connection
        conn = get_connection()
        conn.execute("DELETE FROM users WHERE email = 'existing@example.com'")
        conn.commit()
        conn.close()
    except Exception:
        pass
        
    signup("Existing User", "existing@example.com", "password123")
    
    from database.models import get_connection
    conn = get_connection()
    user = conn.execute("SELECT id FROM users WHERE email = 'existing@example.com'").fetchone()
    uid = user['id']
    
    # Create completed profile but NO personalization files or active plan
    conn.execute("""
        INSERT OR REPLACE INTO profiles (user_id, age, gender, weight_kg, height_cm, fitness_level, running_experience, recent_5k_time, tier, profiling_complete)
        VALUES (?, 28, 'female', 62.0, 168.0, 'active', 'beginner', 28.0, 'spark', 1)
    """, (uid,))
    conn.commit()
    conn.close()
    
    # Delete personalization folder to make sure it's fresh
    import shutil
    user_dir = personalization_store._user_dir(uid)
    if os.path.exists(user_dir):
        shutil.rmtree(user_dir)
        
    # Re-create user dir so store works
    os.makedirs(user_dir, exist_ok=True)
    
    # Now emulate first render of the chat page on login
    plan = personalization_store.get_active_plan(uid)
    assert plan is None, "Plan should be None initially"
    
    # Run the exact check that will be in render_chat_page
    profile = get_profile(uid)
    if not personalization_store.get_active_plan(uid):
        from coaching.plans import generate_periodized_plan
        default_plan = generate_periodized_plan(profile, "5k", weeks=12, days_per_week=3)
        personalization_store.save_active_plan(uid, default_plan)
        
    data = personalization_store.get_personalization(uid)
    assert "ml_dl_performance_analysis" not in data, "ml_dl_performance_analysis should not be in clean personalization data"
    
    if "ml_dl_performance_analysis" not in data:
        ml_dl_engine.analyze_runner(uid)
        
    # Verify both exist now!
    assert personalization_store.get_active_plan(uid) is not None, "Active plan was not generated"
    updated_data = personalization_store.get_personalization(uid)
    assert "ml_dl_performance_analysis" in updated_data, "ml_dl_performance_analysis was not autotriggered"
    
    print(f"Autotriggered ML/DL predictions: {json.dumps(updated_data['ml_dl_performance_analysis'], indent=2)}")
    print("[PASS] Existing user autotriggers successfully verified.")

if __name__ == "__main__":
    print("=== STARTING ML & SCRAPER VERIFICATION SUITE ===")
    test_web_scraper()
    test_ml_dl_engine()
    test_existing_user_autotrigger()
    print("=== ALL ML & SCRAPER VERIFICATION TESTS PASSED ===")
