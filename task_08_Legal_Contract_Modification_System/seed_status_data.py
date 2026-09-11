from app import app
from config import db
from models import ContractStatus


def seed_contract_statuses():

    statuses = [
        {
            "Status_Name": "Draft",
            "Description": "Contract is being prepared"
        },
        {
            "Status_Name": "Active",
            "Description": "Contract is currently active"
        },
        {
            "Status_Name": "Expired",
            "Description": "Contract has reached its expiry date"
        },
        {
            "Status_Name": "Terminated",
            "Description": "Contract has been terminated"
        }
    ]

    for status_data in statuses:

        existing_status = ContractStatus.query.filter_by(
            Status_Name=status_data["Status_Name"]
        ).first()

        if not existing_status:

            status = ContractStatus(
                Status_Name=status_data["Status_Name"],
                Description=status_data["Description"]
            )

            db.session.add(status)

    db.session.commit()

    print("Contract statuses seeded successfully.")


if __name__ == "__main__":

    with app.app_context():
        seed_contract_statuses()