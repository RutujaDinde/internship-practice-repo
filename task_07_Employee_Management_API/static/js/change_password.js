document.addEventListener("DOMContentLoaded", function () {

    const form =document.getElementById("changePasswordForm");

    form.addEventListener("submit", changePassword);

});

async function changePassword(e) {

    e.preventDefault();

    const data = {

        Current_Password:document.getElementById("Current_Password").value,

        New_Password: document.getElementById("New_Password").value,

        Confirm_Password: document.getElementById("Confirm_Password").value

    };

    try {

        const response = await fetch(
            "/employee/change-password",
            {
                method: "PUT",

                credentials: "include",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)
            }
        );

        const result = await response.json();

        if (!result.success) {

            alert(result.message);

            return;

        }

        alert(result.message);

        document .getElementById("changePasswordForm").reset();

    }

    catch (error) {

        console.error(error);

        alert("Unable to change password.");

    }

}