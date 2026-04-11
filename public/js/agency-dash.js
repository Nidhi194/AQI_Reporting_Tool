const appLayout = document.getElementById("appLayout");
const sidebarPanel = document.getElementById("sidebarPanel");
const sidebarToggleButton = document.getElementById("btnSidebarToggle");
const logoutButton = document.getElementById("btnLogout");
const searchInput = document.getElementById("inputSearchReports");
const reportsTableBody = document.getElementById("tbodyReports");
const tableSummaryText = document.getElementById("textTableSummary");
const tableEmptyState = document.getElementById("tableEmptyState");
const actionMenu = document.getElementById("reportActionMenu");

const totalReportsElement = document.getElementById("statTotalReports");
const activeReportsElement = document.getElementById("statActiveReports");
const pendingReportsElement = document.getElementById("statPendingReports");
const overdueReportsElement = document.getElementById("statOverdueReports");

const generateButtons = [
    document.getElementById("btnGenerateReport"),
    document.getElementById("btnNewReport"),
    document.getElementById("btnMenuGenerateReport")
].filter(Boolean);

window.reportRows = Array.from(reportsTableBody.querySelectorAll("tr[data-report-row]"));
let rowActionButtons = Array.from(document.querySelectorAll(".btn-row-action"));
let selectedReportId = null;

function updateTableSummary(visibleRows, totalRows) {
    tableSummaryText.textContent = `Showing ${visibleRows} of ${totalRows} reports`;
    tableEmptyState.hidden = visibleRows !== 0;
}

function filterReportRows() {
    const query = (searchInput?.value || "").toLowerCase().trim();
    let visibleRows = 0;

    window.reportRows.forEach((row) => {
        const rowText = row.textContent.toLowerCase();
        const isVisible = rowText.includes(query);
        row.hidden = !isVisible;
        if (isVisible) {
            visibleRows += 1;
        }
    });

    updateTableSummary(visibleRows, window.reportRows.length);
}

function closeActionMenu() {
    actionMenu.hidden = true;
    selectedReportId = null;
    rowActionButtons.forEach((button) => {
        button.setAttribute("aria-expanded", "false");
    });
}

function openActionMenu(triggerButton) {
    const rect = triggerButton.getBoundingClientRect();
    selectedReportId = triggerButton.value;

    actionMenu.style.top = `${rect.bottom + 6}px`;
    actionMenu.style.left = `${Math.max(12, rect.right - actionMenu.offsetWidth)}px`;
    actionMenu.hidden = false;

    rowActionButtons.forEach((button) => {
        const isCurrent = button === triggerButton;
        button.setAttribute("aria-expanded", String(isCurrent));
    });
}

function bindRowActionMenu() {
    // Re-select all buttons each time to ensure dynamically added ones are hooked
    rowActionButtons = Array.from(document.querySelectorAll(".btn-row-action"));
    rowActionButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            const isExpanded = button.getAttribute("aria-expanded") === "true";

            if (isExpanded) {
                closeActionMenu();
                return;
            }

            openActionMenu(button);
        });
    });

    // We only want to add these document listeners ONCE.
    if (!window.hasBoundDocumentActions) {
        actionMenu.addEventListener("click", async (event) => {
            const menuButton = event.target.closest("button");
            if (!menuButton) return;
            
            const action = menuButton.value;
            
            if (action === "view" || action === "download") {
                try {
                    const res = await fetch(`http://localhost:3000/api/reports/summary/${selectedReportId}`);
                    if (!res.ok) throw new Error("Failed to fetch report summary");
                    const data = await res.json();
                    
                    if (data.error) throw new Error(data.error);

                    generatePDFFromData(data);
                } catch (err) {
                    console.error("View report error:", err);
                    alert("Error opening report. Ensure it exists in the database.");
                }
            } else if (action === "delete") {
                if (confirm("Are you sure you want to delete this report?")) {
                    try {
                        const res = await fetch(`http://localhost:3000/api/reports/${selectedReportId}`, {
                            method: 'DELETE'
                        });
                        
                        if (res.ok) {
                            alert("Report deleted successfully.");
                            loadLiveReports(); 
                        } else {
                            alert("Failed to delete report.");
                        }
                    } catch(err) {
                        console.error("Delete error:", err);
                        alert("Error deleting report.");
                    }
                }
            }
            
            closeActionMenu();
        });

        document.addEventListener("click", (event) => {
            const clickedActionButton = event.target.closest(".btn-row-action");
            const clickedActionMenu = event.target.closest("#reportActionMenu");

            if (!clickedActionButton && !clickedActionMenu) {
                closeActionMenu();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeActionMenu();
            }
        });

        window.addEventListener("resize", closeActionMenu);
        window.addEventListener("scroll", closeActionMenu, true);
        window.hasBoundDocumentActions = true;
    }
}

