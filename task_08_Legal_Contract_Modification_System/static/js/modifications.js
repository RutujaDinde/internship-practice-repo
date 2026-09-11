/* ============================================================
   MODIFICATIONS.JS
============================================================ */

let modificationClauseTextMap = {};

let modificationCurrentContractId = null;

let modificationCurrentVersionId = null;


/* ============================================================
   ROLE HELPERS
============================================================ */

function getModificationRole() {

    return String(
        window.loggedInUserRole || ""
    )
        .trim()
        .toLowerCase();
}


function modificationIsLegalUser() {

    return (
        getModificationRole() ===
        "legal user"
    );
}


function modificationIsApprover() {

    return (
        getModificationRole() ===
        "approver"
    );
}


function modificationIsContractManager() {

    return (
        getModificationRole() ===
        "contract manager"
    );
}


function modificationIsAdmin() {

    return (
        getModificationRole() ===
        "admin"
    );
}


/* ============================================================
   PERMISSIONS
============================================================ */

function updateModificationPermissions() {

    const button =
        document.getElementById(
            "createModificationBtn"
        );

    if (!button) {
        return;
    }

    if (modificationIsLegalUser()) {

        button.style.display =
            "inline-flex";

    } else {

        button.style.display =
            "none";
    }
}


/* ============================================================
   RESPONSE PARSER
============================================================ */

async function parseModificationResponse(
    response
) {

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    if (
        contentType.includes(
            "application/json"
        )
    ) {

        return await response.json();
    }

    const text =
        await response.text();

    return {

        success: false,

        message:
            text ||
            `Server returned status ${response.status}`
    };
}


/* ============================================================
   OPEN MODIFICATION MODAL
============================================================ */

async function openModificationModal() {

    const contractId =
        window.currentContractId;

    if (!contractId) {

        alert(
            "Please select a contract first."
        );

        return;
    }


    if (!modificationIsLegalUser()) {

        alert(
            "Only Legal User can request modifications."
        );

        return;
    }


    modificationCurrentContractId =
        contractId;


    const modal =
        document.getElementById(
            "modificationModal"
        );

    const contractInput =
        document.getElementById(
            "modificationContractId"
        );

    const versionInput =
        document.getElementById(
            "modificationVersionId"
        );

    const typeSelect =
        document.getElementById(
            "modificationType"
        );

    const clauseSelect =
        document.getElementById(
            "modificationClause"
        );

    const clauseGroup =
        document.getElementById(
            "modificationClauseGroup"
        );

    const oldText =
        document.getElementById(
            "modificationOldText"
        );

    const newText =
        document.getElementById(
            "modificationNewText"
        );

    const reason =
        document.getElementById(
            "modificationReason"
        );


    /* RESET FORM */

    if (typeSelect) {

        typeSelect.value = "";
    }


    if (clauseSelect) {

        clauseSelect.innerHTML = `
            <option value="">
                Select Clause
            </option>
        `;
    }


    if (clauseGroup) {

        clauseGroup.style.display =
            "none";
    }


    if (oldText) {

        oldText.value = "";
    }


    if (newText) {

        newText.value = "";
    }


    if (reason) {

        reason.value = "";
    }


    if (contractInput) {

        contractInput.value =
            contractId;
    }


    try {

        /* GET CURRENT VERSION */

        const response =
            await authFetch(
                `/versions/contract/${contractId}/current`
            );


        const data =
            await parseModificationResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                data?.message ||
                "Failed to load current version."
            );
        }


        const version =
            data.version;


        if (!version) {

            throw new Error(
                "Current contract version not found."
            );
        }


        modificationCurrentVersionId =
            version.Version_ID;


        if (versionInput) {

            versionInput.value =
                version.Version_ID;
        }


        /* LOAD CURRENT CLAUSES */

        await loadModificationClauses(
            contractId
        );


        /* SHOW MODAL */

        if (modal) {

            modal.style.display =
                "flex";

            modal.setAttribute(
                "aria-hidden",
                "false"
            );
        }

    } catch (error) {

        console.error(
            "OPEN MODIFICATION ERROR:",
            error
        );

        alert(
            error.message ||
            "Failed to open modification request."
        );
    }
}


