/* --------------------------------------------------
   Environmental Monitoring Panel Script
   - Modular AQI calculation logic
   - Input validation and status updates
  - Login/logout flow with protected dashboard access
  - Placeholder actions for backend integration
-------------------------------------------------- */

/* Local storage keys for frontend-only authentication */
const AUTH_KEY = "enviroMonitorAuth";
const AGENCY_NAME_KEY = "enviroMonitorAgencyName";
const ROLE_KEY = "enviroMonitorRole";
const USERS_KEY = "enviroMonitorUsers";
const REPORTS_KEY = "enviroMonitorReports";

/* Base permissible limits plus metadata for unit conversion */
const pollutantConfig = {
  PM10: { baseLimit: 100, baseUnit: "ug/m3", molecularWeight: null },
  "PM2.5": { baseLimit: 60, baseUnit: "ug/m3", molecularWeight: null },
  SO2: { baseLimit: 80, baseUnit: "ug/m3", molecularWeight: 64.066 },
  NO2: { baseLimit: 80, baseUnit: "ug/m3", molecularWeight: 46.0055 },
  O3: { baseLimit: 100, baseUnit: "ug/m3", molecularWeight: 48.0 },
  CO: { baseLimit: 4, baseUnit: "mg/m3", molecularWeight: 28.01 },
  NH3: { baseLimit: 400, baseUnit: "ug/m3", molecularWeight: 17.031 },
  Pb: { baseLimit: 1, baseUnit: "ug/m3", molecularWeight: null },
  Ni: { baseLimit: 0.02, baseUnit: "ug/m3", molecularWeight: null },
  As: { baseLimit: 0.006, baseUnit: "ug/m3", molecularWeight: null },
  Cd: { baseLimit: 0.005, baseUnit: "ug/m3", molecularWeight: null },
  C6H6: { baseLimit: 5, baseUnit: "ug/m3", molecularWeight: 78.11 }
};

const permissibleLimits = Object.fromEntries(
  Object.entries(pollutantConfig).map(([parameter, config]) => [parameter, config.baseLimit])
);

/* Dummy industry-location map (to be replaced by backend data fetch) */
const industryLocations = {
  "green-steel": "Industrial Zone A, Mumbai",
  "river-chemicals": "Chemical Cluster, Vadodara",
  "sunrise-cement": "Plant Area, Jaipur",
  "eco-textiles": "Textile Hub, Surat"
};

/* Cached DOM elements */
const industrySelect = document.getElementById("industryName");
const locationInput = document.getElementById("industryLocation");
const dateInput = document.getElementById("monitoringDate");
const calculateBtn = document.getElementById("calculateBtn");
const saveBtn = document.getElementById("saveBtn");
const reportBtn = document.getElementById("generateReportBtn") || document.getElementById("reportBtn");
const inputFields = document.querySelectorAll(".param-input");
const globalUnitSelect = document.getElementById("globalUnitSelect");

const resultCard = document.getElementById("aqiResultCard");
const aqiValueEl = document.getElementById("aqiValue");
const aqiCategoryEl = document.getElementById("aqiCategory");
const dominantPollutantEl = document.getElementById("dominantPollutant");

const loginForm = document.getElementById("loginForm");
const loginEmailInput = document.getElementById("loginEmail");
const loginPasswordInput = document.getElementById("loginPassword");
const roleSelectInput = document.getElementById("userRole");
const loginError = document.getElementById("loginError");
const signupForm = document.getElementById("signupForm");
const signupEmailInput = document.getElementById("signupEmail");
const signupPasswordInput = document.getElementById("signupPassword");
const signupConfirmPasswordInput = document.getElementById("signupConfirmPassword");
const signupRoleInput = document.getElementById("signupRole");
const signupError = document.getElementById("signupError");
const logoutBtn = document.getElementById("logoutBtn");
const agencyNameDisplay = document.getElementById("agencyNameDisplay");
const submittedReportsContainer = document.getElementById("submittedReportsContainer");
const reportPreviewSection = document.getElementById("reportPreviewSection");
const reportPreviewFrame = document.getElementById("reportPreviewFrame");
const downloadReportBtn = document.getElementById("downloadReportBtn");

let currentPreviewBlobUrl = null;

