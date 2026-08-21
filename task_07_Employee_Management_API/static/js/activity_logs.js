// =====================================================
// ACTIVITY LOGS JS
// =====================================================


// ================= VARIABLES =================

let currentPage = 1;
let perPage = 5;
let totalPages = 1;


// ================= PAGE LOAD =================

document.addEventListener("DOMContentLoaded", async function () {

    // Check Authentication
    const loggedIn = await checkLogin("/admin/profile");

    if (!loggedIn) {

        return;

    }

    loadActivityLogs();


    // ================= SEARCH =================

    const search = document.getElementById("searchInput");

    if (search) {

        search.addEventListener("keyup", function () {

            currentPage = 1;

            loadActivityLogs();

        });

    }


    // ================= ACTION FILTER =================

    const actionFilter = document.getElementById("actionFilter");

    if (actionFilter) {

        actionFilter.addEventListener("change", function () {

            currentPage = 1;

            loadActivityLogs();

        });

    }


    // ================= MODULE FILTER =================

    const moduleFilter = document.getElementById("moduleFilter");

    if (moduleFilter) {

        moduleFilter.addEventListener("change", function () {

            currentPage = 1;

            loadActivityLogs();

        });

    }


    // ================= PREVIOUS BUTTON =================

    const prev = document.getElementById("prevBtn");

    if (prev) {

        prev.addEventListener("click", function () {

            if (currentPage > 1) {

                currentPage--;

                loadActivityLogs();

            }

        });

    }


    // ================= NEXT BUTTON =================

    const next = document.getElementById("nextBtn");

    if (next) {

        next.addEventListener("click", function () {

            if (currentPage < totalPages) {

                currentPage++;

                loadActivityLogs();

            }

        });

    }

});


// ================= LOAD ACTIVITY LOGS =================

async function loadActivityLogs() {

    try {

        const search = document.getElementById("searchInput")?.value.trim();

        const action =document.getElementById("actionFilter")?.value;

        const module =document.getElementById("moduleFilter")?.value;


        // ================= BUILD URL =================

        let url =
            `/activity-logs?page=${currentPage}&per_page=${perPage}`;


        if (search) {

            url += `&search=${encodeURIComponent(search)}`;

        }


        if (action) {

            url += `&action=${encodeURIComponent(action)}`;

        }


        if (module) {

            url += `&module=${encodeURIComponent(module)}`;

        }


        // ================= API REQUEST =================

        const response = await authFetch(url);

        if (!response) {

            return;

        }


        const data = await response.json();


        const table =document.getElementById("activityLogsTable");


        if (!table) {

            return;

        }


        table.innerHTML = "";


        // ================= ERROR / NO RECORDS =================

        if (
            !response.ok ||
            !data.success ||
            !data.activity_logs ||
            data.activity_logs.length === 0
        ) {

            table.innerHTML = `

                <tr>

                    <td colspan="8" class="text-center">

                        No activity logs found.

                    </td>

                </tr>

            `;


            totalPages = 1;

            const pageInfo =   document.getElementById("pageInfo");

            if (pageInfo) {

                pageInfo.innerText = "Page 0 of 0";

            }


            updatePaginationButtons();

            return;

        }


        // ================= TOTAL PAGES =================

        totalPages = data.total_pages || 1;


        // ================= PAGE INFO =================

        const pageInfo =document.getElementById("pageInfo");


        if (pageInfo) {

            pageInfo.innerText = `Page ${currentPage} of ${totalPages}`;

        }


        // ================= DISPLAY LOGS =================

        data.activity_logs.forEach(function (log) {

            const row = document.createElement("tr");


            row.innerHTML = `

                <td>

                    ${escapeHtml(log.Log_ID)}

                </td>


                <td>

                    <strong>

                        ${escapeHtml(
                            log.Employee_Name || "System"
                        )}

                    </strong>


                    ${
                        log.Emp_ID
                        ?
                        `<small class="text-muted d-block">

                            ID: ${escapeHtml(log.Emp_ID)}

                        </small>`
                        :
                        ""
                    }

                </td>


                <td>

                    ${
                        log.Role_Name
                        ?
                        escapeHtml(log.Role_Name)
                        :
                        "-"
                    }

                </td>


                <td>

                    <span

                        class="activity-action"

                        data-action="${escapeHtml(
                            log.Action
                        )}"

                    >

                        ${escapeHtml(
                            formatAction(log.Action)
                        )}

                    </span>

                </td>


                <td>

                    ${
                        log.Module
                        ?
                        escapeHtml(log.Module)
                        :
                        "-"
                    }

                </td>


                <td>

                    ${
                        log.Description
                        ?
                        escapeHtml(log.Description)
                        :
                        "-"
                    }

                </td>


                <td>

                    ${
                        log.IP_Address
                        ?
                        escapeHtml(log.IP_Address)
                        :
                        "-"
                    }

                </td>


                <td>

                    ${
                        log.Created_Date
                        ?
                        escapeHtml( formatDateTime(
                                log.Created_Date
                            )
                        )
                        :
                        "-"
                    }

                </td>

            `;


            table.appendChild(row);

        });


        // ================= UPDATE BUTTONS =================

        updatePaginationButtons();

    }


    catch (error) {

        console.error(
            "Activity Logs Error:",
            error
        );


        showActivityMessage(
            "Something went wrong while loading activity logs."
        );

    }

}


