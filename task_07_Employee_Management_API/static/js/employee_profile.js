
// EMPLOYEE PROFILE + EDIT PROFILE

document.addEventListener("DOMContentLoaded", () => {

    // ================= PROFILE PAGE =================

    if (document.getElementById("name")) {
        loadEmployeeProfile();
    }

    // ================= EDIT PROFILE PAGE =================

    if (document.getElementById("editProfileForm")) {

        loadEditProfile();

        const imageInput = document.getElementById("Profile_Image");

        if (imageInput) {
            imageInput.addEventListener("change", previewImage);
        }

        document  .getElementById("editProfileForm") .addEventListener("submit", updateProfile);}

});


// =====================================================
// LOAD EMPLOYEE PROFILE
// =====================================================

async function loadEmployeeProfile() {
    try {

        const response = await fetch("/employee/profile", {

            method: "GET",

            credentials: "include"

        });

        const data = await response.json();

        if (!data.success) {

            alert(data.message);

            return;

        }

        const emp = data.employee;

        document.getElementById("empId").textContent = emp.Emp_ID || "-";

        document.getElementById("name").textContent =emp.Emp_Name || "-";

        document.getElementById("email").textContent =emp.Email || "-";

        document.getElementById("phone").textContent =emp.Phone_No || "-";

        document.getElementById("city").textContent =emp.City || "-";

        document.getElementById("address").textContent =emp.Address || "-";

        document.getElementById("tableDepartment").textContent =emp.Department || "-";

        document.getElementById("tableDesignation").textContent = emp.Designation || "-";

        document.getElementById("hire").textContent =emp.Hire_Date || "-";

        document.getElementById("status").textContent =emp.Employment_Status || "-";

        document.getElementById("leftDepartment").textContent =emp.Department || "-";

        document.getElementById("leftDesignation").textContent =emp.Designation || "-";

        document.getElementById("leftStatus").textContent =emp.Employment_Status || "-";

        const profileImage = document.getElementById("profile_Image");

        if (profileImage) {

            profileImage.src = emp.Profile_Image
                ? "/static/uploads/" +
                  emp.Profile_Image +
                  "?t=" +
                  Date.now()
                : "/static/uploads/default.png";

            profileImage.onerror = function () {

                this.src = "/static/uploads/default.png";

            };

            


//             // ================= TOPBAR =================

//         const topName = document.getElementById("topName");

//         if (topName) {

//             topName.innerText = emp.Emp_Name;

//         }

//         const topRole = document.querySelector(".user small");

//         if (topRole) {

//             topRole.innerText = emp.Role || "Employee";

//         }

//             const topImage = document.querySelector(".user img");

//             if (topImage) {

//                 topImage.src = emp.Profile_Image
//                     ? "/static/uploads/" + emp.Profile_Image + "?t=" + Date.now()
//                     : "/static/uploads/default.png";

//                 topImage.onerror = function () {

//                     this.src = "/static/uploads/default.png";

//                 };

//             }

      }

  }

  catch (error) {

        console.error("Profile Load Error:", error);

}

}

// ========================= LOAD EDIT PROFILE============================

async function loadEditProfile() {

    try {

        const response = await fetch("/employee/profile", {

            method: "GET",

            credentials: "include"

        });

        const data = await response.json();

        if (!data.success) {

            alert(data.message);

            return;

        }

        const emp = data.employee;

        document.getElementById("Phone_No").value = emp.Phone_No || "";

        document.getElementById("City").value =emp.City || "";

        document.getElementById("Address").value =emp.Address || "";

        const profileImage = document.getElementById("profile_Image");

        if (profileImage) {

            profileImage.src = emp.Profile_Image
                ? "/static/uploads/" +
                  emp.Profile_Image +
                  "?t=" +
                  Date.now()
                : "/static/uploads/default.png";

            profileImage.onerror = function () {

                this.src = "/static/uploads/default.png";

            };

        }

    }

    catch (error) {

        console.error("Edit Profile Load Error:", error);

    }

}


// ========================IMAGE PREVIEW=============================


function previewImage() {

    const file =document.getElementById("Profile_Image").files[0];

    if (!file) return;

    document.getElementById("profile_Image").src = URL.createObjectURL(file);

}


// ======================== UPDATE PROFILE=============================



async function updateProfile(e) {

    e.preventDefault();

    const formData = new FormData();

    formData.append("Phone_No",document.getElementById("Phone_No").value.trim() );

    formData.append(  "City",  document.getElementById("City").value.trim() );

    formData.append(  "Address",  document.getElementById("Address").value.trim());

    const fileInput =document.getElementById("Profile_Image");

    if (fileInput.files.length > 0) {

        formData.append(

            "Profile_Image",

            fileInput.files[0]

        );

    }

    try {

        const response = await fetch("/employee/profile", {

            method: "PUT",

            credentials: "include",

            body: formData

        });

        const data = await response.json();

        console.log(data);

        if (!data.success) {

            alert(data.message);

            return;

        }

        alert("Profile Updated Successfully");

        window.location.href = "/employee-profile?reload=" + Date.now();

    }

    catch (error) {

        console.error("Update Error:", error);

        alert("Unable to update profile.");

    }

}


// ========================= EDIT PROFILE============================

function editProfile() {

    window.location.href =  "/employee-edit-profile";

}


// ========================== BACK TO PROFILE===========================


function backProfile() {

    window.location.href = "/employee-profile?reload=" + Date.now();

}