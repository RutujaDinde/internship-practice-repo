// ================= VARIABLES =================

let currentPage = 1;
let perPage = 5;
let totalPages = 1;


// ================= PAGE LOAD =================

document.addEventListener("DOMContentLoaded", async () => {

    // Check Login
    const loggedIn = await checkLogin("/admin/profile");

    if (!loggedIn) {
        return;
    }

    // Employee Table
    const employeeTable = document.getElementById("employeeTable");

    if (employeeTable) {

        loadDepartmentDropdown();

        loadEmployees();

    }

    // ================= SEARCH NAME =================

    const searchName = document.getElementById("searchName");

    if (searchName) {

        searchName.addEventListener("keyup", () => {

            currentPage = 1;

            loadEmployees();

        });

    }

    // ================= SEARCH EMAIL =================

    const searchEmail = document.getElementById("searchEmail");

    if (searchEmail) {

        searchEmail.addEventListener("keyup", () => {

            currentPage = 1;

            loadEmployees();

        });

    }

    // ================= DEPARTMENT FILTER =================

    const departmentFilter = document.getElementById("departmentFilter");

    if (departmentFilter) {

        departmentFilter.addEventListener("change", () => {

            currentPage = 1;

            loadEmployees();

        });

    }

    // ================= CITY FILTER =================

    const cityFilter = document.getElementById("cityFilter");

    if (cityFilter) {

        cityFilter.addEventListener("keyup", () => {

            currentPage = 1;

            loadEmployees();

        });

    }

    // ================= HIRE DATE FILTER =================

    const hireDateFilter = document.getElementById("hireDateFilter");

    if (hireDateFilter) {

        hireDateFilter.addEventListener("change", () => {

            currentPage = 1;

            loadEmployees();

        });

    }

    // ================= SORT =================

    const sortEmployee = document.getElementById("sortEmployee");

    if (sortEmployee) {

        sortEmployee.addEventListener("change", () => {

            currentPage = 1;

            loadEmployees();

        });

    }

    // ================= PAGINATION =================

    const prevBtn = document.getElementById("prevBtn");

    if (prevBtn) {

        prevBtn.addEventListener("click", () => {

            if (currentPage > 1) {

                currentPage--;

                loadEmployees();

            }

        });

    }

    const nextBtn = document.getElementById("nextBtn");

    if (nextBtn) {

        nextBtn.addEventListener("click", () => {

            if (currentPage < totalPages) {

                currentPage++;

                loadEmployees();

            }

        });

    }

    
});

// ================= LOAD DEPARTMENTS =================

async function loadDepartmentDropdown(selectedDeptId = "") {

    try {

        const response = await authFetch("/departments");

        if (!response) {

            return;

        }

        const data = await response.json();
        console.log("Departments from API:", data.departments);

        if (!response.ok || !data.success) {

            alert(data.message);

            return;

        }

        // ================= SEARCH FILTER =================

        const filter = document.getElementById("departmentFilter");

        if (filter) {

            filter.innerHTML = ` <option value="">All Departments</option> `;

            data.departments.forEach(dept => {

                filter.innerHTML += `
                    <option value="${dept.Dept_Name}">
                        ${dept.Dept_Name}
                    </option>
                `;

            });

        }

        // ================= ADD DEPARTMENT=================

        const addDepartment = document.getElementById("Dept_ID");

        if (addDepartment) {

            addDepartment.innerHTML = `
                <option value="">Select Department</option>
            `;

            data.departments.forEach(dept => {

                addDepartment.innerHTML += ` <option value="${dept.Dept_ID}">
                        ${dept.Dept_Name}
                    </option>
                `;

            });

        }

        // ================= EDIT EMPLOYEE =================

        const editDepartment = document.getElementById("editDepartment");

        if (editDepartment) {

            editDepartment.innerHTML = `  <option value="">Select Department</option> `;

            data.departments.forEach(dept => {

                editDepartment.innerHTML += `<option value="${dept.Dept_ID}"
                        ${String(dept.Dept_ID) === String(selectedDeptId) ? "selected" : ""}>
                        ${dept.Dept_Name}
                    </option>
                `;

            });

        }

    }

    catch (error) {

        console.error("Department Load Error:", error);

    }

}

// ================= ADD EMPLOYEE =================

