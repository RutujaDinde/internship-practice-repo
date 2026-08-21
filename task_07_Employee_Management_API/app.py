from flask import request, jsonify,render_template,make_response
from functools import wraps
from flask import jsonify
import uuid
from sqlalchemy import func, or_
from config import app, db,mail
from jwt_config import BLACKLIST
from models import Employee,Department,Role, ActivityLog,PasswordResetOTP
from werkzeug.security import generate_password_hash, check_password_hash
from schemas import AdminSignupSchema, EmployeeSchema, LoginSchema,UpdateEmployeeSchema,ForgotPasswordSchema, VerifyOTPSchema,ResetPasswordSchema
from marshmallow import ValidationError
from werkzeug.utils import secure_filename
import random
import secrets
from audit import set_created_audit,set_updated_audit
from activity_log import create_activity_log
import csv
from io import StringIO
from flask import Response

from sqlalchemy.orm import aliased
Creator = aliased(Employee)
Updater = aliased(Employee)

from datetime import date,datetime, timedelta

from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")

from flask_mail import Message


import os
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    decode_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies
)


admin_signup_schema = AdminSignupSchema()
employee_schema = EmployeeSchema()
login_schema = LoginSchema()
update_schema = UpdateEmployeeSchema()

forgot_password_schema = ForgotPasswordSchema()

verify_otp_schema = VerifyOTPSchema()

reset_password_schema = ResetPasswordSchema()

with app.app_context():
    db.create_all()


 # ------------------------ ROLE-BASED JWT AUTHORIZATION (DECORATOR) ---------------------------------

def role_required(required_role):

    def decorator(f):

        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):

            # JWT IS VALID AT THIS POINT

            claims = get_jwt()

            user_role = claims.get("role")
            employee_id = get_jwt_identity()

           
            # CHECK JWT ROLE

            if user_role != required_role:

                return jsonify({
                    "success": False,
                    "message": f"{required_role} access only"
                }), 403


            try:
                employee_id = int(employee_id)

            except (TypeError, ValueError):

                return jsonify({
                    "success": False,
                    "message": "Invalid user identity"
                }), 401


            employee = Employee.query.filter_by(
                Emp_ID=employee_id,
                IsDeleted="False",
                Employment_Status="Active"
            ).first()

            if employee is None:

                return jsonify({
                    "success": False,
                    "message": "Account is inactive or unavailable"
                }), 403


            if not employee.role:

                return jsonify({
                    "success": False,
                    "message": "User role is not configured"
                }), 403

            if employee.role.Role_Name != required_role:

                return jsonify({
                    "success": False,
                    "message": "User role does not match required role"
                }), 403

        
            # EVERYTHING IS VALID
        
            return f(*args, **kwargs)

        return decorated_function

    return decorator


# ---------------------------------ADMIN AUTHORIZATION-------------------------------------


def admin_required():
    return role_required("Admin")


#--------------------------------------EMPLOYEE AUTHORIZATION-------------------------------
def employee_required():
    return role_required("Employee")

  
#----------------------- ADMIN PROFILE-------------------------------
  

@app.route("/admin/profile", methods=["GET"])
@admin_required()
def admin_profile():

    try:

        admin_id = get_jwt_identity()

        admin = Employee.query.filter_by(
            Emp_ID=int(admin_id),
            IsDeleted="False"
        ).first()

        if not admin:

            return jsonify({
                "success": False,
                "message": "Admin not found"
            }), 404

        return jsonify({

            "success": True,

            "admin": {

                "Name": admin.Emp_Name,

                "Email": admin.Email,

                "phone": admin.Phone_No,

                "city": admin.City,

                "address": admin.Address,

                "Designation": admin.Designation,

                "Department":admin.department.Dept_Name
                    if admin.department
                    else "",

                "Employment_Status": admin.Employment_Status,

                "Hire_Date":admin.Hire_Date.strftime("%d-%m-%Y")
                    if admin.Hire_Date
                    else "",

                "Profile_Image":admin.Profile_Image,

                "role": admin.role.Role_Name
                    if admin.role
                    else "Administrator"

            }

        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

  
#----------------------- UPDATE ADMIN PROFILE--------------------------
  

@app.route("/admin/profile", methods=["PUT"])
@admin_required()
def update_admin_profile():

    try:

        admin_id = get_jwt_identity()

        admin = Employee.query.filter_by( Emp_ID=int(admin_id), IsDeleted="False").first()

        if not admin:

            return jsonify({
                "success": False,
                "message": "Admin not found"
            }), 404

        data = request.form

        admin.Emp_Name = data.get("adminEmp_Name", admin.Emp_Name)
        admin.Phone_No = data.get("adminPhone", admin.Phone_No)
        admin.City = data.get("adminCity", admin.City)
        admin.Address = data.get("adminAddress", admin.Address)

        # Profile Image 

        image = request.files.get("Profile_Image")

        if image and image.filename:

            upload_folder = os.path.join(
                app.root_path,
                "static",
                "uploads"
            )

            os.makedirs(upload_folder, exist_ok=True)

            extension = os.path.splitext(image.filename)[1]

            filename = f"{uuid.uuid4().hex}{extension}"

            image.save(
                os.path.join(upload_folder, filename)
            )

            # Delete old image
            if (
                admin.Profile_Image
                and admin.Profile_Image != "default.png"
            ):

                old_image = os.path.join(
                    upload_folder,
                    admin.Profile_Image
                )

                if os.path.exists(old_image):
                    os.remove(old_image)

            admin.Profile_Image = filename

        set_updated_audit(admin)

        create_activity_log(
            action="UPDATE",
            module="Admin Profile",
            description=f"Admin profile updated for '{admin.Emp_Name}'",
            emp_id=admin.Emp_ID,
            role_id=admin.Role_ID
      )
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Profile updated successfully."
        }), 200

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


  
# --------------------CHANGE PASSWORD------------------------
  
@app.route("/admin/change-password", methods=["PUT"])
@admin_required()
def change_admin_password():

    try:

        admin_id = get_jwt_identity()

        admin = Employee.query.filter_by(
            Emp_ID=int(admin_id),
            IsDeleted="False",
            Employment_Status="Active"
        ).first()

        if not admin:

            return jsonify({
                "success": False,
                "message": "Admin not found"
            }), 404

        data = request.get_json()

        current_password = data.get("current_password")
        new_password = data.get("new_password")
        confirm_password = data.get("confirm_password")

        if not current_password:
            return jsonify({
                "success": False,
                "message": "Current password is required."
            }), 400

        if not new_password:
            return jsonify({
                "success": False,
                "message": "New password is required."
            }), 400

        if not confirm_password:
            return jsonify({
                "success": False,
                "message": "Confirm password is required."
            }), 400

        # Validation

        if check_password_hash(admin.Password, new_password):
            return jsonify({
                "success": False,
                "message": "New password cannot be the same as current password."
            }), 400

        if not check_password_hash(
            admin.Password,
            current_password
        ):

            return jsonify({
                "success": False,
                "message": "Current password is incorrect."
            }), 400

        if new_password != confirm_password:

            return jsonify({
                "success": False,
                "message": "Passwords do not match."
            }), 400

        if len(new_password) < 8:

            return jsonify({
                "success": False,
                "message": "Password must be at least 8 characters."
            }), 400

        admin.Password = generate_password_hash(
            new_password
        )

        set_updated_audit(admin)

       
        # Activity Log

        create_activity_log(
            action="PASSWORD_CHANGE",
            module="Password",
            description=f"Password changed for admin '{admin.Emp_Name}'",
            emp_id=admin.Emp_ID
        )

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Password updated successfully."
        }), 200

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

