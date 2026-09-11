from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError

from config import db
from models import (
    Modification,
    Contract,
    Clause,
    ContractVersion,
    User,
    Document,
    ContractUser
)

from schemas import (
    ModificationCreateSchema,
    ModificationReviewSchema
)

modification_bp = Blueprint( "modifications",  __name__,  url_prefix="/modifications")


# ============================================================
# HELPER: CHECK CONTRACT ACCESS
# ============================================================

def user_can_access_contract(user_id, contract_id):

    user = db.session.get(User, user_id)

    if not user or not user.role:
        return False

    role_name = user.role.Role_Name

    # Admin / Contract Manager / Approver
    if role_name in [
        "Admin",
        "Contract Manager",
        "Approver"
    ]:
        return True

    # Legal User → assigned contracts only
    if role_name == "Legal User":

        assignment = (ContractUser.query
          .filter_by(
                Contract_ID=contract_id,
                User_ID=user_id
            )
            .first()
        )

        return assignment is not None

    return False


# ============================================================
# CREATE MODIFICATION REQUEST
# ============================================================

@modification_bp.route("", methods=["POST"])
@jwt_required()
def create_modification():

    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    # --------------------------------------------------------
    # Only Legal User can create modification request
    # --------------------------------------------------------

    if not user.role or user.role.Role_Name != "Legal User":

        return jsonify({
            "success": False,
            "message": "Only Legal User can create modification requests."
        }), 403

    # --------------------------------------------------------
    # Validate request data
    # --------------------------------------------------------

    schema = ModificationCreateSchema()

    try:

        data = schema.load(request.get_json() or {})

    except ValidationError as err:

        return jsonify({
            "success": False,
            "message": "Validation error.",
            "errors": err.messages
        }), 400

    contract_id = data["Contract_ID"]
    clause_id = data.get("Clause_ID")
    version_id = data["Version_ID"]

    # --------------------------------------------------------
    # Check contract
    # --------------------------------------------------------

    contract = db.session.get( Contract, contract_id)

    if not contract:

        return jsonify({
            "success": False,
            "message": "Contract not found."
        }), 404

    # --------------------------------------------------------
    # Check Legal User assignment
    # --------------------------------------------------------

    if not user_can_access_contract(   user_id,   contract_id ):

        return jsonify({
            "success": False,
            "message": "You are not assigned to this contract."
        }), 403

    # --------------------------------------------------------
    # Check version
    # --------------------------------------------------------

    version = db.session.get( ContractVersion, version_id)

    if not version:

        return jsonify({
            "success": False,
            "message": "Contract version not found."
        }), 404

    # Version must belong to selected contract
    if version.Contract_ID != contract_id:

        return jsonify({
            "success": False,
            "message": "Selected version does not belong to this contract."
        }), 400

    # --------------------------------------------------------
    # Modification should normally be against current version
    # --------------------------------------------------------

    if not version.Is_Current:

        return jsonify({
            "success": False,
            "message": "Modification can only be requested for the current version."
        }), 400

    # --------------------------------------------------------
    # Clause validation
    # --------------------------------------------------------

    clause = None

    if clause_id is not None:

        clause = db.session.get(  Clause,  clause_id )

        if not clause:

            return jsonify({
                "success": False,
                "message": "Clause not found."
            }), 404

        # Clause must belong to contract
        if clause.Contract_ID != contract_id:

            return jsonify({
                "success": False,
                "message": "Selected clause does not belong to this contract."
            }), 400

        # Clause must belong to selected version
        if clause.Version_ID != version_id:

            return jsonify({
                "success": False,
                "message": "Selected clause does not belong to this version."
            }), 400

    # --------------------------------------------------------
    # Create modification
    # --------------------------------------------------------

    modification = Modification(

        Contract_ID=contract_id,

        Clause_ID=clause_id,

        Version_ID=version_id,

        Modification_Type=data["Modification_Type"],

        Old_Text=data["Old_Text"],

        New_Text=data["New_Text"],

        Reason=data.get("Reason"),

        Status="PENDING",

        Modified_By=user_id
    )

    db.session.add(modification)

    db.session.commit()

    return jsonify({

        "success": True,

        "message": "Modification request created successfully.",

        "modification": {

            "Modification_ID":
                modification.Modification_ID,

            "Contract_ID":
                modification.Contract_ID,

            "Clause_ID":
                modification.Clause_ID,

            "Version_ID":
                modification.Version_ID,

            "Modification_Type":
                modification.Modification_Type,

            "Old_Text":
                modification.Old_Text,

            "New_Text":
                modification.New_Text,

            "Reason":
                modification.Reason,

            "Status":
                modification.Status,

            "Modified_By":
                modification.Modified_By,

            "Modified_At":
                modification.Modified_At
        }

    }), 201

