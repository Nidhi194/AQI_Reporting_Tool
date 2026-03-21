const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Yash@2006',
    database: 'user_db'
});

db.connect((err) => {
    if (err) {
        console.log("DB Error:", err);
    } else {
        console.log("DB Connected");
    }
});

// Test Route
app.get('/', (req, res) => {
    res.send("Server is running");
});

// REGISTER
app.post('/register', (req, res) => {
    const { email, password, role } = req.body;

    const sql = "INSERT INTO users (email, password, role) VALUES (?, ?, ?)";

    db.query(sql, [email, password, role], (err) => {
        if (err) {
            console.log("Register Error:", err);
            return res.json({ error: "User already exists or database error" });
        }

        res.json({ message: "Registered successfully" });
    });
});

// LOGIN
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";

    db.query(sql, [email, password], (err, result) => {
        if (err) {
            console.log("Login Error:", err);
            return res.json({ error: "Database error" });
        }

        if (result.length > 0) {
            res.json({
                success: true,
                role: result[0].role,
                email: result[0].email
            });
        } else {
            res.json({
                success: false,
                error: "Invalid email or password"
            });
        }
    });
});

// SAVE INDUSTRY DETAILS
app.post('/save-industry', (req, res) => {
    const data = req.body;

    const missingFields = [];

    if (!data.user_email || !String(data.user_email).trim()) missingFields.push("User Login Email");
    if (!data.industry_name || !String(data.industry_name).trim()) missingFields.push("Industry Name");
    if (!data.industry_type || !String(data.industry_type).trim()) missingFields.push("Industry Type");
    if (!data.industry_id || !String(data.industry_id).trim()) missingFields.push("Industry ID / Registration Number");
    if (!data.address || !String(data.address).trim()) missingFields.push("Location / Address");
    if (!data.contact_name || !String(data.contact_name).trim()) missingFields.push("Contact Person Name");
    if (!data.role_designation || !String(data.role_designation).trim()) missingFields.push("Role / Designation");
    if (!data.email || !String(data.email).trim()) missingFields.push("Email ID");
    if (!data.phone || !String(data.phone).trim()) missingFields.push("Primary Phone Number");
    if (!data.monitoring_frequency || !String(data.monitoring_frequency).trim()) missingFields.push("AQI Monitoring Frequency");
    if (!data.notification_pref || !String(data.notification_pref).trim()) missingFields.push("Notification Preference");

    if (missingFields.length > 0) {
        return res.json({
            error: "These required fields are missing: " + missingFields.join(", ")
        });
    }

    const sql = `
        INSERT INTO industry_details
        (user_email, industry_name, industry_type, industry_id, address,
         contact_name, role_designation, email, phone, alt_phone,
         monitoring_frequency, notification_pref)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        String(data.user_email).trim(),
        String(data.industry_name).trim(),
        String(data.industry_type).trim(),
        String(data.industry_id).trim(),
        String(data.address).trim(),
        String(data.contact_name).trim(),
        String(data.role_designation).trim(),
        String(data.email).trim(),
        String(data.phone).trim(),
        data.alt_phone ? String(data.alt_phone).trim() : "",
        String(data.monitoring_frequency).trim(),
        String(data.notification_pref).trim()
    ], (err) => {
        if (err) {
            console.log("Save Industry Error:", err);
            return res.json({ error: "Database error" });
        }

        res.json({ message: "Profile saved successfully" });
    });
});

// GET INDUSTRY NAMES FOR AGENCY DROPDOWN
app.get('/get-industries', (req, res) => {
    const sql = "SELECT industry_name FROM industry_details";

    db.query(sql, (err, result) => {
        if (err) {
            console.log("Get Industries Error:", err);
            return res.json([]);
        }

        res.json(result);
    });
});

// SAVE PM10 DATA
app.post('/save-pm10', (req, res) => {
    const data = req.body;

    const T = 480;

    const q1_1 = parseFloat(data.q1_1) || 0;
    const q2_1 = parseFloat(data.q2_1) || 0;
    const w1_1 = parseFloat(data.w1_1) || 0;
    const w2_1 = parseFloat(data.w2_1) || 0;

    const q1_2 = parseFloat(data.q1_2) || 0;
    const q2_2 = parseFloat(data.q2_2) || 0;
    const w1_2 = parseFloat(data.w1_2) || 0;
    const w2_2 = parseFloat(data.w2_2) || 0;

    const q1_3 = parseFloat(data.q1_3) || 0;
    const q2_3 = parseFloat(data.q2_3) || 0;
    const w1_3 = parseFloat(data.w1_3) || 0;
    const w2_3 = parseFloat(data.w2_3) || 0;

    const avg_1 = (q1_1 + q2_1) / 2;
    const avg_2 = (q1_2 + q2_2) / 2;
    const avg_3 = (q1_3 + q2_3) / 2;

    const volume_1 = avg_1 * T;
    const volume_2 = avg_2 * T;
    const volume_3 = avg_3 * T;

    const dust_1 = w2_1 - w1_1;
    const dust_2 = w2_2 - w1_2;
    const dust_3 = w2_3 - w1_3;

    const pm10_1 = volume_1 !== 0 ? (dust_1 / volume_1) * Math.pow(10, 6) : 0;
    const pm10_2 = volume_2 !== 0 ? (dust_2 / volume_2) * Math.pow(10, 6) : 0;
    const pm10_3 = volume_3 !== 0 ? (dust_3 / volume_3) * Math.pow(10, 6) : 0;

    const avg_pm10 = (pm10_1 + pm10_2 + pm10_3) / 3;

    const sql = `
        INSERT INTO pm10_data (
            industry_name, location, monitoring_date,
            q1_1, q2_1, avg_1, volume_1, w1_1, w2_1, dust_1, pm10_1,
            q1_2, q2_2, avg_2, volume_2, w1_2, w2_2, dust_2, pm10_2,
            q1_3, q2_3, avg_3, volume_3, w1_3, w2_3, dust_3, pm10_3,
            avg_pm10
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        data.industry_name,
        data.location,
        data.monitoring_date,
        q1_1, q2_1, avg_1, volume_1, w1_1, w2_1, dust_1, pm10_1,
        q1_2, q2_2, avg_2, volume_2, w1_2, w2_2, dust_2, pm10_2,
        q1_3, q2_3, avg_3, volume_3, w1_3, w2_3, dust_3, pm10_3,
        avg_pm10
    ], (err) => {
        if (err) {
            console.log("Save PM10 Error:", err);
            return res.json({ error: "PM10 save failed" });
        }

        res.json({
            message: "PM10 data saved successfully",
            pm10_1: pm10_1,
            pm10_2: pm10_2,
            pm10_3: pm10_3,
            avg_pm10: avg_pm10
        });
    });
});

