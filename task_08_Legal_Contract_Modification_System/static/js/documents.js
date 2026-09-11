/* ========================= DOCUMENTS.================================*/
  

  
let allDocuments = [];
let filteredDocuments = [];

let currentPage = 1;
let perPage = 5;

let currentUserRole = "";

let contractSearchTimer = null;


// PAGE LOAD

document.addEventListener("DOMContentLoaded", async function () {

    await loadCurrentUser();

    initializeEvents();

    await loadDocuments();

});


// INITIALIZE EVENTS

function initializeEvents() {

    const uploadForm = document.getElementById("uploadDocumentForm");

    if (uploadForm) {

        uploadForm.addEventListener(
            "submit",
            uploadDocument
        );

    }


    const searchInput =document.getElementById("searchInput");

    if (searchInput) {

        searchInput.addEventListener( "input", applyFilters  );

    }


    const contractTypeFilter =document.getElementById("contractTypeFilter");

    if (contractTypeFilter) {

        contractTypeFilter.addEventListener( "change",
            applyFilters
        );

    }


    const typeFilter =
        document.getElementById("typeFilter");

    if (typeFilter) {

        typeFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    const statusFilter =
        document.getElementById("statusFilter");

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    const contractSearch =document.getElementById("uploadContractSearch");

    if (contractSearch) {

        contractSearch.addEventListener(
            "input",
            function () {

                const search =
                    this.value.trim();

                clearTimeout(contractSearchTimer);

                if (!search) {

                    const results =
                        document.getElementById(
                            "contractSearchResults"
                        );

                    if (results) {
                        results.style.display = "none";
                    }

                    return;
                }


                contractSearchTimer =
                    setTimeout(
                        function () {
                            searchContracts(search);
                        },
                        300
                    );

            }
        );

    }

}


/* =========================================================
   RESPONSE HELPER
   ========================================================= */

async function getResponseData(response) {

    const text = await response.text();

    if (!text) {
        return {};
    }

    try {

        return JSON.parse(text);

    } catch (error) {

        return {
            message: text
        };

    }

}


/* =========================================================
   LOAD CURRENT USER
   ========================================================= */

async function loadCurrentUser() {

    try {

        const response =
            await fetch(
                "/users/profile",
                {
                    method: "GET",
                    credentials: "include"
                }
            );


        const data =    await getResponseData(response);


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load user profile."
            );

        }


        const user = data.user || data;


        currentUserRole =
            (
                user.Role_Name ||
                user.role_name ||
                user.role?.Role_Name ||
                ""
            ).trim();


        updateUploadButton();


    } catch (error) {

        console.error(
            "Error loading current user:",
            error
        );

        currentUserRole = "";

        updateUploadButton();

    }

}


/* =========================================================
   UPDATE UPLOAD BUTTON
   ========================================================= */

function updateUploadButton() {

    const uploadButton =document.getElementById("openUploadBtn");


    if (!uploadButton) {
        return;
    }


    if (
        currentUserRole.toLowerCase() ===
        "contract manager"
    ) {

        uploadButton.style.display = "inline-flex";

    } else {

        uploadButton.style.display = "none";

    }

}


/* =========================================================
   LOAD ALL DOCUMENTS
   ========================================================= */

