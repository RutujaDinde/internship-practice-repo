document.addEventListener("DOMContentLoaded", function () {

    // ELEMENTS

    const createUserBtn = document.getElementById("createUserBtn");
    const searchInput = document.getElementById("searchUser");
    const filterUserRole = document.getElementById("filterUserRole");

    const userModal = document.getElementById("userModal");
    const closeUserModal = document.getElementById("closeUserModal");
    const cancelUser = document.getElementById("cancelUser");

    const userForm = document.getElementById("userForm");

    const userName = document.getElementById("userName");
    const userEmail = document.getElementById("userEmail");
    const userPassword = document.getElementById("userPassword");
    const userPhone = document.getElementById("userPhone");
    const userRole = document.getElementById("userRole");

    const passwordToggle = document.getElementById("passwordToggle");
    const passwordHint = document.getElementById("passwordHint");

    const usersTableBody = document.getElementById("usersTableBody");

    const userMessage = document.getElementById("userMessage");
    const formMessage = document.getElementById("formMessage");

    const modalTitle = document.getElementById("modalTitle");
    const modalSubtitle = document.getElementById("modalSubtitle");
    const saveUserBtn = document.getElementById("saveUserBtn");

    // INITIAL LOAD

    loadRoles();
    loadUsers();

    // VARIABLES

    let editUserId = null;
    let allUsers = [];


    // ESCAPE HTML
    function escapeHTML(value) {
        const div = document.createElement("div");
        div.textContent = value ?? "";
        return div.innerHTML;
    }

    // PAGE MESSAGE
    function showPageMessage(message, type) {

        userMessage.textContent = message;
        userMessage.className =  `user-message ${type}`;

        setTimeout(function () {

            userMessage.textContent = "";
            userMessage.className = "user-message";

        }, 4000);
    }

    // FORM MESSAGE

    function showFormMessage(message, type) {

        formMessage.textContent = message;
        formMessage.className =   `form-message ${type}`;
    }

    // CLEAR FORM MESSAGE

    function clearFormMessage() {

        formMessage.textContent = "";
        formMessage.className =  "form-message";
    }

    // GET USERS

    async function loadUsers() {

        usersTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-row">
                    Loading users...
                </td>
            </tr>
        `;

        try {

            const response = await fetch("/users", {
                method: "GET",
                credentials: "include",
                headers: {
                    "Accept": "application/json"
                }
            });

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message || "Failed to load users."
                );
            }

            allUsers = data.users || [];

            displayUsers(allUsers);

        } 
        catch (error) {

            console.error("Load users error:", error);

            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-row">
                        Failed to load users.
                    </td>
                </tr>
            `;

            showPageMessage(
                error.message || "Unable to load users.",
                "error"
            );
        }
    }

    // DISPLAY USERS

    function displayUsers(usersToDisplay) {

        usersTableBody.innerHTML = "";

        if (usersToDisplay.length === 0) {

            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-row">
                        No users found.
                    </td>
                </tr>
            `;

            return;
        }


        usersToDisplay.forEach(function (user) {

            // GET ROLE NAME
            let roleName = "-";

            if (user.role && user.role.Role_Name) {

                roleName = user.role.Role_Name;

            } else if (user.Role_Name) {

                roleName = user.Role_Name;
            }


            // GET STATUS
            const status =   user.Status || "Active";

            const statusClass =  status.toLowerCase() === "active"  ? "active"   : "inactive";

            // CREATE ROW

            const row =  document.createElement("tr");

            row.innerHTML = `

                <td>
                    ${escapeHTML(user.User_ID)}
                </td>

                <td>
                    <span class="user-name">
                        ${escapeHTML(user.Name)}
                    </span>
                </td>

                <td>
                    <span class="user-email">
                        ${escapeHTML(user.Email)}
                    </span>
                </td>

                <td>
                    <span class="user-phone">
                        ${escapeHTML(  user.Phone_No || "-" )}
                    </span>
                </td>

                <td>
                    <span class="role-badge">
                        ${escapeHTML(roleName)}
                    </span>
                </td>

                <td>
                    <span class="user-status ${statusClass}">
                        ${escapeHTML(status)}
                    </span>
                </td>

                <td>

                    <div class="action-buttons">

                        <button type="button"  class="edit-user-btn"
                            data-id="${user.User_ID}"title="Edit User">
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button  type="button"  class="delete-user-btn"
                            data-id="${user.User_ID}"
                            data-name="${escapeHTML(user.Name)}"
                            title="Delete User">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </div>

                </td>
            `;
            usersTableBody.appendChild(row);

        });
    }

    // FILTER USERS

    function filterUsers() {

        const searchValue =searchInput.value.toLowerCase().trim();

        const selectedRole =   filterUserRole.value;

        const filteredUsers = allUsers.filter(function (user) {

                // GET ROLE NAME
                const roleName = user.role?.Role_Name || "";

                // SEARCH MATCH
                const matchesSearch =String(user.User_ID) .toLowerCase() .includes(searchValue) ||

                    (user.Name || "") .toLowerCase() .includes(searchValue) ||

                    (user.Email || "") .toLowerCase()   .includes(searchValue) ||

                    (user.Phone_No || "") .toLowerCase() .includes(searchValue) ||

                    roleName .toLowerCase() .includes(searchValue);

                // ROLE MATCH
                const matchesRole =  !selectedRole  || String(user.Role_ID) === String(selectedRole);

                return (  matchesSearch &&  matchesRole  );

            });
        displayUsers(filteredUsers);
    }

    // SEARCH EVENT
   searchInput.addEventListener(  "input",  filterUsers);

    // ROLE FILTER EVENT
    filterUserRole.addEventListener(  "change",  filterUsers );


    // GET ROLES

    async function loadRoles() {

        try {
            const response = await fetch("/roles", {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Accept": "application/json"
                    }
                });

            const data = await response.json();

            if (!response.ok) {

                throw new Error( data.message || "Failed to load roles." );
            }

            // CREATE / EDIT ROLE DROPDOWN

            userRole.innerHTML = `
                <option value="">
                    Select role
                </option>   `;

            // FILTER ROLE DROPDOWN

            filterUserRole.innerHTML = `
                <option value="">
                    All Roles
                </option>
            `;

            (data.roles || []).forEach( function (role) {

                    // FORM ROLE OPTION

                    const roleOption =document.createElement("option");

                    roleOption.value =  role.Role_ID;

                    roleOption.textContent = role.Role_Name;

                    userRole.appendChild( roleOption  );


                    // FILTER ROLE OPTION

                    const filterOption =document.createElement("option");

                    filterOption.value = role.Role_ID;

                    filterOption.textContent =  role.Role_Name;

                    filterUserRole.appendChild( filterOption  );

                }
            );
          } 
          catch (error) {
            console.error(  "Load roles error:", error );
        }
    }

    // OPEN CREATE USER MODAL

    createUserBtn.addEventListener( "click", function () {

            editUserId = null;
            userForm.reset();

            clearFormMessage();

            modalTitle.textContent = "Create User";

            modalSubtitle.textContent =  "Add a new user to the system.";

            passwordHint.textContent ="Password is required when creating a user.";

            userPassword.required = true;

            saveUserBtn.innerHTML = `<i class="fa-solid fa-plus"></i>    Create User`;

            userModal.classList.add("show");

            userName.focus();

        }
    );

    // EDIT USER
    async function editUser(id) {

        clearFormMessage();

        try {

            const response = await fetch(`/users/${id}`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Accept": "application/json"
                    }
                });

            const data =  await response.json();

            if (!response.ok) {

                throw new Error(   data.message ||   "Unable to get user."  );
            }

            const user =data.user;
            editUserId =  user.User_ID;

            // FILL FORM

            userName.value =   user.Name || "";
            userEmail.value =  user.Email || "";
            userPhone.value =user.Phone_No || "";
            userRole.value = user.Role_ID || "";

            // PASSWORD IS OPTIONAL WHEN EDITING

            userPassword.value = "";
            userPassword.required = false;
            passwordHint.textContent =  "Leave password empty to keep the current password.";

            // MODAL TEXT

            modalTitle.textContent ="Edit User";
            modalSubtitle.textContent = "Update the user information.";
            saveUserBtn.innerHTML =   `<i class="fa-solid fa-save"></i>    Update User`;
            userModal.classList.add("show");
            userName.focus();

        } catch (error) {

            console.error("Edit user error:",  error  );
            showPageMessage(   error.message ||   "Unable to get user.","error" );
        }
    }

    // CREATE / UPDATE USER

    userForm.addEventListener(  "submit",  async function (event) {

            event.preventDefault();

            clearFormMessage();

            // GET FORM VALUES
            const name = userName.value.trim();
            const email = userEmail.value.trim();
            const password =   userPassword.value.trim();
            const phone =  userPhone.value.trim();
            const roleId = userRole.value;

            // VALIDATION
            if (!name) {

                showFormMessage(  "Name is required.", "error"  );
                userName.focus();

                return;
            }

            if (!email) {

                showFormMessage(  "Email is required.",  "error"  );
                userEmail.focus();

                return;
            }

            if (!roleId) {

                showFormMessage(  "Please select a role.",  "error" );
                userRole.focus();

                return;
            }

            if ( editUserId === null &&  !password ) {
              showFormMessage( "Password is required.",  "error" );
                userPassword.focus();

                return;
            }
            // REQUEST DATA

            const requestData = {

                Name: name,
                Email: email,
                Phone_No: phone || null,
                Role_ID: Number(roleId)
            };

            // PASSWORD ONLY IF ENTERED

            if (password) {

                requestData.Password =  password;
            }

            // URL AND METHOD
            let url = "/users";
            let method = "POST";

            const isEditing =  editUserId !== null;

            if (isEditing) {

                url =  `/users/${editUserId}`;

                method =  "PUT";
            }

            // DISABLE BUTTON
            saveUserBtn.disabled = true;
             saveUserBtn.innerHTML =   `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;

            try {

                const response = await fetch(url, {
                        method: method,
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },

                        body:  JSON.stringify( requestData )
                    });

                const data =  await response.json();

                if (!response.ok) {

                    let message =   data.message ||   "Unable to save user.";

                    // MARSHMALLOW ERRORS

                    if (data.errors) {

                        const errors =  data.errors;
                        const firstError = Object.values(errors)[0];

                        if ( Array.isArray(  firstError ) ) {

                            message = firstError.join(", ");
                        }
                    }
                    
                    showFormMessage( message, "error" );

                    return;
                }

                // SAVE SUCCESS MESSAGE

                const successMessage =data.message ||  ( isEditing    ? "User updated successfully."  : "User created successfully."     );

                // CLOSE MODAL
                closeModal();

                // SHOW MESSAGE

                showPageMessage(   successMessage,   "success" );

                // RELOAD USERS
                await loadUsers();

            }   catch (error) {

                console.error( "Save user error:",  error );
                showFormMessage(  "Unable to connect to the server.",  "error"  );

            } finally {

                saveUserBtn.disabled =  false;
            }

        }
    );

    // DELETE USER

    async function deleteUser(id, name) {

        const confirmed =confirm(  `Are you sure you want to delete the user "${name}"?`    );

        if (!confirmed)
            return;

        try {

            const response = await fetch(`/users/${id}`, {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        "Accept": "application/json"
                    }
                });

            const data = await response.json();

            if (!response.ok) {

                throw new Error(   data.message || "Unable to delete user.");
            }

            showPageMessage(  data.message ||  "User deleted successfully.",  "success"  );

            await loadUsers();

        } catch (error) {

            console.error( "Delete user error:",  error );

            showPageMessage(  error.message ||  "Unable to delete user.",  "error"  );
        }
    }

    // TABLE BUTTONS

    usersTableBody.addEventListener( "click",  function (event) {

            const editBtn =event.target.closest(   ".edit-user-btn" );

            const deleteBtn = event.target.closest(   ".delete-user-btn"  );

            if (editBtn) {
                editUser(  editBtn.dataset.id );
                return;
            }
            if (deleteBtn) {
                deleteUser(   deleteBtn.dataset.id,   deleteBtn.dataset.name  );
            }

        }
    );

    // PASSWORD TOGGLE
    passwordToggle.addEventListener(  "click",  function () {
            if (
                userPassword.type ===  "password"
            ) {
                userPassword.type =   "text";
                this.innerHTML =  `<i class="fa-solid fa-eye-slash"></i>`;

            } else {
                userPassword.type =   "password";
                this.innerHTML =   `<i class="fa-solid fa-eye"></i>`;
            }

        }
    );

    // CLOSE MODAL

    function closeModal() {

        userModal.classList.remove(   "show"  );
        userForm.reset();

        clearFormMessage();
        
        editUserId = null;

        userPassword.type =   "password";

        passwordToggle.innerHTML =   `<i class="fa-solid fa-eye"></i>`;

        userPassword.required =   true;

        passwordHint.textContent = "Password is required when creating a user.";

        modalTitle.textContent =  "Create User";

        modalSubtitle.textContent =  "Add a new user to the system.";

        saveUserBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Create User`;

    }

    // CLOSE BUTTON

    closeUserModal.addEventListener(  "click",  closeModal );

    // CANCEL BUTTON

    cancelUser.addEventListener( "click", closeModal  );

    // CLICK OUTSIDE MODAL

    userModal.addEventListener( "click",   function (event) {
            if (
                event.target === userModal
            ) {

                closeModal();
            }
        }
    );

    // ESC KEY

    document.addEventListener("keydown", function (event) {

            if ( event.key === "Escape" && userModal.classList.contains("show") ) {
                closeModal();
            }
        }
    );

});