/* ============================================================
   CLOSE MODIFICATION MODAL
============================================================ */

function closeModificationModal() {

    const modal =
        document.getElementById(
            "modificationModal"
        );

    if (!modal) {
        return;
    }


    modal.style.display =
        "none";


    modal.setAttribute(
        "aria-hidden",
        "true"
    );
}


/* ============================================================
   LOAD CURRENT CONTRACT CLAUSES
============================================================ */

async function loadModificationClauses(
    contractId
) {

    const clauseSelect =
        document.getElementById(
            "modificationClause"
        );

    if (!clauseSelect) {
        return;
    }


    clauseSelect.innerHTML = `
        <option value="">
            Loading clauses...
        </option>
    `;


    modificationClauseTextMap = {};


    try {

        const response =
            await authFetch(
                `/clauses/contract/${contractId}`
            );


        const data =
            await parseModificationResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                data?.message ||
                "Failed to load clauses."
            );
        }


        const clauses =
            data.clauses || [];


        clauseSelect.innerHTML = `
            <option value="">
                Select Clause
            </option>
        `;


        if (
            clauses.length === 0
        ) {

            clauseSelect.innerHTML = `
                <option value="">
                    No clauses available
                </option>
            `;

            return;
        }


        clauses.forEach(
            function (clause) {

                modificationClauseTextMap[
                    clause.Clause_ID
                ] =
                    clause.Clause_Text || "";


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    clause.Clause_ID;


                option.textContent =
                    `Clause ${clause.Clause_Number} - ${clause.Clause_Title}`;


                clauseSelect.appendChild(
                    option
                );
            }
        );


    } catch (error) {

        console.error(
            "LOAD MODIFICATION CLAUSES ERROR:",
            error
        );


        clauseSelect.innerHTML = `
            <option value="">
                Failed to load clauses
            </option>
        `;


        alert(
            error.message ||
            "Failed to load clauses."
        );
    }
}


/* ============================================================
   MODIFICATION TYPE CHANGE
============================================================ */

function handleModificationTypeChange() {

    const type =
        document.getElementById(
            "modificationType"
        )?.value;


    const clauseGroup =
        document.getElementById(
            "modificationClauseGroup"
        );


    const clauseSelect =
        document.getElementById(
            "modificationClause"
        );


    const oldText =
        document.getElementById(
            "modificationOldText"
        );


    if (!clauseGroup) {
        return;
    }


    /* CLAUSE MODIFICATION */

    if (type === "Clause") {

        clauseGroup.style.display =
            "block";


        if (clauseSelect) {

            clauseSelect.required =
                true;
        }


        if (oldText) {

            oldText.value = "";
        }


        return;
    }


    /* WHOLE CONTRACT */

    if (type === "Contract") {

        clauseGroup.style.display =
            "none";


        if (clauseSelect) {

            clauseSelect.required =
                false;

            clauseSelect.value =
                "";
        }


        if (oldText) {

            oldText.value = "";
        }


        return;
    }


    /* NOTHING SELECTED */

    clauseGroup.style.display =
        "none";


    if (clauseSelect) {

        clauseSelect.required =
            false;

        clauseSelect.value =
            "";
    }


    if (oldText) {

        oldText.value = "";
    }
}


/* ============================================================
   CLAUSE CHANGE
============================================================ */

function handleClauseChange() {

    const clauseId =
        document.getElementById(
            "modificationClause"
        )?.value;


    const oldText =
        document.getElementById(
            "modificationOldText"
        );


    if (!oldText) {
        return;
    }


    if (!clauseId) {

        oldText.value = "";

        return;
    }


    oldText.value =
        modificationClauseTextMap[
            clauseId
        ] || "";
}


