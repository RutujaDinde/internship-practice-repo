from flask import Blueprint, render_template,request,jsonify
from marshmallow import ValidationError
from sqlalchemy import func
from werkzeug.security import generate_password_hash

from routes.auth import roles_required,BLACKLIST


from config import db
from models import ( User, Role,Contract, ContractStatus, ContractType, Document )
from schemas import LoginSchema, UserSchema
from routes.contracts_routes import ContractUser

from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt,
    get_jwt_identity,
    set_access_cookies,
    set_refresh_cookies
)

from werkzeug.security import check_password_hash



user_bp=Blueprint("user", __name__, url_prefix="/users")

user_schema=UserSchema()
users_schema=UserSchema(many=True)
login_schema = LoginSchema()

#------------------------- LOGIN -------------------------

@user_bp.route("/login", methods=["POST"])
def login():

    # Validate request
    try:

        data = login_schema.load( request.get_json()  )

    except ValidationError as error:

        return jsonify({
             "success":False,
            "message": "Validation error",
            "errors": error.messages
        }), 400


    # Find user by email
    user = User.query.filter_by(
        Email=data["Email"]
    ).first()


    # Invalid email
    if not user:

        return jsonify({
             "success":False,
            "message": "Invalid email or password"
        }), 401


    # Check user status
    if user.Status != "Active":

        return jsonify({
             "success":False,
            "message": "User account is inactive"
        }), 403



    if not check_password_hash(
        user.Password, 
        data["Password"]
    ):

        return jsonify({
            "success": False,
            "message": "Invalid email or password"
        }), 401

    print("PASSWORD CHECK PASSED")


    # Get current role from database
    role_name = user.role.Role_Name


    # Create access token
    # Only User_ID is stored as identity
    access_token = create_access_token( 
        identity=str(user.User_ID),
       additional_claims={  "role": role_name } )


    # Create refresh token
    refresh_token = create_refresh_token(identity=str(user.User_ID) )


    if role_name == "Admin":

            dashboard = "/users/admin-dashboard-page"

    elif role_name == "Legal User":

     dashboard = "/users/user-dashboard"

    elif role_name == "Contract Manager":

        dashboard = "/users/contract-manager-dashboard"

    elif role_name == "Approver":

        dashboard = "/users/approver-dashboard"

    # Response
    response = jsonify({

        "success":True,

        "message": "Login successful",

         "dashboard": dashboard,

        "user" :UserSchema().dump(user)

       
    })


    # Store JWT in HttpOnly cookies
    set_access_cookies(   response,  access_token  )

    set_refresh_cookies(response,refresh_token)

    return response, 200


@user_bp.route("/login-page")
def login_page():
    return render_template("login.html")


@user_bp.route("/admin-dashboard-page")
def admin_dashboard_page():
    return render_template("admin_dashboard.html")

@user_bp.route("/user-dashboard")
def user_dashboard():
    return render_template("user_dashboard.html")

@user_bp.route("/contract-manager-dashboard")
def contract_manager_dashboard():
    return render_template("contract_manager_dashboard.html")


@user_bp.route("/approver-dashboard")
def approver_dashboard():
    return render_template("approver_dashboard.html")


@user_bp.route("/user-page")
@roles_required("Admin")
def users_page():
    return render_template("users.html")

# =====================================================
# LEGAL USER DASHBOARD
# =====================================================

# =====================================================
# LEGAL USER DASHBOARD
# Shows only contracts assigned to logged-in Legal User
# =====================================================

@user_bp.route("/user-dashboard-data", methods=["GET"])
@roles_required("Legal User")
def user_dashboard_data():

    try:

        # -------------------------------------------------
        # GET LOGGED-IN USER
        # -------------------------------------------------

        user_id = int(get_jwt_identity())

        user = db.session.get(
            User,
            user_id
        )

        if not user:

            return jsonify({
                "message": "User not found"
            }), 404


        # -------------------------------------------------
