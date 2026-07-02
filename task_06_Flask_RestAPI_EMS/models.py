from config import db
from sqlalchemy import Numeric

class Employee(db.Model):

    __tablename__="Employee"

    Emp_ID=db.Column(db.Integer, primary_key=True)
    Emp_Name=db.Column(db.String(100), nullable=False)
    Email= db.Column(db.String(100),unique=True, nullable=False)
    Department=db.Column(db.String(60), nullable=False)
    Salary= db.Column(db.Numeric(10,2),nullable=False)
    