/* ============================================================
   SUBMIT MODIFICATION
============================================================ */

async function submitModification(
    event
) {

    if (event) {

        event.preventDefault();
    }


    if (!modificationIsLegalUser()) {

        alert(
            "Only Legal User can submit modification requests."
        );

        return;
    }


    const contractId =
        document.getElementById(
            "modificationContractId"
        )?.value;


    const versionId =
        document.getElementById(
            "modificationVersionId"
        )?.value;


    const type =
        document.getElementById(
            "modificationType"
        )?.value;


    const clauseId =
        document.getElementById(
            "modificationClause"
        )?.value;


    const oldText =
        document.getElementById(
            "modificationOldText"
        )?.value.trim();


    const newText =
        document.getElementById(
            "modificationNewText"
        )?.value.trim();


    const reason =
        document.getElementById(
            "modificationReason"
        )?.value.trim();


    /* VALIDATION */

    if (!contractId) {

        alert(
            "Contract is required."
        );

        return;
    }


    if (!versionId) {

        alert(
            "Current version is required."
        );

        return;
    }


    if (!type) {

        alert(
            "Please select modification type."
        );

        return;
    }


    if (
        type === "Clause" &&
        !clauseId
    ) {

        alert(
            "Please select a clause."
        );

        return;
    }


    if (!oldText) {

        alert(
            "Original Value is required."
        );

        return;
    }


    if (!newText) {

        alert(
            "Proposed Modification is required."
        );

        return;
    }


    const payload = {

        Contract_ID:
            Number(contractId),

        Clause_ID:
            type === "Clause"
                ? Number(clauseId)
                : null,

        Version_ID:
            Number(versionId),

        Modification_Type:
            type,

        Old_Text:
            oldText,

        New_Text:
            newText,

        Reason:
            reason || null
    };


    console.log(
        "SUBMIT MODIFICATION:",
        payload
    );


    try {

        const response =
            await authFetch(
                "/modifications",
                {
                    method: "POST",

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
            await parseModificationResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                data?.message ||
                "Failed to submit modification."
            );
        }


        alert(
            data?.message ||
            "Modification request submitted successfully."
        );


        closeModificationModal();


        await loadContractModifications(
            contractId
        );


    } catch (error) {

        console.error(
            "SUBMIT MODIFICATION ERROR:",
            error
        );


        alert(
            error.message ||
            "Failed to submit modification."
        );
    }
}


/* ============================================================
   LOAD MODIFICATIONS
============================================================ */

async function loadContractModifications(
    contractId
) {

    const tableBody =
        document.getElementById(
            "modificationsTableBody"
        );


    if (!tableBody) {
        return;
    }


    if (!contractId) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="text-center"
                >
                    No contract selected.
                </td>
            </tr>
        `;

        return;
    }


    tableBody.innerHTML = `
        <tr>
            <td
                colspan="8"
                class="text-center"
            >
                Loading modifications...
            </td>
        </tr>
    `;


    try {

        const response =
            await authFetch(
                `/modifications?contract_id=${contractId}`
            );


        const data =
            await parseModificationResponse(
                response
            );


        console.log(
            "MODIFICATIONS API RESPONSE:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data?.message ||
                "Failed to load modifications."
            );
        }


        const modifications =
            data.modifications ||
            data.data ||
            [];


        renderModificationTable(
            modifications
        );


    } catch (error) {

        console.error(
            "LOAD MODIFICATIONS ERROR:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="text-center text-danger"
                >
                    ${escapeModificationHtml(
                        error.message ||
                        "Failed to load modifications."
                    )}
                </td>
            </tr>
        `;
    }
}


/* ============================================================
   RENDER MODIFICATION TABLE
============================================================ */

