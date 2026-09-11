from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity
from marshmallow import ValidationError

from config import db

from models import (
    Clause,
    Contract,
    ContractVersion,
    User
)

from routes.auth import roles_required
from routes.contracts_routes import ContractUser

from schemas import (
    ClauseSchema,
    ClauseCreateSchema,
    ClauseUpdateSchema
)


# ============================================================
# BLUEPRINT
# ============================================================

clause_bp = Blueprint(
    "clause_bp",
    __name__,
    url_prefix="/clauses"
)


# ============================================================
# SCHEMAS
# ============================================================

clause_schema = ClauseSchema()

clauses_schema = ClauseSchema(
    many=True
)

clause_create_schema = ClauseCreateSchema()

clause_update_schema = ClauseUpdateSchema()


# ============================================================
# CHECK CONTRACT ACCESS
# ============================================================

def check_contract_access(contract_id):

    user_id = int(
        get_jwt_identity()
    )

    user = db.session.get(
        User,
        user_id
    )

    if not user or not user.role:
        return False

    role_name = user.role.Role_Name

    # --------------------------------------------------------
    # ADMIN / CONTRACT MANAGER / APPROVER
    # --------------------------------------------------------

    if role_name in [
        "Admin",
        "Contract Manager",
        "Approver"
    ]:
        return True

    # --------------------------------------------------------
    # LEGAL USER
    # --------------------------------------------------------

    if role_name == "Legal User":

        assignment = (
            ContractUser.query
            .filter_by(
                Contract_ID=contract_id,
                User_ID=user_id
            )
            .first()
        )

        return assignment is not None

    return False


# ============================================================
# CREATE CLAUSE
# ============================================================

@clause_bp.route(
    "",
    methods=["POST"]
)
@roles_required("Contract Manager")
def create_clause():

    try:

        user_id = int(
            get_jwt_identity()
        )

        # ----------------------------------------------------
        # VALIDATE REQUEST
        # ----------------------------------------------------

        data = clause_create_schema.load(
            request.get_json() or {}
        )

        contract_id = data["Contract_ID"]
        version_id = data["Version_ID"]

        # ----------------------------------------------------
        # CHECK CONTRACT
        # ----------------------------------------------------

        contract = db.session.get(
            Contract,
            contract_id
        )

        if not contract:

            return jsonify({
                "success": False,
                "message": "Contract not found"
            }), 404

        # ----------------------------------------------------
        # CHECK VERSION
        # ----------------------------------------------------

        version = db.session.get(
            ContractVersion,
            version_id
        )

        if not version:

            return jsonify({
                "success": False,
                "message": "Version not found"
            }), 404

        # ----------------------------------------------------
        # CHECK CONTRACT-VERSION RELATIONSHIP
        # ----------------------------------------------------

        if version.Contract_ID != contract_id:

            return jsonify({
                "success": False,
                "message": (
                    "The selected version does not "
                    "belong to this contract."
                )
            }), 400

        # ----------------------------------------------------
        # ONLY CURRENT VERSION CAN RECEIVE CLAUSES
        # ----------------------------------------------------

        if not version.Is_Current:

            return jsonify({
                "success": False,
                "message": (
                    "Clauses can only be added "
                    "to the current version."
                )
            }), 400

        # ----------------------------------------------------
        # CHECK DUPLICATE CLAUSE NUMBER
        # ----------------------------------------------------

        existing_clause = (
            Clause.query
            .filter_by(
                Version_ID=version_id,
                Clause_Number=data["Clause_Number"]
            )
            .first()
        )

        if existing_clause:

            return jsonify({
                "success": False,
                "message": (
                    "Clause number already exists "
                    "in this version."
                )
            }), 409

        # ----------------------------------------------------
        # CREATE CLAUSE
        # ----------------------------------------------------

        clause = Clause(
            Contract_ID=contract_id,
            Version_ID=version_id,
            Clause_Number=data["Clause_Number"],
            Clause_Title=data["Clause_Title"],
            Clause_Text=data["Clause_Text"],
            Created_By=user_id
        )

        db.session.add(clause)

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Clause created successfully",
            "clause": clause_schema.dump(clause)
        }), 201

    except ValidationError as error:

        return jsonify({
            "success": False,
            "message": "Validation failed",
            "errors": error.messages
        }), 400

    except Exception as error:

        db.session.rollback()

        print(
            "CREATE CLAUSE ERROR:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Failed to create clause",
            "error": str(error)
        }), 500


