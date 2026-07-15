document.getElementById("loginForm")
.addEventListener("submit", async function(event){

    event.preventDefault();

    const loginData = {

        Email: document.getElementById("Email").value,

        Password: document.getElementById("Password").value

    };

    try {

        const response = await fetch("/login", {method:"POST",
            headers:{
                "Content-Type":"application/json"},

            body:JSON.stringify(loginData)

        });

        const result = await response.json();

        if(response.ok){

            alert(result.message);

            window.location.href="/";

        }

        else{
            document.getElementById("message").innerHTML = result.message;

        }
    }


    catch(error){

        document.getElementById("message").innerHTML ="Unable to connect to server.";

        console.log(error);
    }

});