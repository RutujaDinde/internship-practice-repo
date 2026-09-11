
/* =========================================================
   CLAUSES MANAGEMENT
   ========================================================= */


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let currentContractId = null;
let currentVersionId = null;
let currentVersionNumber = null;

let editingClauseId = null;


/* =========================================================
   CLAUSE CONTAINER
========================================================= */

const CLAUSE_CONTAINER_ID =
    "contractClausesContainer";


/* =========================================================
   ROLE CHECK
========================================================= */

/*
   Only Contract Manager can:

   - Create Clause
   - Edit Clause
   - Delete Clause

   All other roles are READ ONLY.
*/

function isContractManager() {

    return (
        typeof loggedInUserRole !== "undefined" &&
        loggedInUserRole === "Contract Manager"
    );
}


/* =========================================================
   LOAD CURRENT CONTRACT CLAUSES
========================================================= */

async function loadContractClauses(contractId) {

    try {

        currentContractId =   contractId;

        const container =   document.getElementById(
                CLAUSE_CONTAINER_ID
            );

        if (!container) {

            console.warn(
                "contractClausesContainer not found"
            );

            return;
        }

        container.innerHTML = `
            <div class="text-center py-4">

                <div
                    class="spinner-border text-primary"
                    role="status">
                </div>

                <div class="mt-2 text-muted">
                    Loading clauses...
                </div>

            </div>
        `;


        const response =await fetch(
                `/clauses/contract/${contractId}`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );


        if (response.status === 401) {

            window.location.href =
                "/login-page";

            return;
        }


        const result = await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to load clauses"
            );
        }


        /* =================================================
           VERSION INFORMATION
        ================================================= */

        if (
            result.Version_ID !== null &&
            result.Version_ID !== undefined
        ) {

            currentVersionId = result.Version_ID;

            currentVersionNumber =result.Version_Number;

        } else {

            currentVersionId =  null;

            currentVersionNumber =  null;
        }


        /* =================================================
           GLOBAL VALUES
        ================================================= */

        window.currentContractId =contractId;

        window.currentVersionId =currentVersionId;

        window.currentVersionNumber = currentVersionNumber;


        /* =================================================
           RENDER CLAUSES
        ================================================= */

        renderClauses(
            result.clauses || []
        );


        /* =================================================
           UPDATE COUNTS
        ================================================= */

        updateClauseCount(
            result.count || 0
        );

    }

    catch (error) {

        console.error(
            "Load clauses error:",
            error
        );


        const container =  document.getElementById(
                CLAUSE_CONTAINER_ID
            );


        if (container) {

            container.innerHTML = `
                <div class="alert alert-danger">

                    <i
                        class="bi bi-exclamation-triangle me-2">
                    </i>

                    ${escapeHtml(
                        error.message ||
                        "Failed to load clauses"
                    )}

                </div>
            `;
        }
    }
}


/* =========================================================
   RENDER CLAUSES
========================================================= */

function renderClauses(clauses) {

    const container = document.getElementById(
            CLAUSE_CONTAINER_ID
        );


    if (!container) {

        console.warn(
            "contractClausesContainer not found"
        );

        return;
    }


    /* =====================================================
       NO CLAUSES
    ===================================================== */

    if (
        !clauses ||
        clauses.length === 0
    ) {

        container.innerHTML = `
            <div class="text-center py-5">

                <div class="mb-3">

                    <i
                        class="bi bi-file-text"
                        style="font-size:42px;">
                    </i>

                </div>

                <h6 class="text-muted">
                    No clauses found
                </h6>

                <p class="text-muted mb-0">
                    No clauses have been added
                    to the current contract version.
                </p>

            </div>
        `;

        return;
    }


    /* =====================================================
       SORT CLAUSES
    ===================================================== */

    clauses.sort((a, b) =>
            (a.Clause_Number || 0) -
            (b.Clause_Number || 0)
    );


    /* =====================================================
       BUILD CLAUSE CARDS
    ===================================================== */

    container.innerHTML =clauses
            .map(
                clause =>
                    createClauseCard(clause)
            )
            .join("");
}


/* =========================================================
   CREATE CLAUSE CARD
========================================================= */

