from marshmallow import Schema,fields,validate

class EmployeeSchema(Schema):

    Emp_ID=fields.Integer(required=True,error_messages={"required": "Employee ID is required."})
    Emp_Name=fields.String(required=True,validate=validate.Length(min=2,max=50))
    Email=fields.String(required=True)
    Password=fields.String(required=True,validate=validate.Length(min=8))
    Department=fields.String(required=True,validate=validate.Length(min=2))
    City=fields.String(required=True,validate=validate.Length(min=2))
    Salary = fields.Float(required=True,validate=validate.Range(min=1))
    Hire_Date = fields.Date(required=True)                    
    

class LoginSchema(Schema):

    Email = fields.Email(required=True)
    Password = fields.String(required=True, validate=validate.Length(min=6))


class UpdateEmployeeSchema(Schema):

   
    Emp_Name = fields.String( validate=validate.Length(min=2, max=50))
    Email = fields.Email()
    Password = fields.String( validate=validate.Length(min=8) )
    Department = fields.String(validate=validate.Length(min=2))
    Salary = fields.Float(validate=validate.Range(min=1))
    City = fields.String(validate=validate.Length(min=2))
    Hire_Date = fields.Date()