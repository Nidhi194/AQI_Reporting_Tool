const AUTH_KEY = "enviroMonitorAuth";
const AGENCY_NAME_KEY = "enviroMonitorAgencyName";
const ROLE_KEY = "enviroMonitorRole";
const USERS_KEY = "enviroMonitorUsers";


const permissibleLimits = {
  PM10: 100,
  "PM2.5": 60,
  SO2: 80,
  NO2: 80,
  O3: 100,
  CO: 4,
  NH3: 400,
  Pb: 1,
  Ni: 0.02,
  As: 0.006,
  Cd: 0.005,
  C6H6: 5
};


const industryLocations = {
  "green-steel": "Industrial Zone A, Mumbai",
  "river-chemicals": "Chemical Cluster, Vadodara",
  "sunrise-cement": "Plant Area, Jaipur",
  "eco-textiles": "Textile Hub, Surat"
};


const industrySelect = document.getElementById("industryName");
const locationInput = document.getElementById("industryLocation");
const dateInput = document.getElementById("monitoringDate");
const calculateBtn = document.getElementById("calculateBtn");
const saveBtn = document.getElementById("saveBtn");
const reportBtn = document.getElementById("reportBtn");
const inputFields = document.querySelectorAll(".param-input");

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



function initializeLimitsInTable() {
  Object.keys(permissibleLimits).forEach((parameter) => {
    const limitCell = document.getElementById(`limit-${parameter}`);
    if (limitCell) {
      limitCell.textContent = permissibleLimits[parameter];
    }
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
    const statusElement = document.getElementById(`status-${parameter}`);
    const inputElement = document.querySelector(`[data-param="${parameter}"]`);

    if (!statusElement || !inputElement) {
      return;
    }

    const exceeds = enteredValue > limit;

    statusElement.textContent = exceeds ? "Exceeds" : "Safe";
    statusElement.classList.remove("status-safe", "status-exceeds");
    statusElement.classList.add(exceeds ? "status-exceeds" : "status-safe");

    inputElement.classList.toggle("input-exceeds", exceeds);
  });
}

function updateSingleStatus(parameter, rawValue) {
  const statusElement = document.getElementById(`status-${parameter}`);
  const inputElement = document.querySelector(`[data-param="${parameter}"]`);

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
  const exceeds = numericValue > limit;

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

    if (!limit) {
      return;
    }

    const subIndex = (enteredValue / limit) * 100;
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
    
    alert("Save Data clicked. Backend integration can be added here.");
  });
}

if (reportBtn) {
  reportBtn.addEventListener("click", () => {
   
    alert("Generate Report clicked. Backend integration can be added here.");
  });
}


if (initializeAuthRouting()) {
  initializeLoginHandler();
  initializeSignupHandler();
  initializeLogoutHandler();
  initializeAgencyNameDisplay();

  if (isDashboardPage()) {
    initializeLimitsInTable();
    initializeIndustryChangeHandler();
    initializeLiveStatusUpdates();
    initializeSidebarScrollNavigation();
  }
}