async function loadDocuments() {

    const tableBody = document.getElementById(
            "documentsTableBody"
        );

    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = `
        <tr>
            <td colspan="8" class="loading-row">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Loading documents...
            </td>
        </tr>
    `;


    try {

        const response =
            await fetch(
                "/documents",
                {
                    method: "GET",
                    credentials: "include"
                }
            );


        const data =await getResponseData(response);


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to load documents."
            );

        }


        allDocuments =data.documents || [];


        filteredDocuments =  [...allDocuments];


        populateContractTypeFilter();

        renderDocuments();


    } catch (error) {

        console.error(
            "Error loading documents:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="loading-row">
                    Unable to load documents.
                </td>
            </tr>
        `;


        showMessage(
            error.message ||
            "Unable to load documents.",
            "error"
        );

    }

}


/* =========================================================
   POPULATE CONTRACT TYPE FILTER
   ========================================================= */

function populateContractTypeFilter() {

    const filter =
        document.getElementById(
            "contractTypeFilter"
        );


    if (!filter) {
        return;
    }


    const currentValue =
        filter.value;


    const types =
        new Map();


    allDocuments.forEach(
        function (document) {

            if (
                document.Contract_Type_ID &&
                document.Contract_Type_Name
            ) {

                types.set(
                    document.Contract_Type_ID,
                    document.Contract_Type_Name
                );

            }

        }
    );


    filter.innerHTML = `
        <option value="">
            All Contract Types
        </option>
    `;


    types.forEach(
        function (name, id) {

            const option =document.createElement("option");

            option.value = id;

            option.textContent = name;

            filter.appendChild(option);

        }
    );


    if (currentValue) {
        filter.value = currentValue;
    }

}


/* =========================================================
   APPLY FILTERS
   ========================================================= */

function applyFilters() {

    const search =
        (
            document.getElementById(
                "searchInput"
            )?.value || ""
        ).trim().toLowerCase();


    const contractType =
        document.getElementById(
            "contractTypeFilter"
        )?.value || "";


    const documentType =
        document.getElementById(
            "typeFilter"
        )?.value || "";


    const status =
        document.getElementById(
            "statusFilter"
        )?.value || "";


    filteredDocuments =
        allDocuments.filter(
            function (document) {

                const matchesSearch =
                    !search ||
                    String(
                        document.Document_ID || ""
                    )
                    .toLowerCase()
                    .includes(search) ||

                    String(
                        document.Document_Name || ""
                    )
                    .toLowerCase()
                    .includes(search) ||

                    String(
                        document.Contract_Name || ""
                    )
                    .toLowerCase()
                    .includes(search);


                const matchesContractType =
                    !contractType ||
                    String(
                        document.Contract_Type_ID || ""
                    ) === String(contractType);


                const matchesDocumentType =
                    !documentType ||
                    String(
                        document.Document_Type || ""
                    ).toLowerCase() ===
                    documentType.toLowerCase();


                const matchesStatus =
                    !status ||
                    String(
                        document.Status || ""
                    ).toLowerCase() ===
                    status.toLowerCase();


                return (
                    matchesSearch &&
                    matchesContractType &&
                    matchesDocumentType &&
                    matchesStatus
                );

            }
        );


    currentPage = 1;

    renderDocuments();

}


/* =========================================================
   RESET FILTERS
   ========================================================= */

function resetFilters() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );

    const contractTypeFilter =
        document.getElementById(
            "contractTypeFilter"
        );

    const typeFilter =
        document.getElementById(
            "typeFilter"
        );

    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    if (searchInput) {
        searchInput.value = "";
    }


    if (contractTypeFilter) {
        contractTypeFilter.value = "";
    }


    if (typeFilter) {
        typeFilter.value = "";
    }


    if (statusFilter) {
        statusFilter.value = "";
    }


    filteredDocuments =
        [...allDocuments];


    currentPage = 1;

    renderDocuments();

}


/* =========================================================
   RENDER DOCUMENTS
   ========================================================= */

function renderDocuments() {

    const tableBody =
        document.getElementById(
            "documentsTableBody"
        );


    const emptyState =
        document.getElementById(
            "emptyState"
        );


    const documentCount =
        document.getElementById(
            "documentCount"
        );


    if (!tableBody) {
        return;
    }


    if (documentCount) {

        documentCount.textContent =
            filteredDocuments.length;

    }


    if (filteredDocuments.length === 0) {

        tableBody.innerHTML = "";

        if (emptyState) {
            emptyState.style.display = "block";
        }

        renderPagination();

        return;

    }


    if (emptyState) {
        emptyState.style.display = "none";
    }


    const startIndex =
        (currentPage - 1) * perPage;


    const endIndex =
        startIndex + perPage;


    const pageDocuments =
        filteredDocuments.slice(
            startIndex,
            endIndex
        );


    tableBody.innerHTML =
        pageDocuments
            .map(renderDocumentRow)
            .join("");


    renderPagination();

}


/* =========================================================
   RENDER DOCUMENT ROW
   ========================================================= */

function renderDocumentRow(document) {

    const documentId =
        document.Document_ID || "";


    const documentName =
        escapeHtml(
            document.Document_Name || "-"
        );


    const contractName =
        escapeHtml(
            document.Contract_Name || "-"
        );


    const documentType =
        escapeHtml(
            document.Document_Type || "-"
        );


    const status =
        document.Status || "Active";


    const statusClass =
        status.toLowerCase() === "active"
            ? "status-active"
            : "status-archived";


    let actions = `

        <button
            type="button"
            class="action-btn view-btn"
            title="View"
            onclick="viewDocument(${documentId})">

            <i class="fa-solid fa-eye"></i>

        </button>


        <button
            type="button"
            class="action-btn download-btn"
            title="Download"
            onclick="downloadDocument(${documentId})">

            <i class="fa-solid fa-download"></i>

        </button>

    `;


    if (
        currentUserRole.toLowerCase() ===
        "contract manager"
    ) {

        actions += `

            <button
                type="button"
                class="action-btn edit-btn"
                title="Edit"
                onclick="openEditDocument(${documentId})">

                <i class="fa-solid fa-pen"></i>

            </button>


            <button
                type="button"
                class="action-btn delete-btn"
                title="Delete"
                onclick="deleteDocument(${documentId})">

                <i class="fa-solid fa-trash"></i>

            </button>

        `;

    }


    return `

        <tr>

            <td>
                <span class="document-id">
                    #${documentId}
                </span>
            </td>


            <td>

                <div class="contract-name">
                    ${contractName}
                </div>

            </td>


            <td>

                <div class="document-name">
                    ${documentName}
                </div>

            </td>


            <td>

                <span class="file-type">
                    ${documentType}
                </span>

            </td>


            <td>

                <span class="status-badge ${statusClass}">
                    ${escapeHtml(status)}
                </span>

            </td>


            <td>
                ${formatDate(document.Created_At)}
            </td>


            <td>

                <div class="action-buttons">
                    ${actions}
                </div>

            </td>

        </tr>

    `;

}


/* =========================================================
   PAGINATION
   ========================================================= */

function renderPagination() {

    const pagination =
        document.getElementById(
            "pagination"
        );


    const paginationInfo =
        document.getElementById(
            "paginationInfo"
        );


    if (!pagination) {
        return;
    }


    const total =
        filteredDocuments.length;


    const totalPages =
        Math.ceil(total / perPage);


    if (paginationInfo) {

        if (total === 0) {

            paginationInfo.textContent =
                "No documents found";

        } else {

            const start =
                (currentPage - 1) * perPage + 1;

            const end =
                Math.min(
                    currentPage * perPage,
                    total
                );


            paginationInfo.textContent =
                `Showing ${start}-${end} of ${total} documents`;

        }

    }


    pagination.innerHTML = "";


    if (totalPages <= 1) {
        return;
    }


    const previousButton =
        document.createElement("button");


    previousButton.type = "button";

    previousButton.className =
        "page-btn";


    previousButton.innerHTML =
        `<i class="fa-solid fa-chevron-left"></i>`;


    previousButton.disabled =
        currentPage === 1;


    previousButton.addEventListener(
        "click",
        function () {

            if (currentPage > 1) {

                currentPage--;

                renderDocuments();

            }

        }
    );


    pagination.appendChild(
        previousButton
    );


    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        const pageButton =
            document.createElement("button");


        pageButton.type = "button";

        pageButton.className =
            "page-btn";


        if (page === currentPage) {
            pageButton.classList.add("active");
        }


        pageButton.textContent =
            page;


        pageButton.addEventListener(
            "click",
            function () {

                currentPage = page;

                renderDocuments();

            }
        );


        pagination.appendChild(
            pageButton
        );

    }


    const nextButton =
        document.createElement("button");


    nextButton.type = "button";

    nextButton.className =
        "page-btn";


    nextButton.innerHTML =
        `<i class="fa-solid fa-chevron-right"></i>`;


    nextButton.disabled =
        currentPage === totalPages;


    nextButton.addEventListener(
        "click",
        function () {

            if (currentPage < totalPages) {

                currentPage++;

                renderDocuments();

            }

        }
    );


    pagination.appendChild(
        nextButton
    );

}


/* =========================================================
   OPEN UPLOAD MODAL
   ========================================================= */

function openUploadModal() {

    if (
        currentUserRole.toLowerCase() !==
        "contract manager"
    ) {

        showMessage(
            "Only Contract Manager can upload documents.",
            "error"
        );

        return;

    }


    const modal =
        document.getElementById(
            "uploadDocumentModal"
        );


    const form =
        document.getElementById(
            "uploadDocumentForm"
        );


    if (!modal) {
        return;
    }


    if (form) {
        form.reset();
    }


    const contractId =
        document.getElementById(
            "uploadContractId"
        );


    const contractSearch =
        document.getElementById(
            "uploadContractSearch"
        );


    const searchResults =
        document.getElementById(
            "contractSearchResults"
        );


    const clearButton =
        document.getElementById(
            "clearContractSearch"
        );


    if (contractId) {
        contractId.value = "";
    }


    if (contractSearch) {
        contractSearch.value = "";
    }


    if (searchResults) {

        searchResults.innerHTML = "";

        searchResults.style.display = "none";

    }


    if (clearButton) {
        clearButton.style.display = "none";
    }


    modal.classList.add("show");


    setTimeout(
        function () {

            if (contractSearch) {
                contractSearch.focus();
            }

        },
        100
    );

}


/* =========================================================
   CLOSE UPLOAD MODAL
   ========================================================= */

function closeUploadModal() {

    const modal =
        document.getElementById(
            "uploadDocumentModal"
        );


    if (modal) {
        modal.classList.remove("show");
    }

}


/* =========================================================
   CLEAR SELECTED CONTRACT
   ========================================================= */

function clearSelectedContract() {

    const contractId =
        document.getElementById(
            "uploadContractId"
        );


    const contractSearch =
        document.getElementById(
            "uploadContractSearch"
        );


    const results =
        document.getElementById(
            "contractSearchResults"
        );


    const clearButton =
        document.getElementById(
            "clearContractSearch"
        );


    if (contractId) {
        contractId.value = "";
    }


    if (contractSearch) {

        contractSearch.value = "";

        contractSearch.focus();

    }


    if (results) {

        results.innerHTML = "";

        results.style.display = "none";

    }


    if (clearButton) {

        clearButton.style.display =
            "none";

    }

}


/* =========================================================
   SEARCH CONTRACTS FOR UPLOAD
   ========================================================= */

async function searchContracts(search) {

    const results =
        document.getElementById(
            "contractSearchResults"
        );


    if (!results) {
        return;
    }


    if (!search) {

        results.style.display = "none";

        return;

    }


    results.style.display = "block";


    results.innerHTML = `

        <div class="contract-search-loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            Searching contracts...

        </div>

    `;


    try {

        const response =
            await fetch(
                `/contracts?search=${encodeURIComponent(search)}&page=1&per_page=10`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );


        const data =
            await getResponseData(response);


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to search contracts."
            );

        }


        const contracts =
            data.contracts || [];


        if (contracts.length === 0) {

            results.innerHTML = `

                <div class="contract-search-empty">

                    No contracts found.

                </div>

            `;

            return;

        }


        results.innerHTML = "";


        contracts.forEach(
            function (contract) {

                const result =
                    document.createElement("div");


                result.className =
                    "contract-search-result";


                result.innerHTML = `

                    <div class="contract-search-name">
                        ${escapeHtml(
                            contract.Contract_Name || "-"
                        )}
                    </div>

                    <div class="contract-search-type">
                        ${escapeHtml(
                            contract.Contract_Type_Name || "-"
                        )}
                    </div>

                `;


                result.addEventListener(
                    "click",
                    function () {

                        selectContract(
                            contract.Contract_ID,
                            contract.Contract_Name
                        );

                    }
                );


                results.appendChild(result);

            }
        );


    } catch (error) {

        console.error(
            "Contract search error:",
            error
        );


        results.innerHTML = `

            <div class="contract-search-error">

                ${escapeHtml(
                    error.message ||
                    "Unable to search contracts."
                )}

            </div>

        `;

    }

}


/* =========================================================
   SELECT CONTRACT
   ========================================================= */

function selectContract(
    contractId,
    contractName
) {

    const hiddenInput =
        document.getElementById(
            "uploadContractId"
        );


    const searchInput =
        document.getElementById(
            "uploadContractSearch"
        );


    const results =
        document.getElementById(
            "contractSearchResults"
        );


    const clearButton =
        document.getElementById(
            "clearContractSearch"
        );


    if (hiddenInput) {

        hiddenInput.value =
            contractId;

    }


    if (searchInput) {

        searchInput.value =
            contractName || "";

    }


    if (results) {

        results.innerHTML = "";

        results.style.display = "none";

    }


    if (clearButton) {

        clearButton.style.display =
            "block";

    }

}


/* =========================================================
   UPLOAD DOCUMENT
   ========================================================= */

async function uploadDocument(event) {

    event.preventDefault();


    if (
        currentUserRole.toLowerCase() !==
        "contract manager"
    ) {

        showMessage(
            "Only Contract Manager can upload documents.",
            "error"
        );

        return;

    }


    const contractId =
        document.getElementById(
            "uploadContractId"
        )?.value.trim();


    const documentName =
        document.getElementById(
            "documentName"
        )?.value.trim();


    const fileInput =
        document.getElementById(
            "documentFile"
        );


    const file =
        fileInput?.files?.[0];


    /* -----------------------------------------------------
       BASIC VALIDATION
       ----------------------------------------------------- */

    if (!contractId) {

        showMessage(
            "Please select a contract.",
            "error"
        );

        return;

    }


    if (!documentName) {

        showMessage(
            "Please enter document name.",
            "error"
        );

        return;

    }


    if (!file) {

        showMessage(
            "Please select a document file.",
            "error"
        );

        return;

    }


    /* -----------------------------------------------------
       FILE TYPE VALIDATION
       NO FILE SIZE VALIDATION
       ----------------------------------------------------- */

    const fileName =
        file.name.toLowerCase();


    const allowedExtensions =
        [
            ".pdf",
            ".docx",
            ".txt"
        ];


    const isAllowed =
        allowedExtensions.some(
            function (extension) {

                return fileName.endsWith(
                    extension
                );

            }
        );


    if (!isAllowed) {

        showMessage(
            "Only PDF, DOCX and TXT files are allowed.",
            "error"
        );

        return;

    }


    /* -----------------------------------------------------
       FORM DATA
       ----------------------------------------------------- */

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


    formData.append(
        "file",
        file
    );


    /* -----------------------------------------------------
       DISABLE SUBMIT BUTTON
       ----------------------------------------------------- */

    const submitButton =
        document.querySelector(
            "#uploadDocumentForm button[type='submit']"
        );


    const originalButtonText =
        submitButton
            ? submitButton.innerHTML
            : "";


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>
            Uploading...

        `;

    }


    try {

        const response =
            await fetch(
                "/documents",
                {
                    method: "POST",
                    credentials: "include",
                    body: formData
                }
            );


        const data =
            await getResponseData(response);


        if (!response.ok) {

            throw new Error(
                data.message ||
                `Document upload failed (${response.status}).`
            );

        }


        /* -------------------------------------------------
           CLOSE MODAL FIRST
           THEN SHOW SUCCESS MESSAGE
           ------------------------------------------------- */

        closeUploadModal();


        showMessage(
            data.message ||
            "Document uploaded successfully.",
            "success"
        );


        /* -------------------------------------------------
           REFRESH STANDALONE DOCUMENT TABLE
           ------------------------------------------------- */

        await loadDocuments();


        /* -------------------------------------------------
           REFRESH CURRENT CONTRACT DETAILS
           ------------------------------------------------- */

        const uploadedContractId =
            Number(contractId);


        if (
            window.currentContractId &&
            Number(window.currentContractId) ===
            uploadedContractId
        ) {

            if (
                typeof window.loadContractDocuments ===
                "function"
            ) {

                await window.loadContractDocuments(
                    uploadedContractId
                );

            }


            if (
                typeof window.loadContractVersions ===
                "function"
            ) {

                await window.loadContractVersions(
                    uploadedContractId
                );

            }


            if (
                typeof window.loadContractClauses ===
                "function"
            ) {

                await window.loadContractClauses(
                    uploadedContractId
                );

            }

        }


    } catch (error) {

        console.error(
            "Document upload error:",
            error
        );


        showMessage(
            error.message ||
            "Document upload failed.",
            "error"
        );

    } finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.innerHTML =
                originalButtonText;

        }

    }

}


