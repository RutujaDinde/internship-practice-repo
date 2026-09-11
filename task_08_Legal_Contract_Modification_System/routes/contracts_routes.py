from flask import Blueprint, render_template,request,jsonify
from flask_jwt_extended import get_jwt_identity
from marshmallow import ValidationError
from routes.auth import roles_required
from sqlalchemy import or_

from config import db
from models import Contract, ContractStatus, ContractType,User, ContractUser, Role
from schemas import ContractSchema

contract_bp=Blueprint("contracts", __name__, url_prefix="/contracts")

contract_schema=ContractSchema()
contracts_schema=ContractSchema(many=True)


#---------------------Assign Legal Users To Contract-----------------------

@contract_bp.route("/<int:contract_id>/assign-users", methods=["POST"])
@roles_required("Contract Manager")
def assign_users_to_contract(contract_id):

    try:
        # Check contract
        contract = db.session.get(Contract, contract_id)

        if not contract:
            return jsonify({
                "message": "Contract not found"
            }), 404

        data = request.get_json()

        if not data or "User_IDs" not in data:
            return jsonify({
                "message": "User_IDs are required"
            }), 400

        user_ids = data["User_IDs"]

        if not isinstance(user_ids, list) or not user_ids:
            return jsonify({
                "message": "User_IDs must be a non-empty list"
            }), 400

        if not all(isinstance(user_id, int) for user_id in user_ids):
            return jsonify({
                "message": "All User_IDs must be integers"
            }), 400

        # Logged-in Contract Manager
        manager_id = int(get_jwt_identity())

        # Check Legal User role
        legal_user_role = Role.query.filter_by(
            Role_Name="Legal User"
        ).first()

        if not legal_user_role:
            return jsonify({
                "message": "Legal User role not found"
            }), 404

        assigned_users = []

        for user_id in user_ids:

            user = db.session.get(User, user_id)

            # User must exist
            if not user:
                return jsonify({
                    "message": f"User with ID {user_id} not found"
                }), 404

            # User must be Legal User
            if user.Role_ID != legal_user_role.Role_ID:
                return jsonify({
                    "message": f"{user.Name} is not a Legal User"
                }), 400

            # User must be Active
            if user.Status != "Active":
                return jsonify({
                    "message": f"{user.Name} is not active"
                }), 400

            # Check duplicate assignment
            existing_assignment = ContractUser.query.filter_by(
                Contract_ID=contract_id,
                User_ID=user_id
            ).first()

            if existing_assignment:
                continue

            assignment = ContractUser(
                Contract_ID=contract_id,
                User_ID=user_id,
                Assigned_By=manager_id
            )

            db.session.add(assignment)
            assigned_users.append(user)

        db.session.commit()

        return jsonify({
            "message": "Users assigned to contract successfully",
            "Contract_ID": contract_id,
            "assigned_users": [
                {
                    "User_ID": user.User_ID,
                    "Name": user.Name,
                    "Email": user.Email
                }
                for user in assigned_users
            ]
        }), 201

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "message": "Failed to assign users",
            "error": str(e)
        }), 500



#---------------------Get Assignable Legal Users-----------------------#

