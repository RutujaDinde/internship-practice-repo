from datetime import datetime
from config import db

#-------------------------ROLE---------------------------------


class Role(db.Model):

    __tablename__="roles"

    Role_ID=db.Column(db.Integer, primary_key=True, autoincrement=True)

    Role_Name=db.Column(db.String(50),unique=True,nullable=False)

    Description=db.Column(db.String(255))

    Created_At = db.Column( db.DateTime, default=datetime.utcnow, nullable=False  )

    # Relationship with User

    users = db.relationship("User", back_populates="role")


#-------------------------USER---------------------------------


class User(db.Model):

    __tablename__="users"

    User_ID=db.Column(db.Integer, primary_key=True , autoincrement=True)

    Name=db.Column(db.String(100),nullable=False)

    Email=db.Column(db.String(100),unique=True,nullable=False)

    Password = db.Column( db.String(255), nullable=False )

    Phone_No=db.Column(db.String(20))

    Status=db.Column(db.String(20), default="Active",nullable=False)

    Role_ID = db.Column(  db.Integer,  db.ForeignKey("roles.Role_ID"),  nullable=False)

    Created_By = db.Column(db.Integer,db.ForeignKey("users.User_ID"),nullable=True  )

    Updated_By = db.Column(db.Integer,db.ForeignKey("users.User_ID"),nullable=True )

    Created_At = db.Column(  db.DateTime,  default=datetime.utcnow,  nullable=False)

    Updated_At = db.Column( db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow )

     # Self-referencing relationships

    created_by_user = db.relationship( "User", foreign_keys=[Created_By], remote_side=[User_ID])

    updated_by_user = db.relationship( "User", foreign_keys=[Updated_By], remote_side=[User_ID])


    # Relationship with Role
    role=db.relationship("Role",back_populates="users")

    # Relationship with Contract
    contracts = db.relationship( "Contract", back_populates="creator", foreign_keys="Contract.Created_By", lazy=True)

    assigned_contracts = db.relationship(
    "ContractUser",
    back_populates="user",
    foreign_keys="ContractUser.User_ID",
    cascade="all, delete-orphan"
)



#------------------------------- CONTRACT TYPE-----------------------------------

class ContractType(db.Model):

    __tablename__ = "contract_types"

    Contract_Type_ID = db.Column( db.Integer, primary_key=True, autoincrement=True)

    Contract_Type_Name = db.Column( db.String(100), unique=True, nullable=False )

    Description = db.Column( db.String(255) )

    Is_Active = db.Column(db.Boolean,default=True, nullable=False )

    Created_At = db.Column( db.DateTime, default=datetime.utcnow, nullable=False )

    contracts = db.relationship(  "Contract", back_populates="contract_type"  )



# -----------------------------CONTRACT STATUS-------------------------------

class ContractStatus(db.Model):

    __tablename__ = "contract_statuses"

    Status_ID = db.Column( db.Integer, primary_key=True, autoincrement=True)

    Status_Name = db.Column( db.String(50), unique=True, nullable=False)

    Description = db.Column(db.String(255),nullable=True)

    # Is_Active = db.Column( db.Boolean,default=True,nullable=False)

    Created_At = db.Column(  db.DateTime,  default=datetime.utcnow,  nullable=False )

    contracts = db.relationship( "Contract", back_populates="status" )




#-----------------------------CONTRACT-----------------------------------

