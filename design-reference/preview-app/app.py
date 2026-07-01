"""
Sprint Society — LOCAL PREVIEW (Flask + Jinja, Node-free)
=========================================================
A server-rendered replica of the Sprint Society app, built on the SAME locked
`ss-base` design system as the real React app, so every page can be redesigned,
run, and clicked through on a machine with no Node.js.

This is a PREVIEW/replica for design review — NOT the production React runtime.
The real app remains React (client/) + Express (server/) on origin/main.

- Real session auth (register/login/logout, password hashing, protected routes).
- Seed data (seed.py) shaped to the real frontend's expected fields.
- One Jinja template per page, extending a shared shell (aurora + chrome + nav).

Run:   python app.py     ->   http://127.0.0.1:5000
Login: ishan@sprintsociety.in  /  runfast   (or register a new account)
"""
from functools import wraps
from flask import (Flask, render_template, request, redirect, url_for,
                   session, flash, jsonify, abort)
from werkzeug.security import generate_password_hash, check_password_hash
import seed

app = Flask(__name__)
app.secret_key = "sprint-society-local-preview-only"   # preview only; not a secret

# ---- In-memory user store (real auth, ephemeral storage) -------------------
USERS = {
    "ishan@sprintsociety.in": {
        "id": 1,
        "name": "Ishan Vashistha",
        "email": "ishan@sprintsociety.in",
        "password_hash": generate_password_hash("runfast"),
        "initials": "IV",
    }
}


def current_user():
    email = session.get("user_email")
    return USERS.get(email) if email else None


def login_required(view):
    @wraps(view)
    def wrapped(*a, **kw):
        if not current_user():
            return redirect(url_for("login", next=request.path))
        return view(*a, **kw)
    return wrapped


@app.context_processor
def inject_globals():
    """Make user + unread count + a page registry available to every template."""
    return {
        "user": current_user(),
        "unread_count": seed.UNREAD_COUNT,
        "NAV": NAV,
        "PAGES": PAGES,
        "seed": seed,
    }


# ---- Page registry (drives the gap report + nav) ---------------------------
# status: "new" = redesigned on ss-base | "todo" = still to build
PAGES = [
    # key,            route,               title,              nav_tab,   status
    ("home",          "/dashboard",        "Home",             "home",    "new"),
    ("social",        "/social",           "Social",           "social",  "new"),
    ("run",           "/run/track",        "Run",              None,      "new"),
    ("communities",   "/communities",      "Communities",      "social",  "new"),
    ("community_detail","/communities/1",  "Community",         "social",  "new"),
    ("events",        "/events",           "Events",           "events",  "new"),
    ("event_detail",  "/events/1",         "Event",            "events",  "new"),
    ("coach",         "/coach",            "AI Coach",         "coach",   "new"),
    ("plan",          "/plan",             "Plan",             "coach",   "new"),
    ("heart_rate",    "/heart-rate",       "Heart Rate",       "coach",   "new"),
    ("records",       "/records",          "Records",          "coach",   "new"),
    ("progress",      "/progress",         "Progress",         "home",    "new"),
    ("runs",          "/runs",             "Run History",      "home",    "new"),
    ("challenges",    "/challenges",       "Challenges",       "home",    "new"),
    ("rewards",       "/rewards",          "Rewards",          "home",    "new"),
    ("notifications", "/notifications",    "Notifications",    None,      "new"),
    ("subscription",  "/subscription",     "Subscription",     None,      "new"),
    ("profile",       "/profile",          "Profile",          None,      "new"),
    ("user_profile",  "/user/2",           "Runner Profile",   None,      "new"),
    ("ai_profile",    "/ai-profile",       "AI Profile",       "coach",   "new"),
    ("profiling",     "/profiling",        "AI Profiling",     None,      "new"),
    ("set_goal",      "/set-goal",         "Set Goal",         None,      "new"),
    ("share",         "/share",            "Share Card",       None,      "new"),
    ("admin",         "/admin",            "Admin",            None,      "new"),
]

# Bottom-nav destinations (the 4 tabs + the Run FAB)
NAV = {
    "home": "/dashboard", "coach": "/coach", "social": "/social", "events": "/events",
}


