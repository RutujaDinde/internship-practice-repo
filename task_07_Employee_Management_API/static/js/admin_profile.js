// =====================================================
// ADMIN PROFILE
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    loadAdminProfile();

    // Edit Button

    const editBtn = document.getElementById("editBtn");

    if (editBtn) {

        editBtn.addEventListener("click", showEditProfile);

    }

    // Cancel Button

    const cancelBtn = document.getElementById("cancelBtn");

    if (cancelBtn) {

        cancelBtn.addEventListener("click", cancelEdit);

    }

    // Change Photo

    const changePhotoBtn =document.getElementById("changePhotoBtn");

    if (changePhotoBtn) {

        changePhotoBtn.addEventListener("click", () => {

            document  .getElementById("editProfileImage") .click();

        });

    }

    // Preview Image

    const imageInput =document.getElementById("editProfileImage");

    if (imageInput) {

        imageInput.addEventListener("change", previewImage);

    }

});



// ========================LOAD PROFILE=============================


async function loadAdminProfile() {

    try {

        const response = await fetch("/admin/profile", {

            method: "GET",

            credentials: "include"

        });

        const data = await response.json();

        if (!data.success) {

            alert(data.message);

            return;

        }

        const admin = data.admin;

        // ================= IMAGE =================

        const image = admin.Profile_Image

            ? "/static/uploads/" +
              admin.Profile_Image +
              "?t=" +
              Date.now()

            : "/static/uploads/default.png";

        document.getElementById("profileImage").src =  image;

        document.getElementById("editProfilePreview").src =image;

        // ================= VIEW =================

        document.getElementById("adminName").innerText = admin.Name || "-";

        document.getElementById("adminDesignation").innerText =admin.Designation || "-";

        document.getElementById("adminStatus").innerText =admin.Employment_Status || "-";

        document.getElementById("adminEmail").innerText =admin.Email || "-";

        document.getElementById("adminPhone").innerText =admin.phone || "-";

        document.getElementById("adminDepartment").innerText =admin.Department || "-";

        document.getElementById("adminDesignationText").innerText =admin.Designation || "-";

        document.getElementById("adminRoleText").innerText =admin.role || "-";

        document.getElementById("adminJoined").innerText =admin.Hire_Date || "-";

        document.getElementById("adminCity").innerText =admin.city || "-";

        document.getElementById("adminAddress").innerText =admin.address || "-";

        // ================= EDIT =================

        document.getElementById("editName").value =admin.Name || "";

        document.getElementById("editEmail").value =admin.Email || "";

        document.getElementById("editPhone").value =admin.phone || "";

        document.getElementById("editDepartment").value = admin.Department || "";

        document.getElementById("editDesignation").value = admin.Designation || "";

        document.getElementById("editRole").value = admin.role || "";

        document.getElementById("editStatus").value =admin.Employment_Status || "";

        document.getElementById("editJoined").value = admin.Hire_Date || "";

        document.getElementById("editCity").value =admin.city || "";

        document.getElementById("editAddress").value =admin.address || "";

    }

    catch (error) {

        console.error(error);

        alert("Unable to load profile.");

    }

}

// ========================SHOW EDIT PROFILE=============================

function showEditProfile() {

    document.getElementById("viewProfile").style.display = "none";

    document.getElementById("editProfile").style.display = "block";

}



// =========================CANCEL EDIT============================

function cancelEdit() {

    document.getElementById("editProfile").style.display = "none";

    document.getElementById("viewProfile").style.display = "block";

    // Reload original profile values

    loadAdminProfile();

}

// =========================IMAGE PREVIEW============================


function previewImage() {

    const file =document.getElementById("editProfileImage").files[0];

    if (!file) {

        return;

    }

    const imageURL = URL.createObjectURL(file);

    document.getElementById("editProfilePreview").src =  imageURL;

}

// =========================VALIDATION============================


function validateProfile() {

    const name = document.getElementById("editName").value.trim();

    const phone = document.getElementById("editPhone").value.trim();

    const city = document.getElementById("editCity").value.trim();

    if (name === "") {

        alert("Name is required.");

        return false;

    }

    if (phone !== "") {

        const phoneRegex = /^[0-9]{10}$/;

        if (!phoneRegex.test(phone)) {

            alert("Phone number must contain exactly 10 digits.");

            return false;

        }

    }

    if (city.length > 50) {

        alert("City name is too long.");

        return false;

    }

    return true;

}


// ========================= RESET IMAGE===========================


function resetPreview() {

    const currentImage =   document.getElementById("profileImage").src;

    document.getElementById("editProfilePreview").src =  currentImage;

}

// ========================UPDATE ADMIN PROFILE=============================

document.getElementById("editProfile").addEventListener("submit", updateAdminProfile);

async function updateAdminProfile(e) {

    e.preventDefault();

    if (!validateProfile()) {

        return;

    }

    const formData = new FormData();

    // ================= FORM DATA =================

    formData.append( "adminEmp_Name", document.getElementById("editName").value.trim());

    formData.append("adminPhone",document.getElementById("editPhone").value.trim());

    formData.append( "adminCity", document.getElementById("editCity").value.trim() );

    formData.append( "adminAddress", document.getElementById("editAddress").value.trim() );


    // ================= IMAGE =================

    const imageInput = document.getElementById("editProfileImage");

    if (imageInput.files.length > 0) {

        formData.append( "Profile_Image", imageInput.files[0]);

    }

    try {

        const response = await fetch( "/admin/profile",

            {

                method: "PUT",

                credentials: "include",

                body: formData

            }

        );

        const data = await response.json();

        if (!data.success) {

            alert(data.message);

            return;

        }


        alert("Profile Updated Successfully.");

        window.location.reload();

        // ================= SHOW VIEW PROFILE =================

        document.getElementById("editProfile").style.display = "none";

        document.getElementById("viewProfile").style.display = "block";

        // ================= CLEAR FILE INPUT =================

        imageInput.value = "";

        // ================= RELOAD PROFILE =================

        await loadAdminProfile();

    }

    catch (error) {

        console.error(error);

        alert("Unable to update profile.");

    }

}