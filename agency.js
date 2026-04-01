async function loadIndustries() {
    try {
        let res = await fetch("http://localhost:3000/get-industries");
        let data = await res.json();

        let dropdown = document.getElementById("industry_name");
        dropdown.innerHTML = '<option value="">Select Industry</option>';

        data.forEach(item => {
            let option = document.createElement("option");
            option.value = item.industry_name;
            option.text = item.industry_name;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.log("Error loading industries:", error);
        alert("Could not load industries");
    }
}

loadIndustries();

const industryLocationMap = {
    manufacturing: "Industrial Zone",
    chemical: "Chemical Estate",
    "cement & construction": "Industrial Zone",
    "steel & metallurgy": "Metal Park",
    textile: "Textile Cluster",
    "paper & pulp": "Paper Industrial Area",
    pharmaceutical: "Pharma Hub",
    "power generation": "Power Plant Zone",
    it: "Tech Park"
};

function getAutofillLocation(industryValue) {
    const normalized = (industryValue || "").trim().toLowerCase();
    if (!normalized) return "";

    if (industryLocationMap[normalized]) {
        return industryLocationMap[normalized];
    }

    const keywordMatch = Object.keys(industryLocationMap).find(key => normalized.includes(key));
    if (keywordMatch) {
        return industryLocationMap[keywordMatch];
    }

    return `${industryValue.trim()} Location`;
}

function setupIndustryLocationAutofill() {
    const industryDropdown = document.getElementById("industry_name");
    const locationInput = document.getElementById("location");

    if (!industryDropdown || !locationInput) return;

    industryDropdown.addEventListener("change", (event) => {
        const selectedIndustry = event.target.value;
        locationInput.value = getAutofillLocation(selectedIndustry);
        syncSixColumnLocations(locationInput.value);
    });
}

function syncSixColumnLocations(locationValue) {
    const value = (locationValue || "").trim();

    for (let i = 1; i <= 3; i++) {
        const pmLoc = document.getElementById(`pm_loc_${i}`);
        if (pmLoc) pmLoc.value = value;
    }

    for (let i = 1; i <= 6; i++) {
        const soLoc = document.getElementById(`so_loc_${i}`);
        const noLoc = document.getElementById(`no_loc_${i}`);
        if (soLoc) soLoc.value = value;
        if (noLoc) noLoc.value = value;
    }

    const pm25Loc = document.getElementById("pm25_loc_1");
    if (pm25Loc) pm25Loc.value = value;
}

function setupSixColumnLocationBinding() {
    const locationInput = document.getElementById("location");
    if (!locationInput) return;

    const syncHandler = () => syncSixColumnLocations(locationInput.value);
    locationInput.addEventListener("input", syncHandler);
    locationInput.addEventListener("change", syncHandler);
    syncHandler();
}

function syncSamplingTimePair(prefix, index) {
    const startInput = document.getElementById(`${prefix}_time_start_${index}`);
    const endInput = document.getElementById(`${prefix}_time_end_${index}`);
    const combinedInput = document.getElementById(`${prefix}_time_${index}`);

    if (!startInput || !endInput || !combinedInput) return;

    const start = startInput.value;
    const end = endInput.value;

    if (start && end) {
        combinedInput.value = `${start} - ${end}`;
    } else {
        combinedInput.value = start || end || "";
    }
}

function setupSixColumnTimeSync(prefix) {
    for (let i = 1; i <= 6; i++) {
        const startInput = document.getElementById(`${prefix}_time_start_${i}`);
        const endInput = document.getElementById(`${prefix}_time_end_${i}`);

        if (startInput) {
            startInput.addEventListener("input", () => syncSamplingTimePair(prefix, i));
            startInput.addEventListener("change", () => syncSamplingTimePair(prefix, i));
        }

        if (endInput) {
            endInput.addEventListener("input", () => syncSamplingTimePair(prefix, i));
            endInput.addEventListener("change", () => syncSamplingTimePair(prefix, i));
        }

        syncSamplingTimePair(prefix, i);
    }
}

function validateCommonFields() {
    const industry = document.getElementById("industry_name").value.trim();
    const location = document.getElementById("location").value.trim();
    const date = document.getElementById("date").value.trim();

    if (!industry || !location || !date) {
        alert("Please fill Industry, Location and Date first");
        return false;
    }
    return true;
}

function calculatePM10() {
    let pmValues = [];

    for (let i = 1; i <= 3; i++) {
        let q1 = parseFloat(document.getElementById("q1_" + i).value) || 0;
        let q2 = parseFloat(document.getElementById("q2_" + i).value) || 0;
        let w1 = parseFloat(document.getElementById("w1_" + i).value) || 0;
        let w2 = parseFloat(document.getElementById("w2_" + i).value) || 0;

        let T = 480;
        let avg = (q1 + q2) / 2;
        let V = avg * T;
        let dust = w2 - w1;

        let pm = 0;
        if (V !== 0) {
            pm = ((w2 - w1) / V) * Math.pow(10, 6);
        }

        document.getElementById("avg" + i).innerText = avg.toFixed(2);
        document.getElementById("v" + i).innerText = V.toFixed(2);
        document.getElementById("dust" + i).innerText = dust.toFixed(4);
        document.getElementById("pm" + i).innerText = pm.toFixed(2);

        pmValues.push(pm);
    }

    let avgPM = (pmValues[0] + pmValues[1] + pmValues[2]) / 3;
    document.getElementById("avgPM").innerText = avgPM.toFixed(2);
}

function calculateSO2() {
    let soValues = [];

    for (let i = 1; i <= 6; i++) {
        let es = parseFloat(document.getElementById("es" + i).value) || 0;
        let cf = parseFloat(document.getElementById("cf" + i).value) || 0;
        let q = parseFloat(document.getElementById("qso" + i).value) || 0;
        let t = parseFloat(document.getElementById("t" + i).value) || 0;
        let vs = parseFloat(document.getElementById("vs" + i).value) || 0;
        let vt = parseFloat(document.getElementById("vt" + i).value) || 0;

        let A = es * cf;
        let VA = q * t * 60;
        let so2 = (VA !== 0 && vt !== 0) ? (A * vs * 1000) / (VA * vt) : 0;

        document.getElementById("a" + i).innerText = A.toFixed(2);
        document.getElementById("va" + i).innerText = VA.toFixed(2);
        document.getElementById("so" + i).innerText = so2.toFixed(2);

        soValues.push(so2);
    }

    let total = 0;
    for (let i = 0; i < soValues.length; i++) {
        total += soValues[i];
    }

    let avgSO2 = total / soValues.length;
    document.getElementById("avgSO2").innerText = avgSO2.toFixed(2);
}

function calculateNO2() {
    let noValues = [];

    for (let i = 1; i <= 6; i++) {
        let as = parseFloat(document.getElementById("as" + i).value) || 0;
        let cf = parseFloat(document.getElementById("ncf" + i).value) || 0;
        let q = parseFloat(document.getElementById("nq" + i).value) || 0;
        let t = parseFloat(document.getElementById("not" + i).value) || 0;
        let vs = parseFloat(document.getElementById("nvs" + i).value) || 0;
        let vt = parseFloat(document.getElementById("nvt" + i).value) || 0;

        let X = as * cf;
        let Va = q * t * 60;
        let no2 = (Va !== 0 && vt !== 0) ? (X * vs * 1000) / (Va * vt * 0.82) : 0;

        document.getElementById("x" + i).innerText = X.toFixed(2);
        document.getElementById("nva" + i).innerText = Va.toFixed(2);
        document.getElementById("no" + i).innerText = no2.toFixed(2);

        noValues.push(no2);
    }

    let total = 0;
    for (let i = 0; i < noValues.length; i++) {
        total += noValues[i];
    }

    let avgNO2 = total / noValues.length;
    document.getElementById("avgNO2").innerText = avgNO2.toFixed(2);
}

function calculatePM25() {
    let q1 = parseFloat(document.getElementById("pm25_q1_1").value) || 0;
    let q2 = parseFloat(document.getElementById("pm25_q2_1").value) || 0;
    let w1 = parseFloat(document.getElementById("pm25_w1_1").value) || 0;
    let w2 = parseFloat(document.getElementById("pm25_w2_1").value) || 0;

    let T = 1440;

    let avg = (q1 + q2) / 2;
    let V = avg * T;
    let dust = w2 - w1;

    let pm25 = 0;
    if (V !== 0) {
        pm25 = ((w2 - w1) * Math.pow(10, 6)) / V;
    }

    document.getElementById("pm25_avg1").innerText = avg.toFixed(2);
    document.getElementById("pm25_v1").innerText = V.toFixed(2);
    document.getElementById("pm25_dust1").innerText = dust.toFixed(4);
    document.getElementById("pm25_1").innerText = pm25.toFixed(2);
}

function syncSamplingTimeRange(index) {
    const fromInput = document.getElementById(`pm_time_from_${index}`);
    const toInput = document.getElementById(`pm_time_to_${index}`);
    const hiddenInput = document.getElementById(`pm_time_${index}`);
    const errorEl = document.getElementById(`pm_time_error_${index}`);

    if (!fromInput || !toInput || !hiddenInput || !errorEl) {
        return true;
    }

    const fromValue = fromInput.value;
    const toValue = toInput.value;

    fromInput.classList.remove("time-invalid");
    toInput.classList.remove("time-invalid");
    errorEl.innerText = "";

    if (!fromValue && !toValue) {
        hiddenInput.value = "";
        return true;
    }

    if (!fromValue || !toValue) {
        hiddenInput.value = [fromValue, toValue].filter(Boolean).join(" - ");
        errorEl.innerText = "Please select both From and To time.";
        if (!fromValue) fromInput.classList.add("time-invalid");
        if (!toValue) toInput.classList.add("time-invalid");
        return false;
    }

    if (toValue <= fromValue) {
        hiddenInput.value = `${fromValue} - ${toValue}`;
        errorEl.innerText = "To time must be later than From time.";
        fromInput.classList.add("time-invalid");
        toInput.classList.add("time-invalid");
        return false;
    }

    hiddenInput.value = `${fromValue} - ${toValue}`;
    return true;
}

function validateAllSamplingTimeRanges() {
    let isValid = true;
    for (let i = 1; i <= 3; i++) {
        if (!syncSamplingTimeRange(i)) {
            isValid = false;
        }
    }
    return isValid;
}

function setupSamplingTimeRangeControls() {
    for (let i = 1; i <= 3; i++) {
        const fromInput = document.getElementById(`pm_time_from_${i}`);
        const toInput = document.getElementById(`pm_time_to_${i}`);
        if (fromInput) fromInput.addEventListener("input", () => syncSamplingTimeRange(i));
        if (toInput) toInput.addEventListener("input", () => syncSamplingTimeRange(i));
        syncSamplingTimeRange(i);
    }
}

async function savePM10() {
    if (!validateCommonFields()) return;

    if (!validateAllSamplingTimeRanges()) {
        alert("Please correct invalid PM10 sampling time ranges.");
        return;
    }

    calculatePM10();

    const data = {
        industry_name: document.getElementById("industry_name").value,
        location: document.getElementById("location").value,
        monitoring_date: document.getElementById("date").value,

        q1_1: document.getElementById("q1_1").value,
        q2_1: document.getElementById("q2_1").value,
        w1_1: document.getElementById("w1_1").value,
        w2_1: document.getElementById("w2_1").value,

        q1_2: document.getElementById("q1_2").value,
        q2_2: document.getElementById("q2_2").value,
        w1_2: document.getElementById("w1_2").value,
        w2_2: document.getElementById("w2_2").value,

        q1_3: document.getElementById("q1_3").value,
        q2_3: document.getElementById("q2_3").value,
        w1_3: document.getElementById("w1_3").value,
        w2_3: document.getElementById("w2_3").value
    };

    try {
        const res = await fetch("http://localhost:3000/save-pm10", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        alert(result.message || result.error);
    } catch (error) {
        console.log("PM10 Save Error:", error);
        alert("Error saving PM10 data");
    }
}

async function saveSO2() {
    if (!validateCommonFields()) return;

    calculateSO2();

    const data = {
        industry_name: document.getElementById("industry_name").value,
        location: document.getElementById("location").value,
        monitoring_date: document.getElementById("date").value,

        duration_1: document.getElementById("t1").value,
        es_1: document.getElementById("es1").value,
        cf_1: document.getElementById("cf1").value,
        a_1: document.getElementById("a1").innerText,
        q_1: document.getElementById("qso1").value,
        va_1: document.getElementById("va1").innerText,
        vs_1: document.getElementById("vs1").value,
        vt_1: document.getElementById("vt1").value,
        so2_1: document.getElementById("so1").innerText,

        duration_2: document.getElementById("t2").value,
        es_2: document.getElementById("es2").value,
        cf_2: document.getElementById("cf2").value,
        a_2: document.getElementById("a2").innerText,
        q_2: document.getElementById("qso2").value,
        va_2: document.getElementById("va2").innerText,
        vs_2: document.getElementById("vs2").value,
        vt_2: document.getElementById("vt2").value,
        so2_2: document.getElementById("so2").innerText,

        duration_3: document.getElementById("t3").value,
        es_3: document.getElementById("es3").value,
        cf_3: document.getElementById("cf3").value,
        a_3: document.getElementById("a3").innerText,
        q_3: document.getElementById("qso3").value,
        va_3: document.getElementById("va3").innerText,
        vs_3: document.getElementById("vs3").value,
        vt_3: document.getElementById("vt3").value,
        so2_3: document.getElementById("so3").innerText,

        duration_4: document.getElementById("t4").value,
        es_4: document.getElementById("es4").value,
        cf_4: document.getElementById("cf4").value,
        a_4: document.getElementById("a4").innerText,
        q_4: document.getElementById("qso4").value,
        va_4: document.getElementById("va4").innerText,
        vs_4: document.getElementById("vs4").value,
        vt_4: document.getElementById("vt4").value,
        so2_4: document.getElementById("so4").innerText,

        duration_5: document.getElementById("t5").value,
        es_5: document.getElementById("es5").value,
        cf_5: document.getElementById("cf5").value,
        a_5: document.getElementById("a5").innerText,
        q_5: document.getElementById("qso5").value,
        va_5: document.getElementById("va5").innerText,
        vs_5: document.getElementById("vs5").value,
        vt_5: document.getElementById("vt5").value,
        so2_5: document.getElementById("so5").innerText,

        duration_6: document.getElementById("t6").value,
        es_6: document.getElementById("es6").value,
        cf_6: document.getElementById("cf6").value,
        a_6: document.getElementById("a6").innerText,
        q_6: document.getElementById("qso6").value,
        va_6: document.getElementById("va6").innerText,
        vs_6: document.getElementById("vs6").value,
        vt_6: document.getElementById("vt6").value,
        so2_6: document.getElementById("so6").innerText,

        avg_so2: document.getElementById("avgSO2").innerText
    };

    try {
        const res = await fetch("http://localhost:3000/save-so2", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        alert(result.message || result.error);
    } catch (error) {
        console.log("SO2 Save Error:", error);
        alert("Error saving SO2 data");
    }
}

async function saveNO2() {
    if (!validateCommonFields()) return;

    calculateNO2();

    const data = {
        industry_name: document.getElementById("industry_name").value,
        location: document.getElementById("location").value,
        monitoring_date: document.getElementById("date").value,

        duration_1: document.getElementById("not1").value,
        as_1: document.getElementById("as1").value,
        cf_1: document.getElementById("ncf1").value,
        x_1: document.getElementById("x1").innerText,
        q_1: document.getElementById("nq1").value,
        va_1: document.getElementById("nva1").innerText,
        vs_1: document.getElementById("nvs1").value,
        vt_1: document.getElementById("nvt1").value,
        no2_1: document.getElementById("no1").innerText,

        duration_2: document.getElementById("not2").value,
        as_2: document.getElementById("as2").value,
        cf_2: document.getElementById("ncf2").value,
        x_2: document.getElementById("x2").innerText,
        q_2: document.getElementById("nq2").value,
        va_2: document.getElementById("nva2").innerText,
        vs_2: document.getElementById("nvs2").value,
        vt_2: document.getElementById("nvt2").value,
        no2_2: document.getElementById("no2").innerText,

        duration_3: document.getElementById("not3").value,
        as_3: document.getElementById("as3").value,
        cf_3: document.getElementById("ncf3").value,
        x_3: document.getElementById("x3").innerText,
        q_3: document.getElementById("nq3").value,
        va_3: document.getElementById("nva3").innerText,
        vs_3: document.getElementById("nvs3").value,
        vt_3: document.getElementById("nvt3").value,
        no2_3: document.getElementById("no3").innerText,

        duration_4: document.getElementById("not4").value,
        as_4: document.getElementById("as4").value,
        cf_4: document.getElementById("ncf4").value,
        x_4: document.getElementById("x4").innerText,
        q_4: document.getElementById("nq4").value,
        va_4: document.getElementById("nva4").innerText,
        vs_4: document.getElementById("nvs4").value,
        vt_4: document.getElementById("nvt4").value,
        no2_4: document.getElementById("no4").innerText,

        duration_5: document.getElementById("not5").value,
        as_5: document.getElementById("as5").value,
        cf_5: document.getElementById("ncf5").value,
        x_5: document.getElementById("x5").innerText,
        q_5: document.getElementById("nq5").value,
        va_5: document.getElementById("nva5").innerText,
        vs_5: document.getElementById("nvs5").value,
        vt_5: document.getElementById("nvt5").value,
        no2_5: document.getElementById("no5").innerText,

        duration_6: document.getElementById("not6").value,
        as_6: document.getElementById("as6").value,
        cf_6: document.getElementById("ncf6").value,
        x_6: document.getElementById("x6").innerText,
        q_6: document.getElementById("nq6").value,
        va_6: document.getElementById("nva6").innerText,
        vs_6: document.getElementById("nvs6").value,
        vt_6: document.getElementById("nvt6").value,
        no2_6: document.getElementById("no6").innerText,

        avg_no2: document.getElementById("avgNO2").innerText
    };

    try {
        const res = await fetch("http://localhost:3000/save-no2", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        alert(result.message || result.error);
    } catch (error) {
        console.log("NO2 Save Error:", error);
        alert("Error saving NO2 data");
    }
}

async function savePM25() {
    if (!validateCommonFields()) return;

    calculatePM25();

    const data = {
        industry_name: document.getElementById("industry_name").value,
        location: document.getElementById("location").value,
        monitoring_date: document.getElementById("date").value,

        q1: document.getElementById("pm25_q1_1").value,
        q2: document.getElementById("pm25_q2_1").value,
        w1: document.getElementById("pm25_w1_1").value,
        w2: document.getElementById("pm25_w2_1").value
    };

    try {
        const res = await fetch("http://localhost:3000/save-pm25", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        alert(result.message || result.error);
    } catch (error) {
        console.log("PM2.5 Save Error:", error);
        alert("Error saving PM2.5 data");
    }
}

function generateReport() {
    if (!validateCommonFields()) return;

    calculatePM10();
    calculateSO2();
    calculateNO2();
    calculatePM25();

    window.print();
}

function logout() {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userRole");
    window.location.href = "h.html";
}

function updateStepStates(activeItem) {
    const navItems = Array.from(document.querySelectorAll(".nav-item"));
    const activeIndex = navItems.indexOf(activeItem);

    navItems.forEach((item, index) => {
        item.classList.remove("active", "completed", "upcoming");

        if (index < activeIndex) {
            item.classList.add("completed");
        } else if (index === activeIndex) {
            item.classList.add("active");
        } else {
            item.classList.add("upcoming");
        }
    });
}

function openSection(sectionId, clickedItem) {
    const targetSection = document.getElementById(sectionId);
    updateStepStates(clickedItem);

    if (targetSection) {
        targetSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const initialActive = document.querySelector(".nav-item.active") || document.querySelector(".nav-item");
    if (initialActive) {
        updateStepStates(initialActive);
    }

    setupIndustryLocationAutofill();
    setupSamplingTimeRangeControls();
    setupSixColumnLocationBinding();
    setupSixColumnTimeSync("so");
    setupSixColumnTimeSync("no");
    setupSixColumnTimeSync("pm25");
});
