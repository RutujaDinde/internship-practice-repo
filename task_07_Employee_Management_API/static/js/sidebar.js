// =====================================================
// SIDEBAR PROFILE
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    loadSidebarProfile();

});

async function loadSidebarProfile() {

    try {

        const response = await fetch("/admin/profile", {

            method: "GET",

            credentials: "include"

        });

        const data = await response.json();

        if (!data.success) {

            return;

        }

        const admin = data.admin;

        // ================= NAME =================

        const name = document.getElementById("sidebarAdminName");

        const designation= document.getElementById("sidebarAdminDesignation");

        if (name) {

            name.innerText = admin.Name || "Admin";

        }

        if (designation) {

            designation.innerText = admin.Designation || "Administrator";

        }

        // ================= IMAGE =================

        const image = document.getElementById("sidebarAdminImage");

        if (image) {

            image.src = admin.Profile_Image  ? "/static/uploads/" +  admin.Profile_Image +  "?t=" +  Date.now()  : "/static/uploads/default.png";

            image.onerror = function () {

                this.src = "/static/uploads/default.png";

            };

        }

    }

    catch (error) {

        console.error("Sidebar Profile Error:", error);

    }

}