function createClauseCard(clause) {

    const clauseId = clause.Clause_ID;

    const clauseNumber =  clause.Clause_Number ?? "-";

    const clauseTitle =  clause.Clause_Title ||  "Untitled Clause";

    const clauseText = clause.Clause_Text || "";


    const versionDisplay = currentVersionNumber ?? currentVersionId ??  "-";


    /* =====================================================
       ROLE-BASED ACTION BUTTONS
    ===================================================== */

    let actionButtons = "";


    /*
       Only Contract Manager gets
       Edit + Delete buttons.
    */

    if (isContractManager()) {

        actionButtons = `
            <div
                class="d-flex gap-2">

                <button
                    type="button"
                    class="btn btn-sm
                           btn-outline-primary"
                    onclick="editClause(${clauseId})"
                    title="Edit Clause">

                    <i
                        class="bi bi-pencil">
                    </i>

                </button>


                <button
                    type="button"
                    class="btn btn-sm
                           btn-outline-danger"
                    onclick="deleteClause(${clauseId})"
                    title="Delete Clause">

                    <i
                        class="bi bi-trash">
                    </i>

                </button>

            </div>
        `;
    }


    /* =====================================================
       RETURN CARD
    ===================================================== */

    return `
        <div
            class="card clause-card mb-3"
            data-clause-id="${clauseId}">

            <div class="card-body">

                <div
                    class="d-flex
                           justify-content-between
                           align-items-start
                           mb-3">

                    <div>

                        <div
                            class="d-flex
                                   align-items-center
                                   gap-2">

                            <span
                                class="badge bg-primary">

                                Clause
                                ${escapeHtml(
                                    clauseNumber
                                )}

                            </span>


                            <span
                                class="badge bg-light
                                       text-dark
                                       border">

                                Version
                                ${escapeHtml(
                                    versionDisplay
                                )}

                            </span>

                        </div>


                        <h6
                            class="mt-2 mb-0 fw-semibold">

                            ${escapeHtml(
                                clauseTitle
                            )}

                        </h6>

                    </div>


                    <!-- ROLE-BASED ACTION BUTTONS -->

                    ${actionButtons}

                </div>


                <!-- CLAUSE TEXT -->

                <div class="clause-text">

                    ${formatClauseText(
                        clauseText
                    )}

                </div>

            </div>

        </div>
    `;
}


/* =========================================================
   OPEN ADD CLAUSE MODAL
========================================================= */

async function openAddClauseModal() {

    /*
       SECURITY CHECK

       Only Contract Manager can open
       the Add Clause modal.
    */

    if (!isContractManager()) {

        showClauseError(
            "You do not have permission to create clauses."
        );

        return;
    }


    try {

        editingClauseId =
            null;


        /* =================================================
           MODAL TITLE
        ================================================= */

        const modalTitle =
            document.getElementById(
                "clauseModalTitle"
            );


        if (modalTitle) {

            modalTitle.textContent =
                "Add Clause";
        }


        /* =================================================
           RESET FORM
        ================================================= */

        const form =
            document.getElementById(
                "clauseForm"
            );


        if (form) {

            form.reset();
        }


        /* =================================================
           CLEAR HIDDEN FIELDS
        ================================================= */

        setInputValue(
            "clauseId",
            ""
        );


        setInputValue(
            "clauseContractId",
            currentContractId || ""
        );


        setInputValue(
            "clauseVersionId",
            ""
        );


        /* =================================================
           CHECK CONTRACT
        ================================================= */

        if (!currentContractId) {

            showClauseError(
                "Please select a contract first."
            );

            return;
        }


        /* =================================================
           GET CURRENT VERSION
        ================================================= */

        const version =
            await getCurrentVersion(
                currentContractId
            );


        if (!version) {

            showClauseError(
                "No current contract version found. Please upload a document first."
            );

            return;
        }


        /* =================================================
           STORE VERSION
        ================================================= */

        currentVersionId = version.Version_ID;

        currentVersionNumber =version.Version_Number;

        window.currentVersionId =  currentVersionId;

        window.currentVersionNumber = currentVersionNumber;


        setInputValue(
            "clauseVersionId",
            currentVersionId
        );


        /* =================================================
           GET NEXT CLAUSE NUMBER
        ================================================= */

        const nextNumber =  await getNextClauseNumber(
                currentContractId
            );


        setInputValue(
            "clauseNumber",
            nextNumber
        );


        /* =================================================
           SHOW MODAL
        ================================================= */

        showClauseModal();

    }

    catch (error) {

        console.error(
            "Open add clause error:",
            error
        );


        showClauseError(
            error.message ||
            "Unable to open clause form."
        );
    }
}


