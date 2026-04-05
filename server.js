require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.log('❌ DB Error:', err.message);
    } else {
        console.log('✅ Connected to Railway MySQL');
        
        // Ensure agency_details table exists
        const createTableSql = `
            CREATE TABLE IF NOT EXISTS agency_details (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                agency_name VARCHAR(255),
                owner_name VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(50)
            )
        `;
        db.query(createTableSql, (err) => {
            if (err) console.log("Agency Details Table Creation Error: ", err.message);
        });

        // Add user_email to report tables if they don't have it
        const addCol = (table) => {
            db.query(`ALTER TABLE ${table} ADD COLUMN user_email VARCHAR(255)`, (err) => {
                // Ignore error as it usually means column exists
            });
        };
        addCol('pm10_data');
        addCol('so2_data');
        addCol('no2_data');
        addCol('pm25_data');
    }
});

// TEST ROUTE
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'index.html'));
});

// REGISTER
app.post('/register', (req, res) => {
    const { email, password, role } = req.body;

    const sql = 'INSERT INTO users (email, password, role) VALUES (?, ?, ?)';

    db.query(sql, [email, password, role], (err) => {
        if (err) {
            console.log('Register Error:', err.message);
            return res.json({ error: 'User already exists or database error' });
        }

        res.json({ message: 'Registered successfully' });
    });
});

// LOGIN
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';

    db.query(sql, [email, password], (err, result) => {
        if (err) {
            console.log('Login Error:', err.message);
            return res.json({ error: 'Database error' });
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
                error: 'Invalid email or password'
            });
        }
    });
});

// CHECK AGENCY PROFILE
app.post('/check-agency-profile', (req, res) => {
    const { email } = req.body;
    db.query('SELECT * FROM agency_details WHERE user_email = ?', [email], (err, result) => {
        if (err) {
            return res.json({ error: err.message });
        }
        res.json({ exists: result.length > 0 });
    });
});

// CHECK INDUSTRY PROFILE
app.post('/check-industry-profile', (req, res) => {
    const { email } = req.body;
    db.query('SELECT id FROM industry_details WHERE user_email = ?', [email], (err, result) => {
        if (err) {
            return res.json({ error: err.message });
        }
        res.json({ exists: result.length > 0 });
    });
});

