from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity

from config import db
from models import ContractVersion, Contract, Document, User
from routes.auth import roles_required
from routes.contracts_routes import ContractUser

from marshmallow import ValidationError
from schemas import ContractVersionSchema


version_bp = Blueprint(
    "version_bp",
    __name__,
    url_prefix="/versions"
)


version_schema = ContractVersionSchema()
versions_schema = ContractVersionSchema(many=True)


# ============================================================
# CHECK CONTRACT ACCESS
# ============================================================

def check_contract_access(contract_id):

    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if not user or not user.role:
        return False

    role_name = user.role.Role_Name

    # Admin, Contract Manager and Approver
    # can access all contracts
    if role_name in [
        "Admin",
        "Contract Manager",
        "Approver"
    ]:
        return True

    # Legal User can access only assigned contracts
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
# GET ALL VERSIONS
# ============================================================

@version_bp.route("", methods=["GET"])
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def get_all_versions():

    try:

        user_id = int(get_jwt_identity())

        user = db.session.get(User, user_id)

        if not user:
            return jsonify({
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

            versions = (
                ContractVersion.query
                .order_by(
                    ContractVersion.Contract_ID.asc(),
                    ContractVersion.Version_Number.desc()
                )
                .all()
            )

        # ----------------------------------------------------
        # LEGAL USER
        # ----------------------------------------------------

        elif role_name == "Legal User":

            versions = (
                ContractVersion.query
                .join(
                    ContractUser,
                    ContractUser.Contract_ID ==
                    ContractVersion.Contract_ID
                )
                .filter(
                    ContractUser.User_ID == user_id
                )
                .order_by(
                    ContractVersion.Contract_ID.asc(),
                    ContractVersion.Version_Number.desc()
                )
                .all()
            )

        else:

            return jsonify({
                "message": "Access denied"
            }), 403

        return jsonify({
            "success": True,
            "count": len(versions),
            "versions": versions_schema.dump(versions)
        }), 200

    except Exception as error:

        print(
            "GET ALL VERSIONS ERROR:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Failed to load versions",
            "error": str(error)
        }), 500


# ============================================================
# GET VERSIONS BY CONTRACT
# ============================================================

@version_bp.route(
    "/contract/<int:contract_id>",
    methods=["GET"]
)
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def get_contract_versions(contract_id):

    try:

        user_id = int(get_jwt_identity())

        # ----------------------------------------------------
        # CHECK CONTRACT
        # ----------------------------------------------------

        contract = db.session.get(
            Contract,
            contract_id
        )

        if not contract:

            return jsonify({
                "message": "Contract not found"
            }), 404

        # ----------------------------------------------------
        # CHECK ACCESS
        # ----------------------------------------------------

        if not check_contract_access(contract_id):

            return jsonify({
                "message": (
                    "Access denied. "
                    "You are not assigned to this contract."
                )
            }), 403

        # ----------------------------------------------------
        # GET VERSIONS
        # ----------------------------------------------------

        versions = (
            ContractVersion.query
            .filter_by(
                Contract_ID=contract_id
            )
            .order_by(
                ContractVersion.Version_Number.desc()
            )
            .all()
        )

        return jsonify({
            "success": True,
            "Contract_ID": contract_id,
            "Contract_Name": contract.Contract_Name,
            "count": len(versions),
            "versions": versions_schema.dump(versions)
        }), 200

    except Exception as error:

        print(
            "GET CONTRACT VERSIONS ERROR:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Failed to load contract versions",
            "error": str(error)
        }), 500


# ============================================================
# GET CURRENT VERSION
# ============================================================

@version_bp.route(
    "/contract/<int:contract_id>/current",
    methods=["GET"]
)
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def get_current_version(contract_id):

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
                "message": "Contract not found"
            }), 404

        # ----------------------------------------------------
        # CHECK ACCESS
        # ----------------------------------------------------

        if not check_contract_access(contract_id):

            return jsonify({
                "message": "Access denied"
            }), 403

        # ----------------------------------------------------
        # FIND CURRENT VERSION
        # ----------------------------------------------------

        version = (
            ContractVersion.query
            .filter_by(
                Contract_ID=contract_id,
                Is_Current=True
            )
            .first()
        )

        if not version:

            return jsonify({
                "success": False,
                "message": "No current version found"
            }), 404

        return jsonify({
            "success": True,
            "version": version_schema.dump(version)
        }), 200

    except Exception as error:

        print(
            "GET CURRENT VERSION ERROR:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Failed to load current version",
            "error": str(error)
        }), 500


# ============================================================
# GET SINGLE VERSION
# ============================================================

@version_bp.route(
    "/<int:version_id>",
    methods=["GET"]
)
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def get_version(version_id):

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
                "message": "Version not found"
            }), 404

        # ----------------------------------------------------
        # CHECK CONTRACT ACCESS
        # ----------------------------------------------------

        if not check_contract_access(
            version.Contract_ID
        ):

            return jsonify({
                "message": "Access denied"
            }), 403

        return jsonify({
            "success": True,
            "version": version_schema.dump(version)
        }), 200

    except Exception as error:

        print(
            "GET VERSION ERROR:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Failed to load version",
            "error": str(error)
        }), 500