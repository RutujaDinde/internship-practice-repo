document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("resetPasswordForm");

    form.addEventListener("submit", async function (e) {

        e.preventDefault();

        const New_Password = document.getElementById("New_Password").value.trim();

        const Confirm_Password = document .getElementById("Confirm_Password") .value .trim();

        try {

            const response = await fetch("/reset-password", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "same-origin",

                body: JSON.stringify({New_Password,Confirm_Password })

            });

            const data = await response.json();

            if (response.ok) {

                alert(data.message);

                window.location.href = "/login-page";

            } else {

                if (data.errors) {

                    const firstError = Object.values(data.errors)[0][0];

                    alert(firstError);

                } else {

                    alert(data.message);

                }

            }

        } catch (error) {

            console.error(error);

            alert("Something went wrong. Please try again.");

        }

    });

});