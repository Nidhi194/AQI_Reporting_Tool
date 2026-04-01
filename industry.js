 (function guardIndustryOnboarding() {
    if (typeof document === "undefined" || !document.getElementById("industry_name")) {
        return;
    }
    const email = localStorage.getItem("userEmail");
    if (!email) {
        window.location.href = "h.html";
        return;
    }
    fetch(`http://localhost:3000/industry-onboarding-status?user_email=${encodeURIComponent(email)}`)
        .then((r) => r.json())
        .then((data) => {
            if (data && data.complete) {
                window.location.href = "industry-reports.html";
            }
        })
        .catch(() => {});
})();

function logout() {
    localStorage.removeItem("userEmail");
    window.location.replace("h.html");
}

function openSection(sectionId, clickedItem) {
    document.getElementById(sectionId).scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });

    clickedItem.classList.add("active");
}

function updateProgress() {
    const fieldIds = [
        "industry_name",
        "industry_type",
        "industry_id",
        "address",
        "contact_name",
        "role_designation",
        "email",
        "phone",
        "alt_phone",
        "monitoring_frequency",
        "notification_pref"
    ];

    let filled = 0;

    fieldIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value.trim() !== "") {
            filled++;
        }
    });

    const percent = Math.round((filled / fieldIds.length) * 100);
    document.getElementById("progressFill").style.width = percent + "%";
    document.getElementById("progressText").innerText = percent + "%";
}

document.querySelectorAll("input, select, textarea").forEach(el => {
    el.addEventListener("input", updateProgress);
    el.addEventListener("change", updateProgress);
});

function highlightSectionByField(fieldName) {
    const industryFields = ["industry_name", "industry_type", "industry_id", "address"];
    const contactFields = ["contact_name", "role_designation", "email", "phone", "alt_phone"];
    const complianceFields = ["monitoring_frequency", "notification_pref"];

    if (industryFields.includes(fieldName)) {
        document.getElementById("industrySection").scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveSidebar(0);
    } else if (contactFields.includes(fieldName)) {
        document.getElementById("contactSection").scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveSidebar(1);
    } else if (complianceFields.includes(fieldName)) {
        document.getElementById("complianceSection").scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveSidebar(2);
    }
}

function setActiveSidebar(index) {
    const items = document.querySelectorAll(".nav-item");
    items.forEach(item => item.classList.remove("active"));
    if (items[index]) {
        items[index].classList.add("active");
    }
}

async function saveData() {
    let userEmail = localStorage.getItem("userEmail");

    let data = {
        user_email: userEmail,
        industry_name: document.getElementById("industry_name").value.trim(),
        industry_type: document.getElementById("industry_type").value.trim(),
        industry_id: document.getElementById("industry_id").value.trim(),
        address: document.getElementById("address").value.trim(),
        contact_name: document.getElementById("contact_name").value.trim(),
        role_designation: document.getElementById("role_designation").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        alt_phone: document.getElementById("alt_phone").value.trim(),
        monitoring_frequency: document.getElementById("monitoring_frequency").value.trim(),
        notification_pref: document.getElementById("notification_pref").value.trim()
    };

    let missingFields = [];

    if (!data.user_email) missingFields.push({ key: "user_email", label: "User Login Email" });
    if (!data.industry_name) missingFields.push({ key: "industry_name", label: "Industry Name" });
    if (!data.industry_type) missingFields.push({ key: "industry_type", label: "Industry Type" });
    if (!data.industry_id) missingFields.push({ key: "industry_id", label: "Industry ID / Registration Number" });
    if (!data.address) missingFields.push({ key: "address", label: "Location / Address" });
    if (!data.contact_name) missingFields.push({ key: "contact_name", label: "Contact Person Name" });
    if (!data.role_designation) missingFields.push({ key: "role_designation", label: "Role / Designation" });
    if (!data.email) missingFields.push({ key: "email", label: "Email ID" });
    if (!data.phone) missingFields.push({ key: "phone", label: "Primary Phone Number" });
    if (!data.monitoring_frequency) missingFields.push({ key: "monitoring_frequency", label: "AQI Monitoring Frequency" });
    if (!data.notification_pref) missingFields.push({ key: "notification_pref", label: "Notification Preference" });

    if (missingFields.length > 0) {
        highlightSectionByField(missingFields[0].key);
        alert("Please fill the following required fields:\n\n" + missingFields.map(field => field.label).join("\n"));
        return;
    }

    try {
        let res = await fetch("http://localhost:3000/save-industry", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        let result = await res.json();

        if (result.error) {
            alert(result.error);
            return;
        }

        alert(result.message || "Profile saved successfully");
        window.location.href = "industry-reports.html";
    } catch (error) {
        console.log(error);
        alert("Server connection error");
    }
}
