<div align="center">

# 🌿 ENVIROMONITOR 🌫️  
### **Smart Environmental Monitoring & Compliance Platform**

<p>
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Backend-Node.js-green?style=for-the-badge&logo=nodedotjs"/>
  <img src="https://img.shields.io/badge/Database-SQLite-lightgrey?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge"/>
</p>

<p>
A scalable, full-stack platform designed to digitize environmental monitoring, compliance tracking, and AQI-based reporting for industries and regulatory agencies.
</p>

</div>

---

## 🌍 Overview

Environmental compliance today is **fragmented, manual, and inefficient**.

**EnviroMonitor** solves this by creating a **centralized digital ecosystem** where:

- 🏭 Industries submit environmental data  
- 🧪 Monitoring agencies validate and enforce compliance  
- ⚙️ Systems automatically compute AQI and generate reports  

---

## 💡 Problem

- ❌ Manual and inconsistent data entry  
- ❌ Lack of centralized compliance systems  
- ❌ No real-time validation  
- ❌ Difficult auditing and reporting  

---

## ✨ Solution

EnviroMonitor provides:

- 📊 Centralized dashboards  
- 🧪 Structured AQI data entry  
- ⏱️ Time-based validation system  
- 📄 Automated report generation  
- ⚖️ Compliance monitoring system  

---

## 🔥 Key Features

### 🔐 Role-Based Authentication
- Secure login/signup  
- Role-based routing:
  - 🏭 Industry  
  - 🧪 Monitoring Agency  

---

### 📊 AQI Calculation Engine
- Computes AQI from pollutant inputs  
- Classifies pollution levels (Good → Severe)  
- Detects dominant pollutant  

---

### ⚖️ Compliance Monitoring
- Validates data against limits  
- Flags:
  - ✅ Within limits  
  - ❌ Exceeds limits  

---

### 🧪 Monitoring Agency Dashboard
- Select industry & monitoring date  
- Analyze pollution data  
- Validate compliance  
- Generate reports  

---

### 🏭 Industry Dashboard
- Submit environmental readings  
- Track compliance status  
- Receive system feedback  

---

### 📄 Report Management
- Auto-generated reports  
- Stored for auditing & export  

---

## 🧠 System Architecture

EnviroMonitor follows a **multi-layered architecture**:

- 🎨 **Frontend** → UI & user interaction  
- ⚙️ **Backend (Flask + Node)** → APIs & logic  
- 🗄️ **Database (SQLite)** → persistent storage  
- 📄 **Reports Layer** → generated outputs  

---

## 🛠️ Tech Stack

### 🎨 Frontend
- HTML5  
- CSS3  
- JavaScript (ES6)  

### ⚙️ Backend
- Python (Flask)  
- Node.js  

### 🗄️ Database
- SQLite (`enviro.db`)  

### 🔐 Security
- Backend-based authentication  
- Role-based access control  

---

## 🗂️ Project Structure

```plaintext
/enviro-monitor
│
├── reports/                 # Generated reports
├── venv/                    # Python environment
│
├── app.py                   # Flask backend
├── server.js                # Node services
├── enviro.db                # Database
│
├── login.html
├── signup.html
├── agency-dashboard.html
├── industry-dashboard.html
├── agency.html
├── industry.html
├── index.html
│
├── script.js                # Frontend logic
├── style.css                # Styling
│
├── requirements.txt
├── package.json
├── LICENSE
└── README.md
## ▶️ Getting Started

### 📌 Prerequisites
- Node.js  
- Python  
- npm / pip  

---

### ⚙️ Setup

```bash
git clone https://github.com/your-username/enviro-monitor.git
cd enviro-monitor
🔹 Backend (Flask)
pip install -r requirements.txt
python app.py
🔹 Node Server (Optional)
npm install
node server.js
🔹 Frontend
Open login.html
OR use Live Server
🔄 Workflow
User registers & logs in
Role-based dashboard access
Industry submits data
Agency validates data
AQI calculated instantly
Reports generated & stored
🔐 Security Features
Backend authentication
Server-side validation
Role-based access control
No localStorage-based credential storage
📊 Use Cases
Environmental compliance tracking
Industrial pollution monitoring
Regulatory audits
Data-driven environmental analysis
🚧 Future Enhancements
📊 Advanced analytics dashboard
📄 PDF/Excel exports
☁️ Cloud deployment
📱 Mobile responsiveness
🔔 Alerts & notifications
💧 Water quality module
📸 Screenshots

(Add dashboard, login, and report visuals here)

🤝 Contributors
Nidhi Vinod Nikam
Yash Patil
Vedant Sawant
📄 License

Licensed under the MIT License.

<div align="center">

💚 Built with purpose, not just code.

</div> ```
