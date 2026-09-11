from marshmallow import Schema, ValidationError,fields,validate, validates_schema

#------------------------Role Validation-------------------------

class RoleSchema(Schema):

    Role_ID = fields.Int(dump_only=True)

    Role_Name = fields.Str(required=True)

    Description = fields.Str(allow_none=True)

    Created_At = fields.DateTime(dump_only=True)


#------------------------User Validation-------------------------

class UserSchema(Schema):

    User_ID=fields.Int(dump_only=True)

    Name=fields.Str(required=True)
    
    Email=fields.Str(required=True)
    
    Password = fields.Str(required=True,load_only=True)
    
    Phone_No=fields.Str(allow_none=True)
    
    Status=fields.Str(dump_only=True)

    Role_ID = fields.Int( required=True )

    role = fields.Nested(
        RoleSchema,
        dump_only=True
    )


    Created_By = fields.Int(dump_only=True)

    Updated_By = fields.Int(dump_only=True)
    
    Created_At = fields.DateTime(dump_only=True)

    Updated_At = fields.DateTime(dump_only=True)


#------------------------Login Validation-------------------------

class LoginSchema(Schema):

    Email = fields.Email(required=True)

    Password = fields.Str(  required=True,  load_only=True )







#---------------------------Contract Types-----------------------------


class ContractTypeSchema(Schema):

    Contract_Type_ID = fields.Int(dump_only=True)

    Contract_Type_Name = fields.Str(  required=True,  validate=validate.Length(min=2, max=100) )

    Description = fields.Str( allow_none=True )

    Is_Active = fields.Bool(dump_only=True)

    Created_At = fields.DateTime( dump_only=True )


#----------------------------Contract Status---------------------------------


class ContractStatusSchema(Schema):

    Status_ID = fields.Int(dump_only=True  )

    Status_Name = fields.Str( dump_only=True )

    Description = fields.Str( dump_only=True, allow_none=True )

    Created_At = fields.DateTime( dump_only=True )




#------------------------Contract Validation-------------------------

class ContractSchema(Schema):

    Contract_ID = fields.Int(dump_only=True)
    
    Contract_Name =fields.Str(required=True)

    Contract_Type_ID = fields.Int(required=True)

    Contract_Type_Name= fields.Method(
        "get_contract_type",
        dump_only=True
    )

    Status_ID = fields.Int(dump_only=True)


    Status_Name = fields.Method(
        "get_status",
        dump_only=True
    )

    Description = fields.Str(allow_none=True)

    Party_A = fields.Str( required=True,
        validate=validate.Length(min=2, max=200)
    )

    Party_B = fields.Str( required=True,
        validate=validate.Length(min=2, max=200)
    )

    Effective_Date = fields.Date( required=True   )

    Expiry_Date = fields.Date( required=True)
    
    Created_By = fields.Int( dump_only=True)

    Updated_By = fields.Int( dump_only=True)

    Created_At = fields.DateTime( dump_only=True )

    Updated_At = fields.DateTime( dump_only=True )


    @validates_schema
    def validate_dates(self, data, **kwargs):

        effective_date = data.get("Effective_Date")
        expiry_date = data.get("Expiry_Date")

        if effective_date and expiry_date and expiry_date <= effective_date:
            raise ValidationError({
                "Expiry_Date": ["Expiry date must be after effective date."]
            })


    #--------------------Metods to get Contract Type and Status name-------------------

    def get_contract_type(self, obj):

        if obj.contract_type:
            return obj.contract_type.Contract_Type_Name

        return None


    def get_status(self, obj):

        if obj.status:
            return obj.status.Status_Name

        return None
#------------------------Contract User Assignment-------------------------

class ContractUserSchema(Schema):

    Contract_User_ID = fields.Int(dump_only=True)

    Contract_ID = fields.Int(required=True)

    User_ID = fields.Int(required=True)

    Assigned_By = fields.Int(dump_only=True)

    Assigned_At = fields.DateTime(dump_only=True)


contract_user_schema = ContractUserSchema()
contract_users_schema = ContractUserSchema(many=True)



#------------------------Document Validation-------------------------
class DocumentSchema(Schema):

    Document_ID = fields.Int(dump_only=True)

    Contract_ID = fields.Int(dump_only=True)

    Contract_Type_ID = fields.Method(
        "get_contract_type_id",
        dump_only=True
    )

    Contract_Name = fields.Method(
        "get_contract_name",
        dump_only=True
    )

    Contract_Type_Name = fields.Method(
        "get_contract_type",
        dump_only=True
    )

    Party_A = fields.Method(
        "get_party_a",
        dump_only=True
    )

    Party_B = fields.Method(
        "get_party_b",
        dump_only=True
    )

    Document_Name = fields.Str(dump_only=True)

    File_Path = fields.Str(dump_only=True)

    Document_Type = fields.Str(dump_only=True)

    Status = fields.Str(dump_only=True)

    Created_By = fields.Int(dump_only=True)

    Updated_By = fields.Int(dump_only=True)

    Created_At = fields.DateTime(dump_only=True)

    Updated_At = fields.DateTime(dump_only=True)


    def get_contract_type_id(self, obj):

        if obj.contract:

            return obj.contract.Contract_Type_ID

        return None


    def get_contract_name(self, obj):

        if obj.contract:

            return obj.contract.Contract_Name

        return None


    def get_contract_type(self, obj):

        if (
            obj.contract
            and obj.contract.contract_type
        ):

            return obj.contract.contract_type.Contract_Type_Name

        return None


    def get_party_a(self, obj):

        if obj.contract:

            return obj.contract.Party_A

        return None


    def get_party_b(self, obj):

        if obj.contract:

            return obj.contract.Party_B

        return None