@contract_bp.route("/assignable-users", methods=["GET"])
@roles_required("Contract Manager")
def get_assignable_users():

    try:

        #------------------------------------------------
        # CHECK LEGAL USER ROLE
        #------------------------------------------------

        legal_user_role = Role.query.filter_by(
            Role_Name="Legal User"
        ).first()

        if not legal_user_role:

            return jsonify({
                "message": "Legal User role not found"
            }), 404


        #------------------------------------------------
        # GET CONTRACT ID
        #------------------------------------------------

        contract_id = request.args.get(
            "contract_id",
            type=int
        )

        if not contract_id:

            return jsonify({
                "message": "contract_id is required"
            }), 400


        #------------------------------------------------
        # CHECK CONTRACT
        #------------------------------------------------

        contract = db.session.get(
            Contract,
            contract_id
        )

        if not contract:

            return jsonify({
                "message": "Contract not found"
            }), 404


        #------------------------------------------------
        # GET SEARCH
        #------------------------------------------------

        search = request.args.get(
            "search",
            ""
        ).strip()


        #------------------------------------------------
        # PAGINATION
        #------------------------------------------------

        page = request.args.get(
            "page",
            1,
            type=int
        )

        per_page = request.args.get(
            "per_page",
            20,
            type=int
        )

        per_page = min(
            max(per_page, 1),
            100
        )


        #------------------------------------------------
        # GET ALREADY ASSIGNED USER IDS
        #------------------------------------------------

        assigned_user_ids = {

            assignment.User_ID

            for assignment in
            ContractUser.query.filter_by(
                Contract_ID=contract_id
            ).all()

        }


        #------------------------------------------------
        # NO SEARCH
        # SHOW ONLY ASSIGNED USERS
        #------------------------------------------------

        if not search:

            if not assigned_user_ids:

                return jsonify({

                    "Contract_ID":
                        contract_id,

                    "Contract_Name":
                        contract.Contract_Name,

                    "users": [],

                    "count": 0,

                    "page": 1,

                    "per_page":
                        per_page,

                    "pages": 0

                }), 200


            query = User.query.filter(

                User.Role_ID ==
                legal_user_role.Role_ID,

                User.Status ==
                "Active",

                User.User_ID.in_(
                    assigned_user_ids
                )

            )


        #------------------------------------------------
        # SEARCH USERS
        #------------------------------------------------

        else:

            query = User.query.filter(

                User.Role_ID ==
                legal_user_role.Role_ID,

                User.Status ==
                "Active"

            )


            #------------------------------------------------
            # SEARCH BY NAME OR EMAIL
            #------------------------------------------------

            search_pattern =   f"%{search}%"

            query = query.filter(

                or_(

                    User.Name.ilike(
                        search_pattern
                    ),

                    User.Email.ilike(
                        search_pattern
                    )

                )

            )


        #------------------------------------------------
        # PAGINATION
        #------------------------------------------------

        pagination = query.order_by(

            User.Name.asc()

        ).paginate(

            page=page,

            per_page=per_page,

            error_out=False

        )


        #------------------------------------------------
        # BUILD RESPONSE
        #------------------------------------------------

        users = []


        for user in pagination.items:

            users.append({

                "User_ID":
                    user.User_ID,

                "Name":
                    user.Name,

                "Email":
                    user.Email,

                "Status":
                    user.Status,

                "assigned":
                    user.User_ID in
                    assigned_user_ids

            })


        #------------------------------------------------
        # RESPONSE
        #------------------------------------------------

        return jsonify({

            "Contract_ID":
                contract_id,

            "Contract_Name":
                contract.Contract_Name,

            "users":
                users,

            "count":
                pagination.total,

            "page":
                pagination.page,

            "per_page":
                pagination.per_page,

            "pages":
                pagination.pages

        }), 200


    except Exception as e:

        return jsonify({

            "message":
                "Failed to load assignable users",

            "error":
                str(e)

        }), 500


#---------------------Get Assigned Legal Users-----------------------

@contract_bp.route("/<int:contract_id>/assigned-users", methods=["GET"])
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def get_assigned_users(contract_id):

    try:

        #------------------------------------------------
        # GET LOGGED-IN USER
        #------------------------------------------------

        current_user_id = int(get_jwt_identity())

        current_user = db.session.get(
            User,
            current_user_id
        )

        if not current_user:
            return jsonify({
                "message": "User not found"
            }), 404

        #------------------------------------------------
        # CHECK CONTRACT
        #------------------------------------------------

        contract = db.session.get(
            Contract,
            contract_id
        )

        if not contract:
            return jsonify({
                "message": "Contract not found"
            }), 404

        #------------------------------------------------
        # LEGAL USER ACCESS CHECK
        #------------------------------------------------

        if current_user.role.Role_Name == "Legal User":

            assignment = ContractUser.query.filter_by(
                Contract_ID=contract_id,
                User_ID=current_user_id
            ).first()

            if not assignment:

                return jsonify({
                    "message": "Access denied. You are not assigned to this contract."
                }), 403

        #------------------------------------------------
        # GET ASSIGNED USERS
        #------------------------------------------------

        assignments = ContractUser.query.filter_by(
            Contract_ID=contract_id
        ).all()

        users = []

        for assignment in assignments:

            user = assignment.user

            if user:

                users.append({
                    "User_ID": user.User_ID,
                    "Name": user.Name,
                    "Email": user.Email,
                    "Status": user.Status,
                    "Assigned_At": assignment.Assigned_At.isoformat()
                    if assignment.Assigned_At
                    else None
                })

        #------------------------------------------------
        # RESPONSE
        #------------------------------------------------

        return jsonify({
            "Contract_ID": contract_id,
            "Contract_Name": contract.Contract_Name,
            "users": users,
            "count": len(users)
        }), 200

    except Exception as e:

        return jsonify({
            "message": "Failed to get assigned users",
            "error": str(e)
        }), 500
#---------------------Remove Legal User From Contract-----------------------

