
document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const eyeIcon = document.getElementById("eyeIcon");

    // PASSWORD TOGGLE

    window.togglePassword = function () {

        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            eyeIcon.classList.remove("fa-eye");
            eyeIcon.classList.add("fa-eye-slash");

        } else {

            passwordInput.type = "password";

            eyeIcon.classList.remove("fa-eye-slash");
            eyeIcon.classList.add("fa-eye");

        }
    };

    // LOGIN
    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;


        // Check values before sending
        console.log("EMAIL:", JSON.stringify(email));
        console.log("PASSWORD:", JSON.stringify(password));
        console.log("PASSWORD LENGTH:", password.length);


        // Validation
        if (!email || !password) {

            alert("Please enter email and password.");

            return;
        }
        // Request data
        const loginData = {
            Email: email,
            Password: password
        };

        console.log("REQUEST BODY:", loginData);

        try {

            const response = await fetch("/users/login", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include",

                body: JSON.stringify(loginData)

            });


            console.log("STATUS:", response.status);

            const result = await response.json();

            console.log("RESPONSE:", result);

            // LOGIN SUCCESS

            if (response.ok && result.success === true) {

                alert(result.message);

                window.location.href = result.dashboard;

                return;
            }

            // LOGIN FAILED
    
            alert(result.message || "Login failed.");

        }

        catch (error) {

            console.error("LOGIN ERROR:", error);

            alert("Server Error");

        }

    });

});