// SAVE SO2 DATA
app.post('/save-so2', (req, res) => {
    const data = req.body;

    const record = {
        industry_name: data.industry_name,
        location: data.location,
        monitoring_date: data.monitoring_date,

        duration_1: parseFloat(data.duration_1) || 0,
        es_1: parseFloat(data.es_1) || 0,
        cf_1: parseFloat(data.cf_1) || 0,
        a_1: parseFloat(data.a_1) || 0,
        q_1: parseFloat(data.q_1) || 0,
        va_1: parseFloat(data.va_1) || 0,
        vs_1: parseFloat(data.vs_1) || 0,
        vt_1: parseFloat(data.vt_1) || 0,
        so2_1: parseFloat(data.so2_1) || 0,

        duration_2: parseFloat(data.duration_2) || 0,
        es_2: parseFloat(data.es_2) || 0,
        cf_2: parseFloat(data.cf_2) || 0,
        a_2: parseFloat(data.a_2) || 0,
        q_2: parseFloat(data.q_2) || 0,
        va_2: parseFloat(data.va_2) || 0,
        vs_2: parseFloat(data.vs_2) || 0,
        vt_2: parseFloat(data.vt_2) || 0,
        so2_2: parseFloat(data.so2_2) || 0,

        duration_3: parseFloat(data.duration_3) || 0,
        es_3: parseFloat(data.es_3) || 0,
        cf_3: parseFloat(data.cf_3) || 0,
        a_3: parseFloat(data.a_3) || 0,
        q_3: parseFloat(data.q_3) || 0,
        va_3: parseFloat(data.va_3) || 0,
        vs_3: parseFloat(data.vs_3) || 0,
        vt_3: parseFloat(data.vt_3) || 0,
        so2_3: parseFloat(data.so2_3) || 0,

        duration_4: parseFloat(data.duration_4) || 0,
        es_4: parseFloat(data.es_4) || 0,
        cf_4: parseFloat(data.cf_4) || 0,
        a_4: parseFloat(data.a_4) || 0,
        q_4: parseFloat(data.q_4) || 0,
        va_4: parseFloat(data.va_4) || 0,
        vs_4: parseFloat(data.vs_4) || 0,
        vt_4: parseFloat(data.vt_4) || 0,
        so2_4: parseFloat(data.so2_4) || 0,

        duration_5: parseFloat(data.duration_5) || 0,
        es_5: parseFloat(data.es_5) || 0,
        cf_5: parseFloat(data.cf_5) || 0,
        a_5: parseFloat(data.a_5) || 0,
        q_5: parseFloat(data.q_5) || 0,
        va_5: parseFloat(data.va_5) || 0,
        vs_5: parseFloat(data.vs_5) || 0,
        vt_5: parseFloat(data.vt_5) || 0,
        so2_5: parseFloat(data.so2_5) || 0,

        duration_6: parseFloat(data.duration_6) || 0,
        es_6: parseFloat(data.es_6) || 0,
        cf_6: parseFloat(data.cf_6) || 0,
        a_6: parseFloat(data.a_6) || 0,
        q_6: parseFloat(data.q_6) || 0,
        va_6: parseFloat(data.va_6) || 0,
        vs_6: parseFloat(data.vs_6) || 0,
        vt_6: parseFloat(data.vt_6) || 0,
        so2_6: parseFloat(data.so2_6) || 0,

        avg_so2: parseFloat(data.avg_so2) || 0
    };

    db.query("INSERT INTO so2_data SET ?", record, (err) => {
        if (err) {
            console.log("Save SO2 Error:", err);
            return res.json({ error: err.message });
        }

        res.json({ message: "SO2 data saved successfully" });
    });
});

