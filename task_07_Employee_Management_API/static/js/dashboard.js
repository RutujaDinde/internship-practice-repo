let currentPage = 1;
let perPage = 5;
let totalPages = 1;

let employeeChart = null;
let departmentChart = null;

document.addEventListener("DOMContentLoaded", function () {

    // Dashboard Period Filter
    const periodSelect = document.getElementById("periodSelect");

    if (periodSelect) {
        periodSelect.addEventListener("change", function () {
            loadDashboard();
        });
    }

    loadDashboard();
    loadEmployees();

    // Search
    document.getElementById("searchName").addEventListener("keyup", () => {
        currentPage = 1;
        loadEmployees();
    });

    document.getElementById("searchEmail").addEventListener("keyup", () => {
        currentPage = 1;
        loadEmployees();
    });

    document.getElementById("departmentFilter").addEventListener("change", () => {
        currentPage = 1;
        loadEmployees();
    });

    document.getElementById("cityFilter").addEventListener("keyup", () => {
        currentPage = 1;
        loadEmployees();
    });

    document.getElementById("hireDateFilter").addEventListener("change", () => {
        currentPage = 1;
        loadEmployees();
    });

    document.getElementById("sortEmployee").addEventListener("change", () => {
        currentPage = 1;
        loadEmployees();
    });

    // Pagination
    document.getElementById("prevBtn").addEventListener("click", () => {

        if (currentPage > 1) {
            currentPage--;
            loadEmployees();
        }

    });

    document.getElementById("nextBtn").addEventListener("click", () => {

        if (currentPage < totalPages) {
            currentPage++;
            loadEmployees();
        }

    });

});


// ================= Dashboard =================