/* =========================================================
   GET CURRENT CONTRACT VERSION
========================================================= */

async function getCurrentVersion(
    contractId
) {

    if (!contractId) {

        return null;
    }


    try {

        const response =
            await fetch(
                `/versions/contract/${contractId}/current`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );


        if (response.status === 401) {

            window.location.href =
                "/login-page";

            return null;
        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to get current version."
            );
        }


        return (
            result.version ||
            result.data ||
            null
        );

    }

    catch (error) {

        console.error(
            "Get current version error:",
            error
        );

        return null;
    }
}


/* =========================================================
   GET NEXT CLAUSE NUMBER
========================================================= */

async function getNextClauseNumber(
    contractId
) {

    try {

        const response =
            await fetch(
                `/clauses/contract/${contractId}`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );


        if (!response.ok) {

            return 1;
        }


        const result =
            await response.json();


        const clauses =
            result.clauses || [];


        if (clauses.length === 0) {

            return 1;
        }


        const numbers =
            clauses
                .map(
                    clause =>
                        Number(
                            clause.Clause_Number
                        )
                )
                .filter(
                    number =>
                        !isNaN(number)
                );


        if (numbers.length === 0) {

            return 1;
        }


        return (
            Math.max(...numbers) + 1
        );

    }

    catch (error) {

        console.error(
            "Get next clause number error:",
            error
        );

        return 1;
    }
}


/* =========================================================
   SAVE CLAUSE
========================================================= */

async function saveClause() {

    /*
       SECURITY CHECK
    */

    if (!isContractManager()) {

        showClauseError(
            "You do not have permission to save clauses."
        );

        return;
    }


    let originalButtonText = "";


    try {

        const contractId =
            getInputValue(
                "clauseContractId"
            ) ||
            currentContractId;


        const versionId =
            getInputValue(
                "clauseVersionId"
            ) ||
            currentVersionId;


        const clauseNumber =
            Number(
                getInputValue(
                    "clauseNumber"
                )
            );


        const clauseTitle =
            getInputValue(
                "clauseTitle"
            ).trim();


        const clauseText =
            getInputValue(
                "clauseText"
            ).trim();


        /* =================================================
           VALIDATION
        ================================================= */

        if (!contractId) {

            showClauseError(
                "Contract is required."
            );

            return;
        }


        if (!versionId) {

            showClauseError(
                "Current version is required."
            );

            return;
        }


        if (
            !clauseNumber ||
            clauseNumber < 1
        ) {

            showClauseError(
                "Clause number must be at least 1."
            );

            return;
        }


        if (
            !clauseTitle ||
            clauseTitle.length < 2
        ) {

            showClauseError(
                "Clause title must contain at least 2 characters."
            );

            return;
        }


        if (!clauseText) {

            showClauseError(
                "Clause text is required."
            );

            return;
        }


        /* =================================================
           URL / METHOD / BODY
        ================================================= */

        let url;
        let method;
        let body;


        if (editingClauseId) {

            url =
                `/clauses/${editingClauseId}`;

            method =
                "PUT";


            body = {

                Clause_Number:
                    clauseNumber,

                Clause_Title:
                    clauseTitle,

                Clause_Text:
                    clauseText
            };

        }

        else {

            url =
                "/clauses";

            method =
                "POST";


            body = {

                Contract_ID:
                    Number(contractId),

                Version_ID:
                    Number(versionId),

                Clause_Number:
                    clauseNumber,

                Clause_Title:
                    clauseTitle,

                Clause_Text:
                    clauseText
            };
        }


        /* =================================================
           SAVE BUTTON
        ================================================= */

        const saveButton =
            document.querySelector(
                "#clauseForm button[type='submit']"
            );


        if (saveButton) {

            saveButton.disabled =
                true;


            originalButtonText =
                saveButton.innerHTML;


            saveButton.innerHTML = `
                <span
                    class="spinner-border
                           spinner-border-sm
                           me-1">
                </span>

                Saving...
            `;
        }


        /* =================================================
           API REQUEST
        ================================================= */

        const response =
            await fetch(
                url,
                {
                    method:
                        method,

                    headers: {

                        "Content-Type":
                            "application/json"
                    },

                    credentials:
                        "include",

                    body:
                        JSON.stringify(
                            body
                        )
                }
            );


        if (response.status === 401) {

            window.location.href =
                "/login-page";

            return;
        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to save clause."
            );
        }


        /* =================================================
           SUCCESS MESSAGE
        ================================================= */

        const successMessage =
            editingClauseId
                ? "Clause updated successfully."
                : "Clause created successfully.";


        /* =================================================
           CLOSE MODAL
        ================================================= */

        closeClauseModal();

        resetClauseForm();


        /* =================================================
           RELOAD CLAUSES
        ================================================= */

        await loadContractClauses(
            contractId
        );


        /* =================================================
           SUCCESS
        ================================================= */

        showClauseSuccess(
            successMessage
        );


        editingClauseId =
            null;

    }

    catch (error) {

        console.error(
            "Save clause error:",
            error
        );


        showClauseError(
            error.message ||
            "Unable to save clause."
        );

    }

    finally {

        const saveButton =
            document.querySelector(
                "#clauseForm button[type='submit']"
            );


        if (saveButton) {

            saveButton.disabled =
                false;


            if (originalButtonText) {

                saveButton.innerHTML =
                    originalButtonText;
            }
        }
    }
}


