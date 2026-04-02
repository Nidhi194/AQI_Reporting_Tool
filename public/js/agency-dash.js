const appLayout = document.getElementById("appLayout");
const sidebarPanel = document.getElementById("sidebarPanel");
const sidebarToggleButton = document.getElementById("btnSidebarToggle");
const logoutButton = document.getElementById("btnLogout");
const searchInput = document.getElementById("inputSearchReports");
const reportsTableBody = document.getElementById("tbodyReports");
const reportRows = Array.from(reportsTableBody.querySelectorAll("tr[data-report-row]"));
const tableSummaryText = document.getElementById("textTableSummary");
const tableEmptyState = document.getElementById("tableEmptyState");

const actionMenu = document.getElementById("reportActionMenu");
const rowActionButtons = Array.from(document.querySelectorAll(".btn-row-action"));

let selectedReportId = null;

function updateTableSummary(visibleRows, totalRows) {
    tableSummaryText.textContent = `Showing ${visibleRows} of ${totalRows} reports`;
    tableEmptyState.hidden = visibleRows !== 0;
}

function filterReportRows() {
    const query = searchInput.value.toLowerCase().trim();
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

    actionMenu.style.top = `${rect.bottom + 6}px`;
    actionMenu.style.left = `${Math.max(12, rect.right - actionMenu.offsetWidth)}px`;
    actionMenu.hidden = false;

    rowActionButtons.forEach((button) => {
        const isCurrent = button === triggerButton;
        button.setAttribute("aria-expanded", String(isCurrent));
    });
}

function bindRowActionMenu() {
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

        // Backend hook: selectedReportId and menuButton.value can be sent to API handlers.
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
    searchInput.addEventListener("input", filterReportRows);
}

function bindSidebarToggle() {
    sidebarToggleButton.addEventListener("click", () => {
        appLayout.classList.toggle("sidebar-open");
        sidebarPanel.classList.toggle("is-open");
    });
}

function bindLogoutButton() {
    logoutButton.addEventListener("click", () => {
        const shouldLogout = window.confirm("Are you sure you want to logout?");
        if (!shouldLogout) {
            return;
        }

        // TODO: Connect logout to backend session/API before redirect.
        window.location.href = "h.html";
    });
}

function initializeDashboard() {
    updateTableSummary(reportRows.length, reportRows.length);
    bindSearchInput();
    bindRowActionMenu();
    bindSidebarToggle();
    bindLogoutButton();
}

// Backend helper hooks for future API integration.
window.AgencyDashboard = {
    clearReports: () => {
        reportsTableBody.innerHTML = "";
        updateTableSummary(0, 0);
    }
};

initializeDashboard();
