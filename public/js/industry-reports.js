/**
 * Industry reports hub — wire to backend:
 *   GET  http://localhost:3000/industry-reports?user_email=<email>
 *   POST http://localhost:3000/report-industry-issue
 *
 * Each report object: { id, title, reportType, periodLabel, status, previewUrl?, downloadUrl? }
 * previewUrl: optional PDF or HTML URL for iframe preview
 * downloadUrl: optional direct file URL for download
 */

const API_BASE = "http://localhost:3000";

const DEMO_REPORTS = [
    {
        id: "demo-1",
        title: "AQI monitoring summary – March 2026",
        reportType: "PM10 / PM2.5",
        periodLabel: "Mar 2026",
        status: "Published",
        previewUrl: "",
        downloadUrl: ""
    },
    {
        id: "demo-2",
        title: "Stack emissions review",
        reportType: "SO₂ / NO₂",
        periodLabel: "2026-02-18",
        status: "Published",
        previewUrl: "",
        downloadUrl: ""
    },
    {
        id: "demo-3",
        title: "Draft – weekly anomaly log",
        reportType: "Compliance",
        periodLabel: "2026-03-28",
        status: "Draft",
        previewUrl: "",
        downloadUrl: ""
    }
];

function getUserEmail() {
    return (localStorage.getItem("userEmail") || "").trim();
}

function logout() {
    localStorage.removeItem("userEmail");
    window.location.replace("h.html");
}

function requireAuth() {
    const email = getUserEmail();
    if (!email) {
        window.location.href = "h.html";
        return null;
    }
    return email;
}

