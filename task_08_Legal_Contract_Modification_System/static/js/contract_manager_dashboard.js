
document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // ELEMENTS
    // =====================================================

    const welcomeUserName =  document.getElementById("welcomeUserName");

    const currentDate =  document.getElementById("currentDate");

    const myContracts =   document.getElementById("myContracts");

    const activeContracts = document.getElementById("activeContracts");

    const expiringContracts = document.getElementById("expiringContracts");

    const myDocuments = document.getElementById("myDocuments");

    const statusTotal =document.getElementById("statusTotal");

    const draftCount =  document.getElementById("draftCount");

    const activeCount = document.getElementById("activeCount");

    const expiredCount = document.getElementById("expiredCount");

    const terminatedCount = document.getElementById("terminatedCount");


    const recentContracts = document.getElementById("recentContracts");

    const donutChart = document.querySelector(".donut-chart");


    // =====================================================
    // CURRENT DATE
    // =====================================================

    function displayCurrentDate() {

        const today = new Date();

        const options = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        };


        if (currentDate) {

            currentDate.textContent =
                today.toLocaleDateString(
                    "en-US",
                    options
                );

        }

    }


    // =====================================================
    // GET LOGGED-IN USER
    // =====================================================

    async function getCurrentUser() {

        try {

            const response =
                await fetch(
                    "/users/profile",
                    {
                        method: "GET",
                        credentials: "include"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Unable to get logged-in user"
                );

            }


            const data =
                await response.json();


            return data.user || null;

        }

        catch (error) {

            console.error(
                "User profile error:",
                error
            );


            return null;

        }

    }


    // =====================================================
    // GET CONTRACTS
    // =====================================================

    async function getContracts() {

        try {

            const response =
                await fetch(
                    "/contracts",
                    {
                        method: "GET",
                        credentials: "include"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Unable to get contracts"
                );

            }


            const data =
                await response.json();


            return data.contracts || [];

        }

        catch (error) {

            console.error(
                "Contract API error:",
                error
            );


            return [];

        }

    }


    // =====================================================
    // GET MY DOCUMENTS
    // =====================================================

    async function getMyDocuments() {

        try {

            const response =
                await fetch(
                    "/documents",
                    {
                        method: "GET",
                        credentials: "include"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Unable to get documents"
                );

            }


            const data =
                await response.json();


            return data.documents || [];

        }

        catch (error) {

            console.error(
                "Document API error:",
                error
            );


            return [];

        }

    }


    // =====================================================
    // UPDATE STATISTICS
    // =====================================================

    function updateStatistics(
        contracts,
        documents
    ) {

        // -------------------------------------------------
        // MY CONTRACTS
        // -------------------------------------------------

        if (myContracts) {

            myContracts.textContent =
                contracts.length;

        }


        // -------------------------------------------------
        // ACTIVE CONTRACTS
        // -------------------------------------------------

        const active =
            contracts.filter(
                function (contract) {

                    return (
                        contract.Status_Name ===
                        "Active"
                    );

                }
            );


        if (activeContracts) {

            activeContracts.textContent =
                active.length;

        }


        // -------------------------------------------------
        // EXPIRING SOON
        // -------------------------------------------------

        const expiring =
            contracts.filter(
                function (contract) {

                    return isExpiringSoon(
                        contract.Expiry_Date
                    );

                }
            );


        if (expiringContracts) {

            expiringContracts.textContent =
                expiring.length;

        }


        // -------------------------------------------------
        // MY DOCUMENTS
        // -------------------------------------------------

        if (myDocuments) {

            myDocuments.textContent =
                documents.length;

        }

    }


    // =====================================================
    // CONTRACT STATUS
    // =====================================================

    function updateStatusChart(contracts) {

        let draft = 0;

        let active = 0;

        let expired = 0;

        let terminated = 0;


        contracts.forEach(
            function (contract) {

                const status =
                    contract.Status_Name;


                if (status === "Draft") {

                    draft++;

                }

                else if (status === "Active") {

                    active++;

                }

                else if (status === "Expired") {

                    expired++;

                }

                else if (status === "Terminated") {

                    terminated++;

                }

            }
        );


        const total =
            draft +
            active +
            expired +
            terminated;


        // -------------------------------------------------
        // TOTAL
        // -------------------------------------------------

        if (statusTotal) {

            statusTotal.textContent =
                total;

        }


        // -------------------------------------------------
        // DRAFT
        // -------------------------------------------------

        if (draftCount) {

            draftCount.textContent =
                draft;

        }


        // -------------------------------------------------
        // ACTIVE
        // -------------------------------------------------

        if (activeCount) {

            activeCount.textContent =
                active;

        }


        // -------------------------------------------------
        // EXPIRED
        // -------------------------------------------------

        if (expiredCount) {

            expiredCount.textContent =
                expired;

        }


        // -------------------------------------------------
        // TERMINATED
        // -------------------------------------------------

        if (terminatedCount) {

            terminatedCount.textContent =
                terminated;

        }


        // -------------------------------------------------
        // DONUT
        // -------------------------------------------------

        updateDonut(
            draft,
            active,
            expired,
            terminated,
            total
        );

    }


    // =====================================================
    // UPDATE DONUT
    // =====================================================

    function updateDonut(
        draft,
        active,
        expired,
        terminated,
        total
    ) {

        if (!donutChart) {

            return;

        }


        // -------------------------------------------------
        // NO DATA
        // -------------------------------------------------

        if (total === 0) {

            donutChart.style.background =
                "#eef0f2";

            return;

        }


        // -------------------------------------------------
        // CALCULATE DEGREES
        // -------------------------------------------------

        const draftDegree =
            (draft / total) * 360;


        const activeDegree =
            (active / total) * 360;


        const expiredDegree =
            (expired / total) * 360;


        const terminatedDegree =
            (terminated / total) * 360;


        // -------------------------------------------------
        // CALCULATE END POSITIONS
        // -------------------------------------------------

        const draftEnd =
            draftDegree;


        const activeEnd =
            draftEnd +
            activeDegree;


        const expiredEnd =
            activeEnd +
            expiredDegree;


        const terminatedEnd =
            expiredEnd +
            terminatedDegree;


        // -------------------------------------------------
        // CREATE DONUT
        // -------------------------------------------------

        donutChart.style.background =
            `conic-gradient(
                #1f2937 0deg ${draftEnd}deg,
                #64748b ${draftEnd}deg ${activeEnd}deg,
                #94a3b8 ${activeEnd}deg ${expiredEnd}deg,
                #cbd5e1 ${expiredEnd}deg ${terminatedEnd}deg
            )`;

    }


    // =====================================================
    // EXPIRING SOON
    // =====================================================

    function isExpiringSoon(expiryDate) {

        if (!expiryDate) {

            return false;

        }


        const today = new Date();

        const expiry =new Date(expiryDate);


        if (isNaN(expiry.getTime())) {

            return false;

        }


        // Remove time portion
        // to compare calendar dates

        today.setHours(  0,  0,  0,  0);


        expiry.setHours(  0, 0, 0, 0);
        
        const difference =  expiry.getTime() -  today.getTime();

        const days = difference /
            (
                1000 *
                60 *
                60 *
                24
            );


        return (
            days >= 0 &&
            days <= 30
        );

    }


    // =====================================================
    // RECENT CONTRACTS
    // =====================================================

    function displayRecentContracts(
        contracts
    ) {

        if (!recentContracts) {

            return;

        }


        recentContracts.innerHTML = "";


        // -------------------------------------------------
        // NO CONTRACTS
        // -------------------------------------------------

        if (contracts.length === 0) {

            recentContracts.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        class="empty-row"
                    >

                        No contracts available

                    </td>

                </tr>

            `;

            return;

        }


        // -------------------------------------------------
        // SORT BY UPDATED DATE / CREATED DATE
        // -------------------------------------------------

        const recent =
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


                        return (
                            dateB - dateA
                        );

                    }
                )
                .slice(
                    0,
                    5
                );


        // -------------------------------------------------
        // CREATE ROWS
        // -------------------------------------------------

        recent.forEach(
            function (contract) {

                const row =
                    document.createElement(
                        "tr"
                    );


                const status =
                    contract.Status_Name ||
                    "Unknown";


                // -------------------------------------------------
                // CONTRACT MANAGER ACTIONS
                // -------------------------------------------------

                const actionButtons = `

                    <button
                        type="button"
                        class="action-btn view-btn"
                        onclick="viewContract(${contract.Contract_ID})"
                        title="View Contract"
                    >

                        <i class="fa-solid fa-eye"></i>

                    </button>


                    <button
                        type="button"
                        class="action-btn edit-btn"
                        onclick="editContract(${contract.Contract_ID})"
                        title="Edit Contract"
                    >

                        <i class="fa-solid fa-pen"></i>

                    </button>

                `;


                row.innerHTML = `

                    <td>
                        ${escapeHtml(
                            contract.Contract_Name ||
                            "-"
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            contract.Contract_Type_Name ||
                            "-"
                        )}
                    </td>


                    <td>
                        ${formatDate(
                            contract.Effective_Date
                        )}
                    </td>


                    <td>
                        ${formatDate(
                            contract.Expiry_Date
                        )}
                    </td>


                    <td>

                        <span
                            class="status-badge
                            ${getStatusClass(status)}"
                        >

                            ${escapeHtml(status)}

                        </span>

                    </td>


                    <td>

                        ${actionButtons}

                    </td>

                `;


                recentContracts.appendChild(
                    row
                );

            }
        );

    }


    // =====================================================
    // FORMAT DATE
    // =====================================================

    function formatDate(dateValue) {

        if (!dateValue) {

            return "-";

        }


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

    }


    // =====================================================
    // STATUS CLASS
    // =====================================================

    function getStatusClass(status) {

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
    // ESCAPE HTML
    // =====================================================

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


    // =====================================================
    // VIEW CONTRACT
    // =====================================================

    window.viewContract =
        function (contractId) {

            window.location.href =
                `/contracts/page?contract_id=${contractId}`;

        };


    // =====================================================
    // EDIT CONTRACT
    // =====================================================

    window.editContract =
        function (contractId) {

            window.location.href =
                `/contracts/page?contract_id=${contractId}&mode=edit`;

        };


    // =====================================================
    // LOAD DASHBOARD
    // =====================================================

    async function loadDashboard() {

        // -------------------------------------------------
        // GET CURRENT USER
        // -------------------------------------------------

        const user =
            await getCurrentUser();


        if (!user) {

            console.error(
                "Logged-in user not found"
            );

            return;

        }


        // -------------------------------------------------
        // USER NAME
        // -------------------------------------------------

        if (welcomeUserName) {

            welcomeUserName.textContent =
                user.Name ||
                "User";

        }


        console.log(
            "Logged-in user:",
            user
        );


        // -------------------------------------------------
        // LOAD CONTRACTS AND DOCUMENTS
        // -------------------------------------------------

        const [
            contracts,
            documents
        ] = await Promise.all([
            getContracts(),
            getMyDocuments()
        ]);


        console.log(
            "Contracts:",
            contracts
        );


        console.log(
            "My Documents:",
            documents
        );


        // -------------------------------------------------
        // UPDATE DASHBOARD
        // -------------------------------------------------

        updateStatistics(
            contracts,
            documents
        );


        updateStatusChart(
            contracts
        );


        displayRecentContracts(
            contracts
        );

    }


    // =====================================================
    // START DASHBOARD
    // =====================================================

    displayCurrentDate();

    loadDashboard();

});
