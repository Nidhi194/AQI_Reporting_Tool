<div align="center">

# 🌿 ENVIROMONITOR 🌫️
### **Smart Environmental Monitoring & Compliance Platform**

<p>
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Backend-Node.js-green?style=for-the-badge&logo=nodedotjs"/>
  <img src="https://img.shields.io/badge/Database-MySQL-lightgrey?style=for-the-badge"/>
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
- Role-based routing: Industry and Monitoring Agency

### 📊 AQI Calculation Engine

- Computes AQI from pollutant inputs
- Classifies pollution levels (Good to Severe)
- Detects dominant pollutant

### ⚖️ Compliance Monitoring

- Validates data against limits
- Flags values as within limits or exceeding limits

### 🧪 Monitoring Agency Dashboard

- Select industry and monitoring date
- Analyze pollution data
- Validate compliance
- Generate reports

### 🏭 Industry Dashboard

- Submit environmental readings
- Track compliance status
- Receive system feedback

### 📄 Report Management

- Auto-generated reports
- Stored for auditing and export

---

## 🧠 System Architecture

EnviroMonitor follows a **multi-layered architecture**:

- 🎨 **Frontend**: UI and user interaction
- ⚙️ **Backend (Node.js + Express)**: APIs and business logic
- 🗄️ **Database (MySQL)**: Persistent storage
- 📄 **Reports Layer**: Generated outputs

---

## 🛠️ Tech Stack

### 🎨 Frontend

- HTML5
- CSS3
- JavaScript (ES6)

### ⚙️ Backend

- Node.js
- Express.js

### 🗄️ Database

- MySQL (`mysql2`)

### 🔐 Security

- Backend-based authentication
- Role-based access control

---

## 🗂️ Project Structure

```plaintext
/AQI_Reporting_Tool
│
├── public/
│   ├── css/
│   │   ├── agency-dash.css
│   │   ├── agency-features.css
│   │   ├── app.css
│   │   ├── glass-theme.css
│   │   ├── industry-features.css
│   │   ├── industry-reports.css
│   │   └── landing.css
│   ├── images/
│   ├── js/
│   │   ├── agency-dash.js
│   │   ├── agency-features.js
│   │   ├── app.js
│   │   ├── aqi-chart.js
│   │   ├── industry-features.js
│   │   └── industry-reports.js
│   └── pages/
│       ├── agency-dash.html
│       ├── agency-info.html
│       ├── agency.html
│       ├── h.html
│       ├── index.html
│       ├── industry-reports.html
│       └── industry.html
├── check.js
├── remove_bg.py
├── server.js
├── package.json
├── package-lock.json
├── requirements.txt
├── LICENSE
└── README.md
```

---

## ▶️ Getting Started

### 📌 Prerequisites

- Node.js
- npm

### ⚙️ Setup

```bash
git clone https://github.com/your-username/enviro-monitor.git
cd enviro-monitor
npm install
node server.js
```

### 🔹 Frontend

- Open `public/pages/index.html`
- Or use VS Code Live Server

---

## 🔄 Workflow

1. User registers and logs in
2. Role-based dashboard access
3. Industry submits data
4. Agency validates data
5. AQI is calculated instantly
6. Reports are generated and stored

---

## 🔐 Security Features

- Backend authentication
- Server-side validation
- Role-based access control
- No localStorage-based credential storage

---

## 📊 Use Cases

- Environmental compliance tracking
- Industrial pollution monitoring
- Regulatory audits
- Data-driven environmental analysis

---

## 🚧 Future Enhancements

- 📊 Advanced analytics dashboard
- 📄 PDF/Excel exports
- ☁️ Cloud deployment
- 📱 Mobile responsiveness
- 🔔 Alerts and notifications
- 💧 Water quality module

---

## 📸 Screenshots

Add dashboard, login, and report visuals here.

---

## 🤝 Contributors

- [Nidhi Vinod Nikam](https://github.com/Nidhi194)
- [Vedant Sawant](https://github.com/vedantsawant2803-cloud)
- [Yash Patil](https://github.com/YashPatil2307)

---

## 📄 License

Licensed under the MIT License.

<div align="center">

**💚 Built with purpose, not just code.**

</div>