# ============================================================
# GET MODIFICATION REQUESTS
# ============================================================

@modification_bp.route("", methods=["GET"])
@jwt_required()
def get_modifications():

    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    role_name = user.role.Role_Name

    # --------------------------------------------------------
    # Base query
    # --------------------------------------------------------

    query = Modification.query

    # --------------------------------------------------------
    # Legal User
    # Only see modifications created by themselves
    # --------------------------------------------------------

    if role_name == "Legal User":

        query = query.filter(
            Modification.Modified_By == user_id
        )

    # --------------------------------------------------------
    # Other authorized roles
    # Admin / Contract Manager / Approver
    # --------------------------------------------------------

    elif role_name in [
        "Admin",
        "Contract Manager",
        "Approver"
    ]:

        pass

    else:

        return jsonify({
            "success": False,
            "message": "You are not authorized to view modification requests."
        }), 403

    # --------------------------------------------------------
    # Optional Contract filter
    # --------------------------------------------------------

    contract_id = request.args.get(
        "contract_id",
        type=int
    )

    if contract_id:

        query = query.filter(
            Modification.Contract_ID == contract_id
        )

    # --------------------------------------------------------
    # Optional Status filter
    # --------------------------------------------------------

    status = request.args.get("status")

    if status:

        status = status.upper()

        if status not in [
            "PENDING",
            "APPROVED",
            "REJECTED"
        ]:

            return jsonify({
                "success": False,
                "message": "Invalid modification status."
            }), 400

        query = query.filter(
            Modification.Status == status
        )

    # --------------------------------------------------------
    # Get modifications
    # --------------------------------------------------------

    modifications = (
        query
        .order_by(
            Modification.Modified_At.desc()
        )
        .all()
    )

    result = []

    for modification in modifications:

        result.append({

            "Modification_ID":
                modification.Modification_ID,

            "Contract_ID":
                modification.Contract_ID,

            "Contract_Name":
                modification.contract.Contract_Name
                if modification.contract
                else None,

            "Clause_ID":
                modification.Clause_ID,

            "Clause_Number":
                modification.clause.Clause_Number
                if modification.clause
                else None,

            "Clause_Title":
                modification.clause.Clause_Title
                if modification.clause
                else None,

            "Version_ID":
                modification.Version_ID,

            "Modification_Type":
                modification.Modification_Type,

            "Old_Text":
                modification.Old_Text,

            "New_Text":
                modification.New_Text,

            "Reason":
                modification.Reason,

            "Status":
                modification.Status,

            "Modified_By":
                modification.Modified_By,

            "Modified_By_Name":
                modification.modifier.Name
                if modification.modifier
                else None,

            "Modified_At":
                modification.Modified_At,

            "Reviewed_By":
                modification.Reviewed_By,

            "Reviewed_By_Name":
                modification.reviewer.Name
                if modification.reviewer
                else None,

            "Reviewed_At":
                modification.Reviewed_At,

            "Review_Comment":
                modification.Review_Comment
        })

    return jsonify({

        "success": True,

        "count": len(result),

        "modifications": result

    }), 200


# ============================================================
# GET SINGLE MODIFICATION REQUEST
# ============================================================

@modification_bp.route("/<int:modification_id>", methods=["GET"])
@jwt_required()
def get_modification(modification_id):

    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    role_name = user.role.Role_Name if user.role else None

    # --------------------------------------------------------
    # Get modification
    # --------------------------------------------------------

    modification = db.session.get(
        Modification,
        modification_id
    )

    if not modification:
        return jsonify({
            "success": False,
            "message": "Modification request not found."
        }), 404

    # --------------------------------------------------------
    # Authorization
    # --------------------------------------------------------

    # Legal User can view only their own modification request
    if role_name == "Legal User":

        if modification.Modified_By != user_id:
            return jsonify({
                "success": False,
                "message": "You are not authorized to view this modification request."
            }), 403

    elif role_name in [
        "Admin",
        "Contract Manager",
        "Approver"
    ]:
        pass

    else:
        return jsonify({
            "success": False,
            "message": "You are not authorized to view modification requests."
        }), 403

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return jsonify({
        "success": True,
        "modification": {

            "Modification_ID":
                modification.Modification_ID,

            "Contract_ID":
                modification.Contract_ID,

            "Contract_Name":
                modification.contract.Contract_Name
                if modification.contract
                else None,

            "Clause_ID":
                modification.Clause_ID,

            "Clause_Number":
                modification.clause.Clause_Number
                if modification.clause
                else None,

            "Clause_Title":
                modification.clause.Clause_Title
                if modification.clause
                else None,

            "Version_ID":
                modification.Version_ID,

            "Modification_Type":
                modification.Modification_Type,

            "Old_Text":
                modification.Old_Text,

            "New_Text":
                modification.New_Text,

            "Reason":
                modification.Reason,

            "Status":
                modification.Status,

            "Modified_By":
                modification.Modified_By,

            "Modified_By_Name":
                modification.modifier.Name
                if modification.modifier
                else None,

            "Modified_At":
                modification.Modified_At,

            "Reviewed_By":
                modification.Reviewed_By,

            "Reviewed_By_Name":
                modification.reviewer.Name
                if modification.reviewer
                else None,

            "Reviewed_At":
                modification.Reviewed_At,

            "Review_Comment":
                modification.Review_Comment
        }
    }), 200


