from flask import Blueprint, render_template, request, jsonify
from marshmallow import ValidationError

from routes.auth import roles_required

from config import db
from models import ContractType
from schemas import ContractTypeSchema


contract_type_schema = ContractTypeSchema()
contract_types_schema = ContractTypeSchema(many=True)


contract_type_bp = Blueprint(
    "contract_type",
    __name__,
    url_prefix="/contract-types"
)


# ---------------------- Contract Types PAGE ----------------------

@contract_type_bp.route("/contract-types-page", methods=["GET"])
def contract_types_page():
    return render_template("contract_types.html")


# ---------------------- CREATE CONTRACT TYPE ----------------------

@contract_type_bp.route("", methods=["POST"])
@roles_required("Admin")
def create_contract_type():

    try:

        data = contract_type_schema.load(
            request.get_json()
        )

    except ValidationError as error:

        return jsonify({
            "message": "Validation error",
            "errors": error.messages
        }), 400


    existing_type = ContractType.query.filter_by(
        Contract_Type_Name=data["Contract_Type_Name"]
    ).first()


    if existing_type:

        return jsonify({
            "message": "Contract type already exists"
        }), 409


    contract_type = ContractType(
        Contract_Type_Name=data["Contract_Type_Name"],
        Description=data.get("Description")
    )


    db.session.add(contract_type)
    db.session.commit()


    return jsonify({
        "message": "Contract type created successfully",
        "contract_type": contract_type_schema.dump(
            contract_type
        )
    }), 201


# ---------------------- GET ALL CONTRACT TYPES ----------------------

@contract_type_bp.route("", methods=["GET"])
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def get_all_contract_types():

    contract_types = ContractType.query.order_by(
        ContractType.Contract_Type_ID.asc()
    ).all()


    return jsonify({
        "contract_types": contract_types_schema.dump(
            contract_types
        )
    }), 200


# ---------------------- GET SINGLE CONTRACT TYPE ----------------------

@contract_type_bp.route(
    "/<int:contract_type_id>",
    methods=["GET"]
)
@roles_required(
    "Admin",
    "Legal User",
    "Reviewer",
    "Approver"
)
def get_contract_type(contract_type_id):

    contract_type = db.session.get(
        ContractType,
        contract_type_id
    )


    if not contract_type:

        return jsonify({
            "message": "Contract type not found"
        }), 404


    return jsonify({
        "contract_type": contract_type_schema.dump(
            contract_type
        )
    }), 200


# ---------------------- UPDATE CONTRACT TYPE ----------------------

@contract_type_bp.route(
    "/<int:contract_type_id>",
    methods=["PUT"]
)
@roles_required("Admin")
def update_contract_type(contract_type_id):

    contract_type = db.session.get(
        ContractType,
        contract_type_id
    )


    if not contract_type:

        return jsonify({
            "message": "Contract type not found"
        }), 404


    try:

        data = contract_type_schema.load(
            request.get_json(),
            partial=True
        )

    except ValidationError as error:

        return jsonify({
            "message": "Validation error",
            "errors": error.messages
        }), 400


    if "Contract_Type_Name" in data:

        existing_type = ContractType.query.filter(
            ContractType.Contract_Type_Name ==
            data["Contract_Type_Name"],
            ContractType.Contract_Type_ID !=
            contract_type_id
        ).first()


        if existing_type:

            return jsonify({
                "message": "Contract type already exists"
            }), 409


        contract_type.Contract_Type_Name = \
            data["Contract_Type_Name"]


    if "Description" in data:

        contract_type.Description = \
            data["Description"]


    db.session.commit()


    return jsonify({
        "message": "Contract type updated successfully",
        "contract_type": contract_type_schema.dump(
            contract_type
        )
    }), 200


# ---------------------- DELETE CONTRACT TYPE ----------------------

@contract_type_bp.route(
    "/<int:contract_type_id>",
    methods=["DELETE"]
)
@roles_required("Admin")
def delete_contract_type(contract_type_id):

    contract_type = db.session.get(
        ContractType,
        contract_type_id
    )


    if not contract_type:

        return jsonify({
            "message": "Contract type not found"
        }), 404


    db.session.delete(contract_type)
    db.session.commit()


    return jsonify({
        "message": "Contract type deleted successfully"
    }), 200