#---------------------Admin Change Password Page----------------------

@app.route("/admin/change-password-page")
@admin_required()
def admin_change_password_page():

    return render_template(
        "admin_change_password.html",
        active_page="change_password"
    )


#-------- Edit Admin Profile Page---------

@app.route("/admin/edit-profile")
@admin_required()
def edit_admin_profile_page():

    return render_template(

        "edit_profile.html",

        active_page="admin_profile"

    )

@app.route("/admin/profile-page")
@admin_required()
def admin_profile_page():

    return render_template("admin_profile.html",active_page="admin_profile")


 # --------Add Employee---------

@app.route("/employees", methods=["POST"])
@admin_required()
def add_employee():

    try:

        data=employee_schema.load(request.form)
        
        role = Role.query.filter_by(Role_Name="Employee").first()

        if role is None:

            return jsonify({
                "success":False,
                "message":"Employee role not found"
            }),404

        existing = Employee.query.filter_by( Email=data["Email"] ).first()

        if existing:
            return jsonify({
                "success": False,
                "message": "Email already exists"
            }), 409



        employee = Employee(
            Emp_Name=data["Emp_Name"],
            Email=data["Email"],
            Password=generate_password_hash(data["Password"]),
            Designation=data["Designation"],
            Dept_ID=data["Dept_ID"],
            Salary=data["Salary"],
            Hire_Date=data["Hire_Date"],
            Employment_Status="Active",
            IsDeleted="False",
            Role_ID=role.Role_ID,
            
        )

        db.session.add(employee)
        db.session.flush()

        set_created_audit(employee)
        create_activity_log(
                    action="CREATE",
                    module="Employee",
                    description=f"Employee '{employee.Emp_Name}' created",
                    emp_id=employee.Emp_ID,
                    role_id=employee.Role_ID
       )


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
    
# ---------------- ADD EMPLOYEE PAGE ----------------

@app.route("/add-employee")
@admin_required()
def add_employee_page():

    departments = Department.query.all()

    return render_template(
        "add_employee.html",
        departments=departments,
        active_page="add_employee"
    )


#View Employees
#searching
@app.route("/employees", methods=["GET"])
@admin_required()
def get_employees():

    try:


        query = Employee.query.filter_by(IsDeleted="False" )

        # Search Parameters
        name = request.args.get("name")
        email = request.args.get("email")
        department = request.args.get("department")
        city = request.args.get("city")
       

        if name:
            query = query.filter(Employee.Emp_Name.ilike(f"%{name}%"))

        if email:
            query = query.filter( Employee.Email.ilike(f"%{email}%") )

        if department:
            query = query.outerjoin(Department).filter(
                Department.Dept_Name == department)

        if city:
            query = query.filter(Employee.City == city)



        # Sorting
        sort_by = request.args.get("sort_by")
        order = request.args.get("order", "asc")

        columns = {
            "name": Employee.Emp_Name,
            "city": Employee.City,
            "salary": Employee.Salary,
            "hire_date": Employee.Hire_Date,
            "department":
                Department.Dept_Name
        }


        if sort_by:

            if sort_by not in columns:
                return jsonify({
                    "success": False,
                    "message": "Invalid sort field"
                }),400

            if sort_by == "department":
                  if not department:
                     query = query.outerjoin(Department,Employee.Dept_ID == Department.Dept_ID)

            if order=="desc":
                query=query.order_by(columns[sort_by].desc())
            else:
                query=query.order_by(columns[sort_by].asc())

        else:
            query=query.order_by(Employee.Emp_ID.desc())

        # Pagination
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 5, type=int)

        employees = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

       
        result=[]

        for emp in employees.items:

            
            # CREATED BY

            created_by_name = None
            created_by_role = None

            if emp.CreatedBy:

                creator = db.session.get(
                    Employee,
                    emp.CreatedBy
                )

                if creator:

                    created_by_name = creator.Emp_Name

                    if creator.role:

                        created_by_role = (
                            creator.role.Role_Name
                        )

            # UPDATED BY
           
            updated_by_name = None
            updated_by_role = None

            if emp.UpdatedBy:

                updater = db.session.get(
                    Employee,
                    emp.UpdatedBy
                )

                if updater:

                    updated_by_name = updater.Emp_Name

                    if updater.role:

                        updated_by_role = (
                            updater.role.Role_Name
                        )

            # EMPLOYEE RESPONSE

            result.append({

                "Emp_ID": emp.Emp_ID,

                "Profile_Image": emp.Profile_Image,

                "Emp_Name": emp.Emp_Name,

                "Email": emp.Email,

                "Phone_No": emp.Phone_No,

                "Address": emp.Address,

                "Department": emp.department.Dept_Name
                    if emp.department
                    else None,

                "Dept_ID": emp.Dept_ID,

                "Designation": emp.Designation,

                "City": emp.City,

                "Salary": float(emp.Salary)
                    if emp.Salary is not None
                    else 0,

                "Hire_Date":emp.Hire_Date.strftime("%Y-%m-%d")
                    if emp.Hire_Date
                    else None,

                "Role":emp.role.Role_Name
                    if emp.role
                    else None,

                "Employment_Status": emp.Employment_Status,

                "IsDeleted":emp.IsDeleted,

                
                # AUDIT FIELDS

                "CreatedBy":created_by_name,

                "CreatedByRole": created_by_role,

                "CreatedDate": emp.CreatedDate.strftime(
                        "%d-%m-%Y %H:%M"
                    )
                    if emp.CreatedDate
                    else None,

                "UpdatedBy": updated_by_name,

                "UpdatedByRole": updated_by_role,

                "UpdatedDate": emp.UpdatedDate.strftime(
                        "%d-%m-%Y %H:%M"
                    )
                    if emp.UpdatedDate
                    else None

            })

      
        # RESPONSE

        return jsonify({

            "success": True,

            "page": page,

            "per_page": per_page,

            "total_records": employees.total,

            "total_pages": employees.pages,

            "employees": result

        }), 200

    except Exception as e:

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500