/* =========================================================
   EDIT CLAUSE
========================================================= */

async function editClause(
    clauseId
) {

    /*
       SECURITY CHECK
    */

    if (!isContractManager()) {

        showClauseError(
            "You do not have permission to edit clauses."
        );

        return;
    }


    try {

        editingClauseId =
            clauseId;


        const response =
            await fetch(
                `/clauses/${clauseId}`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );


        if (response.status === 401) {

            window.location.href =
                "/login-page";

            return;
        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to load clause."
            );
        }


        const clause =
            result.clause ||
            result.data;


        if (!clause) {

            throw new Error(
                "Clause data not found."
            );
        }


        /* =================================================
           GET CURRENT VERSION
        ================================================= */

        const currentVersion =
            await getCurrentVersion(
                clause.Contract_ID
            );


        if (
            currentVersion &&
            Number(clause.Version_ID) !==
            Number(
                currentVersion.Version_ID
            )
        ) {

            showClauseError(
                "Only clauses from the current version can be edited."
            );


            editingClauseId =
                null;


            return;
        }


        /* =================================================
           GLOBAL VALUES
        ================================================= */

        currentContractId =
            clause.Contract_ID;


        currentVersionId =
            clause.Version_ID;


        currentVersionNumber =
            currentVersion
                ? currentVersion.Version_Number
                : null;


        window.currentContractId =
            currentContractId;


        window.currentVersionId =
            currentVersionId;


        window.currentVersionNumber =
            currentVersionNumber;


        /* =================================================
           MODAL TITLE
        ================================================= */

        const modalTitle =
            document.getElementById(
                "clauseModalTitle"
            );


        if (modalTitle) {

            modalTitle.textContent =
                "Edit Clause";
        }


        /* =================================================
           FILL FORM
        ================================================= */

        setInputValue(
            "clauseId",
            clause.Clause_ID
        );


        setInputValue(
            "clauseContractId",
            clause.Contract_ID
        );


        setInputValue(
            "clauseVersionId",
            clause.Version_ID
        );


        setInputValue(
            "clauseNumber",
            clause.Clause_Number
        );


        setInputValue(
            "clauseTitle",
            clause.Clause_Title
        );


        setInputValue(
            "clauseText",
            clause.Clause_Text
        );


        /* =================================================
           SHOW MODAL
        ================================================= */

        showClauseModal();

    }

    catch (error) {

        console.error(
            "Edit clause error:",
            error
        );


        editingClauseId =
            null;


        showClauseError(
            error.message ||
            "Unable to load clause."
        );
    }
}


/* =========================================================
   DELETE CLAUSE
========================================================= */

