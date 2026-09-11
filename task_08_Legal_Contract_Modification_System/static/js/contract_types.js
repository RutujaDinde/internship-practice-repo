document.addEventListener("DOMContentLoaded", function () {

    // API
    const API_URL = "/contract-types";

    // ELEMENTS
    const createBtn = document.getElementById("createContractTypeBtn");
    const modal = document.getElementById("contractTypeModal");
    const closeBtn = document.getElementById("closeContractTypeModal");
    const cancelBtn = document.getElementById("cancelContractType");
    const form = document.getElementById("contractTypeForm");
    const tableBody = document.getElementById("contractTypesTableBody");
    const message = document.getElementById("contractTypeMessage");
    const formMessage = document.getElementById("formMessage");
    const nameInput = document.getElementById("contractTypeName");
    const descriptionInput = document.getElementById("contractTypeDescription");
    const searchInput = document.getElementById("searchContractType");
    const modalTitle = document.getElementById("modalTitle");
    const modalSubtitle = document.getElementById("modalSubtitle");
    const saveBtn = document.getElementById("saveContractTypeBtn");

    // VARIABLES
    let contractTypes = [];
    let editId = null;

    // ESCAPE HTML
    function escapeHTML(value) {
        const div = document.createElement("div");
        div.textContent = value ?? "";
        return div.innerHTML;
    }

    // MESSAGE
    function showMessage(element, text, type) {
        element.textContent = text;
        element.className =
            element.id === "formMessage"
                ? `form-message ${type}`
                : `contract-type-message ${type}`;

        element.style.display = "block";

        setTimeout(function () {
            element.style.display = "none";
        }, 3000);
    }

    // LOAD CONTRACT TYPES
    async function loadContractTypes() {
        try {
            const response = await fetch(API_URL, {
                credentials: "include"
            });

            const data = await response.json();

            if (!response.ok)
                throw new Error(data.message || "Failed to load contract types.");

            contractTypes = data.contract_types || data;
            displayContractTypes(contractTypes);

        } catch (error) {
            showMessage(message, error.message, "error");
        }
    }

    // DISPLAY CONTRACT TYPES
    function displayContractTypes(data) {
        tableBody.innerHTML = "";

        if (!data.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-row">
                        No contract types found.
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(function (type) {
            tableBody.innerHTML += `
                <tr>
                    <td>${escapeHTML(type.Contract_Type_ID)}</td>

                    <td class="contract-type-name">
                        ${escapeHTML(type.Contract_Type_Name)}
                    </td>

                    <td class="contract-type-description">
                        ${escapeHTML(type.Description || "No description")}
                    </td>

                    <td>
                        ${escapeHTML(type.Created_At || "—")}
                    </td>

                    <td>
                        <div class="action-buttons">

                            <button
                                type="button"
                                class="edit-contract-type-btn"
                                data-id="${type.Contract_Type_ID}">
                                <i class="fa-solid fa-pen"></i>
                            </button>

                            <button
                                type="button"
                                class="delete-contract-type-btn"
                                data-id="${type.Contract_Type_ID}"
                                data-name="${escapeHTML(type.Contract_Type_Name)}">
                                <i class="fa-solid fa-trash"></i>
                            </button>

                        </div>
                    </td>
                </tr>
            `;
        });
    }

    // SEARCH
    searchInput.addEventListener("input", function () {
        const search = this.value.toLowerCase().trim();

        const filtered = contractTypes.filter(function (type) {
            return (
                (type.Contract_Type_Name || "")
                    .toLowerCase()
                    .includes(search) ||

                (type.Description || "")
                    .toLowerCase()
                    .includes(search)
            );
        });

        displayContractTypes(filtered);
    });

    // CREATE MODAL
    createBtn.addEventListener("click", function () {
        editId = null;
        form.reset();

        formMessage.textContent = "";
        formMessage.className = "form-message";

        modalTitle.textContent = "Create Contract Type";
        modalSubtitle.textContent =
            "Add a new contract type to the system.";

        saveBtn.innerHTML =
            `<i class="fa-solid fa-plus"></i> Create Contract Type`;

        modal.classList.add("active");
        nameInput.focus();
    });

    // EDIT / DELETE
    tableBody.addEventListener("click", async function (event) {

        const editBtn =
            event.target.closest(".edit-contract-type-btn");

        const deleteBtn =
            event.target.closest(".delete-contract-type-btn");

        if (editBtn) {
            await editContractType(editBtn.dataset.id);
        }

        if (deleteBtn) {
            deleteContractType(
                deleteBtn.dataset.id,
                deleteBtn.dataset.name
            );
        }
    });

    // EDIT CONTRACT TYPE
    async function editContractType(id) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                credentials: "include"
            });

            const data = await response.json();

            if (!response.ok)
                throw new Error(data.message || "Unable to get contract type.");

            const type = data.contract_type;

            editId = type.Contract_Type_ID;

            nameInput.value = type.Contract_Type_Name || "";
            descriptionInput.value = type.Description || "";

            modalTitle.textContent = "Edit Contract Type";
            modalSubtitle.textContent =
                "Update the contract type information.";

            saveBtn.innerHTML =
                `<i class="fa-solid fa-floppy-disk"></i> Update Contract Type`;

            modal.classList.add("active");
            nameInput.focus();

        } catch (error) {
            showMessage(message, error.message, "error");
        }
    }

    // CREATE / UPDATE
    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name = nameInput.value.trim();
        const description = descriptionInput.value.trim();

        if (!name) {
            showMessage(
                formMessage,
                "Contract type name is required.",
                "error"
            );
            nameInput.focus();
            return;
        }

        const requestData = {
            Contract_Type_Name: name,
            Description: description || null
        };

        const isEditing = editId !== null;

        const url = isEditing
            ? `${API_URL}/${editId}`
            : API_URL;

        const method = isEditing
            ? "PUT"
            : "POST";

        try {
            saveBtn.disabled = true;

            const response = await fetch(url, {
                method: method,
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (!response.ok)
                throw new Error(data.message || "Request failed.");

            closeModal();

            showMessage(
                message,
                data.message ||
                (
                    isEditing
                        ? "Contract type updated successfully."
                        : "Contract type created successfully."
                ),
                "success"
            );

            await loadContractTypes();

        } catch (error) {
            showMessage(
                formMessage,
                error.message,
                "error"
            );

        } finally {
            saveBtn.disabled = false;
        }
    });

    // DELETE
    async function deleteContractType(id, name) {

        if (!confirm(`Delete "${name}"?`))
            return;

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: "DELETE",
                credentials: "include"
            });

            const data = await response.json();

            if (!response.ok)
                throw new Error(data.message || "Delete failed.");

            showMessage(
                message,
                data.message || "Contract type deleted successfully.",
                "success"
            );

            await loadContractTypes();

        } catch (error) {
            showMessage(message, error.message, "error");
        }
    }

    // CLOSE MODAL
    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);

    function closeModal() {
        modal.classList.remove("active");
        form.reset();

        formMessage.textContent = "";
        formMessage.className = "form-message";

        editId = null;

        modalTitle.textContent = "Create Contract Type";
        modalSubtitle.textContent =
            "Add a new contract type to the system.";

        saveBtn.innerHTML =
            `<i class="fa-solid fa-plus"></i> Create Contract Type`;
    }

    // CLICK OUTSIDE MODAL
    modal.addEventListener("click", function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // ESC KEY
    document.addEventListener("keydown", function (event) {
        if (
            event.key === "Escape" &&
            modal.classList.contains("active")
        ) {
            closeModal();
        }
    });

    // INITIAL LOAD
    loadContractTypes();

});