# ============================================================================
#  AUTH
# ============================================================================
@app.route("/")
def index():
    return redirect(url_for("dashboard") if current_user() else url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = (request.form.get("email") or "").strip().lower()
        pw = request.form.get("password") or ""
        u = USERS.get(email)
        if u and check_password_hash(u["password_hash"], pw):
            session["user_email"] = email
            return redirect(request.args.get("next") or url_for("dashboard"))
        flash("Invalid email or password.")
    return render_template("auth/login.html", title="Sign in")


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = (request.form.get("name") or "").strip()
        email = (request.form.get("email") or "").strip().lower()
        pw = request.form.get("password") or ""
        if not (name and email and pw):
            flash("All fields are required.")
        elif email in USERS:
            flash("An account with that email already exists.")
        else:
            USERS[email] = {
                "id": len(USERS) + 1, "name": name, "email": email,
                "password_hash": generate_password_hash(pw),
                "initials": "".join(p[0] for p in name.split()[:2]).upper() or "R",
            }
            session["user_email"] = email
            return redirect(url_for("dashboard"))
    return render_template("auth/register.html", title="Create account")


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


# ============================================================================
#  PAGES  (each renders a Jinja template on ss-base)
# ============================================================================
@app.route("/dashboard")
@login_required
def dashboard():
    return render_template("pages/home.html", title="Home", active_tab="home")


@app.route("/social")
@login_required
def social():
    return render_template("pages/social.html", title="Social", active_tab="social")


@app.route("/run/track")
@login_required
def run_track():
    return render_template("pages/run.html", title="Run", active_tab=None)


@app.route("/communities")
@login_required
def communities():
    return render_template("pages/communities.html", title="Communities", active_tab="social")


@app.route("/communities/<int:cid>")
@login_required
def community_detail(cid):
    community = next((c for c in seed.COMMUNITIES_JOINED + seed.COMMUNITIES_DISCOVER if c["id"] == cid), None)
    if not community:
        abort(404)
    return render_template("pages/community_detail.html", title=community["name"],
                           active_tab="social", community=community)


@app.route("/events")
@login_required
def events():
    return render_template("pages/events.html", title="Events", active_tab="events")


@app.route("/events/<int:eid>")
@login_required
def event_detail(eid):
    event = next((e for e in seed.EVENTS if e["id"] == eid), None)
    if not event:
        abort(404)
    return render_template("pages/event_detail.html", title=event["title"],
                           active_tab="events", event=event)


@app.route("/coach")
@login_required
def coach():
    return render_template("pages/coach.html", title="AI Coach", active_tab="coach")


@app.route("/plan")
@login_required
def plan():
    return render_template("pages/plan.html", title="Plan", active_tab="coach")


@app.route("/heart-rate")
@login_required
def heart_rate():
    return render_template("pages/heart_rate.html", title="Heart Rate", active_tab="coach")


@app.route("/records")
@login_required
def records():
    return render_template("pages/records.html", title="Records", active_tab="coach")


@app.route("/progress")
@login_required
def progress():
    return render_template("pages/progress.html", title="Progress", active_tab="home")


@app.route("/runs")
@login_required
def runs():
    return render_template("pages/runs.html", title="Run History", active_tab="home")


@app.route("/challenges")
@login_required
def challenges():
    return render_template("pages/challenges.html", title="Challenges", active_tab="home")


@app.route("/rewards")
@login_required
def rewards():
    return render_template("pages/rewards.html", title="Rewards", active_tab="home")


@app.route("/notifications")
@login_required
def notifications():
    return render_template("pages/notifications.html", title="Notifications", active_tab=None)


@app.route("/subscription")
@login_required
def subscription():
    return render_template("pages/subscription.html", title="Subscription", active_tab=None)


@app.route("/profile")
@login_required
def profile():
    return render_template("pages/profile.html", title="Profile", active_tab=None)


@app.route("/user/<int:uid>")
@login_required
def user_profile(uid):
    return render_template("pages/user_profile.html", title="Runner Profile",
                           active_tab=None, uid=uid)


@app.route("/ai-profile")
@login_required
def ai_profile():
    return render_template("pages/ai_profile.html", title="AI Profile", active_tab="coach")


@app.route("/profiling")
@login_required
def profiling():
    return render_template("pages/profiling.html", title="AI Profiling", active_tab=None)


@app.route("/set-goal")
@login_required
def set_goal():
    return render_template("pages/set_goal.html", title="Set Goal", active_tab=None)


@app.route("/share")
@login_required
def share():
    return render_template("pages/share.html", title="Share Card", active_tab=None)


@app.route("/admin")
@login_required
def admin():
    return render_template("pages/admin.html", title="Admin", active_tab=None)


# ---- A built-in gap report / index page (lists every page + status) --------
@app.route("/__pages")
@login_required
def pages_index():
    return render_template("pages/_index.html", title="Preview — all pages", active_tab=None)


# ---- Convenience redirects mirroring the real app --------------------------
@app.route("/coaching")
@app.route("/training")
@app.route("/train")
def _coach_redirects():
    return redirect(url_for("coach"))


@app.route("/feed")
def _feed_redirect():
    return redirect(url_for("social"))


@app.errorhandler(404)
def not_found(e):
    return render_template("pages/_404.html", title="Not found", active_tab=None), 404


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
