document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("forgotPasswordForm");

    form.addEventListener("submit", async function (e) {

        e.preventDefault();

        const Email = document.getElementById("Email").value.trim();

        try {

            const response = await fetch("/forgot-password", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    Email: Email
                })

            });

            const data = await response.json();

            if (response.ok) {

                alert(data.message);

                window.location.href = "/verify-otp-page";

            } else {

                alert(data.message || "Failed to send OTP.");

            }

        } catch (error) {

            alert("Something went wrong. Please try again.");

            console.error(error);

        }

    });

});