document.addEventListener("DOMContentLoaded", () => {

    const employeeForm = document.getElementById("employeeForm");

    if (!employeeForm) {
        return;
    }

    employeeForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const formData = new FormData();
        

        // ================= EMPLOYEE DATA =================

        formData.append(  "Emp_Name",  document.getElementById("Emp_Name").value.trim());

        formData.append("Email",document.getElementById("Email").value.trim());

        formData.append( "Password", document.getElementById("Password").value );

        // Department ID
        formData.append(  "Dept_ID",  document.getElementById("Dept_ID").value);

        formData.append("Designation", document.getElementById("Designation").value.trim() );

        formData.append( "Salary",  document.getElementById("Salary").value );

        formData.append(  "Hire_Date",  document.getElementById("Hire_Date").value );




        try {

            const response = await authFetch("/employees", {

                method: "POST",
                body: formData

            });

            if (!response) {
                return;
            }

            const result = await response.json();

            if (!response.ok || !result.success) {

                alert(result.message || "Unable to add employee");

                return;

            }

            alert(result.message);

            employeeForm.reset();

            // Close Modal

            const modal = bootstrap.Modal.getInstance(

                document.getElementById("addEmployeeModal")

            );

            if (modal) {

                modal.hide();

            }

            currentPage = 1;

            loadEmployees();

            // Refresh dashboard if open

            if (typeof loadDashboard === "function") {

                loadDashboard();

            }

        }

        catch (error) {

            console.error("Add Employee Error:", error);

            alert("Server Error");

        }

    });

});

// ================= LOAD EMPLOYEES =================

