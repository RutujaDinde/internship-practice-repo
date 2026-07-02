from flask import Flask ,request,jsonify
from config import app,db
from models import Employee

with app.app_context():
    db.create_all()

@app.route("/")

def home():
    return "Employee Management REST API"


 # Add Employee
@app.route("/employees",methods=["POST"])
def add_employee():
  
    # Receive JSON data from request body 
    data=request.get_json()

    # Create Employee object using received data
    employee=Employee(
        Emp_ID=data["Emp_ID"],
        Emp_Name=data["Emp_Name"],
        Email=data["Email"],
        Department=data["Department"],
        Salary=data["Salary"]
    )
     
     # Add object to SQLAlchemy session
    db.session.add(employee)

     # Save object to MySQL
    db.session.commit()

    return jsonify({
       "message":"Employee Added Successfully"
   }),201


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
            "Department": emp.Department,
            "Salary": float(emp.Salary)
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
        "Department": employee.Department,
        "Salary": float(employee.Salary)
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
    employee.Department = data.get("Department", employee.Department)
    employee.Salary = data.get("Salary", employee.Salary)
    
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