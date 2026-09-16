// ============================================
// Cricket Scorer - Authentication
// ============================================

const USERS_KEY = "cst_users";
const CURRENT_USER_KEY = "cst_current_user";


// --------------------------------------------
// Get registered users
// --------------------------------------------

function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}


// --------------------------------------------
// Save users
// --------------------------------------------

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}


// --------------------------------------------
// Hash password using Web Crypto API
// --------------------------------------------

async function hashPassword(password) {

    const encoder = new TextEncoder();

    const data = encoder.encode(password);

    const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        data
    );

    const hashArray = Array.from(
        new Uint8Array(hashBuffer)
    );

    return hashArray
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}


// --------------------------------------------
// Register
// --------------------------------------------

async function registerUser(name, email, password) {

    const users = getUsers();

    email = email.trim().toLowerCase();

    const existingUser = users.find(
        user => user.email === email
    );

    if (existingUser) {
        throw new Error(
            "An account with this email already exists."
        );
    }

    const passwordHash = await hashPassword(password);

    const newUser = {
        id: Date.now().toString(),
        name: name.trim(),
        email: email,
        password: passwordHash,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);

    saveUsers(users);

    return newUser;
}


// --------------------------------------------
// Login
// --------------------------------------------

async function loginUser(email, password) {

    const users = getUsers();

    email = email.trim().toLowerCase();

    const passwordHash = await hashPassword(password);

    const user = users.find(
        user =>
            user.email === email &&
            user.password === passwordHash
    );

    if (!user) {
        throw new Error(
            "Invalid email or password."
        );
    }

    const sessionUser = {
        id: user.id,
        name: user.name,
        email: user.email
    };

    localStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify(sessionUser)
    );

    return sessionUser;
}


// --------------------------------------------
// Get current logged-in user
// --------------------------------------------

function getCurrentUser() {

    return JSON.parse(
        localStorage.getItem(CURRENT_USER_KEY)
    );
}


// --------------------------------------------
// Check login
// --------------------------------------------

function isLoggedIn() {

    return !!getCurrentUser();
}


// --------------------------------------------
// Logout
// --------------------------------------------

function logout() {

    localStorage.removeItem(CURRENT_USER_KEY);

    window.location.href = "auth.html";
}


// --------------------------------------------
// Protect pages
// --------------------------------------------

function requireAuth() {

    if (!isLoggedIn()) {

        window.location.href = "auth.html";

        return false;
    }

    return true;
}


// --------------------------------------------
// Show Login/Register forms
// --------------------------------------------

function showAuthForm(type) {

    const loginForm =
        document.getElementById("loginForm");

    const registerForm =
        document.getElementById("registerForm");

    const loginTab =
        document.getElementById("loginTab");

    const registerTab =
        document.getElementById("registerTab");

    if (type === "login") {

        loginForm.classList.add("active");
        registerForm.classList.remove("active");

        loginTab.classList.add("active");
        registerTab.classList.remove("active");

    } else {

        registerForm.classList.add("active");
        loginForm.classList.remove("active");

        registerTab.classList.add("active");
        loginTab.classList.remove("active");
    }

    clearAuthMessage();
}


// --------------------------------------------
// Display message
// --------------------------------------------

function showAuthMessage(message, type) {

    const messageBox =
        document.getElementById("authMessage");

    if (!messageBox) return;

    messageBox.textContent = message;

    messageBox.className =
        "auth-message " + type;
}


// --------------------------------------------
// Clear message
// --------------------------------------------

function clearAuthMessage() {

    const messageBox =
        document.getElementById("authMessage");

    if (!messageBox) return;

    messageBox.textContent = "";

    messageBox.className = "auth-message";
}

// --------------------------------------------
// Display current user in navbar
// --------------------------------------------

function displayCurrentUser() {

    const user = getCurrentUser();

    const userNameElement =
        document.getElementById("currentUserName");

    if (!userNameElement || !user) {
        return;
    }

    userNameElement.textContent =
        "👤 " + user.name;
}

// --------------------------------------------
// Login form
// --------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

    displayCurrentUser();

    const loginForm =
        document.getElementById("loginForm");

    const registerForm =
        document.getElementById("registerForm");


    // If already logged in and auth page is opened,
    // send user to dashboard.

    if (
        window.location.pathname.endsWith("auth.html") &&
        isLoggedIn()
    ) {

        window.location.href = "dashboard.html";

        return;
    }


    // LOGIN

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async function(event) {

                event.preventDefault();

                clearAuthMessage();

                const email =
                    document.getElementById("loginEmail")
                        .value;

                const password =
                    document.getElementById("loginPassword")
                        .value;

                try {

                    await loginUser(
                        email,
                        password
                    );

                    showAuthMessage(
                        "Login successful! Redirecting...",
                        "success"
                    );

                    setTimeout(() => {

                        window.location.href =
                            "dashboard.html";

                    }, 700);

                } catch (error) {

                    showAuthMessage(
                        error.message,
                        "error"
                    );
                }
            }
        );
    }


    // REGISTER

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            async function(event) {

                event.preventDefault();

                clearAuthMessage();

                const name =
                    document.getElementById("registerName")
                        .value;

                const email =
                    document.getElementById("registerEmail")
                        .value;

                const password =
                    document.getElementById("registerPassword")
                        .value;

                const confirmPassword =
                    document.getElementById("confirmPassword")
                        .value;


                if (password !== confirmPassword) {

                    showAuthMessage(
                        "Passwords do not match.",
                        "error"
                    );

                    return;
                }


                try {

                    await registerUser(
                        name,
                        email,
                        password
                    );

                    showAuthMessage(
                        "Account created successfully! You can now login.",
                        "success"
                    );

                    registerForm.reset();

                    setTimeout(() => {

                        showAuthForm("login");

                    }, 1000);

                } catch (error) {

                    showAuthMessage(
                        error.message,
                        "error"
                    );
                }
            }
        );
    }

});