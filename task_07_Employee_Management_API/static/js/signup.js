document.getElementById("SignupForm").addEventListener("submit", async function (e) {

    e.preventDefault();

    const message = document.getElementById("message");

    const formData = new FormData();

    formData.append( "Emp_Name", document.getElementById("Emp_Name").value);

    formData.append( "Email", document.getElementById("Email").value );

    formData.append(  "Password",  document.getElementById("Password").value);

    formData.append("Phone_No",document.getElementById("Phone_No").value );

    formData.append( "Address", document.getElementById("Address").value );

    formData.append( "City", document.getElementById("City").value);

    // Profile Image (optional)

    const image = document.getElementById("Profile_Image").files[0];


    if (image) {
        formData.append(  "Profile_Image", image );
    }

    try {

        const response = await fetch("/signup", {

            method: "POST",

            body: formData

        });
        const result = await response.json();

        if (result.success) {

            message.style.color = "green";

            message.innerText = result.message;

            setTimeout(() => {

                window.location.href = "/login-page";

            },1500);

        } 
        else {

            message.style.color = "red";

            message.innerText = result.message || "Signup failed";

        }

    } catch(error) {

        console.error(error);

        message.style.color = "red";

        message.innerText = "Server Error";

    }

});