# GET ASSIGNED CONTRACTS
# -------------------------------------------------


        contracts = (
            Contract.query
            .join(
                ContractUser,
                ContractUser.Contract_ID == Contract.Contract_ID
            )
            .filter(
                ContractUser.User_ID == user_id
            )
            .distinct()
            .order_by(
                Contract.Contract_ID.asc()
            )
            .all()
        )


        # -------------------------------------------------
        # TOTAL ASSIGNED CONTRACTS
        # -------------------------------------------------

        total_contracts = len(contracts)
               
        active_contracts = sum(
            1
            for contract in contracts
            if contract.status
            and contract.status.Status_Name == "Active"
        )


        # -------------------------------------------------
        # EXPIRING SOON
        # Within next 30 days
        # -------------------------------------------------

        from datetime import date, timedelta

        today = date.today()

        thirty_days = today + timedelta(days=30)

        expiring_contracts = sum(
            1
            for contract in contracts
            if contract.Expiry_Date
            and today <= contract.Expiry_Date <= thirty_days
            and contract.status
            and contract.status.Status_Name == "Active"
        )


        # -------------------------------------------------
        # CONTRACT STATUS COUNTS
        # -------------------------------------------------

        draft_count = 0
        active_count = 0
        expired_count = 0
        terminated_count = 0


        for contract in contracts:

            if not contract.status:
                continue

            status_name = contract.status.Status_Name


            if status_name == "Draft":
                draft_count += 1

            elif status_name == "Active":
                active_count += 1

            elif status_name == "Expired":
                expired_count += 1

            elif status_name == "Terminated":
                terminated_count += 1


        # -------------------------------------------------
        # TOTAL DOCUMENTS
        # Documents belonging to assigned contracts
        # -------------------------------------------------

        my_documents = (
            db.session.query(Document)
            .join(
                Contract,
                Document.Contract_ID == Contract.Contract_ID
            )
            .join(
                ContractUser,
                ContractUser.Contract_ID == Contract.Contract_ID
            )
            .filter(
                ContractUser.User_ID == user_id
            )
            .count()
        )

        # -------------------------------------------------
        # RECENT CONTRACTS
        # -------------------------------------------------

        recent_contracts = contracts[:5]


        recent_data = []

        for contract in recent_contracts:

            recent_data.append({

                "Contract_ID":
                    contract.Contract_ID,

                "Contract_Name":
                    contract.Contract_Name,

                "Contract_Type":
                    contract.contract_type.Contract_Type_Name
                    if contract.contract_type
                    else None,

                "Effective_Date":
                    contract.Effective_Date.isoformat()
                    if contract.Effective_Date
                    else None,

                "Expiry_Date":
                    contract.Expiry_Date.isoformat()
                    if contract.Expiry_Date
                    else None,

                "Status":
                    contract.status.Status_Name
                    if contract.status
                    else None
            })


        # -------------------------------------------------
        # RESPONSE
        # -------------------------------------------------

        return jsonify({

            "success": True,

            "user": {

                "User_ID":
                    user.User_ID,

                "Name":
                    user.Name,

                "Email":
                    user.Email,

                "Role":
                    user.role.Role_Name
                    if user.role
                    else None
            },

            "statistics": {

                "my_contracts":
                    total_contracts,

                "active_contracts":
                    active_contracts,

                "my_documents":
                    my_documents,

                "expiring_contracts":
                    expiring_contracts
            },

            "status_counts": {

                "Draft":
                    draft_count,

                "Active":
                    active_count,

                "Expired":
                    expired_count,

                "Terminated":
                    terminated_count
            },

            "recent_contracts":
                recent_data

        }), 200


    except Exception as error:

        print(
            "Legal User Dashboard Error:",
            error
        )

        return jsonify({

            "success": False,

            "message":
                "Failed to load user dashboard",

            "error":
                str(error)

        }), 500

#----------------Get Logged-In User Profile--------------------

@user_bp.route("/profile", methods=["GET"])
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def get_logged_in_user():

    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    return jsonify({
        "user": user_schema.dump(user)
       
    }), 200


#----------------Create User--------------------

@user_bp.route("",methods=["POST"])
@roles_required("Admin")
def add_user():

        try:
            data = user_schema.load(request.get_json())

        except ValidationError as error:
            return jsonify({
                "message": "Validation error",
                "errors": error.messages
            }), 400

         # Get logged-in Admin ID from JWT
        admin_id = int(get_jwt_identity())

        role=db.session.get(Role,data["Role_ID"])

        if not role:

            return jsonify({
                "message":"role not found"
            })

        existing_user=User.query.filter_by(
            Email=data["Email"]
        ).first()

        if existing_user:

            return jsonify({

                "message" :"Email aready Exists",

            }),409

        hashed_password=generate_password_hash(
            data["Password"]
        )

        user = User(
            Role_ID=data["Role_ID"],
            Name=data["Name"],
            Email=data["Email"],
            Password=hashed_password,
            Phone_No=data.get("Phone_No"),
            Status=data.get("Status", "Active"),
            Created_By=admin_id,
            Updated_By=data.get("Updated_By")
    )

        db.session.add(user)
        db.session.commit()

        return jsonify({
            "message": "User created successfully",
            "user": user_schema.dump(user)
        }), 201


