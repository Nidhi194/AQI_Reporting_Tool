// SWITCH FORMS
function showRegister() {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registerForm").style.display = "block";
    document.getElementById("title").innerText = "Sign Up";
    document.getElementById("result").innerText = "";
    document.getElementById("result").style.color = "#dc2626";
}

function showLogin() {
    document.getElementById("registerForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("title").innerText = "Login";
    document.getElementById("result").innerText = "";
    document.getElementById("result").style.color = "#dc2626";
}

// REGISTER
async function register() {
    let email = document.getElementById("regEmail").value.trim();
    let password = document.getElementById("regPassword").value.trim();
    let confirmPassword = document.getElementById("confirmPassword").value.trim();
    let role = document.getElementById("role").value;

    if (!email || !password || !confirmPassword || !role) {
        alert("Please fill all fields");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    try {
        let res = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password, role })
        });

        let data = await res.json();

        if (data.error) {
            document.getElementById("result").style.color = "#dc2626";
            document.getElementById("result").innerText = data.error;
        } else {
            document.getElementById("result").style.color = "#16a34a";
            document.getElementById("result").innerText = data.message;
            alert(data.message);

            document.getElementById("regEmail").value = "";
            document.getElementById("regPassword").value = "";
            document.getElementById("confirmPassword").value = "";
            document.getElementById("role").value = "";

            showLogin();
        }
    } catch (error) {
        console.log(error);
        document.getElementById("result").style.color = "#dc2626";
        document.getElementById("result").innerText = "Server connection error";
    }
}

// LOGIN
async function login() {
    let email = document.getElementById("loginEmail").value.trim();
    let password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
        document.getElementById("result").style.color = "#dc2626";
        document.getElementById("result").innerText = "Please enter email and password";
        return;
    }

    try {
        let res = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        let data = await res.json();

        if (data.success) {
            localStorage.setItem("userEmail", data.email);

            if (data.role === "Industry") {
                if (data.industryProfileComplete) {
                    window.location.href = "industry-reports.html";
                } else {
                    window.location.href = "industry.html";
                }
            } else if (data.role === "Monitoring Agency") {
                window.location.href = "agency.html";
            } else {
                document.getElementById("result").style.color = "#dc2626";
                document.getElementById("result").innerText = "Unknown role";
            }
        } else {
            document.getElementById("result").style.color = "#dc2626";
            document.getElementById("result").innerText = data.error || "Invalid login";
        }
    } catch (error) {
        console.log(error);
        document.getElementById("result").style.color = "#dc2626";
        document.getElementById("result").innerText = "Server connection error";
    }
}