function renderModificationTable(
    modifications
) {

    const tableBody =
        document.getElementById(
            "modificationsTableBody"
        );


    if (!tableBody) {
        return;
    }


    if (
        !modifications ||
        modifications.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="text-center"
                >
                    No modification requests found.
                </td>
            </tr>
        `;

        return;
    }


    tableBody.innerHTML =
        modifications
            .map(
                function (modification) {

                    return createModificationRow(
                        modification
                    );
                }
            )
            .join("");
}


/* ============================================================
   CREATE TABLE ROW
============================================================ */

function createModificationRow(
    modification
) {

    const id =  modification.Modification_ID;

    const type = modification.Modification_Type ||
        "-";

    const clauseNumber = modification.Clause_Number ??
        modification.Clause?.Clause_Number ??
        null;


    const clauseTitle =
        modification.Clause_Title ||
        modification.Clause?.Clause_Title ||
        "-";


    const clauseText =
        clauseNumber
            ? `Clause ${clauseNumber} - ${clauseTitle}`
            : clauseTitle;


    const reason =
        typeof modification.Reason ===
        "object"

            ? "-"

            : (
                modification.Reason ||
                "-"
            );


    const status =
        typeof modification.Status ===
        "object"

            ? "PENDING"

            : (
                modification.Status ||
                "PENDING"
            );


    const requestedBy =
        modification.Modified_By_Name ||
        modification.Modified_By ||
        "-";


    const date =
        modification.Modified_At

            ? formatModificationDate(
                modification.Modified_At
            )

            : "-";


    let actions = `

        <button
            type="button"
            class="btn btn-sm btn-outline-primary"
            onclick="viewModification(${id})"
        >
            <i class="bi bi-eye"></i>
            View
        </button>

    `;


    /* APPROVER */

    if (
        modificationIsApprover() &&
        String(status).toUpperCase() ===
            "PENDING"
    ) {

        actions += `

            <button
                type="button"
                class="btn btn-sm btn-success"
                onclick="reviewModification(${id}, 'APPROVED')"
            >
                <i class="bi bi-check-lg"></i>
                Approve
            </button>


            <button
                type="button"
                class="btn btn-sm btn-danger"
                onclick="reviewModification(${id}, 'REJECTED')"
            >
                <i class="bi bi-x-lg"></i>
                Reject
            </button>

        `;
    }


    /* CONTRACT MANAGER */

    if (
        modificationIsContractManager() &&
        String(status).toUpperCase() ===
            "APPROVED"
    ) {

        actions += `

            <button
                type="button"
                class="btn btn-sm btn-primary"
                onclick="applyModification(${id})"
            >
                <i class="bi bi-arrow-repeat"></i>
                Apply
            </button>

        `;
    }


    /* LEGAL USER */

    if (
        modificationIsLegalUser() &&
        String(status).toUpperCase() ===
            "PENDING"
    ) {

        actions += `

            <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                onclick="deleteModification(${id})"
            >
                <i class="bi bi-trash"></i>
                Delete
            </button>

        `;
    }


    return `

        <tr>

            <td>
                ${escapeModificationHtml(
                    String(id ?? "-")
                )}
            </td>


            <td>
                ${escapeModificationHtml(
                    String(type)
                )}
            </td>


            <td>
                ${escapeModificationHtml(
                    String(clauseText)
                )}
            </td>


            <td>
                ${escapeModificationHtml(
                    String(reason)
                )}
            </td>


            <td>

                <span
                    class="
                        modification-status
                        ${getModificationStatusClass(
                            status
                        )}
                    "
                >
                    ${escapeModificationHtml(
                        String(status)
                    )}
                </span>

            </td>


            <td>
                ${escapeModificationHtml(
                    String(requestedBy)
                )}
            </td>


            <td>
                ${escapeModificationHtml(
                    String(date)
                )}
            </td>


            <td>

                <div
                    style="
                        display:flex;
                        gap:6px;
                        flex-wrap:wrap;
                    "
                >
                    ${actions}
                </div>

            </td>

        </tr>

    `;
}


/* ============================================================
   SAFE DISPLAY VALUE
   IMPORTANT:
   FIXES [object Object]
============================================================ */

function getModificationDisplayValue(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    /* API RETURNS:
       {
           value: "some text"
       }
    */

    if (
        typeof value ===
        "object"
    ) {

        if (
            value.value !==
                undefined &&
            value.value !==
                null
        ) {

            return String(
                value.value
            );
        }


        return JSON.stringify(
            value
        );
    }


    return String(value);
}


/* ============================================================
   VIEW MODIFICATION
============================================================ */

async function viewModification(
    modificationId
) {

    try {

        const response =
            await authFetch(
                `/modifications/${modificationId}/comparison`
            );


        const data =
            await parseModificationResponse(
                response
            );


        console.log(
            "COMPARISON API RESPONSE:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data?.message ||
                "Failed to load modification."
            );
        }


        const comparison =
            data.comparison;


        if (!comparison) {

            throw new Error(
                "Modification comparison data not found."
            );
        }


        console.log(
            "COMPARISON OBJECT:",
            comparison
        );


        /* ====================================================
           IMPORTANT FIX
        ==================================================== */

        const originalValue =
            getModificationDisplayValue(
                comparison.Original
            );


        const proposedModification =
            getModificationDisplayValue(
                comparison.Proposed
            );


        const modificationType =
            comparison.Modification_Type ||
            "-";


        const reason =
            getModificationDisplayValue(
                comparison.Reason
            ) || "-";


        const status =
            comparison.Status ||
            "PENDING";


        const contract =
            comparison.Contract ||
            {};


        const clause =
            comparison.Clause ||
            null;


        const version =
            comparison.Version ||
            null;


        const modifiedBy =
            comparison.Modified_By_Name ||
            comparison.Modified_By ||
            "-";


        const modifiedAt =
            comparison.Modified_At

                ? formatModificationDate(
                    comparison.Modified_At
                )

                : "-";


        const reviewedBy =
            comparison.Reviewed_By_Name ||
            comparison.Reviewed_By ||
            "-";


        const reviewComment =
            getModificationDisplayValue(
                comparison.Review_Comment
            ) || "-";


        /* ====================================================
           MODAL HTML
        ==================================================== */

        const viewHtml = `

            <div
                class="modification-view-content"
            >


                <!-- CONTRACT -->

                <div
                    class="modification-view-row"
                >

                    <div
                        class="modification-view-label"
                    >
                        Contract
                    </div>


                    <div
                        class="modification-view-value"
                    >
                        ${escapeModificationHtml(
                            String(
                                contract.Contract_Name ||
                                "-"
                            )
                        )}
                    </div>

                </div>


                <!-- MODIFICATION TYPE -->

                <div
                    class="modification-view-row"
                >

                    <div
                        class="modification-view-label"
                    >
                        Modification Type
                    </div>


                    <div
                        class="modification-view-value"
                    >
                        ${escapeModificationHtml(
                            String(
                                modificationType
                            )
                        )}
                    </div>

                </div>


                <!-- CLAUSE -->

                ${
                    clause

                        ? `

                            <div
                                class="modification-view-row"
                            >

                                <div
                                    class="modification-view-label"
                                >
                                    Clause
                                </div>


                                <div
                                    class="modification-view-value"
                                >

                                    ${
                                        clause.Clause_Number
                                            ? `Clause ${escapeModificationHtml(
                                                String(
                                                    clause.Clause_Number
                                                )
                                            )} - `
                                            : ""
                                    }

                                    ${escapeModificationHtml(
                                        String(
                                            clause.Clause_Title ||
                                            "-"
                                        )
                                    )}

                                </div>

                            </div>

                        `

                        : ""
                }


                <!-- VERSION -->

                ${
                    version

                        ? `

                            <div
                                class="modification-view-row"
                            >

                                <div
                                    class="modification-view-label"
                                >
                                    Version
                                </div>


                                <div
                                    class="modification-view-value"
                                >
                                    Version ${escapeModificationHtml(
                                        String(
                                            version.Version_Number ||
                                            "-"
                                        )
                                    )}
                                </div>

                            </div>

                        `

                        : ""
                }


                <!-- ORIGINAL -->

                <div
                    class="modification-view-section"
                >

                    <div
                        class="modification-view-label"
                    >
                        Original Value
                    </div>


                    <div
                        class="modification-text-box"
                    >
                        ${
                            originalValue
                                ? escapeModificationHtml(
                                    originalValue
                                )
                                : "No original value available."
                        }
                    </div>

                </div>


                <!-- PROPOSED -->

                <div
                    class="modification-view-section"
                >

                    <div
                        class="modification-view-label"
                    >
                        Proposed Modification
                    </div>


                    <div
                        class="modification-text-box"
                    >
                        ${
                            proposedModification
                                ? escapeModificationHtml(
                                    proposedModification
                                )
                                : "No proposed modification available."
                        }
                    </div>

                </div>


                <!-- REASON -->

                <div
                    class="modification-view-section"
                >

                    <div
                        class="modification-view-label"
                    >
                        Reason / Description
                    </div>


                    <div
                        class="modification-text-box"
                    >
                        ${escapeModificationHtml(
                            reason
                        )}
                    </div>

                </div>


                <!-- STATUS -->

                <div
                    class="modification-view-row"
                >

                    <div
                        class="modification-view-label"
                    >
                        Status
                    </div>


                    <div
                        class="modification-view-value"
                    >

                        <span
                            class="
                                modification-status
                                ${getModificationStatusClass(
                                    status
                                )}
                            "
                        >
                            ${escapeModificationHtml(
                                String(status)
                            )}
                        </span>

                    </div>

                </div>


                <!-- REQUESTED BY -->

                <div
                    class="modification-view-row"
                >

                    <div
                        class="modification-view-label"
                    >
                        Requested By
                    </div>


                    <div
                        class="modification-view-value"
                    >
                        ${escapeModificationHtml(
                            String(
                                modifiedBy
                            )
                        )}
                    </div>

                </div>


                <!-- REQUESTED AT -->

                <div
                    class="modification-view-row"
                >

                    <div
                        class="modification-view-label"
                    >
                        Requested At
                    </div>


                    <div
                        class="modification-view-value"
                    >
                        ${escapeModificationHtml(
                            String(
                                modifiedAt
                            )
                        )}
                    </div>

                </div>


                <!-- REVIEW INFORMATION -->

                ${
                    String(status)
                        .toUpperCase() !==
                    "PENDING"

                        ? `

                            <div
                                class="modification-view-row"
                            >

                                <div
                                    class="modification-view-label"
                                >
                                    Reviewed By
                                </div>


                                <div
                                    class="modification-view-value"
                                >
                                    ${escapeModificationHtml(
                                        String(
                                            reviewedBy
                                        )
                                    )}
                                </div>

                            </div>


                            <div
                                class="modification-view-section"
                            >

                                <div
                                    class="modification-view-label"
                                >
                                    Review Comment
                                </div>


                                <div
                                    class="modification-text-box"
                                >
                                    ${escapeModificationHtml(
                                        reviewComment
                                    )}
                                </div>

                            </div>

                        `

                        : ""
                }

            </div>

        `;


        showModificationViewModal(
            viewHtml
        );


    } catch (error) {

        console.error(
            "VIEW MODIFICATION ERROR:",
            error
        );


        alert(
            error.message ||
            "Failed to load modification."
        );
    }
}


/* ============================================================
   SHOW VIEW MODAL
============================================================ */

function showModificationViewModal(
    content
) {

    /* REMOVE OLD MODAL */

    const oldModal =
        document.getElementById(
            "modificationViewModal"
        );


    if (oldModal) {

        oldModal.remove();
    }


    /* CREATE MODAL */

    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "modificationViewModal";


    modal.className =
        "modal-overlay";


    modal.style.display =
        "flex";


    modal.innerHTML = `

        <div
            class="
                modal-box
                modification-view-modal
            "
        >

            <div
                class="modal-header"
            >

                <h2>
                    Modification Details
                </h2>


                <button
                    type="button"
                    class="modal-close"
                    id="closeModificationViewBtn"
                >
                    &times;
                </button>

            </div>


            <div
                class="modal-body"
            >
                ${content}
            </div>


            <div
                class="modal-footer"
            >

                <button
                    type="button"
                    class="modal-secondary-btn"
                    id="closeModificationViewBtnBottom"
                >
                    Close
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    /* TOP CLOSE */

    document
        .getElementById(
            "closeModificationViewBtn"
        )
        ?.addEventListener(
            "click",
            function () {

                modal.remove();
            }
        );


    /* BOTTOM CLOSE */

    document
        .getElementById(
            "closeModificationViewBtnBottom"
        )
        ?.addEventListener(
            "click",
            function () {

                modal.remove();
            }
        );


    /* CLICK OUTSIDE */

    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                modal
            ) {

                modal.remove();
            }
        }
    );
}


