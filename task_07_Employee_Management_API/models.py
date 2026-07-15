from config import db

class Employee(db.Model):

    __tablename__ = "employees"

    Emp_ID = db.Column(db.Integer, primary_key=True,autoincrement=True)

    Emp_Name = db.Column(db.String(100), nullable=False)

    Email = db.Column(db.String(100), unique=True)

    Password = db.Column(db.String(255), nullable=False)

    Department = db.Column(db.String(100))

    City = db.Column(db.String(100))

    Salary = db.Column(db.Numeric(10, 2), nullable=False)

    Hire_Date = db.Column(db.Date)