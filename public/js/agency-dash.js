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
        actionMenu.addEventListener("click", (event) => {
            const menuButton = event.target.closest("button");
            if (!menuButton) return;
            
            if (menuButton.value === "generate_report") {
                window.location.href = "agency.html";
                return;
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
        const res = await fetch(`http://localhost:3000/api/reports?user_email=${encodeURIComponent(userEmail)}`);
        const reports = await res.json();
        
        if (reports.error) throw new Error(reports.error);

        // Sort reports by date descending
        reports.sort((a, b) => new Date(b.date) - new Date(a.date));

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
            const rptId = rpt.id || ('RPT-NEW-' + idx);
            const dateStr = formatDate(rpt.date);
            html += `
                <tr data-report-row data-report-id="${rptId}">
                    <td>${rpt.type}</td>
                    <td>Environmental</td>
                    <td>${rpt.industry_name || 'N/A'}</td>
                    <td><span class="status-badge status-completed"><i class="fa-solid fa-circle"></i>Completed</span></td>
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
        
        if(totalReportsElement) totalReportsElement.textContent = reports.length;
        if(activeReportsElement) activeReportsElement.textContent = reports.length; // Assume all active
        if(pendingReportsElement) pendingReportsElement.textContent = "0";
        if(overdueReportsElement) overdueReportsElement.textContent = "0";

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

    } catch (err) {
        console.error("Failed to load reports:", err);
    }
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
