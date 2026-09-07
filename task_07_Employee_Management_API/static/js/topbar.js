
// COMMON TOPBAR

document.addEventListener("DOMContentLoaded", () => {

    loadCurrentEmployee();

});


async function loadCurrentEmployee() {

    try {

        const response = await fetch(   "/employee/profile",
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        if (!data.success) {
            return;
        }

        const emp = data.employee;


        // ================= TOPBAR NAME =================

        const topName = document.getElementById("topName");

        if (topName) {

            topName.innerText = emp.Emp_Name || "Employee";

        }


        // ================= TOPBAR ROLE =================

        const topRole = document.querySelector(".user small");

        if (topRole) {

            topRole.innerText = emp.Role || "Employee";

        }


        // ================= TOPBAR IMAGE =================

        const topImage = document.querySelector(".user img");

        if (topImage) {

            topImage.src = emp.Profile_Image
                ? "/static/uploads/" +
                  emp.Profile_Image +
                  "?t=" +
                  Date.now()
                : "/static/uploads/default.png";


            topImage.onerror = function () {

                this.src = "/static/uploads/default.png";

            };

        }

    }

    catch (error) {

        console.error(
            "Topbar Load Error:",
            error
        );

    }

}