# ============================================================
# GET ALL CLAUSES
# ============================================================

@clause_bp.route(
    "",
    methods=["GET"]
)
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def get_all_clauses():

    try:

        user_id = int(
            get_jwt_identity()
        )

        user = db.session.get(
            User,
            user_id
        )

        if not user or not user.role:

            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        role_name = user.role.Role_Name

        # ----------------------------------------------------
        # ADMIN / CONTRACT MANAGER / APPROVER
        # ----------------------------------------------------

        if role_name in [
            "Admin",
            "Contract Manager",
            "Approver"
        ]:

            clauses = (
                Clause.query
                .order_by(
                    Clause.Contract_ID.asc(),
                    Clause.Version_ID.asc(),
                    Clause.Clause_Number.asc()
                )
                .all()
            )

        # ----------------------------------------------------
        # LEGAL USER
        # ----------------------------------------------------

        elif role_name == "Legal User":

            clauses = (
                Clause.query
                .join(
                    ContractUser,
                    ContractUser.Contract_ID ==
                    Clause.Contract_ID
                )
                .filter(
                    ContractUser.User_ID == user_id
                )
                .order_by(
                    Clause.Contract_ID.asc(),
                    Clause.Version_ID.asc(),
                    Clause.Clause_Number.asc()
                )
                .all()
            )

        else:

            return jsonify({
                "success": False,
                "message": "Access denied"
            }), 403

        return jsonify({
            "success": True,
            "count": len(clauses),
            "clauses": clauses_schema.dump(
                clauses
            )
        }), 200

    except Exception as error:

        print(
            "GET ALL CLAUSES ERROR:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Failed to load clauses",
            "error": str(error)
        }), 500


# ============================================================
# GET CURRENT CLAUSES BY CONTRACT
# ============================================================

@clause_bp.route( "/contract/<int:contract_id>", methods=["GET"])
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def get_contract_clauses(contract_id):

    try:

        # ----------------------------------------------------
        # CHECK CONTRACT
        # ----------------------------------------------------

        contract = db.session.get(
            Contract,
            contract_id
        )

        if not contract:

            return jsonify({
                "success": False,
                "message": "Contract not found"
            }), 404

        # ----------------------------------------------------
        # CHECK ACCESS
        # ----------------------------------------------------

        if not check_contract_access(
            contract_id
        ):

            return jsonify({
                "success": False,
                "message": "Access denied"
            }), 403

        # ----------------------------------------------------
        # FIND CURRENT VERSION
        # ----------------------------------------------------

        current_version = (
            ContractVersion.query
            .filter_by(
                Contract_ID=contract_id,
                Is_Current=True
            )
            .first()
        )

        # ----------------------------------------------------
        # NO CURRENT VERSION
        # ----------------------------------------------------

        if not current_version:

            return jsonify({
                "success": True,
                "Contract_ID": contract_id,
                "Contract_Name": contract.Contract_Name,
                "Version_ID": None,
                "Version_Number": None,
                "Is_Current": False,
                "count": 0,
                "clauses": []
            }), 200

        # ----------------------------------------------------
        # GET CURRENT VERSION CLAUSES ONLY
        # ----------------------------------------------------

        clauses = (
            Clause.query
            .filter_by(
                Contract_ID=contract_id,
                Version_ID=current_version.Version_ID
            )
            .order_by(
                Clause.Clause_Number.asc()
            )
            .all()
        )

        return jsonify({
            "success": True,
            "Contract_ID": contract_id,
            "Contract_Name": contract.Contract_Name,

            # Version information is returned
            # at API level, NOT inside ClauseSchema
            "Version_ID": current_version.Version_ID,
            "Version_Number": current_version.Version_Number,
            "Is_Current": current_version.Is_Current,

            "count": len(clauses),

            "clauses": clauses_schema.dump(
                clauses
            )
        }), 200

    except Exception as error:

        print(
            "GET CURRENT CONTRACT CLAUSES ERROR:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Failed to load contract clauses",
            "error": str(error)
        }), 500


