document.getElementById("signupForm").addEventListener("submit", async function (event) {

    event.preventDefault();

    const employee = {

        Emp_Name: document.getElementById("Emp_Name").value,
        Email: document.getElementById("Email").value,
        Password: document.getElementById("Password").value,
        Department: document.getElementById("Department").value,
        City: document.getElementById("City").value,
        Salary: document.getElementById("Salary").value,
        Hire_Date: document.getElementById("Hire_Date").value

    };

    try {

        const response = await fetch("/signup", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(employee)

        });

        const result = await response.json();

        if (response.ok) {

            alert(result.message);
            window.location.href = "/login-page";

        } else {

            if (result.errors) {

                document.getElementById("message").innerHTML = JSON.stringify(result.errors);

            } else {

                document.getElementById("message").innerHTML =result.message;

            }

        }

    } catch (error) {

        document.getElementById("message").innerHTML = "Unable to connect to server.";

    }

});