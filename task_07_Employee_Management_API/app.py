from flask import request, jsonify
from datetime import datetime
from config import app, db
from models import Employee
from werkzeug.security import generate_password_hash, check_password_hash
from schemas import EmployeeSchema, LoginSchema,UpdateEmployeeSchema
from marshmallow import ValidationError

employee_schema = EmployeeSchema()
login_schema = LoginSchema()
update_schema = UpdateEmployeeSchema()

with app.app_context():
    db.create_all()
   

@app.route("/")
def home():
    return "Employee Management REST API"


 # Add Employee
@app.route("/employees", methods=["POST"])
def add_employee():

    try:

        data = employee_schema.load(request.get_json())

        employee = Employee(
            Emp_ID=data["Emp_ID"],
            Emp_Name=data["Emp_Name"],
            Email=data["Email"],
            Password=generate_password_hash(data["Password"]),
            Department=data["Department"],
            City=data["City"],
            Salary=data["Salary"],
            Hire_Date=data["Hire_Date"]
        )

        db.session.add(employee)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Employee Added Successfully"
        }),201
    
    except ValidationError as err:

        return jsonify({
            "success": False,
            "errors": err.messages
        }),400

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }),500



#View Employees
#searching
@app.route("/employees", methods=["GET"])
def get_employees():

    try:

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
            "success": False,
            "message": "No employees found"
        }), 404

        result=[]

        for emp in employees.items:

            result.append({

                "Emp_ID": emp.Emp_ID,
                "Emp_Name": emp.Emp_Name,
                "Email": emp.Email,
                "Department": emp.Department,
                "City": emp.City,
                "Salary": float(emp.Salary),
                "Hire_Date": str(emp.Hire_Date)

            })

        return jsonify({
            "success": True,
            "page": page,
            "per_page": per_page,
            "total_records": employees.total,
            "total_pages": employees.pages,
            "employees": result
        }),200
    
    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

#Search Employee
@app.route("/employees/<int:emp_id>", methods=["GET"])
def get_employee(emp_id):

    try:

    # Search employee by ID
        employee = db.session.get(Employee,emp_id)

        # Check if employee exists
        if employee is None:
            return jsonify({
                "success": False,
                "message": "Employee Not Found"
            }), 404

        
        # Convert Employee object to dictionary
        emp_data = {
            "Emp_ID": employee.Emp_ID,
            "Emp_Name": employee.Emp_Name,
            "Email": employee.Email,
            "Department": employee.Department,
            "City":employee.City,
            "Salary": float(employee.Salary),
            "Hire_Date": employee.Hire_Date.strftime("%Y-%m-%d")
        }  
        return jsonify({ "success": True, "employee": emp_data}), 200
    
    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500



#Update Employee
@app.route("/employees/<int:emp_id>", methods=["PUT"])
def update_employee(emp_id):

    try:

        # Search employee by ID
        employee = db.session.get(Employee,emp_id)

        # Check employee exists or not
        if employee is None:
            return jsonify({
                "success": False,
                "message": "Employee Not Found"
            }), 404

        # Receive JSON data from Postman
        # Validate request data
        data = update_schema.load(request.get_json())

        #Update only the fields provided in the request
        employee.Emp_Name = data.get("Emp_Name", employee.Emp_Name)
        employee.Email = data.get("Email", employee.Email)
        employee.Department = data.get("Department", employee.Department)
        employee.City= data.get("City", employee.City)
        employee.Salary = data.get("Salary", employee.Salary)
        employee.Hire_Date= data.get("Hire_Date", employee.Hire_Date)

        if "Password" in data:
            employee.Password = generate_password_hash(data["Password"])
        
        # Save changes in database
        db.session.commit()

        # Return response
        return jsonify({
            "success": True,
            "message": "Employee Updated Successfully"
        }), 200
    
    except ValidationError as err:
        return jsonify({
            "success": False,
            "errors": err.messages
        }), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# Delete Employee 
@app.route("/employees/<int:emp_id>", methods=["DELETE"])
def delete_employee(emp_id):

    try:

        # Search employee by ID
        employee = db.session.get(Employee,emp_id)

        # Check employee exists or not
        if employee is None:
            return jsonify({
                "success": False,
                "message": "Employee Not Found"
            }), 404

        # Delete employee
        db.session.delete(employee)

        # Save changes in database
        db.session.commit()

        # Return response
        return jsonify({
            "success": True,
            "message": "Employee Deleted Successfully"
        }), 200
    except Exception as e:

        db.session.rollback()

        return jsonify({
            "success":False,
            "message":str(e)
        }),500
    

# ---------------- SIGN UP ----------------

@app.route("/signup", methods=["POST"])
def signup():

    try:

        data = employee_schema.load(request.get_json())

        # Check if email already exists
        employee = Employee.query.filter_by(Email=data["Email"]).first()

        if employee:
            return jsonify({"success": False,"message": "Email already exists"}), 409
        
        hashed_password = generate_password_hash(data["Password"])

        new_employee = Employee(
            Emp_Name=data["Emp_Name"],
            Email=data["Email"],
            Password=hashed_password,
            Department=data["Department"],
            City=data["City"],
            Salary=data["Salary"],
            Hire_Date=data["Hire_Date"]
        )

        db.session.add(new_employee)
        db.session.commit()

        return jsonify({ "success": True,"message": "Signup Successful"}), 201
    
    except ValidationError as err:

        return jsonify({
            "success": False,
            "errors": err.messages
        }),400

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }),500
    

# ---------------- LOGIN ----------------

@app.route("/login", methods=["POST"])
def login():

    try:

        data = login_schema.load(request.get_json())

        employee = Employee.query.filter_by(
            Email=data["Email"],
        ).first()

        if employee and check_password_hash(
            employee.Password,
            data["Password"]
        ):

            return jsonify({
                "success": True,
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
            "success": False,
            "message": "Invalid Email or Password"
        }), 401
    except ValidationError as err:
        return jsonify({
            "success": False,
            "errors": err.messages
        }), 400

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ---------------- LOGOUT ----------------

@app.route("/logout", methods=["POST"])
def logout():
    return jsonify({ "success": True,"message": "Logout Successful"}), 200



app.run(debug=True)
    