/* =========================================================
   VIEW DOCUMENT
   ========================================================= */

function viewDocument(documentId) {

    if (!documentId) {
        return;
    }


    window.open(
        `/documents/${documentId}/view`,
        "_blank"
    );

}


/* =========================================================
   DOWNLOAD DOCUMENT
   ========================================================= */

function downloadDocument(documentId) {

    if (!documentId) {
        return;
    }


    window.location.href =
        `/documents/${documentId}/download`;

}


/* =========================================================
   OPEN EDIT DOCUMENT MODAL
   ========================================================= */

async function openEditDocument(documentId) {

    if (
        currentUserRole.toLowerCase() !==
        "contract manager"
    ) {

        showMessage(
            "Only Contract Manager can edit documents.",
            "error"
        );

        return;

    }

    try {

        const response =
            await fetch(
                `/documents/${documentId}`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

        const data =
            await getResponseData(response);

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load document."
            );

        }

        const documentData =
            data.document || data;


        const idInput =
            document.getElementById(
                "editDocumentId"
            );

        const nameInput =
            document.getElementById(
                "editDocumentName"
            );

        const statusInput =
            document.getElementById(
                "editDocumentStatus"
            );


        if (idInput) {

            idInput.value =
                documentData.Document_ID;

        }


        if (nameInput) {

            nameInput.value =
                documentData.Document_Name || "";

        }


        if (statusInput) {

            statusInput.value =
                documentData.Status || "Active";

        }


        const modal =
            document.getElementById(
                "editDocumentModal"
            );

        if (modal) {

            modal.classList.add("show");

        }

    } catch (error) {

        console.error(
            "Edit document load error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to load document.",
            "error"
        );

    }

}