// ================= UPDATE PAGINATION BUTTONS =================

function updatePaginationButtons() {

    const prevBtn =document.getElementById("prevBtn");


    const nextBtn = document.getElementById("nextBtn");


    if (prevBtn) {

        prevBtn.disabled =currentPage === 1;

    }


    if (nextBtn) {

        nextBtn.disabled = currentPage === totalPages;

    }

}


// ================= CLEAR FILTERS =================

function clearFilters() {

    document.getElementById("searchInput").value = "";

    document.getElementById("actionFilter").value = "";

    document.getElementById("moduleFilter").value = "";


    currentPage = 1;

    loadActivityLogs();

}


// ================= EXPORT CSV =================

async function exportActivityLogs() {

    try {

        const search = document.getElementById(  "searchInput" )?.value.trim();

        const action =document.getElementById( "actionFilter" )?.value;

        const module = document.getElementById(  "moduleFilter" )?.value;


        // ================= BUILD QUERY =================

        const params =new URLSearchParams();


        if (search) {
            params.append("search", search );

        }


        if (action) {

            params.append(  "action",   action );

        }


        if (module) {

            params.append(  "module",  module  );

        }


        // ================= API REQUEST =================

        const response =  await authFetch(  `/activity-logs/export?${params.toString()}`  );


        if (!response) {

            return;

        }


        if (!response.ok) {

            let message = "Unable to export activity logs.";


            try {

                const errorData =  await response.json();

                if (errorData.message) {

                    message =  errorData.message;

                }

            }


            catch (error) {

                console.error(error);

            }


            alert(message);

            return;

        }


        // ================= GET CSV =================

        const blob =await response.blob();


        // ================= DOWNLOAD CSV =================

        const url = window.URL.createObjectURL(blob);


        const link =document.createElement("a");


        link.href = url;

        link.download ="activity_logs.csv";

        document.body.appendChild(link);

        link.click();

        link.remove();

        window.URL.revokeObjectURL(url);

    }


    catch (error) {

        console.error( "CSV Export Error:", error );


        alert(
            "Something went wrong while exporting activity logs."
        );

    }

}


// ================= FORMAT ACTION =================

function formatAction(action) {

    if (!action) {

        return "-";

    }


    return action

        .replace(/_/g, " ")

        .toLowerCase()

        .replace(
            /\b\w/g,
            function (letter) {

                return letter.toUpperCase();

            }
        );

}


// ================= FORMAT DATE & TIME =================

function formatDateTime(dateValue) {

    if (!dateValue) {

        return "-";

    }


    const date = new Date(
            dateValue.replace(" ", "T")
        );


    if (isNaN(date.getTime())) {

        return dateValue;

    }


    return date.toLocaleString(
        "en-IN",
        {

            day: "2-digit",

            month: "2-digit",

            year: "numeric",

            hour: "2-digit",

            minute: "2-digit",

            second: "2-digit"

        }
    );

}


// ================= ERROR MESSAGE =================

function showActivityMessage(message) {

    const table =document.getElementById("activityLogsTable"  );

    if (!table) {

        return;

    }


    table.innerHTML = `

        <tr>

            <td   colspan="8"  class="text-center text-danger">

                ${escapeHtml(message)}

            </td>

        </tr>

    `;

}


// ================= HTML ESCAPE =================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace( /&/g, "&amp;")

        .replace(  /</g,  "&lt;")

        .replace( />/g, "&gt;" )

        .replace(/"/g,"&quot;" )

        .replace( /'/g,    "&#039;");

}