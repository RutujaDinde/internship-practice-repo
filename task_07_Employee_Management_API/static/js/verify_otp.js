document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("verifyOTPForm");

    form.addEventListener("submit", async function (e) {

        e.preventDefault();

        const Email = document.getElementById("Email").value.trim();

        const OTP = document.getElementById("OTP").value.trim();

        try {

            const response = await fetch("/verify-otp", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                // If your backend sets the reset_token cookie,
                // this allows the browser to store it.
                credentials: "same-origin",

                body: JSON.stringify({

                    Email: Email,

                    OTP: OTP

                })

            });

            const data = await response.json();

            if (response.ok) {

                alert(data.message);

                window.location.href = "/reset-password-page";

            } else {

                alert(data.message || "OTP verification failed.");

            }

        } catch (error) {

            console.error(error);

            alert("Something went wrong. Please try again.");

        }

    });

});