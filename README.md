# 🚀 EnviroMonitor System

A scalable, full-stack environmental monitoring and compliance platform designed to digitize how industries and regulatory agencies track, analyze, and report environmental data.

## 🌍 Vision

Environmental compliance is often fragmented, manual, and inefficient.

EnviroMonitor aims to solve this by providing a centralized, digital ecosystem where:

- Industries can submit and manage environmental data
- Monitoring agencies can verify, analyze, and enforce compliance
- Systems can automatically calculate AQI and generate reports

## ✨ Key Highlights

- 🔐 **Secure role-based authentication**
- 📊 **Real-time Air Quality Index (AQI) calculation**
- ⚖️ **Automatic compliance validation**
- 🧪 **Dedicated dashboards for agencies & industries**
- 📄 **Integrated report generation system**
- 🗄️ **Persistent database storage**
- 🔁 **Dynamic unit conversion (µg/m³ ↔ mg/m³)**

## 🧠 System Architecture

EnviroMonitor follows a multi-layered architecture:

- 🎨 **Frontend** → UI & user interaction
- ⚙️ **Backend (Flask + Node)** → APIs, business logic
- 🗄️ **Database (SQLite)** → Persistent storage
- 📄 **Reports Layer** → Generated outputs

## 🧰 Tech Stack

### 🎨 Frontend
- HTML5
- CSS3
- JavaScript (ES6)

### ⚙️ Backend
- Python (Flask) – Core API & logic
- Node.js – Supporting services / extensions

### 🗄️ Database
- SQLite (`enviro.db`)

### 🔐 Authentication
- Backend-based validation (secure, no localStorage)

## 📁 Project Structure

```text
/enviro-monitor
│
├── reports/                 # Generated reports storage
├── venv/                    # Python virtual environment
│
├── app.py                   # Flask backend (main logic)
├── server.js                # Node backend (auxiliary services)
├── enviro.db                # SQLite database
│
├── login.html
├── signup.html
├── agency-dashboard.html
├── industry-dashboard.html
├── agency.html
├── industry.html
├── index.html
│
├── script.js                # Frontend logic (AQI, validation)
├── style.css                # UI styling
│
├── requirements.txt         # Python dependencies
├── package.json             # Node dependencies
├── LICENSE
└── README.md
```

## ⚙️ Core Functionalities

### 🔐 Authentication & Authorization
- Secure signup/login system
- Role-based routing:
  - 🏭 **Industry**
  - 🧪 **Monitoring Agency**

### 📊 AQI Calculation Engine
- Accepts pollutant inputs (PM2.5, PM10, etc.)
- Performs:
  - AQI computation
  - Category classification (Good → Severe)
  - Dominant pollutant detection

### ⚖️ Compliance Monitoring
- Validates data against permissible limits
- Flags:
  - ✅ Within limit
  - ❌ Exceeds limit

### 🧪 Monitoring Agency Dashboard
- Select industry & monitoring date
- Analyze pollution data
- Validate compliance
- Generate reports

### 🏭 Industry Dashboard
- Submit environmental readings
- Track compliance status
- View system feedback

### 📄 Report Generation System
- Reports stored in `/reports`
- Designed for export & audit workflows

## ▶️ Installation & Setup

**1️⃣ Clone the Repository**
```bash
git clone https://github.com/your-username/enviro-monitor.git
cd enviro-monitor
```

**2️⃣ Setup Python Backend**
```bash
pip install -r requirements.txt
python app.py
```

**3️⃣ (Optional) Start Node Server**
```bash
npm install
node server.js
```

**4️⃣ Run Frontend**
- Open `login.html` in browser
- **OR** Use VS Code Live Server

## 🔄 Application Workflow

1. User registers and logs in
2. Role-based dashboard access
3. Industry submits pollution data
4. Agency reviews and validates
5. System calculates AQI instantly
6. Reports generated and stored

## 🔐 Security Features

- Backend authentication system
- Server-side validation
- Role-based access control
- No reliance on localStorage for credentials

## 📊 Use Cases

- Environmental compliance tracking
- Industrial pollution monitoring
- Government/regulatory audits
- Data-driven environmental analysis

## 🚧 Future Enhancements

- 📊 Advanced analytics dashboards (charts & trends)
- 📄 PDF/Excel report export
- ☁️ Cloud deployment (AWS/Azure)
- 📱 Mobile responsiveness
- 🔔 Notification & alert system
- 💧 Water quality monitoring module

## 📸 Screenshots
*(Add Yours Here)*

## 🤝 Contributors

- [NIDHI VINOD NIKAM](https://github.com/Nidhi194)
- [YASH PATIL](https://github.com/YashPatil2307)
- [VEDANT SAWANT](https://github.com/vedantsawant2803-cloud)

## 📜 License

This project is licensed under the MIT License.

## 💡 Final Thought

EnviroMonitor is more than a project — it’s a real-world solution prototype for environmental governance, combining technology, compliance, and data intelligence into one platform.