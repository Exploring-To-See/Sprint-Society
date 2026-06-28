import sqlite3
import os
from config import DB_PATH


def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            gender TEXT NOT NULL DEFAULT 'male',
            age INTEGER NOT NULL DEFAULT 25,
            height_cm REAL NOT NULL DEFAULT 170,
            weight_kg REAL NOT NULL DEFAULT 70,
            fitness_level TEXT NOT NULL DEFAULT 'active',
            running_experience TEXT NOT NULL DEFAULT 'beginner',
            dream_race TEXT DEFAULT '5K',
            running_why TEXT DEFAULT 'health',
            preferred_time TEXT DEFAULT 'morning',
            training_days INTEGER DEFAULT 3,
            bad_run_response TEXT DEFAULT 'analyze',
            recent_5k_time REAL,
            coach_style TEXT DEFAULT 'energizer',
            injury_history TEXT DEFAULT '[]',
            tier TEXT DEFAULT 'spark',
            tier_score REAL DEFAULT 0,
            profiling_complete INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS threads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL DEFAULT 'New chat',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            thread_id INTEGER,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            tool_calls TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS insights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category TEXT NOT NULL,
            content TEXT NOT NULL,
            confidence REAL DEFAULT 1.0,
            decay_weight REAL DEFAULT 1.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)

    # --- Lightweight migrations for existing databases ---
    cols = [r["name"] for r in cursor.execute("PRAGMA table_info(conversations)").fetchall()]
    if "thread_id" not in cols:
        cursor.execute("ALTER TABLE conversations ADD COLUMN thread_id INTEGER")

    conn.commit()
    conn.close()
