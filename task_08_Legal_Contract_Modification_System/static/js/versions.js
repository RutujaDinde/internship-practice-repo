

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       API
    ===================================================== */

    const API = {
        versions: "/versions",
        documents: "/documents"
    };


    /* =====================================================
       COMMON HELPERS
    ===================================================== */

    function getElement(id) {

        return document.getElementById(id);
    }


    async function parseResponse(response) {

        const contentType =
            response.headers.get("content-type") || "";


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            return await response.json();
        }


        return await response.text();
    }


    function showMessage(message) {

        alert(message);
    }


    /* =====================================================
       GET LOGGED-IN USER ROLE
    ===================================================== */

    function getLoggedInUserRole() {

        return String(
            window.loggedInUserRole || ""
        ).trim();
    }


    /* =====================================================
       ROLE CHECK
    ===================================================== */

    function isContractManager() {

        return (
            getLoggedInUserRole() ===
            "Contract Manager"
        );
    }


    /* =====================================================
       UPDATE VERSION PERMISSIONS
       
       Version creation is now automatic through
       document upload.

       Therefore the old "Create Version" button
       is hidden.
    ===================================================== */

    function updateVersionPermissions() {

        const createVersionBtn =
            getElement(
                "createVersionBtn"
            );


        if (!createVersionBtn) {

            return;
        }


        /*
           Manual version creation is no longer
           required.

           A new version is created automatically
           when a new document is uploaded.
        */

        createVersionBtn.style.display =
            "none";
    }


    /*
       Keep this function available because
       contracts.js may still call it after
       loading the logged-in user's role.
    */

    window.updateVersionPermissions =
        updateVersionPermissions;


    /* =====================================================
       LOAD VERSIONS FOR CONTRACT
    ===================================================== */

    async function loadContractVersions(
        contractId
    ) {

        const container =
            getElement(
                "contractVersionsContainer"
            );


        if (!container) {

            return;
        }


        if (!contractId) {

            container.innerHTML = `
                <div class="empty-state">
                    Contract ID is missing.
                </div>
            `;

            return;
        }


        container.innerHTML = `
            <div class="loading-state">
                Loading contract versions...
            </div>
        `;


        try {

            const response =
                await authFetch(
                    `${API.versions}/contract/${encodeURIComponent(
                        contractId
                    )}`
                );


            const data =
                await parseResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.error ||
                    "Unable to load contract versions."
                );
            }


            /*
               IMPORTANT:

               Your API returns:

               {
                   "contract_id": 1,
                   "data": [...]
               }

               So use data.data.

               data.versions is kept as fallback
               for compatibility.
            */

            const versions =
                Array.isArray(data.data)
                    ? data.data
                    : (
                        Array.isArray(
                            data.versions
                        )
                            ? data.versions
                            : []
                    );


            renderVersions(
                versions
            );


        } catch (error) {

            console.error(
                "LOAD CONTRACT VERSIONS ERROR:",
                error
            );


            container.innerHTML = `
                <div class="empty-state">
                    Unable to load contract versions.
                </div>
            `;


            showMessage(
                error.message ||
                "Unable to load contract versions."
            );
        }
    }


    /* =====================================================
       RENDER VERSIONS
    ===================================================== */

    function renderVersions(
        versions
    ) {

        const container =
            getElement(
                "contractVersionsContainer"
            );


        if (!container) {

            return;
        }

        currentVersionId = null;



        if (
            !Array.isArray(
                versions
            ) ||
            !versions.length
        ) {

            container.innerHTML = `
                <div class="empty-state">

                    <i
                        class="fas fa-code-branch"
                        style="font-size: 28px; margin-bottom: 10px;">
                    </i>

                    <div>
                        No contract versions found.
                    </div>

                    <small>
                        Upload a document to create
                        the first contract version.
                    </small>

                </div>
            `;

            return;
        }


        /*
           Sort newest version first.

           Example:

           Version 3
           Version 2
           Version 1
        */

        const sortedVersions =
            [...versions].sort(
                (
                    first,
                    second
                ) => {

                    const firstNumber =
                        Number(
                            first.Version_Number ||
                            0
                        );


                    const secondNumber =
                        Number(
                            second.Version_Number ||
                            0
                        );


                    return (
                        secondNumber -
                        firstNumber
                    );
                }
            );


        container.innerHTML =
            sortedVersions
                .map(
                    version => {

                        const versionId =
                            version.Version_ID;


                        const versionNumber = version.Version_Number ?? "-";


                        const documentId =
                            version.Document_ID ??
                            "-";


                        const changeSummary =
                            escapeHtml(
                                version.Change_Summary ||
                                "No change summary provided."
                            );


                        const createdAt =
                            formatDateTime(
                                version.Created_At
                            );


                        const isCurrent =
                            Boolean(
                                version.Is_Current
                            );


                        const createdBy =
                            version.Created_By ??
                            "-";


                        /*
                           Store current version ID.
                        */

                        if (
                            isCurrent &&
                            versionId
                        ) {

                            currentVersionId =
                                versionId;
                        }


                        return `

                            <div
                                class="version-card"
                                data-version-id="${escapeHtml(
                                    String(
                                        versionId ?? ""
                                    )
                                )}">

                                <!-- =================================
                                     VERSION INFORMATION
                                ================================== -->

                                <div class="version-info">


                                    <!-- VERSION ICON -->

                                    <div class="version-icon">

                                        <i
                                            class="fas fa-code-branch"
                                            aria-hidden="true">
                                        </i>

                                    </div>


                                    <!-- VERSION DETAILS -->

                                    <div class="version-details">


                                        <!-- VERSION TITLE -->

                                        <div class="version-title-row">

                                            <h4>
                                                Version
                                                ${escapeHtml(
                                                    String(
                                                        versionNumber
                                                    )
                                                )}
                                            </h4>


                                            ${
                                                isCurrent
                                                    ? `
                                                        <span
                                                            class="status-badge active">

                                                            Current

                                                        </span>
                                                    `
                                                    : `
                                                        <span
                                                            class="status-badge">

                                                            Previous

                                                        </span>
                                                    `
                                            }

                                        </div>


                                        <!-- VERSION META -->

                                        <div class="version-meta">

                                            <span>

                                                Document ID:
                                                ${escapeHtml(
                                                    String(
                                                        documentId
                                                    )
                                                )}

                                            </span>


                                            <span>
                                                •
                                            </span>


                                            <span>

                                                Created:
                                                ${escapeHtml(
                                                    createdAt
                                                )}

                                            </span>


                                            <span>
                                                •
                                            </span>


                                            <span>

                                                Created By:
                                                ${escapeHtml(
                                                    String(
                                                        createdBy
                                                    )
                                                )}

                                            </span>

                                        </div>


                                        <!-- CHANGE SUMMARY -->

                                        <div class="version-summary">

                                            ${changeSummary}

                                        </div>


                                    </div>

                                </div>


                                <!-- =================================
                                     VERSION ACTIONS
                                ================================== -->

                                <div class="version-actions">


                                    ${
                                        documentId !== "-"
                                            ? `
                                                <button
                                                    type="button"
                                                    class="version-view-document-btn"
                                                    data-document-id="${escapeHtml(
                                                        String(
                                                            documentId
                                                        )
                                                    )}"
                                                    title="View Document">

                                                    <i
                                                        class="fas fa-eye">
                                                    </i>

                                                    <span>
                                                        View
                                                    </span>

                                                </button>
                                            `
                                            : ""
                                    }


                                    ${
                                        documentId !== "-"
                                            ? `
                                                <button
                                                    type="button"
                                                    class="version-download-document-btn"
                                                    data-document-id="${escapeHtml(
                                                        String(
                                                            documentId
                                                        )
                                                    )}"
                                                    title="Download Document">

                                                    <i
                                                        class="fas fa-download">
                                                    </i>

                                                    <span>
                                                        Download
                                                    </span>

                                                </button>
                                            `
                                            : ""
                                    }


                                </div>


                            </div>

                        `;

                    }
                )
                .join("");


        attachVersionEvents();
    }


    /* =====================================================
       VERSION EVENTS
    ===================================================== */

    function attachVersionEvents() {


        /* -------------------------------------------------
           VIEW DOCUMENT
        ------------------------------------------------- */

        document
            .querySelectorAll(
                ".version-view-document-btn"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        function(event) {

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


                            viewVersionDocument(
                                documentId
                            );
                        }
                    );
                }
            );


        /* -------------------------------------------------
           DOWNLOAD DOCUMENT
        ------------------------------------------------- */

        document
            .querySelectorAll(
                ".version-download-document-btn"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        function(event) {

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


                            downloadVersionDocument(
                                documentId
                            );
                        }
                    );
                }
            );
    }


    /* =====================================================
       OLD CREATE VERSION FUNCTION
       
       Kept only for backward compatibility.

       It does NOT create a version anymore.

       New versions are created by uploading
       a new document.
    ===================================================== */

    async function openCreateVersionModal() {

        showMessage(
            "Contract versions are created automatically when you upload a new document."
        );
    }


    /* =====================================================
       SAVE VERSION
       
       Manual version creation is no longer used.

       This function is kept so existing HTML/form
       code does not produce a JavaScript error.
    ===================================================== */

    async function saveVersion() {

        showMessage(
            "Please upload a new document to create a contract version."
        );
    }


    /* =====================================================
       CLOSE VERSION MODAL
    ===================================================== */

    function closeVersionModal() {

        closeModal(
            "versionModal"
        );


        resetVersionForm();


        currentVersionId =
            null;
    }


    /* =====================================================
       RESET VERSION FORM
    ===================================================== */

    function resetVersionForm() {

        const form =
            getElement(
                "versionForm"
            );


        if (form) {

            form.reset();
        }


        const versionId =
            getElement(
                "versionId"
            );


        if (versionId) {

            versionId.value =
                "";
        }


        const contractId =
            getElement(
                "versionContractId"
            );


        if (contractId) {

            contractId.value =
                "";
        }


        const documentSelect =
            getElement(
                "versionDocumentId"
            );


        if (documentSelect) {

            documentSelect.innerHTML = `
                <option value="">
                    Select Document
                </option>
            `;
        }


        const versionNumber =
            getElement(
                "versionNumber"
            );


        if (versionNumber) {

            versionNumber.value =
                "";
        }


        const changeSummary =
            getElement(
                "versionChangeSummary"
            );


        if (changeSummary) {

            changeSummary.value =
                "";
        }
    }


    /* =====================================================
       VIEW VERSION DOCUMENT
    ===================================================== */

    async function viewVersionDocument(
        documentId
    ) {

        let newWindow = null;


        try {

            /*
               Open a blank tab immediately.

               This prevents popup blocking.
            */

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
                                    Arial,
                                    sans-serif;

                                background:
                                    #f8fafc;

                                color:
                                    #253858;
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


            /* ------------------------------------------------
               GET DOCUMENT
            ------------------------------------------------ */

            const response =
                await authFetch(
                    `${API.documents}/${encodeURIComponent(
                        documentId
                    )}/view`
                );


            if (!response.ok) {

                let message =
                    "Unable to view document.";


                try {

                    const data =
                        await response.json();


                    message =
                        data.message ||
                        message;

                } catch (error) {

                    // Ignore non-JSON response
                }


                throw new Error(
                    message
                );
            }


            /* ------------------------------------------------
               CONVERT RESPONSE TO BLOB
            ------------------------------------------------ */

            const blob =
                await response.blob();


            if (!blob.size) {

                throw new Error(
                    "Document file is empty."
                );
            }


            /* ------------------------------------------------
               CREATE TEMPORARY URL
            ------------------------------------------------ */

            const blobUrl =
                URL.createObjectURL(
                    blob
                );


            /* ------------------------------------------------
               OPEN DOCUMENT
            ------------------------------------------------ */

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


            /* ------------------------------------------------
               CLEAN URL
            ------------------------------------------------ */

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
                "VIEW VERSION DOCUMENT ERROR:",
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
       DOWNLOAD VERSION DOCUMENT
    ===================================================== */

    async function downloadVersionDocument(
        documentId
    ) {

        try {

            /* ------------------------------------------------
               GET DOCUMENT
            ------------------------------------------------ */

            const response =
                await authFetch(
                    `${API.documents}/${encodeURIComponent(
                        documentId
                    )}/download`
                );


            if (!response.ok) {

                let message =
                    "Unable to download document.";


                try {

                    const data =
                        await response.json();


                    message =
                        data.message ||
                        message;

                } catch (error) {

                    // Ignore non-JSON response
                }


                throw new Error(
                    message
                );
            }


            /* ------------------------------------------------
               RESPONSE BLOB
            ------------------------------------------------ */

            const blob =
                await response.blob();


            if (!blob.size) {

                throw new Error(
                    "Document file is empty."
                );
            }


            /* ------------------------------------------------
               CREATE BLOB URL
            ------------------------------------------------ */

            const blobUrl =
                URL.createObjectURL(
                    blob
                );


            let filename =
                "document";


            /* ------------------------------------------------
               GET FILE NAME FROM RESPONSE
            ------------------------------------------------ */

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


            /* ------------------------------------------------
               CREATE DOWNLOAD LINK
            ------------------------------------------------ */

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


            /* ------------------------------------------------
               CLEAN BLOB URL
            ------------------------------------------------ */

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
                "DOWNLOAD VERSION DOCUMENT ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Unable to download document."
            );
        }
    }


    /* =====================================================
       MODAL HELPERS
    ===================================================== */

    function openModal(
        modalId
    ) {

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


    function closeModal(
        modalId
    ) {

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
       MODAL CLOSE BUTTONS
    ===================================================== */

    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function() {

                        const modalId =
                            this.dataset.closeModal;


                        closeModal(
                            modalId
                        );


                        if (
                            modalId ===
                            "versionModal"
                        ) {

                            resetVersionForm();


                            currentVersionId =
                                null;
                        }
                    }
                );
            }
        );


    /* =====================================================
       CLICK OUTSIDE MODAL
    ===================================================== */

    document
        .querySelectorAll(
            ".modal-overlay"
        )
        .forEach(
            modal => {

                modal.addEventListener(
                    "click",
                    function(event) {

                        if (
                            event.target ===
                            this
                        ) {

                            closeModal(
                                this.id
                            );


                            if (
                                this.id ===
                                "versionModal"
                            ) {

                                resetVersionForm();


                                currentVersionId =
                                    null;
                            }
                        }
                    }
                );
            }
        );


    /* =====================================================
       ESC KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key !==
                "Escape"
            ) {

                return;
            }


            const openModals =
                document.querySelectorAll(
                    ".modal-overlay.show"
                );


            openModals.forEach(
                modal => {

                    closeModal(
                        modal.id
                    );


                    if (
                        modal.id ===
                        "versionModal"
                    ) {

                        resetVersionForm();


                        currentVersionId =
                            null;
                    }
                }
            );
        }
    );


    /* =====================================================
       DATE/TIME FORMAT
    ===================================================== */

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

            return String(
                value
            );
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
       PUBLIC FUNCTIONS
    ===================================================== */

    window.loadContractVersions =
        loadContractVersions;


    window.closeVersionModal =
        closeVersionModal;


    /*
       Kept for compatibility with existing
       contracts.html / contracts.js.

       It will only show the automatic workflow
       message now.
    */

    window.openCreateVersionModal =
        openCreateVersionModal;


    window.updateVersionPermissions =
        updateVersionPermissions;


    /* =====================================================
       INITIAL PERMISSION UPDATE
    ===================================================== */

    updateVersionPermissions();


});