@contract_bp.route(
    "/<int:contract_id>/assign-users/<int:user_id>",
    methods=["DELETE"]
)
@roles_required("Contract Manager")
def remove_user_from_contract(contract_id, user_id):

    try:

        # Check contract
        contract = db.session.get(
            Contract,
            contract_id
        )

        if not contract:
            return jsonify({
                "message": "Contract not found"
            }), 404

        # Check assignment
        assignment = ContractUser.query.filter_by(
            Contract_ID=contract_id,
            User_ID=user_id
        ).first()

        if not assignment:
            return jsonify({
                "message": "User is not assigned to this contract"
            }), 404

        # Remove assignment
        db.session.delete(assignment)

        db.session.commit()

        return jsonify({
            "message": "User removed from contract successfully",
            "Contract_ID": contract_id,
            "User_ID": user_id
        }), 200

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "message": "Failed to remove user",
            "error": str(e)
        }), 500

@contract_bp.route("/page")
@roles_required("Admin", "Legal User", "Contract Manager", "Approver")
def contracts_page():
    return render_template("contracts.html")


#---------------------Create contracts-----------------------

@contract_bp.route("",methods=["POST"])
@roles_required("Contract Manager")
def create_contract():

    try:
        data=contract_schema.load(request.get_json())

        #creator=db.session.get(User,data["Created_By"])
        creator_id = int(get_jwt_identity())

        creator = db.session.get(User, creator_id)

        if not creator:
            return jsonify({
                "message": "Creator user not found" 

            }),404

        # Check Contract Type
        contract_type = db.session.get(  ContractType,  data["Contract_Type_ID"] )

        if not contract_type:
            return jsonify({
                "message": "Contract Type not found"
            }), 404

        # Check Status
        # Get Draft status automatically
        draft_status = ContractStatus.query.filter_by(
            Status_Name="Draft"
        ).first()

        if not draft_status:
            return jsonify({
                "message": "Draft status not found"
            }), 500

        contract= Contract(
            Contract_Name =data["Contract_Name"] ,
            Contract_Type_ID=data["Contract_Type_ID"],
            Description=data.get("Description"),
            Party_A=data["Party_A"],
            Party_B=data["Party_B"],
            Effective_Date=data["Effective_Date"],
            Expiry_Date=data["Expiry_Date"],
            Status_ID=draft_status.Status_ID,
            Created_By=creator_id

        )

        db.session.add(contract)
        db.session.commit()


        return jsonify({
            "message":"Contract Created successfully"
    
        }),201
    
    except ValidationError as err:
        return jsonify({
            "errors": err.messages
        }), 400

    except Exception as e:
        db.session.rollback()

        return jsonify({
            "message": "Failed to create contract",
            "error": str(e)
        }), 500


#---------------Get All Contracts-------------------

#---------------Get All Contracts-------------------

@contract_bp.route("", methods=["GET"])
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def get_Contracts():

    try:

        # Logged-in user
        current_user_id = int(get_jwt_identity())

        current_user = db.session.get(User, current_user_id)

        if not current_user:
            return jsonify({
                "message": "User not found"
            }), 404

        search = request.args.get("search", "").strip()
        status = request.args.get("status", "").strip()
        contract_type_id = request.args.get(
            "contract_type_id",
            ""
        ).strip()

        # Pagination
        page = request.args.get(
            "page",
            1,
            type=int
        )

        per_page = request.args.get(
            "per_page",
            20,
            type=int
        )

        per_page = min(per_page, 100)

        query = Contract.query

        #------------------------------------------------
        # LEGAL USER ACCESS
        #------------------------------------------------

        if current_user.role.Role_Name == "Legal User":

            query = query.join(
                ContractUser,
                ContractUser.Contract_ID == Contract.Contract_ID
            ).filter(
                ContractUser.User_ID == current_user_id
            )

        #------------------------------------------------
        # SEARCH
        #------------------------------------------------

        if search:

            search_pattern = f"%{search}%"

            query = query.filter(
                or_(
                    Contract.Contract_Name.ilike(
                        search_pattern
                    ),

                    Contract.Party_A.ilike(
                        search_pattern
                    ),

                    Contract.Party_B.ilike(
                        search_pattern
                    ),

                    db.cast(
                        Contract.Contract_ID,
                        db.String
                    ).ilike(
                        search_pattern
                    )
                )
            )

        #------------------------------------------------
        # STATUS FILTER
        #------------------------------------------------

        if status:

            query = query.join(
                ContractStatus,
                Contract.Status_ID ==
                ContractStatus.Status_ID
            ).filter(
                ContractStatus.Status_Name == status
            )

        #------------------------------------------------
        # CONTRACT TYPE FILTER
        #------------------------------------------------

        if contract_type_id:

            try:
                contract_type_id = int(contract_type_id)
            except ValueError:
                return jsonify({
                    "message": "Invalid contract_type_id"
                }), 400

            query = query.filter(
                Contract.Contract_Type_ID == contract_type_id
            )

        #------------------------------------------------
        # PAGINATION
        #------------------------------------------------

        pagination = query.order_by(
            Contract.Contract_ID.asc()
        ).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        contracts = pagination.items

        contracts_data = contracts_schema.dump(
            contracts
        )

        return jsonify({
            "contracts": contracts_data,
            "count": pagination.total,
            "page": pagination.page,
            "per_page": pagination.per_page,
            "pages": pagination.pages
        }), 200

    except Exception as e:

        return jsonify({
            "message": "Failed to get contracts",
            "error": str(e)
        }), 500