#Search Employee
@app.route("/employees/<int:emp_id>", methods=["GET"])
@admin_required()
def get_employee(emp_id):

    try:

    # Search employee by ID
        employee = Employee.query.filter_by(Emp_ID=emp_id,IsDeleted="False").first()

        # Check if employee exists
        if employee is None:
            return jsonify({
                "success": False,
                "message": "Employee Not Found"
            }), 404

        
        # Convert Employee object to dictionary
        emp_data = {
            "Emp_ID": employee.Emp_ID,
            "Profile_Image": employee.Profile_Image,
            "Emp_Name": employee.Emp_Name,
            "Email": employee.Email,
            "Phone_No": employee.Phone_No,
            "Address": employee.Address,
            "Department": employee.department.Dept_Name if employee.department else None,
            "Designation": employee.Designation,
            "City": employee.City,
            "Salary": float(employee.Salary)if employee.Salary is not None else 0,
            "Hire_Date": employee.Hire_Date.strftime("%Y-%m-%d") if employee.Hire_Date else " ",
            "Role": employee.role.Role_Name if employee.role else None ,
            "Employment_Status": employee.Employment_Status
            }

        return jsonify({ "success": True, "employee": emp_data}), 200
    
    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500



#Update Employee
@app.route("/employees/<int:emp_id>", methods=["PUT"])
@admin_required()
def update_employee(emp_id):

    try:

        # Search employee
        employee = Employee.query.filter_by( Emp_ID=emp_id, IsDeleted="False").first()

        if employee is None:
            return jsonify({
                "success": False,
                "message": "Employee Not Found"
            }), 404

        # Read form data
        print(request.form)
        data = update_schema.load(request.form)
                 
        # ================= Check Email =================

        if data.get("Email"):
            existing = Employee.query.filter_by(
                Email=data["Email"]
            ).first()

            if existing and existing.Emp_ID != emp_id:

                return jsonify({
                    "success": False,
                    "message": "Email already exists"
                }), 409

            employee.Email = data["Email"]

        #  Update Fields

        employee.Emp_Name = data.get("Emp_Name",employee.Emp_Name.strip())

        employee.Designation = data.get( "Designation", employee.Designation.strip() )

        if data.get("Salary")is not None:
            employee.Salary = data["Salary"]

        employee.Employment_Status = data.get( "Employment_Status", employee.Employment_Status)


        if data.get("Hire_Date") is not None:

            employee.Hire_Date =  data["Hire_Date"]
              

        if data.get("Password"):

            employee.Password = generate_password_hash(data["Password"] )

        if data.get("Dept_ID") is not None:

            department = db.session.get( Department,  int(data["Dept_ID"]) )

            if not department:

                return jsonify({
                    "success": False,
                    "message": "Department not found"
                }), 404

            employee.Dept_ID = department.Dept_ID

        #  Role

        if data.get("Role"):
            
            role = Role.query.filter_by( Role_Name=data["Role"] ).first()

            if role is None:

                return jsonify({
                    "success": False,
                    "message": "Role not found"
                }), 404

            employee.Role_ID = role.Role_ID

        set_updated_audit(employee)

        create_activity_log(
            action="UPDATE",
            module="Employee",
            description=f"Employee '{employee.Emp_Name}' updated",
            emp_id=employee.Emp_ID,
            role_id=employee.Role_ID
       )
        db.session.commit()

        return jsonify({

            "success": True,

            "message": "Employee Updated Successfully",

            "employee": {

                "Emp_ID": employee.Emp_ID,
                "Emp_Name": employee.Emp_Name,
                "Email": employee.Email,
                "Designation": employee.Designation ,
                "Department": employee.department.Dept_Name if employee.department else None,
                "Salary": float(employee.Salary),
                "Hire_Date": employee.Hire_Date.strftime("%Y-%m-%d") if employee.Hire_Date else None,
                "Role": employee.role.Role_Name if employee.role else None,
                "Employment_Status": employee.Employment_Status,
                

            }

        }), 200

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
    
# Delete Employee 
@app.route("/employees/<int:emp_id>", methods=["DELETE"])
@admin_required()
def delete_employee(emp_id):

    try:

        # Search employee by ID
        employee = Employee.query.filter_by( Emp_ID=emp_id, IsDeleted="False").first()

        # Check employee exists or not
        if employee is None:
            return jsonify({
                "success": False,
                "message": "Employee Not Found"
            }), 404

        # Delete employee
        employee.IsDeleted = "True"
        employee.Employment_Status = "Inactive"


        # Save changes in database
        set_updated_audit(employee)

        create_activity_log(
            action="DELETE",
            module="Employee",
            description=f"Employee '{employee.Emp_Name}' deleted",
            emp_id=employee.Emp_ID,
            role_id=employee.Role_ID
        )

        
        db.session.commit()

        # Return response
        return jsonify({
            "success": True,
            "message": "Employee Inactivated Successfully",
            "IsDeleted": employee.IsDeleted
        }), 200
    except Exception as e:

        db.session.rollback()

        return jsonify({
            "success":False,
            "message":str(e)
        }),500


# ---------------- GET ADMIN ROLE ----------------

@app.route("/role/admin", methods=["GET"])
def get_admin_role():

    try:

        role = Role.query.filter_by(
            Role_Name="Admin"
        ).first()

        if role is None:

            return jsonify({
                "success": False,
                "message": "Admin Role Not Found"
            }),404

        return jsonify({

            "success": True,

            "role":{

                "Role_ID":role.Role_ID,

                "Role_Name":role.Role_Name

            }

        }),200

    except Exception as e:

        return jsonify({

            "success":False,

            "message":str(e)

        }),500


# ---------------- GET EMPLOYEE ROLE ----------------

@app.route("/role/employee", methods=["GET"])
def get_employee_role():

    try:

        role = Role.query.filter_by( Role_Name="Employee").first()

        if role is None:

            return jsonify({
                "success": False,
                "message": "Employee Role Not Found"
            }),404

        return jsonify({

            "success": True,

            "role":{

                "Role_ID":role.Role_ID,

                "Role_Name":role.Role_Name

            }

        }),200

    except Exception as e:

        return jsonify({

            "success":False,

            "message":str(e)

        }),500
    

# ---------------- SIGN UP (FIRST ADMIN CREATION) ----------------

