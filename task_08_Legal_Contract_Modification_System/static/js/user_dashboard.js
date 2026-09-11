
// =====================================================
// LEGAL USER DASHBOARD
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    loadUserDashboard();

    setCurrentDate();

});


// =====================================================
// LOAD DASHBOARD
// =====================================================

async function loadUserDashboard() {

    try {

        const response = await authFetch(
            "/users/user-dashboard-data",
            {
                method: "GET"
            }
        );


        const result = await response.json();


        if (!response.ok) {

            console.error(
                "Dashboard Error:",
                result
            );

            return;
        }


        console.log(
            "Legal User Dashboard:",
            result
        );


        // =================================================
        // USER INFORMATION
        // =================================================

        if (result.user) {

            const userName =
                result.user.Name || "User";


            // ---------------------------------------------
            // DASHBOARD WELCOME NAME
            // ---------------------------------------------

            const welcomeUserName =
                document.getElementById(
                    "welcomeUserName"
                );


            if (welcomeUserName) {

                welcomeUserName.textContent =
                    userName;

            }


            // ---------------------------------------------
            // HEADER USER NAME
            // ---------------------------------------------

            const headerUserName =
                document.getElementById(
                    "headerUserName"
                );


            if (headerUserName) {

                headerUserName.textContent =
                    userName;

            }


            // ---------------------------------------------
            // HEADER ROLE
            // ---------------------------------------------

            const headerUserRole =
                document.getElementById(
                    "headerUserRole"
                );


            if (headerUserRole) {

                headerUserRole.textContent =
                    result.user.Role ||
                    "Legal User";

            }

        }


        // =================================================
        // STATISTICS
        // =================================================

        const statistics =
            result.statistics || {};


        // ---------------------------------------------
        // ASSIGNED CONTRACTS
        // ---------------------------------------------

        setText(
            "assignedContracts",
            statistics.assigned_contracts ||
            statistics.my_contracts ||
            0
        );


        // ---------------------------------------------
        // ACTIVE CONTRACTS
        // ---------------------------------------------

        setText(
            "activeContracts",
            statistics.active_contracts ||
            0
        );


        // ---------------------------------------------
        // DOCUMENTS
        // ---------------------------------------------

        setText(
            "myDocuments",
            statistics.my_documents ||
            0
        );


        // ---------------------------------------------
        // EXPIRING CONTRACTS
        // ---------------------------------------------

        setText(
            "expiringContracts",
            statistics.expiring_contracts ||
            0
        );


        // =================================================
        // STATUS COUNTS
        // =================================================

        const statusCounts =
            result.status_counts || {};


        // ---------------------------------------------
        // DRAFT
        // ---------------------------------------------

        setText(
            "draftCount",
            statusCounts.Draft ||
            0
        );


        // ---------------------------------------------
        // ACTIVE
        // ---------------------------------------------

        setText(
            "activeCount",
            statusCounts.Active ||
            0
        );


        // ---------------------------------------------
        // EXPIRED
        // ---------------------------------------------

        setText(
            "expiredCount",
            statusCounts.Expired ||
            0
        );


        // ---------------------------------------------
        // TERMINATED
        // ---------------------------------------------

        setText(
            "terminatedCount",
            statusCounts.Terminated ||
            0
        );


        // ---------------------------------------------
        // TOTAL CONTRACTS
        // ---------------------------------------------

        const totalContracts =
            Number(
                statistics.assigned_contracts ||
                statistics.my_contracts ||
                0
            );


        setText(
            "statusTotal",
            totalContracts
        );


        // =================================================
        // RECENT ASSIGNED CONTRACTS
        // =================================================

        renderRecentContracts(
            result.recent_contracts ||
            []
        );


        // =================================================
        // UPDATE DONUT
        // =================================================

        updateDonutChart(
            statusCounts
        );


    } catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

    }

}


// =====================================================
// SET TEXT
// =====================================================

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value;

    }

}


// =====================================================
// CURRENT DATE
// =====================================================

function setCurrentDate() {

    const dateElement =
        document.getElementById(
            "currentDate"
        );


    if (!dateElement) {

        return;

    }


    const today =
        new Date();


    dateElement.textContent =
        today.toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );

}


// =====================================================
// RECENT ASSIGNED CONTRACTS
// =====================================================

