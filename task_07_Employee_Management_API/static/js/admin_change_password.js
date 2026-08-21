document.addEventListener("DOMContentLoaded", () => {

    document .getElementById("changePasswordForm") .addEventListener("submit", changePassword);

});

async function changePassword(e) {

    e.preventDefault();

    const current_password =document.getElementById("currentPassword").value.trim();

    const new_password =document.getElementById("newPassword").value.trim();

    const confirm_password =document.getElementById("confirmPassword").value.trim();

    if (new_password !== confirm_password) {

        alert("Passwords do not match.");

        return;

    }

    try {

        const response = await fetch("/admin/change-password", {

            method: "PUT",

            credentials: "include",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({current_password,new_password,confirm_password})

        });

        const data = await response.json();

        if (!data.success) {

            alert(data.message);

            return;

        }

        alert("Password updated successfully.");

        window.location.href = "/admin/profile-page";

    }

    catch (error) {

        console.error(error);

        alert("Unable to change password.");

    }

}