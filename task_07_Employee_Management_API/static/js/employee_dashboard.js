
// EMPLOYEE DASHBOARD JS

// ================= PAGE LOAD =================

document.addEventListener("DOMContentLoaded", function () {

    loadEmployeeDashboard();

});



// =========================LOAD EMPLOYEE DASHBOARD DATA============================

async function loadEmployeeDashboard() {

    try {

        const response = await fetch("/employee/profile", {

            method: "GET",
            credentials: "include"

        });

        const data = await response.json();

        console.log("Employee Profile:", data);

        if (!data.success) {

            alert(data.message);
            return;

        }

        const emp = data.employee;

        // ======================== WELCOME=========================
        

        setText("welcomeName", emp.Emp_Name);


        // =======================STATISTICS==========================
        

        setText("empId", emp.Emp_ID);

        setText("dashDepartment", emp.Department);

        setText("dashDesignation", emp.Designation);

        const status = document.getElementById("dashStatus");

        if (status) {

            status.innerText = emp.Employment_Status || "Active";

            status.classList.remove(
                "bg-success",
                "bg-danger",
                "bg-warning"
            );

            if (emp.Employment_Status === "Active") {

                status.classList.add("bg-success");

            }

            else {

                status.classList.add("bg-danger");

            }

        }

        // =======================EMPLOYEE INFORMATION==========================

        setText("email", emp.Email);

        setText("phone", emp.Phone_No);

        setText("city", emp.City);

        if (emp.Hire_Date) {

            const date = new Date(emp.Hire_Date);

            setText( "hireDate", date.toLocaleDateString() );

        }

        else {

            setText("hireDate", "-");

        }

        // ====================== PROFILE IMAGE===========================


        const profileImage = document.getElementById("profileImage");

        if (profileImage) {

            profileImage.src = emp.Profile_Image
                ? "/static/uploads/" + emp.Profile_Image + "?t=" + Date.now()
                : "/static/uploads/default.png";

            profileImage.onerror = function () {

                this.src = "/static/uploads/default.png";

            };

        }

    }

    catch (error) {

        console.error("Dashboard Error:", error);

        alert("Unable to load dashboard.");

    }

}

// =========================COMMON FUNCTION============================


function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {

        element.innerText = value || "-";

    }

}

// ==========================QUICK ACTIONS===========================

function openProfile() {

    window.location.href = "/employee-profile";

}

function editProfile() {

    window.location.href = "/employee-edit-profile";

}

function changePassword() {

    window.location.href = "/employee-change-password";

}