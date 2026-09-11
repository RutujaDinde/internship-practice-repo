/* =========================================================
   CONTRACT MANAGEMENT 
========================================================= */

document.addEventListener("DOMContentLoaded", () => {


    let currentContract = null;
    let loggedInUserRole = null;

    let assignUsersContractId = null;


    let currentContractPage = 1;
    const contractsPerPage = 5;


    /* =====================================================
       API
    ===================================================== */

    const API = {
        contracts: "/contracts",
        documents: "/documents",
        profile: "/users/profile",
        modifications: "/modifications"
    };


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    initializePage();


    async function initializePage() {

        await loadLoggedInUser();

        await loadContracts();

        await loadContractTypes();

        await loadContractStatuses();

    }


    /* =====================================================
       COMMON HELPERS
    ===================================================== */

    function getElement(id) {

        return document.getElementById(id);

    }


    async function parseResponse(response) {

        const contentType =
            response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {

            return await response.json();

        }

        return await response.text();

    }


    function showMessage(message) {

        alert(message);

    }


    /* =====================================================
       LOAD LOGGED-IN USER
    ===================================================== */

    async function loadLoggedInUser() {

        try {

            const response =
                await authFetch(
                    API.profile
                );


            if (!response.ok) {

                throw new Error(
                    "Failed to load user profile"
                );

            }


            const data =
                await response.json();


            const user =
                data.user || {};


            loggedInUserRole =
                user.role?.Role_Name || null;


            if (loggedInUserRole) {

                loggedInUserRole =
                    loggedInUserRole.trim();

            }


            /*
                Make role available to other JS files
                such as clauses.js and versions.js.
            */

            window.loggedInUserRole =
                loggedInUserRole;


            console.log(
                "Logged in user:",
                user
            );


            console.log(
                "Logged in role:",
                loggedInUserRole
            );


            if (    typeof updateModificationPermissions ==="function"
                 ) {
                 updateModificationPermissions();
                  }



            applyRolePermissions();


        } catch (error) {

            console.error(
                "ERROR LOADING LOGGED-IN USER:",
                error
            );

        }

    }


    /* =====================================================
       NORMALIZED ROLE
    ===================================================== */

    function getNormalizedRole() {

        return String(
            loggedInUserRole || ""
        )
            .trim()
            .toLowerCase();

    }


    function isAdmin() {

        return getNormalizedRole() === "admin";

    }


    function isLegalUser() {

        return getNormalizedRole() === "legal user";

    }


    function isContractManager() {

        return getNormalizedRole() === "contract manager";

    }


    function isApprover() {

        return getNormalizedRole() === "approver";

    }


    /* =====================================================
       DOCUMENT PERMISSIONS
    ===================================================== */

    function canUpload() {

        return isContractManager();

    }


    function canEditDocument() {

        return isContractManager();

    }


    function canDeleteDocument() {

        return isContractManager();

    }

    /* =====================================================
       ROLE PERMISSIONS
    ===================================================== */

    function applyRolePermissions() {

        const createButton =
            getElement(
                "createContractBtn"
            );


        const uploadButton =
            getElement(
                "uploadDocumentBtn"
            );


        const editDetailsButton =
            getElement(
                "editContractDetailsBtn"
            );


        const deleteDetailsButton =
            getElement(
                "deleteContractDetailsBtn"
            );


        const assignUsersButton =
            getElement(
                "assignUsersBtn"
            );


        /*
            CREATE CONTRACT
            CONTRACT MANAGER ONLY
        */

        if (createButton) {

            createButton.style.display =
                isContractManager()
                    ? ""
                    : "none";

        }


        /*
            UPLOAD DOCUMENT
            CONTRACT MANAGER ONLY
        */

        if (uploadButton) {

            uploadButton.style.display =
                canUpload()
                    ? ""
                    : "none";

        }


        /*
            EDIT CONTRACT
            CONTRACT MANAGER ONLY
        */

        if (editDetailsButton) {

            editDetailsButton.style.display =
                isContractManager()
                    ? ""
                    : "none";

        }


        /*
            DELETE CONTRACT
            CONTRACT MANAGER ONLY
        */

        if (deleteDetailsButton) {

            deleteDetailsButton.style.display =
                isContractManager()
                    ? ""
                    : "none";

        }


        /*
            ASSIGN USERS
            CONTRACT MANAGER ONLY
        */

        if (assignUsersButton) {

            assignUsersButton.style.display =
                isContractManager()
                    ? ""
                    : "none";

        }


        /*
            RE-RENDER CONTRACT TABLE
        */

        if (window.currentContracts) {

            renderContracts(
                window.currentContracts
            );

        }

    }


    /* =====================================================
       PAGE SWITCHING
    ===================================================== */

    function showContractsList() {

        const listPage =
            getElement(
                "contractsListPage"
            );


        const detailsPage =
            getElement(
                "contractDetailsPage"
            );


        if (listPage) {

            listPage.style.display =
                "block";

        }


        if (detailsPage) {

            detailsPage.style.display =
                "none";

        }


        currentContractId = null;

        currentContract = null;

        assignUsersContractId = null;

        currentContractVersionId = null;

        window.currentContractId = null;
        window.currentContractVersionId = null;

    }


    function showContractDetails() {

        const listPage =
            getElement(
                "contractsListPage"
            );


        const detailsPage =
            getElement(
                "contractDetailsPage"
            );


        if (listPage) {

            listPage.style.display =
                "none";

        }


        if (detailsPage) {

            detailsPage.style.display =
                "block";

        }


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    }


    /* =====================================================
       LOAD ALL CONTRACTS
    ===================================================== */

   async function loadContracts(page = currentContractPage) {

    const tbody =
        getElement("contractsTableBody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="9" class="loading-row">
                Loading contracts...
            </td>
        </tr>
    `;

    try {

        currentContractPage = page;

        const search =
            getElement("contractSearch")?.value.trim() || "";

        const status =
            getElement("contractStatusFilter")?.value || "";

        const contractType =
            getElement("contractTypeFilter")?.value || "";

        const params =
            new URLSearchParams();

        if (search) {
            params.append("search", search);
        }

        if (status) {
            params.append("status", status);
        }

        if (contractType) {
            params.append(
                "contract_type_id",
                contractType
            );
        }

        params.append(
            "page",
            currentContractPage
        );

        params.append(
            "per_page",
            contractsPerPage
        );

        const url =
            `${API.contracts}?${params.toString()}`;

        const response =
            await authFetch(url);

        const data =
            await parseResponse(response);

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to load contracts"
            );

        }

        const contracts =
            data.contracts || [];

        window.currentContracts =
            contracts;

        renderContracts(
            contracts
        );

        const count =
            document.querySelector(
                ".record-count"
            );

        if (count) {

            count.textContent =
                `${data.count ?? contracts.length} Contract(s)`;

        }

        renderContractPagination(
            data.page || currentContractPage,
            data.pages || 1
        );

    } catch (error) {

        console.error(
            "LOAD CONTRACTS ERROR:",
            error
        );

        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="loading-row">
                    Failed to load contracts.
                </td>
            </tr>
        `;

        renderContractPagination(1, 1);
    }
}

    /* =====================================================
       RENDER CONTRACT TABLE
    ===================================================== */

    function renderContracts(contracts) {

        const tbody =
            getElement(
                "contractsTableBody"
            );


        if (!tbody) {

            return;

        }


        if (!contracts.length) {

            tbody.innerHTML = `

                <tr>

                    <td colspan="9" class="loading-row">

                        No contracts found.

                    </td>

                </tr>

            `;

            return;

        }


        tbody.innerHTML =
            contracts.map(contract => {

                const contractId =
                    contract.Contract_ID;


                const contractName =
                    escapeHtml(
                        contract.Contract_Name || "-"
                    );


                const contractType =
                    escapeHtml(
                        contract.Contract_Type_Name ||
                        contract.Contract_Type ||
                        contract.ContractType ||
                        "-"
                    );


                const partyA =
                    escapeHtml(
                        contract.Party_A || "-"
                    );


                const partyB =
                    escapeHtml(
                        contract.Party_B || "-"
                    );


                const effectiveDate =
                    formatDate(
                        contract.Effective_Date
                    );


                const expiryDate =
                    formatDate(
                        contract.Expiry_Date
                    );


                const status =
                    escapeHtml(
                        contract.Status_Name ||
                        contract.Status ||
                        "-"
                    );


                let actionButtons = `

                    <button
                        type="button"
                        class="table-action-btn view-btn view-contract-btn"
                        data-contract-id="${contractId}"
                        title="View Contract"
                        aria-label="View Contract">

                        <i class="fa-solid fa-eye"></i>

                    </button>

                `;


                /*
                    EDIT + DELETE
                    CONTRACT MANAGER ONLY
                */

                if (isContractManager()) {

                    actionButtons += `

                        <button
                            type="button"
                            class="table-action-btn edit-btn edit-contract-btn"
                            data-contract-id="${contractId}"
                            title="Edit Contract"
                            aria-label="Edit Contract">

                            <i class="fa-solid fa-pen"></i>

                        </button>


                        <button
                            type="button"
                            class="table-action-btn delete-btn delete-contract-btn"
                            data-contract-id="${contractId}"
                            title="Delete Contract"
                            aria-label="Delete Contract">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    `;

                }


                return `

                    <tr>

                        <td>
                            ${escapeHtml(contractId)}
                        </td>


                        <td>

                            <strong class="contract-name">

                                ${contractName}

                            </strong>

                        </td>


                        <td>

                            ${contractType}

                        </td>


                        <td>

                            ${partyA}

                        </td>


                        <td>

                            ${partyB}

                        </td>


                        <td>

                            ${effectiveDate}

                        </td>


                        <td>

                            ${expiryDate}

                        </td>


                        <td>

                            ${getStatusBadge(status)}

                        </td>


                        <td class="actions-column">

                            <div class="table-actions">

                                ${actionButtons}

                            </div>

                        </td>

                    </tr>

                `;

            }).join("");


        attachContractTableEvents();

    }


    function renderContractPagination(
    currentPage,
    totalPages
) {

    const pagination =
        getElement(
            "contractsPagination"
        );

    if (!pagination) {
        return;
    }

    pagination.innerHTML = "";

    if (totalPages <= 1) {
        return;
    }

    // Previous button
    const previousButton =
        document.createElement("button");

    previousButton.type = "button";

    previousButton.className =
        "pagination-btn";

    previousButton.innerHTML =
        `<i class="fa-solid fa-chevron-left"></i>`;

    previousButton.disabled =
        currentPage === 1;

    previousButton.addEventListener(
        "click",
        () => {

            if (currentPage > 1) {

                loadContracts(
                    currentPage - 1
                );

            }

        }
    );

    pagination.appendChild(
        previousButton
    );


    // Page buttons
    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        const pageButton =
            document.createElement("button");

        pageButton.type = "button";

        pageButton.className =
            "pagination-btn";

        if (page === currentPage) {

            pageButton.classList.add(
                "active"
            );

        }

        pageButton.textContent =
            page;

        pageButton.addEventListener(
            "click",
            () => {

                if (
                    page !== currentPage
                ) {

                    loadContracts(page);

                }

            }
        );

        pagination.appendChild(
            pageButton
        );

    }


    // Next button
    const nextButton =
        document.createElement("button");

    nextButton.type = "button";

    nextButton.className =
        "pagination-btn";

    nextButton.innerHTML =
        `<i class="fa-solid fa-chevron-right"></i>`;

    nextButton.disabled =
        currentPage === totalPages;

    nextButton.addEventListener(
        "click",
        () => {

            if (
                currentPage < totalPages
            ) {

                loadContracts(
                    currentPage + 1
                );

            }

        }
    );

    pagination.appendChild(
        nextButton
    );
}


    /* =====================================================
       CONTRACT TABLE EVENTS
    ===================================================== */

    function attachContractTableEvents() {

        /*
            VIEW
        */

        document
            .querySelectorAll(
                ".view-contract-btn"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            this.dataset.contractId;


                        if (id) {

                            viewContract(id);

                        }

                    }
                );

            });


        /*
            EDIT
        */

        document
            .querySelectorAll(
                ".edit-contract-btn"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        if (
                            !isContractManager()
                        ) {

                            showMessage(
                                "Only Contract Manager can edit contracts."
                            );

                            return;

                        }


                        const id =
                            this.dataset.contractId;


                        if (id) {

                            editContract(id);

                        }

                    }
                );

            });


        /*
            DELETE
        */

        document
            .querySelectorAll(
                ".delete-contract-btn"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        if (
                            !isContractManager()
                        ) {

                            showMessage(
                                "Only Contract Manager can delete contracts."
                            );

                            return;

                        }


                        const id =
                            this.dataset.contractId;


                        if (id) {

                            deleteContract(id);

                        }

                    }
                );

            });

    }


    /* =====================================================
       VIEW CONTRACT
    ===================================================== */

    async function viewContract(
        contractId
    ) {

        try {

            const response =
                await authFetch(
                    `${API.contracts}/${contractId}`
                );


            const data =
                await parseResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Contract not found"
                );

            }


            currentContractId =contractId;

            window.currentContractId = contractId;


            currentContract = data.contract;


            populateContractDetails(
                currentContract
            );


            showContractDetails();


            activateTab(
                "overview"
            );


        } catch (error) {

            console.error(
                "VIEW CONTRACT ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Unable to load contract."
            );

        }

    }


    /* =====================================================
       POPULATE CONTRACT DETAILS
    ===================================================== */

    function populateContractDetails(
        contract
    ) {

        setText(
            "detailsContractName",
            contract.Contract_Name || "-"
        );


        setText(
            "detailsContractId",
            contract.Contract_ID || "-"
        );


        setText(
            "detailsPartyA",
            contract.Party_A || "-"
        );


        setText(
            "detailsPartyB",
            contract.Party_B || "-"
        );


        setText(
            "detailsContractType",
            contract.Contract_Type_Name ||
            contract.Contract_Type ||
            contract.ContractType ||
            "-"
        );


        setText(
            "detailsPartyAValue",
            contract.Party_A || "-"
        );


        setText(
            "detailsPartyBValue",
            contract.Party_B || "-"
        );


        setText(
            "detailsEffectiveDate",
            formatDate(
                contract.Effective_Date
            )
        );


        setText(
            "detailsExpiryDate",
            formatDate(
                contract.Expiry_Date
            )
        );


        const description =
            contract.Description ||
            "No description available.";


        setText(
            "detailsDescription",
            description
        );


        setText(
            "overviewDetails",
            description
        );


        const status =
            contract.Status_Name ||
            contract.Status ||
            "Draft";


        setStatus(
            "detailsContractStatus",
            status
        );


        setText(
            "overviewStatus",
            status
        );


        updateExpiration(
            contract.Effective_Date,
            contract.Expiry_Date
        );


        /*
            EDIT
        */

        const editButton =
            getElement(
                "editContractDetailsBtn"
            );


        if (editButton) {

            editButton.style.display =
                isContractManager()
                    ? ""
                    : "none";

        }


        /*
            DELETE
        */

        const deleteButton =
            getElement(
                "deleteContractDetailsBtn"
            );


        if (deleteButton) {

            deleteButton.style.display =
                isContractManager()
                    ? ""
                    : "none";

        }


        /*
            UPLOAD
        */

        const uploadButton =
            getElement(
                "uploadDocumentBtn"
            );


        if (uploadButton) {

            uploadButton.style.display =
                canUpload()
                    ? ""
                    : "none";

        }


        /*
            ASSIGN USERS
        */

        const assignButton =
            getElement(
                "assignUsersBtn"
            );


        if (assignButton) {

            assignButton.style.display =
                isContractManager()
                    ? ""
                    : "none";

        }


    }


    /* =====================================================
       EDIT CONTRACT
    ===================================================== */

    async function editContract(
        contractId
    ) {

        if (!isContractManager()) {

            showMessage(
                "Only Contract Manager can edit contracts."
            );

            return;

        }


        try {

            const response =
                await authFetch(
                    `${API.contracts}/${contractId}`
                );


            const data =
                await parseResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Contract not found"
                );

            }


            const contract =
                data.contract;


            const contractIdInput =
                getElement(
                    "contractId"
                );


            const contractNameInput =
                getElement(
                    "contractName"
                );


            const contractTypeInput =
                getElement(
                    "contractType"
                );


            const partyAInput =
                getElement(
                    "partyA"
                );


            const partyBInput =
                getElement(
                    "partyB"
                );


            const effectiveDateInput =
                getElement(
                    "effectiveDate"
                );


            const expiryDateInput =
                getElement(
                    "expiryDate"
                );


            const descriptionInput =
                getElement(
                    "contractDescription"
                );


            if (contractIdInput) {

                contractIdInput.value =
                    contract.Contract_ID || "";

            }


            if (contractNameInput) {

                contractNameInput.value =
                    contract.Contract_Name || "";

            }


            if (contractTypeInput) {

                contractTypeInput.value =
                    contract.Contract_Type_ID || "";

            }


            if (partyAInput) {

                partyAInput.value =
                    contract.Party_A || "";

            }


            if (partyBInput) {

                partyBInput.value =
                    contract.Party_B || "";

            }


            if (effectiveDateInput) {

                effectiveDateInput.value =
                    normalizeDateInput(
                        contract.Effective_Date
                    );

            }


            if (expiryDateInput) {

                expiryDateInput.value =
                    normalizeDateInput(
                        contract.Expiry_Date
                    );

            }


            if (descriptionInput) {

                descriptionInput.value =
                    contract.Description || "";

            }


            setText(
                "contractModalTitle",
                "Edit Contract"
            );


            openModal(
                "contractModal"
            );


        } catch (error) {

            console.error(
                "EDIT CONTRACT ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Unable to load contract."
            );

        }

    }


    /* =====================================================
       CREATE CONTRACT BUTTON
    ===================================================== */

    const createButton =
        getElement(
            "createContractBtn"
        );


    if (createButton) {

        createButton.addEventListener(
            "click",
            () => {

                if (!isContractManager()) {

                    showMessage(
                        "Only Contract Manager can create contracts."
                    );

                    return;

                }


                resetContractForm();


                setText(
                    "contractModalTitle",
                    "Create Contract"
                );


                openModal(
                    "contractModal"
                );

            }
        );

    }


    /* =====================================================
       CONTRACT FORM
    ===================================================== */

    const contractForm =
        getElement(
            "contractForm"
        );


    if (contractForm) {

        contractForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                if (!isContractManager()) {

                    showMessage(
                        "Only Contract Manager can create or update contracts."
                    );

                    return;

                }


                const contractId =
                    getElement(
                        "contractId"
                    )?.value || "";


                const contractName =
                    getElement(
                        "contractName"
                    )?.value.trim() || "";


                const contractTypeValue =
                    getElement(
                        "contractType"
                    )?.value || "";


                const partyA =
                    getElement(
                        "partyA"
                    )?.value.trim() || "";


                const partyB =
                    getElement(
                        "partyB"
                    )?.value.trim() || "";


                const effectiveDate =
                    getElement(
                        "effectiveDate"
                    )?.value || "";


                const expiryDate =
                    getElement(
                        "expiryDate"
                    )?.value || "";


                const description =
                    getElement(
                        "contractDescription"
                    )?.value.trim() || "";


                const payload = {

                    Contract_Name:
                        contractName,

                    Contract_Type_ID:
                        Number(
                            contractTypeValue
                        ),

                    Party_A:
                        partyA,

                    Party_B:
                        partyB,

                    Effective_Date:
                        effectiveDate,

                    Expiry_Date:
                        expiryDate,

                    Description:
                        description

                };


                if (
                    !payload.Contract_Name ||
                    !payload.Contract_Type_ID ||
                    !payload.Party_A ||
                    !payload.Party_B ||
                    !payload.Effective_Date ||
                    !payload.Expiry_Date
                ) {

                    showMessage(
                        "Please fill all required fields."
                    );

                    return;

                }


                if (
                    payload.Expiry_Date <=
                    payload.Effective_Date
                ) {

                    showMessage(
                        "Expiry date must be after effective date."
                    );

                    return;

                }


                try {

                    const url =
                        contractId
                            ? `${API.contracts}/${contractId}`
                            : API.contracts;


                    const response =
                        await authFetch(
                            url,
                            {
                                method:
                                    contractId
                                        ? "PUT"
                                        : "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(
                                        payload
                                    )
                            }
                        );


                    const data =
                        await parseResponse(
                            response
                        );


                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            data.error ||
                            "Unable to save contract."
                        );

                    }


                    closeModal(
                        "contractModal"
                    );


                    resetContractForm();


                    await loadContracts();


                    showMessage(
                        contractId
                            ? "Contract updated successfully."
                            : "Contract created successfully."
                    );


                    if (contractId) {

                        await viewContract(
                            contractId
                        );

                    }


                } catch (error) {

                    console.error(
                        "SAVE CONTRACT ERROR:",
                        error
                    );


                    showMessage(
                        error.message ||
                        "Unable to save contract."
                    );

                }

            }
        );

    }


    /* =====================================================
       DELETE CONTRACT
    ===================================================== */

    async function deleteContract(
        contractId
    ) {

        if (!isContractManager()) {

            showMessage(
                "Only Contract Manager can delete contracts."
            );

            return;

        }


        const confirmed =
            confirm(
                "Are you sure you want to delete this contract?"
            );


        if (!confirmed) {

            return;

        }


        try {

            const response =
                await authFetch(
                    `${API.contracts}/${contractId}`,
                    {
                        method: "DELETE"
                    }
                );


            const data =
                await parseResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to delete contract."
                );

            }


            if (
                String(
                    currentContractId
                ) ===
                String(contractId)
            ) {

                showContractsList();

            }


            await loadContracts();


            showMessage(
                "Contract deleted successfully."
            );


        } catch (error) {

            console.error(
                "DELETE CONTRACT ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Unable to delete contract."
            );

        }

    }


    /* =====================================================
       BACK TO CONTRACTS
    ===================================================== */

    const backButton =
        getElement(
            "backToContractsBtn"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                showContractsList();

                loadContracts();

            }
        );

    }


    /* =====================================================
       DETAILS EDIT BUTTON
    ===================================================== */

    const editDetailsButton =
        getElement(
            "editContractDetailsBtn"
        );


    if (editDetailsButton) {

        editDetailsButton.addEventListener(
            "click",
            () => {

                if (!isContractManager()) {

                    showMessage(
                        "Only Contract Manager can edit contracts."
                    );

                    return;

                }


                if (currentContractId) {

                    editContract(
                        currentContractId
                    );

                }

            }
        );

    }


    /* =====================================================
       DETAILS DELETE BUTTON
    ===================================================== */

    const deleteDetailsButton =
        getElement(
            "deleteContractDetailsBtn"
        );


    if (deleteDetailsButton) {

        deleteDetailsButton.addEventListener(
            "click",
            () => {

                if (!isContractManager()) {

                    showMessage(
                        "Only Contract Manager can delete contracts."
                    );

                    return;

                }


                if (currentContractId) {

                    deleteContract(
                        currentContractId
                    );

                }

            }
        );

    }


    /* =====================================================
       MORE BUTTON
    ===================================================== */

    const moreButton =
        getElement(
            "detailsMoreBtn"
        );


    if (moreButton) {

        moreButton.addEventListener(
            "click",
            () => {

                showMessage(
                    "More actions can be added here."
                );

            }
        );

    }


    /* =====================================================
       TABS
    ===================================================== */

    document
        .querySelectorAll(
            ".details-tab"
        )
        .forEach(tab => {

            tab.addEventListener(
                "click",
                async function () {

                    const tabName =
                        this.dataset.tab;


                    activateTab(
                        tabName
                    );


                    if (!currentContractId) {

                        return;

                    }


                    if (
                        tabName ===
                        "documents"
                    ) {

                        await loadContractDocuments(
                            currentContractId
                        );

                    }


                    if (
                        tabName ===
                        "versions"
                    ) {

                        if (
                            typeof window.loadContractVersions ===
                            "function"
                        ) {

                            await window.loadContractVersions(
                                currentContractId
                            );

                        }

                    }


                    if (
                        tabName ===
                        "clauses"
                    ) {

                        if (
                            typeof window.loadContractClauses ===
                            "function"
                        ) {

                            await window.loadContractClauses(
                                currentContractId
                            );

                        }

                    }


                    if (tabName === "modifications") {
                        if (
                            typeof window.loadContractModifications === "function"
                        ) {
                            await window.loadContractModifications(
                                currentContractId
                            );
                        }
                    }


                    if (
                        tabName ===
                        "approvals"
                    ) {

                        await loadContractApprovals();

                    }

                }
            );

        });


    function activateTab(
        tabName
    ) {

        document
            .querySelectorAll(
                ".details-tab"
            )
            .forEach(tab => {

                tab.classList.toggle(
                    "active",
                    tab.dataset.tab ===
                    tabName
                );

            });


        document
            .querySelectorAll(
                ".details-tab-content"
            )
            .forEach(content => {

                content.classList.remove(
                    "active"
                );

            });


        const selectedContent =
            getElement(
                `${tabName}Tab`
            );


        if (selectedContent) {

            selectedContent.classList.add(
                "active"
            );

        }

    }


    /* =====================================================
       DOCUMENTS
    ===================================================== */

    async function loadContractDocuments(
        contractId
    ) {

        const container =
            getElement(
                "contractDocumentsContainer"
            );


        if (!container) {

            return;

        }


        container.innerHTML = `

            <div class="loading-state">

                Loading documents...

            </div>

        `;


        try {

            const response =
                await authFetch(
                    `${API.documents}/contract/${contractId}`
                );


            const data =
                await parseResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load documents."
                );

            }


            const documents =
                data.documents || [];


            setText(
                "documentsCount",
                documents.length
            );


            setText(
                "overviewDocuments",
                documents.length
            );


            renderDocuments(
                documents
            );


        } catch (error) {

            console.error(
                "LOAD DOCUMENTS ERROR:",
                error
            );


            container.innerHTML = `

                <div class="empty-state">

                    ${escapeHtml(
                        error.message ||
                        "Failed to load documents."
                    )}

                </div>

            `;

        }

    }


    /* =====================================================
       GET DOCUMENT TYPE
    ===================================================== */

    function getDocumentType(
        document
    ) {

        const type =
            String(
                document.Document_Type || ""
            )
                .trim()
                .toUpperCase();


        if (type === "PDF") {

            return "PDF";

        }


        if (
            type === "DOC" ||
            type === "DOCX" ||
            type === "WORD"
        ) {

            return "DOCX";

        }


        if (
            type === "TXT" ||
            type === "TEXT"
        ) {

            return "TXT";

        }


        const fileName =
            String(
                document.Document_Name || ""
            )
                .trim()
                .toLowerCase();


        const filePath =
            String(
                document.File_Path || ""
            )
                .trim()
                .toLowerCase();


        const source =
            `${fileName} ${filePath}`;


        if (
            source.includes(".pdf")
        ) {

            return "PDF";

        }


        if (
            source.includes(".doc") ||
            source.includes(".docx")
        ) {

            return "DOCX";

        }


        if (
            source.includes(".txt")
        ) {

            return "TXT";

        }


        return "FILE";

    }


    /* =====================================================
       GET DOCUMENT ICON
    ===================================================== */

    function getDocumentIcon(
        type
    ) {

        const documentType =
            String(
                type || ""
            )
                .trim()
                .toUpperCase();


        switch (documentType) {

            case "PDF":

                return "fa-solid fa-file-pdf";


            case "DOC":

            case "DOCX":

            case "WORD":

                return "fa-solid fa-file-word";


            case "TXT":

            case "TEXT":

                return "fa-solid fa-file-lines";


            default:

                return "fa-solid fa-file";

        }

    }


    /* =====================================================
       RENDER DOCUMENTS
    ===================================================== */

    function renderDocuments(
        documents
    ) {

        const container =
            getElement(
                "contractDocumentsContainer"
            );


        if (!container) {

            return;

        }


        if (!documents.length) {

            container.innerHTML = `

                <div class="empty-state">

                    No documents found for this contract.

                </div>

            `;

            return;

        }


        container.innerHTML =
            documents.map(document => {

                const documentId =
                    document.Document_ID;


                const documentName =
                    escapeHtml(
                        document.Document_Name ||
                        "Unnamed Document"
                    );


                const documentType =
                    getDocumentType(
                        document
                    );


                const documentIcon =
                    getDocumentIcon(
                        documentType
                    );


                const status =
                    escapeHtml(
                        document.Status ||
                        "Active"
                    );


                const iconTypeClass =
                    documentType.toLowerCase();


                return `

                    <div class="document-card">

                        <div class="document-info">

                            <div
                                class="document-icon ${iconTypeClass}"
                                title="${documentType} Document">

                                <i
                                    class="${documentIcon}"
                                    aria-hidden="true">
                                </i>

                            </div>


                            <div class="document-details">

                                <span
                                    class="document-name"
                                    title="${documentName}">

                                    ${documentName}

                                </span>


                                <div class="document-meta">

                                    <span class="document-type">

                                        ${documentType}

                                    </span>

                                    <span>

                                        •

                                    </span>

                                    <span class="document-status">

                                        ${status}

                                    </span>

                                </div>

                            </div>

                        </div>


                        <div class="document-actions">

                            <button
                                type="button"
                                class="btn btn-sm btn-outline-primary view-document-btn"
                                data-document-id="${documentId}">

                                <i class="fas fa-eye"></i>

                                View

                            </button>


                            <button
                                type="button"
                                class="btn btn-sm btn-outline-secondary download-document-btn"
                                data-document-id="${documentId}">

                                <i class="fas fa-download"></i>

                                Download

                            </button>


                            ${
                                canEditDocument()
                                    ? `

                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-warning edit-document-btn"
                                            data-document-id="${documentId}">

                                            <i class="fas fa-pen"></i>

                                            Edit

                                        </button>

                                    `
                                    : ""
                            }


                            ${
                                canDeleteDocument()
                                    ? `

                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-danger delete-document-btn"
                                            data-document-id="${documentId}">

                                            <i class="fas fa-trash"></i>

                                            Delete

                                        </button>

                                    `
                                    : ""
                            }

                        </div>

                    </div>

                `;

            }).join("");


        attachDocumentEvents();

    }


    /* =====================================================
       DOCUMENT EVENTS
    ===================================================== */

    function attachDocumentEvents() {

        /*
            VIEW
        */

        document
            .querySelectorAll(
                ".view-document-btn"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        event.stopPropagation();


                        const documentId =
                            this.dataset.documentId;


                        if (!documentId) {

                            showMessage(
                                "Document ID is missing."
                            );

                            return;

                        }


                        viewDocument(
                            documentId
                        );

                    }
                );

            });


        /*
            DOWNLOAD
        */

        document
            .querySelectorAll(
                ".download-document-btn"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        event.stopPropagation();


                        const documentId =
                            this.dataset.documentId;


                        if (!documentId) {

                            showMessage(
                                "Document ID is missing."
                            );

                            return;

                        }


                        downloadDocument(
                            documentId
                        );

                    }
                );

            });


        /*
            EDIT
        */

        document
            .querySelectorAll(
                ".edit-document-btn"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        event.stopPropagation();


                        if (!canEditDocument()) {

                            showMessage(
                                "Only Contract Manager can edit documents."
                            );

                            return;

                        }


                        const documentId =
                            this.dataset.documentId;


                        if (!documentId) {

                            showMessage(
                                "Document ID is missing."
                            );

                            return;

                        }


                        editDocument(
                            documentId
                        );

                    }
                );

            });


        /*
            DELETE
        */

        document
            .querySelectorAll(
                ".delete-document-btn"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        event.stopPropagation();


                        if (!canDeleteDocument()) {

                            showMessage(
                                "Only Contract Manager can delete documents."
                            );

                            return;

                        }


                        const documentId =
                            this.dataset.documentId;


                        if (!documentId) {

                            showMessage(
                                "Document ID is missing."
                            );

                            return;

                        }


                        deleteDocument(
                            documentId
                        );

                    }
                );

            });

    }


    /* =====================================================
       EDIT DOCUMENT
    ===================================================== */

    async function editDocument(
        documentId
    ) {

        if (!canEditDocument()) {

            showMessage(
                "Only Contract Manager can edit documents."
            );

            return;

        }


        try {

            const response =
                await authFetch(
                    `${API.documents}/${documentId}`
                );


            const data =
                await parseResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load document."
                );

            }


            const documentData =
                data.document;


            const newName =
                prompt(
                    "Enter document name:",
                    documentData.Document_Name || ""
                );


            if (newName === null) {

                return;

            }


            const documentName =
                newName.trim();


            if (!documentName) {

                showMessage(
                    "Document name is required."
                );

                return;

            }


            const updateResponse =
                await authFetch(
                    `${API.documents}/${documentId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                Document_Name:
                                    documentName
                            })
                    }
                );


            const updateData =
                await parseResponse(
                    updateResponse
                );


            if (!updateResponse.ok) {

                throw new Error(
                    updateData.message ||
                    "Unable to update document."
                );

            }


            showMessage(
                "Document updated successfully."
            );


            await loadContractDocuments(
                currentContractId
            );


        } catch (error) {

            console.error(
                "EDIT DOCUMENT ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Unable to edit document."
            );

        }

    }


    /* =====================================================
       DELETE DOCUMENT
    ===================================================== */

    async function deleteDocument(
        documentId
    ) {

        if (!canDeleteDocument()) {

            showMessage(
                "Only Contract Manager can delete documents."
            );

            return;

        }


        const confirmed =
            confirm(
                "Are you sure you want to delete this document?"
            );


        if (!confirmed) {

            return;

        }


        try {

            const response =
                await authFetch(
                    `${API.documents}/${documentId}`,
                    {
                        method: "DELETE"
                    }
                );


            const data =
                await parseResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to delete document."
                );

            }


            showMessage(
                "Document deleted successfully."
            );


            await loadContractDocuments(
                currentContractId
            );


        } catch (error) {

            console.error(
                "DELETE DOCUMENT ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Unable to delete document."
            );

        }

    }


    /* =====================================================
       VIEW DOCUMENT
    ===================================================== */

    async function viewDocument(
        documentId
    ) {

        let newWindow = null;


        try {

            newWindow =
                window.open(
                    "",
                    "_blank"
                );


            if (newWindow) {

                newWindow.document.write(`

                    <!DOCTYPE html>

                    <html>

                    <head>

                        <title>
                            Loading Document...
                        </title>

                        <style>

                            body {
                                margin: 0;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                height: 100vh;
                                font-family:
                                    Inter,
                                    Arial,
                                    sans-serif;
                                color: #253858;
                                background: #f8fafc;
                            }

                            .loading {
                                font-size: 14px;
                            }

                        </style>

                    </head>

                    <body>

                        <div class="loading">

                            Loading document...

                        </div>

                    </body>

                    </html>

                `);


                newWindow.document.close();

            }


            const response =
                await authFetch(
                    `${API.documents}/${documentId}/view`
                );


            if (!response.ok) {

                let errorMessage =
                    "Unable to view document.";


                try {

                    const data =
                        await response.json();


                    errorMessage =
                        data.message ||
                        errorMessage;

                } catch (error) {

                    // Ignore non JSON response

                }


                throw new Error(
                    errorMessage
                );

            }


            const blob =
                await response.blob();


            if (!blob.size) {

                throw new Error(
                    "Document file is empty."
                );

            }


            const blobUrl =
                URL.createObjectURL(
                    blob
                );


            if (newWindow) {

                newWindow.location.href =
                    blobUrl;

            } else {

                const link =
                    document.createElement(
                        "a"
                    );


                link.href =
                    blobUrl;


                link.target =
                    "_blank";


                link.rel =
                    "noopener noreferrer";


                document.body.appendChild(
                    link
                );


                link.click();


                link.remove();

            }


            setTimeout(
                () => {

                    URL.revokeObjectURL(
                        blobUrl
                    );

                },
                60000
            );


        } catch (error) {

            console.error(
                "VIEW DOCUMENT ERROR:",
                error
            );


            if (newWindow) {

                newWindow.close();

            }


            showMessage(
                error.message ||
                "Unable to view document."
            );

        }

    }


    /* =====================================================
       DOWNLOAD DOCUMENT
    ===================================================== */

    async function downloadDocument(
        documentId
    ) {

        try {

            const response =
                await authFetch(
                    `${API.documents}/${documentId}/download`
                );


            if (!response.ok) {

                let errorMessage =
                    "Unable to download document.";


                try {

                    const data =
                        await response.json();


                    errorMessage =
                        data.message ||
                        errorMessage;

                } catch (error) {

                    // Ignore non JSON response

                }


                throw new Error(
                    errorMessage
                );

            }


            const blob =
                await response.blob();


            if (!blob.size) {

                throw new Error(
                    "Document file is empty."
                );

            }


            const blobUrl =
                URL.createObjectURL(
                    blob
                );


            let filename =
                "document";


            const disposition =
                response.headers.get(
                    "Content-Disposition"
                );


            if (disposition) {

                const utf8Match =
                    disposition.match(
                        /filename\*=UTF-8''([^;]+)/i
                    );


                const normalMatch =
                    disposition.match(
                        /filename="?([^"]+)"?/i
                    );


                if (
                    utf8Match &&
                    utf8Match[1]
                ) {

                    try {

                        filename =
                            decodeURIComponent(
                                utf8Match[1]
                            );

                    } catch (error) {

                        filename =
                            utf8Match[1];

                    }

                } else if (
                    normalMatch &&
                    normalMatch[1]
                ) {

                    filename =
                        normalMatch[1];

                }

            }


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                blobUrl;


            link.download =
                filename;


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            setTimeout(
                () => {

                    URL.revokeObjectURL(
                        blobUrl
                    );

                },
                1000
            );


        } catch (error) {

            console.error(
                "DOWNLOAD DOCUMENT ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Unable to download document."
            );

        }

    }


    /* =====================================================
       UPLOAD DOCUMENT BUTTON
       CONTRACT MANAGER ONLY
    ===================================================== */

    const uploadButton =
        getElement(
            "uploadDocumentBtn"
        );


    if (uploadButton) {

        uploadButton.addEventListener(
            "click",
            () => {

                if (!isContractManager()) {

                    showMessage(
                        "Only Contract Manager can upload documents."
                    );

                    return;

                }


                if (!currentContractId) {

                    showMessage(
                        "Please select a contract first."
                    );

                    return;

                }


                resetUploadForm();


                const uploadContractId =
                    getElement(
                        "uploadContractId"
                    );


                if (uploadContractId) {

                    uploadContractId.value =
                        currentContractId;

                }


                openModal(
                    "uploadDocumentModal"
                );

            }
        );

    }


    /* =====================================================
       UPLOAD DOCUMENT FORM
    ===================================================== */

    const uploadForm = getElement(
            "uploadDocumentForm"
        );


    if (uploadForm) {

        uploadForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                if (!isContractManager()) {

                    showMessage(
                        "Only Contract Manager can upload documents."
                    );

                    return;

                }


                const contractId =
                    getElement(
                        "uploadContractId"
                    )?.value || "";


                const documentName =
                    getElement(
                        "documentName"
                    )?.value.trim() || "";


                const documentType =
                    getElement(
                        "documentType"
                    )?.value.trim() || "";


                const file =
                    getElement(
                        "documentFile"
                    )?.files[0];


                if (!contractId) {

                    showMessage(
                        "Contract ID is missing."
                    );

                    return;

                }


                if (!documentName) {

                    showMessage(
                        "Document name is required."
                    );

                    return;

                }


                if (!file) {

                    showMessage(
                        "Please select a document."
                    );

                    return;

                }


                const allowedExtensions = [
                    "pdf",
                    "docx",
                    "txt"
                ];


                const extension =
                    file.name
                        .split(".")
                        .pop()
                        .toLowerCase();


                if (
                    !allowedExtensions.includes(
                        extension
                    )
                ) {

                    showMessage(
                        "Only PDF, DOCX and TXT files are allowed."
                    );

                    return;

                }


                const formData =
                    new FormData();


                formData.append(
                    "Contract_ID",
                    contractId
                );


                formData.append(
                    "Document_Name",
                    documentName
                );


                if (documentType) {

                    formData.append(
                        "Document_Type",
                        documentType
                    );

                }


                formData.append(
                    "file",
                    file
                );


                try {

                    const response =
                        await authFetch(
                            API.documents,
                            {
                                method: "POST",
                                body: formData
                            }
                        );


                    const data =
                        await parseResponse(
                            response
                        );


                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            data.error ||
                            "Document upload failed."
                        );

                    }


                    closeModal(
                        "uploadDocumentModal"
                    );


                    resetUploadForm();


                    await loadContractDocuments(
                        currentContractId
                    );


                    /*
                        Refresh versions because
                        every upload creates a new version.
                    */

                    if (
                        typeof window.loadContractVersions ===
                        "function"
                    ) {

                        await window.loadContractVersions(
                            currentContractId
                        );

                    }


                    /*
                        Refresh clauses because
                        the new version receives
                        copied clauses from the previous version.
                    */

                    if (
                        typeof window.loadContractClauses ===
                        "function"
                    ) {

                        await window.loadContractClauses(
                            currentContractId
                        );

                    }


                    showMessage(
                        "Document uploaded successfully."
                    );


                } catch (error) {

                    console.error(
                        "UPLOAD DOCUMENT ERROR:",
                        error
                    );


                    showMessage(
                        error.message ||
                        "Unable to upload document."
                    );

                }

            }
        );

    }


    /* =====================================================
       APPROVALS
    ===================================================== */

    async function loadContractApprovals() {

        const container =
            getElement(
                "contractApprovalsContainer"
            );


        if (!container) {

            return;

        }


        if (!currentContractId) {

            container.innerHTML = `

                <div class="empty-state">

                    Please select a contract.

                </div>

            `;

            return;

        }


        /*
            Approval API can be connected here
            once the approval endpoints are finalized.
        */

        container.innerHTML = `

            <div class="empty-state">

                Approval and review activity will appear here.

            </div>

        `;

    }


    /* =====================================================
       LOAD CONTRACT TYPES
    ===================================================== */

    async function loadContractTypes() {

        const select =
            getElement(
                "contractType"
            );


        const filter =
            getElement(
                "contractTypeFilter"
            );


        try {

            const response =
                await authFetch(
                    "/contract-types"
                );


            if (!response.ok) {

                return;

            }


            const data =
                await parseResponse(
                    response
                );


            const types =
                data.contract_types ||
                data.contractTypes ||
                data.types ||
                [];


            if (select) {

                select.innerHTML = `

                    <option value="">

                        Select Contract Type

                    </option>

                `;


                types.forEach(type => {

                    const name =
                        type.Type_Name ||
                        type.Contract_Type_Name ||
                        type.Contract_Type ||
                        type.name ||
                        "-";


                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        type.Contract_Type_ID;


                    option.textContent =
                        name;


                    select.appendChild(
                        option
                    );

                });

            }


            if (filter) {

                filter.innerHTML = `

                    <option value="">

                        All Contract Types

                    </option>

                `;


                types.forEach(type => {

                    const name =
                        type.Type_Name ||
                        type.Contract_Type_Name ||
                        type.Contract_Type ||
                        type.name ||
                        "-";


                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        type.Contract_Type_ID;


                    option.textContent =
                        name;


                    filter.appendChild(
                        option
                    );

                });

            }


        } catch (error) {

            console.warn(
                "Contract type API not available:",
                error
            );

        }

    }


    /* =====================================================
       LOAD CONTRACT STATUSES
    ===================================================== */

    async function loadContractStatuses() {

        const filter =
            getElement(
                "contractStatusFilter"
            );


        if (!filter) {

            return;

        }


        try {

            const response =
                await authFetch(
                    "/contract-statuses"
                );


            if (!response.ok) {

                return;

            }


            const data =
                await parseResponse(
                    response
                );


            const statuses =
                data.contract_statuses ||
                data.contractStatuses ||
                data.statuses ||
                [];


            filter.innerHTML = `

                <option value="">

                    All Statuses

                </option>

            `;


            statuses.forEach(status => {

                const name =
                    status.Status_Name ||
                    status.Contract_Status_Name ||
                    status.Status ||
                    status.name ||
                    "-";


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    name;


                option.textContent =
                    name;


                filter.appendChild(
                    option
                );

            });


        } catch (error) {

            console.warn(
                "Contract status API not available:",
                error
            );

        }

    }


    /* =====================================================
       FILTER EVENTS
    ===================================================== */

    const searchInput =
        getElement(
            "contractSearch"
        );


    if (searchInput) {

        let searchTimer;


        searchInput.addEventListener(
            "input",
            () => {

                clearTimeout(
                    searchTimer
                );


            searchTimer =setTimeout(() => {

            currentContractPage = 1;

            loadContracts(1);

        },
        350
    );

            }
        );

    }


    const typeFilter =
        getElement(
            "contractTypeFilter"
        );


    if (typeFilter) {

      typeFilter.addEventListener( "change",() => {

        currentContractPage = 1;

        loadContracts(1);

         }
        );
    }


    const statusFilter =
        getElement(
            "contractStatusFilter"
        );


    if (statusFilter) {

        statusFilter.addEventListener("change",() => {

        currentContractPage = 1;

        loadContracts(1);

         }
        );

    }


    /* =====================================================
       CLEAR FILTERS
    ===================================================== */

    const clearFiltersButton =
        getElement(
            "clearFiltersBtn"
        );


    if (clearFiltersButton) {

        clearFiltersButton.addEventListener(  "click",  () => {

        if (searchInput) {
            searchInput.value = "";
        }

        if (typeFilter) {
            typeFilter.value = "";
        }

        if (statusFilter) {
            statusFilter.value = "";
        }

        currentContractPage = 1;

        loadContracts(1);

        }
        );

    }


    /* =====================================================
       MODAL OPEN / CLOSE
    ===================================================== */

    function openModal(modalId) {

        const modal =
            getElement(
                modalId
            );


        if (!modal) {

            return;

        }


        modal.classList.add(
            "show"
        );

    }


    function closeModal(modalId) {

        const modal =
            getElement(
                modalId
            );


        if (!modal) {

            return;

        }


        modal.classList.remove(
            "show"
        );

    }


    /* =====================================================
       CLOSE MODAL BUTTONS
    ===================================================== */

    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const modalId =
                        this.dataset.closeModal;


                    closeModal(
                        modalId
                    );

                }
            );

        });


    /* =====================================================
       CLICK OUTSIDE MODAL
    ===================================================== */

    document
        .querySelectorAll(
            ".modal-overlay"
        )
        .forEach(modal => {

            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        this
                    ) {

                        closeModal(
                            this.id
                        );

                    }

                }
            );

        });


    /* =====================================================
       ESC CLOSE MODAL
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            document
                .querySelectorAll(
                    ".modal-overlay.show"
                )
                .forEach(modal => {

                    closeModal(
                        modal.id
                    );

                });

        }
    );


    /* =====================================================
       RESET CONTRACT FORM
    ===================================================== */

    function resetContractForm() {

        const form =
            getElement(
                "contractForm"
            );


        if (form) {

            form.reset();

        }


        const id =
            getElement(
                "contractId"
            );


        if (id) {

            id.value =
                "";

        }


        setText(
            "contractModalTitle",
            "Create Contract"
        );

    }


    /* =====================================================
       RESET UPLOAD FORM
    ===================================================== */

    function resetUploadForm() {

        const form =
            getElement(
                "uploadDocumentForm"
            );


        if (form) {

            form.reset();

        }


        const contractId =
            getElement(
                "uploadContractId"
            );


        if (
            contractId &&
            currentContractId
        ) {

            contractId.value =
                currentContractId;

        }

    }


    /* =====================================================
       STATUS HELPERS
    ===================================================== */

    function setStatus(
        elementId,
        status
    ) {

        const element =
            getElement(
                elementId
            );


        if (!element) {

            return;

        }


        const normalized =
            String(
                status || "Draft"
            )
                .toLowerCase()
                .replace(
                    /\s+/g,
                    "-"
                );


        element.textContent =
            status || "Draft";


        element.className =
            `status-badge ${normalized}`;

    }


    function getStatusBadge(
        status
    ) {

        const normalized =
            String(
                status || "Draft"
            )
                .toLowerCase()
                .replace(
                    /\s+/g,
                    "-"
                );


        return `

            <span class="status-badge ${normalized}">

                ${escapeHtml(
                    status || "Draft"
                )}

            </span>

        `;

    }


    /* =====================================================
       EXPIRATION
    ===================================================== */

    function updateExpiration(
        effectiveDate,
        expiryDate
    ) {

        const expirationDate =
            getElement(
                "expirationDate"
            );


        const remainingDays =
            getElement(
                "remainingDays"
            );


        const progress =
            getElement(
                "expirationProgress"
            );


        if (!expiryDate) {

            if (expirationDate) {

                expirationDate.textContent =
                    "-";

            }


            if (remainingDays) {

                remainingDays.textContent =
                    "-";

            }


            if (progress) {

                progress.style.width =
                    "0%";

            }


            return;

        }


        const expiry =
            new Date(
                expiryDate
            );


        const today =
            new Date();


        today.setHours(
            0,
            0,
            0,
            0
        );


        expiry.setHours(
            0,
            0,
            0,
            0
        );


        const difference =
            expiry.getTime() -
            today.getTime();


        const days =
            Math.ceil(
                difference /
                (
                    1000 *
                    60 *
                    60 *
                    24
                )
            );


        if (expirationDate) {

            expirationDate.textContent =
                formatDate(
                    expiryDate
                );

        }


        if (remainingDays) {

            if (days > 0) {

                remainingDays.textContent =
                    `${days} day(s) remaining`;

            } else if (days === 0) {

                remainingDays.textContent =
                    "Expires today";

            } else {

                remainingDays.textContent =
                    `Expired ${Math.abs(days)} day(s) ago`;

            }

        }


        if (
            progress &&
            effectiveDate
        ) {

            const start =
                new Date(
                    effectiveDate
                );


            start.setHours(
                0,
                0,
                0,
                0
            );


            const total =
                expiry.getTime() -
                start.getTime();


            const elapsed =
                today.getTime() -
                start.getTime();


            let percentage =
                0;


            if (total > 0) {

                percentage =
                    (
                        elapsed /
                        total
                    ) * 100;

            }


            percentage =
                Math.max(
                    0,
                    Math.min(
                        100,
                        percentage
                    )
                );


            progress.style.width =
                `${percentage}%`;

        }

    }


    /* =====================================================
       TEXT HELPERS
    ===================================================== */

    function setText(
        id,
        value
    ) {

        const element =
            getElement(
                id
            );


        if (element) {

            element.textContent =
                value ?? "-";

        }

    }


    function formatDate(
        value
    ) {

        if (!value) {

            return "-";

        }


        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return value;

        }


        return date.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }


    function formatDateTime(
        value
    ) {

        if (!value) {

            return "-";

        }


        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return value;

        }


        return date.toLocaleString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    function normalizeDateInput(
        value
    ) {

        if (!value) {

            return "";

        }


        return String(
            value
        ).substring(
            0,
            10
        );

    }


    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHtml(
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* =====================================================
       ASSIGN USERS
    ===================================================== */

    async function openAssignUsersModal(
        contractId,
        contractName
    ) {

        if (!isContractManager()) {

            showMessage(
                "Only Contract Manager can assign users."
            );

            return;

        }


        if (!contractId) {

            showMessage(
                "Contract ID is missing."
            );

            return;

        }


        assignUsersContractId =
            contractId;


        const contractNameElement =
            getElement(
                "assignUsersContractName"
            );


        if (contractNameElement) {

            contractNameElement.textContent =
                contractName || "";

        }


        const searchInput =
            getElement(
                "assignUserSearch"
            );


        if (searchInput) {

            searchInput.value =
                "";

        }


        const container =
            getElement(
                "assignUsersContainer"
            );


        if (container) {

            container.innerHTML = `

                <div class="loading-state">

                    Loading assigned users...

                </div>

            `;

        }


        openModal(
            "assignUsersModal"
        );


        await loadAssignableUsers();

    }


    /* =====================================================
       LOAD ASSIGNABLE USERS
    ===================================================== */

    async function loadAssignableUsers() {

        if (!isContractManager()) {

            return;

        }


        if (!assignUsersContractId) {

            return;

        }


        const container =
            getElement(
                "assignUsersContainer"
            );


        if (!container) {

            return;

        }


        const search =
            getElement(
                "assignUserSearch"
            )?.value.trim() || "";


        container.innerHTML = `

            <div class="loading-state">

                ${
                    search
                        ? "Searching Legal Users..."
                        : "Loading assigned users..."
                }

            </div>

        `;


        try {

            const url =
                `/contracts/assignable-users` +
                `?contract_id=${encodeURIComponent(
                    assignUsersContractId
                )}` +
                `&search=${encodeURIComponent(
                    search
                )}` +
                `&per_page=100`;


            const response =
                await authFetch(
                    url
                );


            const data =
                await parseResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load Legal Users."
                );

            }


            const users =
                data.users || [];


            if (!users.length) {

                if (search) {

                    container.innerHTML = `

                        <div class="empty-state">

                            No active Legal Users found for
                            "<strong>${escapeHtml(
                                search
                            )}</strong>".

                        </div>

                    `;

                } else {

                    container.innerHTML = `

                        <div class="empty-state">

                            No users assigned to this contract.

                        </div>

                    `;

                }


                return;

            }


            container.innerHTML =
                users.map(user => {

                    const userId =
                        user.User_ID;


                    const userName =
                        escapeHtml(
                            user.Name ||
                            user.User_Name ||
                            "-"
                        );


                    const userEmail =
                        escapeHtml(
                            user.Email ||
                            "-"
                        );


                    const isAssigned =
                        Boolean(
                            user.assigned
                        );


                    const checked =
                        isAssigned
                            ? "checked"
                            : "";


                    const removeButton =
                        isAssigned
                            ? `

                                <button
                                    type="button"
                                    class="remove-assigned-user-btn"
                                    data-user-id="${userId}"
                                    title="Remove user"
                                    aria-label="Remove user">

                                    ×

                                </button>

                            `
                            : "";


                    return `

                        <div
                            class="assign-user-row"
                            style="
                                display:flex;
                                align-items:center;
                                justify-content:space-between;
                                padding:12px;
                                border:1px solid #e5e7eb;
                                border-radius:8px;
                                margin-bottom:8px;
                            "
                        >

                            <label
                                style="
                                    display:flex;
                                    align-items:center;
                                    gap:10px;
                                    flex:1;
                                    cursor:pointer;
                                "
                            >

                                <input
                                    type="checkbox"
                                    class="assign-user-checkbox"
                                    value="${userId}"
                                    ${checked}
                                >


                                <span>

                                    <strong>

                                        ${userName}

                                    </strong>


                                    <br>


                                    <small
                                        style="
                                            color:#6b7280;
                                        "
                                    >

                                        ${userEmail}

                                    </small>

                                </span>

                            </label>


                            ${removeButton}

                        </div>

                    `;

                }).join("");


            container
                .querySelectorAll(
                    ".remove-assigned-user-btn"
                )
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        async () => {

                            if (
                                !isContractManager()
                            ) {

                                showMessage(
                                    "Only Contract Manager can remove assigned users."
                                );

                                return;

                            }


                            const userId =
                                Number(
                                    button.dataset.userId
                                );


                            if (!userId) {

                                return;

                            }


                            await removeAssignedUser(
                                userId
                            );

                        }
                    );

                });


        } catch (error) {

            console.error(
                "LOAD ASSIGNABLE USERS ERROR:",
                error
            );


            container.innerHTML = `

                <div class="empty-state">

                    Unable to load Legal Users.

                </div>

            `;


            showMessage(
                error.message ||
                "Unable to load Legal Users."
            );

        }

    }


    /* =====================================================
       SAVE SELECTED USERS
    ===================================================== */

    async function saveAssignedUsers() {

        if (!isContractManager()) {

            showMessage(
                "Only Contract Manager can assign users."
            );

            return;

        }


        if (!assignUsersContractId) {

            showMessage(
                "Contract ID is missing."
            );

            return;

        }


        const checkboxes =
            document.querySelectorAll(
                "#assignUsersContainer .assign-user-checkbox"
            );


        const userIds =
            Array.from(
                checkboxes
            )
                .filter(
                    checkbox =>
                        checkbox.checked
                )
                .map(
                    checkbox =>
                        Number(
                            checkbox.value
                        )
                )
                .filter(
                    userId =>
                        Number.isInteger(
                            userId
                        ) &&
                        userId > 0
                );


        try {

            const response =
                await authFetch(

                    `/contracts/${encodeURIComponent(
                        assignUsersContractId
                    )}/assign-users`,

                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                User_IDs:
                                    userIds

                            })
                    }

                );


            const data =
                await parseResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to assign users."
                );

            }


            showMessage(
                "Users assigned successfully."
            );


            closeModal(
                "assignUsersModal"
            );


            const searchInput =
                getElement(
                    "assignUserSearch"
                );


            if (searchInput) {

                searchInput.value =
                    "";

            }


            const container =
                getElement(
                    "assignUsersContainer"
                );


            if (container) {

                container.innerHTML =
                    "";

            }


            assignUsersContractId =
                null;


        } catch (error) {

            console.error(
                "ASSIGN USERS ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Unable to assign users."
            );

        }

    }


    /* =====================================================
       REMOVE ASSIGNED USER
    ===================================================== */

    async function removeAssignedUser(
        userId
    ) {

        if (!isContractManager()) {

            showMessage(
                "Only Contract Manager can remove assigned users."
            );

            return;

        }


        if (!assignUsersContractId) {

            return;

        }


        const confirmed =
            confirm(
                "Are you sure you want to remove this user from the contract?"
            );


        if (!confirmed) {

            return;

        }


        try {

            const response =
                await authFetch(

                    `/contracts/${encodeURIComponent(
                        assignUsersContractId
                    )}/assign-users/${encodeURIComponent(
                        userId
                    )}`,

                    {
                        method: "DELETE"
                    }

                );


            const data =
                await parseResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to remove user."
                );

            }


            showMessage(
                "User removed from contract."
            );


            await loadAssignableUsers();


        } catch (error) {

            console.error(
                "REMOVE USER ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Unable to remove user."
            );

        }

    }


    /* =====================================================
       ASSIGN USERS BUTTON
    ===================================================== */

    const assignUsersButton =
        getElement(
            "assignUsersBtn"
        );


    if (assignUsersButton) {

        assignUsersButton.addEventListener(
            "click",
            async () => {

                if (!isContractManager()) {

                    showMessage(
                        "Only Contract Manager can assign users."
                    );

                    return;

                }


                if (!currentContractId) {

                    showMessage(
                        "Please select a contract first."
                    );

                    return;

                }


                await openAssignUsersModal(

                    currentContractId,

                    currentContract?.Contract_Name

                );

            }
        );

    }


    /* =====================================================
       SAVE ASSIGNED USERS BUTTON
    ===================================================== */

    const saveAssignedUsersButton =
        getElement(
            "saveAssignedUsersBtn"
        );


    if (saveAssignedUsersButton) {

        saveAssignedUsersButton.addEventListener(
            "click",
            saveAssignedUsers
        );

    }


    /* =====================================================
       SEARCH LEGAL USERS
    ===================================================== */

    const assignUserSearch =
        getElement(
            "assignUserSearch"
        );


    if (assignUserSearch) {

        let assignSearchTimer;


        assignUserSearch.addEventListener(
            "input",
            () => {

                clearTimeout(
                    assignSearchTimer
                );


                assignSearchTimer =
                    setTimeout(
                        () => {

                            loadAssignableUsers();

                        },
                        350
                    );

            }
        );

    }


    /* =====================================================
       EXPOSE FUNCTIONS
       FOR OTHER JS FILES / HTML
    ===================================================== */

    window.loadContractDocuments =
        loadContractDocuments;

    window.loadContractApprovals =
        loadContractApprovals;




});