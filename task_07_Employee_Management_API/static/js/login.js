document.getElementById("loginForm").addEventListener("submit", async function (event) {

    event.preventDefault();

    const loginData = {

        Email: document.getElementById("Email").value.trim(),

        Password: document.getElementById("Password").value

    };

    try {

        const response = await fetch("/login", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            credentials: "include",

            body: JSON.stringify(loginData)

        });

        const result = await response.json();

        if (response.ok && result.success) {

            alert(result.message);

            window.location.href = result.dashboard;

        } 
        
        else {

            alert(result.message || "Login Failed");

        }

    } 
    
    catch (error) {

        console.error("Login Error:", error);

        alert("Server Error");

    }

});