document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // LOAD ADMIN DASHBOARD
    // ==========================================

    loadDashboardStats();

});


// ==========================================
// LOAD DASHBOARD STATISTICS
// ==========================================

async function loadDashboardStats() {

    try {

        const response = await fetch(
            "/users/admin-dashboard",
            {
                method: "GET",
                credentials: "include"
            }
        );


        const data = await response.json();


        if (!response.ok) {

            console.error(
                data.message ||
                "Failed to load dashboard"
            );

            return;
        }


        // ==========================================
        // TOTAL USERS
        // ==========================================

        const totalUsers =document.getElementById("totalUsers");

        if (totalUsers) {

            totalUsers.textContent =  data.total_users || 0;

        }


        // ==========================================
        // TOTAL CONTRACTS
        // ==========================================

        const totalContracts = document.getElementById("totalContracts");

        if (totalContracts) {

            totalContracts.textContent =
                data.total_contracts || 0;

        }


        // ==========================================
        // CONTRACT TYPES COUNT
        // ==========================================

        const contractTypes =data.contract_types || {};

        const contractTypesCount =   document.getElementById("contracttypes");

        if (contractTypesCount) {

            contractTypesCount.textContent =  Object.keys(contractTypes).length;

        }


        // ==========================================
        // CONTRACT STATUS
        // ==========================================

        updateContractStatus(
            data.contract_status || {}
        );


        // ==========================================
        // CONTRACT TYPE CHART
        // ==========================================

        updateContractTypeChart(
            contractTypes
        );

    }

    catch (error) {

        console.error(
            "Error loading dashboard stats:",
            error
        );

    }

}


// ==========================================
// CONTRACT STATUS
// ==========================================

function updateContractStatus(statusData) {

    // ------------------------------------------
    // GET STATUS COUNTS
    // ------------------------------------------

    const draft =
        statusData["Draft"] || 0;


    const underReview = statusData["Under Review"] || 0;

    const pendingApproval = statusData["Pending Approval"] || 0;

    const approved = statusData["Approved"] || 0;

    const rejected =  statusData["Rejected"] || 0;


    // ------------------------------------------
    // TOTAL CONTRACTS BY STATUS
    // ------------------------------------------

    const statusTotal =
        document.getElementById("statusTotal");

    if (statusTotal) {

        const total =
            draft +
            underReview +
            pendingApproval +
            approved +
            rejected;

        statusTotal.textContent = total;

    }


    // ------------------------------------------
    // DRAFT
    // ------------------------------------------

    const draftCount =
        document.getElementById("draftCount");

    if (draftCount) {

        draftCount.textContent =
            draft;

    }


    // ------------------------------------------
    // UNDER REVIEW
    // ------------------------------------------

    const reviewCount =
        document.getElementById("reviewCount");

    if (reviewCount) {

        reviewCount.textContent =
            underReview;

    }


    // ------------------------------------------
    // PENDING APPROVAL
    // ------------------------------------------

    const approvalCount =
        document.getElementById("approvalCount");

    if (approvalCount) {

        approvalCount.textContent =
            pendingApproval;

    }


    // ------------------------------------------
    // APPROVED
    // ------------------------------------------

    const approvedCount =
        document.getElementById("approvedCount");

    if (approvedCount) {

        approvedCount.textContent =
            approved;

    }


    // ------------------------------------------
    // REJECTED
    // ------------------------------------------

    const rejectedCount =
        document.getElementById("rejectedCount");

    if (rejectedCount) {

        rejectedCount.textContent =
            rejected;

    }


    // ------------------------------------------
    // TOP CARD - PENDING APPROVAL
    // ------------------------------------------

    const pendingApprovalCard =
        document.getElementById("pendingApproval");

    if (pendingApprovalCard) {

        pendingApprovalCard.textContent =
            pendingApproval;

    }

}


// ==========================================
// CONTRACT TYPE CHART
// ==========================================

function updateContractTypeChart(typeData) {

    const chart =
        document.getElementById(
            "contractTypeChart"
        );


    if (!chart) {

        console.error(
            "contractTypeChart element not found"
        );

        return;

    }


    // ------------------------------------------
    // CLEAR OLD DATA
    // ------------------------------------------

    chart.innerHTML = "";


    const types =
        Object.entries(typeData);


    // ------------------------------------------
    // NO DATA
    // ------------------------------------------

    if (types.length === 0) {

        chart.innerHTML = `
            <div class="empty-chart">
                No contracts available
            </div>
        `;

        return;

    }


    // ------------------------------------------
    // FIND HIGHEST COUNT
    // ------------------------------------------

    const maxCount =
        Math.max(
            ...types.map(
                function ([typeName, count]) {

                    return count;

                }
            )
        );


    // ------------------------------------------
    // CREATE TYPE ROWS
    // ------------------------------------------

    types.forEach(
        function ([typeName, count]) {

            const percentage =
                maxCount > 0
                    ? (count / maxCount) * 100
                    : 0;


            const row =
                document.createElement("div");


            row.className =
                "type-row";


            row.innerHTML = `

                <span class="type-name">
                    ${escapeHtml(typeName)}
                </span>


                <div class="type-bar-container">

                    <div
                        class="type-bar"
                        style="width: ${percentage}%;">
                    </div>

                </div>


                <span class="type-count">
                    ${count}
                </span>

            `;


            chart.appendChild(row);

        }
    );

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace( /&/g, "&amp;" )

        .replace( /</g, "&lt;" )

        .replace( />/g,  "&gt;" )

        .replace( /"/g,  "&quot;")

        .replace(  /'/g,  "&#039;" );

}