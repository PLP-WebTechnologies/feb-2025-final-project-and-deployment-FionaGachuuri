const API_BASE_URL = "http://127.0.0.1:5000";

// Utility function to handle API requests
async function apiRequest(endpoint, method = "GET", body = null, auth = false) {
    const headers = { "Content-Type": "application/json" };
    if (auth) {
        const token = localStorage.getItem("access_token");
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        } else {
            console.error(" No access token found in local storage!");
            return null;
        }
    }
    
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    
    try {
        console.log(`📡 Request: ${method} ${API_BASE_URL}${endpoint}`);
        console.log("Headers:", headers);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (response.status === 401) {
            console.warn("Unauthorized! Redirecting to login...");
            localStorage.removeItem("access_token");
            window.location.href = "/login.html"; 
            return null;
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Request failed");
        return data;
    } catch (error) {
        console.error("API Error:", error.message);
        return null;
    }
}

// User Registration
async function registerUser(username, email, password) {
    const data = await apiRequest("/register", "POST", { username, email, password });
    if (data) alert("Registration successful. You can now log in.");
}

// User Login
async function loginUser(username, password) {
    console.log("logging in...");

    const data = await apiRequest("/api/auth/login", "POST", { username, password });

    if (data && data.access_token) {
        console.log("Login successful", data);
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        alert("Login successful!");
        window.location.href = "dashboard.html";
    } else {
        console.error("Login failed. No token received ")
        alert("Login failed. Please check your credentials.")
    }
}

// Refresh Token (if expired)
async function refreshToken() {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return;
    
    const data = await apiRequest("/refresh-token", "POST", {}, true);
    if (data) localStorage.setItem("access_token", data.access_token);
}

// Create Issue
async function createIssue(title, location, description) {
    console.log("📡 Sending issue data:", { title, location, description });

    const data = await apiRequest("/api/issues", "POST", { title, location, description }, true);
    if (data) {
        console.log("Issue created successfully:", data);
        alert("Issue created successfully");
        window.location.href = "dashboard.html";
    } else {
        console.error("Issue creation failed!")
    }
}

// Fetch Issues
async function getIssues() {
    const issues = await apiRequest("/api/issues", "GET");
    if (!issues || issues.length === 0) {
        console.warn("No issues found.");
        return;
    }

        const issueContainer = document.getElementById("issueslist");
        if (!issueContainer) {
            console.error("Error: Element #issueslist not found in dashboard.html");
            return;
        }

        issueContainer.innerHTML = "";
        issues.forEach(issue => {
            issueContainer.innerHTML += `
                <div class="issue">
                    <h3>${issue.title}</h3>
                    <small>Location: ${issue.location}</small>
                    <p>${issue.description}</p>
                </div>
            `;
        });
    }


// Event Listeners for Forms
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
            loginUser(username, password);
        });
    }
    
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const username = document.getElementById("reg-username").value;
            const email = document.getElementById("reg-email").value;
            const password = document.getElementById("reg-password").value;
            registerUser(username, email, password);
        });
    }
    
    const issueForm = document.getElementById("issue-form");
    if (issueForm) {
        console.log("Issue form found! Adding event listener...");
        issueForm.addEventListener("submit", (event) => {
            event.preventDefault();
            
            const Title = document.getElementById("Title").value.trim();
            const Location = document.getElementById("Location").value.trim();
            const Description = document.getElementById("Description").value.trim();

            console.log("Submitting issue:", { Title, Location, Description });

            if (Title && Location && Description) {
                createIssue(Title, Location, Description);
            } else {
                alert("Please fill in all fields before submitting!");
            }
        });
    } else {
        console.error("Issue form NOT found! Check form ID in report_issue.html.");
    }

    if (document.getElementById("issues-list")) {
        getIssues(); // Load issues when on issues page
    }
});