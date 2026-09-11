document.addEventListener("DOMContentLoaded", function () {

    // ELEMENTS

    const createBtn = document.getElementById("createRoleBtn");
    const modal = document.getElementById("roleModal");
    const closeBtn = document.getElementById("closeRoleModal");
    const cancelBtn = document.getElementById("cancelRole");
    const form = document.getElementById("roleForm");

    const name = document.getElementById("roleName");
    const description = document.getElementById("roleDescription");
    const tbody = document.getElementById("rolesTableBody");

    const pageMsg = document.getElementById("roleMessage");
    const formMsg = document.getElementById("formMessage");

    const title = document.getElementById("modalTitle");
    const subtitle = document.getElementById("modalSubtitle");
    const saveBtn = document.getElementById("saveRoleBtn");

    // INITIAL LOAD

    loadRoles();

    let editId = null;


    // ESCAPE HTML

    function escapeHTML(value) {

        const div = document.createElement("div");

        div.textContent = value ?? "";

        return div.innerHTML;
    }


    // SHOW MESSAGE

    function showMessage(element, message, type) {

        element.textContent = message;

        if (element.id === "roleMessage") {

            element.className = `role-message ${type}`;

        } else {

            element.className = `form-message ${type}`;
        }
    }


    // GET ALL ROLES

    async function loadRoles() {

        try {

            const response = await fetch("/roles", {
                credentials: "include"
            });

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message || "Failed to load roles."
                );
            }


            // DISPLAY ROLES

            if (data.roles.length === 0) {

                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="empty-row">
                            No roles found.
                        </td>
                    </tr>
                `;

                return;
            }


            tbody.innerHTML = data.roles.map(function (role) {

                return `
                    <tr>

                        <td>
                            ${escapeHTML(role.Role_ID)}
                        </td>

                        <td class="role-name">
                            ${escapeHTML(role.Role_Name)}
                        </td>

                        <td class="role-description">
                            ${escapeHTML(role.Description || "-")}
                        </td>

                        <td>

                            <div class="action-buttons">

                                <button type="button" class="action-btn edit-role-btn"
                                    data-id="${role.Role_ID}"
                                    title="Edit">

                                    <i class="fa-solid fa-pen"></i>

                                </button>

                                <button  type="button" class="action-btn delete-role-btn"
                                    data-id="${role.Role_ID}"
                                    data-name="${escapeHTML(role.Role_Name)}"
                                    title="Delete">

                                    <i class="fa-solid fa-trash"></i>

                                </button>

                            </div>

                        </td>

                    </tr>
                `;

            }).join("");


        } catch (error) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-row">
                        Failed to load roles.
                    </td>
                </tr>
            `;

            showMessage( pageMsg, error.message || "Failed to load roles.", "error"  );
        }
    }


    // OPEN CREATE MODAL

    createBtn.onclick = function () {

        editId = null;

        form.reset();

        formMsg.textContent = "";

        formMsg.className = "form-message";

        title.textContent = "Create Role";

        subtitle.textContent =  "Add a new role to the system.";

        saveBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Create Role`;

        modal.classList.add("show");
    };


    // GET SINGLE ROLE

    async function editRole(id) {

        try {

            const response = await fetch(`/roles/${id}`, {
                credentials: "include"
            });

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message || "Failed to load role."
                );
            }


            // STORE EDIT ID

            editId = id;

            // FILL FORM

            name.value = data.role.Role_Name;

            description.value =    data.role.Description || "";


            // CLEAR OLD MESSAGE

            formMsg.textContent = "";
            formMsg.className = "form-message";


            // CHANGE MODAL

            title.textContent = "Edit Role";

            subtitle.textContent =  "Update the role information.";

            saveBtn.innerHTML =  `<i class="fa-solid fa-save"></i> Update Role`;

            modal.classList.add("show");


        } catch (error) {

            showMessage( pageMsg, error.message || "Failed to load role.","error"    );
        }
    }


    // CREATE OR UPDATE ROLE

    form.onsubmit = async function (event) {

        event.preventDefault();


        // GET FORM VALUES

        const roleName = name.value.trim();

        const roleDescription =   description.value.trim();


        // BASIC VALIDATION

        if (!roleName) {

            showMessage( formMsg,"Role name is required.", "error" );

            return;
        }


        // CHECK CREATE OR UPDATE

        const url = editId  ? `/roles/${editId}` : "/roles";

        const method = editId ? "PUT"  : "POST";


        try {

            const response = await fetch(url, {

                method: method,

                credentials: "include",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    Role_Name: roleName,

                    Description: roleDescription || null
                })
            });


            const data = await response.json();

            // HANDLE API ERROR

            if (!response.ok) {

                throw new Error(
                    data.message || "Unable to save role."
                );
            }

            // CLOSE MODAL

            closeModal();

            // SHOW SUCCESS MESSAGE

            showMessage(  pageMsg, data.message, "success" );


            // REFRESH TABLE

            loadRoles();


        } catch (error) {

            showMessage( formMsg,
                error.message || "Unable to save role.",
                "error"
            );
        }
    };


    // DELETE ROLE

    async function deleteRole(id, roleName) {

        const confirmDelete = confirm(
            `Delete "${roleName}"?`
        );


        if (!confirmDelete) {

            return;
        }


        try {

            const response = await fetch(
                `/roles/${id}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            const data = await response.json();

            // HANDLE API ERROR

            if (!response.ok) {

                throw new Error(
                    data.message || "Unable to delete role."
                );
            }


            // SHOW SUCCESS MESSAGE

            showMessage( pageMsg, data.message, "success");


            // REFRESH TABLE

            loadRoles();


        } catch (error) {

            showMessage( pageMsg, 
                error.message || "Unable to delete role.", "error"  );
        }
    }

    // TABLE BUTTON EVENTS

    tbody.onclick = function (event) {

        const editBtn =   event.target.closest(".edit-role-btn");

        const deleteBtn = event.target.closest(".delete-role-btn");


        // EDIT BUTTON

        if (editBtn) {

            editRole(editBtn.dataset.id);

            return;
        }


        // DELETE BUTTON

        if (deleteBtn) {

            deleteRole(  deleteBtn.dataset.id,  deleteBtn.dataset.name );
        }
    };


    // CLOSE MODAL

    function closeModal() {

        modal.classList.remove("show");

        form.reset();

        formMsg.textContent = "";
        formMsg.className = "form-message";

        editId = null;
    }

    // CLOSE BUTTON

    closeBtn.onclick = closeModal;

    // CANCEL BUTTON

    cancelBtn.onclick = closeModal;


    

});