function getSelectedUnit(parameter) {
  if (globalUnitSelect && globalUnitSelect.value) {
    return globalUnitSelect.value;
  }

  return pollutantConfig[parameter]?.baseUnit;
}

function convertValueFromBase(parameter, targetUnit, valueInBase) {
  const config = pollutantConfig[parameter];

  if (!config || typeof valueInBase !== "number" || Number.isNaN(valueInBase)) {
    return null;
  }

  if (targetUnit === config.baseUnit) {
    return valueInBase;
  }

  const valueInMgPerM3 = config.baseUnit === "ug/m3" ? valueInBase / 1000 : valueInBase;

  if (targetUnit === "ug/m3") {
    return valueInMgPerM3 * 1000;
  }

  if (targetUnit === "mg/m3") {
    return valueInMgPerM3;
  }

  if (!config.molecularWeight) {
    return null;
  }

  if (targetUnit === "ppm") {
    return (valueInMgPerM3 * 24.45) / config.molecularWeight;
  }

  if (targetUnit === "ppb") {
    return ((valueInMgPerM3 * 24.45) / config.molecularWeight) * 1000;
  }

  return null;
}

function convertValueToBase(parameter, sourceUnit, value) {
  const config = pollutantConfig[parameter];

  if (!config || typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  if (sourceUnit === config.baseUnit) {
    return value;
  }

  let valueInMgPerM3;

  if (sourceUnit === "ug/m3") {
    valueInMgPerM3 = value / 1000;
  } else if (sourceUnit === "mg/m3") {
    valueInMgPerM3 = value;
  } else if (sourceUnit === "ppm") {
    if (!config.molecularWeight) {
      return null;
    }
    valueInMgPerM3 = (value * config.molecularWeight) / 24.45;
  } else if (sourceUnit === "ppb") {
    if (!config.molecularWeight) {
      return null;
    }
    valueInMgPerM3 = (value * config.molecularWeight) / 24450;
  } else {
    return null;
  }

  if (config.baseUnit === "ug/m3") {
    return valueInMgPerM3 * 1000;
  }

  return valueInMgPerM3;
}

function formatLimitValue(value) {
  if (value === null || typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }

  return value.toFixed(6).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

function updateLimitCell(parameter) {
  const limitCell = document.getElementById(`limit-${parameter}`);

  if (!limitCell) {
    return;
  }

  const selectedUnit = getSelectedUnit(parameter);
  const baseLimit = permissibleLimits[parameter];
  const convertedLimit = convertValueFromBase(parameter, selectedUnit, baseLimit);

  limitCell.textContent = formatLimitValue(convertedLimit);
}

/* --------------------------------------------------
   Page and auth helpers
-------------------------------------------------- */

function isDashboardPage() {
  return Boolean(document.querySelector(".dashboard-layout"));
}

function isLoginPage() {
  return Boolean(loginForm);
}

function isSignupPage() {
  return Boolean(signupForm);
}

function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

function getStoredUsers() {
  const rawUsers = localStorage.getItem(USERS_KEY);

  if (!rawUsers) {
    return [];
  }

  try {
    const parsedUsers = JSON.parse(rawUsers);
    return Array.isArray(parsedUsers) ? parsedUsers : [];
  } catch (error) {
    return [];
  }
}

function saveStoredUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function findUserByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  return getStoredUsers().find((user) => String(user.email).trim().toLowerCase() === normalizedEmail);
}

function getDashboardPathByRole(role) {
  if (role === "industry") {
    return "industry-dashboard.html";
  }

  return "agency-dashboard.html";
}

function setAuthState(displayName, role) {
  localStorage.setItem(AUTH_KEY, "true");
  localStorage.setItem(AGENCY_NAME_KEY, displayName);
  localStorage.setItem(ROLE_KEY, role);
}

function clearAuthState() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AGENCY_NAME_KEY);
  localStorage.removeItem(ROLE_KEY);
}