class DocumentUpdateSchema(Schema):

    Document_Name = fields.Str(
        validate=validate.Length(min=2, max=200)
    )

    Status = fields.Str(
        validate=validate.OneOf([
            "Active",
            "Archived"
        ])
    )




#------------------------ContractVersion------------------------------


class ContractVersionSchema(Schema):

    Version_ID = fields.Int(
        dump_only=True
    )

    Contract_ID = fields.Int(
        required=True
    )

    Document_ID = fields.Int(
        required=True
    )

    # Version number is generated by backend
    Version_Number = fields.Int(
        dump_only=True
    )

    # File path comes from the selected document
    File_Path = fields.Str(
        dump_only=True
    )

    Change_Summary = fields.Str(
        allow_none=True
    )

    Created_By = fields.Int(
        dump_only=True
    )

    Created_At = fields.DateTime(
        dump_only=True
    )

    Is_Current = fields.Bool(
        dump_only=True
    )

from marshmallow import Schema, fields, validate


class ClauseCreateSchema(Schema):

    Contract_ID = fields.Int(
        required=True
    )

    Version_ID = fields.Int(
        required=True
    )

    Clause_Number = fields.Int(
        required=True,
        validate=validate.Range(min=1)
    )

    Clause_Title = fields.Str(
        required=True,
        validate=validate.Length(
            min=2,
            max=200
        )
    )

    Clause_Text = fields.Str(
        required=True,
        validate=validate.Length(
            min=1
        )
    )


class ClauseUpdateSchema(Schema):

    Clause_Number = fields.Int(
        validate=validate.Range(min=1)
    )

    Clause_Title = fields.Str(
        validate=validate.Length(
            min=2,
            max=200
        )
    )

    Clause_Text = fields.Str(
        validate=validate.Length(
            min=1
        )
    )


class ClauseSchema(Schema):

    Clause_ID = fields.Int(
        dump_only=True
    )

    Contract_ID = fields.Int(
        required=True
    )

    Version_ID = fields.Int(
        required=True
    )

    Clause_Number = fields.Int(
        required=True,
        validate=validate.Range(min=1)
    )

    Clause_Title = fields.Str(
        required=True,
        validate=validate.Length(
            min=2,
            max=200
        )
    )

    Clause_Text = fields.Str(
        required=True,
        validate=validate.Length(
            min=1
        )
    )

    Created_By = fields.Int(
        dump_only=True
    )

    Updated_By = fields.Int(
        allow_none=True,
        dump_only=True
    )

    Created_At = fields.DateTime(
        dump_only=True
    )

    Updated_At = fields.DateTime(
        allow_none=True,
        dump_only=True
    )

from marshmallow import Schema, fields, validate, validates_schema, ValidationError


class ModificationCreateSchema(Schema):

    Contract_ID = fields.Int(
        required=True
    )

    Clause_ID = fields.Int(
        allow_none=True,
        load_default=None
    )

    Version_ID = fields.Int(
        required=True
    )

    Modification_Type = fields.Str(
        required=True,
        validate=validate.OneOf(
            ["Contract", "Clause"]
        )
    )

    Old_Text = fields.Str(
        required=True,
        validate=validate.Length(min=1)
    )

    New_Text = fields.Str(
        required=True,
        validate=validate.Length(min=1)
    )

    Reason = fields.Str(
        allow_none=True,
        load_default=None,
        validate=validate.Length(max=2000)
    )

    @validates_schema
    def validate_modification(self, data, **kwargs):

        modification_type = data.get("Modification_Type")
        clause_id = data.get("Clause_ID")

        if modification_type == "Clause" and clause_id is None:
            raise ValidationError(
                "Clause_ID is required for Clause modification."
            )

        if modification_type == "Contract" and clause_id is not None:
            raise ValidationError(
                "Clause_ID must be empty for Contract modification."
            )

class ModificationReviewSchema(Schema):

    Status = fields.Str(
        required=True,
        validate=validate.OneOf(
            ["APPROVED", "REJECTED"]
        )
    )

    Review_Comment = fields.Str(
        allow_none=True,
        load_default=None,
        validate=validate.Length(max=2000)
    )

class ModificationSchema(Schema):

    Modification_ID = fields.Int(
        dump_only=True
    )

    Contract_ID = fields.Int(
        dump_only=True
    )

    Clause_ID = fields.Int(
        allow_none=True,
        dump_only=True
    )

    Version_ID = fields.Int(
        dump_only=True
    )

    Modification_Type = fields.Str(
        dump_only=True
    )

    Old_Text = fields.Str(
        dump_only=True
    )

    New_Text = fields.Str(
        dump_only=True
    )

    Reason = fields.Str(
        allow_none=True,
        dump_only=True
    )

    Status = fields.Str(
        dump_only=True
    )

    Modified_By = fields.Int(
        dump_only=True
    )

    Modified_At = fields.DateTime(
        dump_only=True
    )

    Reviewed_By = fields.Int(
        allow_none=True,
        dump_only=True
    )

    Reviewed_At = fields.DateTime(
        allow_none=True,
        dump_only=True
    )

    Review_Comment = fields.Str(
        allow_none=True,
        dump_only=True
    )