function loadDashboard() {

    const period =
        document.getElementById("periodSelect") ?
        document.getElementById("periodSelect").value :
        "month";

    fetch(`/api/dashboard?period=${period}`)

        .then(response => response.json())

        .then(data => {

            if (!data.success) {
                return;
            }

            // Cards

            document.getElementById("totalEmployees").innerText =
                data.total_employees;

            document.getElementById("activeEmployees").innerText =
                data.active_employees;

            document.getElementById("joinedThisMonth").innerText =
                data.joined_this_month;

            document.getElementById("departmentCount").innerText =
                data.department_count;



            // Department Chart

            if (!departmentChart) {

    departmentChart = new Chart(
        document.getElementById("departmentChart"),
        {
            type: "doughnut",
            data: {
                labels: Object.keys(data.departments),
                datasets: [{
                    data: Object.values(data.departments),
                    backgroundColor: [
                        "#4e73df",
                        "#1cc88a",
                        "#f6c23e",
                        "#e74a3b",
                        "#36b9cc",
                        "#858796"
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,

                animation: {
                    duration: 1000,
                    animateRotate: true,
                    animateScale: true
                },

                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        }
    );

} else {

    departmentChart.data.labels = Object.keys(data.departments);
    departmentChart.data.datasets[0].data = Object.values(data.departments);

    departmentChart.update();

}

            // Employee Chart
        if (!employeeChart) {

    employeeChart = new Chart(
        document.getElementById("employeeChart"),
        {
            type: "line",

            data: {
                labels: data.growth_labels,

                datasets: [{
                    label: "Employees Joined",
                    data: data.growth_values,
                    borderColor: "#4e73df",
                    backgroundColor: "rgba(78,115,223,0.2)",
                    fill: true,
                    tension: 0.4
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                animation: {
                    duration: 1000
                },

                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        }
    );

} else {

    employeeChart.data.labels = data.growth_labels;
    employeeChart.data.datasets[0].data = data.growth_values;

    employeeChart.update();

}

        })
        .catch(error => console.log(error));

}
    


// ================= Employees =================

function loadEmployees() {

    let name = document.getElementById("searchName").value.trim();
    let email = document.getElementById("searchEmail").value.trim();
    let department = document.getElementById("departmentFilter").value;
    let city = document.getElementById("cityFilter").value.trim();
    let hire_date = document.getElementById("hireDateFilter").value;
    let sortValue = document.getElementById("sortEmployee").value;

    let url = `/employees?page=${currentPage}&per_page=${perPage}`;

    // Search

    if (name !== "") {
        url += "&name=" + encodeURIComponent(name);
    }

    if (email !== "") {
        url += "&email=" + encodeURIComponent(email);
    }

    if (department !== "") {
        url += "&department=" + encodeURIComponent(department);
    }

    if (city !== "") {
        url += "&city=" + encodeURIComponent(city);
    }

    if (hire_date !== "") {
        url += "&hire_date=" + hire_date;
    }

    // Sorting

    if (sortValue !== "") {

        let sort_by = "";
        let order = "";

        if (sortValue === "salary_asc") {
            sort_by = "salary";
            order = "asc";
        }
        else if (sortValue === "salary_desc") {
            sort_by = "salary";
            order = "desc";
        }
        else if (sortValue === "name_asc") {
            sort_by = "name";
            order = "asc";
        }
        else if (sortValue === "name_desc") {
            sort_by = "name";
            order = "desc";
        }
        else if (sortValue === "hire_date_asc") {
            sort_by = "hire_date";
            order = "asc";
        }
        else if (sortValue === "hire_date_desc") {
            sort_by = "hire_date";
            order = "desc";
        }

        url += `&sort_by=${sort_by}&order=${order}`;
    }

    fetch(url)

    .then(response => response.json())

    .then(data => {

        let table = document.getElementById("employeeTable");

        table.innerHTML = "";

        if (!data.success) {

            table.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">
                        No Employees Found
                    </td>
                </tr>
            `;

            document.getElementById("pageInfo").innerText =
                "Page 0 of 0";

            return;
        }

        totalPages = data.total_pages;

        document.getElementById("pageInfo").innerText =
            `Page ${currentPage} of ${totalPages}`;

        data.employees.forEach(emp => {

            table.innerHTML += `
<tr>

    <td>${emp.Emp_ID}</td>

    <td class="emp-name">${emp.Emp_Name}</td>

    <td class="emp-email">${emp.Email}</td>

    <td class="emp-department">
        <span class="badge bg-primary">${emp.Department}</span>
    </td>

    <td class="emp-city">${emp.City}</td>

    <td class="emp-salary">₹${emp.Salary}</td>

    <td class="emp-date">${emp.Hire_Date}</td>

    <td>
        <span class="badge bg-success">Active</span>
    </td>

    <td class="actions">

        <button class="btn btn-primary btn-sm"
            onclick="viewEmployee(${emp.Emp_ID})">
            <i class="fas fa-eye"></i>
        </button>

        <button class="btn btn-warning btn-sm"
            onclick="editEmployee(this, ${emp.Emp_ID})">
            <i class="fas fa-edit"></i>
        </button>

        <button class="btn btn-danger btn-sm"
            onclick="deleteEmployee(${emp.Emp_ID})">
            <i class="fas fa-trash"></i>
        </button>

    </td>

</tr>
            `;
        });

        document.getElementById("prevBtn").disabled =
            (currentPage === 1);

        document.getElementById("nextBtn").disabled =
            (currentPage === totalPages);

    })

    .catch(error => console.log(error));

}

function viewEmployee(emp_id){

    fetch(`/employees/${emp_id}`)

    .then(response => response.json())

    .then(data => {

        if(data.success){

            let emp = data.employee;

            alert(
                "Employee ID : " + emp.Emp_ID +
                "\nName : " + emp.Emp_Name +
                "\nEmail : " + emp.Email +
                "\nDepartment : " + emp.Department +
                "\nCity : " + emp.City +
                "\nSalary : " + emp.Salary +
                "\nHire Date : " + emp.Hire_Date
            );

        }
        else{

            alert(data.message);

        }

    })

    .catch(error => {
        console.log(error);
    });

}

//delete 
function deleteEmployee(emp_id){

    if(confirm("Are you sure you want to delete this employee?")){

        fetch(`/employees/${emp_id}`,{
            method:"DELETE"
        })

        .then(response=>response.json())

        .then(data=>{

            alert(data.message);

            loadEmployees();
            loadDashboard();

        })

        .catch(error=>console.log(error));

    }

}

//Edit
function editEmployee(button, emp_id){

    let row = button.closest("tr");

    let name = row.querySelector(".emp-name").innerText;
    let email = row.querySelector(".emp-email").innerText;
    let department = row.querySelector(".emp-department").innerText.trim();
    let city = row.querySelector(".emp-city").innerText;
    let salary = row.querySelector(".emp-salary").innerText.replace("₹","");
    let hireDate = row.querySelector(".emp-date").innerText;

    row.querySelector(".emp-name").innerHTML =
        `<input type="text" id="name_${emp_id}" value="${name}" class="form-control form-control-sm">`;

    row.querySelector(".emp-email").innerHTML =
        `<input type="email" id="email_${emp_id}" value="${email}" class="form-control form-control-sm">`;

    row.querySelector(".emp-department").innerHTML =
        `<input type="text" id="department_${emp_id}" value="${department}" class="form-control form-control-sm">`;

    row.querySelector(".emp-city").innerHTML =
        `<input type="text" id="city_${emp_id}" value="${city}" class="form-control form-control-sm">`;

    row.querySelector(".emp-salary").innerHTML =
        `<input type="number" id="salary_${emp_id}" value="${salary}" class="form-control form-control-sm">`;

    row.querySelector(".emp-date").innerHTML =
        `<input type="date" id="date_${emp_id}" value="${hireDate}" class="form-control form-control-sm">`;

    row.querySelector(".actions").innerHTML = `

        <button class="btn btn-primary btn-sm"
            onclick="viewEmployee(${emp_id})">
            <i class="fas fa-eye"></i>
        </button>

        <button class="btn btn-success btn-sm"
            onclick="saveEmployee(${emp_id})">
            <i class="fas fa-save"></i>
        </button>

        <button class="btn btn-secondary btn-sm"
            onclick="loadEmployees()">
            <i class="fas fa-times"></i>
        </button>

    `;
}

function saveEmployee(emp_id){

    let employee = {

        Emp_Name: document.getElementById(`name_${emp_id}`).value,
        Email: document.getElementById(`email_${emp_id}`).value,
        Department: document.getElementById(`department_${emp_id}`).value,
        City: document.getElementById(`city_${emp_id}`).value,
        Salary: document.getElementById(`salary_${emp_id}`).value,
        Hire_Date: document.getElementById(`date_${emp_id}`).value

    };

    fetch(`/employees/${emp_id}`,{

        method:"PUT",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify(employee)

    })

    .then(response=>response.json())

    .then(data=>{

        alert(data.message);

        loadEmployees();
        loadDashboard();

    })

    .catch(error=>console.log(error));

}