/* ============================================================
   REVIEW MODIFICATION
============================================================ */

async function reviewModification(
    modificationId,
    status
) {

    if (!modificationIsApprover()) {

        alert(
            "Only Approver can review modifications."
        );

        return;
    }


    const normalizedStatus =
        String(status)
            .toUpperCase();


    if (
        normalizedStatus !==
            "APPROVED" &&
        normalizedStatus !==
            "REJECTED"
    ) {

        alert(
            "Invalid review status."
        );

        return;
    }


    let reviewComment =
        window.prompt(

            normalizedStatus ===
                "APPROVED"

                ? "Enter approval comment (optional):"

                : "Enter rejection reason:"
        );


    if (
        reviewComment ===
        null
    ) {

        return;
    }


    reviewComment =
        reviewComment.trim();


    if (
        normalizedStatus ===
            "REJECTED" &&
        !reviewComment
    ) {

        alert(
            "Please enter a rejection reason."
        );

        return;
    }


    const payload = {

        Status:
            normalizedStatus,

        Review_Comment:
            reviewComment || null
    };


    try {

        const response =
            await authFetch(
                `/modifications/${modificationId}/review`,
                {
                    method: "PUT",

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
            await parseModificationResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                data?.message ||
                "Failed to review modification."
            );
        }


        alert(
            data?.message ||
            `Modification ${normalizedStatus.toLowerCase()} successfully.`
        );


        await loadContractModifications(
            window.currentContractId
        );


    } catch (error) {

        console.error(
            "REVIEW MODIFICATION ERROR:",
            error
        );


        alert(
            error.message ||
            "Failed to review modification."
        );
    }
}


