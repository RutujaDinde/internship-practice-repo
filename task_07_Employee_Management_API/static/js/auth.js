// ================= AUTH FETCH =================

async function authFetch(url, options = {}) {

    options.credentials = "include";

    let response = await fetch(url, options);

    // Access token expired
    if (response.status === 401) {

        const refreshResponse = await fetch("/refresh", {
            method: "POST",
            credentials: "include"
        });

        if (refreshResponse.ok) {

            response = await fetch(url, {
                ...options,
                credentials: "include"
            });

        } else {

            window.location.replace("/login-page");

            return null;
        }
    }

    return response;
}


// ================= CHECK LOGIN =================

async function checkLogin(profileUrl) {

    try {

        const response = await authFetch(profileUrl);

        if (!response || !response.ok) {

            window.location.replace("/login-page");

            return false;
        }

        return true;

    } catch (error) {

        console.error("Login check failed:", error);

        window.location.replace("/login-page");

        return false;
    }
}


// ================= LOGOUT =================

async function logout() {

    const confirmLogout = confirm("Are you sure you want to logout?");

    if (!confirmLogout) {
        return;
    }

    try {

        const response = await authFetch("/logout", {
            method: "POST"
        });

        if (!response) {
            return;
        }

        const data = await response.json();

        if (data.success) {

            window.location.replace("/login-page");

        } else {

            alert(data.message);
        }

    } catch (error) {

        console.error("Logout failed:", error);

        alert("Logout failed.");
    }
}