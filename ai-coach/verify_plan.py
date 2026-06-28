import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.models import init_db
from database.auth import signup
from personalization.store import store as personalization_store
from coaching.plans import generate_periodized_plan

def test_plan_generation_and_logging():
    print("Testing running plan builder and logging...")
    
    init_db()
    
    # 1. Setup mock user & profile
    user_id = 888
    # Clean first
    try:
        from database.models import get_connection
        conn = get_connection()
        conn.execute("DELETE FROM users WHERE id = 888")
        conn.execute("DELETE FROM profiles WHERE user_id = 888")
        conn.commit()
        conn.close()
    except Exception:
        pass
        
    signup("Plan Tester", "plan_test@example.com", "password123")
    
    from database.models import get_connection
    conn = get_connection()
    user = conn.execute("SELECT id FROM users WHERE email = 'plan_test@example.com'").fetchone()
    uid = user['id']
    
    conn.execute("""
        INSERT OR REPLACE INTO profiles (user_id, age, gender, weight_kg, height_cm, fitness_level, running_experience, recent_5k_time, tier, profiling_complete)
        VALUES (?, 28, 'female', 60.0, 165.0, 'active', 'intermediate', 24.0, 'pace', 1)
    """, (uid,))
    conn.commit()
    conn.close()
    
    profile = {"user_id": uid, "age": 28, "gender": "female", "weight_kg": 60.0, "height_cm": 165.0, "fitness_level": "active", "running_experience": "intermediate", "recent_5k_time": 24.0, "tier": "pace"}
    
    # 2. Generate plan
    plan = generate_periodized_plan(profile, "10k", weeks=8, days_per_week=4)
    print(f"Generated plan for goal {plan['goal']} with {plan['total_weeks']} weeks successfully.")
    
    assert plan["goal"] == "10K", "Goal not correct"
    assert len(plan["weeks"]) == 8, "Weeks count not matching"
    
    # Save plan
    personalization_store.save_active_plan(uid, plan)
    
    saved_plan = personalization_store.get_active_plan(uid)
    assert saved_plan is not None, "Failed to load saved plan"
    assert saved_plan["goal"] == "10K", "Goal not matching in saved plan"
    
    # 3. Log a scheduled run
    print("Marking workout as completed...")
    workout_to_complete = saved_plan["weeks"][0]["schedule"][1] # first non-rest day run
    workout_id = workout_to_complete["id"]
    print(f"Selected Workout to complete: {workout_id} ({workout_to_complete['type']})")
    
    logged_run = {
        "distance_km": workout_to_complete["distance_km"],
        "duration_minutes": workout_to_complete["duration_minutes"],
        "type": workout_to_complete["type"],
        "feel": "strong and light",
        "notes": "Completed exactly as target pace prescribes.",
    }
    
    updated_plan = personalization_store.complete_workout(uid, workout_id, logged_run, thread_id=101)
    assert updated_plan is not None, "Failed to update plan on completion"
    
    # Verify status in updated plan
    completed_workout = None
    for week in updated_plan["weeks"]:
        for workout in week["schedule"]:
            if workout["id"] == workout_id:
                completed_workout = workout
                break
                
    assert completed_workout["status"] == "completed", "Workout status did not change to completed"
    assert completed_workout["logged_run"] is not None, "Logged run info not attached to workout"
    
    # Verify training logs have the entry
    logs = personalization_store.get_training_log(uid)
    assert len(logs) > 0, "No training logs saved"
    assert logs[0]["feel"] == "strong and light", "Feel not matching in saved training logs"
    assert logs[0]["thread_id"] == 101, "Thread ID did not propagate correctly"
    
    print("[PASS] Running plan generator and logging pipeline verified successfully!")

if __name__ == "__main__":
    test_plan_generation_and_logging()