async function deleteClause(
    clauseId
) {

    /*
       SECURITY CHECK
    */

    if (!isContractManager()) {

        showClauseError(
            "You do not have permission to delete clauses."
        );

        return;
    }


    try {

        const confirmed =
            confirm(
                "Are you sure you want to delete this clause?"
            );


        if (!confirmed) {

            return;
        }


        /* =================================================
           GET CLAUSE
        ================================================= */

        const getResponse =
            await fetch(
                `/clauses/${clauseId}`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );


        if (getResponse.status === 401) {

            window.location.href =
                "/login-page";

            return;
        }


        const clauseResult =
            await getResponse.json();


        if (!getResponse.ok) {

            throw new Error(
                clauseResult.message ||
                "Unable to load clause."
            );
        }


        const clause =
            clauseResult.clause ||
            clauseResult.data;


        if (!clause) {

            throw new Error(
                "Clause data not found."
            );
        }


        /* =================================================
           VERIFY CURRENT VERSION
        ================================================= */

        const currentVersion =
            await getCurrentVersion(
                clause.Contract_ID
            );


        if (
            currentVersion &&
            Number(clause.Version_ID) !==
            Number(
                currentVersion.Version_ID
            )
        ) {

            showClauseError(
                "Only clauses from the current version can be deleted."
            );

            return;
        }


        /* =================================================
           DELETE REQUEST
        ================================================= */

        const response =
            await fetch(
                `/clauses/${clauseId}`,
                {
                    method:
                        "DELETE",

                    credentials:
                        "include"
                }
            );


        if (response.status === 401) {

            window.location.href =
                "/login-page";

            return;
        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to delete clause."
            );
        }


        /* =================================================
           RELOAD
        ================================================= */

        await loadContractClauses(
            clause.Contract_ID
        );


        /* =================================================
           SUCCESS
        ================================================= */

        showClauseSuccess(
            "Clause deleted successfully."
        );

    }

    catch (error) {

        console.error(
            "Delete clause error:",
            error
        );


        showClauseError(
            error.message ||
            "Unable to delete clause."
        );
    }
}


/* =========================================================
   LOAD CLAUSES FOR SPECIFIC VERSION
========================================================= */

async function loadVersionClauses(
    versionId,
    containerId = CLAUSE_CONTAINER_ID
) {

    try {

        const container =
            document.getElementById(
                containerId
            );


        if (!container) {

            console.warn(
                `${containerId} not found`
            );

            return;
        }


        container.innerHTML = `
            <div class="text-center py-4">

                <div
                    class="spinner-border text-primary"
                    role="status">
                </div>

                <div class="mt-2 text-muted">
                    Loading version clauses...
                </div>

            </div>
        `;


        const response =
            await fetch(
                `/clauses/version/${versionId}`,
                {
                    method:
                        "GET",

                    credentials:
                        "include"
                }
            );


        if (response.status === 401) {

            window.location.href =
                "/login-page";

            return;
        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to load version clauses."
            );
        }


        const clauses =
            result.clauses || [];


        /* =================================================
           SORT
        ================================================= */

        clauses.sort(
            (a, b) =>
                (a.Clause_Number || 0) -
                (b.Clause_Number || 0)
        );


        /* =================================================
           EMPTY
        ================================================= */

        if (clauses.length === 0) {

            container.innerHTML = `
                <div class="text-center py-5">

                    <i
                        class="bi bi-file-text"
                        style="font-size:40px;">
                    </i>

                    <h6
                        class="mt-3 text-muted">

                        No clauses found

                    </h6>

                    <p
                        class="text-muted mb-0">

                        This version does not contain
                        any clauses.

                    </p>

                </div>
            `;

            return;
        }


        /* =================================================
           READ-ONLY HISTORICAL CLAUSES
        ================================================= */

        container.innerHTML =
            clauses
                .map(
                    clause =>
                        createHistoricalClauseCard(
                            clause,
                            result.Version_Number
                        )
                )
                .join("");

    }

    catch (error) {

        console.error(
            "Load version clauses error:",
            error
        );


        const container =
            document.getElementById(
                containerId
            );


        if (container) {

            container.innerHTML = `
                <div class="alert alert-danger">

                    ${escapeHtml(
                        error.message ||
                        "Unable to load version clauses."
                    )}

                </div>
            `;
        }
    }
}


/* =========================================================
   HISTORICAL CLAUSE CARD
========================================================= */