function initializeAuthRouting() {
  const currentPage = window.location.pathname.split("/").pop() || "";

  if (currentPage === "" || currentPage === "index.html") {
    if (isAuthenticated()) {
      const role = localStorage.getItem(ROLE_KEY) || "agency";
      window.location.href = getDashboardPathByRole(role);
    } else {
      window.location.href = "login.html";
    }
    return false;
  }

  if (isDashboardPage() && !isAuthenticated()) {
    window.location.href = "login.html";
    return false;
  }

  if ((isLoginPage() || isSignupPage()) && isAuthenticated()) {
    const role = localStorage.getItem(ROLE_KEY) || "agency";
    window.location.href = getDashboardPathByRole(role);
    return false;
  }

  if (isAuthenticated() && roleMatchesProtectedPage(currentPage) === false) {
    const role = localStorage.getItem(ROLE_KEY) || "agency";
    window.location.href = getDashboardPathByRole(role);
    return false;
  }

  return true;
}

function roleMatchesProtectedPage(currentPage) {
  const role = localStorage.getItem(ROLE_KEY) || "agency";

  if (currentPage === "agency-dashboard.html" && role !== "agency") {
    return false;
  }

  if (currentPage === "industry-dashboard.html" && role !== "industry") {
    return false;
  }

  return true;
}

function initializeLoginHandler() {
  if (!loginForm || !loginEmailInput || !loginPasswordInput || !roleSelectInput) {
    return;
  }

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value.trim();
    const role = roleSelectInput.value;
    const emailLooksValid = email.includes("@") && email.includes(".");

    if (!email || !password || !role) {
      if (loginError) {
        loginError.textContent = "Please fill email, password, and role.";
      }
      return;
    }

    if (!emailLooksValid) {
      if (loginError) {
        loginError.textContent = "Please enter a valid email address.";
      }
      return;
    }

    const matchedUser = findUserByEmail(email);

    if (!matchedUser) {
      if (loginError) {
        loginError.textContent = "Account not found. Please sign up first.";
      }
      return;
    }

    if (matchedUser.password !== password) {
      if (loginError) {
        loginError.textContent = "Incorrect password. Please try again.";
      }
      return;
    }

    if (loginError) {
      loginError.textContent = "";
    }

    const displayName = role === "industry" ? "Industry User" : "Monitoring Agency";
    setAuthState(displayName, role);
    window.location.href = getDashboardPathByRole(role);
  });
}

function initializeSignupHandler() {
  if (
    !signupForm ||
    !signupEmailInput ||
    !signupPasswordInput ||
    !signupConfirmPasswordInput ||
    !signupRoleInput
  ) {
    return;
  }

  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = signupEmailInput.value.trim();
    const password = signupPasswordInput.value.trim();
    const confirmPassword = signupConfirmPasswordInput.value.trim();
    const role = signupRoleInput.value;
    const emailLooksValid = email.includes("@") && email.includes(".");

    if (!email || !password || !confirmPassword || !role) {
      if (signupError) {
        signupError.textContent = "Please fill all signup fields.";
      }
      return;
    }

    if (!emailLooksValid) {
      if (signupError) {
        signupError.textContent = "Please enter a valid email address.";
      }
      return;
    }

    if (password.length < 6) {
      if (signupError) {
        signupError.textContent = "Password must be at least 6 characters.";
      }
      return;
    }

    if (password !== confirmPassword) {
      if (signupError) {
        signupError.textContent = "Passwords do not match.";
      }
      return;
    }

    if (findUserByEmail(email)) {
      if (signupError) {
        signupError.textContent = "Account already exists. Please login.";
      }
      return;
    }

    const users = getStoredUsers();
    users.push({ email, password, role });
    saveStoredUsers(users);

    if (signupError) {
      signupError.textContent = "";
    }

    const displayName = role === "industry" ? "Industry User" : "Monitoring Agency";
    setAuthState(displayName, role);
    window.location.href = getDashboardPathByRole(role);
  });
}

function initializeLogoutHandler() {
  if (!logoutBtn) {
    return;
  }

  logoutBtn.addEventListener("click", () => {
    clearAuthState();
    window.location.href = "login.html";
  });
}

function initializeAgencyNameDisplay() {
  if (!agencyNameDisplay) {
    return;
  }

  agencyNameDisplay.textContent = localStorage.getItem(AGENCY_NAME_KEY) || "Monitoring Agency";
}

/* --------------------------------------------------
   Initialization helpers
-------------------------------------------------- */

function initializeLimitsInTable() {
  Object.keys(permissibleLimits).forEach((parameter) => updateLimitCell(parameter));
}