async function loadEmployees() {

    const table = document.getElementById("employeeTable");

    if (!table) {
        return;
    }

    let url = `/employees?page=${currentPage}&per_page=${perPage}`;

    // ================= FILTERS =================

    const name = document.getElementById("searchName")?.value.trim();
    const email = document.getElementById("searchEmail")?.value.trim();
    const department = document.getElementById("departmentFilter")?.value;
    const city = document.getElementById("cityFilter")?.value.trim();
    const hireDate = document.getElementById("hireDateFilter")?.value;
    const sort = document.getElementById("sortEmployee")?.value;

    if (name) {
        url += "&name=" + encodeURIComponent(name);
    }

    if (email) {
        url += "&email=" + encodeURIComponent(email);
    }

    if (department) {
        url += "&department=" + encodeURIComponent(department);
    }

    if (city) {
        url += "&city=" + encodeURIComponent(city);
    }

    if (sort) {

        const lastUnderscore = sort.lastIndexOf("_");

        const sortBy = sort.substring(0, lastUnderscore);
        const order = sort.substring(lastUnderscore + 1);

        url += `&sort_by=${sortBy}&order=${order}`;
    }

    try {

        const response = await authFetch(url);

        if (!response) {
            return;
        }

        const data = await response.json();

        table.innerHTML = "";

        if (!response.ok || !data.success) {

            table.innerHTML = `
                <tr>
                    <td colspan="13" class="text-center">
                        No Employees Found
                    </td>
                </tr>
            `;

            totalPages = 1;

            document.getElementById("pageInfo").innerText =  "Page 0 of 0";

            return;

        }

        totalPages = data.total_pages || 1;

        document.getElementById("pageInfo").innerText =
            `Page ${currentPage} of ${totalPages}`;

        data.employees.forEach(emp => {

            const image = emp.Profile_Image
                ? `/static/uploads/${emp.Profile_Image}`
                : "/static/uploads/default.png";

            table.innerHTML += `

            <tr>

                <td>
                    <img src="${image}"
                        width="50"
                        height="50"
                        class="rounded-circle"
                        style="object-fit:cover;"
                    >
                </td>

                <td>${emp.Emp_ID}</td>

                <td>${emp.Emp_Name}</td>

                <td>${emp.Email}</td>

                <td>${emp.Department ?? ""}</td>

                <td>${emp.Designation ?? ""}</td>

                <td>${emp.Salary ?? ""}</td>

                <td>${emp.Hire_Date ?? ""}</td>

                <td>${emp.Role ?? ""}</td>

                <td>${emp.Phone_No ?? "Not Added"}</td>

                <td>${emp.City ?? "Not Added"}</td>
                <td>
    ${
        emp.CreatedBy
            ? `${emp.CreatedBy} (${emp.CreatedByRole || "Admin"})`
            : "-"
    }
</td>

<td>
    ${emp.CreatedDate || "-"}
</td>

<td>
    ${
        emp.UpdatedBy   ? `${emp.UpdatedBy} (${emp.UpdatedByRole || "Admin"})`    : "-"
    }
</td>

<td>
    ${emp.UpdatedDate || "-"}
</td>

                <td>

                    <span class="badge ${emp.Employment_Status === "Active"
                        ? "bg-success"
                        : "bg-danger"}">

                        ${emp.Employment_Status}

                    </span>

                </td >

                <td class="actions">

                    <button  class="btn btn-info btn-sm"
                        onclick="viewEmployee(${emp.Emp_ID})">

                        <i class="fas fa-eye"></i>

                    </button>

                    <button class="btn btn-warning btn-sm"
                        onclick="loadEmployee(${emp.Emp_ID})">

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

        document.getElementById("prevBtn").disabled = currentPage === 1;

        document.getElementById("nextBtn").disabled = currentPage === totalPages;

    }

    catch (error) {

        console.error("Load Employee Error:", error);

        alert("Unable to load employees.");

    }

}

// ================= VIEW EMPLOYEE =================

async function viewEmployee(emp_id) {

    try {

        const response = await authFetch(`/employees/${emp_id}`);

        if (!response) {
            return;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {

            alert(data.message);

            return;

        }

        const emp = data.employee;

        // ================= IMAGE =================

        const image = emp.Profile_Image
            ? `/static/uploads/${emp.Profile_Image}`
            : "/static/uploads/default.png";

        // ================= VIEW MODAL =================

        const viewModal = document.getElementById("viewEmployeeModal");

        if (viewModal) {

            const preview = document.getElementById("viewImage");

            if (preview) {

                preview.src = image;

            }

            const fields = {

                viewEmpId: emp.Emp_ID,
                viewName: emp.Emp_Name,
                viewEmail: emp.Email,
                viewPhone: emp.Phone_No || "Not Added",
                viewDepartment: emp.Department || "",
                viewDesignation: emp.Designation || "",
                viewCity: emp.City || "Not Added",
                viewAddress: emp.Address || "Not Added",
                viewSalary: emp.Salary || "",
                viewHireDate: emp.Hire_Date || "",
                viewRole: emp.Role || "",
                viewStatus: emp.Employment_Status || ""

            };

            Object.keys(fields).forEach(id => {

                const element = document.getElementById(id);

                if (element) {

                    element.innerText = fields[id];

                }

            });

            new bootstrap.Modal(viewModal).show();

        }

        // ================= FALLBACK =================

        else {

            alert(

                "Employee ID : " + emp.Emp_ID +

                "\n\nName : " + emp.Emp_Name +

                "\nEmail : " + emp.Email +

                "\nPhone : " + (emp.Phone_No || "") +

                "\nDepartment : " + (emp.Department || "") +

                "\nDesignation : " + (emp.Designation || "") +

                "\nCity : " + (emp.City || "") +

                "\nAddress : " + (emp.Address || "") +

                "\nSalary : " + (emp.Salary || "") +

                "\nHire Date : " + (emp.Hire_Date || "") +

                "\nRole : " + (emp.Role || "") +

                "\nStatus : " + (emp.Employment_Status || "")

            );

        }

    }

    catch (error) {

        console.error("View Employee Error:", error);

        alert("Unable to load employee.");

    }

}

// ================= DELETE EMPLOYEE =================

async function deleteEmployee(emp_id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this employee?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await authFetch(`/employees/${emp_id}`, {

            method: "DELETE"

        });

        if (!response) {
            return;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {

            alert(data.message);

            return;

        }

        alert(data.message);

        // If last record on current page is deleted,
        // move to previous page

        const rows = document.querySelectorAll(
            "#employeeTable tr"
        );

        if (rows.length === 1 && currentPage > 1) {

            currentPage--;

        }

        // Reload Employee Table

        loadEmployees();

        // Refresh Dashboard Cards (if dashboard.js is loaded)

        if (typeof loadDashboard === "function") {

            loadDashboard();

        }

    }

    catch (error) {

        console.error("Delete Employee Error:",error);

        alert(
            "Unable to delete employee."
        );

    }

}
// ================= LOAD EMPLOYEE FOR EDIT =================

async function loadEmployee(emp_id) {

    try {

        const response = await authFetch(`/employees/${emp_id}`);

        if (!response) {
            return;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {

            alert(data.message);

            return;

        }

        const emp = data.employee;

        // ================= BASIC DETAILS =================

        document.getElementById("editEmpId").value = emp.Emp_ID;

        document.getElementById("editName").value = emp.Emp_Name || "";

        document.getElementById("editEmail").value = emp.Email || "";
 
        document.getElementById("editDesignation").value =emp.Designation || "";

        document.getElementById("editSalary").value =emp.Salary || "";

        document.getElementById("editHireDate").value =emp.Hire_Date || "";

        document.getElementById("editRole").value =emp.Role || "";

        document.getElementById("editStatus").value =emp.Employment_Status || "";

        // ================= LOAD DEPARTMENTS =================

        await loadDepartmentDropdown(emp.Dept_ID);

        // Select Department by Name
        const departmentDropdown = document.getElementById("editDepartment");

        if (departmentDropdown) {

            Array.from(departmentDropdown.options).forEach(option => {

                if (option.text.trim() === (emp.Department || "").trim()) {

                    option.selected = true;

                }

            });

        }

        // ================= PROFILE IMAGE =================

        const preview = document.getElementById("editPreview");

        if (preview) {

            preview.src = emp.Profile_Image
                ? `/static/uploads/${emp.Profile_Image}`
                : "/static/uploads/default.png";

        }

        // Clear Selected Image

        const imageInput = document.getElementById("editProfileImage");

        if (imageInput) {

            imageInput.value = "";

        }

        // ================= SHOW MODAL =================

        const modal = new bootstrap.Modal( document.getElementById("editEmployeeModal") );

        modal.show();

    }

    catch (error) {

        console.error("Edit Employee Error:", error);

        alert("Unable to load employee.");

    }

}

// ================= IMAGE PREVIEW =================

document.addEventListener("DOMContentLoaded", () => {

    const editImageInput =
        document.getElementById("editProfileImage");

    if (editImageInput) {

        editImageInput.addEventListener("change", function () {

            if (this.files.length === 0) return;

            const reader = new FileReader();

            reader.onload = function (e) {

                document.getElementById("editPreview").src =  e.target.result;

            };

            reader.readAsDataURL(this.files[0]);

        });

    }

});

// ================= SAVE EMPLOYEE =================

async function saveEmployee() {

    const id = document.getElementById("editEmpId").value;

    const formData = new FormData();

    // ================= PROFILE IMAGE =================

    const image =
        document.getElementById("editProfileImage");

    if (image && image.files.length > 0) {

        formData.append(
            "Profile_Image",
            image.files[0]
        );

    }

    // ================= EMPLOYEE DETAILS =================

    formData.append("Emp_Name",document.getElementById("editName").value.trim());

    formData.append( "Email", document.getElementById("editEmail").value.trim());


    // IMPORTANT
    formData.append( "Dept_ID", document.getElementById("editDepartment").value );

    formData.append( "Designation", document.getElementById("editDesignation").value.trim());

    formData.append( "Salary",document.getElementById("editSalary").value);

    formData.append( "Hire_Date", document.getElementById("editHireDate").value);

    formData.append( "Role", document.getElementById("editRole").value );

    formData.append( "Employment_Status", document.getElementById("editStatus").value );


    try {

        const response = await authFetch(

            `/employees/${id}`,

            {

                method: "PUT",

                body: formData

            }

        );

        if (!response) {

            return;

        }

        const result = await response.json();

        if (!response.ok || !result.success) {

            alert(result.message);

            return;

        }

        alert(result.message);

        // Close Modal

        const modal = bootstrap.Modal.getInstance(

            document.getElementById( "editEmployeeModal"  )

        );

        if (modal) {

            modal.hide();

        }

        // Reload Employee Table

        loadEmployees();

        // Refresh Dashboard

        if (typeof loadDashboard === "function") {

            loadDashboard();

        }

    }

    catch (error) {

        console.error(
            "Update Employee Error:",
            error
        );

        alert(
            "Unable to update employee."
        );

    }

}