// SAVE NO2 DATA
app.post('/save-no2', (req, res) => {
    const data = req.body;

    const record = {
        industry_name: data.industry_name,
        location: data.location,
        monitoring_date: data.monitoring_date,

        duration_1: parseFloat(data.duration_1) || 0,
        as_1: parseFloat(data.as_1) || 0,
        cf_1: parseFloat(data.cf_1) || 0,
        x_1: parseFloat(data.x_1) || 0,
        q_1: parseFloat(data.q_1) || 0,
        va_1: parseFloat(data.va_1) || 0,
        vs_1: parseFloat(data.vs_1) || 0,
        vt_1: parseFloat(data.vt_1) || 0,
        no2_1: parseFloat(data.no2_1) || 0,

        duration_2: parseFloat(data.duration_2) || 0,
        as_2: parseFloat(data.as_2) || 0,
        cf_2: parseFloat(data.cf_2) || 0,
        x_2: parseFloat(data.x_2) || 0,
        q_2: parseFloat(data.q_2) || 0,
        va_2: parseFloat(data.va_2) || 0,
        vs_2: parseFloat(data.vs_2) || 0,
        vt_2: parseFloat(data.vt_2) || 0,
        no2_2: parseFloat(data.no2_2) || 0,

        duration_3: parseFloat(data.duration_3) || 0,
        as_3: parseFloat(data.as_3) || 0,
        cf_3: parseFloat(data.cf_3) || 0,
        x_3: parseFloat(data.x_3) || 0,
        q_3: parseFloat(data.q_3) || 0,
        va_3: parseFloat(data.va_3) || 0,
        vs_3: parseFloat(data.vs_3) || 0,
        vt_3: parseFloat(data.vt_3) || 0,
        no2_3: parseFloat(data.no2_3) || 0,

        duration_4: parseFloat(data.duration_4) || 0,
        as_4: parseFloat(data.as_4) || 0,
        cf_4: parseFloat(data.cf_4) || 0,
        x_4: parseFloat(data.x_4) || 0,
        q_4: parseFloat(data.q_4) || 0,
        va_4: parseFloat(data.va_4) || 0,
        vs_4: parseFloat(data.vs_4) || 0,
        vt_4: parseFloat(data.vt_4) || 0,
        no2_4: parseFloat(data.no2_4) || 0,

        duration_5: parseFloat(data.duration_5) || 0,
        as_5: parseFloat(data.as_5) || 0,
        cf_5: parseFloat(data.cf_5) || 0,
        x_5: parseFloat(data.x_5) || 0,
        q_5: parseFloat(data.q_5) || 0,
        va_5: parseFloat(data.va_5) || 0,
        vs_5: parseFloat(data.vs_5) || 0,
        vt_5: parseFloat(data.vt_5) || 0,
        no2_5: parseFloat(data.no2_5) || 0,

        duration_6: parseFloat(data.duration_6) || 0,
        as_6: parseFloat(data.as_6) || 0,
        cf_6: parseFloat(data.cf_6) || 0,
        x_6: parseFloat(data.x_6) || 0,
        q_6: parseFloat(data.q_6) || 0,
        va_6: parseFloat(data.va_6) || 0,
        vs_6: parseFloat(data.vs_6) || 0,
        vt_6: parseFloat(data.vt_6) || 0,
        no2_6: parseFloat(data.no2_6) || 0,

        avg_no2: parseFloat(data.avg_no2) || 0
    };

    db.query("INSERT INTO no2_data SET ?", record, (err) => {
        if (err) {
            console.log("Save NO2 Error:", err);
            return res.json({ error: err.message });
        }

        res.json({ message: "NO2 data saved successfully" });
    });
});

// SAVE PM2.5 DATA
app.post('/save-pm25', (req, res) => {
    const data = req.body;

    const q1 = parseFloat(data.q1) || 0;
    const q2 = parseFloat(data.q2) || 0;
    const w1 = parseFloat(data.w1) || 0;
    const w2 = parseFloat(data.w2) || 0;

    const T = 1440;

    const avg = (q1 + q2) / 2;
    const volume = avg * T;
    const dust = w2 - w1;
    const pm25 = volume !== 0 ? (dust * Math.pow(10, 6)) / volume : 0;

    const sql = `
        INSERT INTO pm25_data (
            industry_name, location, monitoring_date,
            q1, q2, avg, volume,
            w1, w2, dust, pm25
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        data.industry_name,
        data.location,
        data.monitoring_date,
        q1,
        q2,
        avg,
        volume,
        w1,
        w2,
        dust,
        pm25
    ], (err) => {
        if (err) {
            console.log("Save PM2.5 Error:", err);
            return res.json({ error: "PM2.5 save failed" });
        }

        res.json({
            message: "PM2.5 data saved successfully",
            avg: avg,
            volume: volume,
            dust: dust,
            pm25: pm25
        });
    });
});

// START SERVER
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});