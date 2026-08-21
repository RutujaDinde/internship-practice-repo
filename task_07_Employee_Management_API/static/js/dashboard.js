// ================= Variables =================

let employeeChart = null;
let departmentChart = null;


// ================= Page Load =================

document.addEventListener("DOMContentLoaded", () => {

    const dashboardPage = document.getElementById("dashboardPage");

    if (!dashboardPage) {
        return;
    }

    // Period Dropdown
    const periodSelect = document.getElementById("periodSelect");

    if (periodSelect) {

        periodSelect.addEventListener(
            "change",
            loadDashboard
        );

    }

    // Sidebar Toggle
    const menuBtn = document.getElementById("menuBtn");
    const sidebar = document.getElementById("sidebar");

    if (menuBtn && sidebar) {

        menuBtn.addEventListener("click", () => {

            sidebar.classList.toggle("active");

        });

    }

    // Load Dashboard
    loadDashboard();

});


// ================= Load Dashboard =================

async function loadDashboard() {

    const dashboardPage = document.getElementById("dashboardPage");

    if (!dashboardPage) {
        return;
    }

    try {

        const periodElement =document.getElementById("periodSelect");

        const period = periodElement ? periodElement.value : "month";

        const response = await authFetch(
            `/api/dashboard?period=${period}`,
            {
                method: "GET"
            }
        );

        if (!response) {
            return;
        }

        if (response.status === 403) {

            alert("Access Denied");

            window.location.href = "/login-page";

            return;

        }

        const data = await response.json();

        if (!data.success) {

            alert(data.message);

            return;

        }

        // ================= Cards =================

        const totalEmployees =document.getElementById("totalEmployees");

        if (totalEmployees) {

            totalEmployees.innerText =data.total_employees;

        }

        const activeEmployees =document.getElementById("activeEmployees");

        if (activeEmployees) {

            activeEmployees.innerText =  data.active_employees;

        }

        const joinedThisMonth = document.getElementById("joinedThisMonth");

        if (joinedThisMonth) {

            joinedThisMonth.innerText =data.joined_this_month;

        }

        const departmentCount =
            document.getElementById("departmentCount");

        if (departmentCount) {

            departmentCount.innerText = data.department_count;

        }

        // ================= Department Doughnut Chart =================

        const departmentCanvas =
            document.getElementById("departmentChart");

        if (departmentCanvas) {

            const labels =Object.keys(data.departments);

            const values =Object.values(data.departments);

            if (!departmentChart) {

                departmentChart =
                    new Chart(departmentCanvas, {

                        type: "doughnut",

                        data: {

                            labels: labels,

                            datasets: [{

                                label: "Employees",

                                data: values

                            }]

                        },

                        options: {

                            responsive: true,

                            maintainAspectRatio: false,

                            plugins: {

                                legend: {

                                    position: "bottom"

                                }

                            }

                        }

                    });

            }

            else {

                departmentChart.data.labels = labels;

                departmentChart.data.datasets[0].data = values;

                departmentChart.update();

            }

        }

        // ================= Employee Growth Chart =================

        const employeeCanvas =
            document.getElementById("employeeChart");

        if (employeeCanvas) {

            const labels =data.growth_labels;

            const values = data.growth_values;

            if (!employeeChart) {

                employeeChart =
                    new Chart(employeeCanvas, {

                        type: "line",

                        data: {

                            labels: labels,

                            datasets: [{

                                label: "Employees Joined",

                                data: values,

                                fill: true,

                                tension: 0.4

                            }]

                        },

                        options: {

                            responsive: true,

                            maintainAspectRatio: false,

                            scales: {

                                y: {

                                    beginAtZero: true,

                                    ticks: {

                                        precision: 0

                                    }

                                }

                            }

                        }

                    });

            }

            else {

                employeeChart.data.labels =  labels;

                employeeChart.data.datasets[0].data =  values;

                employeeChart.update();

            }

        }

    }

    catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

    }

}