/* =========================================================
   CLOSE EDIT MODAL
   ========================================================= */

function closeEditDocumentModal() {

    const modal =
        document.getElementById(
            "editDocumentModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}


/* =========================================================
   UPDATE DOCUMENT
   ========================================================= */

async function updateDocument(event) {

    event.preventDefault();


    if (
        currentUserRole.toLowerCase() !==
        "contract manager"
    ) {

        showMessage(
            "Only Contract Manager can update documents.",
            "error"
        );

        return;

    }


    const documentId =
        document.getElementById(
            "editDocumentId"
        )?.value;


    const documentName =
        document.getElementById(
            "editDocumentName"
        )?.value.trim();


    const status =
        document.getElementById(
            "editDocumentStatus"
        )?.value;


    if (!documentId) {

        showMessage(
            "Document ID is missing.",
            "error"
        );

        return;

    }


    if (!documentName) {

        showMessage(
            "Document name is required.",
            "error"
        );

        return;

    }


    try {

        const response =
            await fetch(
                `/documents/${documentId}`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        Document_Name:
                            documentName,
                        Status:
                            status
                    })
                }
            );


        const data =
            await getResponseData(response);


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Document update failed."
            );

        }


        closeEditDocumentModal();


        showMessage(
            data.message ||
            "Document updated successfully.",
            "success"
        );


        await loadDocuments();


        if (
            window.currentContractId &&
            typeof window.loadContractDocuments ===
            "function"
        ) {

            await window.loadContractDocuments(
                window.currentContractId
            );

        }


    } catch (error) {

        console.error(
            "Update document error:",
            error
        );


        showMessage(
            error.message ||
            "Document update failed.",
            "error"
        );

    }

}