#----------------Get All Users--------------------


@user_bp.route("", methods=["GET"])
@roles_required("Admin")
def get_users():

    users = User.query.order_by(
        User.User_ID.asc()
    ).all()

    return jsonify({
        "users": users_schema.dump(users)
    }), 200

#----------------Get User By ID--------------------

@user_bp.route("/<int:user_id>", methods=["GET"])
@roles_required("Admin")
def get_user(user_id):

    user = db.session.get( User, user_id)

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    return jsonify({
        "user": user_schema.dump(user)
    }), 200

#----------------Update User--------------------

@user_bp.route("/<int:user_id>", methods=["PUT"])
@roles_required("Admin")
def update_user(user_id):

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "message": "User not exists"
        }), 404

    try:
        data = user_schema.load( request.get_json(), partial=True)

    except ValidationError as error:
        return jsonify({
            "message": "Validation error",
            "errors": error.messages
        }), 400

     # Get logged-in Admin ID from JWT
    admin_id = int(get_jwt_identity())


    if "Role_ID" in data:

        role = db.session.get(Role, data["Role_ID"])

        if not role:
            return jsonify({
                "message": "Role not found"
            }), 404

        user.Role_ID = data["Role_ID"]


    if "Email" in data:

        existing_user = User.query.filter(
            User.Email == data["Email"],
            User.User_ID != user_id
        ).first()

        if existing_user:
            return jsonify({
                "message": "Email already registered"
            }), 409

        user.Email = data["Email"]


    if "Name" in data:
        user.Name = data["Name"]


    if "Phone_No" in data:
        user.Phone_No = data["Phone_No"]


    if "Status" in data:
        user.Status = data["Status"]


    if "Password" in data:
        user.Password = generate_password_hash(
            data["Password"]
        )

    # Automatically record who updated the user
    user.Updated_By = admin_id

    db.session.commit()

    return jsonify({
        "message": "User updated successfully",
        "user": user_schema.dump(user)
    }), 200


@user_bp.route("/<int:user_id>",methods=["DELETE"])
@roles_required("Admin")
def delete_user(user_id):
     
     user=db.session.get(User,user_id)

     if not user:
        return jsonify({
            "message": "User not found"
        }), 404

     db.session.delete(user)
     db.session.commit()

     return jsonify({
         "message":"User Deleted Successfully"
     }),200


@user_bp.route("/admin-dashboard", methods=["GET"])
@roles_required("Admin")
def admin_dashboard():

    try:

        total_users = User.query.count()

        total_contracts = Contract.query.count()


        # Contracts by Status
        status_results = (
            db.session.query(
                ContractStatus.Status_Name,
                func.count(Contract.Contract_ID)
            )
            .outerjoin(
                Contract,
                Contract.Status_ID == ContractStatus.Status_ID
            )
            .group_by(
                ContractStatus.Status_ID,
                ContractStatus.Status_Name
            )
            .order_by(
                ContractStatus.Status_ID.asc()
            )
            .all()
        )

        contract_status = {}

        for status_name, count in status_results:
            contract_status[status_name] = count


        # Contracts by Type
        type_results = (
            db.session.query(
                ContractType.Contract_Type_Name,
                func.count(Contract.Contract_ID)
            )
            .outerjoin(
                Contract,
                Contract.Contract_Type_ID ==
                ContractType.Contract_Type_ID
            )
            .group_by(
                ContractType.Contract_Type_ID,
                ContractType.Contract_Type_Name
            )
            .order_by(
                ContractType.Contract_Type_ID.asc()
            )
            .all()
        )

        contract_types = {}

        for type_name, count in type_results:
            contract_types[type_name] = count


        # Documents by Type
        document_results = (
            db.session.query(
                Document.Document_Type,
                func.count(Document.Document_ID)
            )
            .group_by(
                Document.Document_Type
            )
            .order_by(
                Document.Document_Type.asc()
            )
            .all()
        )

        document_types = {}

        for document_type, count in document_results:
            document_types[document_type] = count


        return jsonify({

            "total_users": total_users,

            "total_contracts": total_contracts,

            "contract_status": contract_status,

            "contract_types": contract_types,

            "document_types": document_types

        }), 200


    except Exception as error:

        print("Admin Dashboard Error:", error)

        return jsonify({

            "message": "Failed to load dashboard statistics",

            "error": str(error)

        }), 500



@user_bp.route("/logout", methods=["POST"])
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def logout():

    jti = get_jwt()["jti"]

    BLACKLIST.add(jti)

    return jsonify({
        "message": "Logout successful"
    }), 200



       
         
         
    




        







    