# ============================================================
# APPROVE / REJECT MODIFICATION REQUEST
# ============================================================

@modification_bp.route( "/<int:modification_id>/review",methods=["PUT"])
@jwt_required()
def review_modification(modification_id):

    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    # --------------------------------------------------------
    # Only Approver can review
    # --------------------------------------------------------

    if not user.role or user.role.Role_Name != "Approver":

        return jsonify({
            "success": False,
            "message": "Only Approver can approve or reject modification requests."
        }), 403

    # --------------------------------------------------------
    # Get modification
    # --------------------------------------------------------

    modification = db.session.get(
        Modification,
        modification_id
    )

    if not modification:

        return jsonify({
            "success": False,
            "message": "Modification request not found."
        }), 404

    # --------------------------------------------------------
    # Only PENDING modification can be reviewed
    # --------------------------------------------------------

    if modification.Status != "PENDING":

        return jsonify({
            "success": False,
            "message": (
                "This modification request has already been reviewed."
            )
        }), 400

    # --------------------------------------------------------
    # Validate request body
    # --------------------------------------------------------

    schema = ModificationReviewSchema()

    try:

        data = schema.load(
            request.get_json() or {}
        )

    except ValidationError as err:

        return jsonify({
            "success": False,
            "message": "Validation error.",
            "errors": err.messages
        }), 400

    status = data["Status"]
    review_comment = data.get("Review_Comment")

    # --------------------------------------------------------
    # Update modification
    # --------------------------------------------------------

    modification.Status = status

    modification.Reviewed_By = user_id

    modification.Reviewed_At = datetime.utcnow()

    modification.Review_Comment = review_comment

    db.session.commit()

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return jsonify({

        "success": True,

        "message": (
            "Modification request approved successfully."
            if status == "APPROVED"
            else "Modification request rejected successfully."
        ),

        "modification": {

            "Modification_ID":
                modification.Modification_ID,

            "Contract_ID":
                modification.Contract_ID,

            "Clause_ID":
                modification.Clause_ID,

            "Version_ID":
                modification.Version_ID,

            "Modification_Type":
                modification.Modification_Type,

            "Old_Text":
                modification.Old_Text,

            "New_Text":
                modification.New_Text,

            "Reason":
                modification.Reason,

            "Status":
                modification.Status,

            "Modified_By":
                modification.Modified_By,

            "Modified_At":
                modification.Modified_At,

            "Reviewed_By":
                modification.Reviewed_By,

            "Reviewed_At":
                modification.Reviewed_At,

            "Review_Comment":
                modification.Review_Comment
        }

    }), 200


# ============================================================
# APPLY APPROVED MODIFICATION
# ============================================================