@app.route("/signup", methods=["POST"])
def signup():

    try:

        # Validate Admin signup data
        data = admin_signup_schema.load(request.form)


        # Default Profile Image
        filename = "default.png"


        image = request.files.get("Profile_Image")


        if image and image.filename:

            filename = (str(uuid.uuid4()) + "_" + secure_filename(image.filename)
                        )
            upload_path = os.path.join("static","uploads" )

            os.makedirs( upload_path, exist_ok=True )

            image.save(
                os.path.join(
                    upload_path,
                    filename
                )
            )



        # Check Admin Role exists

        admin_role = Role.query.filter_by( Role_Name="Admin").first()


        if admin_role is None:

            return jsonify({

                "success": False,
                "message": "Admin role not configured"

            }),500



        # Check Admin already exists

        admin = Employee.query.filter_by( Role_ID=admin_role.Role_ID).first()


        if admin:

            return jsonify({

                "success": False,
                "message": "Admin already exists. Please login."

            }),400



        # Check email already exists

        employee = Employee.query.filter_by(  Email=data["Email"] ).first()


        if employee:

            return jsonify({

                "success": False,
                "message": "Email already exists"

            }),409

        # Hash Password

        hashed_password = generate_password_hash( data["Password"] )

        # Create Admin

        new_admin = Employee(

            Profile_Image=filename,

            Emp_Name=data["Emp_Name"],

            Email=data["Email"],

            Password=hashed_password,

            Phone_No=data["Phone_No"],

            Address=data["Address"],

            City=data["City"],


            # Fixed values for Admin
            Designation="System Administrator",

            Dept_ID=None,

            Salary=0,

            Hire_Date=date.today(),

            Role_ID=admin_role.Role_ID,

            Employment_Status="Active",

            IsDeleted="False",

            CreatedBy = None,
            CreatedDate = datetime.now(IST),
            UpdatedBy = None,
            UpdatedDate = None

        )

        db.session.add(new_admin)
   
        # SAVE EMPLOYEE FIRST

        db.session.flush()

        # CREATE REGISTRATION ACTIVITY LOG

        create_activity_log(

            action="REGISTER",

            module="AUTH",

            description=f"Admin {new_admin.Emp_Name} registered",

            emp_id=new_admin.Emp_ID,

            role_id=new_admin.Role_ID

        )
        
        # COMMIT ADMIN + ACTIVITY LOG

        db.session.commit()

        return jsonify({

            "success": True,

            "message": "Admin account created successfully"

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

# ---------------- LOGIN ----------------

@app.route("/login", methods=["POST"])
def login():

    try:

        data = login_schema.load(request.get_json())

        employee = Employee.query.filter_by(
            Email=data["Email"],
            IsDeleted="False"
        ).first()

        if employee is None:

            return jsonify({
                "success": False,
                "message": "Invalid Email"
            }), 401

        if not check_password_hash(
            employee.Password,
            data["Password"]
        ):

            return jsonify({
                "success": False,
                "message": "Invalid Password"
            }), 401

        if employee.Employment_Status != "Active":

            return jsonify({
                "success": False,
                "message": "Account Inactive"
            }), 403

        if not employee.role:
            return jsonify({
                "success": False,
                "message": "Employee role not configured"
            }), 500


        role = employee.role.Role_Name

        # Create Access Token
        access_token = create_access_token(

            identity=str(employee.Emp_ID),

            additional_claims={
                "role": role
            }

        )

        # Create Refresh Token
        refresh_token = create_refresh_token( identity=str(employee.Emp_ID) )

        # Dashboard according to role
        if role == "Admin":

            dashboard = "/dashboard"

        else:

            dashboard = "/employee-dashboard"
            
         
        # ACTIVITY LOG

        create_activity_log(

            action="LOGIN",

            module="AUTH",

            description=f"{employee.Emp_Name} logged in",

            emp_id=employee.Emp_ID,

            role_id=employee.Role_ID

        )

        # SAVE ACTIVITY LOG
        
        db.session.commit()

        # Response
        response = jsonify({

            "success": True,

            "message": "Login Successful",

            "dashboard": dashboard,

            "employee": {

                "Emp_ID": employee.Emp_ID,

                "Emp_Name": employee.Emp_Name,

                "Role": role

            }

        })

        # Store JWT in HttpOnly Cookies
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)

        return response, 200

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

    

# ------------- LOGOUT -------------

@app.route("/logout", methods=["POST"])
@jwt_required()
def logout():

    try:

        # GET LOGGED-IN EMPLOYEE

        emp_id = get_jwt_identity()

        employee = Employee.query.filter_by( Emp_ID=int(emp_id), IsDeleted="False").first()

        if employee is None:

            return jsonify({
                "success": False,
                "message": "Employee not found"
            }), 404


        # CREATE ACTIVITY LOG

        create_activity_log(
            action="LOGOUT",
            module="AUTH",
            description=f"{employee.Emp_Name} logged out",
            emp_id=employee.Emp_ID,
            role_id=employee.Role_ID
        )


        # BLACKLIST ACCESS TOKEN

        access_jti = get_jwt()["jti"]

        BLACKLIST.add(access_jti)


        # GET REFRESH TOKEN

        refresh_token = request.cookies.get( "refresh_token_cookie" )


        # BLACKLIST REFRESH TOKEN

        if refresh_token:

            try:

                refresh_data = decode_token(refresh_token)

                refresh_jti = refresh_data["jti"]

                BLACKLIST.add(refresh_jti)

            except Exception:

                pass


        # SAVE ACTIVITY LOG

        db.session.commit()


        # REMOVE JWT COOKIES

        response = jsonify({

            "success": True,

            "message": "Logout Successful"

        })

        unset_jwt_cookies(response)

        return response, 200


    except Exception as e:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500
    
# ---------------- sign up ,Login UI----------------

@app.route("/signup-page")
def signup_Page():
    admin_role = Role.query.filter_by(
        Role_Name="Admin"
    ).first()

    if admin_role:

        admin = Employee.query.filter_by(
            Role_ID=admin_role.Role_ID
        ).first()

        if admin:

            return render_template("login.html")

    return render_template("signup.html")
    

@app.route("/login-page")
def login_page():
    return render_template("login.html")

#---------dashboard------
@app.route("/dashboard")
@admin_required()
def dashboard():

        return render_template(
                "dashboard.html",
                active_page="dashboard"
            )


# ---------------- DASHBOARD API ----------------

@app.route("/api/dashboard", methods=["GET"])
@admin_required()
def dashboard_data():

    try:

        # GET EMPLOYEE ROLE

        employee_role = Role.query.filter_by( Role_Name="Employee" ).first()

        if employee_role is None:

            return jsonify({
                "success": False,
                "message": "Employee role not configured"
            }), 500

        employee_role_id = employee_role.Role_ID

        # Total Employees
        total_employees = Employee.query.filter(
            Employee.Role_ID == employee_role_id,
            Employee.IsDeleted == "False"
        ).count()

        # Active Employees
        active_employees = Employee.query.filter(
            Employee.Role_ID == employee_role_id,
            Employee.IsDeleted == "False",
            Employee.Employment_Status == "Active"
        ).count()

        # Employees Joined This Month
        current_month = datetime.now().month
        current_year = datetime.now().year

        joined_this_month = Employee.query.filter(
            func.month(Employee.Hire_Date) == current_month,
            func.year(Employee.Hire_Date) == current_year,Employee.IsDeleted == "False"
        ).count()

        # Department Count
        departments = db.session.query(
                Department.Dept_Name,
                func.count(Employee.Emp_ID)
            ).join(
                Employee,
                Employee.Dept_ID == Department.Dept_ID
            ).filter(
            Employee.Role_ID == employee_role_id,
            Employee.IsDeleted == "False"
            ).group_by(
                Department.Dept_Name
            ).all()


        department_data = {}

        for dept, count in departments:
            department_data[dept] = count
        print(department_data)

        # Employee Growth
        period = request.args.get("period", "month")

        if period == "year":

            employee_growth = db.session.query(
                func.year(Employee.Hire_Date),
                func.count(Employee.Emp_ID)
            ).filter(
                Employee.Role_ID == employee_role_id,
                Employee.IsDeleted == "False"
            ).group_by(
                func.year(Employee.Hire_Date)
            ).order_by(
                func.year(Employee.Hire_Date)
            ).all()

        else:

            employee_growth = db.session.query(
                func.date_format(Employee.Hire_Date, "%Y-%m"),
                func.count(Employee.Emp_ID)
            ).filter(
                Employee.Role_ID == employee_role_id,
                Employee.IsDeleted == "False"
            ).group_by(
                func.date_format(Employee.Hire_Date, "%Y-%m")
            ).order_by(
                func.date_format(Employee.Hire_Date, "%Y-%m")
            ).all()

        growth_labels = []
        growth_values = []

        for label, count in employee_growth:
            growth_labels.append(str(label))
            growth_values.append(count)

        # Employee Table
        employees = Employee.query.filter( Employee.Role_ID == employee_role_id, Employee.IsDeleted == "False"
        ).order_by( Employee.Emp_ID.desc() ).all()

        employee_list = []

        for emp in employees:

            # CREATED BY

            created_by_name = None
            created_by_role = None

            if emp.CreatedBy:

                creator = db.session.get( Employee, emp.CreatedBy )

                if creator:

                    created_by_name = creator.Emp_Name

                    if creator.role:
                        created_by_role = creator.role.Role_Name


           
            # UPDATED BY
              
            updated_by_name = None
            updated_by_role = None

            if emp.UpdatedBy:

                updater = db.session.get( Employee, emp.UpdatedBy )

                if updater:

                    updated_by_name = updater.Emp_Name

                    if updater.role:
                        updated_by_role = updater.role.Role_Name


            # EMPLOYEE DATA
            
            employee_list.append({

                "Emp_ID": emp.Emp_ID,

                "Emp_Name": emp.Emp_Name,

                "Email": emp.Email,

                "Dept_ID": emp.Dept_ID,

                "Department":emp.department.Dept_Name
                    if emp.department
                    else None,

                "City": emp.City,

                "Salary": float(emp.Salary)
                    if emp.Salary is not None
                    else 0,

                "Hire_Date":   str(emp.Hire_Date)
                    if emp.Hire_Date
                    else None,


                 
                # AUDIT INFORMATION
                 
                "CreatedBy": created_by_name,

                "CreatedByRole": created_by_role,

                "CreatedDate": emp.CreatedDate.strftime("%d-%m-%Y %H:%M")
                    if emp.CreatedDate
                    else None,


                "UpdatedBy": updated_by_name,

                "UpdatedByRole": updated_by_role,

                "UpdatedDate":  emp.UpdatedDate.strftime("%d-%m-%Y %H:%M")
                    if emp.UpdatedDate
                    else None

            })     

            

        return jsonify({

            "success": True,
            "total_employees": total_employees,
            "active_employees": active_employees,
            "joined_this_month": joined_this_month,
            "department_count": len(department_data),
            "departments": department_data,
            "employees": employee_list,
            "growth_labels": growth_labels,
            "growth_values": growth_values

        }), 200

    except Exception as e:

        return jsonify({

            "success": False,
            "message": str(e)

        }), 500
      
@app.route("/employees-page")
@admin_required()
def employees_page():
    
    return render_template("employee.html",active_page="employees")


@app.route("/employee-dashboard")
@employee_required()
def employee_dashboard():

    employee = db.session.get(Employee, int(get_jwt_identity()))

    return render_template(
        "employee_dashboard.html",
        active_page="dashboard",employee=employee

    )


# ---------------- EMPLOYEE DASHBOARD API ----------------

@app.route("/api/employee-dashboard", methods=["GET"])
@employee_required()
def employee_dashboard_api():

    try:

        # Logged in employee ID

        employee = Employee.query.filter_by(Emp_ID=int(get_jwt_identity()),IsDeleted="False",Employment_Status="Active").first()

        if employee is None:

            return jsonify({
                "success": False,
                "message": "Employee not found"
            }), 404

        # Role check
        if employee.role.Role_Name != "Employee":

            return jsonify({
                "success": False,
                "message": "Access Denied"
            }), 403

        return jsonify({

            "success": True,

            "employee": {

                "Emp_ID": employee.Emp_ID,
                "Profile_Image": employee.Profile_Image,
                "Emp_Name": employee.Emp_Name,
                "Email": employee.Email,
                "Phone_No": employee.Phone_No,
                "Address": employee.Address,
                "City": employee.City,
                "Department": employee.department.Dept_Name if employee.department else "",
                "Designation": employee.Designation,
                "Salary": float(employee.Salary),
                "Hire_Date": employee.Hire_Date.strftime("%Y-%m-%d") if employee.Hire_Date else "",
                "Role": employee.role.Role_Name,
                "Employment_Status": employee.Employment_Status

            }

        }), 200

    except Exception as e:

        return jsonify({

            "success": False,
            "message": str(e)

        }), 500
    
# ---------------- ADD DEPARTMENT ----------------

@app.route("/departments", methods=["POST"])
@admin_required()
def add_department():

    try:

        data = request.get_json()

        department = Department.query.filter_by(
            Dept_Name=data["Dept_Name"]
        ).first()

        if department:

            return jsonify({

                "success": False,

                "message": "Department already exists"

            }),409

        new_department = Department(

            Dept_Name=data["Dept_Name"],
            Description=data["Description"],
            IsDeleted="False",
           

        )

        set_created_audit(new_department)
       
        db.session.add(new_department)

        db.session.flush()

        create_activity_log(
            action="CREATE",
            module="Department",
            description=f"Department '{new_department.Dept_Name}' created"
        )

        db.session.commit()

        return jsonify({

            "success": True,

            "message": "Department Added Successfully"

        }),201

    except Exception as e:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message": str(e)

        }),500