/* ============================================================
   APPLY MODIFICATION
============================================================ */

async function applyModification(
    modificationId
) {

    if (
        !modificationIsContractManager()
    ) {

        alert(
            "Only Contract Manager can apply modifications."
        );

        return;
    }


    const confirmed =
        window.confirm(
            "Are you sure you want to apply this approved modification? A new contract version will be created."
        );


    if (!confirmed) {

        return;
    }


    try {

        const response =
            await authFetch(
                `/modifications/${modificationId}/apply`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );


        const data =
            await parseModificationResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                data?.message ||
                "Failed to apply modification."
            );
        }


        alert(
            data?.message ||
            "Modification applied successfully. New version created."
        );


        await loadContractModifications(
            window.currentContractId
        );


        if (
            typeof window.loadContractVersions ===
            "function"
        ) {

            await window.loadContractVersions(
                window.currentContractId
            );
        }


        /* RELOAD CLAUSES IF FUNCTION EXISTS */

        if (
            typeof window.loadContractClauses ===
            "function"
        ) {

            await window.loadContractClauses(
                window.currentContractId
            );
        }


    } catch (error) {

        console.error(
            "APPLY MODIFICATION ERROR:",
            error
        );


        alert(
            error.message ||
            "Failed to apply modification."
        );
    }
}


