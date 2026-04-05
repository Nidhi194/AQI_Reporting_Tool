const BASE_URL = window.location.origin;

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

let reportRows = [];
let rowActionButtons = [];
let selectedReportId = null;
let allReports = [];

function formatDate(dateValue) {
    if (!dateValue) return "-";

    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) {
        return dateValue;
    }

    return parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}

function updateTableSummary(visibleRows, totalRows) {
    tableSummaryText.textContent = `Showing ${visibleRows} of ${totalRows} reports`;
    tableEmptyState.hidden = visibleRows !== 0;
}

function filterReportRows() {
    const query = (searchInput?.value || "").toLowerCase().trim();
    let visibleRows = 0;

    reportRows.forEach((row) => {
        const rowText = row.textContent.toLowerCase();
        const isVisible = rowText.includes(query);
        row.hidden = !isVisible;
        if (isVisible) {
            visibleRows += 1;
        }
    });

    updateTableSummary(visibleRows, reportRows.length);
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

    actionMenu.hidden = false;
    actionMenu.style.top = `${rect.bottom + 6}px`;
    actionMenu.style.left = `${Math.max(12, rect.right - actionMenu.offsetWidth)}px`;

    rowActionButtons.forEach((button) => {
        const isCurrent = button === triggerButton;
        button.setAttribute("aria-expanded", String(isCurrent));
    });
}

function bindRowActionMenu() {
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

    actionMenu.addEventListener("click", (event) => {
        const menuButton = event.target.closest("button");
        if (!menuButton) {
            return;
        }

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

function createTableRow(report, index) {
    const row = document.createElement("tr");
    row.setAttribute("data-report-row", "");
    row.setAttribute("data-report-id", report.reportId || `RPT-${index + 1}`);

    row.innerHTML = `
        <td>${report.companyName || "-"}</td>
        <td>${report.reportType || "AQI Monitoring Report"}</td>
        <td>${report.generatedBy || "Monitoring Agency"}</td>
        <td><span class="status-badge status-completed"><i class="fa-solid fa-circle"></i>${report.status || "Completed"}</span></td>
        <td>${formatDate(report.monitoringDate)}</td>
        <td class="sparkline-cell"><div class="sparkline-wrap"><canvas class="sparkline-canvas"></canvas></div></td>
        <td class="actions-cell">
            <button class="btn-row-action btn-action-pop" type="button" value="${report.reportId || `RPT-${index + 1}`}" aria-haspopup="true" aria-expanded="false" aria-label="Open row actions">
                Manage <i class="fa-solid fa-caret-down"></i>
            </button>
        </td>
    `;

    return row;
}

function renderReports(reports) {
    reportsTableBody.innerHTML = "";

    reports.forEach((report, index) => {
        reportsTableBody.appendChild(createTableRow(report, index));
    });

    reportRows = Array.from(reportsTableBody.querySelectorAll("tr[data-report-row]"));
    bindRowActionMenu();
    filterReportRows();
}

function updateSummaryCards(summary) {
    totalReportsElement.textContent = summary.totalReports ?? 0;
    activeReportsElement.textContent = summary.activeReports ?? 0;
    pendingReportsElement.textContent = summary.pendingReports ?? 0;
    overdueReportsElement.textContent = summary.overdueReports ?? 0;
}

async function loadDashboardData() {
    try {
        const response = await fetch(`${BASE_URL}/agency-dashboard-data`);
        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || "Unable to load dashboard data");
        }

        allReports = Array.isArray(data.reports) ? data.reports : [];
        updateSummaryCards(data.summary || {});
        renderReports(allReports);
    } catch (error) {
        console.error("Dashboard load error:", error);
        updateSummaryCards({ totalReports: 0, activeReports: 0, pendingReports: 0, overdueReports: 0 });
        renderReports([]);
    }
}

function initializeDashboard() {
    bindSearchInput();
    bindSidebarToggle();
    bindLogoutButton();
    bindGenerateButtons();
    loadDashboardData();
}

window.AgencyDashboard = {
    clearReports: () => {
        reportsTableBody.innerHTML = "";
        reportRows = [];
        updateSummaryCards({ totalReports: 0, activeReports: 0, pendingReports: 0, overdueReports: 0 });
        updateTableSummary(0, 0);
    }
};

initializeDashboard();