# ---------------- GET ALL DEPARTMENTS ----------------

@app.route("/departments", methods=["GET"])
@admin_required()
def get_departments():

    try:

        query = Department.query.filter_by(  IsDeleted="False" )


        # Search
        search = request.args.get("search")

        if search:
            query = query.filter(
                Department.Dept_Name.ilike(f"%{search}%")
            )

        page = request.args.get("page", type=int)
        per_page = request.args.get("per_page", type=int)

        result = []

        # Department Table 

        if page and per_page:

            departments = query.order_by(
                Department.Dept_ID
            ).paginate(
                page=page,
                per_page=per_page,
                error_out=False
            )

            for dept in departments.items:

                total_employees = Employee.query.filter_by(
                    Dept_ID=dept.Dept_ID,
                    IsDeleted="False"
                ).count()

                result.append({
                    "Dept_ID": dept.Dept_ID,
                    "Dept_Name": dept.Dept_Name,
                    "Description": dept.Description,
                    "Total_Employees": total_employees
                })

            return jsonify({
                "success": True,
                "page": page,
                "per_page": per_page,
                "total_records": departments.total,
                "total_pages": departments.pages,
                "departments": result
            }), 200

        # Dropdown 

        departments = query.order_by(Department.Dept_Name).all()

        for dept in departments:

            result.append({
                "Dept_ID": dept.Dept_ID,
                "Dept_Name": dept.Dept_Name,
                "Description": dept.Description,
                "Total_Employees": Employee.query.filter_by(Dept_ID=dept.Dept_ID,IsDeleted="False").count()})
        

        return jsonify({
            "success": True,
            "departments": result
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    
# ---------------- GET DEPARTMENT ----------------

@app.route("/departments/<int:dept_id>", methods=["GET"])
@admin_required()
def get_department(dept_id):

    try:

        department = Department.query.filter_by( Dept_ID=dept_id, IsDeleted="False").first()

        if department is None:

            return jsonify({

                "success": False,

                "message": "Department Not Found"

            }),404

        return jsonify({

            "success": True,

            "department":{

                "Dept_ID": department.Dept_ID,

                "Dept_Name": department.Dept_Name,

                "Description": department.Description,

                "Total_Employees": Employee.query.filter_by(
                    Dept_ID=department.Dept_ID,
                    IsDeleted="False"
                ).count()

            }

        }),200

    except Exception as e:

        return jsonify({

            "success": False,

            "message": str(e)

        }),500
    

 # ---------------- UPDATE DEPARTMENT ----------------

@app.route("/departments/<int:dept_id>", methods=["PUT"])
@admin_required()
def update_department(dept_id):

    try:

        department = Department.query.filter_by( Dept_ID=dept_id, IsDeleted="False").first()

        if department is None:

            return jsonify({

                "success": False,

                "message": "Department Not Found"

            }),404

        data = request.get_json()

        existing = Department.query.filter_by(Dept_Name=data["Dept_Name"], IsDeleted="False" ).first()

        if existing and existing.Dept_ID != dept_id:

            return jsonify({

                "success": False,

                "message": "Department already exists"

            }),409

        department.Dept_Name = data["Dept_Name"]

        department.Description = data["Description"]

        set_updated_audit(department)

        create_activity_log(
            action="UPDATE",
            module="Department",
            description=f"Department '{department.Dept_Name}' updated"
        )

        db.session.commit()

        return jsonify({

            "success": True,

            "message": "Department Updated Successfully"

        }),200

    except Exception as e:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message": str(e)

        }),500


