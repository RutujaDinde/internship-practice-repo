from marshmallow import Schema,fields,validate,validates_schema, ValidationError


class AdminSignupSchema(Schema):

    Emp_Name = fields.String(required=True)
    Email = fields.Email(required=True)
    Password = fields.String(required=True)

    Phone_No = fields.String(required=True)
    Address = fields.String(required=True)
    City = fields.String(required=True)

    Designation = fields.String(required=False)

class EmployeeSchema(Schema):

    Emp_ID = fields.Int(dump_only=True)
    Profile_Image = fields.String()
    Emp_Name=fields.String(required=True,validate=validate.Length(min=2,max=100))
    Email=fields.String(required=True)
    Password=fields.String(required=True,validate=validate.Length(min=8))
    Designation = fields.String(required=True, validate=validate.Length(min=2))
    Dept_ID = fields.Int(required=True)
    Salary = fields.Float(required=True,validate=validate.Range(min=1))
    Hire_Date = fields.Date(required=True)   
    Role_ID = fields.Int(dump_only=True)
    Employment_Status = fields.String()     

    Phone_No = fields.Str(load_default=None)
    City = fields.Str(load_default=None)
    Address = fields.Str(load_default=None)            
    

class LoginSchema(Schema):

    Email = fields.Email(required=True)
    Password = fields.String(required=True, validate=validate.Length(min=8))


class UpdateEmployeeSchema(Schema):

    Emp_ID = fields.Int(dump_only=True)
    Profile_Image = fields.String()
    Emp_Name = fields.String( validate=validate.Length(min=2, max=50))
    Email = fields.Email()
    Password = fields.String( validate=validate.Length(min=8) )
    Salary = fields.Float(allow_none=True,validate=validate.Range(min=1))
    Designation = fields.String(validate=validate.Length(min=2) )
    Dept_ID = fields.Int(allow_none=True,)
    Hire_Date = fields.Date()
    Role = fields.Str()
    Employment_Status = fields.String()

class UpdateEmployeeProfileSchema(Schema):
    Phone_No = fields.Str(required=True)
    City = fields.Str(required=True)
    Address = fields.Str(required=True)

class ChangePasswordSchema(Schema):
    Old_Password = fields.Str(required=True)
    New_Password = fields.Str(required=True ,validate=validate.Length(min=8))


class ForgotPasswordSchema(Schema):

    Email = fields.Email(required=True)


class VerifyOTPSchema(Schema):

    Email = fields.Email(required=True)

    OTP = fields.Str(required=True,validate=validate.Length(equal=6))


class ResetPasswordSchema(Schema):

    New_Password = fields.Str(  required=True,  validate=validate.Length(min=8))

    Confirm_Password = fields.Str(required=True,validate=validate.Length(min=8) )

    

    @validates_schema
    def validate_passwords(self, data, **kwargs):

            if data["New_Password"] != data["Confirm_Password"]:

                raise ValidationError({

                    "Confirm_Password": [
                        "Passwords do not match."
                    ]

                })