# ============================================================
# GET CLAUSES BY VERSION
# ============================================================

@clause_bp.route(  "/version/<int:version_id>",  methods=["GET"])
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def get_version_clauses(version_id):

    try:

        # ----------------------------------------------------
        # FIND VERSION
        # ----------------------------------------------------

        version = db.session.get(
            ContractVersion,
            version_id
        )

        if not version:

            return jsonify({
                "success": False,
                "message": "Version not found"
            }), 404

        # ----------------------------------------------------
        # CHECK CONTRACT ACCESS
        # ----------------------------------------------------

        if not check_contract_access(
            version.Contract_ID
        ):

            return jsonify({
                "success": False,
                "message": "Access denied"
            }), 403

        # ----------------------------------------------------
        # GET VERSION CLAUSES
        # ----------------------------------------------------

        clauses = (
            Clause.query
            .filter_by(
                Contract_ID=version.Contract_ID,
                Version_ID=version_id
            )
            .order_by(
                Clause.Clause_Number.asc()
            )
            .all()
        )

        return jsonify({
            "success": True,
            "Version_ID": version_id,
            "Contract_ID": version.Contract_ID,
            "Version_Number": version.Version_Number,
            "Is_Current": version.Is_Current,
            "count": len(clauses),
            "clauses": clauses_schema.dump(
                clauses
            )
        }), 200

    except Exception as error:

        print(
            "GET VERSION CLAUSES ERROR:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Failed to load version clauses",
            "error": str(error)
        }), 500


# ============================================================
# GET SINGLE CLAUSE
# ============================================================

@clause_bp.route( "/<int:clause_id>", methods=["GET"])
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def get_clause(clause_id):

    try:

        # ----------------------------------------------------
        # FIND CLAUSE
        # ----------------------------------------------------

        clause = db.session.get(
            Clause,
            clause_id
        )

        if not clause:

            return jsonify({
                "success": False,
                "message": "Clause not found"
            }), 404

        # ----------------------------------------------------
        # CHECK ACCESS
        # ----------------------------------------------------

        if not check_contract_access(
            clause.Contract_ID
        ):

            return jsonify({
                "success": False,
                "message": "Access denied"
            }), 403

        return jsonify({
            "success": True,
            "clause": clause_schema.dump(
                clause
            )
        }), 200

    except Exception as error:

        print(
            "GET CLAUSE ERROR:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Failed to load clause",
            "error": str(error)
        }), 500


# ============================================================
# UPDATE CLAUSE
# ============================================================