function createHistoricalClauseCard(
    clause,
    versionNumber
) {

    return `
        <div
            class="card mb-3 clause-card">

            <div class="card-body">

                <div
                    class="d-flex
                           justify-content-between
                           align-items-start
                           mb-3">

                    <div>

                        <span
                            class="badge bg-secondary">

                            Clause
                            ${escapeHtml(
                                clause.Clause_Number
                            )}

                        </span>


                        <span
                            class="badge bg-light
                                   text-dark
                                   border ms-1">

                            Version
                            ${escapeHtml(
                                versionNumber ?? "-"
                            )}

                        </span>

                    </div>


                    <span
                        class="badge bg-secondary">

                        Read Only

                    </span>

                </div>


                <h6
                    class="fw-semibold">

                    ${escapeHtml(
                        clause.Clause_Title
                    )}

                </h6>


                <div
                    class="clause-text mt-3">

                    ${formatClauseText(
                        clause.Clause_Text
                    )}

                </div>

            </div>

        </div>
    `;
}


/* =========================================================
   SHOW CLAUSE MODAL
========================================================= */

function showClauseModal() {

    const modalElement =
        document.getElementById(
            "clauseModal"
        );


    if (!modalElement) {

        console.warn(
            "clauseModal not found."
        );

        return;
    }


    /*
       IMPORTANT:
       clauseModal is a custom modal-overlay.
       Do NOT use Bootstrap Modal here.
    */

    modalElement.style.display =
        "flex";


    modalElement.classList.add(
        "show"
    );


    modalElement.classList.add(
        "active"
    );


    modalElement.setAttribute(
        "aria-hidden",
        "false"
    );
}


/* =========================================================
   CLOSE CLAUSE MODAL
========================================================= */

function closeClauseModal() {

    const modalElement =
        document.getElementById(
            "clauseModal"
        );


    if (!modalElement) {

        return;
    }


    /*
       IMPORTANT:
       clauseModal is a custom modal-overlay.
       Do NOT use Bootstrap Modal here.
    */

    modalElement.style.display =
        "none";


    modalElement.classList.remove(
        "show"
    );


    modalElement.classList.remove(
        "active"
    );


    modalElement.setAttribute(
        "aria-hidden",
        "true"
    );


    editingClauseId =
        null;
}


/* =========================================================
   RESET CLAUSE FORM
========================================================= */

function resetClauseForm() {

    const form =
        document.getElementById(
            "clauseForm"
        );


    if (form) {

        form.reset();
    }


    setInputValue(
        "clauseId",
        ""
    );


    setInputValue(
        "clauseContractId",
        currentContractId || ""
    );


    setInputValue(
        "clauseVersionId",
        currentVersionId || ""
    );


    editingClauseId =
        null;


    const modalTitle =
        document.getElementById(
            "clauseModalTitle"
        );


    if (modalTitle) {

        modalTitle.textContent =
            "Add Clause";
    }
}


/* =========================================================
   UPDATE CLAUSE COUNT
========================================================= */

function updateClauseCount(
    count
) {

    const tabCount =
        document.getElementById(
            "clausesCount"
        );


    if (tabCount) {

        tabCount.textContent =
            count;
    }


    const overviewCount =
        document.getElementById(
            "overviewClauses"
        );


    if (overviewCount) {

        overviewCount.textContent =
            count;
    }
}


/* =========================================================
   SHOW SUCCESS MESSAGE
========================================================= */

function showClauseSuccess(
    message
) {

    if (
        typeof showToast ===
        "function"
    ) {

        showToast(
            message,
            "success"
        );

        return;
    }


    showTemporaryClauseAlert(
        message,
        "success"
    );
}


/* =========================================================
   SHOW ERROR MESSAGE
========================================================= */

function showClauseError(
    message
) {

    if (
        typeof showToast ===
        "function"
    ) {

        showToast(
            message,
            "error"
        );

        return;
    }


    showTemporaryClauseAlert(
        message,
        "danger"
    );
}


/* =========================================================
   TEMPORARY ALERT
========================================================= */

