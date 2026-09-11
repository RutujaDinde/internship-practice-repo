from flask import Blueprint, jsonify

from config import db
from models import ContractStatus
from routes.auth import roles_required
from schemas import ContractStatusSchema


contract_status_bp = Blueprint(  "contract_status",  __name__,  url_prefix="/contract-statuses")

contract_statuses_schema = ContractStatusSchema(many=True)


@contract_status_bp.route("", methods=["GET"])
@roles_required(
    "Admin",
    "Legal User",
    "Contract Manager",
    "Approver"
)
def get_contract_statuses():

    statuses = ContractStatus.query.order_by(
        ContractStatus.Status_ID.asc()
    ).all()

    return jsonify({
        "statuses": contract_statuses_schema.dump(statuses)
    }), 200