function bindSearchInput() {
    if (!searchInput) return;
    searchInput.addEventListener("input", filterReportRows);
}

function bindSidebarToggle() {
    if (!sidebarToggleButton) return;
    sidebarToggleButton.addEventListener("click", () => {
        appLayout.classList.toggle("sidebar-open");
        sidebarPanel.classList.toggle("is-open");
    });
}

function bindLogoutButton() {
    if (!logoutButton) return;
    logoutButton.addEventListener("click", () => {
        const shouldLogout = window.confirm("Are you sure you want to logout?");
        if (!shouldLogout) {
            return;
        }
        
        // Clear local storage for real logout
        localStorage.removeItem("userEmail");
        window.location.href = "h.html";
    });
}

function bindGenerateButtons() {
    generateButtons.forEach((button) => {
        button.addEventListener("click", () => {
            window.location.href = "agency.html";
        });
    });
}

function formatDate(dateValue) {
    if (!dateValue) return "N/A";
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) return dateValue;
    return parsedDate.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
}

async function loadLiveReports() {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
        window.location.href = "h.html";
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/agency-dashboard-data`);
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);

        const reports = data.reports || [];
        const summary = data.summary || {};

        reportsTableBody.innerHTML = ""; // Clear mock data

        if (reports.length === 0) {
            updateTableSummary(0, 0);
            if(totalReportsElement) totalReportsElement.textContent = "0";
            if(activeReportsElement) activeReportsElement.textContent = "0";
            if(pendingReportsElement) pendingReportsElement.textContent = "0";
            if(overdueReportsElement) overdueReportsElement.textContent = "0";
            
            const updateGaugeZero = (selector) => {
                const gaugeEl = document.querySelector(`.stat-card-radial.${selector} .radial-progress`);
                if (gaugeEl) {
                    gaugeEl.setAttribute('data-percentage', 0);
                    gaugeEl.style.strokeDashoffset = 125.6; // Full offset for 0%
                }
            };
            updateGaugeZero('gauge-total');
            updateGaugeZero('gauge-active');
            updateGaugeZero('gauge-pending');
            updateGaugeZero('gauge-overdue');
            
            return;
        }

        let html = '';
        reports.forEach((rpt, idx) => {
            const rptId = rpt.reportId || ('RPT-NEW-' + idx);
            const dateStr = formatDate(rpt.monitoringDate);
            const title = rpt.reportType || 'AQI Monitoring Report';
            const company = rpt.companyName || 'N/A';
            html += `
                <tr data-report-row data-report-id="${rptId}">
                    <td>${title}</td>
                    <td>Environmental</td>
                    <td>${company}</td>
                    <td><span class="status-badge status-completed"><i class="fa-solid fa-circle"></i>${rpt.status || 'Completed'}</span></td>
                    <td>${dateStr}</td>
                    <td class="sparkline-cell"><div class="sparkline-wrap"><canvas class="sparkline-canvas"></canvas></div></td>
                    <td class="actions-cell">
                        <button name="row_action" value="${rptId}" class="btn-row-action btn-action-pop" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Open row actions">
                            Manage <i class="fa-solid fa-caret-down"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        reportsTableBody.innerHTML = html;

        // Make sure row actions and filter variables know about the new rows
        const newRows = Array.from(reportsTableBody.querySelectorAll("tr[data-report-row]"));
        window.reportRows = newRows; 
        
        if(totalReportsElement) totalReportsElement.textContent = summary.totalReports || reports.length;
        if(activeReportsElement) activeReportsElement.textContent = summary.activeReports || reports.length;
        if(pendingReportsElement) pendingReportsElement.textContent = summary.pendingReports || "0";
        if(overdueReportsElement) overdueReportsElement.textContent = summary.overdueReports || "0";

        // Update radial gauges
        const updateGauge = (selector, count, total) => {
            const gaugeEl = document.querySelector(`.stat-card-radial.${selector} .radial-progress`);
            if (gaugeEl) {
                const percentage = total === 0 ? 0 : Math.round((count / total) * 100);
                gaugeEl.setAttribute('data-percentage', percentage);
                const PI2_R = 125.6; // 2 * PI * 20
                const offset = PI2_R - (percentage / 100) * PI2_R;
                gaugeEl.style.strokeDashoffset = offset;
            }
        };

        updateGauge('gauge-total', reports.length, Math.max(1, reports.length));
        updateGauge('gauge-active', reports.length, Math.max(1, reports.length));
        updateGauge('gauge-pending', 0, Math.max(1, reports.length));
        updateGauge('gauge-overdue', 0, Math.max(1, reports.length));

        updateTableSummary(reports.length, reports.length);
        bindRowActionMenu(); // rebind buttons

        // Initialize 7-day sparklines for newly injected rows
        if (typeof window.initSparklines === 'function') {
            setTimeout(() => window.initSparklines(), 100);
        }

    } catch (err) {
        console.error("Failed to load reports:", err);
    }
}

