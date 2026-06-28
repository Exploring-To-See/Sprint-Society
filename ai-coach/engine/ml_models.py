import os
import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPRegressor
from database.auth import get_profile
from personalization.store import store as personalization_store
from engine.pace_calculator import calculate_pace_zones

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "models")


class RunningMLDEngine:
    def __init__(self):
        self.readiness_model = None
        self.vdot_mlp_model = None
        self._load_or_train_models()

    def _generate_synthetic_training_data(self, size: int = 300):
        """Generates physiological training data based on running science formulas."""
        np.random.seed(42)
        
        # Features: [age, weight, height, weekly_volume, ctl, atl, acwr, hrv, sleep_hours]
        ages = np.random.randint(18, 65, size=size)
        weights = np.random.uniform(50, 100, size=size)
        heights = np.random.uniform(150, 195, size=size)
        weekly_volumes = np.random.uniform(5, 120, size=size)
        
        ctls = weekly_volumes * 0.8 + np.random.normal(0, 5, size=size)
        ctls = np.clip(ctls, 5, 100)
        
        acwrs = np.random.uniform(0.5, 2.2, size=size)
        atls = ctls * acwrs
        
        hrvs = 80 - 0.4 * ages + np.random.normal(0, 10, size=size) - (atls - ctls) * 0.2
        hrvs = np.clip(hrvs, 15, 120)
        
        sleeps = np.random.uniform(5, 9.5, size=size)

        X = np.column_stack((ages, weights, heights, weekly_volumes, ctls, atls, acwrs, hrvs, sleeps))
        
        # Targets:
        # 1. Injury Risk % (clamped 0 to 1)
        injury_risk = 0.05 + 0.45 * np.square(np.maximum(0, acwrs - 1.2)) + 0.15 * (sleeps < 6.5) + (atls > 70) * 0.1
        injury_risk = np.clip(injury_risk, 0.0, 1.0)
        
        # 2. Readiness Zone (0=Red, 1=Yellow, 2=Green)
        readiness = []
        for idx in range(size):
            risk = injury_risk[idx]
            acwr = acwrs[idx]
            hrv = hrvs[idx]
            if risk > 0.65 or acwr > 1.6 or hrv < 25:
                readiness.append(0)  # Red
            elif risk > 0.35 or acwr > 1.3 or hrv < 40:
                readiness.append(1)  # Yellow
            else:
                readiness.append(2)  # Green
        readiness = np.array(readiness)

        # 3. Next Week's VDOT Forecast (DL model target)
        # Baseline VDOT: calculated from VO2max approximations
        base_vdot = 60 - 0.25 * ages - (weights / heights) * 10
        # Progression based on chronic load (CTL) minus fatigue penalty (ACWR spike)
        future_vdot = base_vdot * (1.0 + 0.08 * np.log1p(ctls) - 0.05 * np.square(np.maximum(0, acwrs - 1.3)))
        future_vdot = np.clip(future_vdot, 20, 85)

        return X, readiness, future_vdot

    def _load_or_train_models(self):
        os.makedirs(MODEL_DIR, exist_ok=True)
        rf_path = os.path.join(MODEL_DIR, "readiness_rf.pkl")
        mlp_path = os.path.join(MODEL_DIR, "vdot_mlp.pkl")

        if os.path.exists(rf_path) and os.path.exists(mlp_path):
            try:
                with open(rf_path, "rb") as f:
                    self.readiness_model = pickle.load(f)
                with open(mlp_path, "rb") as f:
                    self.vdot_mlp_model = pickle.load(f)
                return
            except Exception:
                pass

        # Train models if not present
        print("Training local running performance ML/DL models...")
        X, readiness, future_vdot = self._generate_synthetic_training_data()

        # ML Model: Random Forest for classification of Readiness
        self.readiness_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.readiness_model.fit(X, readiness)

        # DL Model: MLP Regressor (Neural Network) to predict future VDOT
        self.vdot_mlp_model = MLPRegressor(
            hidden_layer_sizes=(64, 32), 
            activation="relu", 
            max_iter=500, 
            random_state=42
        )
        self.vdot_mlp_model.fit(X, future_vdot)

        # Save models
        with open(rf_path, "wb") as f:
            pickle.dump(self.readiness_model, f)
        with open(mlp_path, "wb") as f:
            pickle.dump(self.vdot_mlp_model, f)

    def analyze_runner(self, user_id: int) -> dict:
        """Runs the ML + DL predictive models on the user's features."""
        profile = get_profile(user_id)
        if not profile:
            return {}

        logs = personalization_store.get_training_log(user_id)
        
        # Calculate current features
        age = profile.get("age", 25)
        weight = profile.get("weight_kg", 70.0)
        height = profile.get("height_cm", 170.0)
        
        # Compute ATL / CTL / ACWR from logs
        weekly_volume = 0.0
        ctl = 15.0
        atl = 15.0
        
        if logs:
            distances = [float(l.get("distance_km", 0.0)) for l in logs]
            weekly_volume = sum(distances[-3:]) # estimate weekly volume
            
            # Simple moving average approximations for CTL/ATL
            ctl = np.mean(distances) if len(distances) > 0 else 15.0
            atl = np.mean(distances[-3:]) if len(distances) >= 3 else ctl
            
        acwr = (atl / ctl) if ctl > 0 else 1.0
        
        # Estimate HRV and Sleep
        hrv = profile.get("hrv", 50.0) or 50.0
        sleep_hours = 7.5  # default
        
        # Package into feature array
        X_test = np.array([[
            age, weight, height, weekly_volume, ctl, atl, acwr, hrv, sleep_hours
        ]])

        # 1. Run ML model (Readiness Classifier & Risk Estimate)
        try:
            readiness_pred = int(self.readiness_model.predict(X_test)[0])
            readiness_proba = self.readiness_model.predict_proba(X_test)[0]
            # Probabilities mapping to color zones
            # 0=Red, 1=Yellow, 2=Green
            zones = ["Red", "Yellow", "Green"]
            readiness_zone = zones[readiness_pred]
            
            # Estimated injury risk is the probability of Red/Yellow readiness
            injury_risk_percent = round((readiness_proba[0] * 0.7 + readiness_proba[1] * 0.3) * 100, 1)
        except Exception:
            # Fallbacks if prediction fails
            readiness_zone = "Green" if acwr <= 1.3 else ("Yellow" if acwr <= 1.5 else "Red")
            injury_risk_percent = round((acwr - 0.8) * 50, 1) if acwr > 1.2 else 10.0

        # 2. Run DL model (VDOT Forecast Neural Network)
        try:
            predicted_future_vdot = float(self.vdot_mlp_model.predict(X_test)[0])
            
            # Bound prediction to sanity levels
            current_vdot = calculate_pace_zones(profile).get("vdot", 35.0)
            predicted_future_vdot = max(current_vdot - 5.0, min(current_vdot + 6.0, predicted_future_vdot))
        except Exception:
            # Simple mathematical fallback
            current_vdot = calculate_pace_zones(profile).get("vdot", 35.0)
            predicted_future_vdot = current_vdot * (1.0 + 0.01 * (ctl / 30.0))

        analysis = {
            "injury_risk_percent": max(0.0, min(100.0, injury_risk_percent)),
            "readiness_zone": readiness_zone,
            "predicted_future_vdot": round(predicted_future_vdot, 1),
            "analyzed_at": _now()
        }

        # Update personalization store directly so the AI system picks it up immediately
        p_data = personalization_store.get_personalization(user_id)
        p_data["ml_dl_performance_analysis"] = analysis
        personalization_store._write_json(personalization_store._file(user_id, "personalization.json"), p_data)

        return analysis


def _now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


# Singleton engine instance
ml_dl_engine = RunningMLDEngine()
