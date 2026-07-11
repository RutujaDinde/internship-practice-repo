from flask import request, jsonify
from datetime import datetime
from config import app, db
from models import Employee
from werkzeug.security import generate_password_hash, check_password_hash

with app.app_context():
    db.create_all()
   

@app.route("/")
def home():
    return "Employee Management REST API"


 # Add Employee
@app.route("/employees", methods=["POST"])
def add_employee():

    data = request.get_json()

    employee = Employee(
        Emp_ID=data["Emp_ID"],
        Emp_Name=data["Emp_Name"],
        Email=data["Email"],
        Password=data["Password"],
        Department=data["Department"],
        City=data["City"],
        Salary=data["Salary"],
        Hire_Date=datetime.strptime(data["Hire_Date"],"%Y-%m-%d" ).date()
    )

    db.session.add(employee)
    db.session.commit()

    return jsonify({
        "message": "Employee added successfully"
    }), 201



#View Employees
#searching
@app.route("/employees", methods=["GET"])
def get_employees():

    query = Employee.query

    # Search Parameters
    name = request.args.get("name")
    email = request.args.get("email")
    department = request.args.get("department")
    city = request.args.get("city")
    hire_date = request.args.get("hire_date")

    if name:
        query = query.filter(Employee.Emp_Name.ilike(f"%{name}%"))

    if email:
        query = query.filter( Employee.Email.ilike(f"%{email}%") )

    if department:
        query = query.filter(Employee.Department == department)

    if city:
        query = query.filter(Employee.City == city)

    if hire_date:
        query = query.filter(Employee.Hire_Date == hire_date)


    # Sorting
    sort_by = request.args.get("sort_by")
    order = request.args.get("order", "asc")

    columns = {
        "name": Employee.Emp_Name,
        "department": Employee.Department,
        "city": Employee.City,
        "salary": Employee.Salary,
        "hire_date": Employee.Hire_Date
    }

    if sort_by in columns:
        if order == "desc":
            query = query.order_by(columns[sort_by].desc())
        else:
            query = query.order_by(columns[sort_by].asc())

    # Pagination
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 5, type=int)

    employees = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )

    if len(employees.items) == 0:
        return jsonify({
        "message": "No employees found"
    }), 404

    result=[]

    for emp in employees.items:

        result.append({

            "Emp_ID": emp.Emp_ID,
            "Emp_Name": emp.Emp_Name,
            "Email": emp.Email,
            "Password":emp.Password,
            "Department": emp.Department,
            "City": emp.City,
            "Salary": float(emp.Salary),
            "Hire_Date": str(emp.Hire_Date)

        })

    return jsonify({

        "page": page,
        "per_page": per_page,
        "total_records": employees.total,
        "total_pages": employees.pages,
        "employees": result


    })

#Search Employee
@app.route("/employees/<int:emp_id>", methods=["GET"])
def get_employee(emp_id):

    # Search employee by ID
    employee = db.session.get(Employee,emp_id)

    # Check if employee exists
    if employee is None:
        return jsonify({
            "message": "Employee Not Found"
        }), 404

    
    # Convert Employee object to dictionary
    emp_data = {
        "Emp_ID": employee.Emp_ID,
        "Emp_Name": employee.Emp_Name,
        "Email": employee.Email,
        "Password":employee.Password,
        "Department": employee.Department,
        "City":employee.City,
        "Salary": float(employee.Salary),
        "Hire_Date": employee.Hire_Date.strftime("%Y-%m-%d")
    }  
    return jsonify(emp_data), 200



#Update Employee
@app.route("/employees/<int:emp_id>", methods=["PUT"])
def update_employee(emp_id):

    # Search employee by ID
    employee = db.session.get(Employee,emp_id)

    # Check employee exists or not
    if employee is None:
        return jsonify({
            "message": "Employee Not Found"
        }), 404

    # Receive JSON data from Postman
    data = request.get_json()

    #Update only the fields provided in the request
    employee.Emp_Name = data.get("Emp_Name", employee.Emp_Name)
    employee.Email = data.get("Email", employee.Email)
    employee.Password=data.get("Password",employee.Password)
    employee.Department = data.get("Department", employee.Department)
    employee.City= data.get("City", employee.City)
    employee.Salary = data.get("Salary", employee.Salary)
    employee.Hire_Date= data.get("Hire_date", employee.Hire_Date)
    
    # Save changes in database
    db.session.commit()

    # Return response
    return jsonify({
        "message": "Employee Updated Successfully"
    }), 200


# Delete Employee 
@app.route("/employees/<int:emp_id>", methods=["DELETE"])
def delete_employee(emp_id):

    # Search employee by ID
    employee = db.session.get(Employee,emp_id)

    # Check employee exists or not
    if employee is None:
        return jsonify({
            "message": "Employee Not Found"
        }), 404

    # Delete employee
    db.session.delete(employee)

    # Save changes in database
    db.session.commit()

    # Return response
    return jsonify({
        "message": "Employee Deleted Successfully"
    }), 200

# ---------------- SIGN UP ----------------

@app.route("/signup", methods=["POST"])
def signup():

    data = request.get_json()

    # Check if email already exists
    employee = Employee.query.filter_by(Email=data["Email"]).first()

    if employee:
        return jsonify({"message": "Email already exists"}), 409
    
    hashed_password = generate_password_hash(data["Password"])

    new_employee = Employee(
        Emp_Name=data["Emp_Name"],
        Email=data["Email"],
        Password=hashed_password,
        Department=data["Department"],
        City=data["City"],
        Salary=data["Salary"],
        Hire_Date=datetime.strptime(data["Hire_Date"], "%Y-%m-%d").date()
    )

    db.session.add(new_employee)
    db.session.commit()

    return jsonify({"message": "Signup Successful"}), 201
    

# ---------------- LOGIN ----------------

@app.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    employee = Employee.query.filter_by(
        Email=data["Email"],
    ).first()

    if employee and check_password_hash(
        employee.Password,
        data["Password"]
    ):

        return jsonify({
            "message": "Login Successful",
            "employee": {
                "Emp_ID": employee.Emp_ID,
                "Emp_Name": employee.Emp_Name,
                "Email": employee.Email,
                "Department": employee.Department,
                "City":employee.City
            }
        }), 200

    return jsonify({
        "message": "Invalid Email or Password"
    }), 401


# ---------------- LOGOUT ----------------

@app.route("/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Logout Successful"}), 200



app.run(debug=True)
    