class Contract(db.Model):

    __tablename__ = "contracts"

    Contract_ID = db.Column( db.Integer,  primary_key=True,  autoincrement=True )

    Contract_Name = db.Column( db.String(200), nullable=False )

    Contract_Type_ID = db.Column(
        db.Integer,
        db.ForeignKey(
            "contract_types.Contract_Type_ID"
        ),
        nullable=False
    )


    Description = db.Column(db.Text)


    # ---------------- PARTIES ----------------

    Party_A = db.Column( db.String(200), nullable=False )

    Party_B = db.Column( db.String(200), nullable=False )

    # ---------------- DATES ----------------

    Effective_Date = db.Column( db.Date,   nullable=False )

    Expiry_Date = db.Column(
        db.Date,
        nullable=False
    )

    Status_ID = db.Column(
        db.Integer,
       db.ForeignKey(  "contract_statuses.Status_ID" ),
        nullable=False
    )


    Created_By = db.Column(db.Integer,db.ForeignKey("users.User_ID"),nullable=False )

    Updated_By = db.Column( db.Integer, db.ForeignKey("users.User_ID"), nullable=True)

    Created_At = db.Column( db.DateTime, default=datetime.utcnow, nullable=False)

    Updated_At = db.Column( db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

     # Contract Type relationship
    contract_type = db.relationship(  "ContractType",  back_populates="contracts" )

    # Status relationship
    status = db.relationship(  "ContractStatus",  back_populates="contracts" )



    # User who last updated the contract
    updater = db.relationship( "User",  foreign_keys=[Updated_By] )

     # Relationship with User
    creator = db.relationship( "User", back_populates="contracts", foreign_keys=[Created_By])

    assigned_users = db.relationship(
    "ContractUser",
    back_populates="contract",
    foreign_keys="ContractUser.Contract_ID",
    cascade="all, delete-orphan"
    )

    # Relationship with Document
    documents = db.relationship(  "Document",  back_populates="contract",  cascade="all, delete-orphan")

    # Relationship with Version

    versions = db.relationship( "ContractVersion", back_populates="contract", cascade="all, delete-orphan")

    clauses = db.relationship( "Clause", back_populates="contract", cascade="all, delete-orphan")

    modifications = db.relationship(
    "Modification",
    back_populates="contract",
    cascade="all, delete-orphan"
)

class ContractUser(db.Model):
    __tablename__ = "contract_users"

    Contract_User_ID = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    Contract_ID = db.Column(
        db.Integer,
        db.ForeignKey("contracts.Contract_ID"),
        nullable=False
    )

    User_ID = db.Column(
        db.Integer,
        db.ForeignKey("users.User_ID"),
        nullable=False
    )

    Assigned_By = db.Column(
        db.Integer,
        db.ForeignKey("users.User_ID"),
        nullable=False
    )

    Assigned_At = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    contract = db.relationship(
        "Contract",
        back_populates="assigned_users",
        foreign_keys=[Contract_ID]
    )

    user = db.relationship(
        "User",
        back_populates="assigned_contracts",
        foreign_keys=[User_ID]
    )

    assigned_by_user = db.relationship(
        "User",
        foreign_keys=[Assigned_By]
    )

    __table_args__ = (
        db.UniqueConstraint(
            "Contract_ID",
            "User_ID",
            name="uq_contract_user"
        ),
    )






#------------------------------DOCUMENT--------------------------------


class Document(db.Model):

    __tablename__ = "documents"


    Document_ID=db.Column(db.Integer,primary_key=True, autoincrement=True)

    Contract_ID = db.Column( db.Integer, db.ForeignKey("contracts.Contract_ID"), nullable=False)

    Document_Name=db.Column(db.String(200),nullable=False)

    File_Path=db.Column(db.String(500),nullable=False)

    Document_Type=db.Column(db.String(50),nullable=False)

    Status = db.Column( db.String(30), default="Active",nullable=False)

    Created_By=db.Column(db.Integer,db.ForeignKey("users.User_ID"),nullable=False)

    Created_At=db.Column(db.DateTime,default=datetime.utcnow,nullable=False)

    Updated_By=db.Column(db.Integer,db.ForeignKey("users.User_ID"),nullable=True)

    Updated_At = db.Column( db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)



     # Contract relationship
    contract =db.relationship("Contract",back_populates="documents")

    # Relationship with Version

    versions = db.relationship("ContractVersion",back_populates="document",cascade="all, delete-orphan")


class ContractVersion(db.Model):

    __tablename__ = "contract_versions"

    Version_ID = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    Contract_ID = db.Column(
        db.Integer,
        db.ForeignKey("contracts.Contract_ID"),
        nullable=False
    )

    Document_ID = db.Column(
        db.Integer,
        db.ForeignKey("documents.Document_ID"),
        nullable=False
    )

    Version_Number = db.Column(
        db.Integer,
        nullable=False
    )

    File_Path = db.Column(
        db.String(500),
        nullable=False
    )

    Change_Summary = db.Column(
        db.Text,
        nullable=True
    )

    Created_By = db.Column(
        db.Integer,
        db.ForeignKey("users.User_ID"),
        nullable=False
    )

    Created_At = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    Is_Current = db.Column(
        db.Boolean,
        default=False,
        nullable=False
    )

    contract = db.relationship(
        "Contract",
        back_populates="versions"
    )

    document = db.relationship(
        "Document",
        back_populates="versions"
    )

    creator = db.relationship(
        "User",
        foreign_keys=[Created_By]
    )

    clauses = db.relationship(
        "Clause",
        back_populates="version",
        cascade="all, delete-orphan"
    )

    modifications = db.relationship(
        "Modification",
        back_populates="version",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        db.Index(
            "uq_current_contract_version",
            "Contract_ID",
            unique=True,
            postgresql_where=db.text('"Is_Current" = true')
        ),
    )


#------------------------------ CLAUSE --------------------------------


class Clause(db.Model):

    __tablename__ = "clauses"

    Clause_ID = db.Column(  db.Integer,primary_key=True,autoincrement=True )

    Contract_ID = db.Column( db.Integer, db.ForeignKey("contracts.Contract_ID"), nullable=False)

    Version_ID = db.Column( db.Integer,db.ForeignKey("contract_versions.Version_ID"),nullable=False)

    Clause_Number = db.Column( db.Integer,  nullable=False )

    Clause_Title = db.Column(db.String(200),nullable=False )

    Clause_Text = db.Column( db.Text, nullable=False )

    Created_By = db.Column(  db.Integer, db.ForeignKey("users.User_ID"), nullable=False)

    Updated_By = db.Column(db.Integer,db.ForeignKey("users.User_ID"),nullable=True   )

    Created_At = db.Column( db.DateTime, default=datetime.utcnow, nullable=False )

    Updated_At = db.Column( db.DateTime,  default=datetime.utcnow,  onupdate=datetime.utcnow )


    # Relationship with Contract

    contract = db.relationship( "Contract", back_populates="clauses" )


    # Relationship with Version

    version = db.relationship("ContractVersion",  back_populates="clauses" )


    # User who created the clause

    creator = db.relationship( "User", foreign_keys=[Created_By] )


    # User who updated the clause

    updater = db.relationship(  "User",   foreign_keys=[Updated_By] )

    modifications = db.relationship(
    "Modification",
    back_populates="clause",
    cascade="all, delete-orphan"
)

    __table_args__ = (
        db.UniqueConstraint(
            "Version_ID",
            "Clause_Number",
            name="uq_version_clause_number"
        ),
    )

class Modification(db.Model):

    __tablename__ = "modifications"

    Modification_ID = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    Contract_ID = db.Column(
        db.Integer,
        db.ForeignKey("contracts.Contract_ID"),
        nullable=False
    )

    Clause_ID = db.Column(
        db.Integer,
        db.ForeignKey("clauses.Clause_ID"),
        nullable=True
    )

    Version_ID = db.Column(
        db.Integer,
        db.ForeignKey("contract_versions.Version_ID"),
        nullable=False
    )

    # Contract / Clause
    Modification_Type = db.Column(
        db.String(30),
        nullable=False
    )

    Old_Text = db.Column(
        db.Text,
        nullable=False
    )

    New_Text = db.Column(
        db.Text,
        nullable=False
    )

    Reason = db.Column(
        db.Text,
        nullable=True
    )

    Status = db.Column(
        db.String(20),
        nullable=False,
        default="PENDING"
    )

    Modified_By = db.Column(
        db.Integer,
        db.ForeignKey("users.User_ID"),
        nullable=False
    )

    Modified_At = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    Reviewed_By = db.Column(
        db.Integer,
        db.ForeignKey("users.User_ID"),
        nullable=True
    )

    Reviewed_At = db.Column(
        db.DateTime,
        nullable=True
    )

    Review_Comment = db.Column(
        db.Text,
        nullable=True
    )

    # ---------------- Relationships ----------------

    contract = db.relationship(
        "Contract",
        back_populates="modifications"
    )

    clause = db.relationship(
        "Clause",
        back_populates="modifications"
    )

    version = db.relationship(
        "ContractVersion",
        back_populates="modifications"
    )

    modifier = db.relationship(
        "User",
        foreign_keys=[Modified_By]
    )

    reviewer = db.relationship(
        "User",
        foreign_keys=[Reviewed_By]
    )

    
