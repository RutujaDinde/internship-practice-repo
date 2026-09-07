
// ======================SIDEBAR===============================


document.addEventListener("DOMContentLoaded", () => {

    loadSidebarProfile();

    const menuBtn = document.getElementById("menuBtn");
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.querySelector(".main-content");
    const overlay = document.getElementById("sidebarOverlay");

    if (!menuBtn || !sidebar || !mainContent) {
        console.error("Sidebar elements not found");
        return;
    }


    // =======================INITIAL STATE==============================

    // Mobile / tablet starts with sidebar closed
    if (window.innerWidth <= 1200) {

        sidebar.classList.add("closed");
        mainContent.classList.add("full-width");

    } else {

        // Desktop starts with sidebar open
        sidebar.classList.remove("closed");
        mainContent.classList.remove("full-width");

    }
    
    // HAMBURGER BUTTON

    menuBtn.addEventListener("click", () => {

        const isClosed = sidebar.classList.toggle("closed");

        // Content follows sidebar state
        mainContent.classList.toggle("full-width", isClosed);

        // Overlay is not required for your layout
        if (overlay) {
            overlay.classList.remove("show");
        }

    });

    // MENU LINK CLICK

    const menuLinks = sidebar.querySelectorAll(".menu a");

    menuLinks.forEach((link) => {

        link.addEventListener("click", () => {

            // On mobile/tablet, close sidebar after selecting page
            if (window.innerWidth <= 1200) {

                sidebar.classList.add("closed");
                mainContent.classList.add("full-width");

                if (overlay) {
                    overlay.classList.remove("show");
                }

            }

        });

    });


    
    // OVERLAY CLICK

    if (overlay) {

        overlay.addEventListener("click", () => {

            sidebar.classList.add("closed");
            mainContent.classList.add("full-width");

            overlay.classList.remove("show");

        });

    }


    
    // WINDOW RESIZE

    window.addEventListener("resize", () => {

        if (window.innerWidth > 1200) {

            // Desktop → sidebar open
            sidebar.classList.remove("closed");
            mainContent.classList.remove("full-width");

            if (overlay) {
                overlay.classList.remove("show");
            }

        }

    });

});


// SIDEBAR PROFILE

async function loadSidebarProfile() {

    try {

        const response = await fetch("/admin/profile", {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {

            console.error("Unable to load sidebar profile");
            return;

        }

        const data = await response.json();

        if (!data.success) {
            return;
        }

        const admin = data.admin;

        // NAME  

        const name = document.getElementById("sidebarAdminName");

        if (name) {

            name.innerText =  admin.Name || "Admin";

        }

        // DESIGNATION
        
        const designation = document.getElementById("sidebarAdminDesignation");

        if (designation) {

            designation.innerText =   admin.Designation || "Administrator";

        }

        // PROFILE IMAGE
       

        const image =  document.getElementById("sidebarAdminImage");

        if (image) {

            if (admin.Profile_Image) {

                image.src =  "/static/uploads/" +
                    admin.Profile_Image +
                    "?t=" +
                    Date.now();

            } else {

                image.src =  "/static/uploads/default.png";

            }


            image.onerror = function () {

                this.src = "/static/uploads/default.png";

            };

        }

    }
    catch (error) {

        console.error(  "Sidebar Profile Error:",   error );

    }

}