// SAVE AGENCY PROFILE
app.post('/save-agency-profile', (req, res) => {
    const data = req.body;
    
    if (!data.user_email || !data.agency_name || !data.owner_name || !data.email || !data.phone) {
        return res.json({ error: 'All fields are required.' });
    }

    const sql = `
        INSERT INTO agency_details (user_email, agency_name, owner_name, email, phone) 
        VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [
        data.user_email.trim(),
        data.agency_name.trim(),
        data.owner_name.trim(),
        data.email.trim(),
        data.phone.trim()
    ], (err) => {
        if (err) {
            console.log('Save Agency Error:', err.message);
            return res.json({ error: err.message });
        }
        res.json({ message: 'Profile saved successfully' });
    });
});

// SAVE INDUSTRY DETAILS
app.post('/save-industry', (req, res) => {
    const data = req.body;

    const missingFields = [];

    if (!data.user_email || !String(data.user_email).trim()) missingFields.push('User Login Email');
    if (!data.industry_name || !String(data.industry_name).trim()) missingFields.push('Industry Name');
    if (!data.industry_type || !String(data.industry_type).trim()) missingFields.push('Industry Type');
    if (!data.industry_id || !String(data.industry_id).trim()) missingFields.push('Industry ID / Registration Number');
    if (!data.address || !String(data.address).trim()) missingFields.push('Location / Address');
    if (!data.contact_name || !String(data.contact_name).trim()) missingFields.push('Contact Person Name');
    if (!data.role_designation || !String(data.role_designation).trim()) missingFields.push('Role / Designation');
    if (!data.email || !String(data.email).trim()) missingFields.push('Email ID');
    if (!data.phone || !String(data.phone).trim()) missingFields.push('Primary Phone Number');
    if (!data.monitoring_frequency || !String(data.monitoring_frequency).trim()) missingFields.push('AQI Monitoring Frequency');
    if (!data.notification_pref || !String(data.notification_pref).trim()) missingFields.push('Notification Preference');

    if (missingFields.length > 0) {
        return res.json({
            error: 'These required fields are missing: ' + missingFields.join(', ')
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
        data.alt_phone ? String(data.alt_phone).trim() : '',
        String(data.monitoring_frequency).trim(),
        String(data.notification_pref).trim()
    ], (err) => {
        if (err) {
            console.log('Save Industry Error:', err.message);
            return res.json({ error: err.message });
        }

        res.json({ message: 'Profile saved successfully' });
    });
});

// GET INDUSTRY NAMES
app.get('/get-industries', (req, res) => {
    const sql = 'SELECT industry_name FROM industry_details';

    db.query(sql, (err, result) => {
        if (err) {
            console.log('Get Industries Error:', err.message);
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
            user_email, industry_name, location, monitoring_date,
            q1_1, q2_1, avg_1, volume_1, w1_1, w2_1, dust_1, pm10_1,
            q1_2, q2_2, avg_2, volume_2, w1_2, w2_2, dust_2, pm10_2,
            q1_3, q2_3, avg_3, volume_3, w1_3, w2_3, dust_3, pm10_3,
            avg_pm10
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        data.user_email || '',
        data.industry_name,
        data.location,
        data.monitoring_date,
        q1_1, q2_1, avg_1, volume_1, w1_1, w2_1, dust_1, pm10_1,
        q1_2, q2_2, avg_2, volume_2, w1_2, w2_2, dust_2, pm10_2,
        q1_3, q2_3, avg_3, volume_3, w1_3, w2_3, dust_3, pm10_3,
        avg_pm10
    ], (err) => {
        if (err) {
            console.log('Save PM10 Error:', err.message);
            return res.json({ error: 'PM10 save failed' });
        }

        res.json({
            message: 'PM10 data saved successfully',
            pm10_1,
            pm10_2,
            pm10_3,
            avg_pm10
        });
    });
});

// SAVE SO2 DATA
app.post('/save-so2', (req, res) => {
    const data = req.body;
    db.query('INSERT INTO so2_data SET ?', data, (err) => {
        if (err) {
            console.log('Save SO2 Error:', err.message);
            return res.json({ error: err.message });
        }
        res.json({ message: 'SO2 data saved successfully' });
    });
});

// SAVE NO2 DATA
app.post('/save-no2', (req, res) => {
    const data = req.body;
    db.query('INSERT INTO no2_data SET ?', data, (err) => {
        if (err) {
            console.log('Save NO2 Error:', err.message);
            return res.json({ error: err.message });
        }
        res.json({ message: 'NO2 data saved successfully' });
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
            user_email, industry_name, location, monitoring_date,
            q1, q2, avg, volume,
            w1, w2, dust, pm25
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        data.user_email || '',
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
            console.log('Save PM2.5 Error:', err.message);
            return res.json({ error: 'PM2.5 save failed' });
        }

        res.json({
            message: 'PM2.5 data saved successfully',
            avg,
            volume,
            dust,
            pm25
        });
    });
});

// GET USER REPORTS
app.get('/api/reports', (req, res) => {
    const userEmail = req.query.user_email;
    if (!userEmail) return res.json({ error: 'user_email required' });

    let pending = 4;
    let allReports = [];
    let hasError = false;

    const checkDone = () => {
        pending--;
        if (pending === 0 && !hasError) {
            res.json(allReports);
        }
    };

    const handleError = (err) => {
        if (!hasError) {
            hasError = true;
            console.log('Get Reports Error:', err.message);
            res.status(500).json({ error: err.message });
        }
    };

    db.query("SELECT id, industry_name, monitoring_date as date, 'PM10 Report' as type FROM pm10_data WHERE user_email = ?", [userEmail], (err, results) => {
        if (err) return handleError(err);
        allReports = allReports.concat(results);
        checkDone();
    });
    db.query("SELECT id, industry_name, monitoring_date as date, 'SO2 Report' as type FROM so2_data WHERE user_email = ?", [userEmail], (err, results) => {
        if (err) return handleError(err);
        allReports = allReports.concat(results);
        checkDone();
    });
    db.query("SELECT id, industry_name, monitoring_date as date, 'NO2 Report' as type FROM no2_data WHERE user_email = ?", [userEmail], (err, results) => {
        if (err) return handleError(err);
        allReports = allReports.concat(results);
        checkDone();
    });
    db.query("SELECT id, industry_name, monitoring_date as date, 'PM2.5 Report' as type FROM pm25_data WHERE user_email = ?", [userEmail], (err, results) => {
        if (err) return handleError(err);
        allReports = allReports.concat(results);
        checkDone();
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