# ---------------- DELETE DEPARTMENT ----------------

@app.route("/departments/<int:dept_id>", methods=["DELETE"])
@admin_required()
def delete_department(dept_id):

    try:

    
        # FIND ACTIVE DEPARTMENT

        department = Department.query.filter_by(  Dept_ID=dept_id,IsDeleted="False" ).first()

        if department is None:

            return jsonify({

                "success": False,

                "message": "Department Not Found"

            }), 404

        # CHECK ACTIVE EMPLOYEES

        active_employees = Employee.query.filter_by( Dept_ID=dept_id, IsDeleted="False" ).count()

        if active_employees > 0:

            return jsonify({

                "success": False,

                "message": "Department cannot be deleted because employees are assigned."

            }), 400


        # SOFT DELETE

        department.IsDeleted = "True"

        set_updated_audit(department)

        create_activity_log(
            action="DELETE",
            module="Department",
            description=f"Department '{department.Dept_Name}' deleted"
        )


        db.session.commit()


        return jsonify({

            "success": True,

            "message": "Department Deleted Successfully",
            "IsDeleted": department.IsDeleted

        }), 200


    except Exception as e:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500

# ---------------- DEPARTMENT PAGE ----------------

@app.route("/departments-page")
@admin_required()
def departments_page():

    return render_template(
        "department.html",
        active_page="departments"
    )

  
#------------------ EMPLOYEE PROFILE PAGE------------------

@app.route("/employee-profile")
@employee_required()
def employee_profile_page():

    employee = db.session.get(Employee, int(get_jwt_identity()))

    return render_template("employee_profile.html", active_page="profile",employee=employee )

  
#--------------------- EMPLOYEE EDIT PROFILE PAGE----------------
  
@app.route("/employee-edit-profile")
@employee_required()
def employee_edit_profile_page():
    
    employee = db.session.get(Employee, int(get_jwt_identity()))

    return render_template( "employee_edit_profile.html", active_page="profile",employee=employee )

  
# ----------------------GET EMPLOYEE PROFILE-----------------------

@app.route("/employee/profile", methods=["GET"])
@employee_required()
def employee_profile():

    try:

        emp_id = get_jwt_identity()

        employee = Employee.query.filter_by(Emp_ID=int(emp_id),IsDeleted="False").first()

        if employee is None:

            return jsonify({

                "success": False,

                "message": "Employee Not Found"

            }), 404

        return jsonify({

            "success": True,

            "employee": {

                "Emp_ID": employee.Emp_ID,

                "Emp_Name": employee.Emp_Name,

                "Email": employee.Email,

                "Phone_No": employee.Phone_No,

                "City": employee.City,

                "Address": employee.Address,

                "Profile_Image": employee.Profile_Image,

                "Department":employee.department.Dept_Name
                if employee.department else "",

                "Designation":employee.Designation,

                "Hire_Date": employee.Hire_Date.strftime("%Y-%m-%d")
                if employee.Hire_Date else "",

                "Employment_Status":  employee.Employment_Status

            }

        }), 200

    except Exception as e:

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500
    

  
# -------------------UPDATE EMPLOYEE PROFILE-------------------
  
@app.route("/employee/profile", methods=["PUT"])
@employee_required()
def update_employee_profile():

    try:

        emp_id = get_jwt_identity()

        employee = Employee.query.filter_by(Emp_ID=int(emp_id),IsDeleted="False",Employment_Status="Active").first()

        if employee is None:

            return jsonify({

                "success": False,

                "message": "Employee Not Found"

            }), 404

        employee.Phone_No = request.form.get( "Phone_No",employee.Phone_No  )

        employee.City = request.form.get("City",employee.City)

        employee.Address = request.form.get( "Address", employee.Address )

        image = request.files.get("Profile_Image")

        if image:
            print("IMAGE NAME:", image.filename)

        if image and image.filename:

            upload_folder = os.path.join(app.root_path, "static", "uploads" )

            os.makedirs(upload_folder, exist_ok=True)

            extension = os.path.splitext(image.filename)[1]

            filename = f"{uuid.uuid4().hex}{extension}"

            image.save(os.path.join(upload_folder, filename) )
                        

            if (
                employee.Profile_Image and employee.Profile_Image != "default.png"
            ):

                old_image = os.path.join(upload_folder,employee.Profile_Image  )

                if os.path.exists(old_image):

                    os.remove(old_image)

            employee.Profile_Image = filename
            
        set_updated_audit(employee)

        create_activity_log(
            action="UPDATE",
            module="Employee Profile",
            description=f"'{employee.Emp_Name} updated profile'",
            emp_id=employee.Emp_ID,
            role_id=employee.Role_ID
       )
        db.session.commit()

        return jsonify({

            "success": True,

            "message": "Profile Updated Successfully",

            "employee": {

                "Emp_ID": employee.Emp_ID,

                "Emp_Name": employee.Emp_Name,

                "Email": employee.Email,

                "Phone_No": employee.Phone_No,

                "City": employee.City,

                "Address": employee.Address,

                "Profile_Image": employee.Profile_Image,

                "Department": employee.department.Dept_Name
                if employee.department else "",

                "Designation": employee.Designation,

                "Hire_Date": employee.Hire_Date.strftime("%Y-%m-%d")
                if employee.Hire_Date else "",

                "Employment_Status": employee.Employment_Status

            }

        }), 200

    except Exception as e:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500



  