@clause_bp.route(
    "/<int:clause_id>",
    methods=["PUT"]
)
@roles_required("Contract Manager")
def update_clause(clause_id):

    try:

        user_id = int(
            get_jwt_identity()
        )

        # ----------------------------------------------------
        # FIND CLAUSE
        # ----------------------------------------------------

        clause = db.session.get(
            Clause,
            clause_id
        )

        if not clause:

            return jsonify({
                "success": False,
                "message": "Clause not found"
            }), 404

        # ----------------------------------------------------
        # FIND VERSION
        # ----------------------------------------------------

        version = db.session.get(
            ContractVersion,
            clause.Version_ID
        )

        if not version:

            return jsonify({
                "success": False,
                "message": "Version not found"
            }), 404

        # ----------------------------------------------------
        # CHECK CLAUSE-VERSION-CONTRACT CONSISTENCY
        # ----------------------------------------------------

        if version.Contract_ID != clause.Contract_ID:

            return jsonify({
                "success": False,
                "message": (
                    "Clause and version do not "
                    "belong to the same contract."
                )
            }), 400

        # ----------------------------------------------------
        # ONLY CURRENT VERSION CAN BE UPDATED
        # ----------------------------------------------------

        if not version.Is_Current:

            return jsonify({
                "success": False,
                "message": (
                    "Historical version clauses "
                    "cannot be modified."
                )
            }), 400

        # ----------------------------------------------------
        # VALIDATE REQUEST
        # ----------------------------------------------------

        data = clause_update_schema.load(
            request.get_json() or {}
        )

        # ----------------------------------------------------
        # CHECK CLAUSE NUMBER
        # ----------------------------------------------------

        if "Clause_Number" in data:

            existing_clause = (
                Clause.query
                .filter(
                    Clause.Version_ID ==
                    clause.Version_ID,

                    Clause.Clause_Number ==
                    data["Clause_Number"],

                    Clause.Clause_ID !=
                    clause.Clause_ID
                )
                .first()
            )

            if existing_clause:

                return jsonify({
                    "success": False,
                    "message": (
                        "Clause number already exists "
                        "in this version."
                    )
                }), 409

            clause.Clause_Number = (
                data["Clause_Number"]
            )

        # ----------------------------------------------------
        # UPDATE TITLE
        # ----------------------------------------------------

        if "Clause_Title" in data:

            clause.Clause_Title = (
                data["Clause_Title"]
            )

        # ----------------------------------------------------
        # UPDATE TEXT
        # ----------------------------------------------------

        if "Clause_Text" in data:

            clause.Clause_Text = (
                data["Clause_Text"]
            )

        # ----------------------------------------------------
        # UPDATED BY
        # ----------------------------------------------------

        clause.Updated_By = user_id

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Clause updated successfully",
            "clause": clause_schema.dump(
                clause
            )
        }), 200

    except ValidationError as error:

        return jsonify({
            "success": False,
            "message": "Validation failed",
            "errors": error.messages
        }), 400

    except Exception as error:

        db.session.rollback()

        print(
            "UPDATE CLAUSE ERROR:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Failed to update clause",
            "error": str(error)
        }), 500


# ============================================================
# DELETE CLAUSE
# ============================================================

@clause_bp.route("/<int:clause_id>",  methods=["DELETE"])
@roles_required("Contract Manager")
def delete_clause(clause_id):

    try:

        # ----------------------------------------------------
        # FIND CLAUSE
        # ----------------------------------------------------

        clause = db.session.get(
            Clause,
            clause_id
        )

        if not clause:

            return jsonify({
                "success": False,
                "message": "Clause not found"
            }), 404

        # ----------------------------------------------------
        # FIND VERSION
        # ----------------------------------------------------

        version = db.session.get(
            ContractVersion,
            clause.Version_ID
        )

        if not version:

            return jsonify({
                "success": False,
                "message": "Version not found"
            }), 404

        # ----------------------------------------------------
        # CHECK CLAUSE-VERSION-CONTRACT CONSISTENCY
        # ----------------------------------------------------

        if version.Contract_ID != clause.Contract_ID:

            return jsonify({
                "success": False,
                "message": (
                    "Clause and version do not "
                    "belong to the same contract."
                )
            }), 400

        # ----------------------------------------------------
        # ONLY CURRENT VERSION CAN BE DELETED
        # ----------------------------------------------------

        if not version.Is_Current:

            return jsonify({
                "success": False,
                "message": (
                    "Historical version clauses "
                    "cannot be deleted."
                )
            }), 400

        # ----------------------------------------------------
        # DELETE
        # ----------------------------------------------------

        db.session.delete(clause)

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Clause deleted successfully"
        }), 200

    except Exception as error:

        db.session.rollback()

        print(
            "DELETE CLAUSE ERROR:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Failed to delete clause",
            "error": str(error)
        }), 500