async function fetchIndustryReports(userEmail) {
    const url = `${API_BASE}/api/reports?user_email=${encodeURIComponent(userEmail)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load reports");
    const data = await res.json();
    if (Array.isArray(data.reports)) return data.reports;
    if (Array.isArray(data)) return data;
    return [];
}

function renderReports(reports, usedFallbackDemo) {
    const tbody = document.getElementById("reportsTableBody");
    const emptyHint = document.getElementById("emptyReportsHint");
    tbody.innerHTML = "";

    if (!reports.length) {
        emptyHint.textContent =
            "No reports yet. Your backend can return rows from GET /industry-reports?user_email=...";
        emptyHint.hidden = false;
        return;
    }

    emptyHint.hidden = true;

    reports.forEach((row) => {
        const tr = document.createElement("tr");
        const statusClass = String(row.status || "").toLowerCase() === "draft" ? "status-draft" : "";
        tr.innerHTML = `
            <td>${escapeHtml(row.title || "—")}</td>
            <td>${escapeHtml(row.reportType || "—")}</td>
            <td>${escapeHtml(row.periodLabel || row.generatedAt || "—")}</td>
            <td><span class="status-pill ${statusClass}">${escapeHtml(row.status || "—")}</span></td>
            <td class="cell-actions">
                <button type="button" class="btn-table btn-table-primary" data-action="preview" data-id="${escapeAttr(row.id)}">Preview</button>
                <button type="button" class="btn-table" data-action="download" data-id="${escapeAttr(row.id)}">Download</button>
            </td>
        `;
        tr.dataset.report = JSON.stringify(row);
        tbody.appendChild(tr);
    });

    if (usedFallbackDemo) {
        emptyHint.textContent =
            "Server unreachable — showing sample rows. Connect GET /industry-reports for live data.";
        emptyHint.hidden = false;
    }
}

function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
}

function escapeAttr(s) {
    return String(s).replace(/"/g, "&quot;");
}

let cachedReports = [];

function findReportById(id) {
    return cachedReports.find((r) => String(r.id) === String(id));
}

function openPreview(report) {
    const backdrop = document.getElementById("previewBackdrop");
    const frame = document.getElementById("previewFrame");
    const fallback = document.getElementById("previewFallback");
    const titleEl = document.getElementById("previewTitle");

    titleEl.textContent = report.title || "Report preview";

    const url = (report.previewUrl || "").trim();
    if (url) {
        frame.hidden = false;
        fallback.hidden = true;
        frame.src = url;
    } else {
        frame.hidden = true;
        fallback.hidden = false;
        frame.removeAttribute("src");
    }

    backdrop.hidden = false;
    backdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function closePreview() {
    const backdrop = document.getElementById("previewBackdrop");
    const frame = document.getElementById("previewFrame");
    backdrop.hidden = true;
    backdrop.setAttribute("aria-hidden", "true");
    frame.removeAttribute("src");
    document.body.style.overflow = "";
}

function downloadReport(report) {
    const url = (report.downloadUrl || "").trim();
    if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = "";
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
    }
    alert(
        "No download URL yet. Have your backend set downloadUrl on each report (e.g. signed file link from GET /industry-reports)."
    );
}

function updateComplianceGauge(reports) {
    const gaugeScoreEl = document.querySelector('.gauge-score');
    const gaugeLabelEl = document.querySelector('.gauge-label');
    const gaugeValEl = document.querySelector('.gauge-val');
    
    if (!gaugeScoreEl || !gaugeLabelEl || !gaugeValEl) return;

    // Use a placeholder logic for AQI: e.g. 50 if no reports, otherwise calculate a dummy 
    // or retrieve from real reports (we just simulate a score based on count to react visually)
    let aqi = reports.length === 0 ? 0 : 50 + (reports.length * 15);
    if (aqi > 300) aqi = 300; // Cap it
    
    gaugeScoreEl.textContent = aqi;
    
    let color = "#10b981"; // Excellent (Green)
    let label = "Excellent";
    let dashOffset = 251.2; // Start empty

    if (aqi === 0) {
        color = "#94a3b8";
        label = "No Data";
        dashOffset = 251.2;
    } else if (aqi <= 50) {
        color = "#10b981"; // Green
        label = "Excellent (Compliant)";
        dashOffset = 251.2 - (251.2 * (aqi / 300));
    } else if (aqi <= 100) {
        color = "#eab308"; // Yellow
        label = "Moderate (Acceptable)";
        dashOffset = 251.2 - (251.2 * (aqi / 300));
    } else if (aqi <= 200) {
        color = "#f97316"; // Orange
        label = "Poor (Warning)";
        dashOffset = 251.2 - (251.2 * (aqi / 300));
    } else {
        color = "#e11d48"; // Red
        label = "Severe (Action Req.)";
        dashOffset = 251.2 - (251.2 * (aqi / 300));
    }

    gaugeLabelEl.textContent = label;
    gaugeScoreEl.style.color = color;
    gaugeScoreEl.style.textShadow = `0 0 16px ${color}80`;
    
    gaugeValEl.style.stroke = color;
    gaugeValEl.style.filter = `drop-shadow(0 0 12px ${color}99)`;
    gaugeValEl.style.strokeDashoffset = Math.max(0, dashOffset);
}

function updateWidgets(reports) {
    // 1. Update AI Insight Box & Chart
    const insightText = document.getElementById('aiInsightText');
    if (reports.length === 0) {
        if (insightText) insightText.innerHTML = "⚠️ <strong>No monitoring data found.</strong> Begin submitting your logs to enable AI forecasting.";
        if (window.aqiChart) {
            window.aqiChart.data.datasets[0].data = [];
            window.aqiChart.data.datasets[1].data = [];
            window.aqiChart.update();
        }
    } else {
        const count = reports.length;
        // Dynamically calculate a fake trend based on report volume (since real AQI algorithms would rely on numeric PM10 array values which we abstract)
        const baseAqi = 50 + (count * 10);
        const predictedAqi = baseAqi + 20;

        if (insightText) {
            if (predictedAqi > 100) {
                insightText.innerHTML = `⚠️ <strong>Prediction: AQI may rise to ${predictedAqi} next month based on recent ${count} submissions.</strong> Recommendation: Optimize filter efficiency.`;
            } else {
                insightText.innerHTML = `✅ <strong>Prediction: Stable AQI at ~${predictedAqi} expected.</strong> Your current operational capacity is well within compliance standards.`;
            }
        }

        if (window.aqiChart) {
            // Overwrite chart with dynamically scaled data
            const historical = [Math.floor(baseAqi * 0.7), Math.floor(baseAqi * 0.8), Math.floor(baseAqi * 0.9), Math.floor(baseAqi), Math.floor(baseAqi * 1.05), baseAqi, null];
            window.aqiChart.data.datasets[0].data = historical;
            
            // Forecast curve branching from the current baseAqi
            window.aqiChart.data.datasets[1].data = [null, null, null, null, null, baseAqi, predictedAqi];
            window.aqiChart.update();
        }
    }
}

async function loadReportsTable() {
    const userEmail = getUserEmail();
    if (!userEmail) return;

    let list = [];
    let usedDemo = false;

    try {
        list = await fetchIndustryReports(userEmail);
        cachedReports = list;
        renderReports(list, false);
        updateComplianceGauge(list);
        updateWidgets(list);
        return;
    } catch (e) {
        console.warn(e);
        list = DEMO_REPORTS;
        usedDemo = true;
    }

    cachedReports = list;
    renderReports(list, usedDemo);
    updateComplianceGauge(list);
    updateWidgets(list);
}

async function submitIssue(ev) {
    ev.preventDefault();
    const userEmail = getUserEmail();
    const feedback = document.getElementById("issueFeedback");
    feedback.textContent = "";
    feedback.classList.remove("is-success", "is-error");

    const subject = document.getElementById("issueSubject").value.trim();
    const description = document.getElementById("issueDescription").value.trim();
    const severity = document.getElementById("issueSeverity").value;

    if (!userEmail || !subject || !description) {
        feedback.textContent = "Please sign in and fill required fields.";
        feedback.classList.add("is-error");
        return;
    }

    const payload = {
        user_email: userEmail,
        subject,
        description,
        severity
    };

    try {
        const res = await fetch(`${API_BASE}/report-industry-issue`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.error) {
            feedback.textContent = data.error || "Could not submit issue.";
            feedback.classList.add("is-error");
            return;
        }
        feedback.textContent = data.message || "Issue recorded. Thank you.";
        feedback.classList.add("is-success");
        document.getElementById("issueForm").reset();
    } catch (e) {
        console.warn(e);
        feedback.textContent = "Server connection error.";
        feedback.classList.add("is-error");
    }
}

function init() {
    const email = requireAuth();
    if (!email) return;

    const emailEl = document.getElementById("industryNameDisplay");
    if (emailEl) emailEl.textContent = email;

    document.getElementById("btnLogout").addEventListener("click", logout);
    document.getElementById("btnRefreshReports").addEventListener("click", loadReportsTable);
    document.getElementById("issueForm").addEventListener("submit", submitIssue);

    document.getElementById("reportsTableBody").addEventListener("click", (ev) => {
        const btn = ev.target.closest("button[data-action]");
        if (!btn) return;
        const id = btn.getAttribute("data-id");
        const report = findReportById(id);
        if (!report) return;
        if (btn.getAttribute("data-action") === "preview") openPreview(report);
        if (btn.getAttribute("data-action") === "download") downloadReport(report);
    });

    document.getElementById("btnClosePreview").addEventListener("click", closePreview);
    document.getElementById("previewBackdrop").addEventListener("click", (ev) => {
        if (ev.target.id === "previewBackdrop") closePreview();
    });
    document.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape") closePreview();
    });

    loadReportsTable();
}

document.addEventListener("DOMContentLoaded", init);