#--------------------- CHANGE EMPLOYEE PASSWORD----------------------

@app.route("/employee/change-password", methods=["PUT"])
@employee_required()
def change_employee_password():

    try:

        # GET LOGGED-IN EMPLOYEE
        
        emp_id = get_jwt_identity()

        employee = Employee.query.filter_by(
            Emp_ID=int(emp_id),
            IsDeleted="False",
            Employment_Status="Active"
        ).first()


        if employee is None:

            return jsonify({
                "success": False,
                "message": "Employee Not Found"
            }), 404


       
        # REQUEST DATA
        

        data = request.get_json()

        if not data:

            return jsonify({
                "success": False,
                "message": "Request data is required."
            }), 400


        current_password = data.get("Current_Password")
        new_password = data.get("New_Password")
        confirm_password = data.get("Confirm_Password")

        
        # REQUIRED FIELDS
       
        if not current_password:

            return jsonify({
                "success": False,
                "message": "Current password is required."
            }), 400


        if not new_password:

            return jsonify({
                "success": False,
                "message": "New password is required."
            }), 400


        if not confirm_password:

            return jsonify({
                "success": False,
                "message": "Confirm password is required."
            }), 400


        
        # CURRENT PASSWORD

        if not check_password_hash(
            employee.Password,
            current_password
        ):

            return jsonify({
                "success": False,
                "message": "Current Password is incorrect."
            }), 400


        # PASSWORD LENGTH

        if len(new_password) < 8:

            return jsonify({
                "success": False,
                "message": "Password must be at least 8 characters."
            }), 400


        # PASSWORD MATCH

        if new_password != confirm_password:

            return jsonify({
                "success": False,
                "message": "New Password and Confirm Password do not match."
            }), 400


       
        # SAME PASSWORD

        if check_password_hash(
            employee.Password,
            new_password
        ):

            return jsonify({
                "success": False,
                "message": "New Password cannot be the same as Current Password."
            }), 400

        # UPDATE PASSWORD

        employee.Password = generate_password_hash( new_password)

        password_changed = True

        set_updated_audit(employee)

        if password_changed:

            create_activity_log(
                action="PASSWORD_CHANGE",
                module="Password",
                description=f"Password changed for employee '{employee.Emp_Name}'",
                emp_id=employee.Emp_ID,
                role_id=employee.Role_ID
            )

        db.session.commit()

        return jsonify({

            "success": True,

            "message": "Password Changed Successfully."

        }), 200


    except Exception as e:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500

  
# ------------------CHANGE PASSWORD PAGE---------------------
  

@app.route("/employee-change-password")
@employee_required()
def employee_change_password():

    return render_template( "employee_change_password.html", active_page="password" )