@modification_bp.route(  "/<int:modification_id>/apply",  methods=["POST"])
@jwt_required()
def apply_modification(modification_id):

    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    # --------------------------------------------------------
    # Only Contract Manager can apply modification
    # --------------------------------------------------------

    if not user.role or user.role.Role_Name != "Contract Manager":

        return jsonify({
            "success": False,
            "message": "Only Contract Manager can apply approved modifications."
        }), 403

    # --------------------------------------------------------
    # Get modification
    # --------------------------------------------------------

    modification = db.session.get(  Modification,  modification_id)

    if not modification:

        return jsonify({
            "success": False,
            "message": "Modification request not found."
        }), 404

    # --------------------------------------------------------
    # Modification must be APPROVED
    # --------------------------------------------------------

    if modification.Status != "APPROVED":

        return jsonify({
            "success": False,
            "message": "Only approved modifications can be applied."
        }), 400

    # --------------------------------------------------------
    # Get contract
    # --------------------------------------------------------

    contract = db.session.get( Contract, modification.Contract_ID)

    if not contract:

        return jsonify({
            "success": False,
            "message": "Contract not found."
        }), 404

    # --------------------------------------------------------
    # Get current version
    # --------------------------------------------------------

    current_version = (
        ContractVersion.query
        .filter_by(
            Contract_ID=contract.Contract_ID,
            Is_Current=True
        )
        .first()
    )

    if not current_version:

        return jsonify({
            "success": False,
            "message": "Current contract version not found."
        }), 404

    # --------------------------------------------------------
    # Prevent applying an old modification
    # --------------------------------------------------------

    if modification.Version_ID != current_version.Version_ID:

        return jsonify({
            "success": False,
            "message": (
                "This modification belongs to an older contract version "
                "and cannot be applied."
            )
        }), 400

    # --------------------------------------------------------
    # Get source document
    # --------------------------------------------------------

    current_document = db.session.get(
        Document,
        current_version.Document_ID
    )

    if not current_document:

        return jsonify({
            "success": False,
            "message": "Current document not found."
        }), 404

    # --------------------------------------------------------
    # Calculate next version number
    # --------------------------------------------------------

    last_version = (
        ContractVersion.query
        .filter_by(
            Contract_ID=contract.Contract_ID
        )
        .order_by(
            ContractVersion.Version_Number.desc()
        )
        .first()
    )

    next_version_number = (
        last_version.Version_Number + 1
        if last_version
        else 1
    )

    # --------------------------------------------------------
    # Create new document
    # --------------------------------------------------------

    new_document = Document(
        Contract_ID=contract.Contract_ID,
        Document_Name=current_document.Document_Name,
        File_Path=current_document.File_Path,
        Document_Type=current_document.Document_Type,
        Status="Active",
        Created_By=user_id
    )

    db.session.add(new_document)

    db.session.flush()

    # --------------------------------------------------------
    # Mark old version as not current
    # --------------------------------------------------------

    current_version.Is_Current = False

    # --------------------------------------------------------
    # Create new contract version
    # --------------------------------------------------------

    new_version = ContractVersion(
        Contract_ID=contract.Contract_ID,
        Document_ID=new_document.Document_ID,
        Version_Number=next_version_number,
        File_Path=current_document.File_Path,
        Change_Summary=(
            f"Modification #{modification.Modification_ID} applied."
        ),
        Created_By=user_id,
        Is_Current=True
    )

    db.session.add(new_version)

    db.session.flush()

    # --------------------------------------------------------
    # Copy existing clauses to new version
    # --------------------------------------------------------

    current_clauses = (
        Clause.query
        .filter_by(
            Version_ID=current_version.Version_ID
        )
        .order_by(
            Clause.Clause_Number.asc()
        )
        .all()
    )

    for old_clause in current_clauses:

        new_clause_text = old_clause.Clause_Text

        # Apply clause modification
        if (
            modification.Modification_Type == "Clause"
            and modification.Clause_ID == old_clause.Clause_ID
        ):
            new_clause_text = modification.New_Text

        new_clause = Clause(
            Contract_ID=contract.Contract_ID,
            Version_ID=new_version.Version_ID,
            Clause_Number=old_clause.Clause_Number,
            Clause_Title=old_clause.Clause_Title,
            Clause_Text=new_clause_text,
            Created_By=user_id
        )

        db.session.add(new_clause)

    # --------------------------------------------------------
    # Contract-level modification
    # --------------------------------------------------------

    # For a whole-contract modification, the actual contract
    # fields should be updated according to the business rule.
    #
    # Since Old_Text/New_Text are generic text fields, we do not
    # overwrite Contract_Name, Party_A, Party_B, dates, etc.
    #
    # The new version records that the modification was applied.
    # --------------------------------------------------------

    # --------------------------------------------------------
    # Mark modification as applied
    # --------------------------------------------------------

    modification.Status = "APPLIED"

    # --------------------------------------------------------
    # Commit everything
    # --------------------------------------------------------

    db.session.commit()

    return jsonify({

        "success": True,

        "message": (
            "Approved modification applied successfully "
            "and new contract version created."
        ),

        "modification": {
            "Modification_ID":
                modification.Modification_ID,

            "Status":
                modification.Status
        },

        "new_version": {
            "Version_ID":
                new_version.Version_ID,

            "Version_Number":
                new_version.Version_Number,

            "Is_Current":
                new_version.Is_Current,

            "Change_Summary":
                new_version.Change_Summary
        }

    }), 200



# ============================================================
# GET MODIFICATION COMPARISON
# ============================================================

