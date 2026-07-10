from flask import request, jsonify
from datetime import datetime
from config import app, db
from models import Employee

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
@app.route("/employees",   methods=["GET"])
def get_all_employee() :

    # Fetch all employees from database
    emp_data=Employee.query.all()

    # Empty list to store employee records  
    employee_list=[]

    # Convert Employee objects into dictionaries
    for emp in emp_data:

        employee_list.append({
            "Emp_ID": emp.Emp_ID,
            "Emp_Name": emp.Emp_Name,
            "Email": emp.Email,
            "Password":emp.Password,
            "Department": emp.Department,
            "City": emp.City,
            "Salary": float(emp.Salary),
            "Hire_Date": emp.Hire_Date.strftime("%Y-%m-%d")
    })
        
    return jsonify(employee_list),201



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
    
 
app.run(debug=True)
    