#---------------Get Contract By Id----------------------

#---------------Get Contract By Id----------------------

@contract_bp.route("/<int:contract_id>", methods=["GET"])
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def get_Contract(contract_id):

    try:

        # Get logged-in user
        current_user_id = int(get_jwt_identity())

        current_user = db.session.get(
            User,
            current_user_id
        )

        if not current_user:
            return jsonify({
                "message": "User not found"
            }), 404

        # Get contract
        contract = db.session.get(
            Contract,
            contract_id
        )

        if not contract:
            return jsonify({
                "message": "Contract Not found"
            }), 404

        #------------------------------------------------
        # LEGAL USER ACCESS CHECK
        #------------------------------------------------

        if current_user.role.Role_Name == "Legal User":

            assignment = ContractUser.query.filter_by(
                Contract_ID=contract_id,
                User_ID=current_user_id
            ).first()

            if not assignment:

                return jsonify({
                    "message": "Access denied. You are not assigned to this contract."
                }), 403

        #------------------------------------------------
        # RETURN CONTRACT
        #------------------------------------------------

        return jsonify({
            "contract": contract_schema.dump(contract)
        }), 200

    except Exception as e:

        return jsonify({
            "message": "Failed to get contract",
            "error": str(e)
        }), 500
#-------------------------Update Contract--------------------------

@contract_bp.route("/<int:contract_id>", methods=["PUT"])
@roles_required( "Contract Manager")
def update_contract(contract_id):

    contract = db.session.get(Contract, contract_id)

    if not contract:
        return jsonify({
            "message": "Contract not found"
        }), 404


    try:
        data = contract_schema.load( request.get_json(), partial=True)

    except ValidationError as error:
        return jsonify({
            "message": "Validation Error",
            "errors": error.messages
        }), 400

    try:

        if "Contract_Name" in data:
            contract.Contract_Name = data["Contract_Name"]

        if "Contract_Type_ID" in data:

            contract_type = db.session.get(
                ContractType,
                data["Contract_Type_ID"]
            )

            if not contract_type:
                return jsonify({
                    "message": "Contract Type not found"
                }), 404

            contract.Contract_Type_ID = data["Contract_Type_ID"]

        if "Description" in data:
            contract.Description = data["Description"]

        if "Party_A" in data:
            contract.Party_A = data["Party_A"]

        if "Party_B" in data:
            contract.Party_B = data["Party_B"]


        # If new Effective_Date is provided,
        # use the new date.
        # Otherwise use the existing database date.

        if "Effective_Date" in data:
            new_effective_date = data["Effective_Date"]
        else:
            new_effective_date = contract.Effective_Date


        # If new Expiry_Date is provided,
        # use the new date.
        # Otherwise use the existing database date.

        if "Expiry_Date" in data:
            new_expiry_date = data["Expiry_Date"]
        else:
            new_expiry_date = contract.Expiry_Date


        if new_expiry_date <= new_effective_date:

            return jsonify({
                "message": "Expiry date must be after effective date."
            }), 400


        contract.Effective_Date = new_effective_date
        contract.Expiry_Date = new_expiry_date

        user_id = int(get_jwt_identity())
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({
                "message": "User not found"
            }), 404

        contract.Updated_By = user_id

        db.session.commit()


        return jsonify({
            "message": "Contract Updated Successfully",
            "contract": contract_schema.dump(contract)
        }), 200


    except Exception as error:

        db.session.rollback()

        return jsonify({
            "message": "Failed to update contract",
            "error": str(error)
        }), 500

#-------------------------Delete  Contract--------------------------


@contract_bp.route("/<int:contract_id>",methods=["DELETE"])
@roles_required("Contract Manager")
def delete_contract(contract_id):

    contract=db.session.get(Contract,contract_id)

    if not contract:
        return jsonify({
            "message":"Contract Not found"
        }),404

    db.session.delete(contract)
    db.session.commit( )

    return jsonify({
        "message":"Contract Deleted Successfully"
    }),200





    

    