/* =========================================================
   DELETE DOCUMENT
   ========================================================= */

async function deleteDocument(documentId) {

    if (
        currentUserRole.toLowerCase() !==
        "contract manager"
    ) {

        showMessage(
            "Only Contract Manager can delete documents.",
            "error"
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
            await fetch(
                `/documents/${documentId}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );


        const data =
            await getResponseData(response);


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Document deletion failed."
            );

        }


        showMessage(
            data.message ||
            "Document deleted successfully.",
            "success"
        );


        await loadDocuments();


        if (
            window.currentContractId &&
            typeof window.loadContractDocuments ===
            "function"
        ) {

            await window.loadContractDocuments(
                window.currentContractId
            );

        }


    } catch (error) {

        console.error(
            "Delete document error:",
            error
        );


        showMessage(
            error.message ||
            "Document deletion failed.",
            "error"
        );

    }

}


/* =========================================================
   CONTRACT DETAILS - LOAD DOCUMENTS
   ========================================================= */

window.loadContractDocuments =
    async function (contractId) {

        const container =
            document.getElementById(
                "contractDocumentsContainer"
            );


        const countElement =
            document.getElementById(
                "documentsCount"
            );


        if (!container) {
            return;
        }


        container.innerHTML = `

            <div class="loading-row">

                <i class="fa-solid fa-spinner fa-spin"></i>

                Loading documents...

            </div>

        `;


        try {

            const response =
                await fetch(
                    `/documents/contract/${contractId}`,
                    {
                        method: "GET",
                        credentials: "include"
                    }
                );


            const data =
                await getResponseData(response);


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load contract documents."
                );

            }


            const documents =
                data.documents || [];


            if (countElement) {

                countElement.textContent =
                    documents.length;

            }


            if (documents.length === 0) {

                container.innerHTML = `

                    <div class="empty-state">

                        <div class="empty-icon">

                            <i class="fa-solid fa-file"></i>

                        </div>

                        <h3>No Documents</h3>

                        <p>
                            No documents are available
                            for this contract.
                        </p>

                    </div>

                `;

                return;

            }


            container.innerHTML =
                documents
                    .map(
                        function (document) {

                            return renderContractDocument(
                                document
                            );

                        }
                    )
                    .join("");


        } catch (error) {

            console.error(
                "Contract documents error:",
                error
            );


            container.innerHTML = `

                <div class="contract-search-error">

                    ${escapeHtml(
                        error.message ||
                        "Unable to load documents."
                    )}

                </div>

            `;

        }

    };


/* =========================================================
   RENDER CONTRACT DOCUMENT
   ========================================================= */

function renderContractDocument(document) {

    const documentId =
        document.Document_ID;


    const documentName =
        escapeHtml(
            document.Document_Name || "-"
        );


    const documentType =
        escapeHtml(
            document.Document_Type || "-"
        );


    const status =
        document.Status || "Active";


    const statusClass =
        status.toLowerCase() === "active"
            ? "status-active"
            : "status-archived";


    let actions = `

        <button
            type="button"
            class="action-btn view-btn"
            title="View"
            onclick="viewDocument(${documentId})">

            <i class="fa-solid fa-eye"></i>

        </button>


        <button
            type="button"
            class="action-btn download-btn"
            title="Download"
            onclick="downloadDocument(${documentId})">

            <i class="fa-solid fa-download"></i>

        </button>

    `;


    if (
        currentUserRole.toLowerCase() ===
        "contract manager"
    ) {

        actions += `

            <button
                type="button"
                class="action-btn edit-btn"
                title="Edit"
                onclick="openEditDocument(${documentId})">

                <i class="fa-solid fa-pen"></i>

            </button>


            <button
                type="button"
                class="action-btn delete-btn"
                title="Delete"
                onclick="deleteDocument(${documentId})">

                <i class="fa-solid fa-trash"></i>

            </button>

        `;

    }


    return `

        <div class="document-card">

            <div class="card-header">

                <div>

                    <h4>
                        ${documentName}
                    </h4>

                    <span class="file-type">
                        ${documentType}
                    </span>

                </div>


                <span
                    class="status-badge ${statusClass}">

                    ${escapeHtml(status)}

                </span>

            </div>


            <div class="action-buttons">

                ${actions}

            </div>

        </div>

    `;

}


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
    message,
    type = "success"
) {

    /*
       If base.js already provides a global
       showMessage(), use it.
    */

    if (
        typeof window.showMessage ===
        "function" &&
        window.showMessage !== showMessage
    ) {

        window.showMessage(
            message,
            type
        );

        return;

    }


    /*
       Fallback if base.js does not
       provide showMessage().
    */

    alert(message);

}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }


    try {

        const date =
            new Date(dateValue);


        if (isNaN(date.getTime())) {
            return "-";
        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    } catch (error) {

        return "-";

    }

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

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


/* =========================================================
   CLOSE MODALS WHEN CLICKING OUTSIDE
   ========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const uploadModal =
            document.getElementById(
                "uploadDocumentModal"
            );


        const editModal =
            document.getElementById(
                "editDocumentModal"
            );


        if (
            uploadModal &&
            event.target === uploadModal
        ) {

            closeUploadModal();

        }


        if (
            editModal &&
            event.target === editModal
        ) {

            closeEditDocumentModal();

        }

    }
);


/* =========================================================
   ESC KEY - CLOSE MODALS
   ========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key !== "Escape") {
            return;
        }


        closeUploadModal();

        closeEditDocumentModal();

    }
);


/* =========================================================
   EXPORT FUNCTIONS FOR INLINE HTML
   ========================================================= */

window.openUploadModal =
    openUploadModal;


window.closeUploadModal =
    closeUploadModal;


window.clearSelectedContract =
    clearSelectedContract;


window.searchContracts =
    searchContracts;


window.selectContract =
    selectContract;


window.uploadDocument =
    uploadDocument;


window.viewDocument =
    viewDocument;


window.downloadDocument =
    downloadDocument;


window.openEditDocument =
    openEditDocument;


window.closeEditDocumentModal =
    closeEditDocumentModal;


window.updateDocument =
    updateDocument;


window.deleteDocument =
    deleteDocument;


window.resetFilters =
    resetFilters;