const TOKEN_KEY = "access_token";
const currentPath = window.location.pathname;
const authPage = currentPath === "/login" || currentPath === "/register";
const protectedPage = currentPath === "/home" || currentPath === "/profile";

function showMessage(message, isError = false) {
    const element = document.getElementById("message");
    if (!element) return;
    element.textContent = message;
    element.dataset.error = String(isError);
}

async function apiRequest(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (options.body) headers.set("Content-Type", "application/json");

    const response = await fetch(path, { ...options, headers });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401 && protectedPage) {
            sessionStorage.removeItem(TOKEN_KEY);
            redirectToLogin();
        }
        const error = new Error(result.detail || "The request failed.");
        error.status = response.status;
        throw error;
    }
    return result;
}

async function hasValidSession() {
    try {
        await apiRequest("/api/auth/me");
        return true;
    } catch (error) {
        if (error.status === 401) {
            sessionStorage.removeItem(TOKEN_KEY);
            return false;
        }
        throw error;
    }
}

function redirectToLogin() {
    window.location.replace("/login");
}

async function handleLogout() {
    try {
        await apiRequest("/api/auth/logout", { method: "POST" });
    } catch (error) {
        console.error("Could not invalidate the server session:", error);
    } finally {
        sessionStorage.removeItem(TOKEN_KEY);
        window.location.replace("/login");
    }
}

async function initializeAuthPage() {
    const registrationMessage = sessionStorage.getItem("registration_message");
    if (registrationMessage && currentPath === "/login") {
        showMessage(registrationMessage);
        sessionStorage.removeItem("registration_message");
    }

    if (!sessionStorage.getItem(TOKEN_KEY)) return;
    try {
        if (await hasValidSession()) {
            window.location.replace("/home");
        }
    } catch {
        showMessage("Unable to verify your session. Please try again.", true);
    }
}

async function initializeProfile() {
    const form = document.getElementById("profile-form");
    try {
        const profile = await apiRequest("/api/profile/");
        form.elements.name.value = profile.name || "";
        form.elements.phone_number.value = profile.phone_number || "";
        form.elements.date_of_birth.value = profile.date_of_birth || "";
        form.elements.gender.value = profile.gender;
        form.elements.is_jss_student.value = String(profile.is_jss_student);
        form.elements.address.value = profile.address;
        form.elements.branch.value = profile.branch;

        for (const hobby of profile.hobbies) {
            const checkbox = form.querySelector(`input[name="hobbies"][value="${CSS.escape(hobby)}"]`);
            if (checkbox) checkbox.checked = true;
        }
        for (const interest of profile.interests) {
            const checkbox = form.querySelector(`input[name="interests"][value="${CSS.escape(interest)}"]`);
            if (checkbox) checkbox.checked = true;
        }

        displayProfile(profile);
    } catch (error) {
        if (error.status === 404) {
            form.hidden = false;
        } else {
            showMessage(error.message, true);
        }
    }
}

function displayProfile(profile) {
    const values = {
        name: profile.name,
        "phone-number": profile.phone_number || "Not provided",
        "date-of-birth": profile.date_of_birth || "Not provided",
        gender: profile.gender,
        "jss-student": profile.is_jss_student ? "Yes" : "No",
        hobbies: profile.hobbies.length ? profile.hobbies.join(", ") : "None selected",
        interests: profile.interests.length ? profile.interests.join(", ") : "None selected",
        address: profile.address,
        branch: profile.branch,
    };

    for (const [field, value] of Object.entries(values)) {
        document.getElementById(`profile-${field}`).textContent = value;
    }

    document.getElementById("profile-form").hidden = true;
    document.getElementById("profile-view").hidden = false;
}

function setupLoginForm() {
    const form = document.getElementById("login-form");
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        showMessage("");
        const values = new FormData(form);

        try {
            const result = await apiRequest("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: values.get("email"),
                    password: values.get("password"),
                }),
            });
            sessionStorage.setItem(TOKEN_KEY, result.access_token);
            window.location.replace("/home");
        } catch (error) {
            showMessage(error.message, true);
        }
    });
}

function setupRegisterForm() {
    const form = document.getElementById("register-form");
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        showMessage("");
        const values = new FormData(form);

        try {
            await apiRequest("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    email: values.get("email"),
                    password: values.get("password"),
                }),
            });
            sessionStorage.setItem("registration_message", "Account created. Please log in.");
            window.location.replace("/login");
        } catch (error) {
            showMessage(error.message, true);
        }
    });
}

function setupProfileForm() {
    const form = document.getElementById("profile-form");
    document.getElementById("edit-profile-button").addEventListener("click", () => {
        document.getElementById("profile-view").hidden = true;
        form.hidden = false;
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        showMessage("");
        const values = new FormData(form);

        const profile = {
            name: values.get("name"),
            phone_number: values.get("phone_number"),
            date_of_birth: values.get("date_of_birth"),
            gender: values.get("gender"),
            is_jss_student: values.get("is_jss_student") === "true",
            hobbies: values.getAll("hobbies"),
            interests: values.getAll("interests"),
            address: values.get("address"),
            branch: values.get("branch"),
        };

        try {
            const savedProfile = await apiRequest("/api/profile/", {
                method: "PUT",
                body: JSON.stringify(profile),
            });
            displayProfile(savedProfile);
            showMessage("Profile saved.");
        } catch (error) {
            if (error.status === 401) {
                redirectToLogin();
                return;
            }
            showMessage(error.message, true);
        }
    });
}

async function startApp() {
    localStorage.removeItem(TOKEN_KEY);
    if (authPage) {
        await initializeAuthPage();
        if (currentPath === "/login") setupLoginForm();
        if (currentPath === "/register") setupRegisterForm();
        return;
    }

    if (!protectedPage) return;
    const logoutButton = document.getElementById("logout-button");
    logoutButton.addEventListener("click", handleLogout);

    if (!sessionStorage.getItem(TOKEN_KEY)) {
        redirectToLogin();
        return;
    }

    try {
        if (!(await hasValidSession())) {
            redirectToLogin();
            return;
        }
    } catch {
        showMessage("Unable to verify your session. Please try again.", true);
        return;
    }

    if (currentPath === "/profile") {
        setupProfileForm();
        await initializeProfile();
    } else {
        await initializeHome();
    }
}

async function initializeHome() {
    try {
        const user = await apiRequest("/api/auth/me");
        document.getElementById("user-email").textContent = user.email;

        try {
            const profile = await apiRequest("/api/profile/");
            document.getElementById("user-name").textContent = profile.name;
        } catch (error) {
            if (error.status !== 404) throw error;
            showMessage("Add your profile details from the Profile page.");
        }
    } catch (error) {
        showMessage(error.message, true);
    }
}

startApp();
