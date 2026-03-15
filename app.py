import os
import sqlite3
from datetime import datetime, timezone

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename


def create_app():
    app = Flask(__name__)
    CORS(app)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, "enviro.db")
    reports_dir = os.path.join(base_dir, "reports")
    os.makedirs(reports_dir, exist_ok=True)

    def get_conn():
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db():
        with get_conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL CHECK(role IN ('industry', 'agency')),
                    created_at TEXT NOT NULL
                )
                """
            )

            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS industry_profiles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_email TEXT NOT NULL UNIQUE,
                    ind_name TEXT NOT NULL,
                    ind_type TEXT NOT NULL,
                    ind_reg_no TEXT NOT NULL,
                    ind_address TEXT NOT NULL,
                    contact_name TEXT NOT NULL,
                    contact_role TEXT NOT NULL,
                    contact_email TEXT NOT NULL,
                    contact_phone TEXT NOT NULL,
                    contact_phone_alt TEXT,
                    monitor_freq TEXT NOT NULL,
                    notif_pref TEXT NOT NULL,
                    status TEXT NOT NULL CHECK(status IN ('DRAFT', 'SUBMITTED')) DEFAULT 'DRAFT',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    submitted_at TEXT
                )
                """
            )

            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS agency_reports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    agency_email TEXT NOT NULL,
                    industry_code TEXT NOT NULL,
                    industry_location TEXT,
                    monitoring_date TEXT NOT NULL,
                    unit TEXT NOT NULL,
                    readings_json TEXT NOT NULL,
                    aqi_value REAL NOT NULL,
                    category TEXT NOT NULL,
                    dominant_pollutant TEXT,
                    status TEXT NOT NULL CHECK(status IN ('DRAFT', 'SUBMITTED')) DEFAULT 'DRAFT',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    submitted_at TEXT
                )
                """
            )

    init_db()

    @app.get("/")
    def index():
        return (
            "<h2>EnviroMonitor backend is running</h2>"
            "<p>This server only provides API endpoints for the frontend.</p>"
            "<ul>"
            "<li><code>GET /api/health</code></li>"
            "<li><code>POST /api/signup</code></li>"
            "<li><code>POST /api/login</code></li>"
            "</ul>"
            "<p>Open <code>login.html</code> using Live Server (or directly) to view the UI.</p>",
            200,
            {"Content-Type": "text/html; charset=utf-8"},
        )

    @app.get("/api/health")
    def health():
        return jsonify({"ok": True})

    @app.post("/api/signup")
    def signup():
        data = request.get_json(silent=True) or {}
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", "")).strip()
        role = str(data.get("role", "")).strip()

        if not email or "@" not in email or "." not in email:
            return jsonify({"ok": False, "error": "Please enter a valid email address."}), 400
        if len(password) < 6:
            return jsonify({"ok": False, "error": "Password must be at least 6 characters."}), 400
        if role not in ("industry", "agency"):
            return jsonify({"ok": False, "error": "Please select a valid role."}), 400

        password_hash = generate_password_hash(password)
        created_at = datetime.now(timezone.utc).isoformat()

        try:
            with get_conn() as conn:
                conn.execute(
                    "INSERT INTO users(email, password_hash, role, created_at) VALUES (?, ?, ?, ?)",
                    (email, password_hash, role, created_at),
                )
        except sqlite3.IntegrityError:
            return jsonify({"ok": False, "error": "Account already exists. Please login."}), 409

        return jsonify({"ok": True, "email": email, "role": role})

    @app.post("/api/login")
    def login():
        data = request.get_json(silent=True) or {}
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", "")).strip()
        role = str(data.get("role", "")).strip()

        if not email or not password or role not in ("industry", "agency"):
            return jsonify({"ok": False, "error": "Please fill email, password, and role."}), 400

        with get_conn() as conn:
            row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

        if not row:
            return jsonify({"ok": False, "error": "Account not found. Please sign up first."}), 404

        if row["role"] != role:
            return jsonify({"ok": False, "error": "Role does not match this account."}), 401

        if not check_password_hash(row["password_hash"], password):
            return jsonify({"ok": False, "error": "Incorrect password. Please try again."}), 401

        return jsonify({"ok": True, "email": row["email"], "role": row["role"]})

    @app.get("/api/industry/profile")
    def get_industry_profile():
        email = str(request.args.get("email", "")).strip().lower()
        if not email:
            return jsonify({"ok": False, "error": "Email is required."}), 400

        with get_conn() as conn:
            row = conn.execute(
                "SELECT * FROM industry_profiles WHERE user_email = ?", (email,)
            ).fetchone()

        if not row:
            return jsonify({"ok": True, "profile": None})

        profile = {k: row[k] for k in row.keys()}
        return jsonify({"ok": True, "profile": profile})

    def _upsert_industry_profile(payload, status):
        email = str(payload.get("email", "")).strip().lower()
        if not email:
            return None, ("Email is required.", 400)

        required_fields = [
            "indName",
            "indType",
            "indRegNo",
            "indAddress",
            "contactName",
            "contactRole",
            "contactEmail",
            "contactPhone",
            "monitorFreq",
            "notifPref",
        ]

        for field in required_fields:
            if not str(payload.get(field, "")).strip():
                return None, (f"{field} is required.", 400)

        now = datetime.now(timezone.utc).isoformat()

        with get_conn() as conn:
            existing = conn.execute(
                "SELECT id FROM industry_profiles WHERE user_email = ?", (email,)
            ).fetchone()

            if existing:
                conn.execute(
                    """
                    UPDATE industry_profiles
                    SET
                        ind_name = ?,
                        ind_type = ?,
                        ind_reg_no = ?,
                        ind_address = ?,
                        contact_name = ?,
                        contact_role = ?,
                        contact_email = ?,
                        contact_phone = ?,
                        contact_phone_alt = ?,
                        monitor_freq = ?,
                        notif_pref = ?,
                        status = ?,
                        updated_at = ?,
                        submitted_at = CASE WHEN ? = 'SUBMITTED' THEN ? ELSE submitted_at END
                    WHERE user_email = ?
                    """,
                    (
                        payload.get("indName", "").strip(),
                        payload.get("indType", "").strip(),
                        payload.get("indRegNo", "").strip(),
                        payload.get("indAddress", "").strip(),
                        payload.get("contactName", "").strip(),
                        payload.get("contactRole", "").strip(),
                        payload.get("contactEmail", "").strip(),
                        payload.get("contactPhone", "").strip(),
                        payload.get("contactPhoneAlt", "").strip() or None,
                        payload.get("monitorFreq", "").strip(),
                        payload.get("notifPref", "").strip(),
                        status,
                        now,
                        status,
                        now,
                        email,
                    ),
                )
            else:
                conn.execute(
                    """
                    INSERT INTO industry_profiles (
                        user_email,
                        ind_name,
                        ind_type,
                        ind_reg_no,
                        ind_address,
                        contact_name,
                        contact_role,
                        contact_email,
                        contact_phone,
                        contact_phone_alt,
                        monitor_freq,
                        notif_pref,
                        status,
                        created_at,
                        updated_at,
                        submitted_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        email,
                        payload.get("indName", "").strip(),
                        payload.get("indType", "").strip(),
                        payload.get("indRegNo", "").strip(),
                        payload.get("indAddress", "").strip(),
                        payload.get("contactName", "").strip(),
                        payload.get("contactRole", "").strip(),
                        payload.get("contactEmail", "").strip(),
                        payload.get("contactPhone", "").strip(),
                        payload.get("contactPhoneAlt", "").strip() or None,
                        payload.get("monitorFreq", "").strip(),
                        payload.get("notifPref", "").strip(),
                        status,
                        now,
                        now,
                        now if status == "SUBMITTED" else None,
                    ),
                )

        return {"email": email, "status": status}, None

    @app.post("/api/industry/profile/save")
    def save_industry_profile():
        data = request.get_json(silent=True) or {}
        result, error = _upsert_industry_profile(data, status="DRAFT")
        if error:
            msg, code = error
            return jsonify({"ok": False, "error": msg}), code
        return jsonify({"ok": True, **result})

    @app.post("/api/industry/profile/submit")
    def submit_industry_profile():
        data = request.get_json(silent=True) or {}
        result, error = _upsert_industry_profile(data, status="SUBMITTED")
        if error:
            msg, code = error
            return jsonify({"ok": False, "error": msg}), code
        return jsonify({"ok": True, **result})

    def _upsert_agency_report(payload, status):
        email = str(payload.get("email", "")).strip().lower()
        if not email:
            return None, ("Email is required.", 400)

        industry_code = str(payload.get("industryCode", "")).strip()
        monitoring_date = str(payload.get("monitoringDate", "")).strip()
        unit = str(payload.get("unit", "")).strip()
        readings = payload.get("readings") or {}
        aqi_value = payload.get("aqiValue")
        category = str(payload.get("category", "")).strip()

        if not industry_code or not monitoring_date or not unit:
            return None, ("Industry, date, and unit are required.", 400)
        if not isinstance(readings, dict) or not readings:
            return None, ("Readings are required.", 400)
        if aqi_value is None or category == "":
            return None, ("AQI value and category are required.", 400)

        import json

        now = datetime.now(timezone.utc).isoformat()
        readings_json = json.dumps(readings)

        with get_conn() as conn:
            conn.execute(
                """
                INSERT INTO agency_reports (
                    agency_email,
                    industry_code,
                    industry_location,
                    monitoring_date,
                    unit,
                    readings_json,
                    aqi_value,
                    category,
                    dominant_pollutant,
                    status,
                    created_at,
                    updated_at,
                    submitted_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    email,
                    industry_code,
                    str(payload.get("industryLocation", "")).strip() or None,
                    monitoring_date,
                    unit,
                    readings_json,
                    float(aqi_value),
                    category,
                    str(payload.get("dominantPollutant", "")).strip() or None,
                    status,
                    now,
                    now,
                    now if status == "SUBMITTED" else None,
                ),
            )

        return {"email": email, "status": status}, None

    @app.post("/api/agency/report/save")
    def save_agency_report():
        data = request.get_json(silent=True) or {}
        result, error = _upsert_agency_report(data, status="DRAFT")
        if error:
            msg, code = error
            return jsonify({"ok": False, "error": msg}), code
        return jsonify({"ok": True, **result})

    @app.post("/api/agency/report/submit")
    def submit_agency_report():
        data = request.get_json(silent=True) or {}
        result, error = _upsert_agency_report(data, status="SUBMITTED")
        if error:
            msg, code = error
            return jsonify({"ok": False, "error": msg}), code
        return jsonify({"ok": True, **result})

    @app.get("/api/reports/pdf/<report_name>")
    def get_pdf_report(report_name):
        safe_name = secure_filename(report_name)

        if not safe_name or not safe_name.lower().endswith(".pdf"):
            return jsonify({"ok": False, "error": "Invalid report name."}), 400

        report_path = os.path.join(reports_dir, safe_name)

        if not os.path.isfile(report_path):
            return jsonify({"ok": False, "error": "Report not found."}), 404

        download = str(request.args.get("download", "false")).strip().lower() in (
            "1",
            "true",
            "yes",
        )

        return send_file(
            report_path,
            mimetype="application/pdf",
            as_attachment=download,
            download_name=safe_name,
        )

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=5000, debug=True)
