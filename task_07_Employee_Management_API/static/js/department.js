
// Department Management JS


// ================= VARIABLES =================

let currentPage = 1;
let perPage = 5;
let totalPages = 1;

// ================= PAGE LOAD =================


document.addEventListener("DOMContentLoaded",async function(){
   
    // Check Authentication
const loggedIn = await checkLogin("/admin/profile");

   if(!loggedIn){

        return;

    }

    loadDepartments();


    // Search

    const search = document.getElementById( "searchDepartment" );

    if(search){

        search.addEventListener( "keyup", ()=>{

                currentPage = 1;

                loadDepartments();
            }
        );

    }

    // Previous Button

    const prev = document.getElementById( "prevBtn" );

    if(prev){

        prev.addEventListener("click",()=>{

                if(currentPage > 1){

                    currentPage--;

                    loadDepartments();

                }

            }
        );
    }

    // Next Button

    const next = document.getElementById( "nextBtn");

    if(next){

        next.addEventListener( "click",  ()=>{

                if(currentPage < totalPages){

                    currentPage++;

                    loadDepartments();

                }
            }
        );

    }

});

// ======================= LOAD DEPARTMENTS==============================

async function loadDepartments(){
    const search =  document.getElementById( "searchDepartment"  )?.value.trim();

    let url =  `/departments?page=${currentPage}&per_page=${perPage}`;

    if(search){
        url += `&search=${encodeURIComponent(search)}`;

    }
    try{
        const response = await authFetch(url);

        if(!response){

            return;

        }

        const data = await response.json();

        const table =document.getElementById(  "departmentTable"  );

        if(!table){

            return;

        }

        table.innerHTML = "";

        if(!response.ok ||
           !data.success ||
           data.departments.length===0){

            table.innerHTML = `

            <tr>

            <td colspan="5"class="text-center">

            No Departments Found

            </td>

            </tr>

            `;
            totalPages = 1;
            const pageInfo =  document.getElementById(  "pageInfo" );

            if(pageInfo){

                pageInfo.innerText = "Page 0 of 0";

            }

        return;


        }

        totalPages = data.total_pages || 1;

        const pageInfo =  document.getElementById( "pageInfo" );

        if(pageInfo){

            pageInfo.innerText =`Page ${currentPage} of ${totalPages}`;

        }
        data.departments.forEach(dept=>{

            table.innerHTML += `

<tr>
<td>

${dept.Dept_ID}
</td>

<td>

${dept.Dept_Name}

</td>

<td>

${dept.Description || ""}

</td>

<td>

${dept.Total_Employees || 0}

</td>

<td>

<div class="d-flex align-items-center gap-2 flex-nowrap">

<button class="btn btn-primary btn-sm"

onclick="editDepartment(${dept.Dept_ID})">

<i class="fas fa-edit"></i>

</button>

<button class="btn btn-danger btn-sm"

onclick="deleteDepartment(${dept.Dept_ID})">

<i class="fas fa-trash"></i>

</button>
</div>

</td>

</tr>

`;

        });

        const prevBtn =  document.getElementById( "prevBtn"  );


        const nextBtn = document.getElementById( "nextBtn" );

        if(prevBtn){

            prevBtn.disabled =currentPage === 1;

        }

        if(nextBtn){

            nextBtn.disabled =currentPage === totalPages;

        }

    }
    catch(error){
        console.error(
            "Department Load Error:",
            error
        );

    }

}


// ======================== ADD / UPDATE DEPARTMENT============================

function openAddDepartmentModal() {

    departmentForm.reset();

    document.getElementById("Dept_ID").value = "";

    document.getElementById("modalTitle").innerText = "Add Department";

    bootstrap.Modal.getOrCreateInstance( document.getElementById("departmentModal") ).show();
}

const departmentForm =document.getElementById( "departmentForm");

if(departmentForm){


departmentForm.addEventListener("submit",async function(e){

e.preventDefault();


const id =document.getElementById( "Dept_ID").value;

const department = {

Dept_Name:document.getElementById(  "Dept_Name").value.trim(),

Description:document.getElementById(  "Description").value.trim()


};

let url;

let method;

if(id){

url =`/departments/${id}`;

method ="PUT";

}

else{

url ="/departments";

method ="POST";

}

try{

const response =await authFetch(url,
{
method:method,

headers:{

"Content-Type":
"application/json"

},

body:JSON.stringify(department)

});

if(!response){

return;

}

const data =await response.json();

alert(data.message);

if(response.ok && data.success){

bootstrap.Modal.getInstance(
document.getElementById("departmentModal")).hide();

currentPage = 1;

await loadDepartments();

}

}

catch(error){

console.error("Department Save Error:",error);

}


});

}

// ===========================EDIT DEPARTMENT==========================


async function editDepartment(id){

try{

const response =await authFetch(`/departments/${id}`);

if(!response){

return;

}

const data =await response.json();

if(!response.ok || !data.success){

alert(data.message);

return;

}

const dept =data.department;

document.getElementById("Dept_ID").value =dept.Dept_ID;

document.getElementById("Dept_Name").value =dept.Dept_Name;

document.getElementById("Description").value =dept.Description || "";

document.getElementById("modalTitle").innerText ="Edit Department";

new bootstrap.Modal(document.getElementById("departmentModal")).show();
}

catch(error){
console.error("Edit Department Error:",error);

}

}


// ==========================DELETE DEPARTMENT===========================

async function deleteDepartment(id){

if(!confirm(
"Are you sure you want to delete this department?"
)){


return;


}

try{

const response =await authFetch(`/departments/${id}`,{method:"DELETE"});

if(!response){

return;

}

const data =await response.json();

alert(data.message);

if(response.ok && data.success){

loadDepartments();


}

}

catch(error){

console.error("Delete Department Error:",error);

}

}