function generatePDFFromData(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Please allow popups to generate PDF reports.");
        return;
    }

    const baseUrl = window.location.origin + window.location.pathname.replace(/\/pages\/.*$/, '');
    const bgUrl = baseUrl + '/images/report-bg.jpg';

    const cssStyles = `
        <style>
            @page { size: A4; margin: 0; }
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { 
                font-family: 'Inter', sans-serif; 
                padding: 180px 60px 80px 60px; 
                color: #1e293b; 
                margin: 0; 
                line-height: 1.6; 
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                height: 100%;
                box-sizing: border-box;
            }
            .bg-image {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: -1;
            }
            .header { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #0f172a; font-size: 24px; }
            .header p { margin: 5px 0 0; color: #0f766e; font-size: 14px; }
            .section { margin-bottom: 20px; text-shadow: 0 0 1px rgba(255,255,255,0.8); }
            .section-title { font-size: 18px; color: #0f766e; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            table th, table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            table th { background-color: #f8fafc; font-weight: 600; color: #334155; }
            .overview-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .overview-item { padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
            .overview-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
            .overview-value { font-size: 16px; font-weight: 700; color: #0f172a; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; background-color: rgba(255, 255, 255, 0.6); backdrop-filter: blur(5px); }
        </style>
    `;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>AQI Comprehensive Report - ${data.industryName}</title>
            ${cssStyles}
        </head>
        <body>
            <img src="${bgUrl}" class="bg-image" alt="background">
            <div style="position: relative; z-index: 1;">
                <div class="header" style="background-color: rgba(255, 255, 255, 0.6); backdrop-filter: blur(5px); display: inline-block; padding: 10px 30px; border-radius: 8px;">
                    <h1>Comprehensive AQI Monitoring Report</h1>
                    <p style="margin-top:0px">Generated by EnviroMonitor Agency Panel</p>
                </div>

                <div class="overview-grid">
                    <div class="overview-item">
                        <div class="overview-label">Industry Name</div>
                        <div class="overview-value">${data.industryName}</div>
                    </div>
                    <div class="overview-item">
                        <div class="overview-label">Location / Site</div>
                        <div class="overview-value">${data.location}</div>
                    </div>
                    <div class="overview-item">
                        <div class="overview-label">Monitoring Date</div>
                        <div class="overview-value">${data.monitoringDate}</div>
                    </div>
                    <div class="overview-item">
                        <div class="overview-label">Report Validity</div>
                        <div class="overview-value">Verified & Finalized</div>
                    </div>
                </div>

                <div class="section">
                    <h2 class="section-title">Table of Contents</h2>
                    <ul>
                        <li>1. Industry Overview</li>
                        <li>2. PM10 Determination Results</li>
                        <li>3. SO₂ Determination Results</li>
                        <li>4. NO₂ Determination Results</li>
                        <li>5. PM2.5 Determination Results</li>
                    </ul>
                </div>

                <div class="section">
                    <h2 class="section-title">Summary of Environmental Parameters</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Parameter</th>
                                <th>Average Concentration (µg/m³)</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>PM10</td>
                                <td>${data.pm10Avg}</td>
                                <td>Recorded</td>
                            </tr>
                            <tr>
                                <td>Sulfur Dioxide (SO₂)</td>
                                <td>${data.so2Avg}</td>
                                <td>Recorded</td>
                            </tr>
                            <tr>
                                <td>Nitrogen Dioxide (NO₂)</td>
                                <td>${data.no2Avg}</td>
                                <td>Recorded</td>
                            </tr>
                            <tr>
                                <td>PM2.5</td>
                                <td>${data.pm25Val}</td>
                                <td>Recorded</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="footer">
                    <p>This is a certified digital report generated via the AQI Reporting Interface.</p>
                </div>
            </div>
            <script>
                window.onload = () => {
                    window.print();
                    setTimeout(() => window.close(), 500);
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
}

function initializeDashboard() {
    bindSearchInput();
    bindSidebarToggle();
    bindLogoutButton();
    bindGenerateButtons();
    bindRowActionMenu();
    loadLiveReports();
}

window.AgencyDashboard = {
    clearReports: () => {
        reportsTableBody.innerHTML = "";
        window.reportRows = [];
        updateTableSummary(0, 0);
    },
    loadLiveReports
};

initializeDashboard();