@app.route("/forgot-password", methods=["POST"])
def forgot_password():

    try:

        data = forgot_password_schema.load(request.json)

        employee = Employee.query.filter_by(
            Email=data["Email"],
            IsDeleted="False",
            Employment_Status="Active"
        ).first()

        if employee is None:

            return jsonify({

                "success": False,

                "message": "Email not found."

            }), 404

        PasswordResetOTP.query.filter_by(
            Email=data["Email"]
        ).delete()

        otp = str(random.randint(100000, 999999))

        expiry = datetime.now(IST) .replace(tzinfo=None)+ timedelta(minutes=10)

        otp_record = PasswordResetOTP(

            Email=data["Email"],

            OTP=otp,

            Expiry_Time=expiry

        )

        db.session.add(otp_record)

        message = Message(

            subject="Employee Management System - Password Reset OTP",

            recipients=[employee.Email]

        )

        message.body = f"""
Hello {employee.Emp_Name},

Your OTP is:{otp}

Valid for 10 minutes.

Regards,
Employee Management System
"""

        mail.send(message)

        db.session.commit()

        return jsonify({

            "success": True,

            "message": "OTP sent successfully."

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
    

@app.route("/verify-otp", methods=["POST"])
def verify_otp():

    try:

        data = verify_otp_schema.load(request.json)

        otp_record = PasswordResetOTP.query.filter_by(

            Email=data["Email"],

            OTP=data["OTP"],

            Verified=False

        ).first()

        if otp_record is None:

            return jsonify({

                "success": False,

                "message": "Invalid OTP."

            }), 400

        if datetime.now(IST).replace(tzinfo=None) > otp_record.Expiry_Time:

            db.session.delete(otp_record)

            db.session.commit()

            return jsonify({

                "success": False,

                "message": "OTP expired."

            }), 400

        reset_token = secrets.token_urlsafe(32)

        otp_record.Verified = True

        otp_record.Reset_Token = reset_token

        db.session.commit()

        response = make_response(jsonify({

            "success": True,

            "message": "OTP verified successfully."

        }))

        response.set_cookie(

            "reset_token",

            reset_token,

            max_age=600,

            httponly=True,

            secure=False,      # True when using HTTPS

            samesite="Lax"

        )

        return response

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


@app.route("/reset-password", methods=["POST"])
def reset_password():

    try:

        data = reset_password_schema.load(request.json)

        if data["New_Password"] != data["Confirm_Password"]:

            return jsonify({

                "success": False,

                "message": "Passwords do not match."

            }), 400

        reset_token = request.cookies.get("reset_token")

        if not reset_token:

            return jsonify({

                "success": False,

                "message": "Reset token missing."

            }), 401

        otp_record = PasswordResetOTP.query.filter_by(

            Reset_Token=reset_token,

            Verified=True

        ).first()

        if otp_record is None:

            return jsonify({

                "success": False,

                "message": "Invalid reset token."

            }), 400

        if datetime.now(IST).replace(tzinfo=None) > otp_record.Expiry_Time:

            db.session.delete(otp_record)

            db.session.commit()

            return jsonify({

                "success": False,

                "message": "Reset token expired."

            }), 400

        employee = Employee.query.filter_by(

            Email=otp_record.Email

        ).first()

        if employee is None:

            return jsonify({

                "success": False,

                "message": "Employee not found."

            }), 404

        employee.Password = generate_password_hash(

            data["New_Password"]

        )

        # Password reset is performed through verified reset token,
        # not through a logged-in JWT user.
        employee.UpdatedBy = None
        employee.UpdatedDate = datetime.now(IST)

        create_activity_log(
        action="PASSWORD_RESET",
        module="Password",
        description=f"Password reset successfully for employee '{employee.Emp_Name}'",
        emp_id=employee.Emp_ID,
        role_id=employee.Role_ID
       )

        db.session.delete(otp_record)

        response = make_response(jsonify({

            "success": True,

            "message": "Password reset successfully."

        }))

        response.delete_cookie("reset_token")

        db.session.commit()

        return response

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

@app.route("/forgot-password-page")
def forgot_password_page():

    return render_template("forgot_password.html")

@app.route("/verify-otp-page")
def verify_otp_page():

    return render_template("verify_otp.html")

  
#-------------------- RESET PASSWORD PAGE----------------------

@app.route("/reset-password-page")
def reset_password_page():

    return render_template("reset_password.html")
    
  
#------------------ REFRESH ACCESS TOKEN------------------

@app.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():

    try:

        identity = get_jwt_identity()

        employee = Employee.query.filter_by(
            Emp_ID=int(identity),
            IsDeleted="False",
            Employment_Status="Active"
        ).first()


        if employee is None:

            return jsonify({

                "success": False,
                "message": "Employee not found or inactive."

            }), 404

        
        # ROLE

        role = employee.role.Role_Name if employee.role else None


        if not role:

            return jsonify({

                "success": False,
                "message": "Employee role not found."

            }), 500

        # CREATE NEW ACCESS TOKEN
        
        access_token = create_access_token(

            identity=str(employee.Emp_ID),

            additional_claims={
                "role": role
            }

        )

        # RESPONSE
        
        response = jsonify({

            "success": True,

            "message": "Token refreshed"

        })
        
        # STORE ACCESS TOKEN IN COOKIE

        set_access_cookies(
            response,
            access_token
        )

        return response, 200


    except Exception as e:

        return jsonify({

            "success": False,
            "message": str(e)

        }), 500


  
#---------------- GET ACTIVITY LOGS-----------------

@app.route("/activity-logs", methods=["GET"])
@admin_required()
def get_activity_logs():

    try:


       
        # FILTER PARAMETERS

        search = request.args.get( "search",   "" ).strip()

        action = request.args.get( "action",  "").strip()

        module = request.args.get( "module",   "" ).strip()

        emp_id = request.args.get( "emp_id",type=int  )


        # PAGINATION

        page = request.args.get( "page", 1, type=int )

        per_page = request.args.get( "per_page", 10, type=int )

        # Prevent invalid pagination values

        if page < 1:
            page = 1

        if per_page < 1:
            per_page = 10

        if per_page > 100:
            per_page = 100

        # BASE QUERY

        query = ActivityLog.query


        # SEARCH
        # Searches:
        # Employee Name
        # Action
        # Module
        # Description
        # IP Address
         
        if search:

            search_value = f"%{search}%"

            query = query.outerjoin(
                Employee,
                ActivityLog.Emp_ID == Employee.Emp_ID
            ).filter(

                or_(

                    Employee.Emp_Name.ilike(search_value),

                    ActivityLog.Action.ilike( search_value),

                    ActivityLog.Module.ilike( search_value),

                    ActivityLog.Description.ilike( search_value ),

                    ActivityLog.IP_Address.ilike( search_value )

                )

            )

        # ACTION FILTER
         
        if action:

            query = query.filter( ActivityLog.Action == action )

        # MODULE FILTER
         
        if module:

            query = query.filter(  ActivityLog.Module == module   )
  
        # EMPLOYEE FILTER
         
        if emp_id:

            query = query.filter(ActivityLog.Emp_ID == emp_id)
  
        # SORT
    
        query = query.order_by( ActivityLog.Created_Date.desc())


        # PAGINATION
        
        logs = query.paginate(page=page,per_page=per_page,error_out=False  )


        # RESPONSE DATA
         
        result = []

        for log in logs.items:

            employee_name = None

            role_name = None
  
            # EMPLOYEE
             
            if log.Emp_ID:

                employee = db.session.get( Employee, log.Emp_ID )

                if employee:

                    employee_name = employee.Emp_Name

            # ROLE
            
            if log.Role_ID:

                role = db.session.get(  Role, log.Role_ID  )

                if role:

                    role_name = role.Role_Name


            # LOG OBJECT
            
            result.append({

                "Log_ID": log.Log_ID,

                "Emp_ID": log.Emp_ID,

                "Employee_Name": employee_name,

                "Role_ID": log.Role_ID,

                "Role_Name": role_name,

                "Action": log.Action,

                "Module": log.Module,

                "Description": log.Description,

                "IP_Address": log.IP_Address,

                "Created_Date":log.Created_Date.strftime("%Y-%m-%d %H:%M:%S" )
                    if log.Created_Date
                    else None

            })


         
        # RESPONSE
         

        return jsonify({

            "success": True,

            "page": logs.page,

            "per_page": logs.per_page,

            "total_records": logs.total,

            "total_pages": logs.pages,

            "activity_logs": result

        }), 200


    except Exception as e:

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500


  
# --------------------ACTIVITY LOG PAGE-----------------------
  

@app.route("/activity-logs-page")
@admin_required()
def activity_logs_page():

    try:


        return render_template(

            "activity_logs.html",

            active_page="activity_logs"

        )


    except Exception as e:

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500


  
# EXPORT ACTIVITY LOGS TO CSV
  
@app.route("/activity-logs/export", methods=["GET"])
@admin_required()
def export_activity_logs():

    try:

         
        # FILTERS
         

        search = request.args.get("search",   "" ).strip()

        action = request.args.get( "action",  "" ).strip()

        module = request.args.get( "module",  "").strip()

        emp_id = request.args.get( "emp_id",  type=int )
         

        query = ActivityLog.query

         
        # SEARCH

        if search:
        
                    search_value = f"%{search}%"
        
                    query = query.outerjoin(
                        Employee,
                        ActivityLog.Emp_ID == Employee.Emp_ID
                    ).filter(
        
                        or_(
        
                            Employee.Emp_Name.ilike(search_value),
        
                            ActivityLog.Action.ilike( search_value),
        
                            ActivityLog.Module.ilike( search_value),
        
                            ActivityLog.Description.ilike( search_value ),
        
                            ActivityLog.IP_Address.ilike( search_value )
        
                        )
        
                    )

            

         
        # ACTION FILTER
         
        if action:

            query = query.filter(ActivityLog.Action == action )

         
        # MODULE FILTER
         
        if module:

            query = query.filter( ActivityLog.Module == module )

         
        # EMPLOYEE FILTER
         
        if emp_id:

            query = query.filter(  ActivityLog.Emp_ID == emp_id)
         
        # LATEST FIRST
         
        logs = query.order_by(ActivityLog.Created_Date.desc() ).all()

         
        # CREATE CSV
         
        output = StringIO()

        writer = csv.writer(output)

        # CSV HEADER

        writer.writerow([
            "Log_ID",
            "Emp_ID",
            "Employee_Name",
            "Role_ID",
            "Role_Name",
            "Action",
            "Module",
            "Description",
            "IP_Address",
            "Created_Date"
        ])

         
        # CSV DATA
         
        for log in logs:

            employee_name = ""

            if log.Emp_ID:

                employee = db.session.get(Employee,log.Emp_ID)

                if employee:

                    employee_name = employee.Emp_Name

            role_name = ""

            if log.Role_ID:

                role = db.session.get( Role, log.Role_ID)

                if role:

                    role_name = role.Role_Name

            writer.writerow([

                log.Log_ID,

                log.Emp_ID,

                employee_name,

                log.Role_ID,

                role_name,

                log.Action,

                log.Module,

                log.Description,

                log.IP_Address,

                log.Created_Date.strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
                if log.Created_Date
                else ""

            ])

         
        # RESPONSE
         
        output.seek(0)

        return Response(

            output.getvalue(),

            mimetype="text/csv",

            headers={
                "Content-Disposition":  "attachment; filename=activity_logs.csv"
            }

        )

    except Exception as e:

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500


app.run(debug=True)