function showTemporaryClauseAlert(
    message,
    type
) {

    const existing =
        document.getElementById(
            "clauseTemporaryAlert"
        );


    if (existing) {

        existing.remove();
    }


    const alert =
        document.createElement(
            "div"
        );


    alert.id =
        "clauseTemporaryAlert";


    alert.className =
        `alert alert-${type} position-fixed`;


    alert.style.top =
        "20px";


    alert.style.right =
        "20px";


    alert.style.zIndex =
        "9999";


    alert.style.minWidth =
        "280px";


    alert.innerHTML = `
        <div
            class="d-flex
                   align-items-center
                   justify-content-between">

            <span>
                ${escapeHtml(message)}
            </span>


            <button
                type="button"
                class="btn-close ms-3">
            </button>

        </div>
    `;


    document.body.appendChild(
        alert
    );


    const closeAlertButton =
        alert.querySelector(
            ".btn-close"
        );


    if (closeAlertButton) {

        closeAlertButton.addEventListener(
            "click",
            function () {

                alert.remove();

            }
        );
    }


    setTimeout(
        () => {

            if (
                document.body.contains(
                    alert
                )
            ) {

                alert.remove();
            }

        },
        3500
    );
}


/* =========================================================
   FORMAT CLAUSE TEXT
========================================================= */

function formatClauseText(
    text
) {

    if (!text) {

        return "";
    }


    const escaped =
        escapeHtml(text);


    return escaped
        .replace(
            /\r\n/g,
            "<br>"
        )
        .replace(
            /\n/g,
            "<br>"
        );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value);


    return div.innerHTML;
}


/* =========================================================
   GET INPUT VALUE
========================================================= */

function getInputValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return "";
    }


    return element.value;
}


/* =========================================================
   SET INPUT VALUE
========================================================= */

function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;
    }


    element.value =
        value ?? "";
}


/* =========================================================
   DOM CONTENT LOADED
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {


        /* ================================================
           CLAUSE FORM
        ================================================= */

        const form =
            document.getElementById(
                "clauseForm"
            );


        if (form) {

            form.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    saveClause();

                }
            );
        }


        /* ================================================
           ADD CLAUSE BUTTON
        ================================================= */

        const addClauseBtn =
            document.getElementById(
                "addClauseBtn"
            );


        if (addClauseBtn) {

            /*
               Only Contract Manager
               can see/use this button.
            */

            if (isContractManager()) {

                addClauseBtn.style.display =
                    "";

                addClauseBtn.addEventListener(
                    "click",
                    function () {

                        openAddClauseModal();

                    }
                );

            } else {

                addClauseBtn.style.display =
                    "none";
            }
        }


        /* ================================================
           CANCEL + CLOSE BUTTON
        ================================================= */

        /*
           Event delegation is used here so both
           Cancel and X work reliably.
        */

        document.addEventListener(
            "click",
            function (event) {

                const closeButton =
                    event.target.closest(
                        "#clauseModal [data-close-modal='clauseModal']"
                    );


                if (!closeButton) {

                    return;
                }


                event.preventDefault();

                event.stopPropagation();


                closeClauseModal();

                resetClauseForm();

            }
        );


        /* ================================================
           BACKDROP CLICK
        ================================================= */

        const modal =
            document.getElementById(
                "clauseModal"
            );


        if (modal) {

            modal.addEventListener(
                "click",
                function (event) {

                    /*
                       Close only when the actual
                       overlay/background is clicked.
                    */

                    if (
                        event.target === modal
                    ) {

                        closeClauseModal();

                        resetClauseForm();

                    }

                }
            );
        }


        /* ================================================
           ESCAPE KEY
        ================================================= */

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key !==
                    "Escape"
                ) {

                    return;
                }


                const modal =
                    document.getElementById(
                        "clauseModal"
                    );


                if (!modal) {

                    return;
                }


                const isVisible =
                    modal.classList.contains(
                        "show"
                    ) ||
                    modal.classList.contains(
                        "active"
                    ) ||
                    modal.style.display ===
                        "flex" ||
                    modal.style.display ===
                        "block";


                if (isVisible) {

                    closeClauseModal();

                    resetClauseForm();

                }

            }
        );

    }
);


/* =========================================================
   EXPOSE FUNCTIONS GLOBALLY
========================================================= */

window.loadContractClauses =
    loadContractClauses;

window.loadVersionClauses =
    loadVersionClauses;

window.openAddClauseModal =
    openAddClauseModal;

window.editClause =
    editClause;

window.deleteClause =
    deleteClause;

window.saveClause =
    saveClause;

window.closeClauseModal =
    closeClauseModal;

window.resetClauseForm =
    resetClauseForm;

window.getCurrentVersion =
    getCurrentVersion;