function updateDisplayedUnits() {
  const selectedUnit = getSelectedUnit("PM10") || "ug/m3";

  Object.keys(permissibleLimits).forEach((parameter) => {
    const unitDisplay = document.getElementById(`unit-${parameter}`);

    if (unitDisplay) {
      unitDisplay.textContent = selectedUnit;
    }
  });
}

function initializeUnitChangeHandler() {
  if (!globalUnitSelect) {
    return;
  }

  globalUnitSelect.addEventListener("change", () => {
    updateDisplayedUnits();

    Object.keys(permissibleLimits).forEach((parameter) => {
      const inputElement = document.querySelector(`.param-input[data-param="${parameter}"]`);
      updateLimitCell(parameter);

      if (inputElement) {
        updateSingleStatus(parameter, inputElement.value);
      }
    });
  });
}

function initializeIndustryChangeHandler() {
  if (!industrySelect || !locationInput) {
    return;
  }

  industrySelect.addEventListener("change", () => {
    const selectedIndustry = industrySelect.value;
    locationInput.value = industryLocations[selectedIndustry] || "";
  });
}

function initializeSidebarScrollNavigation() {
  const sidebarItems = document.querySelectorAll(".sidebar .nav-item[data-target]");

  if (!sidebarItems.length) {
    return;
  }

  sidebarItems.forEach((item) => {
    item.addEventListener("click", () => {
      const targetId = item.getAttribute("data-target");
      const targetSection = targetId ? document.getElementById(targetId) : null;

      if (!targetSection) {
        return;
      }

      sidebarItems.forEach((navItem) => navItem.classList.remove("active"));
      item.classList.add("active");

      targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

/* --------------------------------------------------
   Required modular functions
-------------------------------------------------- */

function validateInputs() {
  let isValid = true;
  let errorMessage = "";

  if (!industrySelect || !dateInput) {
    return {
      isValid: false,
      values: {},
      errorMessage: "Dashboard form is not available."
    };
  }

  if (!industrySelect.value) {
    isValid = false;
    errorMessage = "Please select an industry.";
  } else if (!dateInput.value) {
    isValid = false;
    errorMessage = "Please select monitoring date.";
  }

  const values = {};

  inputFields.forEach((input) => {
    const param = input.dataset.param;
    const rawValue = input.value.trim();

    if (rawValue === "") {
      isValid = false;
      if (!errorMessage) {
        errorMessage = `Please enter value for ${param}.`;
      }
      return;
    }

    const numericValue = Number(rawValue);

    if (Number.isNaN(numericValue) || numericValue < 0) {
      isValid = false;
      if (!errorMessage) {
        errorMessage = `Invalid value for ${param}. Values must be non-negative.`;
      }
      return;
    }

    values[param] = numericValue;
  });

  return {
    isValid,
    values,
    errorMessage
  };
}

function updateStatus(values) {
  Object.entries(values).forEach(([parameter, enteredValue]) => {
    const limit = permissibleLimits[parameter];
    const selectedUnit = getSelectedUnit(parameter);
    const enteredValueInBase = convertValueToBase(parameter, selectedUnit, enteredValue);
    const statusElement = document.getElementById(`status-${parameter}`);
    const inputElement = document.querySelector(`.param-input[data-param="${parameter}"]`);

    if (!statusElement || !inputElement) {
      return;
    }

    if (enteredValueInBase === null || typeof limit !== "number") {
      statusElement.textContent = "Pending";
      statusElement.classList.remove("status-safe", "status-exceeds");
      inputElement.classList.remove("input-exceeds");
      return;
    }

    const exceeds = enteredValueInBase > limit;

    statusElement.textContent = exceeds ? "Exceeds" : "Safe";
    statusElement.classList.remove("status-safe", "status-exceeds");
    statusElement.classList.add(exceeds ? "status-exceeds" : "status-safe");

    inputElement.classList.toggle("input-exceeds", exceeds);
  });
}

function updateSingleStatus(parameter, rawValue) {
  const statusElement = document.getElementById(`status-${parameter}`);
  const inputElement = document.querySelector(`.param-input[data-param="${parameter}"]`);

  if (!statusElement || !inputElement) {
    return;
  }

  const trimmedValue = String(rawValue).trim();

  if (trimmedValue === "") {
    statusElement.textContent = "Pending";
    statusElement.classList.remove("status-safe", "status-exceeds");
    inputElement.classList.remove("input-exceeds");
    return;
  }

  const numericValue = Number(trimmedValue);

  if (Number.isNaN(numericValue) || numericValue < 0) {
    statusElement.textContent = "Pending";
    statusElement.classList.remove("status-safe", "status-exceeds");
    inputElement.classList.remove("input-exceeds");
    return;
  }

  const limit = permissibleLimits[parameter];
  const selectedUnit = getSelectedUnit(parameter);
  const numericValueInBase = convertValueToBase(parameter, selectedUnit, numericValue);

  if (numericValueInBase === null || typeof limit !== "number") {
    statusElement.textContent = "Pending";
    statusElement.classList.remove("status-safe", "status-exceeds");
    inputElement.classList.remove("input-exceeds");
    return;
  }

  const exceeds = numericValueInBase > limit;

  statusElement.textContent = exceeds ? "Exceeds" : "Safe";
  statusElement.classList.remove("status-safe", "status-exceeds");
  statusElement.classList.add(exceeds ? "status-exceeds" : "status-safe");
  inputElement.classList.toggle("input-exceeds", exceeds);
}

function initializeLiveStatusUpdates() {
  inputFields.forEach((input) => {
    input.addEventListener("input", () => {
      const parameter = input.dataset.param;
      updateSingleStatus(parameter, input.value);
    });
  });
}

function calculateAQI(values) {
  let dominantPollutant = "";
  let maxSubIndex = -Infinity;
  let subIndexSum = 0;

  Object.entries(values).forEach(([parameter, enteredValue]) => {
    const limit = permissibleLimits[parameter];
    const selectedUnit = getSelectedUnit(parameter);
    const enteredValueInBase = convertValueToBase(parameter, selectedUnit, enteredValue);

    if (typeof limit !== "number" || enteredValueInBase === null) {
      return;
    }

    const subIndex = (enteredValueInBase / limit) * 100;
    subIndexSum += subIndex;

    if (subIndex > maxSubIndex) {
      maxSubIndex = subIndex;
      dominantPollutant = parameter;
    }
  });

  const parameterCount = Object.keys(values).length;
  const averageSubIndex = parameterCount > 0 ? subIndexSum / parameterCount : 0;

  return {
    aqiValue: Math.round(Math.max(maxSubIndex, averageSubIndex)),
    dominantPollutant
  };
}

function getCategory(aqiValue) {
  if (aqiValue <= 50) {
    return "Good";
  }
  if (aqiValue <= 100) {
    return "Moderate";
  }
  return "Poor";
}

/* --------------------------------------------------
   UI rendering logic
-------------------------------------------------- */

function renderAQIResult(aqiValue, category, dominantPollutant) {
  if (!resultCard || !aqiValueEl || !aqiCategoryEl || !dominantPollutantEl) {
    return;
  }

  aqiValueEl.textContent = String(aqiValue);
  aqiCategoryEl.textContent = category;
  dominantPollutantEl.textContent = dominantPollutant || "N/A";

  resultCard.classList.remove("hidden", "aqi-good", "aqi-moderate", "aqi-poor");

  if (category === "Good") {
    resultCard.classList.add("aqi-good");
  } else if (category === "Moderate") {
    resultCard.classList.add("aqi-moderate");
  } else {
    resultCard.classList.add("aqi-poor");
  }
}

/* --------------------------------------------------
   Report PDF generation + submitted list
-------------------------------------------------- */

function buildReportDataFromInputs(values) {
  const industryId = industrySelect ? industrySelect.value : "";
  const industryLabel = industrySelect
    ? industrySelect.options[industrySelect.selectedIndex]?.text || ""
    : "";
  const location = locationInput ? locationInput.value : "";
  const monitoringDateValue = dateInput ? dateInput.value : "";

  const parameters = Object.entries(values).map(([parameter, enteredValue]) => {
    const limit = permissibleLimits[parameter];
    const unit = getSelectedUnit(parameter);

    return {
      parameter,
      enteredValue,
      unit,
      limit,
      exceeds: null
    };
  });

  return {
    industryId,
    industryName: industryLabel,
    location,
    monitoringDate: monitoringDateValue,
    aqiValue: "",
    aqiCategory: "",
    dominantPollutant: "",
    parameters
  };
}

async function generateReportPdfBlob(reportData) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("PDF library is not loaded. Please check your internet connection.");
    throw new Error("jsPDF not available");
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  let cursorY = 15;

  const companyName = localStorage.getItem(AGENCY_NAME_KEY) || "EnviroMonitor";

  doc.setFontSize(16);
  doc.text(companyName, 105, cursorY, { align: "center" });
  cursorY += 7;
  doc.setFontSize(13);
  doc.text("Ambient Air Observation (Raw Data) Report", 105, cursorY, { align: "center" });
  cursorY += 10;

  doc.setFontSize(10);
  doc.text(`Location Name: ${reportData.location || "-"}`, 14, cursorY);
  cursorY += 5;
  doc.text(`Industry: ${reportData.industryName || "-"}`, 14, cursorY);
  cursorY += 5;
  doc.text(`Monitoring Date: ${reportData.monitoringDate || "-"}`, 14, cursorY);
  cursorY += 5;
  const aqiLine =
    reportData.aqiValue && reportData.aqiCategory
      ? `AQI Value: ${reportData.aqiValue} (${reportData.aqiCategory})`
      : "AQI Value: ____________________";
  doc.text(aqiLine, 14, cursorY);
  cursorY += 5;
  const dominantLine = reportData.dominantPollutant
    ? `Dominant Pollutant: ${reportData.dominantPollutant}`
    : "Dominant Pollutant: ____________________";
  doc.text(dominantLine, 14, cursorY);
  cursorY += 8;

  const pmRows = reportData.parameters
    .filter((row) => row.parameter === "PM10" || row.parameter === "PM2.5")
    .map((row) => [
      row.parameter,
      String(row.enteredValue),
      row.unit || "",
      typeof row.limit === "number" ? String(row.limit) : "",
      row.exceeds === null ? "" : row.exceeds ? "Exceeds" : "Safe"
    ]);

  if (pmRows.length && doc.autoTable) {
    doc.setFontSize(11);
    doc.text("A) Particulate Matter (PM10 / PM2.5)", 14, cursorY);
    cursorY += 4;

    doc.autoTable({
      startY: cursorY,
      head: [["Parameter", "Observed Value", "Unit", "Permissible Limit", "Status"]],
      body: pmRows,
      styles: { fontSize: 9 },
      theme: "grid"
    });

    cursorY = doc.lastAutoTable.finalY + 8;
  }

  const gasRows = reportData.parameters
    .filter((row) => ["SO2", "NO2", "O3", "CO", "NH3"].includes(row.parameter))
    .map((row) => [
      row.parameter,
      String(row.enteredValue),
      row.unit || "",
      typeof row.limit === "number" ? String(row.limit) : "",
      row.exceeds === null ? "" : row.exceeds ? "Exceeds" : "Safe"
    ]);

  if (gasRows.length && doc.autoTable) {
    doc.setFontSize(11);
    doc.text("B) Gaseous Pollutants", 14, cursorY);
    cursorY += 4;

    doc.autoTable({
      startY: cursorY,
      head: [["Parameter", "Observed Value", "Unit", "Permissible Limit", "Status"]],
      body: gasRows,
      styles: { fontSize: 9 },
      theme: "grid"
    });

    cursorY = doc.lastAutoTable.finalY + 12;
  }

  doc.setFontSize(10);
  doc.text("Tested By: ____________________", 14, cursorY);
  doc.text("Checked By: ____________________", 120, cursorY);

  const blob = doc.output("blob");
  return blob;
}

function buildReportFileName(reportData) {
  const fileNameParts = [];

  if (reportData.industryName) {
    fileNameParts.push(reportData.industryName.replace(/\s+/g, "_"));
  }

  if (reportData.monitoringDate) {
    fileNameParts.push(reportData.monitoringDate);
  }

  const fileNameBase = fileNameParts.join("_") || "AQI_Report";
  return `${fileNameBase}.pdf`;
}

function updatePreviewWithBlob(blob, fileName) {
  if (!reportPreviewSection || !reportPreviewFrame) {
    return null;
  }

  if (currentPreviewBlobUrl) {
    URL.revokeObjectURL(currentPreviewBlobUrl);
    currentPreviewBlobUrl = null;
  }

  const blobUrl = URL.createObjectURL(blob);
  currentPreviewBlobUrl = blobUrl;

  reportPreviewFrame.src = blobUrl;
  reportPreviewSection.classList.remove("hidden");

  if (downloadReportBtn) {
    downloadReportBtn.href = blobUrl;
    downloadReportBtn.download = fileName || "AQI_Report.pdf";
  }

  reportPreviewSection.scrollIntoView({ behavior: "smooth", block: "start" });
  return blobUrl;
}

function addSubmittedReportEntry(reportData, blobUrl) {
  if (!submittedReportsContainer) {
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "submitted-report-row";

  const title = document.createElement("span");
  const labelParts = [];

  if (reportData.industryName) {
    labelParts.push(reportData.industryName);
  }

  if (reportData.location) {
    labelParts.push(reportData.location);
  }

  if (reportData.monitoringDate) {
    labelParts.push(reportData.monitoringDate);
  }

  title.textContent = labelParts.join(" | ") || "AQI Report";

  const link = document.createElement("a");
  link.href = "#";

  link.addEventListener("click", (event) => {
    event.preventDefault();

    if (blobUrl) {
      if (reportPreviewFrame && reportPreviewSection) {
        reportPreviewFrame.src = blobUrl;
        reportPreviewSection.classList.remove("hidden");
      }
      if (downloadReportBtn) {
        downloadReportBtn.href = blobUrl;
        downloadReportBtn.download = buildReportFileName(reportData);
      }
      if (reportPreviewSection) {
        reportPreviewSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    generateReportPdfBlob(reportData)
      .then((blob) => {
        const fileName = buildReportFileName(reportData);
        updatePreviewWithBlob(blob, fileName);
      })
      .catch(() => {
        alert("Could not open the PDF report. Please try again.");
      });
  });

  link.textContent = "View PDF";
  link.className = "btn btn-link";

  wrapper.appendChild(title);
  wrapper.appendChild(document.createTextNode(" "));
  wrapper.appendChild(link);

  submittedReportsContainer.appendChild(wrapper);
}

function getStoredReports() {
  const raw = localStorage.getItem(REPORTS_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function persistSubmittedReport(reportData) {
  const existing = getStoredReports();
  const now = new Date().toISOString();
  const entry = {
    ...reportData,
    storedAt: now
  };

  existing.push(entry);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(existing));
}

function initializeSubmittedReportsFromStorage() {
  if (!submittedReportsContainer) {
    return;
  }

  const reports = getStoredReports();

  reports.forEach((report) => {
    addSubmittedReportEntry(report, null);
  });
}

/* --------------------------------------------------
   Event bindings
-------------------------------------------------- */

if (calculateBtn) {
  calculateBtn.addEventListener("click", () => {
    const validation = validateInputs();

    if (!validation.isValid) {
      alert(validation.errorMessage);
      return;
    }

    updateStatus(validation.values);

    const { aqiValue, dominantPollutant } = calculateAQI(validation.values);
    const category = getCategory(aqiValue);

    renderAQIResult(aqiValue, category, dominantPollutant);
  });
}

if (saveBtn) {
  saveBtn.addEventListener("click", () => {
    /* Placeholder for future Servlet + MySQL integration */
    alert("Save Data clicked. Backend integration can be added here.");
  });
}

if (reportBtn) {
  reportBtn.addEventListener("click", () => {
    const validation = validateInputs();

    if (!validation.isValid) {
      alert(validation.errorMessage);
      return;
    }

    const reportData = buildReportDataFromInputs(validation.values);

    generateReportPdfBlob(reportData)
      .then((blob) => {
        const fileName = buildReportFileName(reportData);
        const blobUrl = updatePreviewWithBlob(blob, fileName);

        addSubmittedReportEntry(reportData, blobUrl);
        persistSubmittedReport(reportData);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error("Failed to generate PDF report", error);
        alert("Could not generate PDF report. Please try again.");
      });
  });
}

/* --------------------------------------------------
   Initial setup on page load
-------------------------------------------------- */
if (initializeAuthRouting()) {
  initializeLoginHandler();
  initializeSignupHandler();
  initializeLogoutHandler();
  initializeAgencyNameDisplay();

  if (isDashboardPage()) {
    updateDisplayedUnits();
    initializeLimitsInTable();
    initializeUnitChangeHandler();
    initializeIndustryChangeHandler();
    initializeLiveStatusUpdates();
    initializeSidebarScrollNavigation();
    initializeSubmittedReportsFromStorage();
  }
}
