from app import app
from config import db
from models import Role, User
from werkzeug.security import generate_password_hash


def seed_initial_data():

    # ---------------- ADMIN ROLE ----------------

    admin_role = Role.query.filter_by(
        Role_Name="Admin"
    ).first()

    if not admin_role:
        admin_role = Role(
            Role_Name="Admin",
            Description="System administrator"
        )

        db.session.add(admin_role)
        db.session.flush()

        print("Admin role created.")
    else:
        print("Admin role already exists.")


    # ---------------- FIRST ADMIN USER ----------------

    admin_user = User.query.filter_by(
        Email="admin@example.com"
    ).first()

    if not admin_user:

        admin_user = User(
            Name="Admin",
            Email="admin@example.com",
            Password=generate_password_hash("Admin@123"),
            Phone_No="9999999999",
            Status="Active",
            Role_ID=admin_role.Role_ID
        )

        db.session.add(admin_user)

        print("First Admin user created.")

    else:
        print("Admin user already exists.")


    db.session.commit()

    print("Initial data seeded successfully.")


if __name__ == "__main__":
    with app.app_context():
        seed_initial_data()