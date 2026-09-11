document.addEventListener("DOMContentLoaded", function () {

    //  ELEMENTS 

    const headerUserName = document.getElementById("headerUserName");
    const headerUserRole = document.getElementById("headerUserRole");
    const logoutBtn = document.getElementById("logoutBtn");


    //LOAD LOGGED-IN USER 

    async function loadCurrentUser() {

        try {

            const response = await fetch("/users/profile", {
                method: "GET",
                credentials: "include"
            });

            if (!response.ok) {

                console.error("Unable to get logged-in user");
                return;

            }

            const data = await response.json();

            const user = data.user;

            if (!user) {
                return;
            }


            // ================= DISPLAY USER NAME =================

            if (headerUserName) {

                headerUserName.textContent =  user.Name || "User";

            }


            // ================= DISPLAY USER ROLE =================

            if (headerUserRole) {

                headerUserRole.textContent = user.role.Role_Name || "User";

            }

        }

        catch (error) {

            console.error(  "Profile API error:",   error );

        }

    }


    // ================= LOGOUT =================

    async function logout() {

        try {

            const response = await fetch("/users/logout", {
                method: "POST",
                credentials: "include"
            });

            if (response.ok) {

                window.location.href =  "/users/login-page";

            }

            else {

                console.error(  "Logout failed"  );

            }

        }

        catch (error) {

            console.error(  "Logout error:",  error );

        }

    }


    // ================= LOGOUT BUTTON =================

    if (logoutBtn) {

        logoutBtn.addEventListener( "click", logout  );

    }

    // ================= INITIAL LOAD =================

    loadCurrentUser();

});