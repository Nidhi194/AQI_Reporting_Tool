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
    window.location.href = "h.html";
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
    const url = `${API_BASE}/industry-reports?user_email=${encodeURIComponent(userEmail)}`;
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

async function loadReportsTable() {
    const userEmail = getUserEmail();
    if (!userEmail) return;

    let list = [];
    let usedDemo = false;

    try {
        list = await fetchIndustryReports(userEmail);
        cachedReports = list;
        renderReports(list, false);
        return;
    } catch (e) {
        console.warn(e);
        list = DEMO_REPORTS;
        usedDemo = true;
    }

    cachedReports = list;
    renderReports(list, usedDemo);
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

    const nameEl = document.getElementById("industryNameDisplay");
    if (nameEl) nameEl.textContent = email;

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