function renderRecentContracts(
    contracts
) {

    const tbody =
        document.getElementById(
            "recentContracts"
        );


    if (!tbody) {

        return;

    }


    tbody.innerHTML = "";


    // =================================================
    // NO CONTRACTS
    // =================================================

    if (!contracts.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty-row"
                >

                    No assigned contracts available

                </td>

            </tr>

        `;

        return;

    }


    // =================================================
    // SORT RECENT CONTRACTS
    // =================================================

    const recentContracts =
        [...contracts]
            .sort(
                function (a, b) {

                    const dateA =
                        new Date(
                            a.Updated_At ||
                            a.Created_At ||
                            0
                        );


                    const dateB =
                        new Date(
                            b.Updated_At ||
                            b.Created_At ||
                            0
                        );


                    return dateB - dateA;

                }
            )
            .slice(
                0,
                5
            );


    // =================================================
    // CREATE TABLE ROWS
    // =================================================

    recentContracts.forEach(
        function (contract) {

            const row =
                document.createElement(
                    "tr"
                );


            const contractName =
                contract.Contract_Name ||
                "-";


            const contractType =
                contract.Contract_Type ||
                contract.Contract_Type_Name ||
                "-";


            const status =
                contract.Status ||
                contract.Status_Name ||
                "-";


            row.innerHTML = `

                <!-- CONTRACT -->

                <td>

                    <strong>
                        ${escapeHtml(
                            contractName
                        )}
                    </strong>

                    <small>
                        #${escapeHtml(
                            contract.Contract_ID
                        )}
                    </small>

                </td>


                <!-- TYPE -->

                <td>

                    ${escapeHtml(
                        contractType
                    )}

                </td>


                <!-- EFFECTIVE DATE -->

                <td>

                    ${formatDate(
                        contract.Effective_Date
                    )}

                </td>


                <!-- EXPIRY DATE -->

                <td>

                    ${formatDate(
                        contract.Expiry_Date
                    )}

                </td>


                <!-- STATUS -->

                <td>

                    <span
                        class="
                            status-badge
                            ${getStatusClass(
                                status
                            )}
                        "
                    >

                        ${escapeHtml(
                            status
                        )}

                    </span>

                </td>


                <!-- ACTION -->

                <td>

                    <button
                        type="button"
                        class="action-btn"
                        onclick="viewContract(
                            ${contract.Contract_ID}
                        )"
                        title="View Contract"
                    >

                        <i
                            class="fa-solid fa-eye"
                        ></i>

                    </button>

                </td>

            `;


            tbody.appendChild(
                row
            );

        }
    );

}


// =====================================================
// VIEW CONTRACT
// =====================================================

window.viewContract =
    function (contractId) {

        if (!contractId) {

            return;

        }


        window.location.href =
            `/contracts/page?contract_id=${contractId}`;

    };


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(
    dateString
) {

    if (!dateString) {

        return "-";

    }


    const date =
        new Date(
            dateString
        );


    if (isNaN(
        date.getTime()
    )) {

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

}


// =====================================================
// STATUS CLASS
// =====================================================

function getStatusClass(
    status
) {

    if (!status) {

        return "status-draft";

    }


    switch (status) {

        case "Draft":

            return "status-draft";


        case "Active":

            return "status-active";


        case "Expired":

            return "status-expired";


        case "Terminated":

            return "status-terminated";


        default:

            return "";

    }

}


// =====================================================
// DONUT CHART
// =====================================================

function updateDonutChart(
    statusCounts
) {

    const chart =
        document.querySelector(
            ".donut-chart"
        );


    if (!chart) {

        return;

    }


    // =================================================
    // GET COUNTS
    // =================================================

    const draft =
        Number(
            statusCounts.Draft ||
            0
        );


    const active =
        Number(
            statusCounts.Active ||
            0
        );


    const expired =
        Number(
            statusCounts.Expired ||
            0
        );


    const terminated =
        Number(
            statusCounts.Terminated ||
            0
        );


    const total =
        draft +
        active +
        expired +
        terminated;


    // =================================================
    // NO DATA
    // =================================================

    if (total === 0) {

        chart.style.background =
            "#e5e7eb";

        return;

    }


    // =================================================
    // CALCULATE DEGREES
    // =================================================

    const draftDeg =
        (draft / total) *
        360;


    const activeDeg =
        (active / total) *
        360;


    const expiredDeg =
        (expired / total) *
        360;


    const terminatedDeg =
        (terminated / total) *
        360;


    // =================================================
    // CALCULATE POSITIONS
    // =================================================

    const draftEnd =
        draftDeg;


    const activeEnd =
        draftEnd +
        activeDeg;


    const expiredEnd =
        activeEnd +
        expiredDeg;


    const terminatedEnd =
        expiredEnd +
        terminatedDeg;


    // =================================================
    // DRAW DONUT
    // =================================================

    chart.style.background = `

        conic-gradient(

            #1f2937
            0deg
            ${draftEnd}deg,

            #64748b
            ${draftEnd}deg
            ${activeEnd}deg,

            #94a3b8
            ${activeEnd}deg
            ${expiredEnd}deg,

            #cbd5e1
            ${expiredEnd}deg
            ${terminatedEnd}deg

        )

    `;

}


// =====================================================
// ESCAPE HTML
// =====================================================

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