@modification_bp.route(  "/<int:modification_id>/comparison",   methods=["GET"])
@jwt_required()
def compare_modification(modification_id):

    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    role_name = user.role.Role_Name if user.role else None

    # --------------------------------------------------------
    # Get modification
    # --------------------------------------------------------

    modification = db.session.get(
        Modification,
        modification_id
    )

    if not modification:
        return jsonify({
            "success": False,
            "message": "Modification request not found."
        }), 404

    # --------------------------------------------------------
    # Authorization
    # --------------------------------------------------------

    # Legal User → only own modification
    if role_name == "Legal User":

        if modification.Modified_By != user_id:
            return jsonify({
                "success": False,
                "message": (
                    "You are not authorized to view "
                    "this modification."
                )
            }), 403

    elif role_name in [
        "Admin",
        "Contract Manager",
        "Approver"
    ]:
        pass

    else:
        return jsonify({
            "success": False,
            "message": (
                "You are not authorized to view "
                "modification comparisons."
            )
        }), 403

    # --------------------------------------------------------
    # Contract
    # --------------------------------------------------------

    contract = db.session.get(  Contract,  modification.Contract_ID )

    if not contract:
        return jsonify({
            "success": False,
            "message": "Contract not found."
        }), 404

    # --------------------------------------------------------
    # Version
    # --------------------------------------------------------

    version = db.session.get(
        ContractVersion,
        modification.Version_ID
    )

    if not version:
        return jsonify({
            "success": False,
            "message": "Contract version not found."
        }), 404

    # --------------------------------------------------------
    # Clause
    # --------------------------------------------------------

    clause_data = None

    if modification.Clause_ID:

        clause = db.session.get(
            Clause,
            modification.Clause_ID
        )

        if clause:

            clause_data = {
                "Clause_ID":
                    clause.Clause_ID,

                "Clause_Number":
                    clause.Clause_Number,

                "Clause_Title":
                    clause.Clause_Title
            }

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return jsonify({

        "success": True,

        "comparison": {

            "Modification_ID":
                modification.Modification_ID,

            "Modification_Type":
                modification.Modification_Type,

            "Status":
                modification.Status,

            "Contract": {

                "Contract_ID":
                    contract.Contract_ID,

                "Contract_Name":
                    contract.Contract_Name
            },

            "Version": {

                "Version_ID":
                    version.Version_ID,

                "Version_Number":
                    version.Version_Number,

                "Is_Current":
                    version.Is_Current
            },

            "Clause":
                clause_data,

            "Original": {

                "value":
                    modification.Old_Text
            },

            "Proposed": {

                "value":
                    modification.New_Text
            },

            "Reason":
                modification.Reason,

            "Modified_By":
                modification.Modified_By,

            "Modified_By_Name":
                modification.modifier.Name
                if modification.modifier
                else None,

            "Modified_At":
                modification.Modified_At,

            "Reviewed_By":
                modification.Reviewed_By,

            "Reviewed_By_Name":
                modification.reviewer.Name
                if modification.reviewer
                else None,

            "Reviewed_At":
                modification.Reviewed_At,

            "Review_Comment":
                modification.Review_Comment
        }

    }), 200


# ============================================================
# DELETE / CANCEL MODIFICATION REQUEST
# ============================================================

@modification_bp.route( "/<int:modification_id>", methods=["DELETE"])
@jwt_required()
def delete_modification(modification_id):

    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    # --------------------------------------------------------
    # Only Legal User can cancel their own request
    # --------------------------------------------------------

    if not user.role or user.role.Role_Name != "Legal User":

        return jsonify({
            "success": False,
            "message": (
                "Only Legal User can cancel "
                "modification requests."
            )
        }), 403

    # --------------------------------------------------------
    # Get modification
    # --------------------------------------------------------

    modification = db.session.get(
        Modification,
        modification_id
    )

    if not modification:

        return jsonify({
            "success": False,
            "message": "Modification request not found."
        }), 404

    # --------------------------------------------------------
    # Only owner can cancel
    # --------------------------------------------------------

    if modification.Modified_By != user_id:

        return jsonify({
            "success": False,
            "message": (
                "You can only cancel your own "
                "modification requests."
            )
        }), 403

    # --------------------------------------------------------
    # Only PENDING request can be cancelled
    # --------------------------------------------------------

    if modification.Status != "PENDING":

        return jsonify({
            "success": False,
            "message": (
                "Only pending modification requests "
                "can be cancelled."
            )
        }), 400

    # --------------------------------------------------------
    # Delete modification
    # --------------------------------------------------------

    db.session.delete(modification)

    db.session.commit()

    return jsonify({
        "success": True,
        "message": (
            "Modification request cancelled successfully."
        )
    }), 200