/* ============================================================
   DELETE MODIFICATION
============================================================ */

async function deleteModification(
    modificationId
) {

    if (!modificationIsLegalUser()) {

        alert(
            "Only Legal User can delete modification requests."
        );

        return;
    }


    const confirmed =
        window.confirm(
            "Are you sure you want to delete this pending modification request?"
        );


    if (!confirmed) {

        return;
    }


    try {

        const response =  await authFetch(
                `/modifications/${modificationId}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await parseModificationResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                data?.message ||
                "Failed to delete modification."
            );
        }


        alert(
            data?.message ||
            "Modification request deleted successfully."
        );


        await loadContractModifications(
            window.currentContractId
        );


    } catch (error) {

        console.error(
            "DELETE MODIFICATION ERROR:",
            error
        );


        alert(
            error.message ||
            "Failed to delete modification."
        );
    }
}


/* ============================================================
   STATUS CLASS
============================================================ */

function getModificationStatusClass(
    status
) {

    const normalized =
        String(status || "")
            .trim()
            .toLowerCase();


    if (
        normalized ===
        "approved"
    ) {

        return "approved";
    }


    if (
        normalized ===
        "rejected"
    ) {

        return "rejected";
    }


    if (
        normalized ===
        "applied"
    ) {

        return "approved";
    }


    return "pending";
}


/* ============================================================
   DATE FORMAT
============================================================ */

function formatModificationDate(
    value
) {

    if (!value) {
        return "-";
    }


    try {

        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(value);
        }


        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",

                month: "short",

                year: "numeric",

                hour: "2-digit",

                minute: "2-digit"
            }
        );


    } catch (error) {

        return String(value);
    }
}


/* ============================================================
   ESCAPE HTML
============================================================ */

function escapeModificationHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)

        .replace( /&/g,   "&amp;" )

        .replace(   /</g, "&lt;" )

        .replace( />/g,    "&gt;" )

        .replace(   /"/g,  "&quot;"  )

        .replace(  /'/g,   "&#039;");
}


/* ============================================================
   INITIALIZE MODIFICATIONS
============================================================ */

function initializeModifications() {

    console.log(
        "MODIFICATIONS.JS INITIALIZED"
    );


    console.log(
        "createModificationBtn:",
        document.getElementById(
            "createModificationBtn"
        )
    );


    console.log(
        "modificationForm:",
        document.getElementById(
            "modificationForm"
        )
    );


    console.log(
        "modificationsTableBody:",
        document.getElementById(
            "modificationsTableBody"
        )
    );


    updateModificationPermissions();


    /* FORM */

    const form =document.getElementById(
            "modificationForm"
        );


    if (form) {

        if (
            form.dataset.modificationBound !== "true"
        ) {

            form.addEventListener(
                "submit",
                submitModification
            );


            form.dataset.modificationBound =  "true";
        }
    }
}


/* ============================================================
   DOM READY
============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeModifications
    );

} else {

    initializeModifications();
}


/* ============================================================
   EXPOSE FUNCTIONS TO WINDOW
============================================================ */

window.openModificationModal =   openModificationModal;


window.closeModificationModal =   closeModificationModal;


window.handleModificationTypeChange =handleModificationTypeChange;


window.handleClauseChange =   handleClauseChange;


window.loadContractModifications =   loadContractModifications;


window.viewModification =   viewModification;


window.reviewModification =   reviewModification;


window.applyModification =  applyModification;


window.deleteModification =  deleteModification;


window.updateModificationPermissions =   updateModificationPermissions;