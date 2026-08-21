from config import db
from datetime import datetime
from audit import AuditMixin

from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")


class Employee(AuditMixin,db.Model):

    __tablename__ = "employees"

    Emp_ID = db.Column(db.Integer, primary_key=True,autoincrement=True)

    Profile_Image = db.Column( db.String(255), nullable=False, default="default.png")

    Emp_Name = db.Column(db.String(100), nullable=False)

    Email = db.Column(db.String(100), unique=True)

    Password = db.Column(db.String(255), nullable=False)

    Phone_No = db.Column(db.String(15))

    City = db.Column(db.String(100))

    Address = db.Column(db.String(255))   

    Designation = db.Column(db.String(100))

    Dept_ID = db.Column( db.Integer, db.ForeignKey("departments.Dept_ID"))

    Salary = db.Column(db.Numeric(10, 2), nullable=False)

    Hire_Date = db.Column(db.Date)

    Role_ID = db.Column(db.Integer,db.ForeignKey("roles.Role_ID"))

    Employment_Status = db.Column( db.String(20), default="Active")

    IsDeleted = db.Column( db.String(5), nullable=False, default="False")


# ================= Relationships =================

    department = db.relationship(
        "Department",
        foreign_keys=[Dept_ID],
        back_populates="employees"
    )

    role = db.relationship(
        "Role",
        foreign_keys=[Role_ID],
        back_populates="employees"
    )

    
class Department(AuditMixin,db.Model):

    __tablename__ = "departments"

    Dept_ID = db.Column( db.Integer, primary_key=True, autoincrement=True )

    Dept_Name = db.Column(  db.String(100),  unique=True,  nullable=False )

    Description = db.Column(db.String(255))

    IsDeleted = db.Column(
    db.String(5),
    nullable=False,
    default="False"
)

    # ================= Relationship =================

    employees = db.relationship(
        "Employee",
        foreign_keys="Employee.Dept_ID",
        back_populates="department"
    )


class Role(AuditMixin,db.Model):

    __tablename__ = "roles"

    Role_ID = db.Column( db.Integer, primary_key=True,autoincrement=True )

    Role_Name = db.Column(db.String(20),unique=True,nullable=False )

    # ================= Relationship =================

    employees = db.relationship(
        "Employee",
        foreign_keys="Employee.Role_ID",
        back_populates="role"
    )


from datetime import datetime

class PasswordResetOTP(db.Model):

    __tablename__ = "password_reset_otps"

    OTP_ID = db.Column(db.Integer,primary_key=True,autoincrement=True)

    Email = db.Column( db.String(100), nullable=False)

    OTP = db.Column(db.String(6),nullable=False)

    Expiry_Time = db.Column( db.DateTime, nullable=False)

    Verified = db.Column( db.Boolean, default=False, nullable=False)

    Created_At = db.Column( db.DateTime,default=datetime.utcnow,nullable=False)

    Reset_Token = db.Column(db.String(255),nullable=True)

# ==========================================================
# ACTIVITY LOG
# ==========================================================

class ActivityLog(db.Model):

    __tablename__ = "activity_logs"

    Log_ID = db.Column( db.Integer, primary_key=True, autoincrement=True)

    # Employee who performed the action
    Emp_ID = db.Column( db.Integer, db.ForeignKey("employees.Emp_ID"), nullable=True)

    # Role of employee at the time of action
    Role_ID = db.Column( db.Integer, db.ForeignKey("roles.Role_ID"), nullable=True)

    Action = db.Column( db.String(50),nullable=False)

    Module = db.Column( db.String(50),  nullable=False)

    Description = db.Column(db.String(255),nullable=True)

    IP_Address = db.Column(  db.String(45),  nullable=True )

    Created_Date = db.Column( db.DateTime, nullable=False)

    # ======================================================
    # RELATIONSHIPS
    # ======================================================

    employee = db.relationship( "Employee", foreign_keys=[Emp_ID])

    role = db.relationship(  "Role",  foreign_keys=[Role_ID] )